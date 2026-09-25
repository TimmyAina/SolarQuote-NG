/** Exact catalog ids for every key used by the facility presets. */
import { ALL_PRODUCTS } from '../src/data/catalog/index.js';

const KEYS = ['fans', 'bulbs', 'ac15hp', 'computers', 'cctv_wifi', 'pumping_machine', 'freezer', 'fridge', 'tv'];
const HINTS = {
  fans: ['ceiling-fan-standard'],
  bulbs: ['led-bulb-18w'],
  ac15hp: ['1-5-hp-split'],
  computers: ['desktop'],
  cctv_wifi: ['camera', 'cctv', 'security'],
  pumping_machine: ['pumping-machine-1-5hp'],
  freezer: ['chest-freezer-300l'],
  fridge: ['double-door-fridge-350l'],
  tv: ['43-smart-tv'],
};

KEYS.forEach((k) => {
  const hits = HINTS[k]
    .map((h) => ALL_PRODUCTS.filter((p) => p.id.includes(h)))
    .flat();
  const uniq = [...new Map(hits.map((p) => [p.id, p])).values()];
  console.log(`\n${k}:`);
  if (!uniq.length) { console.log('   NO MATCH'); return; }
  uniq.slice(0, 4).forEach((p) => {
    console.log(`   ${String(p.watts).padStart(5)}W  ${p.kind.padEnd(9)} ${p.id}  (${p.name})`);
  });
});
