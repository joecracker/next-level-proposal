import React, { useEffect, useState } from 'react';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Info,
} from 'lucide-react';
import { readEstimateFile, EstimateRead } from '../lib/excelEstimate';
import {
  driveConfigured,
  isDriveConnected,
  connectGoogleDrive,
  listLoadableJobs,
  downloadEstimateFile,
  readSavedProposal,
  type LoadableJob,
} from '../lib/driveJobs';
import { driveError } from '../lib/driveError';
import type { Proposal, ProposalDriveJob } from '../types';
import { dollarsToCents, formatMoneyPlain, paymentScheduleCents } from '../lib/money';

/** What the app needs handed back once the info is approved. */
export interface EstimateImportResult {
  totalEstimate: string;
  dueAtSigning: string;
  dueAtStart: string;
  dueUponCompletion: string;
  /** Null when the sheet's cell was empty - the proposal's existing value is then left alone. */
  customerName: string | null;
  customerAddress: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  /** Goes into the proposal's project title slot (e.g. "Bathroom remodel"). */
  jobDescription: string | null;
  /** Starred materials, in sheet order. Names only - never a price. */
  materials: string[];
  /** The Google Drive job the estimate came from (null when it was picked as a file on this computer). */
  driveJob: ProposalDriveJob | null;
}

interface EstimateImportModalProps {
  /** Name of the proposal that is open now, or null when it is still blank (nothing to overwrite). */
  existingName: string | null;
  currentTotal: string;
  /** How many lines the proposal's Material description section holds now, or null if it has no such section. */
  materialsSectionCount: number | null;
  onApply: (result: EstimateImportResult, mode: 'new' | 'update') => void;
  onClose: () => void;
  /** Opened from inside a proposal: only the price and payments are updated, never a new proposal. */
  updateOnly?: boolean;
  /** The payment amounts on the proposal right now, for the before/after view. */
  currentPayments?: { dueAtSigning: string; dueAtStart: string; dueUponCompletion: string };
  /** A proposal saved in a job's Drive folder was chosen: open it as it was saved. */
  onOpenSavedProposal: (proposal: Proposal) => void;
}

const asMoney = (cents: number) => `$${formatMoneyPlain(cents)}`;

