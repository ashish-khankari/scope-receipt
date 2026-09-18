import { NextResponse } from 'next/server';
import pool, { query } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import type { ScopeReceipt, ReceiptDraft, ChangeRequest } from '@/lib/scopeReceipt';

// GET /api/receipts - Fetch receipts for current freelancer
export async function GET(req: Request) {
  try {
    const user = await getAuthUser(req);
    
    let receiptsRaw: any[];
    if (user) {
      receiptsRaw = await query<any[]>(
        'SELECT * FROM receipts WHERE user_id = ? OR user_id IS NULL ORDER BY created_at DESC',
        [user.id]
      );
    } else {
      receiptsRaw = await query<any[]>(
        'SELECT * FROM receipts ORDER BY created_at DESC LIMIT 20'
      );
    }

    const changeRequestsRaw = await query<any[]>(
      'SELECT * FROM change_requests ORDER BY created_at ASC'
    );

    const receipts: ScopeReceipt[] = receiptsRaw.map((r) => {
      let notIncluded: string[] = [];
      try {
        notIncluded = typeof r.not_included === 'string' ? JSON.parse(r.not_included) : r.not_included;
      } catch {
        notIncluded = [];
      }

      const crs: ChangeRequest[] = changeRequestsRaw
        .filter((cr) => cr.receipt_public_id === r.public_id)
        .map((cr) => ({
          id: cr.id,
          description: cr.description,
          additionalPrice: Number(cr.additional_price),
          newDeadline: cr.new_deadline,
          status: cr.status,
          createdAt: cr.created_at ? new Date(cr.created_at).toISOString() : '',
          approvedAt: cr.approved_at ? new Date(cr.approved_at).toISOString() : undefined,
        }));

      return {
        id: r.id,
        publicId: r.public_id,
        userId: r.user_id,
        title: r.title,
        deliverable: r.deliverable,
        notIncluded,
        deadline: r.deadline,
        handoverMethod: r.handover_method,
        price: Number(r.price),
        currency: r.currency,
        freelancerName: r.freelancer_name,
        freelancerEmail: r.freelancer_email || undefined,
        clientName: r.client_name || undefined,
        clientEmail: r.client_email || undefined,
        status: r.status,
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
        lockedAt: r.locked_at ? new Date(r.locked_at).toISOString() : undefined,
        clientSignature: r.client_signature || undefined,
        changeRequests: crs,
      };
    });

    return NextResponse.json({ success: true, receipts });
  } catch (error: any) {
    console.error('[API /api/receipts GET error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/receipts - Create new receipt with atomic credit deduction (if non-draft)
export async function POST(req: Request) {
  try {
    const user = await getAuthUser(req);
    const body: ReceiptDraft & { status?: string } = await req.json();

    if (!body.deliverable?.trim() || !body.notIncluded?.trim() || !body.deadline || !body.price) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: deliverable, notIncluded, deadline, price' },
        { status: 400 }
      );
    }

    const isDraft = body.status?.toUpperCase() === 'DRAFT';
    const targetStatus = isDraft ? 'DRAFT' : 'AWAITING_CONFIRMATION';

    const id = `rcpt_${Math.random().toString(36).slice(2, 10)}`;
    const publicId = `SR-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const notIncluded = body.notIncluded
      .split('\n')
      .map((item) => item.replace(/^[-•*]\s*/, '').trim())
      .filter(Boolean);
    const title = body.title?.trim() || body.deliverable.split(/[.!?]/)[0]?.slice(0, 60).trim() || 'Scope Agreement';
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const freelancerName = user?.name || body.freelancerName?.trim() || 'Alex Chen';
    const freelancerEmail = user?.email || body.freelancerEmail?.trim() || null;
    const userId = user?.id || null;

    // If non-draft, enforce atomic credit consumption
    if (!isDraft) {
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Please log in to create and activate a receipt', needsAuth: true },
          { status: 401 }
        );
      }

      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();

        // 1. Lock user row to check and deduct credits atomically
        const [userRows]: [any[], any] = await conn.query(
          'SELECT credits FROM users WHERE id = ? FOR UPDATE',
          [user.id]
        );

        const currentCredits = Number(userRows[0]?.credits || 0);

        if (currentCredits < 1) {
          await conn.rollback();
          return NextResponse.json(
            {
              success: false,
              error: 'You need at least 1 credit to lock and share this ScopeReceipt.',
              needsCredits: true,
              currentCredits,
            },
            { status: 402 }
          );
        }

        // 2. Deduct 1 credit atomically
        await conn.query('UPDATE users SET credits = credits - 1 WHERE id = ?', [user.id]);

        // 3. Record in credit_transactions ledger
        const txId = `tx_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
        await conn.query(
          `INSERT INTO credit_transactions 
           (id, user_id, type, credits, receipt_id, created_at)
           VALUES (?, ?, 'receipt_created', -1, ?, NOW())`,
          [txId, user.id, publicId]
        );

        // 4. Insert receipt
        await conn.query(
          `INSERT INTO receipts 
          (id, public_id, user_id, title, deliverable, not_included, deadline, handover_method, price, currency, freelancer_name, freelancer_email, client_name, client_email, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            publicId,
            userId,
            title,
            body.deliverable.trim(),
            JSON.stringify(notIncluded),
            body.deadline,
            body.handoverMethod?.trim() || 'Direct Handover',
            Number(body.price) || 0,
            body.currency || 'USD',
            freelancerName,
            freelancerEmail,
            body.clientName?.trim() || null,
            body.clientEmail?.trim() || null,
            targetStatus,
            now,
          ]
        );

        await conn.commit();

        return NextResponse.json({
          success: true,
          publicId,
          creditsRemaining: currentCredits - 1,
          receipt: {
            id,
            publicId,
            userId,
            title,
            deliverable: body.deliverable.trim(),
            notIncluded,
            deadline: body.deadline,
            handoverMethod: body.handoverMethod?.trim() || 'Direct Handover',
            price: Number(body.price) || 0,
            currency: body.currency || 'USD',
            freelancerName,
            clientName: body.clientName?.trim() || undefined,
            clientEmail: body.clientEmail?.trim() || undefined,
            status: targetStatus,
            createdAt: new Date().toISOString(),
            changeRequests: [],
          },
        });
      } catch (txErr) {
        await conn.rollback();
        throw txErr;
      } finally {
        conn.release();
      }
    } else {
      // Draft mode: Free, no credits consumed
      await query(
        `INSERT INTO receipts 
        (id, public_id, user_id, title, deliverable, not_included, deadline, handover_method, price, currency, freelancer_name, freelancer_email, client_name, client_email, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          publicId,
          userId,
          title,
          body.deliverable.trim(),
          JSON.stringify(notIncluded),
          body.deadline,
          body.handoverMethod?.trim() || 'Direct Handover',
          Number(body.price) || 0,
          body.currency || 'USD',
          freelancerName,
          freelancerEmail,
          body.clientName?.trim() || null,
          body.clientEmail?.trim() || null,
          'DRAFT',
          now,
        ]
      );

      return NextResponse.json({
        success: true,
        publicId,
        isDraft: true,
        receipt: {
          id,
          publicId,
          userId,
          title,
          deliverable: body.deliverable.trim(),
          notIncluded,
          deadline: body.deadline,
          handoverMethod: body.handoverMethod?.trim() || 'Direct Handover',
          price: Number(body.price) || 0,
          currency: body.currency || 'USD',
          freelancerName,
          clientName: body.clientName?.trim() || undefined,
          clientEmail: body.clientEmail?.trim() || undefined,
          status: 'DRAFT',
          createdAt: new Date().toISOString(),
          changeRequests: [],
        },
      });
    }
  } catch (error: any) {
    console.error('[API /api/receipts POST error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
