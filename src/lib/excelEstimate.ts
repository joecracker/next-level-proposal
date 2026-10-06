/**
 * Reads the boss's .xlsx estimate file right in the browser.
 *
 * No upload, no conversion, no AI. The workbook is opened locally, every sheet is
 * looked at, and whichever sheet carries the summary labels is the one we read.
 * The numbers are copied out exactly as Excel/LibreOffice last saved them.
 */
import readXlsxFile from 'read-excel-file/browser';
import { parseEstimateRows, ParsedEstimate, EstimateRows } from './estimateParser';

export interface EstimateRead extends ParsedEstimate {
  /** The tab the numbers came from, so the screen can show where they were read. */
  sheetName: string;
}

export async function readEstimateFile(file: File): Promise<EstimateRead> {
  const sheets = await readXlsxFile(file);

  let best: EstimateRead | null = null;

  for (const sheet of sheets) {
    const parsed = parseEstimateRows((sheet.data || []) as EstimateRows);
    if (parsed.foundLabels.length === 0) continue;

    const candidate: EstimateRead = { ...parsed, sheetName: sheet.sheet };
    if (!best || candidate.foundLabels.length > best.foundLabels.length) {
      best = candidate;
    }
    // Found every label we look for — no reason to keep reading tabs.
    if (candidate.missingLabels.length === 0) break;
  }

  if (!best) {
    throw new Error(
      "That file doesn't look like your estimate sheet. I look for the labels on your summary tab: " +
        'Total Contract Amount, Due at Signing (1/2 Down), Due at Start of Job (1/4), and Due Upon Completion (1/4).'
    );
  }

  return best;
}
