# Next step: pull scope wording out of the Excel sheet

Tim's note, written the night before. Read this, then say go.

## What's missing today
The app reads Tim's **money** out of the workbook (total + 50/25/25 payments).
It does **not** read the **line items** — the labor tasks, material items, and sub
trades — so he retypes all the scope wording by hand.

## The plan (agreed)
1. Load From Excel pulls the line items in.
2. Lines appear in a list, **not** filed under any section.
3. The AI takes a **first swing** and files each line under the section it thinks
   fits (Carpentry, Plumbing, Electrical, Subs, ...).
4. Tim reviews the list. Most are already right. He taps the wrong ones and moves
   them where they belong.
5. **His taps stick.** Every correction is remembered, so the same line files
   itself correctly on the next job. The list gets shorter every time.

## Why it works this way
His workbook groups rows by **cost type** (materials / labor / subs). It does not
say which trade a line belongs to — there is no Section column, and Tim is not
adding one. So the app has to be told. A wrong guess is silent: a faucet filed
under Carpentry just sits there in a document the customer reads. Tim's review is
the thing that makes it correct instead of "probably correct."

## Hard rules that still apply
- **Numbers never go to the AI.** Line-item wording only. Figures are copied from
  the workbook verbatim and never recomputed.
- **Never write to Tim's workbook.** Test against a copy if testing is needed.
- The AI first pass is a convenience, not the source of truth. Tim's review wins.

## What I need before I build
A **filled-in** workbook. The only copy we have is the blank template, and a blank
sheet proves nothing. Any real job will do. Tim did not have to change anything
about how he fills it in.
