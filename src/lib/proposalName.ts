import type { Proposal } from '../types';

/**
 * The name a proposal goes by in lists: "Customer – Job", so two jobs for the same
 * customer are easy to tell apart. Falls back gracefully while either part is empty.
 */
export const proposalDisplayName = (p: Proposal): string => {
  const client = (p.clientInfo?.clientName || '').trim();
  const job = (p.clientInfo?.projectSite || '').trim();
  const copy = /\(copy\)\s*$/i.test(p.title || '') ? ' (Copy)' : '';
  if (client && job) return `${client} \u2013 ${job}${copy}`;
  return (client || job || p.title || 'Untitled proposal') + (client || job ? copy : '');
};