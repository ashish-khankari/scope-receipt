import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword, signAuthToken, AUTH_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, confirmPassword } = body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check for duplicate email
    const existing = await query<any[]>('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    // Hash password & generate user ID
    const passwordHash = await hashPassword(password);
    const userId = `usr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;

    // Create user with 1 free welcome credit
    await query(
      `INSERT INTO users (id, name, email, password_hash, credits, created_at)
       VALUES (?, ?, ?, ?, 1, NOW())`,
      [userId, name.trim(), normalizedEmail, passwordHash]
    );

    // Record welcome credit transaction
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

    // Sign JWT
    const token = signAuthToken({
      userId,
      email: normalizedEmail,
      name: name.trim(),
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: userId,
        name: name.trim(),
        email: normalizedEmail,
        credits: 1,
      },
    });

    // Set secure HTTP-only cookie
    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (err: any) {
    console.error('[Register API Error]:', err);
    return NextResponse.json({ error: 'Failed to create account. Please try again.' }, { status: 500 });
  }
}
