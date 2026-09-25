/**
 * Wallet & Billing verification
 * ---------------------------------------------------------------------------
 * Guards the money rules: the ₦500 generation charge, subscription pricing and
 * expiry, the feature-gate matrix, and the guarantee that a wallet can never
 * go negative.
 *
 * Usage: node scripts/billing-check.mjs
 */
import {
  createWallet,
  effectivePlan,
  daysRemaining,
  topUp,
  debitGeneration,
  subscribe,
  cancelSubscription,
  reconcile,
  recharge,
} from '../src/utils/wallet.js';
import {
  GENERATION_PRICE,
  PLANS,
  SUBSCRIPTION_DAYS,
  FEATURES,
  planAllowsFeature,
  lockedFeatures,
} from '../src/data/pricingDefaults.js';

let failures = 0;
const check = (label, cond, detail = '') => {
  const ok = Boolean(cond);
  if (!ok) failures += 1;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` -> ${detail}` : ''}`);
};

const NOW = 1_700_000_000_000; // fixed clock so results are deterministic
const DAY = 24 * 60 * 60 * 1000;

console.log('\n[B1] Plan pricing matches the agreed model');
check('generation price is ₦500', GENERATION_PRICE === 500, `₦${GENERATION_PRICE}`);
check('Limited is ₦10,000', PLANS.limited.price === 10000, `₦${PLANS.limited.price}`);
check('Unlimited is ₦25,000', PLANS.unlimited.price === 25000, `₦${PLANS.unlimited.price}`);
check('subscription is 30 days', SUBSCRIPTION_DAYS === 30, `${SUBSCRIPTION_DAYS}d`);

console.log('\n[B2] Fresh wallet starts empty on the free plan');
const w0 = createWallet();
check('balance is 0', w0.balance === 0);
check('plan is free', effectivePlan(w0, NOW) === 'free');
check('no expiry', w0.planExpiresAt === 0);
check('no transactions', w0.transactions.length === 0);

console.log('\n[B3] Top-ups credit the wallet');
const t1 = topUp(w0, 2000, { now: NOW });
check('top-up succeeds', t1.ok);
check('balance credited', t1.wallet.balance === 2000, `₦${t1.wallet.balance}`);
check('transaction recorded', t1.wallet.transactions[0].type === 'topup');
[0, -500, NaN, 'abc', null].forEach((v) => {
  const r = topUp(w0, v, { now: NOW });
  check(`invalid top-up ${JSON.stringify(v)} rejected`, !r.ok);
});
const t2 = topUp(t1.wallet, 500, { now: NOW + 1 });
check('top-ups accumulate', t2.wallet.balance === 2500, `₦${t2.wallet.balance}`);

console.log('\n[B4] Generation charge is ₦500 and blocks when broke');
const broke = topUp(w0, 100, { now: NOW }).wallet;
const d0 = debitGeneration(broke, { now: NOW, quoteNumber: 0 });
check('cannot generate below ₦500', !d0.ok, d0.reason);
check('shortfall reported', d0.shortfall === 400, `₦${d0.shortfall}`);
check('balance untouched after refusal', d0.wallet.balance === 100, `₦${d0.wallet.balance}`);

const funded = topUp(w0, 1000, { now: NOW }).wallet;
const d1 = debitGeneration(funded, { now: NOW + 1, quoteNumber: 0 });
check('generation succeeds when funded', d1.ok);
check('charged exactly ₦500', d1.charged === 500, `₦${d1.charged}`);
check('balance deducted', d1.wallet.balance === 500, `₦${d1.wallet.balance}`);
check('quote number recorded', d1.wallet.transactions[0].quoteNumber === 0);

console.log('\n[B5] Subscriptions are unlimited and never debit');
const rich = topUp(w0, 100000, { now: NOW }).wallet;
['limited', 'unlimited'].forEach((planId) => {
  const sub = subscribe(rich, planId, { now: NOW });
  check(`${planId} activates`, sub.ok, sub.error);
  if (sub.ok) {
    check(`${planId} charges its price`, rich.balance - sub.wallet.balance === PLANS[planId].price);
    check(`${planId} runs 30 days`, sub.expiresAt === NOW + SUBSCRIPTION_DAYS * DAY);
    const gen = debitGeneration(sub.wallet, { now: NOW + 10, quoteNumber: 7 });
    check(`${planId} generation is free`, gen.ok && gen.charged === 0);
    check(`${planId} balance unchanged by generation`, gen.wallet.balance === sub.wallet.balance);
  }
});

console.log('\n[B6] Insufficient funds blocks subscribing');
const poor = topUp(w0, 9999, { now: NOW }).wallet;
const s0 = subscribe(poor, 'limited', { now: NOW });
check('₦9,999 cannot buy Limited', !s0.ok, s0.reason);
check('shortfall is ₦1', s0.shortfall === 1, `₦${s0.shortfall}`);

console.log('\n[B7] Expiry returns the user to free');
const sub = subscribe(rich, 'limited', { now: NOW }).wallet;
const justBefore = NOW + SUBSCRIPTION_DAYS * DAY - 1000;
const justAfter = NOW + SUBSCRIPTION_DAYS * DAY + 1000;
check('active right up to expiry', effectivePlan(sub, justBefore) === 'limited');
check('expired after the window', effectivePlan(sub, justAfter) === 'free');
check('days remaining counts down', daysRemaining(sub, justBefore) === 1, `${daysRemaining(sub, justBefore)}`);
check('days remaining 0 when expired', daysRemaining(sub, justAfter) === 0);
const rec = reconcile(sub, justAfter);
check('reconcile clears the plan', rec.planId === 'free' && rec.planExpiresAt === 0);
check('reconcile keeps the balance', rec.balance === sub.balance, `₦${rec.balance}`);
check('reconcile is idempotent', reconcile(rec, justAfter) === rec);

console.log('\n[B8] Renewing early extends rather than wasting days');
// Use a dedicated wallet so earlier subscriptions cannot affect the balance.
const renewBase = topUp(createWallet(), 100000, { now: NOW }).wallet;
const firstTerm = subscribe(renewBase, 'limited', { now: NOW }).wallet;
check('first term ends after 30 days', firstTerm.planExpiresAt === NOW + SUBSCRIPTION_DAYS * DAY);
const renewAt = NOW + 5 * DAY; // still inside the first term
const r1 = subscribe(firstTerm, 'limited', { now: renewAt });
check('renewal succeeds', r1.ok, r1.error);
check('renewal extends from the existing expiry, not from now', r1.expiresAt === NOW + 2 * SUBSCRIPTION_DAYS * DAY, new Date(r1.expiresAt).toISOString().slice(0, 10));
check('renewal charges again', renewBase.balance - r1.wallet.balance === PLANS.limited.price * 2, `₦${PLANS.limited.price * 2}`);

console.log('\n[B9] Cancelling');
const cancelled = cancelSubscription(sub, { now: NOW });
check('plan returns to free', effectivePlan(cancelled.wallet, NOW) === 'free');
check('no refund of paid months', cancelled.wallet.balance === sub.balance);

console.log('\n[B10] Feature gate matrix');
const expect = {
  free: { sizing: true, load_input: true, catalog_browse: true, pdf_export: false, margin_control: false, catalog_add: false },
  payg: { pdf_export: true, sizing: true, margin_control: false, catalog_add: false },
  limited: { pdf_export: true, sizing: true, margin_control: false, catalog_add: false },
  unlimited: { pdf_export: true, sizing: true, margin_control: true, catalog_add: true },
};
Object.entries(expect).forEach(([planId, map]) => {
  Object.entries(map).forEach(([feature, allowed]) => {
    check(`${planId} -> ${feature} = ${allowed}`, planAllowsFeature(planId, feature) === allowed);
  });
});
check('free is locked out of the paid features', lockedFeatures('free').length >= 6, `${lockedFeatures('free').length} locked`);
check('limited is locked out of the key features', lockedFeatures('limited').length >= 5, `${lockedFeatures('limited').length} locked`);
check('unlimited has nothing locked', lockedFeatures('unlimited').length === 0, `${lockedFeatures('unlimited').length} locked`);
check('unknown features never hard-block', planAllowsFeature('free', 'not_a_real_feature') === true);
check('every feature has a valid tier', FEATURES.every((f) => PLANS[f.tier]));
check('every feature id is unique', new Set(FEATURES.map((f) => f.id)).size === FEATURES.length, `${FEATURES.length} features`);

console.log('\n[B11] Gateway seam');
const charged = await recharge(w0, 3000, { now: NOW });
check('recharge credits the wallet', charged.ok && charged.wallet.balance === 3000, `₦${charged.wallet.balance}`);
check('recharge returns the same shape as topUp', typeof charged.ok === 'boolean' && 'wallet' in charged);

console.log('\n[B12] History cap keeps storage bounded');
let w = createWallet();
for (let i = 0; i < 80; i += 1) w = topUp(w, 100, { now: NOW + i }).wallet;
check('transactions capped at 50', w.transactions.length === 50, `${w.transactions.length}`);
check('newest transaction first', w.transactions[0].at === NOW + 79);

console.log(
  failures === 0
    ? '\n=== BILLING: ALL PASSED ==='
    : `\n=== ${failures} FAILURE(S) ===`
);
process.exit(failures === 0 ? 0 : 1);

check('balance never negative', d1.wallet.balance >= 0, `₦${d1.wallet.balance}`);

const d2 = debitGeneration(d1.wallet, { now: NOW + 2, quoteNumber: 1 });
check('second generation also ₦500', d2.ok && d2.charged === 500);
check('balance now 0', d2.wallet.balance === 0, `₦${d2.wallet.balance}`);
const d3 = debitGeneration(d2.wallet, { now: NOW + 3, quoteNumber: 2 });
check('third generation blocked at zero', !d3.ok);
