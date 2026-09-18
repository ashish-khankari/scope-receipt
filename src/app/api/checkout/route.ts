import { NextResponse } from 'next/server';
import pool, { query } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

// Server-side controlled product catalog (Never trust client for pricing or credit amounts)
const PRODUCT_CATALOG: Record<string, { credits: number; price: number; name: string }> = {
  three_receipts: {
    credits: 3,
    price: 1.0,
    name: '3 ScopeReceipt Credits ($1)',
  },
  forty_nine_receipts: {
    credits: 49,
    price: 10.0,
    name: '49 ScopeReceipt Credits ($10)',
  },
  twenty_nine_receipts: {
    credits: 29,
    price: 9.0,
    name: '29 ScopeReceipt Credits ($9)',
  },
  // Backward-compat aliases
  single_receipt: {
    credits: 3,
    price: 1.0,
    name: '3 ScopeReceipt Credits',
  },
  ten_receipts: {
    credits: 49,
    price: 10.0,
    name: '49 ScopeReceipt Credits',
  },
};

export async function POST(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Please log in to purchase credits' }, { status: 401 });
    }

    const body = await req.json();
    const { product, paymentReference } = body;

    const productConfig = PRODUCT_CATALOG[product];
    if (!productConfig) {
      return NextResponse.json(
        { error: 'Invalid product tier. Must be "three_receipts", "forty_nine_receipts", or "twenty_nine_receipts"' },
        { status: 400 }
      );
    }

    const creditsToAdd = productConfig.credits;
    const priceAmount = productConfig.price;
    const referenceId = paymentReference || `pay_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
    const txId = `tx_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;

    // Database connection for atomic transaction and idempotency enforcement
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Idempotency Check: check if referenceId already processed
      const [existingTx]: [any[], any] = await conn.query(
        'SELECT id FROM credit_transactions WHERE stripe_checkout_session_id = ?',
        [referenceId]
      );

      if (existingTx && existingTx.length > 0) {
        await conn.rollback();
        return NextResponse.json({
          success: true,
          message: 'Payment already fulfilled (Idempotent)',
          creditsAdded: 0,
          currentCredits: user.credits,
        });
      }

      // 2. Add credits to user account atomically
      await conn.query('UPDATE users SET credits = credits + ? WHERE id = ?', [creditsToAdd, user.id]);

      // 3. Record in credit_transactions ledger
      await conn.query(
        `INSERT INTO credit_transactions 
         (id, user_id, type, credits, stripe_checkout_session_id, stripe_payment_intent_id, receipt_id, created_at)
         VALUES (?, ?, 'purchase', ?, ?, ?, NULL, NOW())`,
        [txId, user.id, creditsToAdd, referenceId, `amt_${priceAmount}`]
      );

      // 4. Fetch updated user balance
      const [updatedUser]: [any[], any] = await conn.query(
        'SELECT credits FROM users WHERE id = ?',
        [user.id]
      );

      await conn.commit();

      const newBalance = updatedUser[0]?.credits ?? (user.credits + creditsToAdd);

      return NextResponse.json({
        success: true,
        message: `Successfully added ${creditsToAdd} credit${creditsToAdd > 1 ? 's' : ''}!`,
        product: productConfig.name,
        price: priceAmount,
        creditsAdded: creditsToAdd,
        newBalance,
        transactionId: txId,
      });
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }
  } catch (err: any) {
    console.error('[Checkout API Error]:', err);
    return NextResponse.json({ error: 'Payment processing failed. Please try again.' }, { status: 500 });
  }
}
