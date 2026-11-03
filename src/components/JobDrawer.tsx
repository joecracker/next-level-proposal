// The job drawer: a tab on the left edge ("JOB"). Tap it to slide the job's folder open over the left side of the screen
// (about a quarter of it), pull the edge wider (up to half), or "Split screen" for half and half. It remembers whether it was
// open. It works like the job drawer in Field & Desk and XL. Read only: it shows the job's information, notes, pictures and
// the files in its Google Drive folder.
import React, { useEffect, useRef, useState, type CSSProperties, type PointerEvent as RPE } from 'react';
import {
  driveConfigured,
  isDriveConnected,
  connectGoogleDrive,
  loadJobFolder,
  getJobFileBlob,
  type JobFolderInfo,
  type JobPhoto,
  type JobProject,
  type DriveFolderFile,
} from '../lib/driveJobs';
import { driveError } from '../lib/driveError';
import { DriveJobPicker } from './DriveJobPicker';
import type { ProposalDriveJob } from '../types';

const PREF_KEY = 'nl.jobdrawer.proposal.v1';
const MIN_FRAC = 0.2, MAX_FRAC = 0.5, DEFAULT_FRAC = 0.28;
const clamp = (n: number) => Math.min(MAX_FRAC, Math.max(MIN_FRAC, n));
type Tab = 'notes' | 'pictures' | 'quotes' | 'files';
type Pref = { open: boolean; frac: number; back: number; tab: Tab };
function loadPref(): Pref {
  try {
    const p = JSON.parse(localStorage.getItem(PREF_KEY) || '{}');
    const back = clamp(Number(p.back) || DEFAULT_FRAC);
    return {
      open: Boolean(p.open),
      frac: clamp(Number(p.frac) || DEFAULT_FRAC),
      back: back >= MAX_FRAC - 0.05 ? DEFAULT_FRAC : back,
      tab: p.tab === 'pictures' || p.tab === 'quotes' || p.tab === 'files' ? p.tab : 'notes',
    };
  } catch {
    return { open: false, frac: DEFAULT_FRAC, back: DEFAULT_FRAC, tab: 'notes' };
  }
}

const CREAM = '#eef1ee', MUTED = 'rgba(238,241,238,0.6)', MOSS = '#8a9a5c', INK = '#14191a';
const head: CSSProperties = { fontSize: '12px', fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: MOSS, borderBottom: '1px solid rgba(238,241,238,0.15)', paddingBottom: '4px', marginTop: '18px' };
const btn: CSSProperties = { minHeight: '44px', padding: '0 16px', borderRadius: '10px', border: '1px solid rgba(238,241,238,0.25)', background: 'rgba(238,241,238,0.06)', color: CREAM, fontWeight: 700, fontSize: '15px', cursor: 'pointer' };

interface JobDrawerProps {
  job: ProposalDriveJob | null;
  onPickJob: (job: ProposalDriveJob) => void;
}

