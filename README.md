# SolarQuote NG — The BOQ App for Nigerian Electricians & Solar Installers

A professional solar sizing, quotation, and Bill of Quantities (BOQ) generation mobile application engineered specifically for Nigerian electricians, engineers, and solar contractors.

---

## ⚡ Direct 1-Click APK Download

- **Latest Release**: [Download the newest APK](https://github.com/TimmyAina/SolarQuote-NG/releases/latest) — every push to `main` publishes a fresh build automatically.
- **Direct APK File**: `app-debug.apk` attached to the newest release (Size: ~4 MB).
- **First public build**: [v1.0.1](https://github.com/TimmyAina/SolarQuote-NG/releases/tag/v1.0.1)

---

## 🚀 Key Features

1. **Screen 1: Appliance & Load Input**
   - Quick-select facility presets: **School / Training Center**, **3–4 Bed Residence**, **Corporate Office**, or **Custom**.
   - Presets pre-fill fans, bulbs, inverter ACs, deep freezers, pumping machines, TVs, and computers.
   - City solar radiation selector (Port Harcourt: 4.3 PSH, Lagos: 4.8 PSH, Abuja: 5.3 PSH, Kano: 5.8 PSH).
   - Real-time running watt meter and day/night operating hour split.
   - **Inductive surge detection**: when inverter ACs, freezers or pumping machines are selected, the engine automatically adds 2.5x starting-surge cushions so the inverter never trips on compressor start.

2. **Screen 2: Sizing Engine & 3-Tier BOQ**
   - Inverter kVA sizing with surge headroom factor (1.25x).
   - Battery kWh calculation factoring depth of discharge (DoD 85%) and efficiency for LiFePO4.
   - Solar array kWp sizing with derating and loss factors (1.28x).
   - **Technical safety specs**: computed DC bus amps, copper DC cable size (16/25/35/50mm²) and matching DC isolator/breaker rating.
   - **Roof engineering**: panel count, required roof area (m²) and total dead load (kg) so the carpenter/roofer can plan.
   - **Private installer margin slider** (5%–40%) with a live "your net margin" readout that never appears on the client PDF.
   - 3 Quality Tiers:
     - **Economy Tier**: Must / Felicity Hybrid + Felicity LiFePO4 (3,000+ cycles)
     - **Standard Pro Tier**: Deye / Sunsynk Hybrid IP65 + Pylontech LiFePO4 (6,000+ cycles)
     - **Premium Luxury Tier**: Victron Energy MultiPlus-II / Quattro + Freedom Won LiFePO4 (8,000+ cycles)
   - Economic metrics: Monthly fuel avoided (Petrol/Diesel @ Nigerian market rates) and estimated payback period in months.
   - **5-Year Generator vs Solar lifecycle card** proving cumulative fuel + maintenance savings, with the payback month count.

3. **Screen 3: Professional PDF Export**
   - **Three document types from one engine**: Engineering **BOQ quote**, commercial **Invoice**, or **Official Receipt** (reference prefix, title and milestone wording switch automatically).
   - **Company logo upload** — auto-resized and saved on the device, printed in the PDF header beside your company details.
   - **On-screen signature pad** — sign with finger or stylus; the signature is embedded above the "Authorized Signature & Seal" block.
   - Branded PDF with installer company details, phone number, quote reference, and client site details.
   - Itemized Bill of Quantities (BOQ) table with unit prices and grand total.
   - **Payment milestone schedule** (70% mobilization / 20% mounting / 10% commissioning) plus a **5-year fuel-avoided savings banner**.
   - Warranty, DC cable/breaker and roof-footprint notes footed on every quote.

4. **Paystack Paywall**
   - Pay-per-quote (₦2,000) unlock flow or installer demo mode.

5. **Admin / Equipment Price Database**
   - Real-time configuration of equipment prices (panels, lithium batteries, inverters, cables, and installation markup).

---

## 🛠️ Local Development & Testing

Run the interactive web app locally:

```bash
# Start Vite development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

### Engineering engine smoke test

The sizing/tier/economics math and the PDF writer can be verified without a browser:

```bash
npm run smoke
```

It sizes a worked example (3–4 bed residence in Lagos), asserts milestones sum to the tier total, that markup raises price and installer profit, and that solar beats a generator over 5 years.

To also render real PDF bytes for the BOQ / Invoice / Receipt paths:

```bash
node node_modules/esbuild/bin/esbuild scripts/smoke-check.mjs --bundle --platform=node --format=esm --alias:jspdf=./node_modules/jspdf/dist/jspdf.es.min.js --outfile=.tmp-smoke/smoke.mjs
node .tmp-smoke/smoke.mjs
```

---

## 🤖 Cloud APK Build Pipeline (GitHub Actions)

Every push to `main` triggers a complete cloud build:
1. Compiles Vite production bundle
2. Syncs native Capacitor Android project
3. Runs Gradle release assembly on Ubuntu runners
4. Automatically publishes a new GitHub Release with the compiled `.apk` attachment for instant 1-click download.
