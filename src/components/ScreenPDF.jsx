import React, { useState } from 'react';
import { FileDown, ArrowLeft, Lock, CheckCircle2, ImagePlus, Trash2, PenLine, AlertTriangle, Share2 } from 'lucide-react';
import { generateBOQReport } from '../utils/pdfGenerator';
import { exportPDF, isNativePlatform } from '../utils/pdfExport';
import { formatNaira } from '../utils/calculations';
import { SignaturePad } from './SignaturePad';

export function ScreenPDF({
  calcResult,
  selectedTierIndex,
  settings,
  setSettings,
  appliances,
  onBack
}) {
  const [clientName, setClientName] = useState("Alhaji S. Adeleke");
  const [clientPhone, setClientPhone] = useState("+234 802 334 5678");
  const [clientAddress, setClientAddress] = useState("Lekki Phase 1, Lagos");
  const [docType, setDocType] = useState('boq');
  const [signatureBase64, setSignatureBase64] = useState(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [exportError, setExportError] = useState(null);

  const activeTier = calcResult.tiers[selectedTierIndex];

  const handleLogoUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 400;
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        setSettings(prev => ({ ...prev, installerLogo: canvas.toDataURL('image/png') }));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveLogo = () => {
    setSettings(prev => ({ ...prev, installerLogo: null }));
  };

  const handleDownloadPDF = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setExportError(null);
    try {
      const doc = generateBOQReport({
        clientName,
        clientPhone,
        clientAddress,
        selectedTierIndex,
        calcResult,
        settings,
        docType,
        logoBase64: settings.installerLogo || null,
        signatureBase64
      });
      const prefix = docType === 'invoice' ? 'Invoice' : docType === 'receipt' ? 'Receipt' : 'BOQ';
      const result = await exportPDF(doc, `SolarQuote_${clientName}_${prefix}`);

      if (result.method === 'saved') {
        setExportError("PDF saved to the app cache folder. Reopen the app to export again.");
      }
    } catch (err) {
      console.error("PDF error:", err);
      setExportError(`Could not create the PDF: ${err?.message || 'unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
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

      {/* Document Type Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <h3 className="font-bold text-sm text-slate-200 mb-2">Document Type</h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'boq', label: 'BOQ Quote', note: 'Engineering breakdown' },
            { id: 'invoice', label: 'Invoice', note: 'Commercial billing' },
            { id: 'receipt', label: 'Receipt', note: 'Payment confirmation' }
          ].map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setDocType(t.id)}
              className={`py-2 rounded-xl border text-center transition-all ${
                docType === t.id
                  ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <span className="block text-xs font-bold">{t.label}</span>
              <span className="block text-[10px] mt-0.5 opacity-80">{t.note}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Installer Branding & Logo */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
          Installer Company Header
        </p>
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
            {settings.installerLogo ? (
              <img src={settings.installerLogo} alt="Company logo" className="w-full h-full object-contain" />
            ) : (
              <ImagePlus className="w-5 h-5 text-slate-600" />
            )}
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-sm text-white truncate">{settings.installerName}</h4>
            <p className="text-xs text-slate-400 truncate">
              {settings.installerPhone} • {settings.installerAddress}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex-1 text-center py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-semibold text-slate-300 cursor-pointer hover:border-emerald-500/60">
            <span>{settings.installerLogo ? 'Replace Logo' : 'Upload Company Logo'}</span>
            <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
          </label>
          {settings.installerLogo && (
            <button
              type="button"
              onClick={handleRemoveLogo}
              className="p-2 rounded-xl bg-rose-950/60 border border-rose-900 text-rose-400"
              title="Remove logo"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="text-[11px] text-slate-500">
          Saved on this device and printed in the PDF header above your company details.
        </p>
      </div>

      {/* Signature */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-400">Authorized Signature</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Sign on screen to seal the PDF quote</p>
          </div>
          <button
            type="button"
            onClick={() => setShowSignaturePad(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold"
          >
            <PenLine className="w-3.5 h-3.5" />
            <span>{signatureBase64 ? 'Re-sign' : 'Sign Here'}</span>
          </button>
        </div>

        {signatureBase64 ? (
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-white rounded-xl p-1.5 border border-slate-700">
              <img src={signatureBase64} alt="Signature" className="h-12 w-full object-contain" />
            </div>
            <button
              type="button"
              onClick={() => setSignatureBase64(null)}
              className="p-2 rounded-xl bg-rose-950/60 border border-rose-900 text-rose-400"
              title="Clear signature"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <p className="text-[11px] text-slate-500">
            No signature attached yet — the PDF will foot with your company name only.
          </p>
        )}
      </div>

      {/* Action / Paywall Area */}
      {exportError && (
        <div className="bg-rose-950/60 border border-rose-600/40 rounded-2xl p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-rose-200 leading-relaxed">{exportError}</p>
        </div>
      )}
      <PaywallOrReady
        isUnlocked={isUnlocked}
        isGenerating={isGenerating}
        onPayClick={() => setShowPayModal(true)}
        onSimulateUnlock={() => setIsUnlocked(true)}
        onDownload={handleDownloadPDF}
        activeTier={activeTier}
        docType={docType}
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

      {/* Signature Pad Modal */}
      {showSignaturePad && (
        <SignaturePad
          onSave={(dataUrl) => {
            setSignatureBase64(dataUrl);
            setShowSignaturePad(false);
          }}
          onCancel={() => setShowSignaturePad(false)}
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

function PaywallOrReady({ isUnlocked, isGenerating, onPayClick, onSimulateUnlock, onDownload, activeTier, docType = 'boq' }) {
  const docLabel = docType === 'invoice' ? 'Invoice' : docType === 'receipt' ? 'Receipt' : 'BOQ Quotation';
  const isNative = isNativePlatform();
  const actionLabel = isGenerating
    ? "Building PDF..."
    : isNative
      ? `Save & Share ${docLabel}`
      : `Download ${docLabel} PDF`;
  const ActionIcon = isNative ? Share2 : FileDown;
  if (isUnlocked) {
    return (
      <div className="bg-emerald-950/60 border border-emerald-600/40 rounded-2xl p-5 text-center">
        <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-2">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <h3 className="font-bold text-base text-white">{docLabel} Unlocked</h3>
        <p className="text-xs text-slate-300 mt-0.5">Ready for download with {activeTier.name} hardware.</p>
        <button
          type="button"
          onClick={onDownload}
          disabled={isGenerating}
          className="mt-4 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg active:scale-95 transition"
        >
          <ActionIcon className="w-4 h-4" />
          <span>{actionLabel}</span>
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
