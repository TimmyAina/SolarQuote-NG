/**
 * Solar Engineering & BOQ Calculation Engine for Nigeria
 */

export function calculateSolarSystem(params) {
  const {
    appliances, // Array of { id, name, watts, qty, hoursDay, hoursNight }
    sunHours = 4.8,
    backupHoursNight = 8,
    settings
  } = params;

  // 1. Calculate Peak Running Load (Watts)
  let totalPeakWatts = 0;
  let dailyKWhDay = 0;
  let dailyKWhNight = 0;

  appliances.forEach(item => {
    const qty = Number(item.qty) || 0;
    const watts = Number(item.watts) || 0;
    const itemTotalWatts = qty * watts;
    totalPeakWatts += itemTotalWatts;

    const hDay = Number(item.hoursDay) || 0;
    const hNight = Number(item.hoursNight) || 0;

    dailyKWhDay += (itemTotalWatts * hDay) / 1000;
    dailyKWhNight += (itemTotalWatts * hNight) / 1000;
  });

  const totalDailyKWh = dailyKWhDay + dailyKWhNight;

  // 2. Inverter Sizing (kVA)
  // Include 25% safety surge factor and round up to standard commercial ratings (1kVA, 2.5kVA, 3.5kVA, 5kVA, 8kVA, 10kVA, 12kVA, 15kVA, 20kVA)
  const rawInverterVA = totalPeakWatts * (settings.safetySurgeFactor || 1.25);
  const rawInverterKVA = rawInverterVA / 1000;

  const standardInverters = [1.5, 3.0, 5.0, 6.0, 8.0, 10.0, 12.0, 15.0, 20.0, 30.0];
  let recommendedInverterKVA = standardInverters.find(k => k >= rawInverterKVA) || (Math.ceil(rawInverterKVA / 5) * 5);

  // 3. Battery Storage Sizing (kWh)
  // Battery needs to support night consumption + safety buffer
  // Required Capacity = Night Energy / (DoD * efficiency)
  const dod = settings.batteryDoD || 0.85;
  const batteryEfficiency = 0.92;
  const requiredBatteryKWh = dailyKWhNight > 0 
    ? (dailyKWhNight / (dod * batteryEfficiency))
    : (totalDailyKWh * 0.35 / (dod * batteryEfficiency)); // Minimum safe buffer for overcast days

  // Round up to nearest standard 5kWh or 10kWh lithium module
  let recommendedBatteryKWh = Math.ceil(requiredBatteryKWh / 2.5) * 2.5;
  if (recommendedBatteryKWh < 2.5) recommendedBatteryKWh = 2.5;

  // 4. Solar Array Sizing (kWp)
  // Solar must produce Total Daily kWh with system loss factor
  // Array kWp = (Total Daily kWh * Loss Factor) / Peak Sun Hours
  const lossFactor = settings.systemLossFactor || 1.28;
  const rawSolarKW = (totalDailyKWh * lossFactor) / (sunHours || 4.8);
  const recommendedSolarKW = Math.max(0.6, Math.ceil(rawSolarKW * 10) / 10);

  // 5. Generate 3 Tiers (Economy, Standard, Premium)
  const tiers = ['economy', 'standard', 'premium'].map(tierKey => {
    const invData = settings.equipment.inverters[tierKey];
    const battData = settings.equipment.batteries[tierKey];
    const panelData = settings.equipment.panels[tierKey];

    // Number of panels
    const panelWatt = panelData.wattRating;
    const panelCount = Math.max(2, Math.ceil((recommendedSolarKW * 1000) / panelWatt));
    const actualSolarKW = (panelCount * panelWatt) / 1000;

    // Component Costs
    const inverterCost = Math.round(recommendedInverterKVA * invData.costPerKVA);
    const batteryCost = Math.round(recommendedBatteryKWh * battData.costPerKWh);
    const solarCost = Math.round(panelCount * panelData.panelPrice);
    const bosCost = Math.round(recommendedInverterKVA * (settings.equipment.bosPerKVA || 55000));
    const protectionCost = settings.equipment.protectionBox || 85000;

    const subtotal = inverterCost + batteryCost + solarCost + bosCost + protectionCost;
    const installationFee = Math.round(subtotal * (settings.installationPercent || 0.15));
    const totalCost = subtotal + installationFee;

    return {
      tierKey,
      name: tierKey === 'economy' ? 'Economy Tier' : tierKey === 'standard' ? 'Standard Pro Tier' : 'Premium Luxury Tier',
      tag: tierKey === 'economy' ? 'Affordable & Reliable' : tierKey === 'standard' ? 'Most Popular Choice' : 'Maximum Durability',
      inverterBrand: invData.brand,
      inverterCost,
      batteryBrand: battData.brand,
      batteryCost,
      batteryCycles: battData.cycles,
      panelBrand: panelData.brand,
      panelCost,
      panelWatt,
      panelCount,
      actualSolarKW,
      bosCost,
      protectionCost,
      installationFee,
      subtotal,
      totalCost,
      warranty: invData.warranty
    };
  });

  // 6. Savings & Payback Calculation (Fuel generator vs DisCo vs Solar)
  // Generator fuel cost per day
  const fuelLiterCost = settings.petrolPricePerLiter || 1150;
  const genLitersPerHour = settings.genFuelConsumptionPerHour || 1.8;
  const genHoursPerDay = settings.genRunningHoursPerDay || 7;
  const dailyFuelCost = genHoursPerDay * genLitersPerHour * fuelLiterCost;
  const monthlyFuelCost = dailyFuelCost * 30;

  // NEPA/DisCo monthly baseline (Band A)
  const monthlyGridKWh = totalDailyKWh * 30;
  const monthlyGridCost = monthlyGridKWh * (settings.discoTariffPerKWh || 209.5);

  // Blended Monthly Power Bill avoided (Fuel + NEPA)
  const estimatedMonthlySavings = Math.round(monthlyFuelCost * 0.75 + monthlyGridCost * 0.4);

  // Payback period (Standard tier)
  const standardTotalCost = tiers[1].totalCost;
  const paybackMonths = estimatedMonthlySavings > 0 
    ? Math.round((standardTotalCost / estimatedMonthlySavings) * 10) / 10 
    : 18;

  return {
    totalPeakWatts,
    dailyKWhDay: Math.round(dailyKWhDay * 10) / 10,
    dailyKWhNight: Math.round(dailyKWhNight * 10) / 10,
    totalDailyKWh: Math.round(totalDailyKWh * 10) / 10,
    recommendedInverterKVA,
    recommendedBatteryKWh,
    recommendedSolarKW,
    tiers,
    monthlySavings: estimatedMonthlySavings,
    monthlyFuelAvoided: Math.round(monthlyFuelCost),
    paybackMonths,
    sunHours
  };
}

export function formatNaira(num) {
  if (num === undefined || num === null) return '₦0';
  return '₦' + Number(num).toLocaleString('en-NG');
}
