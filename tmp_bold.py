import sys, zipfile, re
z = zipfile.ZipFile(sys.argv[1])
x = z.read('word/document.xml').decode('utf-8')

targets = ["Material description", "Demolition", "Carpentry", "Plumbing",
           "Electrical", "Allowances figured", "Homeowner to supply",
           "Special note", "Total for all work", "work to be done"]

for m in re.finditer(r'<w:p[ >].*?</w:p>', x, re.S):
    s = m.group(0)
    plain = re.sub(r'<[^>]+>', '', s).strip()
    if not plain:
        continue
    for t in targets:
        if plain.startswith(t):
            bold = 'BOLD' if '<w:b/>' in s or '<w:b ' in s else 'plain'
            ital = ' ITALIC' if '<w:i/>' in s else ''
            sizes = re.findall(r'<w:sz w:val="(\d+)"', s)
            pts = ",".join(str(int(v) / 2) for v in sizes) or "inherit"
            print(f"{bold}{ital} {pts}pt :: {plain[:70]}")
            break