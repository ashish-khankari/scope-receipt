import { NextResponse } from 'next/server';
import crypto from 'crypto';
import pool from '@/lib/db';
import {
  CREDIT_PRODUCTS,
  getDodoConfig,
  productKeyFromDodoId,
  resolveProductKey,
  verifyDodoWebhook,
  type CreditProductKey,
} from '@/lib/dodo';

// Raw body is required for signature verification
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const dodoConfig = getDodoConfig();

  // 1. Verify signature (Standard Webhooks). Production only accepts the LIVE secret,
  //    preview/local only accepts the TEST secret, so test events can never credit prod.
  if (!dodoConfig.webhookSecret) {
    console.error(`[Dodo Webhook] Webhook secret not configured for ${dodoConfig.mode} mode.`);
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const rawBody = await req.text();
  try {
    verifyDodoWebhook(rawBody, req.headers, dodoConfig.webhookSecret);
  } catch (err: any) {
    console.warn('[Dodo Webhook] Rejected:', err?.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  try {
    const event = JSON.parse(rawBody);
    const eventType: string | undefined = event.type;
    console.log(`[Dodo Webhook Received (${dodoConfig.mode})]:`, eventType);

    if (eventType !== 'payment.succeeded') {
      return NextResponse.json({ received: true });
    }

    const data = event.data || {};
    const metadata = data.metadata || {};
    const userId: string | undefined = metadata.userId;
    const paymentId: string | undefined = data.payment_id;

    if (!userId || !paymentId) {
      console.warn('[Dodo Webhook Warning]: Missing userId or payment_id.', { paymentId, userId });
      return NextResponse.json({ received: true, note: 'Missing userId or payment_id' });
    }

    // 2. Decide credits server-side: prefer the product actually paid for, fall back to our own metadata
    let productKey: CreditProductKey | null = null;
    const cart: any[] = Array.isArray(data.product_cart) ? data.product_cart : [];
    let quantity = 1;
    for (const item of cart) {
      const key = productKeyFromDodoId(item?.product_id, dodoConfig);
      if (key) {
        productKey = key;
        quantity = Math.max(1, Number(item?.quantity) || 1);
        break;
      }
    }
    if (!productKey) productKey = resolveProductKey(metadata.product);

    if (!productKey) {
      console.error('[Dodo Webhook Error]: Could not determine product for payment', paymentId);
      return NextResponse.json({ received: true, note: 'Unknown product' });
    }

    const creditsToAdd = CREDIT_PRODUCTS[productKey].credits * quantity;
    const amount =
      typeof data.total_amount === 'number' ? `${(data.total_amount / 100).toFixed(2)}${data.currency ? ` ${data.currency}` : ''}` : 'unknown';

    // 3. Idempotent fulfilment: deterministic primary key per payment means a
    //    duplicate/retried webhook fails on INSERT and never double-credits.
    const txId = `tx_dodo_${crypto.createHash('sha256').update(paymentId).digest('hex').slice(0, 40)}`;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      try {
        await conn.query(
          `INSERT INTO credit_transactions
           (id, user_id, type, credits, stripe_checkout_session_id, stripe_payment_intent_id, receipt_id, created_at)
           VALUES (?, ?, 'purchase', ?, ?, ?, NULL, NOW())`,
          [txId, userId, creditsToAdd, paymentId, `amt_${amount}`]
        );
      } catch (insertErr: any) {
        if (insertErr?.code === 'ER_DUP_ENTRY') {
          await conn.rollback();
          return NextResponse.json({ received: true, note: 'Already processed' });
        }
        throw insertErr;
      }

      const [result]: any = await conn.query('UPDATE users SET credits = credits + ? WHERE id = ?', [
        creditsToAdd,
        userId,
      ]);
      if (!result?.affectedRows) {
        throw new Error(`User ${userId} not found`);
      }

      await conn.commit();
      console.log(`[Dodo Webhook Success (${dodoConfig.mode})]: Credited ${creditsToAdd} to user ${userId}`);
    } catch (dbErr) {
      await conn.rollback();
      throw dbErr;
    } finally {
      conn.release();
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('[Dodo Webhook Error]:', err);
    // 500 makes Dodo retry later
    return NextResponse.json({ error: 'Webhook handling error' }, { status: 500 });
  }
}
