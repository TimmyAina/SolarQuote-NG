/**
 * Nigerian Solar Engineering & Pricing Defaults
 * Prices verified against Alaba Intl & Trade Fair Lagos market rates
 */

export const DEFAULT_SETTINGS = {
  installerName: "SolarQuote Technologies Ltd",
  installerPhone: "+234 803 123 4567",
  installerEmail: "quotes@solarquoteng.com",
  installerAddress: "Plot 14 Trans-Amadi, Port Harcourt / Ikeja, Lagos",
  installerTagline: "Certified Renewable Energy & Electrical Engineering",
  installerLogo: null, // base64 PNG data URL set from the PDF screen (stored in localStorage)
  
  // Market Benchmarks in Nigeria (NGN)
  petrolPricePerLiter: 1150,
  dieselPricePerLiter: 1350,
  discoTariffPerKWh: 209.5, // Band A DisCo average tariff (NERC)
  genFuelConsumptionPerHour: 1.8, // 5kVA - 7.5kVA generator ~1.8L/hr
  genRunningHoursPerDay: 7,
  
  // Engineering Factors
  sunHours: 4.8, // Nigeria Average Peak Sun Hours
  batteryDoD: 0.85, // 85% Depth of Discharge for LiFePO4
  systemLossFactor: 1.28, // 28% total balance of system derating
  safetySurgeFactor: 1.25, // 25% surge headroom for inverter
  installationPercent: 0.15, // 15% installation, logistics & certified cabling
  
  // Equipment Unit Pricing Database (Selling Price to Clients in NGN)
  equipment: {
    inverters: {
      economy: { brand: "Felicity / Must Hybrid", costPerKVA: 180000, warranty: "18 Months Warranty" },
      standard: { brand: "Deye / Sunsynk Hybrid IP65", costPerKVA: 260000, warranty: "5 Years Warranty" },
      premium: { brand: "Victron Energy MultiPlus-II / Quattro", costPerKVA: 420000, warranty: "5-10 Years Global Warranty" }
    },
    batteries: {
      economy: { brand: "Felicity Solar LiFePO4 48V", costPerKWh: 260000, cycles: "3,000+ Cycles (8+ yrs)" },
      standard: { brand: "Pylontech / Dyness LiFePO4 48V", costPerKWh: 330000, cycles: "6,000+ Cycles (15 yrs)" },
      premium: { brand: "Victron / Freedom Won LiFePO4 48V", costPerKWh: 480000, cycles: "8,000+ Cycles (20 yrs)" }
    },
    panels: {
      economy: { brand: "Tier-1 Mono 550W", wattRating: 550, costPerWatt: 420, panelPrice: 231000 },
      standard: { brand: "Jinko / Longi 600W Bifacial", wattRating: 600, costPerWatt: 460, panelPrice: 276000 },
      premium: { brand: "Canadian Solar / Maxeon 700W N-Type", wattRating: 700, costPerWatt: 520, panelPrice: 364000 }
    },
    bosPerKVA: 55000,
    protectionBox: 85000
  }
};

export const COMMON_APPLIANCES = [
  { id: 'fans', name: 'Ceiling / Standing Fans', defaultWatts: 75, icon: 'Fan' },
  { id: 'bulbs', name: 'LED Energy Bulbs', defaultWatts: 15, icon: 'Lightbulb' },
  { id: 'ac1hp', name: '1.0 HP Inverter AC', defaultWatts: 900, icon: 'Wind' },
  { id: 'ac15hp', name: '1.5 HP Inverter AC', defaultWatts: 1400, icon: 'Wind' },
  { id: 'ac2hp', name: '2.0 HP Inverter AC', defaultWatts: 1900, icon: 'Wind' },
  { id: 'freezer', name: 'Deep Freezer (Chest)', defaultWatts: 250, icon: 'Refrigerator' },
  { id: 'fridge', name: 'Double-Door Refrigerator', defaultWatts: 180, icon: 'Refrigerator' },
  { id: 'tv', name: 'Smart TV + Soundbar', defaultWatts: 120, icon: 'Tv' },
  { id: 'pumping_machine', name: 'Water Pumping Machine (1HP)', defaultWatts: 1100, icon: 'Droplets' },
  { id: 'computers', name: 'Desktop PC / Laptops', defaultWatts: 150, icon: 'Monitor' },
  { id: 'cctv_wifi', name: 'CCTV Cameras + WiFi Router', defaultWatts: 60, icon: 'Wifi' },
  { id: 'microwave', name: 'Microwave Oven (Short use)', defaultWatts: 1200, icon: 'Zap' }
];

export const PROFILE_PRESETS = [
  {
    id: 'school',
    name: 'School / Training Center',
    description: 'Daytime operation (8:00 AM – 4:00 PM)',
    operatingHoursDay: 8,
    operatingHoursNight: 0,
    suggestedAppliances: { fans: 30, bulbs: 40, ac15hp: 2, computers: 25, cctv_wifi: 1, pumping_machine: 1 }
  },
  {
    id: 'home_3bed',
    name: '3-4 Bed Residence',
    description: '24/7 Comfort: Essential lights, fans, fridge & AC backup',
    operatingHoursDay: 12,
    operatingHoursNight: 10,
    suggestedAppliances: { fans: 6, bulbs: 16, ac15hp: 2, freezer: 1, fridge: 1, tv: 2, pumping_machine: 1, cctv_wifi: 1 }
  },
  {
    id: 'office',
    name: 'Corporate Office',
    description: 'Work hours (8:30 AM – 5:30 PM) continuous servers & ACs',
    operatingHoursDay: 9,
    operatingHoursNight: 2,
    suggestedAppliances: { fans: 10, bulbs: 30, ac15hp: 4, computers: 15, fridge: 1, cctv_wifi: 1 }
  },
  {
    id: 'custom',
    name: 'Custom Count',
    description: 'Customize appliance list from scratch',
    operatingHoursDay: 8,
    operatingHoursNight: 8,
    suggestedAppliances: { fans: 4, bulbs: 10, tv: 1, fridge: 1 }
  }
];

export const NIGERIAN_CITIES = [
  { name: 'Port Harcourt (Rivers)', sunHours: 4.3 },
  { name: 'Lagos Island / Mainland', sunHours: 4.8 },
  { name: 'Abuja (FCT)', sunHours: 5.3 },
  { name: 'Ibadan (Oyo)', sunHours: 4.9 },
  { name: 'Benin City (Edo)', sunHours: 4.4 },
  { name: 'Warri / Asaba (Delta)', sunHours: 4.4 },
  { name: 'Enugu (Enugu)', sunHours: 4.7 },
  { name: 'Owerri (Imo)', sunHours: 4.5 },
  { name: 'Kano (Kano)', sunHours: 5.8 },
  { name: 'Kaduna (Kaduna)', sunHours: 5.5 }
];
