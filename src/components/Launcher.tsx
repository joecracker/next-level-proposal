import React, { useState } from 'react';
import { FileText, FolderOpen, Settings, HelpCircle, FileSpreadsheet, Building2, ChevronRight } from 'lucide-react';
import { Proposal } from '../types';
import { proposalDisplayName } from '../lib/proposalName';

interface LauncherProps {
  /** Proposals that are started but not finished, most recent first. */
  inProgress: Proposal[];
  /** How many saved proposals there are in all (finished and in progress). */
  pastCount: number;
  onNewProposal: () => void;
  onOpenInProgress: (proposal: Proposal) => void;
  onLoadFromExcel: () => void;
  onOpenPast: () => void;
  onCompanyProfile: () => void;
  onHowTo: () => void;
}

const MAX_SHOWN = 4;

export const Launcher: React.FC<LauncherProps> = ({
  inProgress,
  pastCount,
  onNewProposal,
  onOpenInProgress,
  onLoadFromExcel,
  onOpenPast,
  onCompanyProfile,
  onHowTo,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const door = 'flex items-center gap-4 w-full p-4 sm:p-5 rounded-2xl border-2 text-left font-bold text-lg sm:text-xl tracking-wide transition-all cursor-pointer';
  const sub = 'text-xs font-medium mt-1 opacity-80';
  const shown = inProgress.slice(0, MAX_SHOWN);
  const hidden = inProgress.length - shown.length;

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center py-6">
      {/* Brand */}
      <div className="text-center mb-7">
        <h1 className="uppercase tracking-tight leading-none">
          <span className="text-4xl sm:text-5xl font-black text-slate-100">Next </span>
          <span className="text-4xl sm:text-5xl font-black text-slate-400">Level</span>
          <span className="text-2xl sm:text-3xl font-semibold tracking-wide text-slate-100 ml-3">Proposal</span>
        </h1>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.22em] mt-3">
          Estimate &bull; Propose &bull; Deliver
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-md">
        {/* The two you use every day */}
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

        {/* Started but not finished */}
        {shown.length > 0 && (
          <div className="mt-3">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.18em] mb-2 px-1">
              Pick up where you left off
            </div>
            <div className="flex flex-col gap-2">
              {shown.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onOpenInProgress(p)}
                  className="flex items-center justify-between gap-3 w-full px-4 py-3 rounded-xl border border-slate-600 bg-slate-800/70 hover:bg-slate-800 text-left transition-all cursor-pointer"
                >
                  <span className="min-w-0">
                    <span className="block font-bold text-slate-100 truncate">
                      {proposalDisplayName(p)}
                    </span>
                    <span className="block text-xs text-slate-400 truncate">
                      {p.updatedAt ? 'Last worked on ' + p.updatedAt : 'Not saved yet'}
                    </span>
                  </span>
                  <span className="flex items-center gap-2 shrink-0">
                    <span className="bg-amber-500 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                      In progress
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </span>
                </button>
              ))}
            </div>
            {hidden > 0 && (
              <div className="text-xs text-slate-500 mt-2 px-1">
                + {hidden} more in All past proposals
              </div>
            )}
          </div>
        )}

        {/* Small stuff */}
        <div className="flex items-center justify-between mt-4 px-1 text-sm">
          <button
            onClick={onOpenPast}
            className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <FolderOpen className="w-4 h-4 text-slate-400" />
            <span>All past proposals ({pastCount})</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowSettings((s) => !s)}
              aria-expanded={showSettings}
              className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Settings</span>
            </button>
            {showSettings && (
              <div className="absolute right-0 bottom-full mb-2 w-56 rounded-xl border border-slate-600 bg-slate-900 shadow-2xl overflow-hidden z-10">
                <button
                  onClick={onCompanyProfile}
                  className="flex items-center gap-3 w-full px-4 py-3 text-left text-slate-100 hover:bg-slate-800 cursor-pointer"
                >
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span>Company & Logo</span>
                </button>
                <button
                  onClick={onHowTo}
                  className="flex items-center gap-3 w-full px-4 py-3 text-left text-slate-100 hover:bg-slate-800 border-t border-slate-700 cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4 text-slate-400" />
                  <span>How To Use</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};