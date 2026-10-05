import React from 'react';
import { Proposal } from '../types';

interface ContractFormsProps {
  proposal: Proposal;
}

// A clean printable "back sheet" header, matching the proposal's simple look.
const FormHeader: React.FC<{ companyConfig: Proposal['companyConfig']; title?: string }> = ({ companyConfig, title }) => {
  return (
    <div className="text-center">
      {companyConfig.logoUrl && (
        <div className="flex justify-center mb-4">
          <img
            src={companyConfig.logoUrl}
            alt={companyConfig.companyName}
            className="max-h-24 max-w-full object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
      )}
      <h1 className="text-xl font-bold text-slate-900 uppercase tracking-wide">
        {companyConfig.companyName || 'Contractor'}
      </h1>
      <p className="text-xs font-semibold text-slate-800 mt-1">
        {companyConfig.tagline ? `${companyConfig.tagline}` : ''}
        {companyConfig.tagline && companyConfig.licenseNumber ? ' • ' : ''}
        {companyConfig.licenseNumber || ''}
      </p>
      {companyConfig.address && <p className="text-xs text-slate-700 mt-0.5">{companyConfig.address}</p>}
      {(companyConfig.phone || companyConfig.email || companyConfig.website) && (
        <p className="text-xs text-slate-700 mt-0.5">
          {companyConfig.phone ? `Phone:  ${companyConfig.phone}` : ''}
          {companyConfig.phone && companyConfig.email ? ' • ' : ''}
          {companyConfig.email ? `Email: ${companyConfig.email}` : ''}
          {companyConfig.email && companyConfig.website ? ' • ' : ''}
          {companyConfig.website || ''}
        </p>
      )}
    </div>
  );
};

const PageBreak: React.FC = () => <div className="page-break" />;

export const ContractForms: React.FC<ContractFormsProps> = ({ proposal }) => {
  const { companyConfig, clientInfo } = proposal;

  return (
    <div className="space-y-10">
      {/* ============ RIGHT TO RESCIND ============ */}
      <div className="printable-sheet bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 p-6 sm:p-10 md:p-12 max-w-4xl mx-auto font-sans print:overflow-visible print:border-none print:shadow-none print:p-0 print:m-0">
        <FormHeader companyConfig={companyConfig} />

        <div className="border-t border-slate-300 my-5"></div>

        <h2 className="text-center text-sm font-bold text-slate-900 uppercase tracking-wide">
          Notice to Customer Required by Federal Law
        </h2>

        <p className="text-sm text-slate-800 mt-4 leading-relaxed">
          Today, ____________________, you have entered into a deal which Federal Law gives you the
          right to cancel, if you want, with no penalty or compulsion at any time within three business
          days from the date mentioned above.
        </p>

        <p className="text-sm text-slate-800 mt-3 leading-relaxed">
          By canceling this deal, any lien, mortgage or other security interest that results from this
          deal is negated automatically. Any upfront payment or other considerations you may have made
          for this transaction must be paid back to you in the event you revoke.
        </p>

        <p className="text-sm text-slate-800 mt-3 leading-relaxed">
          If you want to cancel this deal, you may do so by informing the following party:
        </p>

        <div className="text-sm text-slate-800 mt-3 leading-relaxed">
          <p className="font-semibold">{companyConfig.companyName || 'Contractor'}</p>
          <p>{companyConfig.address || ''}</p>
          <p>{companyConfig.phone || ''}</p>
        </div>

        <p className="text-sm text-slate-800 mt-3 leading-relaxed">
          By post or telegram before midnight (three days from now), or by other written form of notice
          sent to the address mentioned above no later than midnight (three days from now).
        </p>

        <p className="text-sm text-slate-800 mt-3 leading-relaxed">
          Please acknowledge the receipt of this notice by signing the form indicated below.
        </p>

        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mt-6">
          Acknowledgement of Receipt of Notice
        </h3>

        <p className="text-sm text-slate-800 mt-2 leading-relaxed">
          Each of the undersigned hereby accepts the receipt of two filled copies of this Notice of
          Right of Recission.
        </p>

        <div className="mt-8 space-y-8">
          <div>
            <div className="border-b border-slate-800"></div>
            <p className="text-xs font-semibold text-slate-800 mt-1">Date: ______________________</p>
          </div>
          <div>
            <div className="border-b border-slate-800"></div>
            <p className="text-xs font-semibold text-slate-800 mt-1">Date: ______________________</p>
          </div>
        </div>
      </div>

      {/* ============ PHOTO / MEDIA RELEASE ============ */}
      <PageBreak />
      <div className="printable-sheet bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 p-6 sm:p-10 md:p-12 max-w-4xl mx-auto font-sans print:overflow-visible print:border-none print:shadow-none print:p-0 print:m-0">
        <FormHeader companyConfig={companyConfig} />

        <div className="border-t border-slate-300 my-5"></div>

        <div className="text-sm text-slate-800 space-y-1.5">
          <p>
            <span className="font-semibold">Job:</span> {clientInfo.projectSite || clientInfo.address || '________________'}
          </p>
          <p>
            <span className="font-semibold">Name:</span> {clientInfo.clientName || '________________'}
          </p>
          <p>
            <span className="font-semibold">Address:</span> {clientInfo.address || '________________'}
          </p>
          <p>
            <span className="font-semibold">City, State zip:</span> ________________
          </p>
        </div>

        <p className="text-sm text-slate-800 mt-6 leading-relaxed">
          {companyConfig.companyName || 'The contractor'} has your permission to use photos of your
          remodeling project on our advertising sites and social media.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-8">
          <div>
            <div className="border-b border-slate-800 h-8"></div>
            <p className="text-xs font-semibold text-slate-800 mt-1">Customer signature &nbsp;&nbsp; Date: ______</p>
          </div>
          <div>
            <div className="border-b border-slate-800 h-8"></div>
            <p className="text-xs font-semibold text-slate-800 mt-1">Contractor signature &nbsp;&nbsp; Date: ______</p>
          </div>
        </div>
      </div>

      {/* ============ CHANGE ORDER ============ */}
      <PageBreak />
      <div className="printable-sheet bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 p-6 sm:p-10 md:p-12 max-w-4xl mx-auto font-sans print:overflow-visible print:border-none print:shadow-none print:p-0 print:m-0">
        <FormHeader companyConfig={companyConfig} />

        <div className="border-t border-slate-300 my-5"></div>

        <h2 className="text-center text-lg font-bold text-slate-900 uppercase tracking-wide">
          Change Order
        </h2>

        <p className="text-sm text-slate-800 mt-4">
          <span className="font-semibold">Job Name:</span> {clientInfo.clientName || '________________'}
        </p>

        <div className="border-b border-slate-800 mt-3"></div>
        <div className="mt-10 min-h-[160px] border border-slate-300 rounded p-3"></div>

        <div className="mt-6">
          <p className="text-sm text-slate-800">
            <span className="font-semibold">Price:</span> ____________
          </p>
          <p className="text-sm text-slate-800 mt-1">
            Balance to be added to final payment
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-8">
          <div>
            <div className="border-b border-slate-800 h-8"></div>
            <p className="text-xs font-semibold text-slate-800 mt-1">Customer signature &nbsp;&nbsp; Date: ______</p>
          </div>
          <div>
            <div className="border-b border-slate-800 h-8"></div>
            <p className="text-xs font-semibold text-slate-800 mt-1">Contractor signature &nbsp;&nbsp; Date: ______</p>
          </div>
        </div>
      </div>
    </div>
  );
};