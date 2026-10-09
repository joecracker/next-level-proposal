/**
 * Reads Tim's .xlsx estimate file right in the browser.
 *
 * No upload, no conversion, no AI. The workbook is opened locally, every sheet is
 * looked at, and whichever sheet carries the summary labels is the one we read the
 * customer info and numbers from. Starred materials come from whichever sheet has a
 * materials table. The numbers are copied out exactly as Excel/LibreOffice last saved them.
 *
 * Getting the file is the only browser-specific part (readEstimateFile). Everything
 * after that (readEstimateSheets) is plain code, so a desktop version of the app can
 * hand it the same rows from a file it opens by itself.
 */
import readXlsxFile from 'read-excel-file/browser';
import {
  parseEstimateRows,
  parseMaterialsRows,
  buildWarnings,
  ParsedEstimate,
  ParsedMaterials,
  EstimateRows,
} from './estimateParser';

export interface EstimateRead extends ParsedEstimate {
  /** The tab the numbers came from, so the screen can show where they were read. */
  sheetName: string;
  /** Starred materials (names only), or null when no materials table was found. */
  materials: ParsedMaterials | null;
  /** Plain-English heads-ups about anything that looks unfinished. */
  warnings: string[];
}

export interface SheetRows {
  name: string;
  rows: EstimateRows;
}

export function readEstimateSheets(sheets: SheetRows[]): EstimateRead {
  let best: (ParsedEstimate & { sheetName: string }) | null = null;
  let materials: ParsedMaterials | null = null;

  for (const sheet of sheets) {
    const parsed = parseEstimateRows(sheet.rows);
    if (parsed.foundLabels.length > 0) {
      const candidate = { ...parsed, sheetName: sheet.name };
      if (!best || candidate.foundLabels.length > best.foundLabels.length) {
        best = candidate;
      }
    }

    const found = parseMaterialsRows(sheet.rows);
    if (found) {
      materials = materials
        ? {
            starred: [...materials.starred, ...found.starred],
            unstarredUnpriced: materials.unstarredUnpriced + found.unstarredUnpriced,
            priceColumnFound: materials.priceColumnFound && found.priceColumnFound,
          }
        : found;
    }
  }

  if (!best) {
    throw new Error(
      "That file doesn't look like your estimate sheet. I look for the labels on your summary tab: " +
        'Total Contract Amount, Due at Signing (1/2 Down), Due at Start of Job (1/4), and Due Upon Completion (1/4).'
    );
  }

  return { ...best, materials, warnings: buildWarnings(best, materials) };
}

export async function readEstimateFile(file: File): Promise<EstimateRead> {
  const sheets = await readXlsxFile(file);
  return readEstimateSheets(
    sheets.map((sheet) => ({ name: sheet.sheet, rows: (sheet.data || []) as EstimateRows }))
  );
}
