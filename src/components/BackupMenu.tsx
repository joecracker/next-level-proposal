import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import type { Proposal } from '../types';

interface BackupPayload {
  proposal: Proposal;
  savedProposals: Proposal[];
  exportedAt: string;
}

interface BackupMenuProps {
  proposal: Proposal;
  savedProposals: Proposal[];
  onRestore: (data: { proposal: Proposal; savedProposals: Proposal[] }) => void;
}

// A safety copy of everything on this computer, kept as a file. The finished proposals themselves are
// filed in each job's Google Drive folder (the PDF and an editable copy) by Save to Drive and Print.
export function BackupMenu({ proposal, savedProposals, onRestore }: BackupMenuProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const buildPayload = (): BackupPayload => ({
    proposal,
    savedProposals,
    exportedAt: new Date().toISOString(),
  });

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(buildPayload(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proposal-builder-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus('Exported JSON file.');
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Partial<BackupPayload>;
      if (!parsed.proposal || !Array.isArray(parsed.savedProposals)) {
        setStatus('That file does not look like a Next Level Proposal backup.');
        return;
      }
      if (!window.confirm('Import this backup? It will replace your current active proposal and saved list.')) {
        return;
      }
      onRestore({ proposal: parsed.proposal, savedProposals: parsed.savedProposals });
      setStatus('Imported from file.');
    } catch (err) {
      setStatus(err instanceof Error ? `Import failed: ${err.message}` : 'Import failed.');
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 print:hidden">
      <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImportFile} />
      {open && (
        <div className="mb-2 w-72 rounded-lg border border-amber-500/30 bg-slate-900 p-3 shadow-xl text-slate-100">
          <div className="text-xs font-semibold uppercase tracking-wide text-amber-400 mb-2">Back up to a file</div>

          <div className="flex flex-col gap-1.5">
            <button
              onClick={handleExportJSON}
              className="text-left text-sm px-2 py-1.5 rounded bg-white/5 hover:bg-white/10"
            >
              Export JSON file
            </button>
            <button
              onClick={handleImportClick}
              className="text-left text-sm px-2 py-1.5 rounded bg-white/5 hover:bg-white/10"
            >
              Import JSON file
            </button>
          </div>

          <p className="mt-3 text-[11px] leading-snug text-slate-400">
            Finished proposals are filed in each job&apos;s Google Drive folder when you use Save to Drive or Print.
          </p>

          {status && <div className="mt-2 text-xs text-slate-400">{status}</div>}
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-full bg-slate-700 hover:bg-slate-600 text-slate-100 font-semibold text-sm px-4 py-2 shadow-lg"
      >
        Back up to a file
      </button>
    </div>
  );
}
