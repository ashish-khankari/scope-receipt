import crypto from 'crypto';

/**
 * Dodo Payments environment configuration.
 *
 * Production (VERCEL_ENV=production)  -> LIVE mode, live API key + live product IDs
 * Preview / local dev                 -> TEST mode, test API key + test product IDs
 *
 * You can force a mode with DODO_MODE=live|test (e.g. to test live locally).
 */

export type DodoMode = 'live' | 'test';

/** Products we sell. Credits are ALWAYS decided server-side from this table. */
export type CreditProductKey = 'three_receipts' | 'forty_nine_receipts';

export const CREDIT_PRODUCTS: Record<CreditProductKey, { credits: number; name: string }> = {
  three_receipts: { credits: 3, name: '3 ScopeReceipt Credits' },
  forty_nine_receipts: { credits: 49, name: '49 ScopeReceipt Credits' },
};

/** Legacy client keys mapped onto real products. */
const PRODUCT_ALIASES: Record<string, CreditProductKey> = {
  single_receipt: 'three_receipts',
  ten_receipts: 'forty_nine_receipts',
};

export function resolveProductKey(product: unknown): CreditProductKey | null {
  if (typeof product !== 'string') return null;
  if (product in CREDIT_PRODUCTS) return product as CreditProductKey;
  return PRODUCT_ALIASES[product] ?? null;
}

export interface DodoConfig {
  mode: DodoMode;
  baseUrl: string;
  apiKey: string | undefined;
  webhookSecret: string | undefined;
  productIds: Record<CreditProductKey, string | undefined>;
}

export function getDodoMode(): DodoMode {
  const forced = process.env.DODO_MODE?.toLowerCase();
  if (forced === 'live' || forced === 'test') return forced;
  return process.env.VERCEL_ENV === 'production' ? 'live' : 'test';
}

export function getDodoConfig(): DodoConfig {
  const mode = getDodoMode();

  if (mode === 'live') {
    return {
      mode,
      baseUrl: 'https://live.dodopayments.com',
      apiKey: process.env.DODO_LIVE_API_KEY,
      webhookSecret: process.env.DODO_LIVE_WEBHOOK_SECRET,
      productIds: {
        three_receipts: process.env.DODO_LIVE_PRODUCT_ID_3 || 'pdt_0NpA0J7HP0rGJZi061V1l',
        forty_nine_receipts: process.env.DODO_LIVE_PRODUCT_ID_49 || 'pdt_0NpA04vsKVVYurckOBUuZ',
      },
    };
  }

  return {
    mode,
    baseUrl: 'https://test.dodopayments.com',
    // DODO_API_KEY kept as a fallback for backward compatibility
    apiKey: process.env.DODO_TEST_API_KEY || process.env.DODO_API_KEY,
    webhookSecret: process.env.DODO_TEST_WEBHOOK_SECRET,
    productIds: {
      three_receipts: process.env.DODO_TEST_PRODUCT_ID_3 || 'pdt_0NnwEA5xI28IF24dK75rZ',
      forty_nine_receipts: process.env.DODO_TEST_PRODUCT_ID_49 || 'pdt_0NnwBxO62Pt0pBh2A3ZUh',
    },
  };
}

/** Resolve the Dodo product ID for an internal product key. */
export function getDodoProductId(product: CreditProductKey, config: DodoConfig = getDodoConfig()) {
  return config.productIds[product];
}

/** Reverse lookup: which of our products does a Dodo product ID belong to (in the current mode)? */
export function productKeyFromDodoId(
  dodoProductId: unknown,
  config: DodoConfig = getDodoConfig()
): CreditProductKey | null {
  if (typeof dodoProductId !== 'string') return null;
  const entry = (Object.entries(config.productIds) as [CreditProductKey, string | undefined][]).find(
    ([, id]) => id === dodoProductId
  );
  return entry ? entry[0] : null;
}

const WEBHOOK_TOLERANCE_SECONDS = 5 * 60;

/**
 * Verify a Dodo webhook using the Standard Webhooks spec
 * (https://www.standardwebhooks.com). Throws if invalid.
 *
 * signed content = `${webhook-id}.${webhook-timestamp}.${rawBody}`
 * signature      = base64(HMAC-SHA256(base64decode(secret without "whsec_"), signed content))
 * header format  = "v1,<sig> v1,<sig2> ..."
 */
export function verifyDodoWebhook(rawBody: string, headers: Headers, secret: string): void {
  const id = headers.get('webhook-id');
  const timestamp = headers.get('webhook-timestamp');
  const signatureHeader = headers.get('webhook-signature');

  if (!id || !timestamp || !signatureHeader) {
    throw new Error('Missing webhook signature headers');
  }

  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > WEBHOOK_TOLERANCE_SECONDS) {
    throw new Error('Webhook timestamp outside tolerance');
  }

  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const expected = crypto
    .createHmac('sha256', key)
    .update(`${id}.${timestamp}.${rawBody}`)
    .digest();

  const valid = signatureHeader.split(' ').some((part) => {
    const [version, sig] = part.split(',');
    if (version !== 'v1' || !sig) return false;
    const received = Buffer.from(sig, 'base64');
    return received.length === expected.length && crypto.timingSafeEqual(received, expected);
  });

  if (!valid) throw new Error('Invalid webhook signature');
}
