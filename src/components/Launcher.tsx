import React from 'react';
import { FileText, FolderOpen, Settings, HelpCircle, ClipboardPen, FileSpreadsheet, CheckCircle2 } from 'lucide-react';

interface LauncherProps {
  hasExistingDraft: boolean;
  isFinished?: boolean;
  currentClientName?: string;
  onNewProposal: () => void;
  onContinueDraft: () => void;
  onLoadFromExcel: () => void;
  onOpenPast: () => void;
  onCompanyProfile: () => void;
  onHowTo: () => void;
}

export const Launcher: React.FC<LauncherProps> = ({
  hasExistingDraft,
  isFinished = false,
  currentClientName,
  onNewProposal,
  onContinueDraft,
  onLoadFromExcel,
  onOpenPast,
  onCompanyProfile,
  onHowTo,
}) => {
  const door = 'flex items-center gap-4 w-full p-5 sm:p-6 rounded-2xl border-2 text-left font-bold text-lg sm:text-xl tracking-wide transition-all cursor-pointer';
  const sub = 'text-xs font-medium mt-1.5 opacity-80';

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center py-10">
      {/* Brand */}
      <div className="text-center mb-10">
        <h1 className="uppercase tracking-tight leading-none">
          <span className="text-4xl sm:text-5xl font-black text-slate-100">Next </span>
          <span className="text-4xl sm:text-5xl font-black text-slate-400">Level</span>
          <span className="text-2xl sm:text-3xl font-semibold tracking-wide text-slate-100 ml-3">Proposal</span>
        </h1>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.22em] mt-3">
          Estimate &bull; Propose &bull; Deliver
        </p>
      </div>

      {/* Doors */}
      <div className="flex flex-col gap-4 w-full max-w-md">
        {hasExistingDraft && (
          <button
            onClick={onContinueDraft}
            className={`${door} ${isFinished ? 'border-emerald-500/60 bg-emerald-500/10 hover:bg-emerald-500/20' : 'border-slate-400/60 bg-slate-400/10 hover:bg-slate-400/20'} text-slate-100`}
          >
            <span className="text-3xl w-10 text-center shrink-0">
              {isFinished ? <CheckCircle2 className="w-9 h-9 text-emerald-400 mx-auto" /> : <ClipboardPen className="w-9 h-9 text-slate-300 mx-auto" />}
            </span>
            <span>
              {isFinished ? `Finished${currentClientName ? `: ${currentClientName}` : ''}` : 'Continue Working'}
              <div className={sub}>{isFinished ? 'Printed and saved. Tap to reopen it and make changes' : 'Pick up your current proposal where you left off'}</div>
            </span>
          </button>
        )}

        <button
          onClick={onNewProposal}
          className={`${door} border-slate-400 bg-slate-300 text-slate-900 hover:bg-slate-200`}
        >
          <span className="text-3xl w-10 text-center shrink-0">
            <FileText className="w-9 h-9 mx-auto" />
          </span>
          <span>
            New Proposal
            <div className={`${sub} text-slate-700`}>Start a fresh proposal from scratch</div>
          </span>
        </button>

        <button
          onClick={onLoadFromExcel}
          className={`${door} border-amber-500/60 bg-amber-500/10 hover:bg-amber-500/20 text-slate-100`}
        >
          <span className="text-3xl w-10 text-center shrink-0">
            <FileSpreadsheet className="w-9 h-9 text-amber-400 mx-auto" />
          </span>
          <span>
            Load From Excel
            <div className={sub}>Read the job numbers off your estimate sheet</div>
          </span>
        </button>

        <button
          onClick={onOpenPast}
          className={`${door} border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-100`}
        >
          <span className="text-3xl w-10 text-center shrink-0">
            <FolderOpen className="w-9 h-9 text-slate-300 mx-auto" />
          </span>
          <span>
            Open a Past Proposal
            <div className={sub}>Reopen, clone, or finish a saved proposal</div>
          </span>
        </button>

        <button
          onClick={onCompanyProfile}
          className={`${door} border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-100`}
        >
          <span className="text-3xl w-10 text-center shrink-0">
            <Settings className="w-9 h-9 text-slate-300 mx-auto" />
          </span>
          <span>
            Company & Logo
            <div className={sub}>Set your company name, header info, and logo</div>
          </span>
        </button>

        <button
          onClick={onHowTo}
          className={`${door} border-slate-800 bg-slate-800/30 hover:bg-slate-800/60 text-slate-200`}
        >
          <span className="text-3xl w-10 text-center shrink-0">
            <HelpCircle className="w-9 h-9 text-slate-400 mx-auto" />
          </span>
          <span>
            How To Use
            <div className={`${sub} text-slate-400`}>Quick guide to building a proposal</div>
          </span>
        </button>
      </div>
    </div>
  );
};