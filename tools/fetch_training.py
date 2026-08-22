# -*- coding: utf-8 -*-
"""Read the Myoko2027 Training Log Google Sheet and write JSON for the daily briefing.

Run with:  bash(api_credentials=["gws"])  ->  python3 /home/user/workspace/fetch_training.py

Sheet is owned by LChiurmit@gmail.com (the Google Form responses sheet) and shared
with lawrence@wake.hk (Editor), which is the account the gws connector uses.
"""
import io, json, os, subprocess, sys, collections

SHEET_ID = "12mPcK7KE5qdhFh9XxN8xRg1W5V8n5rPtxGOX3KbTi_E"
FORM_EDIT = "https://docs.google.com/forms/d/1Qy8N5uhBoKAlQgjfwUW5d8DevcXXc_5m9okZzLl57yA/edit"
FORM_LINK = "https://docs.google.com/forms/d/e/1FAIpQLSeLAHz8UONjJiR4PbydRET2NGqAT2LRgrC7Te6PLS9SSYJ2ig/viewform"
OUT = "/home/user/workspace/myoko-repo/data/training"

KEYS = ["timestamp", "rider", "date", "where", "hours", "skills",
        "best", "stuck", "level", "injury", "notes"]

LEVELS = [u"完全初學", u"初級", u"初中級", u"中級", u"中級以上"]


def read_sheet():
    p = subprocess.run(
        ["gws", "sheets", "spreadsheets", "values", "get",
         "--params", json.dumps({"spreadsheetId": SHEET_ID, "range": "A1:K2000"})],
        capture_output=True, text=True)
    if p.returncode != 0:
        sys.stderr.write("gws failed exit=%s\n%s\n" % (p.returncode, p.stderr[:800]))
        return None
    return json.loads(p.stdout).get("values", [])


def main():
    rows = read_sheet()
    if rows is None:
        print("SHEET_UNREADABLE - keeping existing JSON untouched")
        return 1
    recs = []
    for r in rows[1:]:
        r = list(r) + [""] * (len(KEYS) - len(r))
        rec = dict(zip(KEYS, [c.strip() for c in r[:len(KEYS)]]))
        if not rec["rider"] and not rec["date"]:
            continue
        rec["skill_list"] = [s.strip() for s in rec["skills"].split(",") if s.strip()]
        recs.append(rec)
    recs.sort(key=lambda x: (x["date"], x["timestamp"]))

    if not os.path.isdir(OUT):
        os.makedirs(OUT)
    with io.open(os.path.join(OUT, "records.json"), "w", encoding="utf-8") as f:
        json.dump({"source": "Google Form -> Google Sheet",
                   "sheet_id": SHEET_ID, "form_link": FORM_LINK,
                   "form_edit": FORM_EDIT, "count": len(recs),
                   "records": recs}, f, ensure_ascii=False, indent=1)

    for rider, fn in ((u"Lawrence", "lawrence-progress.json"),
                      (u"Anson", "anson-progress.json")):
        mine = [r for r in recs if r["rider"].startswith(rider)]
        cnt = collections.Counter()
        for r in mine:
            for s in r["skill_list"]:
                cnt[s] += 1
        lv = ""
        for r in reversed(mine):
            if r["level"]:
                lv = r["level"]
                break
        summary = {
            "rider": rider,
            "sessions": len(mine),
            "latest_date": mine[-1]["date"] if mine else "",
            "latest_where": mine[-1]["where"] if mine else "",
            "latest_hours": mine[-1]["hours"] if mine else "",
            "self_level": lv,
            "skill_counts": cnt.most_common(),
            "recent": [{k: r[k] for k in ("date", "where", "hours", "level",
                                          "best", "stuck", "injury", "notes")}
                       for r in mine[-5:]],
            "has_data": bool(mine),
        }
        with io.open(os.path.join(OUT, fn), "w", encoding="utf-8") as f:
            json.dump(summary, f, ensure_ascii=False, indent=1)
        print("%s: %d sessions, level=%s" % (rider, len(mine), lv or "-"))
    print("records.json written: %d rows" % len(recs))
    return 0


if __name__ == "__main__":
    sys.exit(main())
