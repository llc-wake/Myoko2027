# -*- coding: utf-8 -*-
"""Split the monolithic index.html into one page per section.

Run AFTER build_index.py:
    python3 split_pages.py

Input : myoko-repo/index.html   (monolith produced by build_index.py)
Output: myoko-repo/index.html   (hub: hero + 行程摘要 + 01 今日重點 + card grid)
        myoko-repo/plan.html plan / resorts / maps / travel / tickets / refs
        index_monolith.html      (kept in workspace for the daily archive)
"""
import io, os, re

REPO = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'myoko-repo')
SRC = os.path.join(REPO, 'index.html')
MONO = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'index_monolith.html')

s = io.open(SRC, encoding='utf-8').read()
io.open(MONO, 'w', encoding='utf-8').write(s)

# ---------------------------------------------------------------- page map
# (section id, output file, nav label, page title)
PAGES = [
    ('today',   'index.html',   u'今日重點', u'01 今日重點'),
    ('plan',    'plan.html',    u'五日計劃', u'02 五日計劃'),
    ('resorts', 'resorts.html', u'雪場',     u'03 雪場'),
    ('maps',    'maps.html',    u'山圖',     u'04 山圖'),
    ('travel',  'travel.html',  u'交通住宿', u'05 交通、住宿與飲食'),
    ('tickets', 'tickets.html', u'票券課程', u'06 纜車票與課程'),
    ('sources', 'refs.html',    u'資料來源', u'07 資料來源'),
]
LINK = dict((sid, f) for sid, f, _l, _t in PAGES)
CARD_ICON = {'plan': 'calendar-days', 'resorts': 'mountain-snow', 'maps': 'map',
             'travel': 'train-front', 'tickets': 'ticket', 'sources': 'file-text'}
CARD_DESC = {
    'plan':    u'五日騎行編排、每日雪場與備案',
    'resorts': u'五個雪場逐個比較、初級雪道',
    'maps':    u'官方山圖與雪道分佈',
    'travel':  u'Lime Resort、抵日首兩日行程、酒店設施、區內飲食',
    'tickets': u'票價、跨雪場票監察、英文課程比較與推薦',
    'sources': u'資料來源統計、可信度與圖片政策',
}

# ---------------------------------------------------------------- slice up
i_header = s.index('<header class="topbar"')
PRE = s[:i_header]                                   # doctype, head, sprite

i_top_anchor = s.index('<a id="top"></a>') + len('<a id="top"></a>')
TOPBAR_RAW = s[i_header:i_top_anchor]

i_hero = s.index('<section class="hero">')
HERO = s[i_hero:s.index('<main class="wrap">')]

MAIN_OPEN = '<main class="wrap">'
i_tag = s.index('<section class="tag-panel"')
i_first_sec = s.index('<section class="section" id="today"')
TAGPANEL = s[i_tag:i_first_sec]

bounds = []
for sid, _f, _l, _t in PAGES:
    bounds.append((sid, s.index('<section class="section" id="%s"' % sid)))
bounds.sort(key=lambda t: t[1])
i_end_main = s.index('</main>')
SECTION = {}
for n, (sid, start) in enumerate(bounds):
    end = bounds[n + 1][1] if n + 1 < len(bounds) else i_end_main
    SECTION[sid] = s[start:end]

TAIL = s[i_end_main:]        # </main> + footer + lightbox + totop + scripts


def icon(name, cls='ic'):
    return ('<svg class="%s" viewBox="0 0 24 24" aria-hidden="true">'
            '<use href="#i-%s"/></svg>' % (cls, name))


def relink(html):
    """Rewrite in-page section anchors to the page that now holds them."""
    for sid, f in LINK.items():
        target = 'index.html#today' if sid == 'today' else f
        html = html.replace('href="#%s"' % sid, 'href="%s"' % target)
    return html


def topbar(active_file):
    nav = []
    for sid, f, label, _t in PAGES:
        cls = ' class="active"' if f == active_file else ''
        nav.append('<a href="%s"%s>%s</a>' % (f, cls, label))
    inner = ('<header class="topbar"><div class="topbar-inner">'
             '<a class="brand" href="index.html">%s<span>Myoko<b>2027</b></span></a>'
             '<nav class="navlinks" aria-label="%s">%s</nav>'
             '<button class="btn btn-quiet" type="button" data-toggle-all="body">%s'
             '<span class="tg-label">%s</span></button>'
             '</div></header><a id="top"></a>'
             % (icon('mountain-snow'), u'頁面章節', ''.join(nav),
                icon('chevron-down', 'ic ic-sm'), u'全部展開'))
    return inner


def pager(idx):
    prev_ = PAGES[idx - 1] if idx > 0 else None
    next_ = PAGES[idx + 1] if idx + 1 < len(PAGES) else None
    out = ['<nav class="pager" aria-label="%s">' % u'章節導覽']
    if prev_:
        out.append('<a class="pg pg-prev" href="%s">%s<span><i>%s</i><b>%s</b></span></a>'
                   % (prev_[1], icon('arrow-up', 'ic ic-sm pg-ic-l'), u'上一節', prev_[3]))
    else:
        out.append('<span class="pg pg-void"></span>')
    if next_:
        out.append('<a class="pg pg-next" href="%s"><span><i>%s</i><b>%s</b></span>%s</a>'
                   % (next_[1], u'下一節', next_[3], icon('arrow-up', 'ic ic-sm pg-ic-r')))
    else:
        out.append('<a class="pg pg-next" href="index.html"><span><i>%s</i><b>%s</b></span>%s</a>'
                   % (u'返回', u'01 今日重點', icon('arrow-up', 'ic ic-sm pg-ic-r')))
    out.append('</nav>')
    return ''.join(out)


def cardgrid():
    cards = ['<section class="navcards" aria-label="%s">'
             '<h2 class="nc-h">%s %s</h2><div class="nc-grid">'
             % (u'章節導覽', icon('list-checks', 'ic'), u'其餘章節')]
    for sid, f, label, title in PAGES[1:]:
        cards.append('<a class="navcard" href="%s"><span class="nc-ic">%s</span>'
                     '<span class="nc-body"><b>%s</b><i>%s</i></span>'
                     '<span class="nc-go">%s</span></a>'
                     % (f, icon(CARD_ICON[sid], 'ic'), title, CARD_DESC[sid],
                        icon('arrow-up', 'ic ic-sm')))
    cards.append('</div></section>')
    return ''.join(cards)


# ---------------------------------------------------------------- write pages
tail = relink(TAIL)
for idx, (sid, fname, label, title) in enumerate(PAGES):
    body = [PRE, topbar(fname)]
    if fname == 'index.html':
        body += [HERO, MAIN_OPEN, TAGPANEL, relink(SECTION[sid]), cardgrid()]
    else:
        body += [MAIN_OPEN, relink(SECTION[sid]), pager(idx)]
    body.append(tail)
    html = ''.join(body)
    # per-page <title>
    html = re.sub(r'<title>.*?</title>',
                  '<title>%s</title>' % (u'Myoko 2027 每日簡報 · ' + title),
                  html, count=1)
    io.open(os.path.join(REPO, fname), 'w', encoding='utf-8').write(html)
    print('%-13s %7d chars' % (fname, len(html)))
print('monolith kept at %s' % MONO)
