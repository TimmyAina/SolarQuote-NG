/**
 * Welcome / Onboarding
 * ---------------------------------------------------------------------------
 * First-run only. No account, no login, no email — the user picks how much
 * detail they want to see, and the whole app is themed from that one choice.
 *
 * "Simple" hides engineering jargon (cable gauges, DoD, DC amps, surge ratios)
 * and speaks in money and hours. "Professional" exposes the full technical
 * specification set an installer expects on site.
 */
import React, { useState } from 'react';
import { Sun, Wrench, User, ArrowRight, ShieldCheck, Sparkles, Wallet, Crown, Zap } from 'lucide-react';
import { PLANS, SELECTABLE_PLANS, GENERATION_PRICE } from '../data/pricingDefaults.js';
import { formatNaira } from '../utils/calculations.js';

const MODES = [
  {
    id: 'simple',
    icon: User,
    title: 'Simple Mode',
    tagline: 'Plain language, money & hours',
    points: [
      'See what your power costs today',
      'Pick appliances from ready lists',
      'Get one clear total to pay',
      'No technical jargon, no formulas',
    ],
  },
  {
    id: 'pro',
    icon: Wrench,
    title: 'Professional Mode',
    tagline: 'Full engineering specification',
    points: [
      'Cable gauges, breakers & DC protection',
      'Depth of discharge & surge headroom',
      'Exact inverter, battery & panel models',
      'Full BOQ, margin and payback maths',
    ],
  },
];

const HIGHLIGHTS = [
  { icon: Sparkles, text: '400+ real products with measured power draw' },
  { icon: ShieldCheck, text: 'NERC tariffs and pump prices built in' },
  { icon: Wrench, text: 'Installable equipment, not just theory' },
];

export function WelcomeScreen({ onComplete }) {
  const [mode, setMode] = useState('pro');
  const [plan, setPlan] = useState('payg');
  const [step, setStep] = useState(0);

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col sq-safe-t">
      <div className="flex-1 w-full max-w-2xl mx-auto px-5 py-8 flex flex-col">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-accent text-accent-fg flex items-center justify-center shadow-card">
            <Sun className="w-6 h-6" strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight leading-none">
              SolarQuote <span className="text-accent">NG</span>
            </h1>
            <p className="text-xs text-ink-3 font-semibold mt-1">
              Solar sizing &amp; quotation for Nigeria
            </p>
          </div>
        </div>

        {step === 0 ? (
          <div className="sq-rise">
            <h2 className="text-2xl font-extrabold tracking-tight leading-snug">
              Build accurate solar quotes,
              <br />
              in minutes.
            </h2>
            <p className="text-sm text-ink-2 mt-3 leading-relaxed">
              Size the inverter, battery bank and panel array from the real
              appliances a site actually runs — then compare that running cost
              against grid power and your generator.
            </p>

            <ul className="mt-6 space-y-3">
              {HIGHLIGHTS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl bg-accent-soft text-accent flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" strokeWidth={2} />
                  </span>
                  <span className="text-sm font-semibold text-ink-2">{text}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="sq-btn sq-btn-primary w-full mt-8"
            >
              Get Started
              <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>
        ) : step === 1 ? (
          <div className="sq-rise">
            <h2 className="text-xl font-extrabold tracking-tight">
              How would you like to use it?
            </h2>
            <p className="text-sm text-ink-3 mt-1.5 mb-5">
              You can change this any time in Settings.
            </p>

            <div className="space-y-3">
              {MODES.map((m) => {
                const Icon = m.icon;
                const active = mode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMode(m.id)}
                    aria-pressed={active}
                    className={`w-full text-left p-4 rounded-card border-2 transition-all ${
                      active
                        ? 'border-accent bg-accent-soft'
                        : 'border-line bg-surface hover:border-line-strong'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                          active ? 'bg-accent text-accent-fg' : 'bg-surface-2 text-ink-2'
                        }`}
                      >
                        <Icon className="w-5 h-5" strokeWidth={2} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-extrabold text-[15px] leading-tight">{m.title}</p>
                        <p className="text-xs text-ink-3 font-semibold mt-0.5">{m.tagline}</p>
                        <ul className="mt-3 space-y-1.5">
                          {m.points.map((p) => (
                            <li key={p} className="flex items-start gap-2 text-xs text-ink-2">
                              <span
                                className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                                  active ? 'bg-accent' : 'bg-line-strong'
                                }`}
                              />
                              {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <span
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${
                          active ? 'border-accent' : 'border-line-strong'
                        }`}
                      >
                        {active && <span className="w-2.5 h-2.5 rounded-full bg-accent" />}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="sq-btn sq-btn-primary w-full mt-6"
            >
              Continue
              <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>
        ) : step === 2 ? (
          <div className="sq-rise">
            <h2 className="text-xl font-extrabold tracking-tight">
              How do you want to pay?
            </h2>
            <p className="text-sm text-ink-3 mt-1.5 mb-5">
              You can switch plans any time from Settings.
            </p>

            <div className="space-y-3">
              {SELECTABLE_PLANS.map((id) => {
                const p = PLANS[id];
                const active = plan === id;
                const Icon = id === 'payg' ? Zap : id === 'limited' ? Wallet : Crown;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPlan(id)}
                    aria-pressed={active}
                    className={`w-full text-left p-4 rounded-card border-2 transition-all ${
                      active
                        ? 'border-accent bg-accent-soft'
                        : 'border-line bg-surface hover:border-line-strong'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                          active ? 'bg-accent text-accent-fg' : 'bg-surface-2 text-ink-2'
                        }`}
                      >
                        <Icon className="w-5 h-5" strokeWidth={2} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-extrabold text-[15px] leading-tight">{p.name}</p>
                        <p className="text-xs text-ink-3 font-semibold mt-0.5">{p.tagline}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-extrabold tnum">{formatNaira(p.price)}</p>
                        <p className="text-[10px] text-ink-3 font-bold">{p.period}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => onComplete(mode, plan)}
              className="sq-btn sq-btn-primary w-full mt-6"
            >
              Start Building Quotes
              <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>
        ) : (
          <p className="text-center text-[11px] text-ink-3 font-semibold pt-4">
            Works offline · No account needed
          </p>
        )}
      </div>
    </div>
  );
}

export default WelcomeScreen;
