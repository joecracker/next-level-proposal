// Proposal's side of the Google Drive hand-off: list the jobs whose folder has an Estimate.xlsx
// (filed there by XL) and download one, so it can go through the same reader as a picked file.
import {
  connectDrive,
  isDriveConnected,
  listJobEntries,
  downloadFile,
  saveFileInFolder,
  listFilesByName,
  type DriveJobEntry,
} from './googleDrive';
import type { Proposal, ProposalDriveJob } from '../types';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const JOBS_FOLDER_NAME = 'JQC Jobs';
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export const driveConfigured = Boolean(CLIENT_ID);
export { isDriveConnected };
export type { DriveJobEntry };

export const connectGoogleDrive = () => connectDrive(CLIENT_ID);

/** Jobs that have an estimate filed in Drive, newest first. */
export async function listEstimateJobs(): Promise<DriveJobEntry[]> {
  const all = await listJobEntries({ clientId: CLIENT_ID, folderName: JOBS_FOLDER_NAME });
  return all.filter((j) => j.estimateFileId);
}

export async function downloadEstimateFile(job: DriveJobEntry): Promise<File> {
  if (!job.estimateFileId) throw new Error('That job has no estimate in Drive yet.');
  const blob = await downloadFile(CLIENT_ID, job.estimateFileId);
  return new File([blob], `${job.name} - Estimate.xlsx`, { type: XLSX_MIME });
}

// ---- The finished proposal: a PDF and an editable copy, filed in the job's own Drive folder --------------
const PROPOSAL_PDF = 'Proposal.pdf';
const PROPOSAL_JSON = 'Proposal.json';
const PROPOSAL_TYPE = 'nextlevel-proposal';
const DRIVE_CFG = { clientId: CLIENT_ID, folderName: JOBS_FOLDER_NAME };

/** A job that has an estimate and/or a saved proposal filed in its folder. */
export type LoadableJob = DriveJobEntry & { proposalFileId: string | null };

/** Every job in Drive, newest first (used to pick the job a proposal belongs to). */
export async function listAllJobs(): Promise<DriveJobEntry[]> {
  return listJobEntries(DRIVE_CFG);
}

/** Jobs with an estimate and/or a saved proposal, for the Load Job Information list. */
export async function listLoadableJobs(): Promise<LoadableJob[]> {
  const [all, proposalFiles] = await Promise.all([listAllJobs(), listFilesByName(CLIENT_ID, PROPOSAL_JSON)]);
  const inFolder = new Map<string, string>();
  proposalFiles.forEach((f) => f.parents.forEach((p) => inFolder.set(p, f.id)));
  return all
    .map((j) => ({ ...j, proposalFileId: j.folderId ? inFolder.get(j.folderId) || null : null }))
    .filter((j) => j.estimateFileId || j.proposalFileId);
}

/**
 * Files the finished proposal in the job's Drive folder: Proposal.json (the editable copy) and Proposal.pdf.
 * Each save replaces the one before, so the folder always holds the latest. Returns the job as it is now
 * (the folder is looked up again if the remembered one is gone).
 */
export async function fileProposal(job: ProposalDriveJob, proposal: Proposal, pdf: Blob): Promise<ProposalDriveJob> {
  const put = async (j: ProposalDriveJob) => {
    const envelope = JSON.stringify(
      { type: PROPOSAL_TYPE, version: 1, savedAt: new Date().toISOString(), proposal: { ...proposal, driveJob: j } },
      null,
      1,
    );
    await saveFileInFolder(CLIENT_ID, j.folderId as string, PROPOSAL_JSON, 'application/json', envelope);
    await saveFileInFolder(CLIENT_ID, j.folderId as string, PROPOSAL_PDF, 'application/pdf', pdf);
  };
  if (job.folderId) {
    try {
      await put(job);
      return job;
    } catch {
      // the folder may have been moved or deleted: look the job up again below
    }
  }
  const found = (await listAllJobs()).find((j) => j.jobId === job.jobId);
  if (!found || !found.folderId) {
    throw new Error('That job folder was not found in Google Drive. Pick the job again.');
  }
  const resolved: ProposalDriveJob = { jobId: job.jobId, name: found.name, folderId: found.folderId };
  await put(resolved);
  return resolved;
}

/** Reads a saved proposal (Proposal.json) back from Drive. */
export async function readSavedProposal(fileId: string): Promise<Proposal> {
  const blob = await downloadFile(CLIENT_ID, fileId);
  let parsed: { type?: string; proposal?: Proposal } | null = null;
  try {
    parsed = JSON.parse(await blob.text());
  } catch {
    parsed = null;
  }
  const p = parsed && parsed.type === PROPOSAL_TYPE ? parsed.proposal : undefined;
  if (!p || !p.clientInfo || !Array.isArray(p.categories)) throw new Error('That saved proposal could not be read.');
  return p;
}
