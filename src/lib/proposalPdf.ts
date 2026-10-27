// Makes the finished proposal into a letter-size PDF, from the very same sheets you see in the preview
// (the proposal page, then the contract forms). Whatever the preview shows is what the PDF shows, so when
// the layout is changed later the PDF follows by itself.
//
// Each page is a sharp picture of the sheet, so the text prints cleanly but cannot be selected inside the PDF.
// The editable copy of the proposal is filed with it (see fileProposal in driveJobs.ts).
//
// The two tools it needs are loaded only when a PDF is actually made, so the app opens as fast as before.

const DPI = 96; // the page is laid out in CSS pixels, 96 to the inch
const PAGE_W_PX = 8.5 * DPI; // 816: the width the sheets are laid out at, same as the printed page
const MARGIN_PX = 0.5 * DPI; // half-inch margin on every page, same as the print setup
const CONTENT_W_PX = PAGE_W_PX - 2 * MARGIN_PX; // 720
const CONTENT_H_PX = 11 * DPI - 2 * MARGIN_PX; // 960
const SCALE = 3; // pictures are made at 288 dpi

interface Atom {
  top: number;
  bottom: number;
}

/** Gives a promise a few seconds, then carries on without it. A slow font or picture should never freeze the PDF. */
const patient = <T,>(p: Promise<T>, ms = 4000): Promise<T | undefined> =>
  Promise.race([p, new Promise<undefined>((res) => setTimeout(() => res(undefined), ms))]);

/** Waits for pictures (the logo) to be loaded. */
function imagesReady(root: HTMLElement): Promise<unknown> {
  return Promise.all(
    Array.from(root.querySelectorAll('img')).map((img) =>
      img.complete
        ? Promise.resolve()
        : patient(
            new Promise<void>((res) => {
              img.addEventListener('load', () => res());
              img.addEventListener('error', () => res());
            })
          )
    )
  );
}

/** Waits for stylesheets and fonts inside the hidden page to be ready. */
async function ready(frame: HTMLIFrameElement): Promise<void> {
  const doc = frame.contentDocument!;
  const sheets = Array.from(doc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'));
  await Promise.all(
    sheets.map((l) =>
      l.sheet
        ? Promise.resolve()
        : patient(
            new Promise<void>((res) => {
              l.addEventListener('load', () => res());
              l.addEventListener('error', () => res());
            })
          )
    )
  );
  try {
    const fonts = (doc as Document & { fonts?: { ready: Promise<unknown> } }).fonts;
    if (fonts) await patient(fonts.ready);
  } catch {
    // fonts not reported: carry on
  }
}

/** Opens a hidden page the width of a printed page, with the app's own styles, so the sheets lay out exactly as they print. */
async function openHiddenPage(): Promise<HTMLIFrameElement> {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText = `position:fixed;left:-10000px;top:0;width:${PAGE_W_PX}px;height:1200px;border:0;`;
  document.body.appendChild(frame);
  const doc = frame.contentDocument!;
  doc.open();
  doc.write('<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>');
  doc.close();
  doc.body.style.cssText = 'margin:0;background:#ffffff;';
  document.head.querySelectorAll('link[rel="stylesheet"], style').forEach((n) => {
    doc.head.appendChild(n.cloneNode(true));
  });
  await ready(frame);
  return frame;
}

/** The pieces that must not be cut through. A piece taller than a page is broken down into its smaller parts. */
function collectAtoms(sheet: HTMLElement): Atom[] {
  const base = sheet.getBoundingClientRect().top;
  const atoms: Atom[] = [];
  const walk = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    const atom = { top: r.top - base, bottom: r.bottom - base };
    const kids = Array.from(el.children).filter((c): c is HTMLElement => c instanceof HTMLElement);
    const keepWhole = el.classList.contains('page-break-inside-avoid') || kids.length === 0;
    if (keepWhole && r.height <= CONTENT_H_PX) {
      atoms.push(atom);
      return;
    }
    if (kids.length === 0) {
      atoms.push(atom); // taller than a page with nothing to split on: cut by height below
      return;
    }
    kids.forEach(walk);
  };
  Array.from(sheet.children)
    .filter((c): c is HTMLElement => c instanceof HTMLElement)
    .forEach(walk);
  return atoms.filter((a) => a.bottom - a.top > 0.5).sort((a, b) => a.top - b.top);
}

/** Where each page of one sheet starts and ends (in CSS pixels down the sheet). Breaks fall between pieces, not through them. */
function pageRanges(atoms: Atom[], totalHeight: number): Array<[number, number]> {
  const pages: Array<[number, number]> = [];
  let start = 0;
  let prevBottom = 0;
  for (const a of atoms) {
    if (a.bottom - start > CONTENT_H_PX && a.top > start + 1) {
      pages.push([start, prevBottom]);
      start = a.top;
    }
    while (a.bottom - start > CONTENT_H_PX) {
      pages.push([start, start + CONTENT_H_PX]);
      start += CONTENT_H_PX;
    }
    prevBottom = a.bottom;
  }
  pages.push([start, Math.max(totalHeight, prevBottom)]);
  return pages.filter(([a, b]) => b - a > 1);
}

/**
 * The finished proposal as a PDF. Needs the preview sheets to be on screen (the proposal and its contract forms).
 * @param title Shown in the PDF's properties, for example "Cook - Proposal".
 */
export async function buildProposalPdf(title = 'Proposal'): Promise<Blob> {
  const sheets = Array.from(document.querySelectorAll<HTMLElement>('.printable-sheet'));
  if (sheets.length === 0) throw new Error('Open the proposal preview first, then try again.');

  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas-pro'), import('jspdf')]);
  const pdf = new jsPDF({ unit: 'in', format: 'letter', orientation: 'portrait', compress: true });
  pdf.setProperties({ title });

  const frame = await openHiddenPage();
  try {
    const doc = frame.contentDocument!;
    let firstPage = true;
    for (const sheet of sheets) {
      const copy = sheet.cloneNode(true) as HTMLElement;
      // The look of the printed page: no card, no shadow, no padding (the margin is added when the page is placed).
      const set = (prop: string, value: string) => copy.style.setProperty(prop, value, 'important');
      set('padding', '0');
      set('margin', '0');
      set('border', 'none');
      set('box-shadow', 'none');
      set('border-radius', '0');
      set('max-width', 'none');
      set('width', `${CONTENT_W_PX}px`);
      set('overflow', 'visible');
      set('box-sizing', 'border-box');
      set('background', '#ffffff');
      doc.body.innerHTML = '';
      doc.body.appendChild(copy);

      await imagesReady(copy);

      const total = copy.getBoundingClientRect().height;
      const ranges = pageRanges(collectAtoms(copy), total);
      const full = await html2canvas(copy, {
        scale: SCALE,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      });

      for (const [from, to] of ranges) {
        const sy = Math.round(from * SCALE);
        const sh = Math.max(1, Math.min(full.height - sy, Math.round((to - from) * SCALE)));
        const slice = document.createElement('canvas');
        slice.width = full.width;
        slice.height = sh;
        const ctx = slice.getContext('2d')!;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, slice.width, slice.height);
        ctx.drawImage(full, 0, sy, full.width, sh, 0, 0, full.width, sh);
        if (!firstPage) pdf.addPage('letter', 'portrait');
        firstPage = false;
        pdf.addImage(slice.toDataURL('image/png'), 'PNG', MARGIN_PX / DPI, MARGIN_PX / DPI, CONTENT_W_PX / DPI, sh / SCALE / DPI, undefined, 'FAST');
      }
    }
  } finally {
    frame.remove();
  }
  return pdf.output('blob');
}
