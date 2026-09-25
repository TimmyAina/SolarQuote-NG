/**
 * SSR render harness: executes every screen with fixture data to surface runtime
 * crashes (undefined access, bad props, hook misuse) that a build cannot catch.
 *
 * Run bundled:
 *   node node_modules/esbuild/bin/esbuild scripts/debug-render.jsx --bundle --platform=node \
 *     --format=esm --loader:.jsx=jsx --jsx=automatic \
 *     --alias:jspdf=./node_modules/jspdf/dist/jspdf.es.min.js --outfile=.tmp-dbg/render.mjs
 *   node .tmp-dbg/render.mjs
 */
import React from 'react';
import { renderToString } from 'react-dom/server';
import App from '../src/App.jsx';
import { ScreenInput } from '../src/components/ScreenInput.jsx';
import { ScreenBOQ } from '../src/components/ScreenBOQ.jsx';
import { ScreenPDF } from '../src/components/ScreenPDF.jsx';
import { ScreenAdmin } from '../src/components/ScreenAdmin.jsx';
import { SignaturePad } from '../src/components/SignaturePad.jsx';
import { DEFAULT_SETTINGS, COMMON_APPLIANCES, PROFILE_PRESETS, NIGERIAN_CITIES } from '../src/data/pricingDefaults.js';
import { calculateSolarSystem } from '../src/utils/calculations.js';

let failures = 0;
const noop = () => {};

const check = (label, cond, extra = '') => {
  if (cond) {
    console.log(`  PASS  ${label}${extra ? ' -> ' + extra : ''}`);
  } else {
    failures++;
    console.log(`  FAIL  ${label}${extra ? ' -> ' + extra : ''}`);
  }
};

function tryRender(name, element, expectations = []) {
  let html = '';
  try {
    html = renderToString(element);
  } catch (err) {
    failures++;
    console.log(`  FAIL  ${name} threw: ${err.message}`);
    return '';
  }
  check(`${name} rendered`, html.length > 200, `${html.length} chars`);
  expectations.forEach(exp => {
    check(`${name} shows "${exp}"`, html.includes(exp));
  });
  return html;
}

const preset = PROFILE_PRESETS.find(p => p.id === 'home_3bed') || PROFILE_PRESETS[0];
const appliances = COMMON_APPLIANCES.map(app => ({
  ...app,
  qty: preset.suggestedAppliances[app.id] || 0,
  watts: app.defaultWatts,
  hoursDay: preset.operatingHoursDay,
  hoursNight: preset.operatingHoursNight
}));

const calcResult = calculateSolarSystem({
  appliances,
  sunHours: NIGERIAN_CITIES[2].sunHours,
  backupHoursNight: 8,
  settings: DEFAULT_SETTINGS,
  installerMarkupPercent: 15
});

console.log('\n[R1] App shell (all tabs mount)');
tryRender('App', <App />, ['SolarQuote', 'Appliances']);

console.log('\n[R2] Screen 1 — input');
tryRender('ScreenInput', (
  <ScreenInput
    selectedPreset="home_3bed"
    setSelectedPreset={noop}
    appliances={appliances}
    setAppliances={noop}
    selectedCity={NIGERIAN_CITIES[0]}
    setSelectedCity={noop}
    onProceed={noop}
  />
), ['Ceiling / Standing Fans', 'Sun Hrs', 'Calculate BOQ', 'kW']);

console.log('\n[R3] Screen 2 — sizing & BOQ');
tryRender('ScreenBOQ', (
  <ScreenBOQ
    calcResult={calcResult}
    selectedTierIndex={1}
    setSelectedTierIndex={noop}
    installerMarkup={15}
    setInstallerMarkup={noop}
    onBack={noop}
    onProceedToPDF={noop}
  />
), ['Installer Profit', '5-Year', 'Safety Specs', 'Itemized BOQ', 'Total Investment']);

console.log('\n[R4] Screen 3 — document export');
tryRender('ScreenPDF', (
  <ScreenPDF
    calcResult={calcResult}
    selectedTierIndex={1}
    settings={DEFAULT_SETTINGS}
    setSettings={noop}
    appliances={appliances}
    onBack={noop}
  />
), ['Document Type', 'BOQ Quote', 'Invoice', 'Receipt', 'Upload Company Logo', 'Sign Here', 'Paystack']);

console.log('\n[R5] Admin + signature pad');
tryRender('ScreenAdmin', (
  <ScreenAdmin settings={DEFAULT_SETTINGS} setSettings={noop} onBack={noop} />
), ['Company Profile', 'Equipment Pricing Database', 'Inverter Cost per kVA']);
tryRender('SignaturePad', <SignaturePad onSave={noop} onCancel={noop} />, ['Sign with Finger', 'Attach Signature', 'canvas']);

console.log('\n[R6] Degraded settings (upgrading user / corrupted storage)');
try {
  const legacy = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  delete legacy.installerLogo;
  delete legacy.equipment.bosPerKVA;
  delete legacy.equipment.protectionBox;
  delete legacy.installationPercent;
  delete legacy.petrolPricePerLiter;

  const legacyResult = calculateSolarSystem({
    appliances,
    sunHours: 4.8,
    backupHoursNight: 8,
    settings: legacy,
    installerMarkupPercent: 15
  });
  const serialized = JSON.stringify(legacyResult);
  check('legacy settings do not produce NaN/Infinity', !/NaN|Infinity|null/.test(serialized));

  tryRender('ScreenBOQ (legacy settings)', (
    <ScreenBOQ
      calcResult={legacyResult}
      selectedTierIndex={0}
      setSelectedTierIndex={noop}
      installerMarkup={15}
      setInstallerMarkup={noop}
      onBack={noop}
      onProceedToPDF={noop}
    />
  ), ['Itemized BOQ']);

  const brokenSettings = { installerName: 'Broken Co' };
  let crashed = false;
  try {
    const brokenResult = calculateSolarSystem({ appliances, sunHours: 4.8, settings: brokenSettings });
    JSON.stringify(brokenResult);
  } catch (err) {
    crashed = true;
    console.log(`        (crash reproduced: ${err.message})`);
  }
  check('engine tolerates partially corrupt settings', crashed === false);
} catch (err) {
  failures++;
  console.log(`  FAIL  degraded-settings block threw: ${err.message}`);
}

console.log(`\n=== RENDER HARNESS: ${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'} ===`);
process.exit(failures === 0 ? 0 : 1);
