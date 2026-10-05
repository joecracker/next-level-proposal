import React, { useState, useEffect } from 'react';
import { ScopeCategory, ScopeItem } from '../types';
import {
  X,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  Edit3,
  Layers,
  Volume2,
  AlertCircle,
  Loader2,
  Check,
} from 'lucide-react';

interface CategoryModalProps {
  isOpen: boolean;
  category: ScopeCategory | null;
  allCategories: ScopeCategory[];
  onClose: () => void;
  onUpdateCategory: (updatedCategory: ScopeCategory) => void;
  onSelectCategory: (category: ScopeCategory) => void;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  category,
  allCategories,
  onClose,
  onUpdateCategory,
  onSelectCategory,
}) => {
  if (!isOpen || !category) return null;

  const [dictationText, setDictationText] = useState('');
  const [newItemInput, setNewItemInput] = useState('');
  const [categoryName, setCategoryName] = useState(category.name);
  const [isFormatting, setIsFormatting] = useState(false);
  const [formatError, setFormatError] = useState<string | null>(null);

  useEffect(() => {
    setCategoryName(category.name);
    setDictationText('');
    setNewItemInput('');
  }, [category.id]);

  const handleNameChange = (newName: string) => {
    setCategoryName(newName);
    onUpdateCategory({
      ...category,
      name: newName,
    });
  };

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

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to format section');
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

        setDictationText('');
      }
    } catch (err: any) {
      console.error('Error in AI formatting:', err);
      setFormatError(err.message || 'Formatting failed. Please try again.');
    } finally {
      setIsFormatting(false);
    }
  };

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

  const handleItemTextChange = (itemId: string, newText: string) => {
    onUpdateCategory({
      ...category,
      items: category.items.map((item) => (item.id === itemId ? { ...item, text: newText } : item)),
    });
  };

  const handleDeleteItem = (itemId: string) => {
    onUpdateCategory({
      ...category,
      items: category.items.filter((item) => item.id !== itemId),
    });
  };

  const handleSaveAndClose = () => {
    onUpdateCategory({
      ...category,
      isConfirmed: true,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in print:hidden">
      <div className="relative w-full max-w-4xl bg-stone-950 text-stone-100 rounded-2xl border-2 border-amber-500/50 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Top Bar Header */}
        <div className="bg-stone-900 border-b border-amber-500/30 px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center font-bold text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-amber-400 font-mono">
                  QUICK EDIT POP-UP
                </span>
                {category.isConfirmed && (
                  <span className="bg-emerald-950 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/40">
                    OK / Confirmed
                  </span>
                )}
              </div>
              <input
                type="text"
                value={categoryName}
                onChange={(e) => handleNameChange(e.target.value)}
                className="text-lg sm:text-xl font-black text-white bg-transparent border-b border-dashed border-stone-700 focus:border-amber-400 focus:outline-none tracking-tight transition-colors w-full sm:w-80"
                placeholder="Section Category Name"
              />
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white bg-stone-800 hover:bg-stone-700 rounded-xl border border-stone-700 transition-colors cursor-pointer"
            title="Close Pop-up"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Quick Switcher Bar */}
        <div className="bg-stone-900/80 border-b border-stone-800 px-4 py-2 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-thin">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 shrink-0">
            SECTIONS:
          </span>
          {allCategories.map((cat) => {
            const isSelected = cat.id === category.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-amber-500 text-stone-950 shadow-md'
                    : 'bg-stone-800 text-stone-300 hover:bg-stone-700 border border-stone-700'
                }`}
              >
                {cat.isConfirmed && <Check className="w-3 h-3 text-emerald-950 font-black" />}
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Notes Panel */}
          <div className="bg-stone-900/90 rounded-2xl border border-amber-500/30 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <Volume2 className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs sm:text-sm font-bold text-stone-100">
                  Quick Notes & AI Formatting
                </h3>
              </div>
            </div>

            <p className="text-xs text-stone-400">
              Type the items for <strong className="text-amber-300">{category.name}</strong> naturally. AI will format it line-by-line.
            </p>

            <textarea
              value={dictationText}
              onChange={(e) => setDictationText(e.target.value)}
              rows={3}
              placeholder="e.g. 'Install Delta Kayra valve trim, rough in shower drain, install tile on walls and bench per plan'"
              className="w-full bg-stone-950 border border-stone-700 rounded-xl p-3 text-xs sm:text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-400"
            />

            {formatError && (
              <div className="bg-rose-950/60 border border-rose-500/40 p-2.5 rounded-xl text-xs text-rose-300 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{formatError}</span>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleAIFormat}
                disabled={isFormatting || !dictationText.trim()}
                className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-extrabold text-xs px-4 py-2 rounded-xl shadow flex items-center space-x-2 transition-all cursor-pointer"
              >
                {isFormatting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Formatting Notes...</span>
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

          {/* Add Manual Item Bar */}
          <form onSubmit={handleAddManualItem} className="flex gap-2">
            <input
              type="text"
              value={newItemInput}
              onChange={(e) => setNewItemInput(e.target.value)}
              placeholder={`Add single line item to ${category.name}...`}
              className="flex-1 bg-stone-900 border border-stone-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              disabled={!newItemInput.trim()}
              className="bg-stone-800 hover:bg-stone-700 disabled:opacity-50 text-amber-400 border border-amber-500/40 font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1 transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Item</span>
            </button>
          </form>

          {/* Current Line Items List */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 border-b border-stone-800 pb-2">
              WHAT PRINTS ON THE PROPOSAL ({category.items.length})
            </h4>

            {category.items.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-stone-800 rounded-2xl bg-stone-900/40">
                <p className="text-xs text-stone-400">Nothing on the proposal for this section yet.</p>
                <p className="text-[11px] text-stone-500 mt-1">
                  Use the notes box above, or write a line manually.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {category.items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-2 bg-stone-900 border border-stone-800 rounded-xl p-2.5 hover:border-amber-500/30 transition-colors"
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 ml-1"></span>
                    <input
                      type="text"
                      value={item.text}
                      onChange={(e) => handleItemTextChange(item.id, e.target.value)}
                      className="flex-1 bg-transparent text-xs sm:text-sm text-stone-100 focus:outline-none focus:border-b focus:border-amber-400 font-medium px-1"
                    />
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 text-stone-500 hover:text-rose-400 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                      title="Delete item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Action Footer */}
        <div className="bg-stone-900 border-t border-amber-500/30 px-5 py-3.5 flex items-center justify-between shrink-0">
          <span className="text-xs text-stone-400">
            Next Level Proposal &bull; Section Editor
          </span>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={handleSaveAndClose}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-xs shadow-lg flex items-center space-x-2 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save & Confirm Section</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
