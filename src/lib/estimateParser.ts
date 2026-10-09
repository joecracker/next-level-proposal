/**
 * Reads the labelled info and numbers out of Tim's estimate sheet.
 *
 * This file is deliberately plain and self-contained - it takes rows of spreadsheet
 * cells and hands back what it found. No library, no browser, no AI. That way the
 * exact rules below can be tested on their own (see tools/check_estimate_reader.ts).
 *
 * THE RULES:
 *  - The sheet is not re-formatted and nothing is added to it. We look for the labels
 *    the sheet already uses.
 *  - Money on a labelled row is the LAST number on that row (on the payment rows the
 *    "50%" and "25%" text sits to the left of the dollar amount, so "the next cell
 *    over" would grab the wrong thing).
 *  - Text (customer name, address, phone, description of job) is the cell directly
 *    beside its label - never further along the row.
 *  - Materials: a line whose name starts with a star (*) is one the customer should see.
 *    Only its NAME crosses over. No cost, no markup, no showroom retail - ever. The
 *    only thing read from the price columns is whether the customer price is above
 *    zero, so a starred line with no price can be flagged. The amount itself is
 *    never kept.
 */

export type EstimateCell = string | number | boolean | Date | null;
export type EstimateRows = EstimateCell[][];

export interface ParsedEstimate {
  /** Null when the sheet doesn't carry that label. */
  total: number | null;
  dueAtSigning: number | null;
  dueAtStart: number | null;
  dueUponCompletion: number | null;
  /** The text beside each label. Null when the label is missing OR the cell is empty. */
  customerName: string | null;
  customerAddress: string | null;
  customerPhone: string | null;
  jobDescription: string | null;
  /** Plain-English labels we found, so the screen can show what it actually read. */
  foundLabels: string[];
  /** Plain-English labels we looked for and didn't find. */
  missingLabels: string[];
}

