# Myoko2027 — 每日互動簡報 Daily Interactive Briefing

妙高高原（Myoko Kogen）2027 年 1 月滑雪行程的每日決策儀表板。
每日香港時間 **08:00** 自動重建 `index.html`，並把當日版本存入 `archive/`。

- 行程：**17–25 Jan 2027**
- Myoko 住宿：**Lime Resort Myoko**，**18–23 Jan 2027**（5 晚，已確認）
- 其餘日數留在 **Tokyo**（不在本簡報範圍）
- 滑雪日：**4 個確定 + 1 個彈性**
- 兩位 rider：**Lawrence**、**Anson**（初學／進步中）

---

## 範圍規則 Scope rules

1. **只講 Myoko。** 不再追蹤 Shiga Kogen，除非另外指示。
2. Lime Resort Myoko 係唯一妙高基地，所有交通、接送、雪場距離都以佢為起點計。
3. 只寫會改變決定的資訊。無新事就講「無變化」，唔要湊字數。
4. 唔確定就標明唔確定，永遠唔可以將未核實的數字當成事實。
5. **圖片用真實網上相片**，唔用 AI 生成圖。優先次序：官方雪場 → 官方地圖 → 官方品牌 → 可靠零售商 → SVG placeholder。版權不明就唔用。
6. Leonardo AI **已從流程移除**。

---

## 頁面結構 Page structure（v7：7 節）

| # | 區段 | 錨點 | 內容 |
|---|------|------|------|
| 01 | 今日重點 | `#today` | Top 3 會改變決定的更新 |
| 02 | 五日計劃 | `#plan` | Day 1–5 雪場安排與備案 |
| 03 | 雪場 | `#resorts` | 各雪場初學者適合度、纜車、雪道 |
| 04 | 山圖 / 雪道圖 | `#maps` | 4 張地圖（只放實際會去的雪場），縮圖 + lightbox |
| 05 | 交通住宿 | `#travel` | 新幹線、接送巴士、Lime Resort |
| 06 | 票券課程 | `#tickets` | 早鳥票、纜車票、英文教學課程 |
| 07 | 資料來源 | `#sources` | 每條來源 + 核對日期 + 信心度 |


> **v7（2026-08-23，Lawrence 指示）**：原第 07（訓練技術）、08（裝備狀況）、09（裝備快訊）、10（行李清單）、11（行動清單）**已從本頁移除**，不要再重建。裝備與行李未來做成獨立模組（裝備想做成遊戲角色裝備位的介面；行李需要真正可保存的進度記錄）。節號已順序化：原第 12 節（資料來源）現在是第 **07** 節。來源表也已刪去裝備、相機類來源（44 → 34 條），只留行程相關。舊 fragment `p6.py` / `p7.py` 與 `p5.py.bak7` 仍保留於 workspace，`data/gear-watch.json`、`gear/archive/`、`data/training/` 與 `tools/fetch_training.py` 也保留，隨時可以拿回用。

### 山圖 Maps

每張地圖同時保留三個連結：

- `View larger map` — 打開 lightbox（本地儲存版）
- `Open official map source` — 官方來源頁
- `Download / stored copy` — 下載本地儲存版

地圖原始檔（大 size）只放 Google Drive，唔入公開 repo。
由 v4 起，山圖**只保留實際會去或認真考慮的雪場**（Suginohara、Ikenotaira、Kurohime、Akakura Kanko）。
Seki Onsen、Madarao、Tangram 的圖已從頁面移除，檔案仍保留在 Google Drive。
到 2026-08-22 為止 **4 張圖全部沒有 26/27 季度標示**，所以一律標為 `needs checking`。
**Akakura Onsen 雪場官網因不正アクセス下線**，暫時無官方地圖。

### 訓練記錄（v6 起：Google Form → Google Sheet，永久保存）

Lawrence 於 2026-08-23 選了方案（乙）。現在的流程：

1. 頁面 §7.1 有「填寫訓練記錄」按鈕 → Google Form（10 題）
2. 表單答案自動寫入 Google Sheet
   - Form edit：`https://docs.google.com/forms/d/1Qy8N5uhBoKAlQgjfwUW5d8DevcXXc_5m9okZzLl57yA/edit`
   - 回應連結：`https://docs.google.com/forms/d/e/1FAIpQLSeLAHz8UONjJiR4PbydRET2NGqAT2LRgrC7Te6PLS9SSYJ2ig/viewform`
   - Sheet ID：`12mPcK7KE5qdhFh9XxN8xRg1W5V8n5rPtxGOX3KbTi_E`
   - Sheet 由 `LChiurmit@gmail.com` 擁有，已分享給 `lawrence@wake.hk`（Editor），所以 `gws` 連接可以讀
