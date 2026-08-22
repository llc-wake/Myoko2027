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

## 頁面結構 Page structure（12 節）

| # | 區段 | 錨點 | 內容 |
|---|------|------|------|
| 01 | 今日重點 | `#today` | Top 3 會改變決定的更新 |
| 02 | 五日計劃 | `#plan` | Day 1–5 雪場安排與備案 |
| 03 | 雪場 | `#resorts` | 各雪場初學者適合度、纜車、雪道 |
| 04 | 山圖 / 雪道圖 | `#maps` | 7 張地圖，縮圖 + lightbox |
| 05 | 交通住宿 | `#travel` | 新幹線、接送巴士、Lime Resort |
| 06 | 票券課程 | `#tickets` | 早鳥票、纜車票、英文教學課程 |
| 07 | 訓練與進度 | `#training` | 兩位 rider 分開記錄 + 10 項進度條 |
| 08 | 裝備 | `#gear` | 按 rider 分開的適合度判斷 |
| 09 | 裝備快訊 | `#watch` | Gear magazine（累積式，不刪舊項） |
| 10 | 行李清單 | `#packing` | 按 owner（Lawrence／Anson／共用）分 |
| 11 | 行動清單 | `#actions` | 可勾選的待辦，含截止日 |
| 12 | 資料來源 | `#sources` | 每條來源 + 核對日期 + 信心度 |

### 山圖 Maps

每張地圖同時保留三個連結：

- `View larger map` — 打開 lightbox（本地儲存版）
- `Open official map source` — 官方來源頁
- `Download / stored copy` — 下載本地儲存版

地圖原始檔（大 size）只放 Google Drive，唔入公開 repo。
到 2026-08-22 為止 **7 張圖全部沒有 26/27 季度標示**，所以一律標為 `needs checking`。
**Akakura Onsen 雪場官網因不正アクセス下線**，暫時無官方地圖。

### 訓練記錄的限制（重要）

`index.html` 係 **靜態網站，沒有伺服器**。

- 表單輸入只寫入**該部裝置該個瀏覽器**的 local storage（namespace `myoko2027:`）
- **不會**自動上傳 GitHub 或 Google Drive
- Agent 在下一次對話中**讀取不到**這些輸入
- 換裝置、清 cookie、無痕模式 → 記錄會消失

所以流程係：頁面按 `匯出 JSON` 或 `複製摘要` → 貼返俾 agent → agent 寫入
`data/training/lawrence-progress.json` / `data/training/anson-progress.json` → 記錄變成永久並可日後引用。

如果想真正自動保存，兩個可行方案（未實施，等確認）：
1. **GitHub Issue 按鈕** — 頁面開一個預填 issue，agent 讀 issue 寫入 repo
2. **Google Form → Sheet** — 表單寫入 Sheet，agent 每日讀 Sheet

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
assets/maps/                      7 張雪道圖 thumb + large
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

最後更新：**2026-08-22**（v3 設計與結構迭代）
