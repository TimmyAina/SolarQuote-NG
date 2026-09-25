import React, { useState } from 'react';
import { FileDown, ArrowLeft, Lock, CheckCircle2 } from 'lucide-react';
import { generateBOQReport } from '../utils/pdfGenerator';
import { formatNaira } from '../utils/calculations';

export function ScreenPDF({
  calcResult,
  selectedTierIndex,
  settings,
  appliances,
  onBack
}) {
  const [clientName, setClientName] = useState("Alhaji S. Adeleke");
  const [clientPhone, setClientPhone] = useState("+234 802 334 5678");
  const [clientAddress, setClientAddress] = useState("Lekki Phase 1, Lagos");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);

  const activeTier = calcResult.tiers[selectedTierIndex];

  const handleDownloadPDF = () => {
    setIsGenerating(true);
    setTimeout(() => {
      try {
        const doc = generateBOQReport({
          clientName,
          clientPhone,
          clientAddress,
          selectedTierIndex,
          calcResult,
          settings,
          appliances
        });
        doc.save(`SolarQuote_${clientName.replace(/\s+/g, '_')}_BOQ.pdf`);
      } catch (err) {
        console.error("PDF error:", err);
        alert("Failed to create PDF. Please retry.");
      } finally {
        setIsGenerating(false);
      }
    }, 250);
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Client Info Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <h3 className="font-bold text-sm text-slate-200 mb-3">Client & Site Information</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Customer / Project Name</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">WhatsApp / Phone</label>
              <input
                type="text"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">City / Address</label>
              <input
                type="text"
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Installer Branding Preview */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
          Installer Company Header
        </p>
        <h4 className="font-bold text-sm text-white">{settings.installerName}</h4>
        <p className="text-xs text-slate-400">{settings.installerPhone} • {settings.installerAddress}</p>
      </div>

      {/* Action / Paywall Area */}
      <PaywallOrReady
        isUnlocked={isUnlocked}
        isGenerating={isGenerating}
        onPayClick={() => setShowPayModal(true)}
        onSimulateUnlock={() => setIsUnlocked(true)}
        onDownload={handleDownloadPDF}
        activeTier={activeTier}
      />

      {/* Paystack Modal */}
      {showPayModal && (
        <PayModal
          onClose={() => setShowPayModal(false)}
          onConfirm={() => {
            setIsUnlocked(true);
            setShowPayModal(false);
          }}
        />
      )}

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 p-4 z-30 max-w-2xl mx-auto flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-900 text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Edit BOQ</span>
        </button>
        {isUnlocked && (
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold shadow-lg"
          >
            <FileDown className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
        )}
      </div>
    </div>
  );
}

function PaywallOrReady({ isUnlocked, isGenerating, onPayClick, onSimulateUnlock, onDownload, activeTier }) {
  if (isUnlocked) {
    return (
      <div className="bg-emerald-950/60 border border-emerald-600/40 rounded-2xl p-5 text-center">
        <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-2">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <h3 className="font-bold text-base text-white">Quotation Unlocked</h3>
        <p className="text-xs text-slate-300 mt-0.5">Ready for download with {activeTier.name} hardware.</p>
        <button
          type="button"
          onClick={onDownload}
          disabled={isGenerating}
          className="mt-4 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg active:scale-95 transition"
        >
          <FileDown className="w-4 h-4" />
          <span>{isGenerating ? "Building PDF..." : "Download Official BOQ PDF"}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-5 text-center shadow-xl">
      <div className="w-10 h-10 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-2">
        <Lock className="w-5 h-5" />
      </div>
      <h3 className="font-bold text-base text-white">Unlock Export & Branded PDF</h3>
      <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto">
        Generate un-watermarked high-resolution PDF quotes for clients.
      </p>
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2.5">
        <button
          type="button"
          onClick={onPayClick}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg active:scale-95"
        >
          Pay ₦2,000 via Paystack
        </button>
        <button
          type="button"
          onClick={onSimulateUnlock}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
        >
          ⚡ Installer Demo Mode
        </button>
      </div>
    </div>
  );
}

function PayModal({ onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Paystack Checkout</span>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white text-sm">✕</button>
        </div>
        <div className="border-t border-b border-slate-800 py-3">
          <p className="text-xs text-slate-400">Amount:</p>
          <h2 className="text-2xl font-bold text-white font-mono">₦2,000.00</h2>
          <p className="text-xs text-slate-400 mt-1">Single BOQ PDF License</p>
        </div>
        <button
          type="button"
          onClick={onConfirm}
          className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm"
        >
          Authorize ₦2,000 Payment
        </button>
      </div>
    </div>
  );
}
