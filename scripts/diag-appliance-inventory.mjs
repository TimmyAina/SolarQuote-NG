/** Compact inventory of real appliance ids per category, to map presets onto. */
import { APPLIANCES } from '../src/data/catalog/appliances.js';

const wanted = ['fan', 'bulb', 'light', 'ac', 'air', 'computer', 'laptop', 'tv', 'cctv',
  'wifi', 'pump', 'freezer', 'fridge', 'wash', 'iron', 'cooker', 'kettle', 'microwave',
  'sound', 'speaker', 'sew', 'water'];

APPLIANCES.forEach((a) => {
  const hay = `${a.name} ${a.category}`.toLowerCase();
  if (wanted.some((w) => hay.includes(w))) {
    console.log(
      `  ${String(a.watts).padStart(5)}W  ${a.category.padEnd(22)} ${a.id.padEnd(46)} ${a.name}`
    );
  }
});
console.log(`\ntotal appliances: ${APPLIANCES.length}`);
console.log('categories:', [...new Set(APPLIANCES.map((a) => a.category))].join(', '));
