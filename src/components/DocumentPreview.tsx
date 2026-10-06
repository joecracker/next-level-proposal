import React from 'react';
import { Proposal } from '../types';
import { Edit3 } from 'lucide-react';
import { triggerSafePrint } from '../printUtils';

interface DocumentPreviewProps {
  proposal: Proposal;
  onEditSection: (sectionIndex: number) => void;
  onOpenCategoryModal?: (category: any) => void;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  proposal,
  onEditSection,
  onOpenCategoryModal,
}) => {
  const { companyConfig, clientInfo, categories, legalTerms, totalEstimate, notes } = proposal;
  const logoToDisplay = companyConfig.logoUrl || '';

  const handlePrint = () => {
    triggerSafePrint(proposal);
  };

  return (
    <div className="space-y-6">
      {/* Top Edit Controls (Hidden during Print) */}
      <div className="print:hidden flex justify-between items-center mb-4">
        <button
          onClick={() => onEditSection(0)}
          className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-amber-500/30 shadow-lg px-4 py-2.5 rounded-xl text-sm font-bold flex items-center space-x-2 transition-all cursor-pointer"
        >
          <Edit3 className="w-4 h-4 text-amber-400" />
          <span>Edit Sections</span>
        </button>
        <button
          onClick={handlePrint}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl shadow-lg text-sm flex items-center space-x-2 transition-all cursor-pointer"
        >
          <span>Print / PDF</span>
        </button>
      </div>

      {/* Printable Sheet — clean, simple, mirrors the boss's template */}
      <div className="printable-sheet bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 p-6 sm:p-10 md:p-16 max-w-4xl mx-auto font-sans relative overflow-hidden print:overflow-visible print:border-none print:shadow-none print:p-0 print:m-0">

        {/* 1. Logo & Company Header — centered, plain */}
        <div className="text-center">
          {logoToDisplay ? (
            <div className="flex justify-center mb-5">
              <img
                src={logoToDisplay}
                alt={companyConfig.companyName}
                className="max-h-40 max-w-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : null}

          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 uppercase tracking-wide">
            {companyConfig.companyName || 'Contractor'}
          </h1>
          <p className="text-sm font-semibold text-slate-800 mt-2">
            {companyConfig.tagline ? `${companyConfig.tagline}` : ''}
            {companyConfig.tagline && companyConfig.licenseNumber ? ' • ' : ''}
            {companyConfig.licenseNumber || ''}
          </p>
          {companyConfig.address && (
            <p className="text-sm text-slate-700 mt-0.5">{companyConfig.address}</p>
          )}
          {(companyConfig.phone || companyConfig.email || companyConfig.website) && (
            <p className="text-sm text-slate-700 mt-0.5">
              {companyConfig.phone ? `Phone:  ${companyConfig.phone}` : ''}
              {companyConfig.phone && companyConfig.email ? ' • ' : ''}
              {companyConfig.email ? `Email: ${companyConfig.email}` : ''}
              {companyConfig.email && companyConfig.website ? ' • ' : ''}
              {companyConfig.website || ''}
            </p>
          )}
        </div>

        {/* Thin clean rule */}
        <div className="border-t border-slate-300 my-6 print:my-4"></div>

        {/* 2. Client / Job line (clean, single line) */}
        <div className="text-center text-sm text-slate-800 mb-6">
          <span className="font-semibold">
            {clientInfo.clientName ? `Prepared for  ${clientInfo.clientName}` : ''}
            {clientInfo.clientName && clientInfo.address ? `  •  ${clientInfo.address}` : ''}
            {!clientInfo.clientName && clientInfo.address ? clientInfo.address : ''}
          </span>
        </div>

        {/* 3. Scope Categories — plain headings, like the template's "Carpentry:" etc. */}
        <div className="space-y-5">
          {categories.map((cat) => (
            <div key={cat.id} className="page-break-inside-avoid">
              <h4 className="text-base font-bold text-slate-900">
                {cat.name}:
              </h4>
              {cat.items.length > 0 ? (
                <ul className="mt-1.5 space-y-1 list-none">
                  {cat.items.map((item) => (
                    <li key={item.id} className="text-sm text-slate-800 ml-5 indent-0">
                      {item.text}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-400 italic ml-5">Standard contract terms apply</p>
              )}
            </div>
          ))}
        </div>

        {/* 4. Payment breakdown — total first, then due lines (as on the paper) */}
        <div className="mt-7 space-y-1.5 text-sm page-break-inside-avoid">
          <p className="font-semibold text-slate-900">
            Total for work described above: {totalEstimate ? ` $${totalEstimate.replace('$', '')}` : '$  __________'}
          </p>
          <p className="text-slate-800">
            Due at signing of contract: {legalTerms.dueAtSigning ? ` $${legalTerms.dueAtSigning.replace('$', '')}` : '$  __________'}
          </p>
          <p className="text-slate-800">
            Due at start of job: {legalTerms.dueAtStart ? ` $${legalTerms.dueAtStart.replace('$', '')}` : '$  __________'}
          </p>
          <p className="text-slate-800">
            Due on completion of job: {legalTerms.dueUponCompletion ? ` $${legalTerms.dueUponCompletion.replace('$', '')}` : '$  __________'}
          </p>
        </div>

        {/* 5. Estimator notes (only if filled) */}
        {notes && (
          <div className="mt-5 page-break-inside-avoid">
            <p className="text-sm text-slate-800 italic leading-relaxed whitespace-pre-line">
              {notes}
            </p>
          </div>
        )}

        {/* 6. Payment notes / legal statement — solid, unchanged */}
        <div className="mt-6 text-sm text-slate-800 leading-relaxed page-break-inside-avoid">
          <p>
            {legalTerms.agreementText}
          </p>
        </div>

        {/* 7. Signature block — two signature lines */}
        <div className="mt-12 pt-6 border-t border-slate-300 page-break-inside-avoid">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
            {/* Contractor */}
            <div>
              <div className="border-b border-slate-800 h-10"></div>
              <p className="text-xs font-semibold text-slate-800 mt-1">
                Contractor signature: ______________________ &nbsp;&nbsp; Date: ________
              </p>
            </div>
            {/* Customer */}
            <div>
              <div className="border-b border-slate-800 h-10"></div>
              <p className="text-xs font-semibold text-slate-800 mt-1">
                Customer signature: ______________________ &nbsp;&nbsp; Date: ________
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};