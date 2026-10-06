"""
Builds "Next Level Excel" from Tim's blank price sheet.

Rule: the original sheet is never modified. This reads it, copies every part of the
file exactly as it is, and does ONE thing -- types section heading names into empty
description cells on the Labor Estimate and Subs tabs.

No row is inserted, no formula is touched, no cached result is dropped. That matters:
the app in the browser reads the numbers Excel last saved, so if the build stripped
those saved values every total would read as $0.00.

Usage: python tools/build-next-level-excel.py
"""

import re
import shutil
import zipfile

SRC = "reference/JQC-EXCEL-PRICE-SHEET-1.xlsx"
DEST = "Next Level Excel.xlsx"

# sheet3.xml = Labor Estimate, sheet4.xml = Subs
# row number -> heading text typed into column A of that row
HEADINGS = {
    3: {
        5: "#Demolition",
        10: "#Carpentry",
        16: "#Plumbing",
        21: "#Electrical",
    },
    4: {
        2: "#Plumbing",
        6: "#Electrical",
        10: "#Drywall",
        14: "#Masonry",
        18: "#Painting",
    },
}

NS = 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"'


def add_strings(sst_xml, texts):
    """Append the heading text to the shared string table. Returns (new xml, {text: index})."""
    existing = re.findall(r"<si>(.*?)</si>", sst_xml, re.S)
    index_of = {}
    for i, si in enumerate(existing):
        found = re.search(r"<t[^>]*>(.*?)</t>", si, re.S)
        if found:
            index_of[found.group(1)] = i

    added = 0
    out = sst_xml
    for text in texts:
        if text in index_of:
            continue
        index_of[text] = len(existing) + added
        out = out.replace(
            "</sst>",
            '<si><t xml:space="preserve">%s</t></si></sst>' % text,
            1,
        )
        added += 1

    if added:
        header = re.search(r"<sst[^>]*>", out).group(0)
        count = int(re.search(r'count="(\d+)"', header).group(1))
        unique = int(re.search(r'uniqueCount="(\d+)"', header).group(1))
        new_header = re.sub(
            r'count="\d+"', 'count="%d"' % (count + added), header
        )
        new_header = re.sub(
            r'uniqueCount="\d+"', 'uniqueCount="%d"' % (unique + added), new_header
        )
        out = out.replace(header, new_header, 1)

    return out, index_of


def main():
    all_texts = [t for sheet in HEADINGS for t in HEADINGS[sheet].values()]

    with zipfile.ZipFile(SRC) as src:
        parts = {name: src.read(name) for name in src.namelist()}
        infos = {info.filename: info for info in src.infolist()}

    sst_xml = parts["xl/sharedStrings.xml"].decode("utf-8")
    sst_xml, index_of = add_strings(sst_xml, all_texts)
    parts["xl/sharedStrings.xml"] = sst_xml.encode("utf-8")

    filled = 0
    for sheet, rows in HEADINGS.items():
        key = "xl/worksheets/sheet%d.xml" % sheet
        xml = parts[key].decode("utf-8")
        for row, text in rows.items():
            pattern = re.compile(r'<c r="A%d"([^>]*?)/>' % row)
            match = pattern.search(xml)
            if not match:
                raise SystemExit("no empty A%d cell on sheet %d" % (row, sheet))
            replacement = '<c r="A%d"%s t="s"><v>%d</v></c>' % (
                row,
                match.group(1),
                index_of[text],
            )
            xml = xml[: match.start()] + replacement + xml[match.end():]
            filled += 1
        parts[key] = xml.encode("utf-8")

    with zipfile.ZipFile(DEST, "w", zipfile.ZIP_DEFLATED) as out:
        for name, data in parts.items():
            info = infos[name]
            fresh = zipfile.ZipInfo(name, date_time=info.date_time)
            fresh.compress_type = zipfile.ZIP_DEFLATED
            fresh.external_attr = info.external_attr
            out.writestr(fresh, data)

    print("wrote %s with %d heading rows" % (DEST, filled))


if __name__ == "__main__":
    main()
