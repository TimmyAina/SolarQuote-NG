import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatNaira } from './calculations';

export function generateBOQReport(data) {
  const {
    clientName = "Valued Client",
    clientPhone = "+234 800 000 0000",
    clientAddress = "Nigeria",
    selectedTierIndex = 1,
    calcResult,
    settings
  } = data;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const primaryColor = [15, 118, 110];
  const darkSlate = [15, 23, 42];
  const amberAccent = [245, 158, 11];
  const activeTier = calcResult.tiers[selectedTierIndex];
  const dateStr = new Date().toLocaleDateString('en-GB');
  const quoteRef = "SQ-" + Math.floor(100000 + Math.random() * 900000);

  // Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setFillColor(...amberAccent);
  doc.rect(0, 28, 210, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(settings.installerName.toUpperCase(), 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(204, 251, 241);
  doc.text(`${settings.installerTagline} | Tel: ${settings.installerPhone}`, 14, 18);
  doc.text(`Email: ${settings.installerEmail} | Location: ${settings.installerAddress}`, 14, 24);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text("ENGINEERING BOQ", 196, 13, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(254, 243, 199);
  doc.text(`REF: #${quoteRef} | ${dateStr}`, 196, 20, { align: 'right' });

  // Client & Specs Boxes
  const boxY = 35;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, boxY, 88, 25, 2, 2, 'FD');
  doc.roundedRect(108, boxY, 88, 25, 2, 2, 'FD');

  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text("CLIENT DETAILS:", 18, boxY + 5);
  doc.text("SYSTEM SPECS:", 112, boxY + 5);

  doc.setTextColor(...darkSlate);
  doc.setFontSize(9);
  doc.text(clientName, 18, boxY + 11);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Phone: ${clientPhone}`, 18, boxY + 16);
  doc.text(`Site: ${clientAddress}`, 18, boxY + 21);

  doc.text(`Peak Load: ${(calcResult.totalPeakWatts / 1000).toFixed(2)} kW (${calcResult.totalPeakWatts}W)`, 112, boxY + 11);
  doc.text(`Daily Energy: ${calcResult.totalDailyKWh} kWh/Day`, 112, boxY + 16);
  doc.text(`Inverter: ${calcResult.recommendedInverterKVA} kVA Hybrid Pure Sine`, 112, boxY + 21);

  // Selected Tier Banner
function renderTablesAndFooter(doc, calcResult, activeTier, selectedTierIndex, settings) {
  const primaryColor = [15, 118, 110];
  const darkSlate = [15, 23, 42];

  const boqRows = [
    ['1', `Inverter: ${calcResult.recommendedInverterKVA}kVA Hybrid Pure Sine\n${activeTier.inverterBrand} (Built-in MPPT)`, '1 Unit', formatNaira(activeTier.inverterCost), formatNaira(activeTier.inverterCost)],
    ['2', `Storage: ${calcResult.recommendedBatteryKWh}kWh Lithium LiFePO4\n${activeTier.batteryBrand} (${activeTier.batteryCycles})`, `${calcResult.recommendedBatteryKWh} kWh`, formatNaira(activeTier.batteryCost), formatNaira(activeTier.batteryCost)],
    ['3', `Solar PV: ${activeTier.panelBrand}\n(${activeTier.panelWatt}W x ${activeTier.panelCount} panels = ${activeTier.actualSolarKW}kWp)`, `${activeTier.panelCount} Panels`, formatNaira(Math.round(activeTier.panelCost / activeTier.panelCount)), formatNaira(activeTier.panelCost)],
    ['4', `BOS, Aluminum Racks & Copper Cables\n16mm-25mm DC/AC cables, trunking & MC4s`, 'Full Kit', formatNaira(activeTier.bosCost), formatNaira(activeTier.bosCost)],
    ['5', `Protection Box & Changeover Switch\nAC/DC Surge arresters, isolators & breakers`, '1 Kit', formatNaira(activeTier.protectionCost), formatNaira(activeTier.protectionCost)],
    ['6', `Certified Installation & Commissioning\nEarth pit, cabling, testing & 1-year site audit`, 'Turnkey', formatNaira(activeTier.installationFee), formatNaira(activeTier.installationFee)]
  ];

  doc.autoTable({
    startY: 81,
    head: [['#', 'Item Description', 'Qty', 'Unit Price', 'Total (NGN)']],
    body: boqRows,
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    bodyStyles: { fontSize: 7, textColor: [30, 41, 59], cellPadding: 2 },
    columnStyles: { 0: { cellWidth: 8, halign: 'center' }, 1: { cellWidth: 102 }, 2: { cellWidth: 22, halign: 'center' }, 3: { cellWidth: 25, halign: 'right' }, 4: { cellWidth: 25, halign: 'right', fontStyle: 'bold' } },
    foot: [['', 'GRAND TOTAL (MATERIALS + INSTALLATION)', '', '', formatNaira(activeTier.totalCost)]],
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontSize: 8.5, fontStyle: 'bold', halign: 'right' }
  });

  const nextY = doc.lastAutoTable.finalY + 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...primaryColor);
  doc.text("3-TIER COMPARISON:", 14, nextY);

  const tierRows = calcResult.tiers.map((t, i) => [
    t.name + (i === selectedTierIndex ? " *" : ""),
    t.inverterBrand.split('/')[0],
    t.batteryBrand.split('/')[0],
    `${t.actualSolarKW} kWp`,
    t.warranty,
    formatNaira(t.totalCost)
  ]);

  doc.autoTable({
    startY: nextY + 2,
    head: [['Tier', 'Inverter', 'Battery', 'Solar kWp', 'Warranty', 'Total Cost']],
    body: tierRows,
    theme: 'plain',
    headStyles: { fillColor: [226, 232, 240], textColor: [51, 65, 85], fontSize: 6.5, fontStyle: 'bold' },
    bodyStyles: { fontSize: 6.5, textColor: [71, 85, 105], cellPadding: 1.5 },
    columnStyles: { 5: { halign: 'right', fontStyle: 'bold', textColor: [15, 23, 42] } }
  });

  const footerY = doc.lastAutoTable.finalY + 7;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, footerY, 196, footerY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text("• Validity: 14 days from issue date. Subject to FX rate fluctuations.", 14, footerY + 4);
  doc.text("• Terms: 70% Mobilization, 20% on equipment delivery, 10% on completion.", 14, footerY + 8);
  doc.text("• Quality: LiFePO4 cells with built-in smart active BMS protection.", 14, footerY + 12);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...darkSlate);
  doc.text("Authorized Signature & Seal:", 140, footerY + 5);
  doc.text(`${settings.installerName}`, 140, footerY + 11);
  doc.setFont('helvetica', 'normal');
  doc.text("Engineering Operations", 140, footerY + 15);
}

  const tierY = 64;
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(14, tierY, 182, 13, 2, 2, 'FD');
  doc.setTextColor(21, 128, 61);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`SELECTED: ${activeTier.name.toUpperCase()} (${activeTier.tag})`, 18, tierY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`Monthly Savings: ${formatNaira(calcResult.monthlySavings)} | Payback: ~${calcResult.paybackMonths} Mo | Generator Avoided: ~${formatNaira(calcResult.monthlyFuelAvoided)}/mo`, 18, tierY + 10);

  // Table
  renderTablesAndFooter(doc, calcResult, activeTier, selectedTierIndex, settings);

  return doc;
}
