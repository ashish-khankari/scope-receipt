import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { ScopeReceipt, ChangeRequest } from '@/lib/scopeReceipt';

export async function GET(
  req: Request,
  { params }: { params: { publicId: string } }
) {
  try {
    const { publicId } = params;

    const rows = await query<any[]>(
      'SELECT * FROM receipts WHERE UPPER(public_id) = UPPER(?) LIMIT 1',
      [publicId]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Receipt not found' }, { status: 404 });
    }

    const r = rows[0];

    let notIncluded: string[] = [];
    try {
      notIncluded = typeof r.not_included === 'string' ? JSON.parse(r.not_included) : r.not_included;
    } catch {
      notIncluded = [];
    }

    const crRows = await query<any[]>(
      'SELECT * FROM change_requests WHERE UPPER(receipt_public_id) = UPPER(?) ORDER BY created_at ASC',
      [publicId]
    );

    const changeRequests: ChangeRequest[] = crRows.map((cr) => ({
      id: cr.id,
      description: cr.description,
      additionalPrice: Number(cr.additional_price),
      newDeadline: cr.new_deadline,
      status: cr.status,
      createdAt: cr.created_at ? new Date(cr.created_at).toISOString() : '',
      approvedAt: cr.approved_at ? new Date(cr.approved_at).toISOString() : undefined,
    }));

    const receipt: ScopeReceipt = {
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
      changeRequests,
    };

    return NextResponse.json({ success: true, receipt });
  } catch (error: any) {
    console.error(`[API /api/receipts/${params.publicId} GET error]:`, error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { publicId: string } }
) {
  try {
    const { publicId } = params;
    const body = await req.json();

    // Check existing receipt status
    const existing = await query<any[]>(
      'SELECT status FROM receipts WHERE UPPER(public_id) = UPPER(?) LIMIT 1',
      [publicId]
    );

    if (!existing || existing.length === 0) {
      return NextResponse.json({ success: false, error: 'Receipt not found' }, { status: 404 });
    }

    const currentStatus = String(existing[0].status).toUpperCase();

    // Enforce scope immutability if already LOCKED
    if (currentStatus === 'LOCKED') {
      const isAttemptingScopeEdit =
        body.deliverable !== undefined ||
        body.notIncluded !== undefined ||
        body.price !== undefined ||
        body.deadline !== undefined ||
        body.handoverMethod !== undefined;

      if (isAttemptingScopeEdit) {
        return NextResponse.json(
          {
            success: false,
            error: 'This receipt is LOCKED. Original scope, deliverables, and price are immutable. To make additions, please create a Change Request.',
          },
          { status: 403 }
        );
      }
    }

    // Client locking action: Lock in scope
    if (body.status?.toUpperCase() === 'LOCKED') {
      const signature = body.clientSignature?.trim() || 'Client Confirmed';
      await query(
        `UPDATE receipts 
         SET status = 'LOCKED', locked_at = NOW(), client_signature = ? 
         WHERE UPPER(public_id) = UPPER(?)`,
        [signature, publicId]
      );
      return NextResponse.json({ success: true, status: 'LOCKED' });
    }

    // Status transition or metadata update (if not locked)
    if (body.status) {
      const validStatuses = ['DRAFT', 'AWAITING_CONFIRMATION', 'LOCKED', 'CHANGE_REQUEST', 'CHANGE_APPROVED', 'CHANGE_DECLINED'];
      const nextStatus = body.status.toUpperCase();
      if (!validStatuses.includes(nextStatus)) {
        return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
      }

      await query(
        `UPDATE receipts SET status = ? WHERE UPPER(public_id) = UPPER(?)`,
        [nextStatus, publicId]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`[API /api/receipts/${params.publicId} PATCH error]:`, error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { publicId: string } }
) {
  try {
    const { publicId } = params;
    await query('DELETE FROM receipts WHERE UPPER(public_id) = UPPER(?)', [publicId]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`[API /api/receipts/${params.publicId} DELETE error]:`, error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
