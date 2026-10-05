import React, { useState } from 'react';
import { CompanyConfig } from '../types';
import { Settings, Upload, Image, Check, RefreshCw, Building2, Trash2, Sparkles } from 'lucide-react';

interface LogoUploadModalProps {
  companyConfig: CompanyConfig;
  onUpdateCompanyConfig: (config: CompanyConfig) => void;
}

// Takes the pasted "company header block" (the block that appears at the top of a
// printed proposal sheet) and tries to fill in the profile fields automatically.
const parseHeaderBlock = (text: string): Partial<CompanyConfig> => {
  const result: Partial<CompanyConfig> = {};
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return result;

  // First line is almost always the company name.
  result.companyName = lines[0].replace(/^\d+[.)]\s*/, '').trim();

  const rest = lines.slice(1).join('\n');
  const whole = rest;

  // License number (e.g. "License# 2101104482", "License # 12345", "LIC. 1234")
  const licMatch = whole.match(/license\s*[#:. ]*\s*([\dA-Za-z.\-]{3,})/i);
  if (licMatch) result.licenseNumber = `License# ${licMatch[1]}`;

  // Phone number
  const phoneMatch = whole.match(/(\(?\d{3}\)?[-\s.]?\d{3}[-\s.]\d{4})/);
  if (phoneMatch) result.phone = phoneMatch[1];

  // Email
  const emailMatch = whole.match(/[\w.]+@[\w.]+\.[a-z]{2,}/i);
  if (emailMatch) result.email = emailMatch[0];

  // Website
  const webMatch = whole.match(/(?:www\.)[\w.\-]+/i);
  if (webMatch) result.website = webMatch[0];

  // Tagline: the text after the name that is not the license, phone, email, or address.
  const addressLike = /(p\.?\s*o\.?\s*box|street|rd\.?|road|ave\.?|avenue|blvd|dr\.?|lane|clio|dr\b|mi\b|,?\s*\d{5})/i;
  const taglineLines = lines.slice(1).filter((line) => {
    if (/@/.test(line)) return false;
    if (addressLike.test(line)) return false;
    if (/license\s*[#:. ]\s*[\dA-Z]/i.test(line)) return false;
    return true;
  });
  if (taglineLines.length > 0) {
    result.tagline = taglineLines[0]
      .replace(/[•|]\s*$/g, '')
      .replace(new RegExp(`\\s*${(result.licenseNumber || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'i'), '')
      .replace(/[•|]\s*$/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  // Address: look for a P.O. Box / PO Box / street-style line.
  const addressLine = lines.slice(1).find((line) => /(p\.?\s*o\.?\s*box|box\s+\d+|,?\s*(mi|clio)\b)/i.test(line) && !/@/.test(line));
  if (addressLine) result.address = addressLine.replace(/[•|]\s*$/g, '').trim();

  return result;
};

export const LogoUploadModal: React.FC<LogoUploadModalProps> = ({
  companyConfig,
  onUpdateCompanyConfig,
}) => {
  const [config, setConfig] = useState<CompanyConfig>(companyConfig);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteSuccess, setPasteSuccess] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setConfig((prev) => ({
        ...prev,
        logoUrl: dataUrl,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleFillFromPaste = () => {
    if (!pasteText.trim()) return;
    const parsed = parseHeaderBlock(pasteText);
    setConfig((prev) => ({ ...prev, ...parsed }));
    setPasteSuccess(true);
    setTimeout(() => setPasteSuccess(false), 3000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCompanyConfig(config);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-6 max-w-2xl mx-auto">

      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
          <Building2 className="w-4 h-4" /> Company Profile
        </span>
        <h2 className="text-xl font-bold text-white mt-1">
          Your Company Details & Logo
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          This appears at the top of every proposal sheet you print. Saved in this browser — no login needed.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">

        {/* Paste Company Header Block */}
        <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-2">
          <label className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Paste Your Existing Company Header Block
          </label>
          <p className="text-[11px] text-slate-400">
            Copy the name/address/phone/license block from a past proposal and paste it here — the fields below will fill in automatically.
          </p>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={4}
            placeholder={'e.g.\nYour Company Name\nLicensed • Insured • License# 12345\nP.O. Box 1234 • City, State 12345\nPhone: (555) 123-4567 • Email: you@example.com • www.yourcompany.com'}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-400 transition-all leading-relaxed"
          />
          <div className="flex items-center justify-between">
            {pasteSuccess ? (
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <Check className="w-4 h-4" /> Fields filled — double-check below
              </span>
            ) : (
              <span className="text-[11px] text-slate-500">Auto-fills: name, license, phone, email, website, address</span>
            )}
            <button
              type="button"
              onClick={handleFillFromPaste}
              disabled={!pasteText.trim()}
              className="bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold px-4 py-2 rounded-xl border border-slate-700 disabled:opacity-40 transition-all cursor-pointer"
            >
              Fill From Pasted Block
            </button>
          </div>
        </div>

        {/* Logo Upload Box */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
            <Image className="w-3.5 h-3.5 text-amber-400" />
            Company Logo Image (shown above the name on the proposal)
          </label>

          <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
            {/* Logo Preview Frame */}
            <div className="w-28 h-28 rounded-xl bg-white p-2 border border-slate-700 flex items-center justify-center shrink-0 shadow-md overflow-hidden">
              {config.logoUrl ? (
                <img
                  src={config.logoUrl}
                  alt="Company Logo"
                  className="max-h-full max-w-full object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-xs text-slate-400 text-center">No image yet</span>
              )}
            </div>

            <div className="space-y-2 text-center sm:text-left flex-1">
              <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2">
                <label className="cursor-pointer bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl shadow-md inline-flex items-center space-x-2 transition-all">
                  <Upload className="w-4 h-4" />
                  <span>{config.logoUrl ? 'Replace Image' : 'Add Image'}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>

                {config.logoUrl && (
                  <button
                    type="button"
                    onClick={() => setConfig((prev) => ({ ...prev, logoUrl: '' }))}
                    className="bg-slate-800 hover:bg-rose-900/60 text-rose-300 text-xs font-bold px-4 py-2 rounded-xl border border-slate-700 inline-flex items-center space-x-2 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Remove</span>
                  </button>
                )}
              </div>

              <p className="text-[11px] text-slate-400">
                Upload your logo (PNG / JPG). It is stored in this browser and printed at the top of every proposal sheet.
              </p>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Company Name</label>
            <input
              type="text"
              value={config.companyName}
              onChange={(e) => setConfig({ ...config, companyName: e.target.value })}
              placeholder="e.g. Your Company Name LLC"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Tagline</label>
            <input
              type="text"
              value={config.tagline}
              onChange={(e) => setConfig({ ...config, tagline: e.target.value })}
              placeholder="e.g. Licensed & Insured"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">License Number</label>
            <input
              type="text"
              value={config.licenseNumber}
              onChange={(e) => setConfig({ ...config, licenseNumber: e.target.value })}
              placeholder="e.g. License# 123456"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Phone Number</label>
            <input
              type="text"
              value={config.phone}
              onChange={(e) => setConfig({ ...config, phone: e.target.value })}
              placeholder="e.g. (555) 123-4567"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Email Address</label>
            <input
              type="text"
              value={config.email}
              onChange={(e) => setConfig({ ...config, email: e.target.value })}
              placeholder="e.g. you@example.com"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Website</label>
            <input
              type="text"
              value={config.website}
              onChange={(e) => setConfig({ ...config, website: e.target.value })}
              placeholder="e.g. www.yourcompany.com"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-semibold text-slate-300">Office / Business Address</label>
            <input
              type="text"
              value={config.address}
              onChange={(e) => setConfig({ ...config, address: e.target.value })}
              placeholder="e.g. P.O. Box 1234 • City, State 12345"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Action button */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          {saveSuccess && (
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
              <Check className="w-4 h-4" /> Company Profile Saved!
            </span>
          )}

          <div className="ml-auto flex items-center space-x-2">
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl shadow-lg text-xs sm:text-sm flex items-center space-x-2 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save Company Profile</span>
            </button>
          </div>
        </div>

      </form>
    </div>
  );
};