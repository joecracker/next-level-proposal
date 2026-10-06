/**
 * Money helpers for the estimate numbers.
 *
 * Nothing here does business math on the boss's estimate. The spreadsheet is the
 * calculator — the only thing worked out below is the payment split, and that is
 * just dividing a total we already have: half, a quarter, a quarter.
 */

/** Formats whole cents as a plain dollar string like "18,400.00" (no dollar sign). */
export const formatMoneyPlain = (cents: number): string =>
  (cents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/** Reads a typed money string ("$18,400", "18400.5") into whole cents, or null if unusable. */
export const parseMoneyToCents = (value: string): number | null => {
  const cleaned = String(value ?? '').replace(/[^0-9.]/g, '');
  if (!/[0-9]/.test(cleaned)) return null;
  const amount = Number(cleaned);
  if (!Number.isFinite(amount)) return null;
  return Math.round(amount * 100);
};

/**
 * The boss's payment schedule: half at signing, a quarter at the start of the job,
 * a quarter on completion. The first two round down to the penny and the leftover
 * pennies land on the final payment, so the three always add back up to the total.
 * Returns null if the total isn't a usable number.
 */
export const splitPaymentSchedule = (estimate: string) => {
  const totalCents = parseMoneyToCents(estimate);
  if (totalCents === null) return null;

  const dueAtSigning = Math.floor(totalCents / 2);
  const dueAtStart = Math.floor(totalCents / 4);

  return {
    dueAtSigning: formatMoneyPlain(dueAtSigning),
    dueAtStart: formatMoneyPlain(dueAtStart),
    dueUponCompletion: formatMoneyPlain(totalCents - dueAtSigning - dueAtStart),
  };
};
