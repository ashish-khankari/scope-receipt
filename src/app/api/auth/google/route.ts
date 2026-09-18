import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { signAuthToken, AUTH_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name, googleId } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required for Google Sign-In' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const displayName = name?.trim() || normalizedEmail.split('@')[0];
    const gid = googleId || `gid_${Date.now()}`;

    // Check if user already exists
    const existing = await query<any[]>(
      'SELECT id, name, email, credits FROM users WHERE email = ? OR google_id = ?',
      [normalizedEmail, gid]
    );

    let userId: string;
    let credits = 0;
    let userName = displayName;

    if (existing && existing.length > 0) {
      userId = existing[0].id;
      credits = Number(existing[0].credits || 0);
      userName = existing[0].name;

      // Update google_id if missing
      await query('UPDATE users SET google_id = COALESCE(google_id, ?) WHERE id = ?', [gid, userId]);
    } else {
      // Create new user via Google with 1 free credit
      userId = `usr_g_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
      credits = 1;
      await query(
        `INSERT INTO users (id, name, email, google_id, credits, created_at)
         VALUES (?, ?, ?, ?, 1, NOW())`,
        [userId, displayName, normalizedEmail, gid]
      );

      const welcomeTxId = `tx_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
      try {
        await query(
          `INSERT INTO credit_transactions 
           (id, user_id, type, credits, stripe_checkout_session_id, stripe_payment_intent_id, receipt_id, created_at)
           VALUES (?, ?, 'purchase', 1, 'free_welcome_credit', 'free_welcome', NULL, NOW())`,
          [welcomeTxId, userId]
        );
      } catch (e) {
        console.warn('Could not record welcome credit tx', e);
      }
    }

    const token = signAuthToken({
      userId,
      email: normalizedEmail,
      name: userName,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: userId,
        name: userName,
        email: normalizedEmail,
        credits,
      },
    });

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    console.error('[Google Auth API Error]:', err);
    return NextResponse.json({ error: 'Failed to authenticate with Google' }, { status: 500 });
  }
}
