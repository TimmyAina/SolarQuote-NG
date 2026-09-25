/**
 * Solar Engineering & BOQ Calculation Engine for Nigeria
 */

export function calculateSolarSystem(params) {
  const {
    appliances,
    sunHours = 4.8,
    settings,
    installerMarkupPercent = 15
  } = params;

  let totalPeakWatts = 0;
  let dailyKWhDay = 0;
  let dailyKWhNight = 0;
  let hasInductiveLoad = false;
  let inductiveSurgeWatts = 0;

  appliances.forEach(item => {
    const qty = Number(item.qty) || 0;
    const watts = Number(item.watts) || 0;
    const itemTotalWatts = qty * watts;
    totalPeakWatts += itemTotalWatts;

    const isInductive = ['ac1hp', 'ac15hp', 'ac2hp', 'pumping_machine', 'freezer', 'fridge'].includes(item.id);
    if (isInductive && qty > 0) {
      hasInductiveLoad = true;
      if (item.id.includes('ac') || item.id === 'pumping_machine') {
        inductiveSurgeWatts += watts * 2.5;
      }
    }

    const hDay = Number(item.hoursDay) || 0;
    const hNight = Number(item.hoursNight) || 0;

    dailyKWhDay += (itemTotalWatts * hDay) / 1000;
    dailyKWhNight += (itemTotalWatts * hNight) / 1000;
  });

  const totalDailyKWh = dailyKWhDay + dailyKWhNight;

  // Inverter Sizing (kVA) with inductive surge headroom
  const surgeFactor = hasInductiveLoad ? Math.max(1.35, settings.safetySurgeFactor || 1.25) : (settings.safetySurgeFactor || 1.25);
  const rawInverterKVA = (totalPeakWatts * surgeFactor) / 1000;
  const standardInverters = [1.5, 3.0, 5.0, 6.0, 8.0, 10.0, 12.0, 15.0, 20.0, 30.0];
  let recommendedInverterKVA = standardInverters.find(k => k >= rawInverterKVA) || (Math.ceil(rawInverterKVA / 5) * 5);

  // Battery Storage Sizing (kWh)
  const dod = settings.batteryDoD || 0.85;
  const batteryEfficiency = 0.92;
  const requiredBatteryKWh = dailyKWhNight > 0 
    ? (dailyKWhNight / (dod * batteryEfficiency))
    : (totalDailyKWh * 0.35 / (dod * batteryEfficiency));

  let recommendedBatteryKWh = Math.ceil(requiredBatteryKWh / 2.5) * 2.5;
  if (recommendedBatteryKWh < 2.5) recommendedBatteryKWh = 2.5;

  // Solar Array Sizing (kWp)
  const lossFactor = settings.systemLossFactor || 1.28;
  const rawSolarKW = (totalDailyKWh * lossFactor) / (sunHours || 4.8);
  const recommendedSolarKW = Math.max(0.6, Math.ceil(rawSolarKW * 10) / 10);

  // DC Cable & Isolator Safety specs
  const nominalDC_Amps = Math.round((recommendedInverterKVA * 1000) / 48);
  let recommendedDCCable = "16mm² Pure Copper Flex";
  let recommendedDCBreaker = "80A 2-Pole DC Isolator";
  if (nominalDC_Amps > 200) {
    recommendedDCCable = "50mm² Pure Copper Flex";
    recommendedDCBreaker = "250A Molded Case DC Breaker";
  } else if (nominalDC_Amps > 140) {
    recommendedDCCable = "35mm² Pure Copper Flex";
    recommendedDCBreaker = "175A 2-Pole DC Isolator";
  } else if (nominalDC_Amps > 80) {
    recommendedDCCable = "25mm² Pure Copper Flex";
    recommendedDCBreaker = "125A 2-Pole DC Isolator";
  }

  // 5. Generate 3 Tiers with Markup, Milestones & Roof Footprint
  const tiers = ['economy', 'standard', 'premium'].map(tierKey => {
    const invData = settings.equipment.inverters[tierKey];
    const battData = settings.equipment.batteries[tierKey];
    const panelData = settings.equipment.panels[tierKey];

    const panelWatt = panelData.wattRating;
    const panelCount = Math.max(2, Math.ceil((recommendedSolarKW * 1000) / panelWatt));
    const actualSolarKW = (panelCount * panelWatt) / 1000;

    const inverterCost = Math.round(recommendedInverterKVA * invData.costPerKVA);
    const batteryCost = Math.round(recommendedBatteryKWh * battData.costPerKWh);
    const panelCost = Math.round(panelCount * panelData.panelPrice);
    const bosCost = Math.round(recommendedInverterKVA * (settings.equipment.bosPerKVA || 55000));
    const protectionCost = settings.equipment.protectionBox || 85000;

    const wholesaleSubtotal = inverterCost + batteryCost + panelCost + bosCost + protectionCost;
    const markupMultiplier = 1 + (installerMarkupPercent / 100);
    const installationFee = Math.round(wholesaleSubtotal * (settings.installationPercent || 0.15));
    const installerProfit = Math.round(wholesaleSubtotal * (installerMarkupPercent / 100)) + Math.round(installationFee * 0.4);
    const totalCost = Math.round(wholesaleSubtotal * markupMultiplier) + installationFee;

    // Payment Milestones (70% - 20% - 10%)
    const milestone1 = Math.round(totalCost * 0.70);
    const milestone2 = Math.round(totalCost * 0.20);
    const milestone3 = totalCost - milestone1 - milestone2;

    const totalRoofAreaM2 = Math.round(panelCount * 2.55 * 10) / 10;
    const totalPanelWeightKg = Math.round(panelCount * 32);

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
      wholesaleSubtotal,
      installerProfit,
      totalCost,
      milestones: { phase1: milestone1, phase2: milestone2, phase3: milestone3 },
      roofSpecs: { areaM2: totalRoofAreaM2, weightKg: totalPanelWeightKg },
      warranty: invData.warranty
    };
  });

  // 6. Savings & 5-Year Lifecycle Comparison (Generator vs Solar)
  const fuelLiterCost = settings.petrolPricePerLiter || 1150;
  // Generator sizing: fuel burn scales with kVA (baseline is a 5kVA set), and run-hours
  // must scale with the load it has to carry, otherwise big loads never show a payback.
  const genKVA = Math.max(3.5, recommendedInverterKVA);
  const genFuelPerHourBaseline = settings.genFuelConsumptionPerHour || 1.8;
  const genLitersPerHour = Math.max(1.2, Math.round(genKVA * (genFuelPerHourBaseline / 5) * 10) / 10);
  const genHoursForLoad = totalDailyKWh / (genKVA * 0.75);
  const genHoursPerDay = Math.min(20, Math.max(settings.genRunningHoursPerDay || 7, genHoursForLoad));
  const dailyFuelCost = genHoursPerDay * genLitersPerHour * fuelLiterCost;
  const monthlyFuelCost = dailyFuelCost * 30;

  const monthlyGridKWh = totalDailyKWh * 30;
  const monthlyGridCost = monthlyGridKWh * (settings.discoTariffPerKWh || 209.5);
  const estimatedMonthlySavings = Math.round(monthlyFuelCost * 0.75 + monthlyGridCost * 0.4);

  // 5-Year cumulative costs
  const fiveYearGenFuel = monthlyFuelCost * 60;
  const annualGenMaintenance = Math.max(150000, Math.round(genKVA * 45000));
  const fiveYearGenMaintenance = annualGenMaintenance * 5;
  const fiveYearTotalGenCost = fiveYearGenFuel + fiveYearGenMaintenance;

  const standardTotalCost = tiers[1].totalCost;
  const annualSolarUpkeep = 80000;
  const fiveYearSolarCost = standardTotalCost + (annualSolarUpkeep * 5);
  const fiveYearNetSavings = Math.max(0, fiveYearTotalGenCost - fiveYearSolarCost);

  const paybackMonths = estimatedMonthlySavings > 0 
    ? Math.round((standardTotalCost / estimatedMonthlySavings) * 10) / 10 
    : 16;

  return {
    totalPeakWatts,
    dailyKWhDay: Math.round(dailyKWhDay * 10) / 10,
    dailyKWhNight: Math.round(dailyKWhNight * 10) / 10,
    totalDailyKWh: Math.round(totalDailyKWh * 10) / 10,
    hasInductiveLoad,
    inductiveSurgeWatts,
    recommendedInverterKVA,
    recommendedBatteryKWh,
    recommendedSolarKW,
    technicalSafety: {
      dcAmps: nominalDC_Amps,
      recommendedDCCable,
      recommendedDCBreaker,
      recommendedACSurge: "Type 2 AC SPD (40kA)",
      recommendedDCSurge: "600V DC SPD"
    },
    tiers,
    economics: {
      monthlySavings: estimatedMonthlySavings,
      monthlyFuelAvoided: Math.round(monthlyFuelCost),
      paybackMonths,
      fiveYearGenCost: fiveYearTotalGenCost,
      fiveYearSolarCost,
      fiveYearNetSavings
    },
    sunHours
  };
}

export function formatNaira(num) {
  if (num === undefined || num === null) return '₦0';
  return '₦' + Number(num).toLocaleString('en-NG');
}
