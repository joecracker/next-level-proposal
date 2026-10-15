# Estimating: the spreadsheet is the calculator (Next Level Proposal)

Moved out of AI_RULES.md on 2026-10-15 so it is not loaded on every turn. Nothing was removed or reworded.

Tim estimates in his own `.xlsx` workbook and **that file is the single source of truth for every number.** Nothing in this app recomputes, rounds, or reformats his money.

**One protected artifact: the original workbook in Tim's real Documents folder. Never open it for writing and never save over it — that is the only thing we must not touch.** Everything else is fair game. Copy the workbook and edit the copy as hard as the job needs — new columns, renamed labels, new formulas, per-section subtotals. Tim keeps separate backups and has explicitly cleared this. Work on the copy, always; the original stays pristine even so.

- Flow: home screen → **Load From Excel** (`ViewMode` `estimate` → `src/components/EstimateImportModal.tsx`). Separate button and separate code path from the Word-doc importer.
- `src/lib/excelEstimate.ts` opens the file locally in the browser (`read-excel-file/browser`), reads **every** tab, and takes whichever tab carries the summary labels.
- `src/lib/estimateParser.ts` is the pure, testable rule: find the labels the sheet already uses and take the **last number on the labelled row**. On the payment rows the `50%` / `25%` text sits to the left of the dollar amount, so "the next cell over" grabs the wrong cell. Conversely, the value for a label is only the cell *directly* beside it — hunting further along the row reads the neighbouring `Date:` label back as the job name.
- Labels it looks for, spelled exactly as the workbook already has them: `Total Contract Amount`, `Due at Signing (1/2 Down)`, `Due at Start of Job (1/4)`, `Due Upon Completion (1/4)`, `Job Name:`.
- Payment split is **half at signing, then a quarter at the start and a quarter on completion** (`splitPaymentSchedule` in `src/lib/money.ts`), matching the workbook's own schedule — not thirds. The sheet's own payment cells win when they're filled in; the split is only a fallback when they're empty.
- **Numbers never go to the AI.** The reader must not be folded into `DocxImportModal.tsx`'s Gemini path. AI polish may rewrite wording only; estimate figures are copied verbatim and are never recomputed or "tidied up".
- Internal-cost columns (`Internal Cost (Us)`, `Our Cost`, `Markup %`, `Profit ($)`, `Margin %`) are **never** read — only customer-facing totals cross over into a proposal.
- The workbook stores each formula's last saved result, so the app shows what was saved. If a filled sheet reads as `$0.00`, the fix is recalculate-and-save in the spreadsheet (Ctrl+Shift+F9 in LibreOffice). Mixed Excel/LibreOffice use is expected and both save standard `.xlsx`.
