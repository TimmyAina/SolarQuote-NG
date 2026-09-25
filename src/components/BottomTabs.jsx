/**
 * Bottom Tab Bar
 * ---------------------------------------------------------------------------
 * Thumb-reach navigation, safe-area aware, with a 48px minimum touch target and
 * an aria-current marker so screen readers announce the active tab.
 */
import React from 'react';
import {
  Home, Grid3x3, Calculator, FileText, Settings as SettingsIcon, Wallet,
} from 'lucide-react';

const TABS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'catalog', label: 'Catalog', icon: Grid3x3 },
  { id: 'quote', label: 'Quote', icon: Calculator },
  { id: 'boq', label: 'BOQ', icon: FileText },
  { id: 'wallet', label: 'Wallet', icon: Wallet },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

export function BottomTabs({ active, onChange }) {
  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur-md border-t border-line sq-safe-b"
    >
      <div className="mx-auto max-w-2xl flex items-stretch px-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = active === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              aria-current={isActive ? 'page' : undefined}
              className="flex-1 min-h-[56px] flex flex-col items-center justify-center gap-1 px-1 py-2 rounded-xl transition-colors"
            >
              <Icon
                className={`w-5 h-5 transition-colors ${
                  isActive ? 'text-accent' : 'text-ink-3'
                }`}
                strokeWidth={isActive ? 2.4 : 2}
              />
              <span
                className={`text-[10px] font-extrabold tracking-tight transition-colors ${
                  isActive ? 'text-accent' : 'text-ink-3'
                }`}
              >
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomTabs;
