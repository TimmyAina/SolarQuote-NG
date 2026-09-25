/**
 * Household & Commercial Appliance Catalog
 * ---------------------------------------------------------------------------
 * The everyday loads that dominate a Nigerian home, office or SME.
 *
 *   watts      = running draw (the number that sizes the system)
 *   surgeWatts = inrush peak, which drives the inverter surge rating. Motorised
 *                compressors, pumps and heaters are the usual culprits.
 *
 * Row schema (positional, expanded by the `A` helper):
 *   [name, category, watts, surgeWatts, hoursDay, hoursNight, icon, group, priceNGN]
 */

const A = (name, category, watts, surgeWatts, hoursDay, hoursNight, icon, group, priceNGN) => ({
  id: `app-${category}-${String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
  name,
  category,
  kind: 'appliance',
  watts,
  surgeWatts,
  indicativePriceNGN: priceNGN,
  specs: { hoursDay, hoursNight, icon, group },
});

// prettier-ignore
const LIGHTING = [
  A('LED Bulb 9W',                 'lighting', 9, 12, 6, 6, 'Lightbulb', 'LED', 1800),
  A('LED Bulb 12W',                'lighting', 12, 15, 6, 6, 'Lightbulb', 'LED', 2200),
  A('LED Bulb 18W (Cool Day)',     'lighting', 18, 22, 6, 6, 'Lightbulb', 'LED', 2800),
  A('CFL Bulb 23W',                'lighting', 23, 30, 6, 6, 'Lightbulb', 'CFL', 800),
  A('Fluorescent Tube 36W',        'lighting', 36, 50, 8, 6, 'Lightbulb', 'Tube', 1200),
  A('LED Strip 5m (12W/m)',        'lighting', 60, 70, 5, 6, 'Lightbulb', 'Decor', 18000),
  A('LED Floodlight 100W',         'lighting', 100, 120, 6, 6, 'Sun', 'Outdoor', 42000),
  A('Solar Street Light 60W',      'lighting', 60, 60, 0, 12, 'Sun', 'Outdoor', 95000),
  A('Emergency Light (Inverter)',  'lighting', 12, 15, 2, 4, 'Lightbulb', 'Backup', 8500),
  A('Incandescent Bulb 100W',      'lighting', 100, 120, 4, 4, 'Lightbulb', 'Legacy', 300),
];

// prettier-ignore
const COOLING = [
  A('Ceiling Fan (Standard)',         'cooling', 75, 90, 8, 8, 'Fan', 'Fan', 28000),
  A('Ceiling Fan (Energy Efficient)', 'cooling', 45, 60, 8, 8, 'Fan', 'Fan', 42000),
  A('Pedestal Fan',                   'cooling', 55, 70, 6, 8, 'Fan', 'Fan', 32000),
  A('Table Fan (USB/DC)',             'cooling', 25, 30, 6, 8, 'Fan', 'Fan', 12000),
  A('Wall Fan',                       'cooling', 65, 80, 6, 8, 'Fan', 'Fan', 38000),
  A('Standing Fan (Tower)',           'cooling', 50, 65, 6, 8, 'Fan', 'Fan', 55000),
  A('1.0 HP Split Inverter AC',       'cooling', 900, 2700, 6, 4, 'Wind', 'AC', 385000),
  A('1.5 HP Split Inverter AC',       'cooling', 1400, 4200, 7, 5, 'Wind', 'AC', 520000),
  A('2.0 HP Split Inverter AC',       'cooling', 1900, 5700, 7, 5, 'Wind', 'AC', 690000),
  A('2.5 HP Split Inverter AC',       'cooling', 2400, 7200, 8, 6, 'Wind', 'AC', 880000),
  A('3.0 HP Split Inverter AC',       'cooling', 2800, 8400, 8, 6, 'Wind', 'AC', 1050000),
  A('1.0 HP Non-Inverter AC',         'cooling', 1200, 3600, 6, 4, 'Wind', 'AC (Legacy)', 320000),
  A('1.5 HP Non-Inverter AC',         'cooling', 1800, 5400, 7, 5, 'Wind', 'AC (Legacy)', 450000),
  A('5HP Window AC',                  'cooling', 3500, 10500, 8, 6, 'Wind', 'AC (Legacy)', 620000),
  A('Air Cooler 70L',                 'cooling', 200, 300, 9, 4, 'Wind', 'Evaporative', 245000),
  A('Desktop Air Cooler',             'cooling', 120, 180, 8, 3, 'Wind', 'Evaporative', 95000),
];


// prettier-ignore
const KITCHEN = [
  A('Microwave Oven 20L',             'kitchen', 1200, 1400, 0.5, 0.5, 'Zap', 'Cooking', 165000),
  A('Induction Cooker 2HP',           'kitchen', 1800, 2000, 1, 0, 'Zap', 'Cooking', 55000),
  A('Electric Kettle 1.7L',           'kitchen', 2200, 2400, 0.25, 0, 'Zap', 'Cooking', 25000),
  A('Electric Rice Cooker',           'kitchen', 800, 900, 1, 0, 'Zap', 'Cooking', 38000),
  A('Electric Pressure Cooker',       'kitchen', 1000, 1200, 1, 0, 'Zap', 'Cooking', 68000),
  A('Electric Blender',               'kitchen', 350, 500, 0.25, 0, 'Zap', 'Cooking', 28000),
  A('Air Fryer 5L',                   'kitchen', 1350, 1500, 0.5, 0, 'Zap', 'Cooking', 95000),
  A('Electric Toaster 2-Slice',       'kitchen', 900, 1000, 0.2, 0, 'Zap', 'Cooking', 18000),
  A('Electric Iron',                  'kitchen', 1000, 1200, 0.5, 0, 'Zap', 'Ironing', 22000),
  A('Standing Water Heater 50L',      'kitchen', 2000, 2400, 1, 2, 'Droplets', 'Water Heating', 185000),
  A('Gas Cooker (LPG)',               'kitchen', 50, 60, 3, 3, 'Flame', 'Cooking (Gas)', 75000),
  A('Electric Deep Fryer',            'kitchen', 1800, 2000, 0.5, 0, 'Zap', 'Cooking', 78000),
  A('RO Water Dispenser Pump',        'kitchen', 600, 700, 2, 1, 'Droplets', 'Water', 145000),
  A('Solar Water Heater 200L',        'kitchen', 0, 0, 0, 0, 'Sun', 'Solar Thermal', 450000),
];

// prettier-ignore
const COMPUTING = [
  A('Desktop PC (Office)',          'computing', 130, 160, 10, 2, 'Monitor', 'Desktop', 520000),
  A('Workstation PC (Gaming/Pro)',  'computing', 450, 520, 10, 2, 'Monitor', 'Desktop', 2850000),
  A('Laptop (Ultrabook)',           'computing', 30, 40, 9, 2, 'Laptop', 'Laptop', 620000),
  A('Gaming Laptop',                'computing', 165, 200, 8, 2, 'Laptop', 'Laptop', 2350000),
  A('Server (1U Rack)',             'computing', 260, 320, 24, 0, 'Server', 'Server', 2850000),
  A('Network Switch 24-Port',       'computing', 40, 50, 24, 0, 'Wifi', 'Networking', 95000),
  A('WiFi Router',                  'computing', 12, 15, 24, 0, 'Wifi', 'Networking', 35000),
  A('4G/LTE Router (MiFi)',         'computing', 8, 10, 24, 0, 'Wifi', 'Networking', 45000),
  A('Tablet (Charging)',            'computing', 12, 15, 6, 4, 'Tablet', 'Tablet', 285000),
  A('Printer (Laser, Office)',      'computing', 450, 550, 2, 0, 'Printer', 'Print', 285000),
  A('Photo Copy Machine',           'computing', 600, 750, 2, 0, 'Printer', 'Print', 950000),
  A('Video Projector',              'computing', 300, 380, 4, 1, 'Monitor', 'AV', 420000),
  A('Interactive Whiteboard 75"',   'computing', 180, 220, 8, 0, 'Monitor', 'AV', 1850000),
];

// prettier-ignore
const ENTERTAINMENT = [
  A('43" Smart TV',                 'entertainment', 90, 110, 5, 5, 'Tv', 'TV', 385000),
  A('50" Smart TV',                 'entertainment', 120, 145, 5, 5, 'Tv', 'TV', 520000),
  A('55" Smart TV',                 'entertainment', 150, 180, 5, 5, 'Tv', 'TV', 690000),
  A('65" Smart TV',                 'entertainment', 190, 230, 5, 5, 'Tv', 'TV', 920000),
  A('43" LED TV (Non-Smart)',       'entertainment', 70, 90, 5, 5, 'Tv', 'TV', 245000),
  A('Soundbar 2.1ch',               'entertainment', 40, 50, 5, 5, 'Speaker', 'Audio', 85000),
  A('Home Theatre (5.1)',           'entertainment', 250, 320, 4, 4, 'Speaker', 'Audio', 385000),
  A('Digital TV Decoder',           'entertainment', 10, 12, 24, 0, 'Tv', 'Set-Top Box', 15000),
  A('Gaming Console (PS5)',         'entertainment', 200, 240, 3, 3, 'Gamepad2', 'Gaming', 620000),
];

// prettier-ignore
const PUMPS = [
  A('Water Pumping Machine 1HP',    'pumps', 1100, 3300, 2, 1, 'Droplets', 'Pump', 185000),
  A('Water Pumping Machine 1.5HP',  'pumps', 1500, 4500, 2, 1, 'Droplets', 'Pump', 245000),
  A('Water Pumping Machine 2HP',    'pumps', 2200, 6600, 2, 1, 'Droplets', 'Pump', 340000),
  A('Borehole Submersible 1.5HP',   'pumps', 1800, 5400, 2, 1, 'Droplets', 'Submersible', 320000),
  A('Borehole Submersible 3HP',     'pumps', 3200, 9600, 2, 1, 'Droplets', 'Submersible', 580000),
  A('Solar Water Pump 1HP',         'pumps', 750, 1500, 6, 0, 'Sun', 'Solar Pump', 450000),
  A('Solar Water Pump 3HP',         'pumps', 2200, 4000, 6, 0, 'Sun', 'Solar Pump', 1250000),
  A('Automatic Water Pump 0.5HP',   'pumps', 550, 1650, 2, 1, 'Droplets', 'Pump', 95000),
  A('Pressure Washer',              'pumps', 1500, 2000, 1, 0, 'Droplets', 'Cleaning', 145000),
  A('Vacuum Cleaner',               'pumps', 500, 700, 0.5, 0, 'Sparkles', 'Cleaning', 95000),
];

// prettier-ignore
const REFRIGERATION = [
  A('Chest Freezer 200L',              'refrigeration', 250, 750, 10, 14, 'Refrigerator', 'Freezer', 285000),
  A('Chest Freezer 300L',              'refrigeration', 320, 960, 10, 14, 'Refrigerator', 'Freezer', 365000),
  A('Chest Freezer 400L (Double Lid)', 'refrigeration', 420, 1260, 10, 14, 'Refrigerator', 'Freezer', 480000),
  A('Upright Freezer 300L',            'refrigeration', 300, 900, 10, 14, 'Refrigerator', 'Freezer', 420000),
  A('Double-Door Fridge 350L',         'refrigeration', 180, 540, 12, 12, 'Refrigerator', 'Fridge', 385000),
  A('Single-Door Fridge 250L',         'refrigeration', 120, 360, 12, 12, 'Refrigerator', 'Fridge', 245000),
  A('Mini Fridge 90L',                 'refrigeration', 70, 210, 12, 12, 'Refrigerator', 'Fridge', 95000),
  A('Chest Freezer 150L (Solar DC)',   'refrigeration', 180, 540, 8, 16, 'Refrigerator', 'Solar DC', 320000),
  A('Display Cooler 250L',             'refrigeration', 350, 1050, 14, 10, 'Refrigerator', 'Commercial', 420000),
  A('Commercial Chest Freezer 500L',   'refrigeration', 550, 1650, 12, 12, 'Refrigerator', 'Commercial', 650000),
  A('Water Dispenser (Hot/Cold)',      'refrigeration', 550, 1100, 6, 6, 'Droplets', 'Dispenser', 165000),
];

// prettier-ignore
const TOOLS = [
  A('Electric Drill',             'tools', 500, 700, 0.5, 0, 'Wrench', 'Tool', 45000),
  A('Angle Grinder',              'tools', 900, 1300, 0.5, 0, 'Wrench', 'Tool', 38000),
  A('Circular Saw',               'tools', 1200, 1600, 0.5, 0, 'Wrench', 'Tool', 62000),
  A('Welding Machine (Inverter)', 'tools', 2200, 3500, 2, 0, 'Zap', 'Tool', 185000),
  A('Air Compressor 50L',         'tools', 750, 1800, 1, 0, 'Wrench', 'Tool', 285000),
  A('Electric Winch',             'tools', 1500, 2000, 1, 0, 'Wrench', 'Tool', 220000),
];

// prettier-ignore
const LAUNDRY = [
  A('Washing Machine (Front Load)', 'laundry', 500, 550, 1, 0, 'Sparkles', 'Laundry', 620000),
  A('Twin-Tub Washing Machine',     'laundry', 350, 400, 1.5, 0, 'Sparkles', 'Laundry', 285000),
  A('Clothes Iron (Steam)',        'laundry', 1800, 2200, 1, 0, 'Zap', 'Laundry', 58000),
  A('Tumble Dryer',                'laundry', 1200, 1400, 1, 0, 'Sparkles', 'Laundry', 420000),
  A('Electric Geyser 30L',         'laundry', 2000, 2400, 1, 3, 'Droplets', 'Water Heating', 285000),
  A('Solar Geyser 100L',           'laundry', 0, 0, 0, 0, 'Sun', 'Solar Thermal', 620000),
];

// prettier-ignore
const PERSONAL = [
  A('Hair Dryer',                'personal', 1200, 1500, 0.3, 0.3, 'Sparkles', 'Salon', 25000),
  A('Hair Clipper',              'personal', 15, 20, 0.3, 0.3, 'Sparkles', 'Salon', 12000),
  A('Electric Shaver',           'personal', 20, 25, 0.2, 0.2, 'Sparkles', 'Personal', 28000),
  A('Instant Water Heater',      'personal', 3000, 3600, 0.3, 0.3, 'Droplets', 'Geyser', 120000),
];

// prettier-ignore
const SECURITY = [
  A('Electric Fence Energiser',   'security', 25, 30, 24, 0, 'Shield', 'Security', 42000),
  A('Gate Motor (Automatic)',     'security', 150, 300, 0.3, 0.3, 'Lock', 'Security', 185000),
  A('Alarm Siren',                'security', 15, 20, 24, 0, 'Shield', 'Security', 8000),
  A('Backup Inverter (Router)',   'security', 12, 15, 24, 0, 'Wifi', 'Networking', 28000),
  A('CCTV Camera (IP)',           'security', 8, 10, 24, 0, 'Cctv', 'CCTV', 28000),
  A('CCTV NVR 8-Channel',         'security', 30, 40, 24, 0, 'Cctv', 'CCTV', 145000),
  A('CCTV Kit (8 Cameras + NVR)', 'security', 110, 140, 24, 0, 'Cctv', 'CCTV (Kit)', 620000),
];

// prettier-ignore
const COMMERCIAL = [
  A('Industrial Sewing Machine',    'commercial', 250, 400, 8, 2, 'Wrench', 'Sewing', 285000),
  A('LED Billboard 4x8 (Static)',   'commercial', 240, 300, 12, 12, 'Monitor', 'Signage', 420000),
  A('Bank ATM (Lobby Load)',        'commercial', 350, 450, 24, 0, 'Landmark', 'Banking', 850000),
  A('Barber Chair + Dryer Bank',    'commercial', 900, 1400, 10, 2, 'Sparkles', 'Salon', 650000),
  A('Refrigerated Display Cabinet', 'commercial', 400, 1200, 14, 10, 'Refrigerator', 'Retail', 480000),
  A('Point of Sale Terminal',       'commercial', 25, 35, 12, 12, 'Monitor', 'Retail', 145000),
  A('Passenger Elevator (1HP)',     'commercial', 1100, 3300, 4, 4, 'Building2', 'Lift', 850000),
];

// prettier-ignore
const MEDICAL = [
  A('Medical Refrigerator',     'medical', 150, 450, 10, 14, 'Stethoscope', 'Cold Chain', 320000),
  A('Vaccine Freezer (-20C)',   'medical', 350, 1050, 10, 14, 'Stethoscope', 'Cold Chain', 1250000),
  A('Oxygen Concentrator',      'medical', 400, 500, 10, 14, 'Stethoscope', 'Medical', 550000),
  A('Dental Chair Unit',        'medical', 800, 1200, 8, 0, 'Stethoscope', 'Medical', 1850000),
  A('Laboratory Autoclave',     'medical', 1200, 1800, 2, 0, 'Stethoscope', 'Medical', 950000),
];

export const APPLIANCES = [
  ...LIGHTING, ...COOLING, ...REFRIGERATION, ...KITCHEN, ...COMPUTING,
  ...ENTERTAINMENT, ...PUMPS, ...TOOLS, ...LAUNDRY, ...PERSONAL,
  ...SECURITY, ...COMMERCIAL, ...MEDICAL,
];

/** The consumer-facing category sections shown in the catalog browser. */
export const APPLIANCE_CATEGORIES = [
  { id: 'lighting', label: 'Lighting' },
  { id: 'cooling', label: 'Cooling & Fans' },
  { id: 'refrigeration', label: 'Fridges & Freezers' },
  { id: 'kitchen', label: 'Kitchen' },
  { id: 'computing', label: 'Computing & IT' },
  { id: 'entertainment', label: 'TV & Audio' },
  { id: 'pumps', label: 'Pumps & Water' },
  { id: 'tools', label: 'Power Tools' },
  { id: 'laundry', label: 'Laundry & Water Heating' },
  { id: 'personal', label: 'Personal Care' },
  { id: 'security', label: 'Security & CCTV' },
  { id: 'commercial', label: 'Commercial' },
  { id: 'medical', label: 'Medical & Cold Chain' },
];

export default APPLIANCES;