export const EstimateImportModal: React.FC<EstimateImportModalProps> = ({
  existingName,
  currentTotal,
  materialsSectionCount,
  onApply,
  onClose,
  updateOnly = false,
  currentPayments,
  onOpenSavedProposal,
}) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [readError, setReadError] = useState<string | null>(null);
  const [found, setFound] = useState<EstimateRead | null>(null);
  // New proposal is always the starting choice, so an import can never silently overwrite a job.
  const [mode, setMode] = useState<'new' | 'update'>(updateOnly ? 'update' : 'new');
  const updating = (updateOnly || mode === 'update') && existingName !== null;
  // Update-only: the proposal's materials list is kept as written unless this box is ticked.
  const [replaceMaterials, setReplaceMaterials] = useState(false);

  // The sheet hands back dollars and cents (1826.769232). Everything on this screen works in
  // whole cents, so the moment the file is read we switch to cents and stay there.
  const totalCents = found && typeof found.total === 'number' ? dollarsToCents(found.total) : null;

  const canApply = totalCents !== null && totalCents !== 0;

  // Half / quarter / quarter of the total - the sheet's own schedule. The sheet's signing and
  // start figures are kept when it has them; completion is always the exact remainder, so the
  // three payments add back up to the total even when the pennies don't divide evenly.
  const schedule =
    totalCents !== null
      ? paymentScheduleCents(
          totalCents,
          found && found.dueAtSigning !== null ? dollarsToCents(found.dueAtSigning) : null,
          found && found.dueAtStart !== null ? dollarsToCents(found.dueAtStart) : null
        )
      : null;

  const payments = schedule
    ? {
        dueAtSigning: formatMoneyPlain(schedule.dueAtSigning),
        dueAtStart: formatMoneyPlain(schedule.dueAtStart),
        dueUponCompletion: formatMoneyPlain(schedule.dueUponCompletion),
      }
    : null;

  const starred = found?.materials?.starred ?? [];

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setFileName(file.name);
    setFound(null);
    setReadError(null);
    setIsReading(true);
    try {
      setFound(await readEstimateFile(file));
    } catch (err: any) {
      setReadError(err?.message || 'I could not open that file.');
    } finally {
      setIsReading(false);
    }
  };

  // Google Drive: the estimates XL has filed in each job's folder.
  // Google Drive is the main way in, so its list starts open.
  const [driveOpen, setDriveOpen] = useState(driveConfigured);
  const [driveJobs, setDriveJobs] = useState<LoadableJob[] | null>(null);
  // The Drive job the estimate was read from, so the proposal can file its PDF in that job's folder.
  const [pickedJob, setPickedJob] = useState<ProposalDriveJob | null>(null);
  const [driveBusy, setDriveBusy] = useState(false);
  const [driveMsg, setDriveMsg] = useState<string | null>(null);

  const loadDriveJobs = async () => {
    setDriveBusy(true);
    setDriveMsg(null);
    try {
      if (!isDriveConnected()) await connectGoogleDrive();
      setDriveJobs(await listLoadableJobs());
    } catch (err) {
      setDriveMsg(driveError(err));
    }
    setDriveBusy(false);
  };

  // Already signed in to Google on this device: show the job list straight away.
  useEffect(() => {
    if (driveConfigured && isDriveConnected()) void loadDriveJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickDriveJob = async (job: LoadableJob) => {
    setDriveBusy(true);
    setDriveMsg(null);
    try {
      const file = await downloadEstimateFile(job);
      setPickedJob({ jobId: job.jobId, name: job.name, folderId: job.folderId });
      setDriveOpen(false);
      await handleFile(file);
    } catch (err) {
      setDriveMsg(driveError(err));
    }
    setDriveBusy(false);
  };

  // A proposal already saved in the job's Drive folder: open it as it was saved.
  const openSavedProposal = async (job: LoadableJob) => {
    if (!job.proposalFileId) return;
    setDriveBusy(true);
    setDriveMsg(null);
    try {
      const saved = await readSavedProposal(job.proposalFileId);
      onOpenSavedProposal({
        ...saved,
        driveJob: saved.driveJob ?? { jobId: job.jobId, name: job.name, folderId: job.folderId },
      });
    } catch (err) {
      setDriveMsg(driveError(err));
    }
    setDriveBusy(false);
  };

  // A file picked on this computer has no Drive job behind it.
  const handleFileFromComputer = (file: File | undefined) => {
    if (!file) return;
    setPickedJob(null);
    void handleFile(file);
  };

  const handleApply = () => {
    if (!canApply || !found || !payments || totalCents === null) return;
    onApply({
      totalEstimate: formatMoneyPlain(totalCents),
      dueAtSigning: payments.dueAtSigning,
      dueAtStart: payments.dueAtStart,
      dueUponCompletion: payments.dueUponCompletion,
      // Update-only touches the total and payments (and the materials list only if ticked).
      customerName: updateOnly ? null : found.customerName,
      customerAddress: updateOnly ? null : found.customerAddress,
      customerPhone: updateOnly ? null : found.customerPhone,
      customerEmail: updateOnly ? null : found.customerEmail,
      jobDescription: updateOnly ? null : found.jobDescription,
      materials: updateOnly && !replaceMaterials ? [] : starred.map((item) => item.name),
      driveJob: pickedJob,
    }, updating ? 'update' : 'new');
  };

  // Update-only: what the proposal says now next to what the sheet says.
  const sameMoney = (a: string, b: string) => a.replace(/[$,\s]/g, '') === b.replace(/[$,\s]/g, '');
  const changeRows: Array<[string, string, string]> =
    updateOnly && payments && totalCents !== null
      ? [
          ['Total', currentTotal || '', formatMoneyPlain(totalCents)],
          ['Due at signing', currentPayments?.dueAtSigning ?? '', payments.dueAtSigning],
          ['Due at start of job', currentPayments?.dueAtStart ?? '', payments.dueAtStart],
          ['Due on completion', currentPayments?.dueUponCompletion ?? '', payments.dueUponCompletion],
        ]
      : [];

  const infoRows: Array<[string, string | null]> = found
    ? [
        ['Customer name', found.customerName],
        ['Address', found.customerAddress],
        ['Phone', found.customerPhone],
        ['Email', found.customerEmail],
        ['Description of job', found.jobDescription],
      ]
    : [];

  return (
    <div className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
          <FileSpreadsheet className="w-4 h-4" /> {updateOnly ? 'Update From Excel' : 'Load Job Information'}
        </span>
        <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
          {updateOnly
            ? 'Refresh the Price and Payments From the Estimate Sheet'
            : 'Pull Your Job Info and Numbers Straight Off the Estimate Sheet'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          {updateOnly
            ? 'Pick the updated estimate. Only the total and the payment amounts on this proposal change. Your customer info and everything you wrote stay as they are, and nothing in your spreadsheet gets changed.'
            : 'Drop in the saved estimate file. The app reads the customer info, the materials you starred (*), the total, and the payment schedule. Numbers come across exactly as they are in the sheet, and nothing in your spreadsheet gets changed.'}
        </p>
      </div>

      {/* From Google Drive */}
      {driveConfigured && (
        <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-white">From Google Drive</div>
              <div className="text-[11px] text-slate-400">
                The estimates XL filed, and the proposals you saved, in each job's folder. No file hunting.
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !driveOpen;
                setDriveOpen(next);
                if (next && driveJobs === null && isDriveConnected()) void loadDriveJobs();
              }}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shrink-0 cursor-pointer"
            >
              {driveOpen ? 'Hide' : 'Pick from Google Drive'}
            </button>
          </div>
          {driveOpen && (
            <div className="space-y-2">
              {driveMsg && (
                <div className="bg-rose-950/60 border border-rose-500/40 p-3 rounded-xl text-xs text-rose-200">
                  {driveMsg}
                </div>
              )}
              {driveBusy && (
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" /> Working&hellip;
                </div>
              )}
              {driveJobs === null && !driveBusy && (
                <button
                  type="button"
                  onClick={() => void loadDriveJobs()}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold px-4 py-3 rounded-xl border border-slate-700 cursor-pointer"
                >
                  Connect Google Drive
                </button>
              )}
              {driveJobs !== null && driveJobs.length === 0 && !driveBusy && (
                <p className="text-xs text-slate-400">
                  No estimates or saved proposals in Drive yet. In XL, open the job from Google Drive, then export it.
                </p>
              )}
              {driveJobs !== null &&
                driveJobs
                  .filter((job) => !updateOnly || job.estimateFileId)
                  .map((job) => {
                    const when = (
                      <div className="text-[11px] text-slate-400">
                        Saved{' '}
                        {new Date(job.modified).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </div>
                    );
                    // Only an estimate: the whole row picks it, as before.
                    if (!job.proposalFileId || updateOnly) {
                      return (
                        <button
                          key={job.fileId}
                          type="button"
                          disabled={driveBusy}
                          onClick={() => void pickDriveJob(job)}
                          className="w-full text-left rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 px-4 py-3 disabled:opacity-60 cursor-pointer"
                        >
                          <div className="text-sm font-bold text-slate-100">{job.name}</div>
                          {when}
                        </button>
                      );
                    }
                    // A proposal was already saved for this job: open it, or start over from the estimate.
                    return (
                      <div key={job.fileId} className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3">
                        <div className="text-sm font-bold text-slate-100">{job.name}</div>
                        {when}
                        <div className="flex flex-wrap gap-2 mt-2">
                          <button
                            type="button"
                            disabled={driveBusy}
                            onClick={() => void openSavedProposal(job)}
                            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs disabled:opacity-60 cursor-pointer"
                          >
                            Open saved proposal
                          </button>
                          {job.estimateFileId && (
                            <button
                              type="button"
                              disabled={driveBusy}
                              onClick={() => void pickDriveJob(job)}
                              className="bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold px-3 py-1.5 rounded-lg text-xs border border-slate-700 disabled:opacity-60 cursor-pointer"
                            >
                              Start a new proposal from the estimate
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
            </div>
          )}
        </div>
      )}

      {/* Dropzone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFileFromComputer(e.dataTransfer.files?.[0]);
        }}
        className="border-2 border-dashed border-slate-700 hover:border-amber-500 rounded-2xl p-6 text-center space-y-3 bg-slate-950/50 transition-all"
      >
        <Upload className="w-6 h-6 text-slate-400 mx-auto" />
        <div>
          <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold px-4 py-2 rounded-xl border border-slate-700 inline-block transition-colors">
            From a file on this computer (.xlsx)
            <input
              type="file"
              accept=".xlsx"
              onChange={(e) => handleFileFromComputer(e.target.files?.[0])}
              className="hidden"
            />
          </label>
          <p className="text-[11px] text-slate-500 mt-2">
            Or drag the file onto this box. The file is read here in the browser &mdash; it never leaves
            your computer.
          </p>
        </div>
        {fileName && (
          <p className="text-xs font-semibold text-emerald-400 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> {fileName}
          </p>
        )}
      </div>

      {isReading && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-center gap-2 text-sm text-slate-300">
          <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
          <span>Reading your estimate sheet&hellip;</span>
        </div>
      )}

      {readError && (
        <div className="bg-rose-950/60 border border-rose-500/40 p-4 rounded-xl text-xs text-rose-200 flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{readError}</span>
        </div>
      )}

      {/* What was found */}
      {found && !readError && (
        <div className="space-y-4">
          {/* Heads-ups come first so they can't be missed */}
          {found.warnings.length > 0 && (
            <div className="bg-amber-950/40 border border-amber-500/40 p-4 rounded-xl text-xs text-amber-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <Info className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Take a look before you use this</span>
              </div>
              <ul className="list-disc pl-5 space-y-1">
                {found.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-slate-950 border border-amber-500/40 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                Here's what I Read
              </span>
              <span className="text-[11px] text-slate-400">from your "{found.sheetName}" tab</span>
            </div>

            {/* Customer info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs border-b border-slate-800 pb-3">
              {infoRows.map(([label, value]) => (
                <div key={label} className="space-y-0.5">
                  <span className="text-slate-400 font-medium">{label}</span>
                  <div className={value ? 'text-slate-100 font-semibold' : 'text-slate-500 italic'}>
                    {value || '(empty on the sheet)'}
                  </div>
                </div>
              ))}
            </div>

            {/* Total + payments */}
            <div className="flex items-baseline justify-between gap-3 border-b border-slate-800 pb-3">
              <span className="text-sm text-slate-300">Total Contract Amount</span>
              <span className="text-2xl font-black text-amber-300">
                {totalCents !== null ? asMoney(totalCents) : '\u2014'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {[
                ['Due at signing', payments?.dueAtSigning],
                ['Due at start of job', payments?.dueAtStart],
                ['Due on completion', payments?.dueUponCompletion],
              ].map(([label, value]) => (
                <div key={label as string} className="space-y-1">
                  <span className="text-slate-400 font-medium">{label as string}</span>
                  <div className="text-amber-300 font-bold">{value ? `$${value}` : '\u2014'}</div>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
              Half at signing, a quarter at the start of the job, the rest on completion. If the total
              doesn't split into even pennies, the odd one rides on the final payment so all three add
              back up to the total exactly.
            </p>

            {/* Starred materials */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Materials you starred ({starred.length})
                </span>
                <span className="text-[11px] text-slate-400">names only &mdash; no prices come across</span>
              </div>
              {starred.length > 0 ? (
                <ol className="text-xs text-slate-200 space-y-1 max-h-56 overflow-y-auto pr-1 list-decimal pl-5">
                  {starred.map((item, index) => (
                    <li key={`${index}-${item.name}`}>
                      {item.name}
                      {item.priced === false && (
                        <span className="ml-2 text-[10px] font-bold text-amber-300 border border-amber-500/50 rounded px-1.5 py-0.5">
                          no price on sheet
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-xs text-slate-500 italic">None found.</p>
              )}
              {updateOnly && starred.length > 0 && materialsSectionCount !== null && (
                <label className="flex items-start gap-2 text-xs text-slate-200 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={replaceMaterials}
                    onChange={(e) => setReplaceMaterials(e.target.checked)}
                    className="mt-0.5 accent-amber-500"
                  />
                  <span>
                    Also replace the {materialsSectionCount} line{materialsSectionCount === 1 ? '' : 's'} now in this
                    proposal's Material description section with these starred materials. Leave this unticked to keep
                    your wording as it is.
                  </span>
                </label>
              )}
              {updating && !updateOnly && starred.length > 0 && materialsSectionCount === null && (
                <p className="text-[11px] text-amber-300">
                  This proposal has no "Material description" section, so these won't be added.
                </p>
              )}
              {updating && !updateOnly && starred.length > 0 && materialsSectionCount !== null && materialsSectionCount > 0 && (
                <p className="text-[11px] text-slate-400">
                  This will replace the {materialsSectionCount} line{materialsSectionCount === 1 ? '' : 's'}{' '}
                  now in the Material description section.
                </p>
              )}
            </div>
          </div>

          {found.missingLabels.length > 0 && (
            <div className="bg-amber-950/40 border border-amber-500/40 p-4 rounded-xl text-xs text-amber-200 flex items-start space-x-2">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                I couldn't find these labels in the file: {found.missingLabels.join(', ')}. Anything
                missing above you can just type in yourself on the next screens.
              </span>
            </div>
          )}

          {existingName !== null && !updateOnly && (
            <div className="bg-slate-950 border border-slate-700 rounded-xl p-4 space-y-2">
              <div className="text-xs font-semibold text-amber-300">Where should this go?</div>
              <button
                type="button"
                onClick={() => setMode('new')}
                className={`w-full text-left rounded-xl border px-4 py-3 transition-all cursor-pointer ${
                  !updating ? 'border-amber-500 bg-amber-500/10' : 'border-slate-700 bg-slate-900 hover:bg-slate-800'
                }`}
              >
                <div className="text-sm font-bold text-slate-100">Start a new proposal from this sheet</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Your other proposals are not touched.</div>
              </button>
              <button
                type="button"
                onClick={() => setMode('update')}
                className={`w-full text-left rounded-xl border px-4 py-3 transition-all cursor-pointer ${
                  updating ? 'border-amber-500 bg-amber-500/10' : 'border-slate-700 bg-slate-900 hover:bg-slate-800'
                }`}
              >
                <div className="text-sm font-bold text-slate-100">Update {existingName}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Replaces that proposal's customer info, total and payments with this sheet's.
                </div>
              </button>
            </div>
          )}

          {changeRows.length > 0 && (
            <div className="bg-slate-950 border border-slate-700 rounded-xl p-4 space-y-2">
              <div className="text-xs font-semibold text-amber-300">What will change on this proposal</div>
              <div className="space-y-1.5">
                {changeRows.map(([label, was, now]) => {
                  const unchanged = was !== '' && sameMoney(was, now);
                  return (
                    <div key={label} className="flex items-baseline justify-between gap-3 text-xs">
                      <span className="text-slate-300">{label}</span>
                      <span className="text-right">
                        {unchanged ? (
                          <span className="text-slate-400">${now} &mdash; no change</span>
                        ) : (
                          <>
                            {was !== '' && (
                              <span className="text-slate-500 line-through mr-2">${was.replace('$', '')}</span>
                            )}
                            <span className="text-amber-300 font-bold">${now}</span>
                          </>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {updating && !updateOnly && currentTotal && (            <p className="text-[11px] text-slate-400">
              This will replace the total that's on the proposal right now (${currentTotal.replace('$', '')}).
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2 border-t border-slate-800">
        <button
          onClick={onClose}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
        >
          Cancel
        </button>

        {found && (
          <button
            onClick={() => {
              setFound(null);
              setFileName(null);
              setReadError(null);
            }}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Different File
          </button>
        )}

        <button
          onClick={handleApply}
          disabled={!canApply}
          className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl shadow-lg text-xs sm:text-sm flex items-center justify-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          <span>{updating ? 'Update This Proposal' : existingName !== null ? 'Create New Proposal' : 'Use This Info'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
