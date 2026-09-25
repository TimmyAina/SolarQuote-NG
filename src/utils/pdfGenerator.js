// jspdf ships a CJS build whose default export is a namespace object under Node
// ESM, so `new jsPDF()` throws. Named import gives the real constructor in both
// Node and the Vite/browser bundle.
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { formatNaira } from './calculations.js';
import { applyNairaFont } from '../fonts/noto-sans.js';

/**
 * jsPDF's built-in fonts (helvetica etc.) only cover WinAnsi/CP-1252, which has
 * no Naira sign (U+20A6) — so every ₦ silently vanished from exported PDFs.
 * We register Noto Sans (OFL, ships the ₦ glyph) and use it throughout.
 * If embedding ever fails we fall back to an "NGN" prefix rather than a blank.
 */
const PDF_FONT = 'NotoSans';

export function generateBOQReport(data) {
  const {
    clientName = "Valued Client",
    clientPhone = "+234 800 000 0000",
    clientAddress = "Nigeria",
    selectedTierIndex = 1,
    calcResult,
    settings,
    docType = 'boq', // 'boq' | 'invoice' | 'receipt'
    quoteNumber = 0,
    logoBase64 = null,
    signatureBase64 = null
  } = data;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const hasNaira = applyNairaFont(doc);
  const primaryColor = [15, 118, 110];
  const darkSlate = [15, 23, 42];
  const amberAccent = [245, 158, 11];
  const activeTier = calcResult.tiers[selectedTierIndex];
  const dateStr = new Date().toLocaleDateString('en-GB');
  // The quote counter is zero-based: the first quotation is #0.
  const refNum = Number.isFinite(quoteNumber) ? quoteNumber : 0;
  const quoteRef = (docType === 'invoice' ? 'INV-' : docType === 'receipt' ? 'REC-' : 'SQ-') + String(refNum).padStart(4, '0');


  // Top Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setFillColor(...amberAccent);
  doc.rect(0, 28, 210, 2, 'F');

  if (logoBase64) {
    try { doc.addImage(logoBase64, 'PNG', 12, 5, 18, 18); } catch (e) {}
  }

  const textStartX = logoBase64 ? 34 : 14;
  doc.setTextColor(255, 255, 255);
  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(14);
  doc.text(settings.installerName.toUpperCase(), textStartX, 12);

  doc.setFont(PDF_FONT, 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(204, 251, 241);
  doc.text(`${settings.installerTagline} | Tel: ${settings.installerPhone}`, textStartX, 18);
  doc.text(`Email: ${settings.installerEmail} | Location: ${settings.installerAddress}`, textStartX, 24);

  // Title on right side
  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  const docTitle = docType === 'invoice' ? 'COMMERCIAL INVOICE' : docType === 'receipt' ? 'OFFICIAL RECEIPT' : 'ENGINEERING BOQ';
  doc.text(docTitle, 196, 13, { align: 'right' });
  doc.setFont(PDF_FONT, 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(254, 243, 199);
  doc.text(`REF: #${quoteRef} | ${dateStr}`, 196, 20, { align: 'right' });

  // Client Details & Specs Boxes
  const boxY = 34;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, boxY, 88, 24, 2, 2, 'FD');
  doc.roundedRect(108, boxY, 88, 24, 2, 2, 'FD');

  doc.setTextColor(...primaryColor);
  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(7.5);
  doc.text("CLIENT / SITE DETAILS:", 18, boxY + 5);
  doc.text("SYSTEM POWER SPECS:", 112, boxY + 5);

  doc.setTextColor(...darkSlate);
  doc.setFontSize(8.5);
  doc.text(clientName, 18, boxY + 11);
  doc.setFont(PDF_FONT, 'normal');
  doc.setFontSize(7);
  doc.text(`Phone: ${clientPhone}`, 18, boxY + 16);
  doc.text(`Site: ${clientAddress}`, 18, boxY + 20);

  doc.text(`Peak Load: ${(calcResult.totalPeakWatts / 1000).toFixed(2)} kW | Daily: ${calcResult.totalDailyKWh} kWh`, 112, boxY + 11);
  doc.text(`Inverter: ${calcResult.recommendedInverterKVA}kVA | Battery: ${calcResult.recommendedBatteryKWh}kWh LiFePO4`, 112, boxY + 16);
  doc.text(`Solar PV Array: ${activeTier.actualSolarKW} kWp (${activeTier.panelCount} panels)`, 112, boxY + 20);

  // 5-Year Life Cycle & Monthly Avoided Cost Banner
  const tierY = 62;
function renderBOQContent(doc, calcResult, activeTier, selectedTierIndex, settings, signatureBase64, docType) {
  const primaryColor = [15, 118, 110];
  const darkSlate = [15, 23, 42];

  const boqRows = [
    ['1', `Inverter: ${calcResult.recommendedInverterKVA}kVA Hybrid Pure Sine\n${activeTier.inverterBrand} (Built-in MPPT Solar Controller)`, '1 Unit', formatNaira(activeTier.inverterCost), formatNaira(activeTier.inverterCost)],
    ['2', `Storage: ${calcResult.recommendedBatteryKWh}kWh Lithium LiFePO4\n${activeTier.batteryBrand} (${activeTier.batteryCycles})`, `${calcResult.recommendedBatteryKWh} kWh`, formatNaira(activeTier.batteryCost), formatNaira(activeTier.batteryCost)],
    ['3', `Solar PV: ${activeTier.panelBrand}\n(${activeTier.panelWatt}W x ${activeTier.panelCount} panels = ${activeTier.actualSolarKW}kWp)`, `${activeTier.panelCount} Panels`, formatNaira(Math.round(activeTier.panelCost / activeTier.panelCount)), formatNaira(activeTier.panelCost)],
    ['4', `BOS, Aluminum Racks & Heavy DC/AC Cables\n${calcResult.technicalSafety?.recommendedDCCable || '25mm² Pure Copper Flex'}, MC4s & Trunking`, 'Full Kit', formatNaira(activeTier.bosCost), formatNaira(activeTier.bosCost)],
    ['5', `Safety DB & Protection Distribution Kit\n${calcResult.technicalSafety?.recommendedDCBreaker || '125A DC Isolator'}, AC/DC SPD & Changeover`, '1 Kit', formatNaira(activeTier.protectionCost), formatNaira(activeTier.protectionCost)],
    ['6', `Certified Engineering Installation & Commissioning\nEarth pit & rod, AC phase balancing, load testing & 1-year free audit`, 'Turnkey', formatNaira(activeTier.installationFee), formatNaira(activeTier.installationFee)]
  ];

  doc.autoTable({
    startY: 79,
    head: [['#', 'Item Description', 'Qty', 'Unit Price', 'Total (NGN)']],
    body: boqRows,
    theme: 'grid',
    headStyles: { font: PDF_FONT, fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    bodyStyles: { font: PDF_FONT, fontSize: 7, textColor: [30, 41, 59], cellPadding: 2 },
    columnStyles: { 0: { cellWidth: 8, halign: 'center' }, 1: { cellWidth: 102 }, 2: { cellWidth: 22, halign: 'center' }, 3: { cellWidth: 25, halign: 'right' }, 4: { cellWidth: 25, halign: 'right', fontStyle: 'bold' } },
    foot: [['', 'GRAND TOTAL (MATERIALS + CERTIFIED WORKMANSHIP)', '', '', formatNaira(activeTier.totalCost)]],
    footStyles: { font: PDF_FONT, fillColor: [241, 245, 249], textColor: [15, 23, 42], fontSize: 8.5, fontStyle: 'bold', halign: 'right' }
  });

  const nextY = doc.lastAutoTable.finalY + 4;
  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...primaryColor);
  doc.text("PAYMENT MILESTONES (SCHEDULE OF PAYMENTS):", 14, nextY);

  const m = activeTier.milestones || { phase1: Math.round(activeTier.totalCost * 0.7), phase2: Math.round(activeTier.totalCost * 0.2), phase3: Math.round(activeTier.totalCost * 0.1) };
  const milestoneRows = [
    ['Phase 1: 70% Mobilization & Equipment Sourcing', formatNaira(m.phase1), docType === 'receipt' ? 'PAID / SETTLED ✓' : 'Due upon contract agreement'],
    ['Phase 2: 20% Mounting & Inverter Setup', formatNaira(m.phase2), 'Due on equipment site arrival'],
    ['Phase 3: 10% Testing & Final Commissioning', formatNaira(m.phase3), 'Due after 24h successful load run']
  ];

  doc.autoTable({
    startY: nextY + 2,
    head: [['Payment Phase', 'Amount (NGN)', 'Condition / Milestone']],
    body: milestoneRows,
    theme: 'plain',
    headStyles: { font: PDF_FONT, fillColor: [226, 232, 240], textColor: [51, 65, 85], fontSize: 6.5, fontStyle: 'bold' },
    bodyStyles: { font: PDF_FONT, fontSize: 6.5, textColor: [71, 85, 105], cellPadding: 1.5 },
    columnStyles: { 1: { fontStyle: 'bold', textColor: [15, 23, 42] } }
  });

  const footerY = doc.lastAutoTable.finalY + 6;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, footerY, 196, footerY);

  doc.setFont(PDF_FONT, 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text("• Quotation Validity: 14 days from issuance date. Subject to market foreign exchange parity.", 14, footerY + 4);
  doc.text(`• Technical Safety: ${calcResult.technicalSafety?.recommendedDCCable || '25mm² Flex'} with ${calcResult.technicalSafety?.recommendedDCBreaker || '125A DC Isolator'} protection.`, 14, footerY + 8);
  doc.text(`• Roof Footprint: Requires ~${activeTier.roofSpecs?.areaM2 || 24}m² roof space (~${activeTier.roofSpecs?.weightKg || 280}kg dead load). Face South (15° tilt).`, 14, footerY + 12);

  // Signature Block
  if (signatureBase64) {
    try { doc.addImage(signatureBase64, 'PNG', 140, footerY + 1, 26, 10); } catch (e) {}
  }

  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...darkSlate);
  doc.text("Authorized Signature & Seal:", 140, footerY + 12);
  doc.text(`${settings.installerName}`, 140, footerY + 16);
  doc.setFont(PDF_FONT, 'normal');
  doc.text(settings.installerPhone, 140, footerY + 20);
}

  doc.setFillColor(240, 253, 244);
  doc.roundedRect(14, tierY, 182, 13, 2, 2, 'FD');
  doc.setTextColor(21, 128, 61);
  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(8.5);
  doc.text(`PACKAGE: ${activeTier.name.toUpperCase()} (${activeTier.tag})`, 18, tierY + 5);
  doc.setFont(PDF_FONT, 'normal');
  doc.setFontSize(7);
  doc.setTextColor(51, 65, 85);
  doc.text(
    `Monthly Avoided: ${formatNaira(calcResult.economics?.monthlySavings || 0)}/mo | 5-Yr Fuel Savings: ${formatNaira(calcResult.economics?.fiveYearNetSavings || 0)} | Payback: ~${calcResult.economics?.paybackMonths || 14} Mo`,
    18,
    tierY + 10
  );

  renderBOQContent(doc, calcResult, activeTier, selectedTierIndex, settings, signatureBase64, docType);
  return doc;
}
