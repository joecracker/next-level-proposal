// Proposal's side of the Google Drive hand-off: list the jobs whose folder has an Estimate.xlsx
// (filed there by XL) and download one, so it can go through the same reader as a picked file.
import {
  connectDrive,
  isDriveConnected,
  listJobEntries,
  downloadFile,
  type DriveJobEntry,
} from './googleDrive';

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
