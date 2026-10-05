import React, { useState } from 'react';
import { ScopeCategory, ScopeItem } from '../types';
import {
  Sparkles,
  CheckCircle2,
  Edit3,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  GripVertical,
  Layers,
  AlertCircle,
  Volume2,
} from 'lucide-react';

interface CategorySectionStepProps {
  category: ScopeCategory;
  categoryIndex: number;
  totalCategories: number;
  onUpdateCategory: (updated: ScopeCategory) => void;
  onNextStep: () => void;
  onPrevStep: () => void;
}

export const CategorySectionStep: React.FC<CategorySectionStepProps> = ({
  category,
  categoryIndex,
  totalCategories,
  onUpdateCategory,
  onNextStep,
  onPrevStep,
}) => {
  const [dictationText, setDictationText] = useState('');
  const [newItemInput, setNewItemInput] = useState('');
  const [isFormatting, setIsFormatting] = useState(false);
  const [formatError, setFormatError] = useState<string | null>(null);

  // Call the AI formatting endpoint to turn raw notes into sharp line items
  const handleAIFormat = async () => {
    if (!dictationText.trim()) return;

    setIsFormatting(true);
    setFormatError(null);

    try {
      const response = await fetch('/api/format-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryName: category.name,
          rawInput: dictationText,
          currentItems: category.items.map((i) => i.text),
        }),
      });

      const raw = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(raw);
      } catch {
        data = {};
      }

      if (!response.ok || !data.success) {
        const reason = data.details ? `${data.error}: ${data.details}` : data.error;
        throw new Error(reason || `Server returned ${response.status}`);
      }

      if (data.formattedItems && Array.isArray(data.formattedItems)) {
        const newItems: ScopeItem[] = data.formattedItems.map((text: string, idx: number) => ({
          id: `item-${Date.now()}-${idx}`,
          text,
        }));

        onUpdateCategory({
          ...category,
          items: [...category.items, ...newItems],
        });

        setDictationText(''); // Clear raw dictation after formatting
      }
    } catch (err: any) {
      console.error('Error in AI formatting:', err);
      setFormatError(err.message || 'Formatting failed. Please try again.');
    } finally {
      setIsFormatting(false);
    }
  };

  // Add single manual line item
  const handleAddManualItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newItemInput.trim()) return;

    const newItem: ScopeItem = {
      id: `item-${Date.now()}`,
      text: newItemInput.trim(),
    };

    onUpdateCategory({
      ...category,
      items: [...category.items, newItem],
    });

    setNewItemInput('');
  };

  // Edit an existing item
  const handleItemTextChange = (itemId: string, newText: string) => {
    onUpdateCategory({
      ...category,
      items: category.items.map((item) => (item.id === itemId ? { ...item, text: newText } : item)),
    });
  };

  // Delete an item
  const handleDeleteItem = (itemId: string) => {
    onUpdateCategory({
      ...category,
      items: category.items.filter((item) => item.id !== itemId),
    });
  };

  // Toggle Confirm / OK vs Edit state
  const handleConfirmOK = () => {
    onUpdateCategory({
      ...category,
      isConfirmed: true,
    });
    onNextStep();
  };

  const handleUnlockEdit = () => {
    onUpdateCategory({
      ...category,
      isConfirmed: false,
    });
  };

  return (
    <div className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 p-5 sm:p-7 shadow-xl space-y-6">
      
      {/* Category Header Bar */}
      <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4" /> Category {categoryIndex + 1} of {totalCategories}
            </span>
            {category.isConfirmed ? (
              <span className="bg-emerald-950 text-emerald-300 text-xs px-2.5 py-0.5 rounded-full border border-emerald-500/40 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Section OK & Confirmed
              </span>
            ) : (
              <span className="bg-amber-500/20 text-amber-300 text-xs px-2.5 py-0.5 rounded-full border border-amber-500/30 font-medium">
                Draft / Editing
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
            {category.name}
          </h2>
          {category.description && (
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {category.description}
            </p>
          )}
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onPrevStep}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
            title="Previous Section"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {category.isConfirmed ? (
            <button
              onClick={handleUnlockEdit}
              className="bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold px-4 py-2.5 rounded-xl border border-amber-500/40 flex items-center space-x-2 transition-all cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Section</span>
            </button>
          ) : (
            <button
              onClick={handleConfirmOK}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-lg flex items-center space-x-2 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>OK (Confirm) & Next</span>
            </button>
          )}
        </div>
      </div>

      {/* Confirmed Banner Alert (if already OK) */}
      {category.isConfirmed && (
        <div className="bg-emerald-950/50 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between text-emerald-200">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="text-xs sm:text-sm">
              <span className="font-bold text-emerald-300">This section is confirmed OK!</span>
              <p className="text-emerald-400/80">Click "Edit Section" above if you need to modify or add more items.</p>
            </div>
          </div>
          <button
            onClick={handleUnlockEdit}
            className="bg-emerald-900/80 hover:bg-emerald-800 text-emerald-100 text-xs px-3 py-1.5 rounded-lg border border-emerald-500/40 font-medium transition-colors"
          >
            Reopen to Edit
          </button>
        </div>
      )}

      {/* Notes Box & AI Formatter Panel */}
      {!category.isConfirmed && (
        <div className="bg-slate-950/70 rounded-2xl border border-amber-500/30 p-4 sm:p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <Volume2 className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm sm:text-base font-bold text-slate-100">
                Quick Notes & AI Formatting
              </h3>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            Type what is needed for this section. Rattle off materials, quantities, dimensions, or instructions naturally—no need to say "drop down to next line".
          </p>

          <div className="relative">
            <textarea
              value={dictationText}
              onChange={(e) => setDictationText(e.target.value)}
              rows={4}
              placeholder="e.g. 'We need to tear out the old subfloor, install 2x6 framing studs, tape seams, put in 1/2 inch moisture drywall and haul away scrap'"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
            />
          </div>

          {formatError && (
            <div className="bg-rose-950/60 border border-rose-500/40 p-3 rounded-xl text-xs text-rose-300 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{formatError}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <button
              onClick={() => setDictationText('')}
              disabled={!dictationText}
              className="text-xs text-slate-500 hover:text-slate-300 disabled:opacity-40"
            >
              Clear Text
            </button>

            <button
              onClick={handleAIFormat}
              disabled={!dictationText.trim() || isFormatting}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-lg flex items-center space-x-2 text-xs sm:text-sm disabled:opacity-50 transition-all cursor-pointer"
            >
              {isFormatting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Formatting into Sharp Lines...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Turn My Notes Into Proposal</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Line Items List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <span>What Prints On The Proposal</span>
            <span className="bg-slate-800 text-slate-300 text-xs px-2.5 py-0.5 rounded-full border border-slate-700">
              {category.items.length} item{category.items.length !== 1 ? 's' : ''}
            </span>
          </h3>
        </div>

        {category.items.length === 0 ? (
          <div className="bg-slate-800/40 border border-dashed border-slate-700 rounded-2xl p-8 text-center text-slate-400 space-y-2">
            <Layers className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-sm font-medium text-slate-300">Nothing on the proposal for this section yet</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Use the notes box above, or write a line straight into the box below.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {category.items.map((item, idx) => (
              <div
                key={item.id}
                className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl p-3 flex items-start space-x-3 transition-all group"
              >
                <div className="pt-2 text-slate-500 shrink-0">
                  <GripVertical className="w-4 h-4" />
                </div>

                <div className="pt-2 shrink-0">
                  <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center justify-center border border-amber-500/30">
                    {idx + 1}
                  </span>
                </div>

                {category.isConfirmed ? (
                  <p className="text-xs sm:text-sm text-slate-200 py-1 flex-1 leading-relaxed">
                    {item.text}
                  </p>
                ) : (
                  <textarea
                    value={item.text}
                    onChange={(e) => handleItemTextChange(item.id, e.target.value)}
                    rows={2}
                    className="flex-1 bg-slate-900/90 border border-slate-700/60 rounded-lg p-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400 transition-all leading-relaxed"
                  />
                )}

                {!category.isConfirmed && (
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-700/60 rounded-lg transition-colors shrink-0"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Quick Add Manual Item Form */}
        {!category.isConfirmed && (
          <form onSubmit={handleAddManualItem} className="flex gap-2 pt-2">
            <input
              type="text"
              value={newItemInput}
              onChange={(e) => setNewItemInput(e.target.value)}
              placeholder="+ Write a line directly on the proposal..."
              className="flex-1 bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-all"
            />
            <button
              type="submit"
              disabled={!newItemInput.trim()}
              className="bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold px-4 py-2.5 rounded-xl border border-slate-700 hover:border-amber-500/50 text-xs sm:text-sm disabled:opacity-40 flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </form>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
        <button
          onClick={onPrevStep}
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-xl border border-slate-700 text-xs sm:text-sm font-medium flex items-center space-x-2 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        {category.isConfirmed ? (
          <button
            onClick={onNextStep}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl shadow-lg text-xs sm:text-sm flex items-center space-x-2 transition-all cursor-pointer"
          >
            <span>Next Category</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleConfirmOK}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-3 rounded-xl shadow-lg text-xs sm:text-sm flex items-center space-x-2 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>OK - Confirm Section & Continue</span>
          </button>
        )}
      </div>
    </div>
  );
};
