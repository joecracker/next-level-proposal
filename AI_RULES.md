# Project Rules — Next Level Proposal (`proposal-builder`)

Voice/dictation-friendly construction proposal generator. Wizard → preview → print/PDF.
This is a hand-built app, **not** a Dyad starter template; no starter scaffolding exists here.

## Stack (as declared in `package.json`)
- React `^19.0.1` + React DOM `^19.0.1`, TypeScript `~5.8.2`
- Vite `^6.2.3` with `@vitejs/plugin-react` `^5.0.4`
- Tailwind CSS `^4.1.14` via the `@tailwindcss/vite` plugin (CSS-first config — see below)
- `lucide-react` `^0.546.0` for icons, `motion` `^12.23.24` for animation
- `read-excel-file` `^9.3.10` — reads Tim's `.xlsx` estimate sheet in the browser. Import from `read-excel-file/browser`; v9 has no bare root export and its default export returns **all** sheets as `{ sheet, data }` (not a single sheet's rows).
- `@google/genai` `^2.4.0` — used only in `functions/api/*` (server side)
- Dev-only: `@dyad-sh/react-vite-component-tagger` `^0.9.0`, `esbuild`, `tsx`, `autoprefixer`, `@types/node`

There is no test framework and no ESLint/Prettier config. `npm run lint` is just `tsc --noEmit`.

## Scripts
- `npm run dev` — Vite dev server
- `npm run build` — `vite build` (outputs `dist/`)
- `npm run preview` — Vite preview
- `npm run lint` — `tsc --noEmit` type check

## Entry points & architecture
- `index.html` → `src/main.tsx` → `src/App.tsx` (`src/index.css` imported in `main.tsx`).
- `src/App.tsx` is the single stateful root: it owns the active `Proposal`, the saved-proposals list, and the company profile, and switches views via the `ViewMode` union in `src/types.ts` (`home | wizard | preview | history | import | estimate | settings | howto`). **No router library** — view switching is `useState`.
- All domain types live in `src/types.ts` (`Proposal`, `ClientInfo`, `ScopeCategory`, `ScopeItem`, `LegalTerms`, `CompanyConfig`). Add new fields there, not ad hoc.
- `src/components/` — one file per wizard step / screen / modal. `src/data/defaultTemplate.ts` holds `SAMPLE_PROPOSAL`, `DEFAULT_CATEGORIES`, `DEFAULT_COMPANY_CONFIG`, `DEFAULT_LEGAL_TERMS`.
- `src/lib/backup.ts` (Drive config) and `src/lib/googleDrive.ts` (OAuth + Drive REST).
- `src/lib/money.ts` (money formatting + the payment split), `src/lib/estimateParser.ts` and `src/lib/excelEstimate.ts` (the Excel estimate reader — see the Estimating section).
- `src/printUtils.ts` — `triggerSafePrint()`; print/PDF is done with the browser print flow, not a PDF library.
- Path alias `@/*` → **repo root** in both `vite.config.ts` and `tsconfig.json` (not `src/`).

## Persistence
- Client-only. No database, no user accounts. localStorage keys (data compatibility — **do not rename or repurpose**):
  - `jqc_active_proposal_v1` (active proposal)
  - `jqc_proposals_list_v1` (saved proposals)
  - `pb_company_profile_v1` (company profile)
  - `jqc_active_proposal_v2` is read once to salvage an old logo — legacy read, keep it.
- Google Drive access token in `sessionStorage` under `gdrive_backup_token_v1`.
- Optional Google Drive backup: client-side Google Identity Services token flow, scope `drive.file` only. Client ID comes from `VITE_GOOGLE_CLIENT_ID`; target folder ID + filename are constants in `src/lib/backup.ts`. See `GOOGLE_DRIVE_SETUP.md`. Plain JSON export/import must keep working with zero setup.

## Estimating: the spreadsheet is the calculator
Tim estimates in his own `.xlsx` workbook and **that file is the single source of truth for every number.** His workbook is never modified — no new columns, no renamed labels, no formula edits. Nothing in this app recomputes, rounds, or reformats his money.

- Flow: home screen → **Load From Excel** (`ViewMode` `estimate` → `src/components/EstimateImportModal.tsx`). Separate button and separate code path from the Word-doc importer.
- `src/lib/excelEstimate.ts` opens the file locally in the browser (`read-excel-file/browser`), reads **every** tab, and takes whichever tab carries the summary labels.
- `src/lib/estimateParser.ts` is the pure, testable rule: find the labels the sheet already uses and take the **last number on the labelled row**. On the payment rows the `50%` / `25%` text sits to the left of the dollar amount, so "the next cell over" grabs the wrong cell. Conversely, the value for a label is only the cell *directly* beside it — hunting further along the row reads the neighbouring `Date:` label back as the job name.
- Labels it looks for, spelled exactly as the workbook already has them: `Total Contract Amount`, `Due at Signing (1/2 Down)`, `Due at Start of Job (1/4)`, `Due Upon Completion (1/4)`, `Job Name:`.
- Payment split is **half at signing, then a quarter at the start and a quarter on completion** (`splitPaymentSchedule` in `src/lib/money.ts`), matching the workbook's own schedule — not thirds. The sheet's own payment cells win when they're filled in; the split is only a fallback when they're empty.
- **Numbers never go to the AI.** The reader must not be folded into `DocxImportModal.tsx`'s Gemini path. AI polish may rewrite wording only; estimate figures are copied verbatim and are never recomputed or "tidied up".
- Internal-cost columns (`Internal Cost (Us)`, `Our Cost`, `Markup %`, `Profit ($)`, `Margin %`) are **never** read — only customer-facing totals cross over into a proposal.
- The workbook stores each formula's last saved result, so the app shows what was saved. If a filled sheet reads as `$0.00`, the fix is recalculate-and-save in the spreadsheet (Ctrl+Shift+F9 in LibreOffice). Mixed Excel/LibreOffice use is expected and both save standard `.xlsx`.

