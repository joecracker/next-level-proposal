import React from 'react';
import { Proposal } from '../types';
import { Edit3 } from 'lucide-react';
import { triggerSafePrint } from '../printUtils';
import { formatMoneyPlain, parseMoneyToCents } from '../lib/money';
import { CompanyHeader } from './CompanyHeader';

interface DocumentPreviewProps {
  proposal: Proposal;
  onEditSection: (sectionIndex: number) => void;
  onOpenCategoryModal?: (category: any) => void;
  onPrint?: () => void;
}

/** A stored money string as "$ 46,901.00", or a blank to write on by hand. */
const moneyOrBlank = (value?: string) => {
  const cents = parseMoneyToCents(value || '');
  return cents === null ? '$  __________' : `$ ${formatMoneyPlain(cents)}`;
};

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  proposal,
  onEditSection,
  onOpenCategoryModal,
  onPrint,
}) => {
  const { companyConfig, clientInfo, categories, legalTerms, totalEstimate, notes } = proposal;

  const handlePrint = () => {
    if (onPrint) { onPrint(); return; }
    triggerSafePrint(proposal);
  };

  const filledCategories = categories.filter((cat) => cat.items.length > 0);

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

      {/* Printable Sheet — plain, mirrors the boss's document. No colour, no rules. */}
      <div className="printable-sheet bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 sm:p-10 md:p-16 max-w-4xl mx-auto text-[12pt] leading-[1.4] relative overflow-hidden print:overflow-visible print:border-none print:shadow-none print:p-0 print:m-0">

        {/* 1. Company header: the look is set per company on the Company & Logo screen */}
        <CompanyHeader companyConfig={companyConfig} />

        {/* 2. Customer, then the one line naming the job */}
        <div className="mt-12">
          <p className="font-bold">
            {[clientInfo.clientName, clientInfo.address, clientInfo.phone].filter(Boolean).join('  ')}
          </p>
          <p className="mt-4">
            <span className="font-bold">work to be done:</span> {clientInfo.projectSite || '______________________________'}
          </p>
        </div>

        {/* 3. Scope sections — bold sentence-case heading, real bullet dots */}
        <div className="mt-10 space-y-6">
          {filledCategories.map((cat) => (
            <div key={cat.id} className="page-break-inside-avoid">
              <p className="font-bold">{cat.name}:</p>
              <ul className="list-disc ml-8 mt-1 space-y-0.5">
                {cat.items.map((item) => (
                  <li key={item.id}>{item.text}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* 4. Money block — labels left, figures in one right-hand column */}
        <div className="mt-10 grid grid-cols-[1fr_auto] gap-y-1 gap-x-6 max-w-[560px] page-break-inside-avoid">
          <span>Total for all work described above:</span>
          <span className="text-right">{moneyOrBlank(totalEstimate)}</span>
          <span>Due at signing of contract:</span>
          <span className="text-right">{moneyOrBlank(legalTerms.dueAtSigning)}</span>
          <span>Due at start of job:</span>
          <span className="text-right">{moneyOrBlank(legalTerms.dueAtStart)}</span>
          <span>Due upon completion of job:</span>
          <span className="text-right">{moneyOrBlank(legalTerms.dueUponCompletion)}</span>
        </div>

        {/* 5. Special note (only when there is one) */}
        {notes && (
          <div className="mt-10 page-break-inside-avoid">
            <p className="font-bold">Special note:</p>
            <p className="mt-1 whitespace-pre-line">{notes}</p>
          </div>
        )}

        {/* 6. Payment note / legal statement */}
        {legalTerms.agreementText && (
          <div className="mt-6 page-break-inside-avoid">
            <p>{legalTerms.agreementText}</p>
          </div>
        )}

        {/* 7. Signature block — plain underscores, captions below, no ruled lines */}
        <div className="mt-16 page-break-inside-avoid">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-16 gap-y-10">
            <div>
              <p>_________________________________</p>
              <p className="mt-1 flex justify-between max-w-[21rem]">
                <span>Contractor signature</span>
                <span>Date</span>
              </p>
            </div>
            <div>
              <p>_________________________________</p>
              <p className="mt-1 flex justify-between max-w-[21rem]">
                <span>Customer signature</span>
                <span>Date</span>
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
