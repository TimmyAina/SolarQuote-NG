/**
 * Shared finding sink for the diagnostic probe.
 *
 * Split out so each probe module can record findings without owning the report
 * step, and so the totals are aggregated once at the end.
 */
export const findings = [];

export const isFinite_ = (n) => typeof n === 'number' && Number.isFinite(n);

/** Records a finding. sev is CRIT (breaks the app), HIGH (wrong data), MED (rough edge). */
export const add = (sev, area, msg) => findings.push({ sev, area, msg });

/** Prints the findings collected so far and returns the critical count. */
export function report(label) {
  const order = ['CRIT', 'HIGH', 'MED'];
  console.log(`\n=== DIAGNOSTIC [${label}]: ${findings.length} finding(s) ===`);
  order.forEach((sev) => {
    const list = findings.filter((f) => f.sev === sev);
    if (!list.length) return;
    console.log(`\n[${sev}] ${list.length}`);
    list.forEach((f) => console.log(`  ${f.area}: ${f.msg}`));
  });
  return findings.filter((f) => f.sev === 'CRIT').length;
}