## Server layer (Cloudflare Pages Functions — not Nitro/Vite)
- `functions/api/format-section.ts` → `POST /api/format-section`
- `functions/api/parse-document.ts` → `POST /api/parse-document`
- Both call Gemini (`@google/genai`, JSON response schema) using the server env var **`GEMINI_API_KEY`**. The handlers also accept the legacy name `AI_API_KEY` (`env.GEMINI_API_KEY || env.AI_API_KEY`) for deployments set up before the doc fix; `GEMINI_API_KEY` is the name to use going forward.
- Model selection is automatic: each handler holds a `MODEL_CANDIDATES` list (quality model first, cheaper/lighter ones behind it) and `generateWithFallback()` moves to the next model on a retired-model, quota, or overload error. **The list is duplicated in both handler files — keep them in sync.** Non-retryable errors (bad key, bad request) fail immediately.
- Both handlers return `{ error, details }` on failure; the client shows both so AI failures are never opaque.
- Keep the `/api/...` paths and the `onRequestPost` export names stable; the client calls them by path (`src/components/CategoryModal.tsx`, `CategorySectionStep.tsx`, `DocxImportModal.tsx`).

## Deployment
- GitHub Actions (`.github/workflows/deploy.yml`) deploys to **Cloudflare Workers** on every push to `main` (Node 22), using secrets `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`.
- Pipeline: `npm ci` → `npm run build` → `rm -f dist/_redirects` (deliberate: the Pages-style catch-all loops on Workers; SPA fallback comes from the Worker config) → `wrangler pages functions build --outdir=./.worker` → `wrangler deploy`.
- `wrangler.json` is authoritative: assets from `./dist`, SPA `not_found_handling`, `run_worker_first: ["/api/*"]`, custom domain `nextlevelproposal.crackerbox.app`. `./.worker/index.js` is generated by the CI build, not committed.
- README's `proposal-builder.crackerbox.app` demo link is outdated; `wrangler.json` is the source of truth for the domain.

## How to talk to Tim
Tim is the app's owner and is **not a coder yet**. Explain things in plain English, skip the jargon, and define any technical term you can't avoid. Work **one thing at a time** — don't dump a pile of tasks in one go. Never say "problem" or "bug" about code you only read but never ran; say what you saw and whether you tested it.

## Design philosophy (Tim's — treat it as a requirement)
**"A toddler's toy with the robot's brain."** Every screen gets big, obvious buttons a non-coder can work out with no explanation; the complexity lives underneath, where he never has to look at it. Don't surface columns, settings, or machinery he didn't ask for, and never make him understand a mechanism in order to use it. He wants to know *that* something is happening, not *how*.

The app is also meant to become shareable with other companies. Company name, logo, header and legal statement must stay switchable — never hard-code July's Quality Construction.

## Rules future agents must preserve
1. **Never expose the AI key.** All AI calls stay in `functions/api/*`; the browser must never see `GEMINI_API_KEY`.
2. **Never commit secrets.** Real values live in Cloudflare env vars. `VITE_GOOGLE_CLIENT_ID` is a public identifier (fine to ship); the Drive flow must stay secret-free.
3. **Don't hand-write PDF/file-format bytes.** Proposal output goes through the existing print flow (`src/printUtils.ts` / `window.print()`).
4. **Keep the localStorage keys** above stable, and keep reading legacy keys when practical, or Tim loses saved proposals.
5. **Keep `functions/api/` route paths and handler export names** unchanged.
6. **Don't replace the state-based view switching** with a router, and don't swap the Cloudflare Functions layer for Nitro/Vite server routes — the app is built around Pages Functions + Workers deploy.
7. Preserve existing app behavior and deployment config unless the change is explicitly requested.
8. Tailwind theming is CSS-first: theme tokens/brand aliases (`ink`, `ember`, `cream`, `muted`) live in the `@theme` block in `src/index.css`. Extend there rather than adding a `tailwind.config.js`.
9. **Never let the app or the AI change an estimate number.** Figures are copied from Tim's workbook verbatim; polish touches wording only. And never write to his workbook — test against a copy.
