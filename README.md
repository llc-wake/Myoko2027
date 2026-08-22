# Myoko 2027 每日簡報 / Myoko2027 Daily Briefing

行程：**2027年1月17日–25日**，妙高（Myoko Kogen）雪場住 5 晚，4 個滑雪整日 + 1 個可選熱身日。
騎手：Lawrence + 太太，現時水平 **Beginner / improving**。

每日產生一個以決策為主的互動 HTML 簡報：只放會改變決定的資訊，不做新聞堆填。

---

## 產出時間與語言

| 項目 | 設定 |
|---|---|
| 執行時間 | 每日 **08:00 Asia/Hong_Kong**（= 00:00 UTC） |
| 主體語言 | **繁體中文（香港用語）** |
| 保留英文 | 地名（`Akakura Onsen`、`Myoko Kogen`、`Suginohara`）、品牌（`Burton`、`Ride`、`Smith`、`Oakley`、`Bataleon`）、技術詞（`S-Turn`、`carving`、`edge control`、`boot fitting`） |
| 圖示 | 全部 inline SVG，Lucide 風格。**不使用 emoji** |

---

## 檔案結構

```
index.html            當日簡報（每日覆寫）
style.css             樣式（自建 utility class，無 CDN，離線可讀）
script.js             互動：導覽 active、展開/收起、清單勾選記憶、進度條、回頂
data/latest.json      當日結構化資料（機讀）
archive/YYYY-MM-DD.html  每日存檔（資產路徑加 ../ 前綴）
assets/img/           頁面用圖
README.md             本文件
```

## Google Drive 資產結構

`Myoko2027 Assets Folder`

```
images/hero/          主視覺
images/resort/        雪場、住宿、教學情境圖
images/gear/          裝備圖
images/maps/          官方雪道地圖原檔
images/weather/       雪況／天氣視覺
images/training/      訓練視覺
data/daily-briefings/ 每日 latest.json 存檔
data/source-notes/    每日來源與可信度筆記
exports/html-archive/ 每日 HTML 存檔
```

---

## 每日章節

1. **行程概覽** — infographic 面板：行程日期、倒數、滑雪日數、騎手、現時水平、資料核對日期，附時間軸
2. **今日三大重點** — 只列會改變決定的事
3. **雪場與雪況動態** — Myoko Kogen、Akakura Onsen、Akakura Kanko、Ikenotaira、Suginohara、Seki Onsen、Madarao / Tangram
4. **票券與通行證** — 早割、季票、Ikon、Mountain Collective、散買日票比較
5. **交通與住宿物流** — 鐵路路線、JR Pass 期限、住宿短名單
6. **雪場地圖** — 官方雪道地圖，逐個標示季度可信度
7. **訓練與技術進度** — 若未收到訓練更新，會簡短提醒
8. **裝備與 gadget 觀察** — 新品、值得買／租／跳過
9. **行動清單** — checkbox，勾選狀態存在瀏覽器
10. **來源與可信度** — 每項附來源名稱、核對日期、可信度

### 優先度標籤

`緊急` · `重要` · `觀察` · `無變化` · `已確認` · `需核對`

---

## 圖示規範

所有圖示為 inline SVG `<symbol>`，集中在 `index.html` 頂部的 sprite：

- `viewBox="0 0 24 24"`
- `stroke-width="2"`、`stroke-linecap="round"`、`stroke-linejoin="round"`
- `fill="none"`、`stroke="currentColor"`
- 單色線性，Lucide 風格

**不使用 emoji。** 圖示在各章節之間保持一致（同一概念用同一個圖示）。

---

## 地圖處理原則

- 地圖原檔存入 Drive `images/maps/`，**不放進 public repo**（版權考量）
- 頁面用 SVG 佔位縮圖 + 連結到官方地圖頁與原始檔
- 檔案沒有 26/27 季度標示的一律標為 `需核對`
- 日本雪場慣例在 11–12 月才換新季地圖，所以夏季拿到的都是上一季版本
- 若要直接嵌入地圖圖片，需先把 repo 設為 private（行動項 `a8`）

---

## 圖片使用原則

優先順序：

1. 官方可下載媒體（在授權允許範圍內）
2. AI 生成示意圖（`asi-generate-image`，`gpt_image_2`）— 圖說明確標示「AI 生成」
3. SVG／漸層佔位圖
4. 連結到來源預覽

版權、存取或授權不明的圖片**不使用**。

---

## 工作流程

1. 讀取官方來源（雪場官網 → 妙高觀光 → 雪校 → 票務 → 交通 → 雪報 → 品牌 → 評測）
2. 交叉核對日期；資料可能過時的明確標示
3. 產生／挑選圖片，最佳化為 JPG（1600px / quality 82 / progressive）
4. 寫 `index.html`、`data/latest.json`、`archive/YYYY-MM-DD.html`
5. Commit：`Daily Myoko briefing update - YYYY-MM-DD`
6. 上傳資產到 Google Drive
7. 回報：GitHub 更新／存檔、Drive 資產、今日三大重點、需要你決定的事

**Leonardo AI 已從流程移除。** 連接器沒有取回生成圖片的方法，無法把圖存入 repo 或 Drive；所有圖片改用 `asi-generate-image`。流程不依賴 Leonardo AI 也能完整運作。

---

## 誠實原則

尚未核實的數字不寫成事實。目前已知缺口會逐日列在頁尾「來源與可信度」與 `latest.json` 的 `gaps`：

- 未有 Tokyo → Myoko 實際票價
- JR Pass 官方頁價格為圖片，未能抽取數字
- 未有 2027 年 1 月實際住宿報價
- Epic Pass 日本狀況未核實
- 護具、加熱裝備、穿戴裝置、通訊、運動攝影機未研究
- 8 月無雪況數據，雪況追蹤 12 月起加入
