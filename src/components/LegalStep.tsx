import React from 'react';
import { LegalTerms } from '../types';
import { ShieldCheck, Check, ArrowLeft, ArrowRight, FileText, Lock, DollarSign } from 'lucide-react';

interface LegalStepProps {
  legalTerms: LegalTerms;
  totalEstimate: string;
  onChangeLegalTerms: (terms: LegalTerms) => void;
  onChangeTotalEstimate: (estimate: string) => void;
  onConfirmStep: () => void;
  onPrevStep: () => void;
}

export const LegalStep: React.FC<LegalStepProps> = ({
  legalTerms,
  totalEstimate,
  onChangeLegalTerms,
  onChangeTotalEstimate,
  onConfirmStep,
  onPrevStep,
}) => {
  const handleChange = (field: keyof LegalTerms, value: string) => {
    onChangeLegalTerms({
      ...legalTerms,
      [field]: value,
    });
  };

  return (
    <div className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 p-5 sm:p-7 shadow-xl space-y-6">
      
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Final Step: Automatic Legal Agreements & Signatures
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Contract Terms & Legal Fine Print
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            These standard agreements and signature blocks auto-populate on every proposal sheet automatically.
          </p>
        </div>

        <button
          onClick={onConfirmStep}
          className="self-start sm:self-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-lg flex items-center space-x-2 transition-all cursor-pointer"
        >
          <span>OK & View Completed Sheet</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-5">
        {/* Automatic Legal Terms Text */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-amber-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              Standard Legal Clauses & Terms of Agreement (Auto-Populated)
            </span>
            <span className="text-[11px] text-slate-400 font-normal">Editable if custom clauses needed</span>
          </label>
          <textarea
            value={legalTerms.agreementText}
            onChange={(e) => handleChange('agreementText', e.target.value)}
            rows={8}
            className="w-full bg-slate-800/90 border border-slate-700 rounded-xl p-3.5 text-xs sm:text-sm text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
          />
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/40 space-y-4">
          <label className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            Total Estimate &amp; Payment Schedule
          </label>

          {/* Total estimate — the number the client signs off on. Nothing calculates here. */}
          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
              <DollarSign className="w-3.5 h-3.5 text-amber-400" />
              Total Estimate (Total for Work Described)
            </span>
            <input
              type="text"
              value={totalEstimate}
              onChange={(e) => onChangeTotalEstimate(e.target.value)}
              placeholder="$26,523.00"
              className="w-full sm:w-72 bg-slate-800 border-2 border-amber-500/60 rounded-lg px-4 py-3 text-lg font-black text-amber-300 focus:outline-none focus:border-amber-400 transition-all"
            />
            <p className="text-[11px] text-slate-400">
              Prints at the bottom of the estimate, above the payment schedule. The three payments below split into even thirds automatically — override any line by typing over it. If the scope changes later, that goes through a change order.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1 border-t border-slate-800">
            <div className="space-y-1">
              <span className="text-slate-400 font-medium">Due at signing of contract ($)</span>
              <input
                type="text"
                value={legalTerms.dueAtSigning || ''}
                onChange={(e) => handleChange('dueAtSigning', e.target.value)}
                placeholder="$4,850.00"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-amber-300 font-bold focus:outline-none focus:border-amber-400"
              />
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 font-medium">Due at start of job ($)</span>
              <input
                type="text"
                value={legalTerms.dueAtStart || ''}
                onChange={(e) => handleChange('dueAtStart', e.target.value)}
                placeholder="$21,825.00"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-amber-400"
              />
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 font-medium">Due upon completion of job ($)</span>
              <input
                type="text"
                value={legalTerms.dueUponCompletion || ''}
                onChange={(e) => handleChange('dueUponCompletion', e.target.value)}
                placeholder="$21,825.00"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Payment Schedule */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              Payment Schedule Breakdown
            </label>
            <textarea
              value={legalTerms.paymentSchedule}
              onChange={(e) => handleChange('paymentSchedule', e.target.value)}
              rows={4}
              className="w-full bg-slate-800/90 border border-slate-700 rounded-xl p-3 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-amber-400 transition-all leading-relaxed"
            />
          </div>

          {/* Warranty Terms */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              Craftsmanship Warranty Terms
            </label>
            <textarea
              value={legalTerms.warrantyInfo}
              onChange={(e) => handleChange('warrantyInfo', e.target.value)}
              rows={4}
              className="w-full bg-slate-800/90 border border-slate-700 rounded-xl p-3 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-amber-400 transition-all leading-relaxed"
            />
          </div>
        </div>

        {/* Signature Titles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Contractor Signature Title</label>
            <input
              type="text"
              value={legalTerms.contractorTitle}
              onChange={(e) => handleChange('contractorTitle', e.target.value)}
              className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Client Signature Title</label>
            <input
              type="text"
              value={legalTerms.clientTitle}
              onChange={(e) => handleChange('clientTitle', e.target.value)}
              className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
        <button
          onClick={onPrevStep}
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-xl border border-slate-700 text-xs sm:text-sm font-medium flex items-center space-x-2 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous Section</span>
        </button>

        <button
          onClick={onConfirmStep}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-3 rounded-xl shadow-lg text-xs sm:text-sm flex items-center space-x-2 transition-all cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>OK - Finalize & View Completed Proposal Sheet</span>
        </button>
      </div>
    </div>
  );
};
