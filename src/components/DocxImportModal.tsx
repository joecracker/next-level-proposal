import React, { useState } from 'react';
import { Proposal, ScopeCategory } from '../types';
import { FileUp, FileText, Sparkles, CheckCircle2, Loader2, AlertCircle, Upload, HelpCircle } from 'lucide-react';

interface DocxImportModalProps {
  proposal: Proposal;
  onImportProposal: (importedData: Partial<Proposal>) => void;
  onClose: () => void;
}

export const DocxImportModal: React.FC<DocxImportModalProps> = ({
  proposal,
  onImportProposal,
  onClose,
}) => {
  const [documentText, setDocumentText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setDocumentText(content);
    };

    reader.readAsText(file);
  };

  const handleParseDocument = async () => {
    if (!documentText.trim()) return;

    setIsParsing(true);
    setParseError(null);

    try {
      const response = await fetch('/api/parse-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentText }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to parse document text');
      }

      const parsed = data.parsedData;

      const newCategories: ScopeCategory[] = (parsed.categories || []).map((cat: any, idx: number) => ({
        id: `imported-cat-${Date.now()}-${idx}`,
        name: cat.name || `Section ${idx + 1}`,
        isConfirmed: false,
        items: (cat.items || []).map((text: string, iIdx: number) => ({
          id: `item-${Date.now()}-${idx}-${iIdx}`,
          text,
        })),
      }));

      onImportProposal({
        clientInfo: {
          ...proposal.clientInfo,
          clientName: parsed.clientName || proposal.clientInfo.clientName,
          address: parsed.siteAddress || proposal.clientInfo.address,
          phone: parsed.phone || proposal.clientInfo.phone,
          email: parsed.email || proposal.clientInfo.email,
          projectSite: parsed.projectName || proposal.clientInfo.projectSite,
        },
        categories: newCategories.length > 0 ? newCategories : proposal.categories,
        legalTerms: parsed.legalTerms
          ? { ...proposal.legalTerms, agreementText: parsed.legalTerms }
          : proposal.legalTerms,
      });

      onClose();
    } catch (err: any) {
      console.error('Error parsing document:', err);
      setParseError(err.message || 'Error parsing document.');
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-6 max-w-3xl mx-auto">
      
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <FileUp className="w-4 h-4" /> Import Word Doc / Proposal Template
          </span>
          <h2 className="text-xl font-bold text-white mt-1">
            Import Existing Template or Word Document
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Drop your Word doc (`.docx`, `.txt`) or paste your previous template text below. Our AI will structure the categories and reuse your company's clean layout automatically!
          </p>
        </div>
      </div>

      {/* Answer Callout Card */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start space-x-3 text-xs text-amber-200">
        <HelpCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-amber-300">Yes! You can drop any Word doc or template text right here.</p>
          <p className="text-amber-200/90 leading-relaxed">
            We will extract the exact path, section categories, client details, and legal agreements, then rebuild them into the spacious, breathable layout your company prefers.
          </p>
        </div>
      </div>

      {/* File Upload Dropzone */}
      <div className="border-2 border-dashed border-slate-700 hover:border-amber-500 rounded-2xl p-6 text-center space-y-3 bg-slate-950/50 transition-all">
        <Upload className="w-8 h-8 text-amber-400 mx-auto" />
        <div>
          <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold px-4 py-2 rounded-xl border border-slate-700 inline-block transition-colors">
            Choose Word Doc or Text File
            <input
              type="file"
              accept=".docx,.txt,.doc,.pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          <p className="text-[11px] text-slate-500 mt-2">
            Supports Word (.docx), Plain Text (.txt), or Markdown templates
          </p>
          {fileName && (
            <p className="text-xs font-semibold text-emerald-400 mt-2 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> File Selected: {fileName}
            </p>
          )}
        </div>
      </div>

      {/* Textarea Paste Alternative */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-amber-400" />
          Or Paste Template Text directly:
        </label>
        <textarea
          value={documentText}
          onChange={(e) => setDocumentText(e.target.value)}
          rows={7}
          placeholder="Paste text from your previous Word doc or Claude template here..."
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-400 transition-all leading-relaxed"
        />
      </div>

      {parseError && (
        <div className="bg-rose-950/60 border border-rose-500/40 p-3 rounded-xl text-xs text-rose-300 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{parseError}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-800">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
        >
          Cancel
        </button>

        <button
          onClick={handleParseDocument}
          disabled={!documentText.trim() || isParsing}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl shadow-lg text-xs sm:text-sm flex items-center space-x-2 disabled:opacity-50 transition-all cursor-pointer"
        >
          {isParsing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              <span>Parsing Template...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Import & Format for This Company</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