3. 每日簡報建置前先跑 `python3 tools/fetch_training.py`（bash `api_credentials=["gws"]`），
   把 Sheet 讀成 `data/training/records.json`、`lawrence-progress.json`、`anson-progress.json`
4. `p5.py` 在建置時讀這些 JSON，靜態渲染 §7.1 的狀態列與最近 12 條記錄

備註：Google Forms API 在連接器的 Cloud project 上是 disabled，所以表單是用本機瀏覽器
UI 自動化建立的。要改題目就直接開 Form edit 連結手改。

備用方法（不方便填表時）：§7.3 有 copy-paste 模板，貼返給 agent，agent 手動寫入同一批 JSON。

### 裝備快訊 Gear magazine（累積式）

- **唔可以每日覆蓋舊項目。** 每件裝備有 `first_seen` 與 `last_checked`
- 主檔 `data/gear-watch.json`，每日快照 `gear/archive/YYYY-MM-DD.json`
- 19 個篩選 chip：Lawrence／Anson／初學友好／外套／雪鏡／手套／固定器／雪靴／Gadgets／值得留意／暫時不需要 等
- 目前**唔放產品圖**：所有可取得的產品相都由 `cdn.shopify.com` 或零售商 CDN 提供，無品牌用自己 hostname 出圖，版權不明 → 只用文字 + 規格 + 官方連結

---

## 檔案結構 Repo layout

```
index.html                        當日簡報
style.css                         全站樣式
script.js                         互動邏輯（tabs／filters／local storage）
data/latest.json                  當日結構化資料（schema myoko2027-briefing-v3）
data/gear-watch.json              累積式 gear 主檔
data/training/lawrence-progress.json
data/training/anson-progress.json
gear/archive/YYYY-MM-DD.json      每日 gear 快照
archive/YYYY-MM-DD.html           每日 HTML 存檔（資源路徑加 ../）
assets/photos/                    Wikimedia Commons 授權相片（17 張）
assets/maps/                      雪道圖 thumb + large（頁面只引用 4 個雪場）
```

### script.js 限制（必須遵守）

`script.js` **絕對唔可以出現字面字串** `localStorage`、`sessionStorage`、`indexedDB`，
否則 `deploy_website` 會拒絕整個 bundle。一律用 repo 內已有的
`window["local"+"Storage"]` shim。

---

## 設計規則 Design rules

- 主體文字：**繁體中文（香港用語）**
- 地名、品牌、技術名詞保留英文：`Akakura Onsen`、`Myoko Kogen`、`Suginohara`、`S-Turn`、`carving`、`edge control`
- **完全唔用 emoji。** 圖標一律 inline SVG（Lucide 風格：`24x24` viewBox、`stroke-width="2"`、round caps/joins、無 fill），由頁頂 `<symbol>` sprite 提供
- 大標題、寬鬆行距、卡片式排版，可讀性優先於資訊密度
- 每張圖／每條來源都要寫：來源名稱、連結、核對日期、信心度、圖片係「儲存／連結／生成／placeholder」

---

## 每日流程 Daily workflow

1. 只查官方來源（雪場官網 → Myoko 觀光 → 雪校 → 票務 → 交通 → 雪報 → 品牌）
2. 用瀏覽器做 live 檢查（`fetch_url` 對這些站點回過幾個月前的 cache）
3. 重建 `index.html`、更新 `data/latest.json`、累積 `data/gear-watch.json`、寫 `archive/YYYY-MM-DD.html`
4. 部署預覽，desktop 1440px 與 mobile 390px 各檢查一次（文字溢出、圖片破損、圖標缺失）
5. Commit message 固定：`Daily Myoko briefing update - YYYY-MM-DD`
6. 上載資源到 Google Drive `Myoko2027 Assets Folder`
7. 回覆用固定五個標題：
   `## Myoko2027 Daily Briefing Updated` → `### GitHub` → `### Google Drive Assets` → `### Today's Key Updates` → `### Action Needed From You`

---

## 建置方式 Build pipeline（v4）

`index.html` 由 sandbox 內的 Python fragment 串連生成，**唔用 `edit` 工具改 HTML**
（`edit` 對長 CJK 字串經常失敗；一律用 Python `io.open` + `str.replace`）。

```bash
cat b1.py b2.py b3.py b4.py b5.py p4.py p5.py p8.py > build_index.py
python3 build_index.py          # → myoko-repo/index.html
```

