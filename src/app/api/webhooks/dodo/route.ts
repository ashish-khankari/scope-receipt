import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const eventType = body.type || body.event_type || body.event;

    console.log('[Dodo Webhook Received]:', eventType);

    // Dodo sends payment.succeeded or checkout.session.completed
    if (eventType === 'payment.succeeded' || eventType === 'checkout.session.completed' || body.status === 'succeeded') {
      const data = body.data || body;
      const metadata = data.metadata || {};
      const userId = metadata.userId || data.customer?.metadata?.userId;
      const creditsToAdd = Number(metadata.credits) || (metadata.product === 'forty_nine_receipts' ? 49 : 3);
      const paymentId = data.payment_id || data.id || `dodo_${Date.now()}`;
      const amount = data.total_amount ? (data.total_amount / 100).toFixed(2) : (metadata.product === 'forty_nine_receipts' ? '10.00' : '1.00');

      if (!userId) {
        console.warn('[Dodo Webhook Warning]: No userId found in payment metadata.');
        return NextResponse.json({ received: true, note: 'No userId in metadata' });
      }

      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();

        // Check if already processed
        const [existing]: [any[], any] = await conn.query(
          'SELECT id FROM credit_transactions WHERE stripe_checkout_session_id = ?',
          [paymentId]
        );

        if (existing && existing.length > 0) {
          await conn.rollback();
          return NextResponse.json({ received: true, note: 'Already processed' });
        }

        // Add credits to user
        await conn.query('UPDATE users SET credits = credits + ? WHERE id = ?', [creditsToAdd, userId]);

        // Insert transaction ledger record
        const txId = `tx_dodo_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
        await conn.query(
          `INSERT INTO credit_transactions 
           (id, user_id, type, credits, stripe_checkout_session_id, stripe_payment_intent_id, receipt_id, created_at)
           VALUES (?, ?, 'purchase', ?, ?, ?, NULL, NOW())`,
          [txId, userId, creditsToAdd, paymentId, `amt_${amount}`]
        );

        await conn.commit();
        console.log(`[Dodo Webhook Success]: Credited ${creditsToAdd} to user ${userId}`);
      } catch (dbErr) {
        await conn.rollback();
        throw dbErr;
      } finally {
        conn.release();
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('[Dodo Webhook Error]:', err);
    return NextResponse.json({ error: 'Webhook handling error' }, { status: 500 });
  }
}
