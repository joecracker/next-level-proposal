import React, { useState } from 'react';
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
import { dollarsToCents, formatMoneyPlain, paymentScheduleCents } from '../lib/money';

/** What the app needs handed back once the numbers are approved. */
export interface EstimateImportResult {
  totalEstimate: string;
  dueAtSigning: string;
  dueAtStart: string;
  dueUponCompletion: string;
  jobName: string | null;
}

interface EstimateImportModalProps {
  currentTotal: string;
  onApply: (result: EstimateImportResult) => void;
  onClose: () => void;
}

const asMoney = (cents: number) => `$${formatMoneyPlain(cents)}`;

export const EstimateImportModal: React.FC<EstimateImportModalProps> = ({
  currentTotal,
  onApply,
  onClose,
}) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [readError, setReadError] = useState<string | null>(null);
  const [found, setFound] = useState<EstimateRead | null>(null);

  // The sheet hands back dollars and cents (1826.769232). Everything on this screen works in
  // whole cents, so the moment the file is read we switch to cents and stay there.
  const totalCents = found && typeof found.total === 'number' ? dollarsToCents(found.total) : null;

  const isBlankTotal = totalCents === 0;
  const canApply = totalCents !== null && totalCents !== 0;

  // Half / quarter / quarter of the total — the sheet's own schedule. The sheet's signing and
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

  const handleApply = () => {
    if (!canApply || !found || !payments || totalCents === null) return;
    onApply({
      totalEstimate: formatMoneyPlain(totalCents),
      dueAtSigning: payments.dueAtSigning,
      dueAtStart: payments.dueAtStart,
      dueUponCompletion: payments.dueUponCompletion,
      jobName: found.jobName,
    });
  };

  return (
    <div className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
          <FileSpreadsheet className="w-4 h-4" /> Load Numbers From Excel
        </span>
        <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
          Pull Your Job Numbers Straight Off the Estimate Sheet
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Drop in the saved estimate file. The app reads the total and the payment schedule off your
          summary tab — the numbers come across exactly as they are in the sheet, and nothing in your
          spreadsheet gets changed.
        </p>
      </div>

      {/* Dropzone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void handleFile(e.dataTransfer.files?.[0]);
        }}
        className="border-2 border-dashed border-slate-700 hover:border-amber-500 rounded-2xl p-6 text-center space-y-3 bg-slate-950/50 transition-all"
      >
        <Upload className="w-8 h-8 text-amber-400 mx-auto" />
        <div>
          <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold px-4 py-2 rounded-xl border border-slate-700 inline-block transition-colors">
            Choose Your Estimate File (.xlsx)
            <input
              type="file"
              accept=".xlsx"
              onChange={(e) => void handleFile(e.target.files?.[0])}
              className="hidden"
            />
          </label>
          <p className="text-[11px] text-slate-500 mt-2">
            Or drag the file onto this box. The file is read here in the browser — it never leaves your
            computer.
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
          <span>Reading your estimate sheet…</span>
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
          <div className="bg-slate-950 border border-amber-500/40 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                Here's what I Read
              </span>
              <span className="text-[11px] text-slate-400">
                from your "{found.sheetName}" tab
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-3 border-b border-slate-800 pb-3">
              <span className="text-sm text-slate-300">Total Contract Amount</span>
              <span className="text-2xl font-black text-amber-300">
                {totalCents !== null ? asMoney(totalCents) : '—'}
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
                  <div className="text-amber-300 font-bold">{value ? `$${value}` : '—'}</div>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
              Half at signing, a quarter at the start of the job, the rest on completion. If the total
              doesn't split into even pennies, the odd one rides on the final payment so all three add
              back up to the total exactly.
            </p>

            {found.jobName && (
              <p className="text-xs text-slate-300">
                <span className="font-semibold">Job name on the sheet:</span> {found.jobName}
              </p>
            )}
          </div>

          {found.missingLabels.length > 0 && (
            <div className="bg-amber-950/40 border border-amber-500/40 p-4 rounded-xl text-xs text-amber-200 flex items-start space-x-2">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                I couldn't find these labels in the file: {found.missingLabels.join(', ')}. Anything
                missing above you can just type in yourself on the next screen.
              </span>
            </div>
          )}

          {isBlankTotal && (
            <div className="bg-amber-950/40 border border-amber-500/40 p-4 rounded-xl text-xs text-amber-200 flex items-start space-x-2">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                Every number in this file is $0.00 — that's what an empty template looks like. Fill your
                estimate in and drop the saved file back in. (If you know it's filled in, hit Ctrl+Shift+F9
                in the spreadsheet to recalculate, save it, and try again.)
              </span>
            </div>
          )}

          {currentTotal && (
            <p className="text-[11px] text-slate-400">
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
          <span>Use These Numbers</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
