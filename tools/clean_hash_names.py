"""Takes the '#' heading names out of the price-sheet workbooks.

Nothing else changes: every row stays, every formula, style, sheet protection and
saved (cached) result stays exactly where it is. Only the exact cells whose text
begins with '#' are blanked.

Why hand-edit the file's XML instead of using a spreadsheet library: an
openpyxl re-save throws away the cached formula results, which is what the app
reads — a filled sheet would then look like $0.00 until it is recalculated and
saved again. Touching only the changed cells avoids that entirely.

An .xlsx is a zip of XML parts. Run with no --apply for a read-only report.
"""
import argparse
import datetime
import os
import re
import shutil
import zipfile
import xml.etree.ElementTree as ET

MAIN = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
CELL = re.compile(r'<c\b[^>]*?(?:/>|>.*?</c>)', re.DOTALL)
REF_ATTR = re.compile(r'\br="([A-Z]+\d+)"')
TYPE_ATTR = re.compile(r'\bt="([^"]+)"')
T_TAG = re.compile(r'<t[^>]*>(.*?)</t>', re.DOTALL)


def shared_strings(zf):
    try:
        xml = zf.read('xl/sharedStrings.xml')
    except KeyError:
        return []
    root = ET.fromstring(xml)
    return [''.join(t.text or '' for t in si.iter(MAIN + 't')) for si in root.iter(MAIN + 'si')]


def cell_text(elem, strings):
    """The text a cell shows, or None when it isn't a piece of text at all."""
    match = TYPE_ATTR.search(elem)
    cell_type = match.group(1) if match else 'n'

    if cell_type == 's':
        value = re.search(r'<v>(\d+)</v>', elem)
        if not value:
            return None
        index = int(value.group(1))
        return strings[index] if index < len(strings) else None

    if cell_type == 'inlineStr':
        return ' '.join(T_TAG.findall(elem)) or None

    if cell_type == 'str':
        value = re.search(r'<v>(.*?)</v>', elem, re.DOTALL)
        return value.group(1) if value else None

    return None


def sheet_files(zf):
    """Every worksheet part, in tab order."""
    names = [n for n in zf.namelist() if re.fullmatch(r'xl/worksheets/sheet\d+\.xml', n)]
    return sorted(names, key=lambda n: int(re.search(r'(\d+)', n.split('/')[-1]).group(1)))


def clean_sheet_bytes(raw, strings):
    """Blanks the '#' cells in one sheet part. Returns (new_bytes, removed)."""
    text = raw.decode('utf-8')
    removed = []

    def replace(match):
        elem = match.group(0)
        shown = cell_text(elem, strings)
        if shown is None or not shown.strip().startswith('#'):
            return elem
        ref = REF_ATTR.search(elem)
        removed.append({'cell': ref.group(1) if ref else '?', 'text': shown})
        opening = elem[: elem.index('>') + 1]
        return opening[:-1].rstrip('/').rstrip() + '/>'

    return CELL.sub(replace, text).encode('utf-8'), removed


def inspect(path):
    """Report only: what '#' cells live in this workbook."""
    with zipfile.ZipFile(path) as zf:
        strings = shared_strings(zf)
        report = []
        for name in sheet_files(zf):
            _, removed = clean_sheet_bytes(zf.read(name), strings)
            if removed:
                report.append({'part': name, 'cells': removed})
    return report


def apply_cleanup(path):
    """Blank the '#' cells in place, after making a dated backup alongside the file."""
    stamp = datetime.date.today().isoformat()
    backup = os.path.join(
        os.path.dirname(path),
        f'{os.path.splitext(os.path.basename(path))[0]}_BEFORE_HASH_CLEANUP_{stamp}.xlsx',
    )
    if not os.path.exists(backup):
        shutil.copy2(path, backup)
    else:
        backup = f'{backup} (backup already existed)'

    # Read everything first and let go of the file, then write. Windows refuses to swap a
    # file in place while it is still open, so the handles must be closed before the replace.
    with zipfile.ZipFile(path) as zf:
        strings = shared_strings(zf)
        edits = {}
        removed_total = 0
        for name in sheet_files(zf):
            new_bytes, removed = clean_sheet_bytes(zf.read(name), strings)
            removed_total += len(removed)
            if removed:
                edits[name] = new_bytes
        items = zf.infolist()
        originals = [(item, zf.read(item.filename)) for item in items]

    if not edits:
        return {'changed': 0, 'backup': backup}

    tmp = path + '.tmp_cleanup'
    with zipfile.ZipFile(tmp, 'w', zipfile.ZIP_DEFLATED) as zout:
        for item, data in originals:
            zout.writestr(item, edits.get(item.filename, data))
    os.replace(tmp, path)

    return {'changed': removed_total, 'backup': backup}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('paths', nargs='+')
    parser.add_argument('--apply', action='store_true', help='make the change (default: report only)')
    args = parser.parse_args()

    for path in args.paths:
        print(f'=== {path}')
        if not os.path.exists(path):
            print('  NOT FOUND')
            continue
        print(f'  size {os.path.getsize(path)} bytes')

        if args.apply:
            print(f'  {apply_cleanup(path)}')
        else:
            report = inspect(path)
            if not report:
                print('  no # cells found')
            for sheet in report:
                print(f'  {sheet["part"]}: {len(sheet["cells"])} # cell(s)')
                for cell in sheet['cells']:
                    print(f'    {cell["cell"]}: {cell["text"]!r}')


if __name__ == '__main__':
    main()
