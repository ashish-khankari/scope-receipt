import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(
  req: Request,
  { params }: { params: { publicId: string } }
) {
  try {
    const { publicId } = params;
    const body = await req.json();

    if (!body.description?.trim()) {
      return NextResponse.json({ success: false, error: 'Description is required' }, { status: 400 });
    }

    const id = `cr_${Math.random().toString(36).slice(2, 9)}`;
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const status = body.status?.toUpperCase() || 'APPROVED';

    await query(
      `INSERT INTO change_requests 
      (id, receipt_public_id, description, additional_price, new_deadline, status, created_at, approved_at)
      VALUES (?, UPPER(?), ?, ?, ?, ?, ?, ?)`,
      [
        id,
        publicId,
        body.description.trim(),
        Number(body.additionalPrice) || 0,
        body.newDeadline || null,
        status,
        now,
        status === 'APPROVED' ? now : null,
      ]
    );

    // Update parent receipt status to reflect change request activity
    await query(
      `UPDATE receipts SET status = 'CHANGE_APPROVED' WHERE UPPER(public_id) = UPPER(?) AND status = 'LOCKED'`,
      [publicId]
    );

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error(`[API /api/receipts/${params.publicId}/change-requests POST error]:`, error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
