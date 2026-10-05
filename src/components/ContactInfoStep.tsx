import React from 'react';
import { ClientInfo } from '../types';
import { User, MapPin, Phone, Mail, FileText, Calendar, Check, ArrowRight, Sparkles } from 'lucide-react';

interface ContactInfoStepProps {
  clientInfo: ClientInfo;
  notes: string;
  onChangeClientInfo: (info: ClientInfo) => void;
  onChangeNotes: (notes: string) => void;
  onConfirmStep: () => void;
}

export const ContactInfoStep: React.FC<ContactInfoStepProps> = ({
  clientInfo,
  notes,
  onChangeClientInfo,
  onChangeNotes,
  onConfirmStep,
}) => {
  const handleChange = (field: keyof ClientInfo, value: string) => {
    onChangeClientInfo({
      ...clientInfo,
      [field]: value,
    });
  };

  return (
    <div className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 p-5 sm:p-7 shadow-xl space-y-6">
      
      {/* Step Header */}
      <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-4 h-4" /> Step 1: Contact Information
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Customer & Project Details
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Enter initial client details and the project site address.
          </p>
        </div>

        <button
          onClick={onConfirmStep}
          className="self-start sm:self-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-lg flex items-center space-x-2 transition-all cursor-pointer"
        >
          <span>OK & Next Section</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Form Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        
        {/* Client Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-amber-400" />
            Client Name(s) *
          </label>
          <input
            type="text"
            value={clientInfo.clientName}
            onChange={(e) => handleChange('clientName', e.target.value)}
            placeholder="e.g. John Doe"
            className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
          />
        </div>

        {/* Project Site Address */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            Property / Job Site Address *
          </label>
          <input
            type="text"
            value={clientInfo.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="e.g. 14276 N Irish Rd, Millington, MI 48764"
            className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
          />
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-amber-400" />
            Phone Number
          </label>
          <input
            type="text"
            value={clientInfo.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="(989) 882-5058"
            className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
          />
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-amber-400" />
            Email Address
          </label>
          <input
            type="email"
            value={clientInfo.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="e.g. client@example.com"
            className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
          />
        </div>

        {/* Project Name / Scope Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            Project Name / Work Scope
          </label>
          <input
            type="text"
            value={clientInfo.projectSite}
            onChange={(e) => handleChange('projectSite', e.target.value)}
            placeholder="e.g. Main bathroom with tile shower"
            className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
          />
        </div>

        {/* Proposal Date */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            Proposal Date
          </label>
          <input
            type="text"
            value={clientInfo.proposalDate}
            onChange={(e) => handleChange('proposalDate', e.target.value)}
            placeholder="March 28, 2026"
            className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
          />
        </div>
      </div>

      {/* Estimator Notes Box */}
      <div className="space-y-2 pt-2 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Initial Estimator Notes & Special Client Instructions
          </label>
        </div>

        <textarea
          value={notes}
          onChange={(e) => onChangeNotes(e.target.value)}
          rows={3}
          placeholder="Type initial notes about client access, special requests, estimated start window, etc."
          className="w-full bg-slate-800/90 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
        />
      </div>

      {/* Confirmation Footer */}
      <div className="pt-4 border-t border-slate-800 flex justify-end">
        <button
          onClick={onConfirmStep}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-3 rounded-xl shadow-lg flex items-center space-x-2 transition-all cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>OK - Save Info & Proceed to Scope Categories</span>
        </button>
      </div>
    </div>
  );
};
