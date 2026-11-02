import React, { useEffect, useState } from 'react';
import { X, Loader2, RefreshCw, ExternalLink, FolderOpen } from 'lucide-react';
import {
  driveConfigured,
  isDriveConnected,
  connectGoogleDrive,
  loadJobFolder,
  type JobFolderInfo,
  type JobPhoto,
} from '../lib/driveJobs';
import { driveError } from '../lib/driveError';
import { DriveJobPicker } from './DriveJobPicker';
import type { ProposalDriveJob } from '../types';

interface JobFolderPanelProps {
  job: ProposalDriveJob | null;
  onPickJob: (job: ProposalDriveJob) => void;
  onClose: () => void;
}

const row = (label: string, value?: string) =>
  value && value.trim() ? (
    <div className="flex gap-3 text-sm">
      <div className="w-24 shrink-0 text-slate-400">{label}</div>
      <div className="text-slate-100 break-words min-w-0">{value}</div>
    </div>
  ) : null;

/** A side panel that shows the job's folder: its information and description, its pictures, and the files in it. Read only. */
export const JobFolderPanel: React.FC<JobFolderPanelProps> = ({ job, onPickJob, onClose }) => {
  const [info, setInfo] = useState<JobFolderInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [big, setBig] = useState<JobPhoto | null>(null);

  const load = async () => {
    if (!job || !job.folderId) return;
    setBusy(true);
    setMsg(null);
    try {
      if (!isDriveConnected()) await connectGoogleDrive();
      setInfo(await loadJobFolder(job.folderId));
    } catch (err) {
      setMsg(driveError(err));
    }
    setBusy(false);
  };

  useEffect(() => {
    setInfo(null);
    if (driveConfigured && job && job.folderId && isDriveConnected()) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.folderId]);

  if (!job) {
    return <DriveJobPicker title="Which job's folder do you want to see?" onPick={onPickJob} onCancel={onClose} />;
  }

  const p = info?.project || null;
  const photos = (p?.photos || []).filter((x) => x.dataUrl);
  const files = (info?.files || []).filter((f) => !f.isFolder && f.name !== 'job.json');
  const folderUrl = job.folderId ? `https://drive.google.com/drive/folders/${job.folderId}` : null;

  return (
    <div className="fixed inset-0 z-[65] print:hidden" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <aside className="absolute right-0 top-0 bottom-0 w-full max-w-lg bg-slate-900 border-l border-slate-700 text-slate-100 shadow-2xl flex flex-col">
        <div className="flex items-start justify-between gap-3 p-4 border-b border-slate-700">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <FolderOpen className="w-4 h-4" /> Job folder
            </div>
            <h2 className="text-lg font-bold text-white mt-1 break-words">{job.name}</h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => void load()} disabled={busy} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50" title="Look again">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </button>
            <button onClick={onClose} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700" title="Close">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {!driveConfigured && <p className="text-sm text-slate-300">Google Drive is not set up in this copy of the app.</p>}
          {driveConfigured && !job.folderId && (
            <p className="text-sm text-slate-300">This job has no folder in Google Drive yet. Pick the job again.</p>
          )}
          {driveConfigured && job.folderId && !info && !busy && (
            <button onClick={() => void load()} className="w-full rounded-xl bg-amber-500 text-slate-950 font-bold py-3">
              Open this job&apos;s folder
            </button>
          )}
          {busy && !info && <p className="text-sm text-slate-400 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Looking in the folder...</p>}
          {msg && <p className="text-sm text-red-300">{msg}</p>}

          {info && (
            <>
              {folderUrl && (
                <a href={folderUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300">
                  <ExternalLink className="w-4 h-4" /> Open the folder in Google Drive
                </a>
              )}

              {!p && <p className="text-sm text-slate-300">There is no job file in this folder yet, so there is no description or pictures to show. Save the job to Drive from Field &amp; Desk first.</p>}

              {p && (
                <section className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Job information</h3>
                  {row('Customer', p.customer || p.name)}
                  {row('Date', p.date)}
                  {row('Address', p.address)}
                  {row('Phone', p.phone)}
                  {row('Email', p.email)}
                </section>
              )}

              {p && p.jobDesc && p.jobDesc.trim() && (
                <section className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Description of job</h3>
                  <p className="text-sm text-slate-100 whitespace-pre-wrap">{p.jobDesc}</p>
                </section>
              )}

              {p && p.jobNotes && p.jobNotes.trim() && (
                <section className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Job notes</h3>
                  <p className="text-sm text-slate-100 whitespace-pre-wrap">{p.jobNotes}</p>
                </section>
              )}

              {p && (p.scratch || []).length > 0 && (
                <section className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Reminders</h3>
                  <ul className="list-disc pl-5 text-sm text-slate-100 space-y-1">
                    {(p.scratch || []).map((s) => (
                      <li key={s.id}>{s.text}</li>
                    ))}
                  </ul>
                </section>
              )}

              {p && (
                <section className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pictures ({photos.length})</h3>
                  {photos.length === 0 ? (
                    <p className="text-sm text-slate-400">No pictures came along in this job file.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {photos.map((ph) => (
                        <button key={ph.id} onClick={() => setBig(ph)} className="text-left rounded-lg overflow-hidden bg-slate-800 border border-slate-700 hover:border-amber-500">
                          <img src={ph.dataUrl} alt={ph.caption || 'Job picture'} className="w-full h-32 object-cover" />
                          {(ph.caption || ph.note) && <div className="px-2 py-1 text-xs text-slate-300 line-clamp-2">{ph.caption || ph.note}</div>}
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              )}

              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Files in this folder</h3>
                {files.length === 0 ? (
                  <p className="text-sm text-slate-400">No other files yet.</p>
                ) : (
                  <ul className="space-y-1">
                    {files.map((f) => (
                      <li key={f.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-800 px-3 py-2 text-sm">
                        <span className="min-w-0 break-words">{f.name}</span>
                        {f.webViewLink && (
                          <a href={f.webViewLink} target="_blank" rel="noopener noreferrer" className="shrink-0 text-amber-400 hover:text-amber-300">
                            Open
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>
      </aside>

      {big && (
        <div className="absolute inset-0 z-10 bg-black/90 flex flex-col items-center justify-center p-4" onClick={() => setBig(null)}>
          <img src={big.dataUrl} alt={big.caption || 'Job picture'} className="max-h-[80vh] max-w-full object-contain rounded-lg" />
          {(big.caption || big.note) && (
            <div className="mt-3 max-w-xl text-center text-sm text-slate-200 space-y-1">
              {big.caption && <div className="font-semibold">{big.caption}</div>}
              {big.note && <div className="whitespace-pre-wrap">{big.note}</div>}
            </div>
          )}
          <div className="mt-3 text-xs text-slate-400">Tap anywhere to close</div>
        </div>
      )}
    </div>
  );
};