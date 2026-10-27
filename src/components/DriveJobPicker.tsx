import React, { useEffect, useState } from 'react';
import { Loader2, FolderOpen } from 'lucide-react';
import {
  driveConfigured,
  isDriveConnected,
  connectGoogleDrive,
  listAllJobs,
  type DriveJobEntry,
} from '../lib/driveJobs';
import { driveError } from '../lib/driveError';
import type { ProposalDriveJob } from '../types';

interface DriveJobPickerProps {
  title: string;
  /** Shown when the person can carry on without choosing a job (printing). */
  skipLabel?: string;
  onPick: (job: ProposalDriveJob) => void;
  onSkip?: () => void;
  onCancel: () => void;
}

/** A small window that asks which Google Drive job a proposal belongs to. The answer is remembered on the proposal. */
export const DriveJobPicker: React.FC<DriveJobPickerProps> = ({ title, skipLabel, onPick, onSkip, onCancel }) => {
  const [jobs, setJobs] = useState<DriveJobEntry[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  const load = async () => {
    setBusy(true);
    setMsg(null);
    try {
      if (!isDriveConnected()) await connectGoogleDrive();
      setJobs(await listAllJobs());
    } catch (err) {
      setMsg(driveError(err));
    }
    setBusy(false);
  };

  useEffect(() => {
    if (driveConfigured && isDriveConnected()) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shown = (jobs || []).filter((j) => j.name.toLowerCase().includes(filter.trim().toLowerCase()));

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 print:hidden" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-5 text-slate-100 shadow-2xl space-y-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <FolderOpen className="w-4 h-4" /> Google Drive
          </div>
          <h2 className="text-lg font-bold text-white mt-1">{title}</h2>
          <p className="text-xs text-slate-400 mt-1">
            The finished PDF and the editable copy of this proposal are filed in that job&apos;s folder. This is
            remembered, so you only pick once.
          </p>
        </div>

        {msg && (
          <div className="bg-rose-950/60 border border-rose-500/40 p-3 rounded-xl text-xs text-rose-200">{msg}</div>
        )}
        {busy && (
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Loader2 className="w-4 h-4 animate-spin text-amber-400" /> Looking in Google Drive&hellip;
          </div>
        )}
        {jobs === null && !busy && (
          <button
            type="button"
            onClick={() => void load()}
            className="w-full bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold px-4 py-3 rounded-xl border border-slate-700 cursor-pointer"
          >
            Connect Google Drive
          </button>
        )}
        {jobs !== null && jobs.length === 0 && !busy && (
          <p className="text-xs text-slate-400">No jobs in Google Drive yet. Save a job from Field &amp; Desk first.</p>
        )}
        {jobs !== null && jobs.length > 5 && (
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Type to find a job"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-500"
          />
        )}
        {jobs !== null && (
          <div className="max-h-[50vh] overflow-y-auto space-y-2">
            {shown.map((job) => (
              <button
                key={job.jobId}
                type="button"
                onClick={() => onPick({ jobId: job.jobId, name: job.name, folderId: job.folderId })}
                className="w-full text-left rounded-xl border border-slate-700 bg-slate-950 hover:bg-slate-800 px-4 py-3 cursor-pointer"
              >
                <div className="text-sm font-bold text-slate-100">{job.name}</div>
              </button>
            ))}
            {shown.length === 0 && jobs.length > 0 && <p className="text-xs text-slate-400">No job matches that.</p>}
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-2 pt-1">
          {onSkip && skipLabel && (
            <button
              type="button"
              onClick={onSkip}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-200 border border-slate-600 hover:bg-slate-800 cursor-pointer"
            >
              {skipLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
