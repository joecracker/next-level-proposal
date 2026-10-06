/**
 * Reads the labelled numbers out of the boss's estimate sheet.
 *
 * This file is deliberately plain and self-contained — it takes rows of spreadsheet
 * cells and hands back the numbers it found. No library, no browser, no AI. That way
 * the exact rule below can be tested on its own.
 *
 * THE RULE: the sheet is not re-formatted and nothing is added to it. We look for the
 * labels the sheet already uses, and the money on a labelled row is the LAST number on
 * that row (on the payment rows the "50%" and "25%" text sits to the left of the dollar
 * amount, so "the next cell over" would grab the wrong thing).
 */

export type EstimateCell = string | number | boolean | Date | null;
export type EstimateRows = EstimateCell[][];

export interface ParsedEstimate {
  /** Null when the sheet doesn't carry that label. */
  total: number | null;
  dueAtSigning: number | null;
  dueAtStart: number | null;
  dueUponCompletion: number | null;
  jobName: string | null;
  /** Plain-English labels we found, so the screen can show what it actually read. */
  foundLabels: string[];
  /** Plain-English labels we looked for and didn't find. */
  missingLabels: string[];
}

/** The exact labels the summary tab already uses. Nothing new gets written into the sheet. */
export const ESTIMATE_LABELS = {
  total: 'Total Contract Amount',
  dueAtSigning: 'Due at Signing (1/2 Down)',
  dueAtStart: 'Due at Start of Job (1/4)',
  dueUponCompletion: 'Due Upon Completion (1/4)',
  jobName: 'Job Name:',
} as const;

const normalize = (value: unknown): string =>
  String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const findLabel = (rows: EstimateRows, label: string) => {
  const target = normalize(label);
  for (const row of rows) {
    if (!Array.isArray(row)) continue;
    for (let column = 0; column < row.length; column++) {
      if (normalize(row[column]) === target) return { row, column };
    }
  }
  return null;
};

const lastNumberInRow = (row: EstimateCell[]): number | null => {
  for (let column = row.length - 1; column >= 0; column--) {
    const cell = row[column];
    if (typeof cell === 'number' && Number.isFinite(cell)) return cell;
  }
  return null;
};

/**
 * The value belonging to a label is the cell directly beside it — no hunting further
 * along the row. That matters on the summary sheet, where "Job Name:" sits in column A
 * and "Date:" sits off in column D, so looking further right would read a second label
 * back as the job name.
 */
const textInNextCell = (row: EstimateCell[], column: number): string | null => {
  const cell = row[column + 1];
  if (typeof cell !== 'string') return null;
  const text = cell.trim();
  if (text === '' || text.endsWith(':')) return null;
  return text;
};

export function parseEstimateRows(rows: EstimateRows): ParsedEstimate {
  const foundLabels: string[] = [];
  const missingLabels: string[] = [];

  const readMoney = (label: string): number | null => {
    const hit = findLabel(rows, label);
    if (!hit) {
      missingLabels.push(label);
      return null;
    }
    foundLabels.push(label);
    return lastNumberInRow(hit.row);
  };

  const total = readMoney(ESTIMATE_LABELS.total);
  const dueAtSigning = readMoney(ESTIMATE_LABELS.dueAtSigning);
  const dueAtStart = readMoney(ESTIMATE_LABELS.dueAtStart);
  const dueUponCompletion = readMoney(ESTIMATE_LABELS.dueUponCompletion);

  const jobNameHit = findLabel(rows, ESTIMATE_LABELS.jobName);
  if (jobNameHit) foundLabels.push(ESTIMATE_LABELS.jobName);
  const jobName = jobNameHit ? textInNextCell(jobNameHit.row, jobNameHit.column) : null;

  return {
    total,
    dueAtSigning,
    dueAtStart,
    dueUponCompletion,
    jobName,
    foundLabels,
    missingLabels,
  };
}
