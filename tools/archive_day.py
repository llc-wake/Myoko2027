# -*- coding: utf-8 -*-
"""Write archive/<DATE>.html from the monolithic (pre-split) index.html.

The live site is split into one page per section, but the archive stays a
single self-contained page so an old briefing can be read in one scroll.
"""
import io, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.join(HERE, 'myoko-repo')
DATE = sys.argv[1] if len(sys.argv) > 1 else None
assert DATE, 'usage: python3 archive_day.py YYYY-MM-DD'

s = io.open(os.path.join(HERE, 'index_monolith.html'), encoding='utf-8').read()
for a, b in [
    ('href="style.css"', 'href="../style.css"'),
    ('src="script.js"', 'src="../script.js"'),
    ('src="assets/', 'src="../assets/'),
    ('href="assets/', 'href="../assets/'),
    ('src="data/', 'src="../data/'),
    ('href="data/', 'href="../data/'),
    ('href="gear/', 'href="../gear/'),
    ('href="sources.html"', 'href="../sources.html"'),
    ('href="archive/"', 'href="./"'),
]:
    s = s.replace(a, b)
s = s.replace('<title>', '<title>[%s] ' % DATE, 1)
out = os.path.join(REPO, 'archive', '%s.html' % DATE)
io.open(out, 'w', encoding='utf-8').write(s)
print('%s  %d chars' % (out, len(s)))