/** The exact labels the summary tab uses. Nothing new gets written into the sheet. */
export const ESTIMATE_LABELS = {
  total: 'Total Contract Amount',
  dueAtSigning: 'Due at Signing (1/2 Down)',
  dueAtStart: 'Due at Start of Job (1/4)',
  dueUponCompletion: 'Due Upon Completion (1/4)',
  customerName: 'Customer Name:',
  customerAddress: 'Customer Address:',
  customerPhone: 'Customer Phone:',
  jobDescription: 'Description of Job:',
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
 * The value belonging to a text label is the cell directly beside it - no hunting
 * further along the row. That matters on the summary sheet, where "Customer Name:"
 * sits in column A and "Date:" sits off in column D, so looking further right could
 * read a second label back as the value. A phone number typed as a plain number is
 * turned into text; a cell that is itself a label (ends with a colon) counts as empty.
 */
const textBesideLabel = (row: EstimateCell[], column: number): string | null => {
  const cell = row[column + 1];
  let text = '';
  if (typeof cell === 'string') text = cell.trim();
  else if (typeof cell === 'number' && Number.isFinite(cell)) text = String(cell);
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

  const readText = (label: string): string | null => {
    const hit = findLabel(rows, label);
    if (!hit) {
      missingLabels.push(label);
      return null;
    }
    foundLabels.push(label);
    return textBesideLabel(hit.row, hit.column);
  };

  const total = readMoney(ESTIMATE_LABELS.total);
  const dueAtSigning = readMoney(ESTIMATE_LABELS.dueAtSigning);
  const dueAtStart = readMoney(ESTIMATE_LABELS.dueAtStart);
  const dueUponCompletion = readMoney(ESTIMATE_LABELS.dueUponCompletion);
  const customerName = readText(ESTIMATE_LABELS.customerName);
  const customerAddress = readText(ESTIMATE_LABELS.customerAddress);
  const customerPhone = readText(ESTIMATE_LABELS.customerPhone);
  const jobDescription = readText(ESTIMATE_LABELS.jobDescription);

  return {
    total,
    dueAtSigning,
    dueAtStart,
    dueUponCompletion,
    customerName,
    customerAddress,
    customerPhone,
    jobDescription,
    foundLabels,
    missingLabels,
  };
}

/* ------------------------------------------------------------------ */
/* Materials                                                           */
/* ------------------------------------------------------------------ */

export interface StarredMaterial {
  /** Exactly as typed on the sheet, minus the leading star. A name only - never a price. */
  name: string;
  /**
   * True when the sheet shows a customer price above zero for the line, false when it is
   * zero or blank (so the line is counting as $0), null when the sheet has no
   * "Customer Price" column to check against.
   */
  priced: boolean | null;
}

export interface ParsedMaterials {
  starred: StarredMaterial[];
  /** Lines WITHOUT a star that have a quantity but no customer price (counting as $0). */
  unstarredUnpriced: number;
  /** False when a materials table was found but its "Customer Price" column was not. */
  priceColumnFound: boolean;
}

/** The first-column headings that mark a materials table (regular lines and the showroom block). */
const MATERIALS_TABLE_HEADINGS = ['materialitem', 'showroomitemdescription'];

const columnOfHeading = (row: EstimateCell[], heading: string): number | null => {
  for (let column = 0; column < row.length; column++) {
    if (normalize(row[column]) === heading) return column;
  }
  return null;
};

const isPositive = (cell: EstimateCell | undefined): boolean =>
  typeof cell === 'number' && Number.isFinite(cell) && cell > 0;

/**
 * Looks through one sheet for materials tables. Returns null when the sheet has none.
 * Each table is found by its heading row ("Material Item" / "Showroom Item Description"),
 * and the "Customer Price" and "Qty" columns are found by their headings too, so a
 * moved column does not silently read the wrong cell.
 */
export function parseMaterialsRows(rows: EstimateRows): ParsedMaterials | null {
  let foundTable = false;
  let priceColumnFound = true;
  let priceColumn: number | null = null;
  let qtyColumn: number | null = null;
  let inTable = false;
  const starred: StarredMaterial[] = [];
  let unstarredUnpriced = 0;

  for (const row of rows) {
    if (!Array.isArray(row)) continue;

    if (MATERIALS_TABLE_HEADINGS.includes(normalize(row[0]))) {
      foundTable = true;
      inTable = true;
      priceColumn = columnOfHeading(row, 'customerprice');
      qtyColumn = columnOfHeading(row, 'qty');
      if (priceColumn === null) priceColumnFound = false;
      continue;
    }
    if (!inTable) continue;

    const label = typeof row[0] === 'string' ? row[0].trim() : '';
    if (label === '') continue;

    const price = priceColumn === null ? undefined : row[priceColumn];

    if (label.startsWith('*')) {
      const name = label.replace(/^\*+\s*/, '').trim();
      if (name === '') continue;
      starred.push({ name, priced: priceColumn === null ? null : isPositive(price) });
    } else if (priceColumn !== null && qtyColumn !== null) {
      if (isPositive(row[qtyColumn]) && !isPositive(price)) unstarredUnpriced++;
    }
  }

  return foundTable ? { starred, unstarredUnpriced, priceColumnFound } : null;
}

/* ------------------------------------------------------------------ */
/* Warnings                                                            */
/* ------------------------------------------------------------------ */

const shortName = (name: string): string => {
  const flat = name.replace(/\s+/g, ' ');
  return flat.length > 48 ? flat.slice(0, 47).trimEnd() + '...' : flat;
};

/**
 * Plain-English heads-ups for things that look like the sheet isn't finished. A warning
 * never changes a number - it only tells Tim to go look.
 */
export function buildWarnings(summary: ParsedEstimate, materials: ParsedMaterials | null): string[] {
  const warnings: string[] = [];

  if (summary.total === 0) {
    warnings.push(
      "Every number in this file is $0.00 - that's what an empty template looks like. Fill your estimate in, " +
        'recalculate (Ctrl+Shift+F9), save the file, and load it again.'
    );
  }

  const textFields: Array<[keyof ParsedEstimate, string]> = [
    ['customerName', ESTIMATE_LABELS.customerName],
    ['customerAddress', ESTIMATE_LABELS.customerAddress],
    ['customerPhone', ESTIMATE_LABELS.customerPhone],
    ['jobDescription', ESTIMATE_LABELS.jobDescription],
  ];
  for (const [field, label] of textFields) {
    if (summary.foundLabels.includes(label) && summary[field] === null) {
      warnings.push(`The sheet's "${label.replace(/:$/, '')}" is empty, so that slot on the proposal stays blank.`);
    }
  }

  if (materials === null) {
    warnings.push(
      "I couldn't find a materials table (a column headed \"Material Item\"), so no materials came across."
    );
  } else {
    if (materials.starred.length === 0) {
      warnings.push('No starred (*) materials were found, so the Material description section stays as it is.');
    }

    const unpriced = materials.starred.filter((item) => item.priced === false);
    if (unpriced.length > 0) {
      const names = unpriced.map((item) => `"${shortName(item.name)}"`).join('; ');
      warnings.push(
        unpriced.length === 1
          ? `1 starred item has no price on the sheet, so it is counting as $0 in the total: ${names}.`
          : `${unpriced.length} starred items have no price on the sheet, so they are counting as $0 in the total: ${names}.`
      );
    }

    if (materials.unstarredUnpriced > 0) {
      warnings.push(
        materials.unstarredUnpriced === 1
          ? '1 other materials line has a quantity but no price, so it is counting as $0 in the total.'
          : `${materials.unstarredUnpriced} other materials lines have a quantity but no price, so they are counting as $0 in the total.`
      );
    }

    if (!materials.priceColumnFound && materials.starred.length > 0) {
      warnings.push(
        "I couldn't find a \"Customer Price\" column in the materials table, so I couldn't check whether the starred items are priced."
      );
    }
  }

  return warnings;
}
