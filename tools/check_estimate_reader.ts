/**
 * Check for the estimate reader (src/lib/estimateParser.ts + excelEstimate.ts).
 *
 *   npx tsx tools/check_estimate_reader.ts                 -> runs the built-in rule checks
 *   npx tsx tools/check_estimate_reader.ts "<file.xlsx>"   -> also reads that workbook and
 *                                                              prints exactly what the app would pull out
 *
 * Read-only: it opens the workbook, never saves it.
 */
import readXlsxFile from 'read-excel-file/node';
import { readEstimateSheets } from '../src/lib/excelEstimate';
import { parseEstimateRows, parseMaterialsRows, buildWarnings, EstimateRows } from '../src/lib/estimateParser';

let failures = 0;
const check = (name: string, ok: boolean, detail?: unknown) => {
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : '  -> ' + JSON.stringify(detail)}`);
};

/* ---- built-in rule checks (small made-up sheets, no real job data) ---- */
const summary: EstimateRows = [
  ['Customer Name:', 'Pat Example', null, null, null],
  ['Customer Address:', '1 Main St', null, null, null],
  ['Customer Phone:', 8105551234, null, null, null],
  ['Description of Job:', 'Bathroom remodel', null, 'Date:', new Date(2026, 9, 10)],
  ['Total Contract Amount', null, 1000.456],
  ['Due at Signing (1/2 Down)', '50%', 500.228],
  ['Due at Start of Job (1/4)', '25%', 250.114],
  ['Due Upon Completion (1/4)', '25%', 250.114],
];
const s = parseEstimateRows(summary);
check('customer name read', s.customerName === 'Pat Example', s.customerName);
check('address read', s.customerAddress === '1 Main St', s.customerAddress);
check('phone typed as a number becomes text, digits intact', s.customerPhone === '8105551234', s.customerPhone);
check('description read, and the Date label is NOT read back as a value', s.jobDescription === 'Bathroom remodel', s.jobDescription);
check('total is the last number on its row (not the 50% text)', s.total === 1000.456, s.total);
check('payments read', s.dueAtSigning === 500.228 && s.dueAtStart === 250.114 && s.dueUponCompletion === 250.114);
check('nothing missing on a complete sheet', s.missingLabels.length === 0, s.missingLabels);

const empty = parseEstimateRows([['Customer Name:', null], ['Customer Address:', 'Phone:']]);
check('empty cell beside a label gives null', empty.customerName === null);
check('a neighbouring label is not mistaken for a value', empty.customerAddress === null);

const materials: EstimateRows = [
  ['Material Item', 'Qty', 'Unit Cost', 'Our Cost', 'Markup %', 'Customer Price'],
  ['*Priced door ', 1, 100, 106, 0.25, 132.5],
  ['*Unpriced door', 1, null, 0, 0.25, 0],
  ['Rough lumber', 1, null, 100, 0.25, 125],
  ['Loose item with qty only', 2, null, 0, 0.25, 0],
  [null, null, null, null, 0.25, 0],
  ['Total Materials & Fees', null, null, 106, null, 132.5],
  [],
  ['Showroom Item Description', 'Qty', 'Direct Cost/Unit', 'Total Internal Cost', 'Showroom Retail Price/Unit', 'Customer Price', 'Profit'],
  ['*Faucet', 1, 200, 212, 250, 265, 53],
  ['Toilet seat (no star)', 1, 47, 50, 66, 70, 20],
];
const m = parseMaterialsRows(materials);
check('finds the materials tables', m !== null);
check('keeps only starred lines, in order, star and trailing space removed',
  JSON.stringify(m?.starred.map((x) => x.name)) === JSON.stringify(['Priced door', 'Unpriced door', 'Faucet']), m?.starred);
check('flags priced / unpriced correctly',
  JSON.stringify(m?.starred.map((x) => x.priced)) === JSON.stringify([true, false, true]), m?.starred);
check('counts unstarred lines with a quantity but no price', m?.unstarredUnpriced === 1, m?.unstarredUnpriced);
check('no cost or price amounts are carried in the result', !JSON.stringify(m).match(/132|265|212|250/));
check('a sheet with no materials table returns null', parseMaterialsRows(summary) === null);
const w = buildWarnings(s, m);
check('warns about the unpriced starred item by name', w.some((x) => x.includes('Unpriced door') && x.startsWith('1 starred item')), w);
check('warns about the other unpriced line', w.some((x) => x.startsWith('1 other materials line')), w);
check('a $0 total warns', buildWarnings({ ...s, total: 0 }, m).some((x) => x.includes('$0.00')));
check('a clean sheet has no warnings',
  buildWarnings(s, { starred: [{ name: 'X', priced: true }], unstarredUnpriced: 0, priceColumnFound: true }).length === 0);

/* ---- optional: read a real workbook and show what the app would pull out ---- */
const file = process.argv[2];
if (file) {
  const sheets = (await readXlsxFile(file)) as unknown as Array<{ sheet: string; data: EstimateRows }>;
  const read = readEstimateSheets(sheets.map((x) => ({ name: x.sheet, rows: x.data })));
  console.log('\n=== What the app would read from: ' + file);
  console.log('summary tab      :', read.sheetName);
  console.log('customer name    :', JSON.stringify(read.customerName));
  console.log('customer address :', JSON.stringify(read.customerAddress));
  console.log('customer phone   :', JSON.stringify(read.customerPhone));
  console.log('description      :', JSON.stringify(read.jobDescription));
  console.log('total            :', read.total);
  console.log('signing/start/end:', read.dueAtSigning, read.dueAtStart, read.dueUponCompletion);
  console.log('labels missing   :', JSON.stringify(read.missingLabels));
  console.log('starred materials:', read.materials?.starred.length ?? 'no materials table');
  read.materials?.starred.forEach((item, i) =>
    console.log(`  ${String(i + 1).padStart(2)}. [${item.priced === true ? 'priced ' : item.priced === false ? 'NO PRICE' : 'unknown '}] ${item.name}`)
  );
  const odd = read.materials?.starred.filter((x) => /[^\x20-\x7e]/.test(x.name)) ?? [];
  odd.forEach((x) =>
    console.log('  non-plain characters in:', x.name, '->', [...x.name].filter((c) => /[^\x20-\x7e]/.test(c)).map((c) => 'U+' + c.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')).join(' '))
  );
  console.log('other unpriced   :', read.materials?.unstarredUnpriced);
  console.log('warnings         :');
  read.warnings.forEach((x) => console.log('  - ' + x));
}

console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
