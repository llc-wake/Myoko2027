# Myoko2027

Daily interactive briefing dashboard for a January 2027 snowboard trip to **Myoko Kogen, Niigata, Japan**.

**Trip window:** 17–25 January 2027 · five nights at one resort · four riding days · two riders, beginner / improving.

## What this is

`index.html` is a self-refreshing morning dashboard covering:

1. Top 3 things to know today
2. Myoko resort and snow-season update
3. Tickets, passes and booking watch
4. Travel and logistics watch
5. Training and skill progress
6. Gear and gadget watch
7. Action items (checkboxes, persisted in browser storage)
8. Watchlist
9. Source and confidence notes

## Structure

```
Myoko2027/
  index.html              current day's briefing
  style.css
  script.js
  data/
    latest.json           machine-readable copy of the current briefing
  archive/
    YYYY-MM-DD.html       dated snapshots
  assets/
    img/                  hero.jpg, gear.jpg, training.jpg
  README.md
```

## Conventions

- **Prior-season figures are always labelled.** Anything from 2025/26 is marked as a baseline, not a current offer.
- **Gaps are stated, not filled.** Where a value could not be verified from a first-party source, the page says so rather than guessing.
- **Confidence is published per source** in the Source Notes section: High / Medium / Low with the reason.
- **Images are AI-generated illustrations**, not photographs of the resorts.

## Assets

Generated images, JSON snapshots, source notes and archived HTML are also stored in the Google Drive folder **Myoko2027 Assets Folder**:

```
Myoko2027 Assets Folder/
  images/{hero,gear,training,resort}/
  data/{daily-briefings,source-notes}/
  exports/html-archive/
```

## Daily update process

1. Check official Myoko-area resort sources, then tickets, schools, transport and gear news.
2. Summarise only changes that affect a decision.
3. Regenerate or reuse imagery.
4. Update `index.html` and `data/latest.json`.
5. Save a dated copy to `archive/`.
6. Mirror assets to Google Drive.
7. Commit as `Daily Myoko briefing update - YYYY-MM-DD`.

## Briefing log

| # | Date | Headline |
|---|---|---|
| 001 | 2026-08-22 | Deep off-season. Only Suginohara has 26/27 dates; the official Mt Myoko ticket shop is empty; accommodation is the only urgent item. |
