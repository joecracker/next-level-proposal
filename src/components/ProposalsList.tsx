import React, { useState } from 'react';
import { Proposal } from '../types';
import { FolderOpen, Search, Plus, Trash2, Copy, Calendar, User, FileText, ArrowRight } from 'lucide-react';

interface ProposalsListProps {
  savedProposals: Proposal[];
  currentProposalId: string;
  onSelectProposal: (proposal: Proposal) => void;
  onNewProposal: () => void;
  onDuplicateProposal: (proposal: Proposal) => void;
  onDeleteProposal: (id: string) => void;
}

export const ProposalsList: React.FC<ProposalsListProps> = ({
  savedProposals,
  currentProposalId,
  onSelectProposal,
  onNewProposal,
  onDuplicateProposal,
  onDeleteProposal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = savedProposals.filter(
    (p) =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.clientInfo.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-6 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <FolderOpen className="w-4 h-4" /> Saved Proposal Records
          </span>
          <h2 className="text-xl font-bold text-white mt-1">
            Proposal Library
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            View, load, clone, or delete past client proposals.
          </p>
        </div>

        <button
          onClick={onNewProposal}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-lg text-xs sm:text-sm flex items-center space-x-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Proposal</span>
        </button>
      </div>

      {/* Search Filter */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by client name, project title, or proposal #..."
          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-all"
        />
      </div>

      {/* List Grid */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-slate-950/50 border border-dashed border-slate-800 rounded-2xl p-8 text-center text-slate-400 space-y-2">
            <FileText className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-medium">No proposals found</p>
            <p className="text-xs text-slate-500">
              Create a new proposal or clear your search term.
            </p>
          </div>
        ) : (
          filtered.map((prop) => {
            const isCurrent = prop.id === currentProposalId;

            return (
              <div
                key={prop.id}
                className={`bg-slate-800/80 hover:bg-slate-800 border rounded-2xl p-4 sm:p-5 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isCurrent ? 'border-amber-500 shadow-md ring-1 ring-amber-500/50' : 'border-slate-700/80'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm sm:text-base text-white">
                      {prop.title || 'Untitled Proposal'}
                    </span>
                    {isCurrent && (
                      <span className="bg-amber-500 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                        Active Draft
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                    <span className="flex items-center gap-1 text-slate-300">
                      <User className="w-3.5 h-3.5 text-amber-400" />
                      {prop.clientInfo.clientName || 'No client name'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {prop.clientInfo.proposalDate}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => onDuplicateProposal(prop)}
                    className="p-2 bg-slate-700/80 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center space-x-1 transition-colors"
                    title="Clone as New Proposal"
                  >
                    <Copy className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden md:inline">Clone</span>
                  </button>

                  <button
                    onClick={() => {
                      const who = prop.clientInfo?.clientName || prop.title || 'this proposal';
                      if (window.confirm('Delete the proposal for ' + who + '? This cannot be undone.')) {
                        onDeleteProposal(prop.id);
                      }
                    }}
                    className="p-2 bg-slate-700/80 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 rounded-lg text-xs font-medium transition-colors"
                    title="Delete Proposal"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onSelectProposal(prop)}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs flex items-center space-x-1.5 shadow transition-all cursor-pointer"
                  >
                    <span>Open Proposal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
