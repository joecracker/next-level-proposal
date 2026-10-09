"""Throwaway probe: is the folder writable, and are the workbooks locked by a program?"""
import glob
import os

BASE = r"C:\Users\user\Documents\July's Quality Construction"

workbooks = [
    p
    for p in glob.glob(os.path.join(BASE, '**', '*.xlsx'), recursive=True)
    if 'BEFORE_HASH_CLEANUP' not in p
]

for path in workbooks:
    print(path)
    print('  size', os.path.getsize(path))
    try:
        with open(path, 'r+b'):
            pass
        print('  open for writing: YES')
    except Exception as exc:
        print('  open for writing: NO ->', exc)
    try:
        with open(path + '.probe', 'w') as probe:
            probe.write('x')
        os.remove(path + '.probe')
        print('  new file in that folder: YES')
    except Exception as exc:
        print('  new file in that folder: NO ->', exc)

backups = glob.glob(os.path.join(BASE, '**', '*BEFORE_HASH_CLEANUP*'), recursive=True)
print('backups found:', [os.path.basename(b) for b in backups])
