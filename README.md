# SolarQuote NG — The BOQ App for Nigerian Electricians & Solar Installers

A professional solar sizing, quotation, and Bill of Quantities (BOQ) generation mobile application engineered specifically for Nigerian electricians, engineers, and solar contractors.

---

## ⚡ Direct 1-Click APK Download

- **Latest Release**: [v1.0.1 Direct Download Link](https://github.com/TimmyAina/SolarQuote-NG/releases/tag/v1.0.1)
- **Direct APK File**: [Download app-debug.apk](https://github.com/TimmyAina/SolarQuote-NG/releases/download/v1.0.1/app-debug.apk) (Size: ~3.9 MB)

---

## 🚀 Key Features

1. **Screen 1: Appliance & Load Input**
   - Quick-select facility presets: **School / Training Center**, **3–4 Bed Residence**, **Corporate Office**, or **Custom**.
   - Presets pre-fill fans, bulbs, inverter ACs, deep freezers, pumping machines, TVs, and computers.
   - City solar radiation selector (Port Harcourt: 4.3 PSH, Lagos: 4.8 PSH, Abuja: 5.3 PSH, Kano: 5.8 PSH).
   - Real-time running watt meter and day/night operating hour split.

2. **Screen 2: Sizing Engine & 3-Tier BOQ**
   - Inverter kVA sizing with surge headroom factor (1.25x).
   - Battery kWh calculation factoring depth of discharge (DoD 85%) and efficiency for LiFePO4.
   - Solar array kWp sizing with derating and loss factors (1.28x).
   - 3 Quality Tiers:
     - **Economy Tier**: Must / Felicity Hybrid + Felicity LiFePO4 (3,000+ cycles)
     - **Standard Pro Tier**: Deye / Sunsynk Hybrid IP65 + Pylontech LiFePO4 (6,000+ cycles)
     - **Premium Luxury Tier**: Victron Energy MultiPlus-II / Quattro + Freedom Won LiFePO4 (8,000+ cycles)
   - Economic metrics: Monthly fuel avoided (Petrol/Diesel @ Nigerian market rates) and estimated payback period in months.

3. **Screen 3: Professional PDF Export**
   - Branded PDF with installer company details, phone number, quote reference, and client site details.
   - Itemized Bill of Quantities (BOQ) table with unit prices and grand total.
   - 3-tier side-by-side comparison matrix and warranty terms.

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

---

## 🤖 Cloud APK Build Pipeline (GitHub Actions)

Every push to `main` triggers a complete cloud build:
1. Compiles Vite production bundle
2. Syncs native Capacitor Android project
3. Runs Gradle release assembly on Ubuntu runners
4. Automatically publishes a new GitHub Release with the compiled `.apk` attachment for instant 1-click download.
