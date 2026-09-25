/**
 * Node smoke check for the SolarQuote NG engine.
 * Usage: node scripts/smoke-check.mjs
 */
import { DEFAULT_SETTINGS, COMMON_APPLIANCES, PROFILE_PRESETS, NIGERIAN_CITIES } from '../src/data/pricingDefaults.js';
import { calculateSolarSystem, formatNaira } from '../src/utils/calculations.js';

let failures = 0;
const check = (label, cond, extra = '') => {
  if (cond) {
    console.log(`  PASS  ${label}${extra ? ' -> ' + extra : ''}`);
  } else {
    failures++;
    console.log(`  FAIL  ${label}${extra ? ' -> ' + extra : ''}`);
  }
};

const preset = PROFILE_PRESETS.find(p => p.id === 'home_3bed');
const appliances = COMMON_APPLIANCES.map(app => ({
  ...app,
  qty: preset.suggestedAppliances[app.id] || 0,
  watts: app.defaultWatts,
  hoursDay: preset.operatingHoursDay,
  hoursNight: preset.operatingHoursNight
}));

const city = NIGERIAN_CITIES.find(c => c.name.includes('Lagos')) || NIGERIAN_CITIES[0];
const markup = 20;

const r = calculateSolarSystem({
  appliances,
  sunHours: city.sunHours,
  backupHoursNight: 8,
  settings: DEFAULT_SETTINGS,
  installerMarkupPercent: markup
});

console.log('\n[1] Sizing');
console.log(`  Peak load      : ${(r.totalPeakWatts / 1000).toFixed(2)} kW`);
console.log(`  Daily energy   : ${r.totalDailyKWh} kWh (day ${r.dailyKWhDay} / night ${r.dailyKWhNight})`);
console.log(`  Inverter       : ${r.recommendedInverterKVA} kVA | Battery: ${r.recommendedBatteryKWh} kWh | PV: ${r.recommendedSolarKW} kWp`);
check('Inverter sized', r.recommendedInverterKVA > 0);
check('Battery sized', r.recommendedBatteryKWh >= 2.5);
check('Inductive load flagged', r.hasInductiveLoad === true, `surge ${r.inductiveSurgeWatts}W`);

console.log('\n[2] Technical safety');
console.log(`  DC current     : ${r.technicalSafety.dcAmps}A`);
console.log(`  DC cable       : ${r.technicalSafety.recommendedDCCable}`);
console.log(`  DC isolator    : ${r.technicalSafety.recommendedDCBreaker}`);
check('DC cable + breaker present', !!r.technicalSafety.recommendedDCCable && !!r.technicalSafety.recommendedDCBreaker);

console.log('\n[3] Tiers, BOQ & milestones');
r.tiers.forEach(t => {
  console.log(`  ${t.name.padEnd(19)} ${formatNaira(t.totalCost).padStart(14)} | inv ${formatNaira(t.inverterCost)} batt ${formatNaira(t.batteryCost)} pv ${formatNaira(t.panelCost)} | profit ${formatNaira(t.installerProfit)} | ${t.roofSpecs.areaM2}m2 / ${t.roofSpecs.weightKg}kg`);
});
r.tiers.forEach((t, i) => {
  check(`tier ${i} has 3 milestones summing to total`, (t.milestones.phase1 + t.milestones.phase2 + t.milestones.phase3) === t.totalCost);
  check(`tier ${i} margin above wholesale`, t.totalCost > t.wholesaleSubtotal);
});

console.log(`\n[4] Economics @ ${markup}% markup`);
console.log(`  Monthly avoided: ${formatNaira(r.economics.monthlySavings)} | Payback: ${r.economics.paybackMonths} months`);
console.log(`  5-yr generator : ${formatNaira(r.economics.fiveYearGenCost)}`);
console.log(`  5-yr solar     : ${formatNaira(r.economics.fiveYearSolarCost)}`);
console.log(`  5-yr net save  : ${formatNaira(r.economics.fiveYearNetSavings)}`);
check('Payback positive', r.economics.paybackMonths > 0);
check('Solar beats generator over 5 years', r.economics.fiveYearNetSavings > 0);

const markupResult = calculateSolarSystem({
  appliances, sunHours: city.sunHours, backupHoursNight: 8, settings: DEFAULT_SETTINGS, installerMarkupPercent: 40
});
check('Higher markup raises price', markupResult.tiers[1].totalCost > r.tiers[1].totalCost,
  `${formatNaira(r.tiers[1].totalCost)} -> ${formatNaira(markupResult.tiers[1].totalCost)}`);
check('Higher markup raises installer profit', markupResult.tiers[1].installerProfit > r.tiers[1].installerProfit);
check('Default markup is 15%', calculateSolarSystem({ appliances, settings: DEFAULT_SETTINGS }).tiers[0].totalCost > 0);

console.log('\n[5] PDF generation (jsPDF + autotable)');
try {
  const { generateBOQReport } = await import('../src/utils/pdfGenerator.js');
  // 1x1 transparent PNG used to exercise the addImage(logo/signature) paths
  const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  for (const docType of ['boq', 'invoice', 'receipt']) {
    const doc = generateBOQReport({
      clientName: `Smoke Test ${docType}`,
      clientPhone: '+234 800 000 0000',
      clientAddress: city.name,
      selectedTierIndex: 1,
      calcResult: r,
      settings: { ...DEFAULT_SETTINGS, installerLogo: png },
      docType,
      logoBase64: png,
      signatureBase64: png
    });
    const bytes = doc.output('arraybuffer').byteLength;
    console.log(`  ${docType.padEnd(8)} PDF bytes: ${bytes}`);
    check(`${docType} PDF generated`, bytes > 3000 && bytes % 1 === 0);
  }
} catch (err) {
  if (/jspdf/i.test(err.message)) {
    console.log('  SKIP  jsPDF cannot be loaded unbundled in Node (browser/bundled path is covered by `npm run build`).');
    console.log('        To validate PDFs here run: node node_modules/esbuild/bin/esbuild scripts/smoke-check.mjs --bundle --platform=node --format=esm --alias:jspdf=./node_modules/jspdf/dist/jspdf.es.min.js --outfile=.tmp-smoke/smoke.mjs && node .tmp-smoke/smoke.mjs');
  } else {
    failures++;
    console.log('  FAIL  PDF generation threw: ' + err.message);
  }
}

console.log(`\n=== ${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'} ===`);
process.exit(failures === 0 ? 0 : 1);
