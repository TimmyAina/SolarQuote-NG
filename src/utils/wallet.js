/**
 * Wallet & Payment Provider
 * ---------------------------------------------------------------------------
 * Today the wallet is local: balances and subscriptions live in localStorage and
 * the recharge adapter credits instantly. A Paystack adapter with the SAME
 * signature sits alongside it, so switching on real payments later is a config
 * change rather than a rework of the screens.
 *
 * The provider is deliberately pure/deterministic: it takes a state and returns
 * a NEW state plus a result. No React, no storage side effects. AppContext owns
 * persistence; this file owns the money rules. That split is what makes the
 * billing behaviour testable in plain Node.
 */
import { GENERATION_PRICE, PLANS, SUBSCRIPTION_DAYS } from '../data/pricingDefaults.js';

const DAY_MS = 24 * 60 * 60 * 1000;

const toInt = (v, fallback = 0) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? n : fallback;
};

/** A brand-new wallet with no money and no plan. */
export function createWallet() {
  return {
    balance: 0,
    planId: 'free',
    planExpiresAt: 0, // epoch ms; 0 = never subscribed
    transactions: [],
  };
}

/** The plan a wallet is genuinely entitled to right now (expiry enforced). */
export function effectivePlan(wallet, now = Date.now()) {
  const planId = wallet?.planId || 'free';
  const expires = toInt(wallet?.planExpiresAt, 0);
  if (planId !== 'free' && expires > 0 && expires <= now) return 'free';
  return PLANS[planId] ? planId : 'free';
}

/** Whole days remaining on a subscription; 0 when free or expired. */
export function daysRemaining(wallet, now = Date.now()) {
  const expires = toInt(wallet?.planExpiresAt, 0);
  if (!expires) return 0;
  return Math.max(0, Math.ceil((expires - now) / DAY_MS));
}

const withTx = (wallet, tx) => ({
  ...wallet,
  transactions: [tx, ...(wallet.transactions || [])].slice(0, 50),
});

/**
 * Adds funds to the wallet.
 * Rejects non-positive or non-finite amounts so a bad input can never mint money.
 */
export function topUp(wallet, amount, { now = Date.now(), ref = null } = {}) {
  const value = toInt(amount, 0);
  if (value <= 0) {
    return { ok: false, wallet, reason: 'invalid_amount', error: 'Enter an amount above ₦0.' };
  }
  return {
    ok: true,
    wallet: withTx(
      { ...wallet, balance: toInt(wallet.balance, 0) + value },
      { id: `tx_${now}_${value}`, type: 'topup', amount: value, at: now, ref }
    ),
  };
}

/**
 * Charges one full generation.
 *
 * Subscription plans (limited/unlimited) are unlimited and never debit.
 * PAYG and free both debit GENERATION_PRICE, but the feature gate blocks a free
 * user before they ever reach this call — keeping the two concerns separate.
 */
export function debitGeneration(wallet, { now = Date.now(), quoteNumber = null } = {}) {
  const planId = effectivePlan(wallet, now);
  if (planId === 'limited' || planId === 'unlimited') {
    return { ok: true, charged: 0, wallet, planId, unlimited: true };
  }

  const balance = toInt(wallet.balance, 0);
  if (balance < GENERATION_PRICE) {
    return {
      ok: false,
      charged: 0,
      wallet,
      planId,
      reason: 'insufficient_funds',
      shortfall: GENERATION_PRICE - balance,
      error: `You need ₦${GENERATION_PRICE - balance} more to generate this quotation.`,
    };
  }

  return {
    ok: true,
    charged: GENERATION_PRICE,
    planId,
    wallet: withTx(
      { ...wallet, balance: balance - GENERATION_PRICE },
      {
        id: `tx_${now}_gen`,
        type: 'generation',
        amount: -GENERATION_PRICE,
        at: now,
        quoteNumber,
      }
    ),
  };
}


/**
 * Starts (or renews) a subscription. Funded from the wallet, which keeps one
 * money source in the app until a gateway exists.
 */
export function subscribe(wallet, planId, { now = Date.now() } = {}) {
  const plan = PLANS[planId];
  if (!plan || !plan.days) {
    return { ok: false, wallet, error: 'That plan cannot be subscribed to.' };
  }
  const price = toInt(plan.price, 0);
  const balance = toInt(wallet.balance, 0);
  if (balance < price) {
    return {
      ok: false,
      wallet,
      reason: 'insufficient_funds',
      shortfall: price - balance,
      error: `Top up ₦${price - balance} more to activate ${plan.name}.`,
    };
  }

  // Renewing early extends from the current expiry rather than wasting days.
  const base = toInt(wallet.planExpiresAt, 0) > now ? wallet.planExpiresAt : now;
  const expiresAt = base + plan.days * DAY_MS;

  return {
    ok: true,
    wallet: withTx(
      { ...wallet, balance: balance - price, planId: plan.id, planExpiresAt: expiresAt },
      { id: `tx_${now}_${planId}`, type: 'subscription', amount: -price, at: now, ref: planId }
    ),
    expiresAt,
  };
}

/** Cancels a subscription immediately; the balance is NOT refunded. */
export function cancelSubscription(wallet, { now = Date.now() } = {}) {
  return {
    ok: true,
    wallet: withTx(
      { ...wallet, planId: 'free', planExpiresAt: 0 },
      { id: `tx_${now}_cancel`, type: 'cancellation', amount: 0, at: now }
    ),
  };
}

/**
 * Drops an expired subscription back to free.
 * Idempotent, so it is safe to call on every app launch.
 */
export function reconcile(wallet, now = Date.now()) {
  const planId = wallet?.planId || 'free';
  if (planId === 'free') return wallet;
  if (toInt(wallet.planExpiresAt, 0) > now) return wallet;
  return { ...wallet, planId: 'free', planExpiresAt: 0 };
}

/**
 * Payment gateway seam.
 *
 * `recharge` is what the UI calls. Today it credits locally; when Paystack goes
 * live, flip `PAYMENT_CONFIG.mode` to 'paystack' and supply the real
 * initialize/verify calls — the wallet reconciliation stays identical because
 * both paths return `{ ok, wallet }`.
 */
export const PAYMENT_CONFIG = {
  mode: 'local', // 'local' | 'paystack'
  publicKey: null, // set to the Paystack live/test public key when enabled
};

export async function recharge(wallet, amount, options = {}) {
  if (PAYMENT_CONFIG.mode === 'paystack' && PAYMENT_CONFIG.publicKey) {
    // Future implementation point; same shape as the local path.
    return topUp(wallet, amount, { ...options, ref: 'paystack' });
  }
  return topUp(wallet, amount, { ...options, ref: 'local' });
}

export { GENERATION_PRICE, SUBSCRIPTION_DAYS };

export default {
  createWallet,
  effectivePlan,
  daysRemaining,
  topUp,
  debitGeneration,
  subscribe,
  cancelSubscription,
  reconcile,
  recharge,
  PAYMENT_CONFIG,
};
