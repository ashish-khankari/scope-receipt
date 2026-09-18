import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const transactions = await query<any[]>(
      `SELECT id, user_id, type, credits, stripe_checkout_session_id, stripe_payment_intent_id, receipt_id, created_at
       FROM credit_transactions
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [user.id]
    );

    return NextResponse.json({
      success: true,
      credits: user.credits,
      transactions: transactions.map((t) => ({
        id: t.id,
        type: t.type,
        credits: Number(t.credits),
        referenceId: t.stripe_checkout_session_id,
        receiptId: t.receipt_id,
        createdAt: t.created_at,
      })),
    });
  } catch (err: any) {
    console.error('[Ledger API Error]:', err);
    return NextResponse.json({ error: 'Failed to load credit ledger' }, { status: 500 });
  }
}
