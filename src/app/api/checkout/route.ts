import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { CREDIT_PRODUCTS, getDodoConfig, getDodoProductId, resolveProductKey } from '@/lib/dodo';

/**
 * Creates a Dodo hosted checkout session.
 *
 * SECURITY: this route NEVER grants credits. Credits are added exclusively by the
 * signature-verified Dodo webhook (/api/webhooks/dodo) after payment succeeds.
 */
export async function POST(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Please log in to purchase credits' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const productKey = resolveProductKey(body?.product);
    if (!productKey) {
      return NextResponse.json(
        { error: 'Invalid product tier. Must be "three_receipts" or "forty_nine_receipts"' },
        { status: 400 }
      );
    }

    // Live (production) vs test (preview/local) keys & product IDs are resolved in lib/dodo.ts
    const dodoConfig = getDodoConfig();
    const dodoProductId = getDodoProductId(productKey, dodoConfig);

    if (!dodoConfig.apiKey || !dodoProductId) {
      console.error(`[Dodo Payments] API key or product ID missing for ${dodoConfig.mode} mode.`);
      return NextResponse.json({ error: 'Payments are temporarily unavailable.' }, { status: 503 });
    }

    // Production uses the canonical app URL; preview/local return to their own origin
    const origin =
      (process.env.VERCEL_ENV === 'production'
        ? process.env.NEXT_PUBLIC_APP_URL || req.headers.get('origin')
        : req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL) ||
      'http://localhost:3000';

    const returnUrl = `${origin.replace(/\/$/, '')}/dashboard?tab=credits&status=success`;

    const dodoRes = await fetch(`${dodoConfig.baseUrl}/checkouts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${dodoConfig.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_cart: [{ product_id: dodoProductId, quantity: 1 }],
        customer: {
          email: user.email,
          name: user.name,
        },
        return_url: returnUrl,
        metadata: {
          userId: user.id,
          product: productKey,
          credits: String(CREDIT_PRODUCTS[productKey].credits),
        },
      }),
    });

    const dodoData = await dodoRes.json().catch(() => ({}));
    const checkoutUrl = dodoData.checkout_url || dodoData.url;

    if (!dodoRes.ok || !checkoutUrl) {
      console.error(`[Dodo Payments Error (${dodoConfig.mode})]:`, dodoRes.status, dodoData);
      return NextResponse.json({ error: 'Could not start checkout. Please try again.' }, { status: 502 });
    }

    return NextResponse.json({ success: true, checkoutUrl, mode: 'dodo' });
  } catch (err: any) {
    console.error('[Checkout API Error]:', err);
    return NextResponse.json({ error: 'Payment processing failed. Please try again.' }, { status: 500 });
  }
}
