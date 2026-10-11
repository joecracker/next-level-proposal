import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import type { Proposal } from '../types';
import {
  driveConfigured,
  isDriveConnected,
  connectBackup,
  saveBackup,
  restoreBackup,
  disconnectDrive,
} from '../lib/backup';

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

export function BackupMenu({ proposal, savedProposals, onRestore }: BackupMenuProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [connected, setConnected] = useState(isDriveConnected());
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

  const handleConnect = async () => {
    setBusy(true);
    setStatus(null);
    try {
      await connectBackup();
      setConnected(true);
      setStatus('Connected to Google Drive.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Could not connect to Google Drive.');
    } finally {
      setBusy(false);
    }
  };

  const handleSaveToDrive = async () => {
    setBusy(true);
    setStatus(null);
    try {
      await saveBackup(buildPayload());
      setConnected(true);
      setStatus('Saved to Google Drive.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Save to Drive failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleRestoreFromDrive = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const data = await restoreBackup<BackupPayload>();
      if (!data) {
        setStatus('No backup found in Drive yet — save one first.');
        return;
      }
      if (!window.confirm('Restore from Drive? This will replace your current active proposal and saved list.')) {
        return;
      }
      onRestore({ proposal: data.proposal, savedProposals: data.savedProposals });
      setConnected(true);
      setStatus('Restored from Google Drive.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Restore from Drive failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleDisconnect = () => {
    disconnectDrive();
    setConnected(false);
    setStatus('Disconnected from Google Drive.');
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 print:hidden">
      <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImportFile} />
      {open && (
        <div className="mb-2 w-72 rounded-lg border border-amber-500/30 bg-slate-900 p-3 shadow-xl text-slate-100">
          <div className="text-xs font-semibold uppercase tracking-wide text-amber-400 mb-2">Back up to Drive or a file</div>

          <div className="flex flex-col gap-1.5 mb-3">
            {driveConfigured ? (
              connected ? (
                <>
                  <button
                    disabled={busy}
                    onClick={handleSaveToDrive}
                    className="text-left text-sm px-2 py-1.5 rounded bg-amber-600/20 hover:bg-amber-600/30 disabled:opacity-50"
                  >
                    Save to Google Drive
                  </button>
                  <button
                    disabled={busy}
                    onClick={handleRestoreFromDrive}
                    className="text-left text-sm px-2 py-1.5 rounded bg-white/5 hover:bg-white/10 disabled:opacity-50"
                  >
                    Restore from Google Drive
                  </button>
                  <button
                    disabled={busy}
                    onClick={handleDisconnect}
                    className="text-left text-xs px-2 py-1 text-slate-400 hover:text-slate-200"
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  disabled={busy}
                  onClick={handleConnect}
                  className="text-left text-sm px-2 py-1.5 rounded bg-amber-600/20 hover:bg-amber-600/30 disabled:opacity-50"
                >
                  Connect Google Drive
                </button>
              )
            ) : (
              <div className="text-xs text-slate-400">
                Google Drive backup isn't configured yet (missing Client ID). See GOOGLE_DRIVE_SETUP.md.
              </div>
            )}
          </div>

          <div className="border-t border-white/10 pt-2 flex flex-col gap-1.5">
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

          {status && <div className="mt-2 text-xs text-slate-400">{status}</div>}
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-full bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold text-sm px-4 py-2 shadow-lg"
      >
        ☁ Back up to Drive
      </button>
    </div>
  );
}
