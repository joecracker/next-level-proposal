import type { Proposal } from '../types';
import { DEFAULT_CATEGORIES } from '../data/defaultTemplate';

const defaultSectionNames = new Set(DEFAULT_CATEGORIES.map((c) => c.name));
const has = (v?: string) => Boolean(v && v.trim());

/**
 * True for a proposal nobody has put anything into yet (what "New Proposal" creates).
 * Blank ones are kept out of Past Proposals so abandoned starts don't pile up.
 */
export const isBlankProposal = (p: Proposal): boolean => {
  const c = p.clientInfo;
  if ([c?.clientName, c?.address, c?.phone, c?.email, c?.projectSite].some(has)) return false;
  if (has(p.notes) || has(p.totalEstimate)) return false;
  const t = p.legalTerms;
  if ([t?.dueAtSigning, t?.dueAtStart, t?.dueUponCompletion].some(has)) return false;
  return (p.categories || []).every((cat) => cat.items.length === 0 && defaultSectionNames.has(cat.name));
};