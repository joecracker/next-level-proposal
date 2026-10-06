/**
 * Dev tool — renders the printable proposal sheet to a PDF.
 *
 * It uses the Chrome or Edge already installed on this PC, in headless mode, and
 * talks to it over Chrome's debugging protocol. No extra packages, nothing to
 * download. This file is a development tool only; it is not part of the built app.
 *
 *   node tools/render-proposal.mjs
 *   node tools/render-proposal.mjs --url http://localhost:42118 --out tools/out/preview.pdf
 *
 * It seeds the browser with the sample job in tools/sample-proposal.json, opens the
 * app straight to the printable sheet (the app supports ?view=preview), and prints
 * that to PDF at US Letter with half-inch margins.
 */

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};

const appUrl = arg('--url', 'http://localhost:42118').replace(/\/$/, '');
const outPath = path.resolve(arg('--out', 'tools/out/proposal-preview.pdf'));
const samplePath = path.resolve(arg('--data', 'tools/sample-proposal.json'));
const debugPort = Number(arg('--port', '9333'));

const KNOWN_BROWSERS = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const findBrowser = () => {
  const explicit = arg('--browser', '');
  if (explicit) return explicit;
  return KNOWN_BROWSERS.find((p) => existsSync(p)) || '';
};

const waitForJson = async (url, tries = 80) => {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch {
      /* not up yet */
    }
    await sleep(250);
  }
  throw new Error(`browser debugging port never came up at ${url}`);
};

const openSocket = (url) =>
  new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    ws.addEventListener('open', () => resolve(ws));
    ws.addEventListener('error', () => reject(new Error(`could not attach to ${url}`)));
  });

/** Minimal Chrome DevTools Protocol client over the WebSocket built into Node. */
const makeSend = (ws) => {
  let nextId = 1;
  const pending = new Map();

  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    const waiter = msg.id ? pending.get(msg.id) : null;
    if (!waiter) return;
    pending.delete(msg.id);
    if (msg.error) waiter.reject(new Error(`${msg.error.message} (${msg.error.code})`));
    else waiter.resolve(msg.result);
  });

  return (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = nextId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
};

const main = async () => {
  const browserPath = findBrowser();
  if (!browserPath) {
    throw new Error('Found no Chrome or Edge. Pass --browser <full path to .exe>.');
  }

  const sample = JSON.parse(readFileSync(samplePath, 'utf8'));
  const proposal = sample.proposal;
  const proposalJson = JSON.stringify(proposal);
  const listJson = JSON.stringify([proposal]);
  const companyJson = JSON.stringify(proposal.companyConfig);

  mkdirSync(path.dirname(outPath), { recursive: true });

  const userDataDir = path.join(os.tmpdir(), `proposal-pdf-${Date.now()}`);
  const child = spawn(
    browserPath,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      `--user-data-dir=${userDataDir}`,
      `--remote-debugging-port=${debugPort}`,
      'about:blank',
    ],
    { stdio: 'ignore' },
  );

  let ws;
  try {
    await waitForJson(`http://127.0.0.1:${debugPort}/json/version`);
    const targets = await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json();
    const page = targets.find((t) => t.type === 'page');
    if (!page) throw new Error('browser opened no page to print');

    ws = await openSocket(page.webSocketDebuggerUrl);
    const send = makeSend(ws);

    await send('Page.enable');
    await send('Runtime.enable');

    const evaluate = async (expression) => {
      const res = await send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      if (res.exceptionDetails) {
        throw new Error(`page threw while running: ${res.exceptionDetails.text}`);
      }
      return res.result?.value;
    };

    const openAndWait = async (url, mustShow) => {
      await send('Page.navigate', { url });
      for (let i = 0; i < 100; i++) {
        await sleep(250);
        let ready = '';
        try {
          ready = await evaluate('document.readyState');
        } catch {
          continue; // mid-navigation
        }
        if (ready !== 'complete') continue;
        if (!mustShow) return;
        const shown = await evaluate(
          `document.body ? document.body.innerText.includes(${JSON.stringify(mustShow)}) : false`,
        );
        if (shown) return;
      }
      throw new Error(`page never showed "${mustShow}" — is ${appUrl} still up? (${url})`);
    };

    // 1. Land on the app so the browser knows the origin, then hand it the sample job.
    await openAndWait(`${appUrl}/`);
    await evaluate(`
      localStorage.setItem('jqc_active_proposal_v1', ${JSON.stringify(proposalJson)});
      localStorage.setItem('jqc_proposals_list_v1', ${JSON.stringify(listJson)});
      localStorage.setItem('pb_company_profile_v1', ${JSON.stringify(companyJson)});
      'seeded'
    `);

    // 2. Open the printable sheet directly and let it lay out.
    await openAndWait(`${appUrl}/?view=preview`, 'work to be done:');
    await sleep(1500);

    // 3. Print media, then report what the page is actually shaped like.
    await send('Emulation.setEmulatedMedia', { media: 'print' });
    await sleep(400);

    const shape = await evaluate(`(() => {
      const sheet = document.querySelector('.printable-sheet');
      if (!sheet) return 'NO PRINTABLE SHEET FOUND';
      const cs = getComputedStyle(sheet);
      const box = sheet.getBoundingClientRect();
      return JSON.stringify({
        sheetWidth: Math.round(box.width),
        padding: cs.padding,
        fontFamily: cs.fontFamily,
        fontSize: cs.fontSize,
        colour: cs.color,
        headings: [...document.querySelectorAll('.printable-sheet p.font-bold')].map(p => p.innerText),
        bullets: document.querySelectorAll('.printable-sheet li').length,
      }, null, 2);
    })()`);
    console.log('Printable sheet as laid out:', shape);

    const shownText = await evaluate('document.body.innerText');
    console.log('--- first lines of what is on the page ---');
    console.log(String(shownText).split('\n').filter(Boolean).slice(0, 8).join('\n'));

    // 4. Print it.
    const pdf = await send('Page.printToPDF', {
      printBackground: false,
      paperWidth: 8.5,
      paperHeight: 11,
      marginTop: 0.5,
      marginBottom: 0.5,
      marginLeft: 0.5,
      marginRight: 0.5,
      preferCSSPageSize: false,
    });

    writeFileSync(outPath, Buffer.from(pdf.data, 'base64'));
    const bytes = readFileSync(outPath);
    const pageCount = (bytes.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;

    console.log(`\nWrote ${outPath}`);
    console.log(`  ${bytes.length} bytes, ${pageCount || '?'} page(s)`);
  } finally {
    if (ws) {
      try {
        const send = makeSend(ws);
        await send('Browser.close');
      } catch {
        /* closing anyway */
      }
    }
    await sleep(400);
    child.kill();
  }
};

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
