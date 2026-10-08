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

/** A spreadsheet cell holds dollars and cents (1826.769232); this makes it whole cents. */
export const dollarsToCents = (value: number): number => Math.round(value * 100);

export interface PaymentScheduleCents {
  dueAtSigning: number;
  dueAtStart: number;
  dueUponCompletion: number;
}

/**
 * The boss's payment schedule, in whole cents: half at signing, a quarter at the start of the
 * job, and whatever is left on completion. The first two round down to the penny, so an odd
 * penny always rides on the final payment and the three add back up to the total exactly —
 * never a cent short.
 *
 * When the sheet already carries its own signing / start figures, those are kept; the
 * completion payment is still worked out as the exact remainder, so the three always balance.
 */
export const paymentScheduleCents = (
  totalCents: number,
  sheetSigningCents: number | null = null,
  sheetStartCents: number | null = null
): PaymentScheduleCents => {
  const dueAtSigning = sheetSigningCents ?? Math.floor(totalCents / 2);
  const dueAtStart = sheetStartCents ?? Math.floor(totalCents / 4);

  return {
    dueAtSigning,
    dueAtStart,
    dueUponCompletion: totalCents - dueAtSigning - dueAtStart,
  };
};

/**
 * The payment schedule as plain dollar strings. Returns null if the total isn't usable.
 * Used when someone types the total by hand, so the typed total and the payments agree to the penny.
 */
export const splitPaymentSchedule = (estimate: string) => {
  const totalCents = parseMoneyToCents(estimate);
  if (totalCents === null) return null;

  const schedule = paymentScheduleCents(totalCents);

  return {
    dueAtSigning: formatMoneyPlain(schedule.dueAtSigning),
    dueAtStart: formatMoneyPlain(schedule.dueAtStart),
    dueUponCompletion: formatMoneyPlain(schedule.dueUponCompletion),
  };
};
