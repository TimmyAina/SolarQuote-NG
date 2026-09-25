/**
 * Wallet & Plan screen
 * ---------------------------------------------------------------------------
 * Top-ups, subscription plans, expiry countdown and transaction history.
 * This is the single place a user manages what they have paid for.
 */
import React, { useState } from 'react';
import {
  Wallet, Plus, Check, TrendingUp, TrendingDown, Lock, Crown, Zap,
  AlertCircle, X,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { formatNaira } from '../utils/calculations.js';
import { PLANS, SELECTABLE_PLANS, TOPUP_PRESETS } from '../data/pricingDefaults.js';

const TX_LABEL = {
  topup: 'Wallet top-up',
  generation: 'Quotation generated',
  subscription: 'Plan activated',
  cancellation: 'Plan cancelled',
};

export function WalletScreen() {
  const {
    balance, planId, plan, planDaysLeft, transactions,
    addFunds, activatePlan, cancelPlan, generationPrice, locked,
  } = useApp();

  const [custom, setCustom] = useState('');
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const isSubscriber = planId === 'limited' || planId === 'unlimited';
  const generationsLeft = Math.floor(balance / generationPrice);

  const doTopUp = (amount) => {
    setError(null);
    setNotice(null);
    const res = addFunds(amount);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setNotice(`${formatNaira(amount)} added to your wallet.`);
    setCustom('');
  };

  const doSubscribe = (id) => {
    setError(null);
    setNotice(null);
    const res = activatePlan(id);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setNotice(`${PLANS[id].name} is active for 30 days.`);
  };

  return (
    <div className="space-y-5 pb-28">
      {/* Balance */}
      <section className="sq-card overflow-hidden">
        <div className="p-5">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-accent" />
            <p className="sq-label">Wallet balance</p>
          </div>
          <p className="text-4xl font-extrabold tracking-tight tnum mt-2 leading-none">
            {formatNaira(balance)}
          </p>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-line">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-ink-3">
                Current plan
              </p>
              <p className="text-sm font-extrabold mt-0.5">{plan.name}</p>
            </div>
            {isSubscriber ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-ok bg-ok-soft px-2.5 py-1.5 rounded-full">
                <Check className="w-3.5 h-3.5" />
                {planDaysLeft}d left
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-accent bg-accent-soft px-2.5 py-1.5 rounded-full">
                <Zap className="w-3.5 h-3.5" />
                {formatNaira(generationPrice)} / quote
              </span>
            )}
          </div>

          {!isSubscriber && (
            <p className="text-xs text-ink-2 font-semibold mt-3">
              {generationsLeft > 0 ? (
                <>
                  Enough for <span className="font-extrabold">{generationsLeft}</span> more
                  quotation{generationsLeft === 1 ? '' : 's'}.
                </>
              ) : (
                <>Top up to generate a client quotation.</>
              )}
            </p>
          )}
        </div>
      </section>

      {error && (
        <p className="flex items-start gap-2 text-xs font-bold text-danger bg-danger-soft p-3 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
          {error}
        </p>
      )}
      {notice && (
        <p className="flex items-start gap-2 text-xs font-bold text-ok bg-ok-soft p-3 rounded-xl">
          <Check className="w-4 h-4 shrink-0 mt-px" />
          {notice}
        </p>
      )}

      {/* Top up */}
      <section className="sq-card p-4">
        <p className="text-sm font-extrabold mb-3">Add funds</p>
        <div className="grid grid-cols-4 gap-2">
          {TOPUP_PRESETS.map((amt) => (
            <button key={amt} type="button" onClick={() => doTopUp(amt)} className="sq-btn sq-btn-ghost">
              {formatNaira(amt)}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <input
            type="number"
            inputMode="numeric"
            min="1"
            placeholder="Other amount"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            aria-label="Custom top-up amount"
            className="sq-input tnum"
          />
          <button
            type="button"
            onClick={() => doTopUp(Number(custom))}
            disabled={!custom || Number(custom) <= 0}
            className="sq-btn sq-btn-primary shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
        <p className="text-[11px] text-ink-3 font-semibold mt-2">
          Card payment arrives with the Paystack integration. Wallet credit works now.
        </p>
      </section>

      {/* Plans */}
      <section>
        <p className="sq-label mb-2">Plans</p>
        <div className="space-y-2">
          {SELECTABLE_PLANS.map((id) => {
            const p = PLANS[id];
            const active = planId === id;
            const best = id === 'unlimited';
            return (
              <div key={id} className={`sq-card p-4 ${best && !active ? 'border-accent' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 font-extrabold text-sm">
                      {p.name}
                      {best && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-accent bg-accent-soft px-1.5 py-0.5 rounded-full">
                          <Crown className="w-2.5 h-2.5" />
                          BEST
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-ink-3 font-semibold mt-0.5">{p.tagline}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-base font-extrabold tnum">{formatNaira(p.price)}</p>
                    <p className="text-[10px] text-ink-3 font-bold">{p.period}</p>
                  </div>
                </div>

                <p className="text-[11px] text-ink-2 font-semibold mt-2.5 leading-relaxed">
                  {p.description}
                </p>

                <button
                  type="button"
                  onClick={() => doSubscribe(id)}
                  disabled={active}
                  className={`sq-btn w-full mt-3 ${active ? 'sq-btn-ghost' : 'sq-btn-primary'}`}
                >
                  {active
                    ? 'Active'
                    : p.walletBased
                      ? 'Switch to this plan'
                      : `Activate Â· ${formatNaira(p.price)}`}
                </button>
              </div>
            );
          })}
        </div>

        {isSubscriber && (
          <button type="button" onClick={cancelPlan} className="sq-btn sq-btn-ghost w-full mt-2">
            <X className="w-4 h-4" />
            Cancel subscription
          </button>
        )}
      </section>

      {/* What's locked */}
      {locked.length > 0 && (
        <section className="sq-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="w-4 h-4 text-warn" />
            <p className="text-sm font-extrabold">Not on your plan</p>
          </div>
          <ul className="space-y-2">
            {locked.map((f) => (
              <li key={f.id} className="flex items-start gap-2">
                <Lock className="w-3.5 h-3.5 text-ink-3 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-ink-2">{f.label}</p>
                  <p className="text-[11px] text-ink-3 font-semibold">{f.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* History */}
      {transactions.length > 0 && (
        <section className="sq-card p-4">
          <p className="text-sm font-extrabold mb-3">Recent activity</p>
          <div className="space-y-2">
            {transactions.slice(0, 8).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  {tx.amount > 0 ? (
                    <TrendingUp className="w-4 h-4 text-ok shrink-0" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-ink-3 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-ink truncate">
                      {TX_LABEL[tx.type] || tx.type}
                    </p>
                    <p className="text-[10px] text-ink-3 font-semibold">
                      {new Date(tx.at).toLocaleDateString('en-NG')}
                      {tx.quoteNumber !== null && tx.quoteNumber !== undefined
                        ? ` Â· Quote #${tx.quoteNumber}`
                        : ''}
                    </p>
                  </div>
                </div>
                {tx.amount !== 0 && (
                  <span
                    className={`text-xs font-extrabold tnum shrink-0 ${
                      tx.amount > 0 ? 'text-ok' : 'text-ink-2'
                    }`}
                  >
                    {tx.amount > 0 ? '+' : ''}
                    {formatNaira(Math.abs(tx.amount))}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default WalletScreen;