export const JobDrawer: React.FC<JobDrawerProps> = ({ job, onPickJob }) => {
  const [pref, setPref] = useState<Pref>(loadPref);
  const [vw, setVw] = useState(() => window.innerWidth);
  const [top, setTop] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [info, setInfo] = useState<JobFolderInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [big, setBig] = useState<JobPhoto | null>(null);
  const [picking, setPicking] = useState(false);
  const [viewer, setViewer] = useState<null | { name: string; text?: string; url?: string }>(null);
  const [fileBusy, setFileBusy] = useState('');
  const drag = useRef<{ startX: number; startW: number; startFrac: number; moved: boolean } | null>(null);

  useEffect(() => {
    const f = () => {
      setVw(window.innerWidth);
      const h = document.querySelector('header');
      setTop(h ? Math.round(h.getBoundingClientRect().bottom) : 0);
    };
    f();
    window.addEventListener('resize', f);
    const t = window.setInterval(f, 1500); // the header can change height (the menu wraps) without a resize
    return () => { window.removeEventListener('resize', f); window.clearInterval(t); };
  }, []);
  useEffect(() => { try { localStorage.setItem(PREF_KEY, JSON.stringify(pref)); } catch { /* not saved */ } }, [pref]);

  const load = async () => {
    if (!job || !job.folderId) return;
    setBusy(true);
    setMsg(null);
    try {
      if (!isDriveConnected()) await connectGoogleDrive();
      setInfo(await loadJobFolder(job.folderId));
    } catch (err) {
      setMsg(driveError(err));
    }
    setBusy(false);
  };

  // A different job: forget what was read for the old one.
  useEffect(() => {
    setInfo(null);
    setBig(null);
    setViewer(null);
    setMsg(null);
  }, [job?.folderId]);
  // Look in the folder when the drawer is open and this job's folder has not been read yet (only when already signed in).
  useEffect(() => {
    if (pref.open && driveConfigured && job && job.folderId && !info && !busy && !msg && isDriveConnected()) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pref.open, job?.folderId, info]);

  if (!driveConfigured) return null;

  const narrow = vw < 760;
  const panelW = pref.open ? (narrow ? Math.round(vw * 0.9) - 30 : Math.round(vw * pref.frac)) : 0;
  const maxPx = vw * MAX_FRAC;
  const isSplit = pref.open && pref.frac >= MAX_FRAC - 0.02;
  const toggleSplit = () =>
    setPref((p) =>
      p.open && p.frac >= MAX_FRAC - 0.02
        ? { ...p, frac: p.back }
        : { ...p, open: true, frac: MAX_FRAC, back: p.open && p.frac < MAX_FRAC - 0.05 ? p.frac : p.back },
    );

  const onDown = (e: RPE<HTMLButtonElement>) => {
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* fine */ }
    drag.current = { startX: e.clientX, startW: panelW, startFrac: pref.frac, moved: false };
    setDragging(true);
  };
  const onMove = (e: RPE<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d || narrow) return;
    const dx = e.clientX - d.startX;
    if (Math.abs(dx) > 4) d.moved = true;
    if (!d.moved) return;
    const want = d.startW + dx;
    if (want < vw * MIN_FRAC * 0.6) { setPref((p) => ({ ...p, open: false, frac: d.startFrac })); return; }
    setPref((p) => ({ ...p, open: true, frac: clamp(Math.min(want, maxPx) / vw) }));
  };
  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    setDragging(false);
    if (d && !d.moved) setPref((p) => ({ ...p, open: !p.open }));
  };

  const hasP = !!info?.project;
  const p = (info?.project || {}) as JobProject;
  const photos = (p?.photos || []).filter((x) => x.dataUrl);
  const files = (info?.files || []).filter((f) => !f.isFolder && f.name !== 'job.json');
  const folderUrl = job?.folderId ? `https://drive.google.com/drive/folders/${job.folderId}` : null;

  const tabBtn = (key: Tab, label: string) => (
    <button
      key={key}
      onClick={() => { setPref((q) => ({ ...q, tab: key })); setBig(null); setViewer(null); }}
      style={{ background: 'none', border: 'none', borderBottom: `3px solid ${pref.tab === key ? MOSS : 'transparent'}`, color: pref.tab === key ? MOSS : MUTED, fontWeight: 800, fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '12px 8px 8px', whiteSpace: 'nowrap', cursor: 'pointer' }}
    >
      {label}
    </button>
  );

  const info1 = (label: string, value?: string) =>
    value && value.trim() ? (
      <div style={{ display: 'flex', gap: '12px', fontSize: '15px', marginTop: '4px' }}>
        <div style={{ width: '70px', flexShrink: 0, color: MUTED }}>{label}</div>
        <div style={{ wordBreak: 'break-word', minWidth: 0 }}>{value}</div>
      </div>
    ) : null;

  const kindOf = (f: DriveFolderFile): 'text' | 'image' | 'other' =>
    /\.(txt|csv|md|log)$/i.test(f.name) || f.mimeType.startsWith('text/') ? 'text' : f.mimeType.startsWith('image/') ? 'image' : 'other';
  const viewFile = async (f: DriveFolderFile) => {
    setFileBusy(f.id);
    try {
      const blob = await getJobFileBlob(f.id);
      if (kindOf(f) === 'image') setViewer({ name: f.name, url: URL.createObjectURL(blob) });
      else {
        const b = new Uint8Array(await blob.arrayBuffer());
        const enc = b[0] === 0xff && b[1] === 0xfe ? 'utf-16le' : b[0] === 0xfe && b[1] === 0xff ? 'utf-16be' : 'utf-8';
        setViewer({ name: f.name, text: new TextDecoder(enc).decode(b) });
      }
    } catch (err) {
      setMsg(driveError(err));
    }
    setFileBusy('');
  };
  const fileRows = (rows: DriveFolderFile[]) =>
    rows.length === 0 ? <p style={{ color: MUTED, marginTop: '8px' }}>Nothing here yet.</p> : (
      <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0' }}>
        {rows.map((f) => (
          <li key={f.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '10px 12px', marginBottom: '6px', borderRadius: '8px', background: 'rgba(238,241,238,0.06)', fontSize: '15px' }}>
            <span style={{ wordBreak: 'break-word', minWidth: 0 }}>{f.name}</span>
            {kindOf(f) !== 'other' ? (
              <button onClick={() => void viewFile(f)} disabled={fileBusy === f.id} style={{ background: 'none', border: 'none', color: MOSS, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>{fileBusy === f.id ? '...' : 'View'}</button>
            ) : f.webViewLink ? (
              <a href={f.webViewLink} target="_blank" rel="noopener noreferrer" style={{ color: MOSS, fontWeight: 700, flexShrink: 0 }}>Open</a>
            ) : null}
          </li>
        ))}
      </ul>
    );
  const body = () => {
    if (!job) {
      return (
        <div style={{ marginTop: '16px' }}>
          <p style={{ color: MUTED, fontSize: '15px', lineHeight: 1.5 }}>This proposal is not tied to a job yet.</p>
          <button style={{ ...btn, marginTop: '8px' }} onClick={() => setPicking(true)}>Pick the job</button>
        </div>
      );
    }
    if (!job.folderId) return <p style={{ color: MUTED, marginTop: '16px' }}>This job has no folder in Google Drive yet. Pick the job again.</p>;
    if (!info) {
      return (
        <div style={{ marginTop: '16px' }}>
          {busy ? <p style={{ color: MUTED }}>Looking in the folder...</p> : <button style={{ ...btn, background: MOSS, color: INK, border: 'none' }} onClick={() => void load()}>Open this job&apos;s folder</button>}
          {msg && <p style={{ color: '#fca5a5', fontSize: '14px', marginTop: '10px' }}>{msg}</p>}
        </div>
      );
    }
    if (pref.tab === 'quotes') {
      if (viewer) {
        return (
          <div style={{ marginTop: '14px' }}>
            <button style={btn} onClick={() => setViewer(null)}>{'\u2039'} Back</button>
            <div style={{ marginTop: '10px', fontWeight: 700, wordBreak: 'break-word' }}>{viewer.name}</div>
            {viewer.text !== undefined ? (
              <pre style={{ marginTop: '8px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '14px', lineHeight: 1.5, fontFamily: 'inherit', userSelect: 'text' }}>{viewer.text}</pre>
            ) : (
              <img src={viewer.url} alt={viewer.name} style={{ display: 'block', width: '100%', height: 'auto', marginTop: '10px', borderRadius: '8px', background: '#111' }} />
            )}
          </div>
        );
      }
      return (
        <div style={{ marginTop: '6px' }}>
          {msg && <p style={{ color: '#fca5a5', fontSize: '14px', marginTop: '10px' }}>{msg}</p>}
          <h3 style={head}>Price quotes</h3>
          {fileRows(info.quotes)}
          <h3 style={head}>Receipts</h3>
          {fileRows(info.receipts)}
        </div>
      );
    }    if (!hasP && pref.tab !== 'files') return <p style={{ color: MUTED, marginTop: '16px', lineHeight: 1.5 }}>There is no job file in this folder yet, so there are no notes or pictures to show. Save the job to Drive from Field &amp; Desk first.</p>;
    if (pref.tab === 'notes') {
      return (
        <>
          <div style={{ fontSize: '12px', letterSpacing: '0.1em', color: MUTED, fontWeight: 700, marginTop: '12px' }}>FROM CAPTURE</div>
          <h2 style={{ margin: '4px 0 0', fontSize: '20px', lineHeight: 1.2, wordBreak: 'break-word' }}>{p.customer || p.name || job.name}</h2>
          <div style={{ marginTop: '6px' }}>
            {info1('Date', p.date)}{info1('Address', p.address)}{info1('Phone', p.phone)}{info1('Email', p.email)}
          </div>
          {p.jobDesc && p.jobDesc.trim() && <div style={{ marginTop: '10px', fontWeight: 700, fontSize: '15px', wordBreak: 'break-word' }}>{p.jobDesc}</div>}
          <h3 style={head}>Job notes</h3>
          <div style={{ marginTop: '8px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '15px', lineHeight: 1.55, userSelect: 'text' }}>
            {(p.jobNotes || '').trim() || <span style={{ color: MUTED }}>No job notes were written on this job.</span>}
          </div>
          {(p.scratch || []).length > 0 && (
            <>
              <h3 style={head}>Reminders</h3>
              <ul style={{ margin: '8px 0 0', paddingLeft: '20px', fontSize: '15px', lineHeight: 1.5, listStyleType: 'disc' }}>
                {(p.scratch || []).map((s) => <li key={s.id} style={{ wordBreak: 'break-word' }}>{s.text}</li>)}
              </ul>
            </>
          )}
        </>
      );
    }
    if (pref.tab === 'pictures') {
      if (big) {
        return (
          <div style={{ marginTop: '14px' }}>
            <button style={btn} onClick={() => setBig(null)}>{'‹'} Back</button>
            <img src={big.dataUrl} alt={big.caption || 'Picture'} style={{ display: 'block', width: '100%', height: 'auto', maxHeight: '72vh', objectFit: 'contain', marginTop: '10px', borderRadius: '8px', background: '#111' }} />
            <div style={{ marginTop: '10px', fontSize: '15px', lineHeight: 1.4 }}>
              <b style={{ wordBreak: 'break-word' }}>{big.caption || '(no name)'}</b>
              {big.note && <div style={{ color: MUTED, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{big.note}</div>}
            </div>
            <div style={{ marginTop: '8px', fontSize: '12px', color: MUTED }}>Want it bigger? Pull the drawer edge wider, or use Split screen above.</div>
          </div>
        );
      }
      return (
        <div style={{ marginTop: '14px' }}>
          {photos.length === 0 && <p style={{ color: MUTED }}>No pictures came along in this job file.</p>}
          {photos.map((ph) => (
            <div key={ph.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div onClick={() => setBig(ph)} style={{ width: '96px', height: '96px', flexShrink: 0, borderRadius: '8px', background: '#222', overflow: 'hidden', cursor: 'pointer' }}>
                <img src={ph.dataUrl} alt={ph.caption || 'Picture'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ minWidth: 0, fontSize: '14px', lineHeight: 1.4 }}>
                <div style={{ fontWeight: 700, wordBreak: 'break-word' }}>{ph.caption || '(no name)'}</div>
                {ph.note && <div style={{ color: MUTED, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{ph.note}</div>}
              </div>
            </div>
          ))}
        </div>
      );
    }
    return (
      <div style={{ marginTop: '14px' }}>
        {folderUrl && <a href={folderUrl} target="_blank" rel="noopener noreferrer" style={{ color: MOSS, fontWeight: 700, fontSize: '15px' }}>Open the folder in Google Drive</a>}
        <h3 style={head}>Files in this folder</h3>
        {files.length === 0 && <p style={{ color: MUTED, marginTop: '8px' }}>No other files yet.</p>}
        <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0' }}>
          {files.map((f) => (
            <li key={f.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '10px 12px', marginBottom: '6px', borderRadius: '8px', background: 'rgba(238,241,238,0.06)', fontSize: '15px' }}>
              <span style={{ wordBreak: 'break-word', minWidth: 0 }}>{f.name}</span>
              {f.webViewLink && <a href={f.webViewLink} target="_blank" rel="noopener noreferrer" style={{ color: MOSS, fontWeight: 700, flexShrink: 0 }}>Open</a>}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const panel = (
    <div
      style={{
        position: 'fixed', top, bottom: 0, left: narrow ? 30 : 0, width: panelW, overflow: 'hidden', background: INK, color: CREAM, zIndex: 45,
        borderRight: pref.open ? '2px solid rgba(138,154,91,0.6)' : 'none', transition: dragging ? 'none' : 'width 180ms ease',
      }}
    >
      {pref.open && (
        <div style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden', padding: '8px 16px 96px 16px', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', borderBottom: '1px solid rgba(238,241,238,0.15)' }}>
            {tabBtn('notes', 'Notes')}
            {tabBtn('pictures', `Pictures${info ? ` (${photos.length})` : ''}`)}
            {tabBtn('quotes', 'Quotes')}
            {tabBtn('files', 'Files')}
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '2px', marginBottom: '6px' }}>
              {job && job.folderId && <button onClick={() => void load()} disabled={busy} title="Look again" style={{ background: 'none', border: 'none', color: MOSS, fontWeight: 700, fontSize: '13px', cursor: 'pointer', minHeight: '36px', padding: '0 8px', whiteSpace: 'nowrap' }}>{busy ? '...' : 'Refresh'}</button>}
              {!narrow && <button onClick={toggleSplit} style={{ background: 'none', border: 'none', color: MOSS, fontWeight: 700, fontSize: '13px', cursor: 'pointer', minHeight: '36px', padding: '0 8px', whiteSpace: 'nowrap' }}>{isSplit ? 'Narrower' : 'Split screen'}</button>}
            </span>
          </div>
          {job && <div style={{ fontSize: '12px', color: MUTED, marginTop: '10px', wordBreak: 'break-word' }}>{job.name}</div>}
          {body()}
        </div>
      )}
    </div>
  );

  return (
    <div className="print:hidden">
      {panel}
      <button
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        aria-label={pref.open ? 'Put the job drawer away' : 'Open the job drawer'}
        title="Tap to open or close. Pull to resize."
        style={{
          position: 'fixed', top, bottom: 0, left: narrow ? 0 : panelW, width: '30px', border: 'none', borderRight: '1px solid rgba(238,241,238,0.12)',
          background: pref.open ? 'rgba(138,154,91,0.25)' : 'rgba(238,241,238,0.06)', color: CREAM, cursor: 'ew-resize', touchAction: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, zIndex: 46,
        }}
      >
        <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: '12px', fontWeight: 800, letterSpacing: '0.22em' }}>{pref.open ? 'JOB ‹' : 'JOB ›'}</span>
      </button>
      {picking && (
        <DriveJobPicker
          title="Which job's folder do you want to see?"
          onPick={(j) => { setPicking(false); onPickJob(j); }}
          onCancel={() => setPicking(false)}
        />
      )}
    </div>
  );
};
