"""Check the rebuilt price sheet against the blank template it came from.

Reports every cell that differs from the original (other than the ones the
rebuild is supposed to change) and prints the section headings it finds.
"""

import openpyxl

REF = "reference/JQC-EXCEL-PRICE-SHEET-1.xlsx"
OUT = "Next Level Excel.xlsx"

LABOR_HEADINGS = {5: "#Demolition", 10: "#Carpentry", 26: "#Plumbing", 35: "#Electrical"}
SUBS_HEADINGS = {2: "#Plumbing", 6: "#Electrical", 10: "#Drywall", 14: "#Masonry", 18: "#Painting"}

ref = openpyxl.load_workbook(REF)
out = openpyxl.load_workbook(OUT)
labor, subs, summary = out["Labor Estimate"], out["Subs"], out["Summary Dashboard"]

bad = []

for row, label in LABOR_HEADINGS.items():
    got = labor.cell(row=row, column=1).value
    if got != label:
        bad.append("Labor A%d is %r, expected %r" % (row, got, label))
    print("Labor row %-3d %s" % (row, got))

for row, label in SUBS_HEADINGS.items():
    got = subs.cell(row=row, column=1).value
    if got != label:
        bad.append("Subs A%d is %r, expected %r" % (row, got, label))
    print("Subs  row %-3d %s" % (row, got))

# every Labor line row must still total itself up
for r in range(5, 44):
    want = {
        3: "=$F$2",
        4: "=IF(B{r}>0, B{r}*C{r}, 0)".format(r=r),
        5: "=$F$3",
        6: "=IF(B{r}>0, B{r}*E{r}, 0)".format(r=r),
    }
    for col, expect in want.items():
        got = labor.cell(row=r, column=col).value
        if got != expect:
            bad.append("Labor %s%d is %r, expected %r" % (chr(64 + col), r, got, expect))

if labor["C44"].value != 73 or labor["E44"].value != 120:
    bad.append("crew rates moved: %r %r" % (labor["C44"].value, labor["E44"].value))
for r in range(45, 51):
    if labor.cell(row=r, column=3).value != "=$C$44" or labor.cell(row=r, column=5).value != "=$E$44":
        bad.append("crew row %d rates are wrong" % r)
if labor["B51"].value != "=SUM(B5:B50)" or labor["D51"].value != "=SUM(D5:D50)" or labor["F51"].value != "=SUM(F5:F50)":
    bad.append("labor total range is wrong: %r" % labor["B51"].value)

labels = [summary.cell(row=r, column=1).value for r in (5, 6, 7, 8)]
if labels != ["Job Name:", "Customer Name:", "Customer Address:", "Customer Phone:"]:
    bad.append("summary labels are %r" % labels)
if summary["A10"].value != "Category" or summary["D5"].value != "Date:":
    bad.append("summary table header moved oddly")
if summary["B12"].value != "='Labor Estimate'!D51" or summary["C12"].value != "='Labor Estimate'!F51":
    bad.append("summary labor reference is %r" % summary["B12"].value)
if summary["C19"].value != "=C16" or summary["C23"].value != "=C20+C21+C22":
    bad.append("summary payment formulas are wrong")

# sheets that were not meant to change
for r in range(1, ref["Materials Estimate"].max_row + 1):
    for c in range(1, ref["Materials Estimate"].max_column + 1):
        a = ref["Materials Estimate"].cell(row=r, column=c).value
        b = out["Materials Estimate"].cell(row=r, column=c).value
        if a != b:
            bad.append("Materials Estimate changed at %s" % ref["Materials Estimate"].cell(row=r, column=c).coordinate)

for r in range(1, ref["Subs"].max_row + 1):
    for c in range(1, ref["Subs"].max_column + 1):
        a = ref["Subs"].cell(row=r, column=c).value
        b = subs.cell(row=r, column=c).value
        if a != b and not (c == 1 and r in SUBS_HEADINGS):
            bad.append("Subs changed at %s" % ref["Subs"].cell(row=r, column=c).coordinate)

for r in range(1, 5):
    for c in range(1, 7):
        a = ref["Labor Estimate"].cell(row=r, column=c).value
        b = labor.cell(row=r, column=c).value
        if a != b:
            bad.append("Labor header changed at %s" % ref["Labor Estimate"].cell(row=r, column=c).coordinate)

print()
print("problems:", len(bad))
for line in bad[:25]:
    print("  -", line)

print()
print("number formats, Labor col D  ref row6=%r   row16=%r  row43=%r"
      % (ref["Labor Estimate"]["D6"].number_format, labor["D16"].number_format, labor["D43"].number_format))
print("Subs heading rows keep their formulas:",
      [(r, subs.cell(row=r, column=6).value) for r in sorted(SUBS_HEADINGS)])
