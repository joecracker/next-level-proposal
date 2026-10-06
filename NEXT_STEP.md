# Next step: make the printed proposal match Tim's boss's proposal

Tim's working note. Read this, then say go.

## The goal (Tim, explicit)
The app's printed proposal must come out **essentially the same document Tim's boss
writes**. Tim: *"Absolutely tweak the proposal builder. It was built by an AI that was
told to mimic the proposal that the boss wrote but there always seems to be room for
interpretation instead of following the rules."* Interpretation stops now.

## The reference file
`.dyad/media/d23da1a7824469a568c58d67f4db6ba8104b2035d842a1e18ff3add01d97f9ee.docx`
— the **filled-out Stover bath job**, Tim's boss's most recent real proposal. Tim:
*"this is exactly how he likes it to look... doesn't have a bunch of fancy shit on it,
gets right to the point."*

Read it for **shape, not wording** — the words belong to that one job. It is a zip;
read it with Python (see AI_RULES → "The target document"). Layout facts and the exact
running order are written up there — do not re-derive them from scratch.

## What is actually wrong (read from the app's code, not guessed)
1. **Section order.** App defaults: General Description of Work, MATERIAL DESCRIPTION,
   DEMOLITION, ELECTRICAL, PLUMBING, CARPENTRY, ALLOWANCES, HOMEOWNER TO SUPPLY.
   Boss's order: Material description → Demolition → Carpentry → Plumbing → Electrical
   → Allowances → Homeowner to supply. Electrical sits *before* Plumbing, and
   "General Description of Work" does not exist in the boss's doc.
2. **Headings are ALL CAPS.** The `DEFAULT_CATEGORIES` names in
   `src/data/defaultTemplate.ts` are literally uppercase strings. Boss uses bold
   sentence case at the same 12pt as the body.
3. **No bullet dots.** `DocumentPreview.tsx` uses `list-none`. Boss's doc has real `•`.
4. **Empty sections print filler.** `DocumentPreview.tsx` prints
   *"Standard contract terms apply"* in italics when a category has no items. That
   sentence appears nowhere in the boss's doc and would print on a customer's proposal.
5. **Money lines don't line up.** Boss aligns the four dollar amounts in a right-hand
   column; the app puts each amount inline right after the colon.
6. **Signature block is fancier than the boss's.** App adds a rule above the block and a
   ruled line over each signature. Boss uses plain underscores only.
7. **Wording nits.** App: `Total for work described above` / `Due on completion of job`.
   Boss: `Total for all work described above` / `Due upon completion of job`.
8. **Font / size.** Boss is Arial 12pt. App renders `font-sans` at `text-sm` (~10.5pt).
9. **Company header too loud.** App: centred logo plus the company name as a giant
   uppercase banner (`text-3xl sm:text-4xl font-bold uppercase tracking-wide`). Boss:
   modest title-case name plus three short lines. Page margins already match (0.5in,
   set by `@page` in `src/index.css`).
10. **Client line.** App prints `Prepared for {name} • {address}`. Boss prints the
    customer's name, address and phone plainly, then a bold `work to be done:` line.

The two files to change are `src/components/DocumentPreview.tsx` and
`src/data/defaultTemplate.ts`. Quick cosmetic pass; low risk; type-check after.

## Open questions for Tim — ask, don't guess
- **Carpentry placement.** The boss's real doc puts Carpentry **last** among the trades.
  Tim said he wants **Carpentry before Plumbing and Electrical**. Tim's instruction wins;
  just confirm he knows it differs from the boss's file.
- **"General Description of Work"** — keep it at all? The boss's doc has no such section,
  it has the one-line `work to be done:` instead. If kept, it should not print when empty.
- **`work to be done:`** — where does that line come from? Proposal title, a new field, or
  the customer-info step? Don't invent a field without Tim's answer.
- **Allowances / Homeowner to supply** are on every job — confirm they should stay
  standing sections (they currently are).
- Only the **original workbook in Tim's Documents folder** is protected; copies may be
  edited freely. See AI_RULES rule 9.

## Tonight's test (Tim's plan)
Tim wants to run his **current real job** through the price sheet, then through the
proposal builder, and see what comes out. Likely needs:
- A **filled-in** workbook from Tim for that job (the only copy on disk is the blank
  price sheet). Ask for it.
- Then compare the finished proposal against the boss's document above.
Tim also asked whether an AI (you) can run a job through it end to end and show him the
result. You cannot click the UI, but if he leaves the app on the Preview screen you can
look at it with the preview tool and tell him what's off.

## Still parked — the bigger, separate job
Pulling the **scope wording / line items** out of the price sheet into the proposal:
load the lines, let the AI take a first pass at filing them under sections, let Tim's
taps stick as corrections. The app today reads only the **money** out of the workbook.
This needs the filled-in workbook and is a real build — **do not start it in the same
pass as the cosmetic match.** One thing at a time.

## Environment notes (verified this session)
- **Python 3.12** is the tool for reading `.docx`/`.xlsx` (both are zips). No pandoc,
  no LibreOffice, no `unzip` on this machine.
- Printed page: `src/components/DocumentPreview.tsx`. Default sections:
  `src/data/defaultTemplate.ts` (`DEFAULT_CATEGORIES`, `DEFAULT_LEGAL_TERMS`,
  `DEFAULT_COMPANY_CONFIG`). Print CSS: `src/index.css` (`@page` 0.5in, `.page-break`).
- `src/index.css` has the `amber` scale repainted grey/silver to hide leftover gold.
  Don't reintroduce gold on the printed page.