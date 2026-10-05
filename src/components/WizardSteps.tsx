import React from 'react';
import { ScopeCategory } from '../types';
import {
  User,
  CheckCircle,
  Clock,
  ShieldCheck,
  Plus,
  Trash2,
  ChevronRight,
  FileCheck2,
  Lock,
  Unlock,
  Wrench,
} from 'lucide-react';

interface WizardStepsProps {
  categories: ScopeCategory[];
  currentStepIndex: number;
  maxReachedStep: number;
  powerMode: boolean;
  onTogglePowerMode: () => void;
  onSelectStep: (index: number) => void;
  onAddCategory: () => void;
  onDeleteCategory: (categoryId: string) => void;
  onOpenCategoryModal?: (category: ScopeCategory) => void;
}

export const WizardSteps: React.FC<WizardStepsProps> = ({
  categories,
  currentStepIndex,
  maxReachedStep,
  powerMode,
  onTogglePowerMode,
  onSelectStep,
  onAddCategory,
  onDeleteCategory,
  onOpenCategoryModal,
}) => {
  // Total steps: Step 0 (Contact Info), Step 1..N (Categories), Step N+1 (Legal), Step N+2 (Final Review)
  const totalSteps = categories.length + 3;

  // A step is clickable if it's the current step, a completed/visited step, or
  // we're in "Edit Everything" power mode.
  const canVisit = (index: number) => index <= maxReachedStep || powerMode;

  const statusBadge = (index: number) => {
    if (index === currentStepIndex) return null;
    if (index < currentStepIndex) {
      return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    }
    if (canVisit(index)) {
      return <Clock className="w-4 h-4 text-amber-400" />;
    }
    return <Lock className="w-4 h-4 text-slate-600" />;
  };

  const stepButtonClass = (index: number) => {
    const base = 'w-full text-left p-3 rounded-xl transition-all flex items-center justify-between border';
    if (index === currentStepIndex) {
      return `${base} bg-amber-500 text-slate-950 font-semibold border-amber-400 shadow-md scale-[1.01]`;
    }
    if (!canVisit(index)) {
      return `${base} bg-slate-900/40 text-slate-600 border-slate-800/60 cursor-not-allowed`;
    }
    return `${base} bg-slate-800/60 hover:bg-slate-800 text-slate-200 border-slate-700/60`;
  };

  const iconClass = (index: number) => {
    if (index === currentStepIndex) return 'bg-slate-950 text-amber-400';
    if (index < currentStepIndex) return 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40';
    if (canVisit(index)) return 'bg-slate-700/80 text-amber-300';
    return 'bg-slate-800 text-slate-600';
  };

  return (
    <div className="bg-slate-900 text-slate-200 rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
            <span>Proposal Sections</span>
            <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-medium">
              Step {currentStepIndex + 1} of {totalSteps}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {powerMode ? 'Edit Everything — jump anywhere' : 'Complete each step in order to continue'}
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        {/* Step 0: Customer Contact Info */}
        <button
          onClick={() => canVisit(0) && onSelectStep(0)}
          className={stepButtonClass(0)}
          disabled={!canVisit(0)}
        >
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs ${iconClass(0)}`}>
              <User className="w-4 h-4" />
            </div>
            <div className="truncate">
              <div className="text-xs sm:text-sm font-medium truncate">
                Customer & Project Info
              </div>
              <div className={`text-[11px] truncate ${currentStepIndex === 0 ? 'text-slate-900 font-normal' : 'text-slate-400'}`}>
                Name, Address, Proposal #
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1 shrink-0">
            {statusBadge(0)}
            <ChevronRight className={`w-4 h-4 transition-transform ${currentStepIndex === 0 ? 'text-slate-950 translate-x-0.5' : 'text-slate-500'}`} />
          </div>
        </button>

        {/* Step 1..N: Scope Categories */}
        {categories.map((cat, idx) => {
          const stepIndex = idx + 1;
          const isCurrent = currentStepIndex === stepIndex;
          const locked = !canVisit(stepIndex);

          return (
            <div key={cat.id} className="relative group">
              <button
                onClick={() => {
                  if (!canVisit(stepIndex)) return;
                  if (onOpenCategoryModal) {
                    onOpenCategoryModal(cat);
                  } else {
                    onSelectStep(stepIndex);
                  }
                }}
                disabled={locked}
                className={stepButtonClass(stepIndex)}
              >
                <div className="flex items-center space-x-3 overflow-hidden pr-2">
                  {/* Status Indicator */}
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs ${iconClass(stepIndex)}`}>
                    {stepIndex < currentStepIndex ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Clock className="w-4 h-4 text-amber-400" />
                    )}
                  </div>

                  <div className="truncate">
                    <div className="text-xs sm:text-sm font-medium truncate flex items-center gap-1.5">
                      <span className="truncate">{cat.name}</span>
                    </div>
                    <div className={`text-[11px] truncate ${isCurrent ? 'text-slate-900 font-normal' : 'text-slate-400'}`}>
                      {cat.items.length} item{cat.items.length !== 1 ? 's' : ''}{' '}
                      {cat.isConfirmed ? '• Confirmed OK' : locked ? '• Locked' : '• Click for Pop-Up'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  {!locked && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenCategoryModal) onOpenCategoryModal(cat);
                        else onSelectStep(stepIndex);
                      }}
                      className={`text-[10px] font-bold px-2 py-1 rounded-md border transition-colors ${
                        isCurrent
                          ? 'bg-slate-950 text-amber-400 border-slate-900'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500 hover:text-slate-950'
                      }`}
                    >
                      Pop-Up
                    </span>
                  )}
                  {locked && <Lock className="w-3.5 h-3.5 text-slate-600" />}
                  <ChevronRight className={`w-4 h-4 transition-transform ${isCurrent ? 'text-slate-950 translate-x-0.5' : 'text-slate-500'}`} />
                </div>
              </button>

              {/* Category Delete hover button if more than 1 category and visitable */}
              {categories.length > 1 && !isCurrent && canVisit(stepIndex) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Remove section "${cat.name}"?`)) {
                      onDeleteCategory(cat.id);
                    }
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete category"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}

        {/* Add Category Button */}
        <button
          onClick={onAddCategory}
          className="w-full p-2.5 rounded-xl border border-dashed border-slate-700 hover:border-amber-500/60 bg-slate-800/30 hover:bg-amber-500/10 text-amber-400 hover:text-amber-300 text-xs font-medium flex items-center justify-center space-x-2 transition-all mt-2"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Scope Category</span>
        </button>

        {/* Legal Terms Step */}
        <button
          onClick={() => canVisit(categories.length + 1) && onSelectStep(categories.length + 1)}
          disabled={!canVisit(categories.length + 1)}
          className={`${stepButtonClass(categories.length + 1)} mt-3`}
        >
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs ${iconClass(categories.length + 1)}`}>
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="truncate">
              <div className="text-xs sm:text-sm font-medium truncate">
                Legal Agreements & Signatures
              </div>
              <div className={`text-[11px] truncate ${currentStepIndex === categories.length + 1 ? 'text-slate-900 font-normal' : 'text-slate-400'}`}>
                Auto-included legal terms & lines
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1 shrink-0">
            {statusBadge(categories.length + 1)}
            <ChevronRight className={`w-4 h-4 transition-transform ${currentStepIndex === categories.length + 1 ? 'text-slate-950 translate-x-0.5' : 'text-slate-500'}`} />
          </div>
        </button>

        {/* Final Proposal Sheet Review */}
        <button
          onClick={() => canVisit(categories.length + 2) && onSelectStep(categories.length + 2)}
          disabled={!canVisit(categories.length + 2)}
          className={stepButtonClass(categories.length + 2)}
        >
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs ${iconClass(categories.length + 2)}`}>
              <FileCheck2 className="w-4 h-4" />
            </div>
            <div className="truncate">
              <div className="text-xs sm:text-sm font-medium truncate">
                Final Review & Export
              </div>
              <div className={`text-[11px] truncate ${currentStepIndex === categories.length + 2 ? 'text-slate-900 font-normal' : 'text-slate-400'}`}>
                View completed proposal document
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1 shrink-0">
            {statusBadge(categories.length + 2)}
            <ChevronRight className={`w-4 h-4 transition-transform ${currentStepIndex === categories.length + 2 ? 'text-slate-950 translate-x-0.5' : 'text-slate-500'}`} />
          </div>
        </button>
      </div>

      {/* Edit Everything side door */}
      <div className="mt-4 pt-3 border-t border-slate-800">
        <button
          onClick={onTogglePowerMode}
          className={`w-full flex items-center justify-center space-x-2 text-xs font-bold px-3 py-2 rounded-xl border transition-all cursor-pointer ${
            powerMode
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-slate-800/60 text-slate-400 hover:text-amber-300 border-slate-700/60 hover:border-amber-500/40'
          }`}
        >
          {powerMode ? (
            <>
              <Wrench className="w-3.5 h-3.5" />
              <span>Back to Guided Mode</span>
              <Unlock className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              <Wrench className="w-3.5 h-3.5" />
              <span>Edit Everything</span>
              <Lock className="w-3.5 h-3.5" />
            </>
          )}
        </button>
        <p className="text-[10px] text-slate-500 text-center mt-1.5">
          {powerMode
            ? 'You can jump to any section, add, or delete — use with care.'
            : 'Hidden shortcut for making tweaks and fixes.'}
        </p>
      </div>
    </div>
  );
};