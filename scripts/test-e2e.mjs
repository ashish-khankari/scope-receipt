import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('=== STARTING SCOPERECEIPT FULL-STACK VERIFICATION ===\n');

  let cookie = '';
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'Password123!';

  // 1. Register Freelancer
  console.log('[1/9] Testing Freelancer Registration...');
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Sarah Designer',
      email: testEmail,
      password: testPassword,
      confirmPassword: testPassword,
    }),
  });

  const regData = await regRes.json();
  console.log('Registration status:', regRes.status, regData);
  if (!regRes.ok || !regData.success) throw new Error('Registration failed');

  // Extract auth cookie
  const setCookie = regRes.headers.get('set-cookie');
  if (setCookie) {
    cookie = setCookie.split(';')[0];
  }

  // 2. Fetch Profile / Me
  console.log('\n[2/9] Testing /api/auth/me Profile...');
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Cookie: cookie },
  });
  const meData = await meRes.json();
  console.log('Me status:', meRes.status, 'User:', meData.user?.name, 'Credits:', meData.user?.credits);
  if (meData.user?.credits !== 1) throw new Error(`New user should start with 1 free credit, got ${meData.user?.credits}`);

  // 3. Purchase 3 Credits ($1 tier)
  console.log('\n[3/10] Testing Backend-Controlled Credit Purchase (three_receipts - $1)...');
  const paymentRef = `pay_test_${Date.now()}`;
  const buyRes = await fetch(`${BASE_URL}/api/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify({
      product: 'three_receipts',
      paymentReference: paymentRef,
    }),
  });
  const buyData = await buyRes.json();
  console.log('Purchase status:', buyRes.status, buyData);
  if (buyData.newBalance !== 4) throw new Error(`Expected 4 credits (1 free + 3 purchased), got ${buyData.newBalance}`);

  // 3b. Purchase 49 Credits ($10 tier)
  console.log('\n[4/10] Testing Backend-Controlled Credit Purchase (forty_nine_receipts - $10)...');
  const proPaymentRef = `pay_pro_${Date.now()}`;
  const proBuyRes = await fetch(`${BASE_URL}/api/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify({
      product: 'forty_nine_receipts',
      paymentReference: proPaymentRef,
    }),
  });
  const proBuyData = await proBuyRes.json();
  console.log('Pro Purchase status:', proBuyRes.status, proBuyData);
  if (proBuyData.newBalance !== 53) throw new Error(`Expected 53 credits (4 + 49 purchased), got ${proBuyData.newBalance}`);

  // 4. Test Idempotency (re-sending same paymentReference)
  console.log('\n[4/9] Testing Payment Idempotency (re-sending same reference)...');
  const dupBuyRes = await fetch(`${BASE_URL}/api/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify({
      product: 'three_receipts',
      paymentReference: paymentRef,
    }),
  });
  const dupBuyData = await dupBuyRes.json();
  console.log('Idempotent response:', dupBuyData);
  if (dupBuyData.creditsAdded !== 0) throw new Error('Duplicate payment should not add credits');

  // 5. Check Credit Ledger
  console.log('\n[5/9] Testing Credit Ledger Audit Log...');
  const ledgerRes = await fetch(`${BASE_URL}/api/ledger`, {
    headers: { Cookie: cookie },
  });
  const ledgerData = await ledgerRes.json();
  console.log('Ledger count:', ledgerData.transactions?.length, 'Latest:', ledgerData.transactions?.[0]);
  if (ledgerData.transactions.length === 0) throw new Error('Ledger should contain purchase entry');

  // 6. Create Activated ScopeReceipt (should atomically consume 1 credit)
  console.log('\n[6/9] Testing Receipt Creation & Atomic Credit Deduction...');
  const createRes = await fetch(`${BASE_URL}/api/receipts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify({
      deliverable: 'Custom Shopify theme with product customizer and mega-menu',
      notIncluded: 'Product photography\nCopywriting\nEmail Klaviyo flow setup',
      deadline: '2026-10-15',
      handoverMethod: 'Shopify Store Staff Access + Theme Archive',
      price: '1200',
      currency: 'USD',
      freelancerName: 'Sarah Designer',
      clientName: 'Apex Brands',
      clientEmail: 'contact@apexbrands.co',
      status: 'AWAITING_CONFIRMATION',
    }),
  });
  const createData = await createRes.json();
  console.log('Receipt created:', createRes.status, 'Public ID:', createData.publicId, 'Remaining credits:', createData.creditsRemaining);
  if (createData.creditsRemaining !== 52) throw new Error(`Expected 52 credits remaining, got ${createData.creditsRemaining}`);

  const publicId = createData.publicId;

  // 7. Client Scope Confirmation & Lock (ZERO account required)
  console.log(`\n[7/9] Testing Public Client Lock Action for ${publicId} (No auth cookie)...`);
  const lockRes = await fetch(`${BASE_URL}/api/receipts/${publicId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'LOCKED',
      clientSignature: 'Apex Brands CEO',
    }),
  });
  const lockData = await lockRes.json();
  console.log('Lock status:', lockRes.status, lockData);
  if (!lockData.success) throw new Error('Client lock failed');

  // 8. Test Immutability of Locked Scope
  console.log('\n[8/9] Testing Immutability of Locked Scope (attempting deliverable edit)...');
  const tamperRes = await fetch(`${BASE_URL}/api/receipts/${publicId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      deliverable: 'Tampered deliverable without client knowledge',
    }),
  });
  console.log('Tamper attempt status:', tamperRes.status, '(Expected 403 Forbidden)');
  if (tamperRes.status !== 403) throw new Error('Locked receipt must reject deliverable changes with 403');

  // 9. Add Change Request to Locked Receipt
  console.log('\n[9/9] Testing Change Request System...');
  const crRes = await fetch(`${BASE_URL}/api/receipts/${publicId}/change-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description: 'Add wholesale portal and B2B tiered discounts table',
      additionalPrice: 350,
      newDeadline: '2026-10-22',
      status: 'APPROVED',
    }),
  });
  const crData = await crRes.json();
  console.log('Change Request status:', crRes.status, crData);
  if (!crData.success) throw new Error('Change request failed');

  // Fetch finalized locked receipt to verify change request joined
  const finalRes = await fetch(`${BASE_URL}/api/receipts/${publicId}`);
  const finalData = await finalRes.json();
  console.log('\nFinal Verified Receipt State:', {
    publicId: finalData.receipt?.publicId,
    status: finalData.receipt?.status,
    originalPrice: finalData.receipt?.price,
    changeRequestsCount: finalData.receipt?.changeRequests?.length,
    additionalPrice: finalData.receipt?.changeRequests?.[0]?.additionalPrice,
  });

  console.log('\n=== ALL 9 VERIFICATION CHECKS PASSED PERFECTLY! ===\n');
}

runTests().catch((err) => {
  console.error('\nVerification failed:', err);
  process.exit(1);
});