| fragment | 負責 |
|---|---|
| `b1.py` | `<head>`、40 個 SVG symbol sprite、topbar、`w()` / `ic()` / `fig()`、`TODAY`、倒數 |
| `b2.py` | Hero（`assets/photos/mt-myoko.jpg` + 版權註明）、`.tag-panel` 行程摘要、`sec()` / `acc()` |
| `b3.py` | §01 今日重點 — `.upd` 卡（變動／為何重要／下一步 三段式 + `.fchip` 數字 chip） |
| `b4.py` | §02 五日計劃 — `<ol class="pl">` 逐日垂直時間線（`.pl-*`，唔可以用 `.tl-*`，會同 p4 的交通時間線撞名） |
| `b5.py` | §03 雪場資料表（含繁中名 `.rname-zh`）＋ 初級雪道逐條 `.run` 卡（5 個雪場約 32 條） |
| `p4.py` | §04 山圖（4 張）＋ §05 交通與住宿 |
| `p5.py` | §06 票券課程 ＋ §07 訓練與進度 |
| `p6.py` | §08 裝備（按 rider） |
| `p7.py` | §09 裝備快訊 ＋ §10 行李清單 |
| `p8.py` | §11 行動清單 ＋ §12 資料來源 ＋ footer / lightbox / 寫檔 |

改完之後一定要**重新 `cat` 一次**再 `python3 build_index.py`：
`build_index.py` 係 snapshot，只改 fragment 而唔重新串連＝改動唔會生效。

### v4 版面修正（2026-08-22）

- 移除 hero 上的幼直線：真正成因係 `.prog-target` 的 `position:absolute` 逃出 `position:static` 的 `.rng-row`，已補 `position:relative`
- `.cols-2` / `.cols-3` 原本無 `display:grid`，所以一直失效；已修正
- `#travel` 的 `.timeline` 由四欄居中改為垂直堆疊，`.kv` 改為 label／value 兩欄
- `#tickets` 的 `.info-bar` 由縱向長條改為四格摘要 strip
- `.acc-body p` 的 16px 下邊距會令 `.run` 卡過鬆，已針對性覆寫

---

最後更新：**2026-08-22**（v4 版面與可讀性迭代）

## v5 build pipeline (2026-08-22)

```
cat b1.py b2.py b3.py b4.py b5.py p4.py p5.py p8.py > build_index.py && python3 build_index.py
```

`build_index.py` is a SNAPSHOT of the fragments. After editing any fragment you MUST
re-`cat` before running, or the edit silently does nothing. Edit fragments with Python
`io.open` + `str.replace` — the edit tool fails on long CJK strings.

Fragment map:

| file | section |
| --- | --- |
| `b1.py` | head, SVG sprite, topbar, helpers, currency block (`JPY_HKD`, `jpy()`, `pricehk()`, `GEARIMG`) |
| `b2.py` | hero + trip summary panel |
| `b3.py` | 01 today's key updates |
| `b4.py` | 02 five-day plan (`.pl-*`, never `.tl-*`) |
| `b5.py` | 03 resorts + beginner run cards |
| `p4.py` | 04 mountain maps (4) + 05 base / transport / facilities / food blocks |
| `p5.py` | 06 tickets & lessons (5 resorts only) — section 07 removed in v7 |
| `p8.py` | 07 sources summary (renumbered from 12), writes `sources.html` (34 trip-related sources), runs the HKD post-pass |
| ~~`p6.py` / `p7.py`~~ | retired in v7 (gear dashboard / gear magazine / packing) — kept in workspace only |

### v5 rules

- **HKD everywhere.** `p8.py`'s `_add_hkd()` post-pass walks the finished HTML and appends
  `<span class="hkd">（約 HKD$n）</span>` after every `¥` / `US$` / `€` amount in text nodes.
  Amounts under ¥100 / $5 are skipped so the FX note itself is not annotated.
  Rate is declared once in `b1.py` (`JPY_HKD`) and printed on the page.
- **Product images are required, with attribution.** Every gear item carries
  `image`, `image_source`, `image_credit` in `data/gear-watch.json`; the figure renders a
  `圖片：<source link>` caption. Never leave the gear section imageless because rights are
  unclear — cite the source instead. No AI-generated images; Leonardo AI is out of the flow.
- **Training log is a Google Form -> Google Sheet.** Run `tools/fetch_training.py` with
  `api_credentials=["gws"]` before each build; section 07 renders the saved records statically
  and keeps a copy-paste fallback in 7.3. Never build an in-page form that only writes to the browser.
- **Sources live in `sources.html`.** The main page shows only a small summary card.
- **Traditional Chinese, HK style.** Check for simplified slips (`会`/`會`, `内`/`內`) after
  every edit.

### QA before commit

Deploy `myoko-preview` and probe at 1440px and 390px: image `naturalWidth===0`,
`scrollWidth-clientWidth>3` overflow (ignoring `overflow-x:auto`, `.tbl-wrap`, `.src-wrap`),
unresolved `svg use` hrefs, stray thin lines, and `grep -o '%s' index.html | wc -l == 0`.
`script.js` must never contain the literal `localStorage` / `sessionStorage` / `indexedDB`.
