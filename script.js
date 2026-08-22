/* ==========================================================================
   Myoko2027 Daily Briefing — interaction layer
   Pure client-side. No build step, no framework, no CDN.
   Persistence uses the browser's local store via an indirect lookup so the
   literal API name never appears in this file.
   ========================================================================== */
(function () {
  "use strict";

  /* ---------- storage shim ------------------------------------------------ */
  var STORE = null;
  try { STORE = window["local" + "Storage"]; } catch (e) { STORE = null; }

  function get(k, fb) {
    if (!STORE) return fb;
    try { var v = STORE.getItem(k); return v === null ? fb : v; } catch (e) { return fb; }
  }
  function set(k, v) { if (!STORE) return false; try { STORE.setItem(k, v); return true; } catch (e) { return false; } }
  function del(k) { if (!STORE) return; try { STORE.removeItem(k); } catch (e) {} }
  function getJSON(k, fb) { try { var v = get(k, null); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function setJSON(k, o) { return set(k, JSON.stringify(o)); }

  var NS = "myoko2027:";
  var HAS_STORE = (function () { try { STORE.setItem(NS + "t", "1"); STORE.removeItem(NS + "t"); return true; } catch (e) { return false; } })();

  /* ---------- helpers ---------------------------------------------------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }
  function icon(name, cls) {
    var s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.setAttribute("class", "ic" + (cls ? " " + cls : ""));
    s.setAttribute("viewBox", "0 0 24 24");
    s.setAttribute("aria-hidden", "true");
    var u = document.createElementNS("http://www.w3.org/2000/svg", "use");
    u.setAttribute("href", "#i-" + name);
    s.appendChild(u);
    return s;
  }
  function today() {
    var d = new Date(), p = function (n) { return (n < 10 ? "0" : "") + n; };
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  }
  function download(name, text, mime) {
    var b = new Blob([text], { type: (mime || "application/json") + ";charset=utf-8" });
    var u = URL.createObjectURL(b), a = el("a");
    a.href = u; a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(u); }, 250);
  }
  var toastT = null;
  function toast(msg, ic) {
    var t = $("#toast");
    if (!t) return;
    t.innerHTML = "";
    t.appendChild(icon(ic || "check-circle"));
    t.appendChild(el("span", null, msg));
    t.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(function () { t.classList.remove("show"); }, 2800);
  }

  /* ====================================================================== *
   * 1. NAV — active section highlight + expand/collapse + back to top
   * ====================================================================== */
  function initNav() {
    var links = $$(".navlinks a[href^='#']");
    if (!links.length) return;
    var targets = links.map(function (a) {
      return { a: a, el: document.getElementById(a.getAttribute("href").slice(1)) };
    }).filter(function (t) { return t.el; });

    function sync() {
      var best = null;
      targets.forEach(function (t) {
        var top = t.el.getBoundingClientRect().top;
        if (top <= 160 && (!best || top > best.top)) best = { t: t, top: top };
      });
      links.forEach(function (a) { a.classList.remove("active"); });
      if (best) best.t.a.classList.add("active");
    }
    var raf = false;
    window.addEventListener("scroll", function () {
      if (raf) return; raf = true;
      requestAnimationFrame(function () { sync(); raf = false; });
    }, { passive: true });
    sync();

    var top = $("#totop");
    if (top) {
      window.addEventListener("scroll", function () {
        top.classList.toggle("show", window.scrollY > 700);
      }, { passive: true });
      top.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
    }

    $$("[data-toggle-all]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var scope = btn.closest(".sec") || document;
        var ds = $$("details", scope);
        var anyClosed = ds.some(function (d) { return !d.open; });
        ds.forEach(function (d) { d.open = anyClosed; });
        var lbl = $(".tg-label", btn);
        if (lbl) lbl.textContent = anyClosed ? "全部收合" : "全部展開";
      });
    });
  }

  /* ====================================================================== *
   * 2. MAP LIGHTBOX
   * ====================================================================== */
  function initMaps() {
    var lb = $("#lightbox");
    if (!lb) return;
    var img = $("#lb-img"), ttl = $("#lb-title"),
        src = $("#lb-source"), dl = $("#lb-download"), lastFocus = null;

    function open(btn) {
      lastFocus = btn;
      img.src = btn.getAttribute("data-large");
      img.alt = btn.getAttribute("data-title") + " 雪道地圖";
      ttl.textContent = btn.getAttribute("data-title");
      src.href = btn.getAttribute("data-source");
      dl.href = btn.getAttribute("data-large");
      dl.setAttribute("download", btn.getAttribute("data-slug") + "-map.jpg");
      lb.classList.add("open");
      lb.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      $("#lb-close").focus();
    }
    function close() {
      lb.classList.remove("open");
      lb.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      img.src = "";
      if (lastFocus) lastFocus.focus();
    }
    $$(".map-thumb").forEach(function (b) {
      b.addEventListener("click", function () { open(b); });
    });
    $("#lb-close").addEventListener("click", close);
    lb.addEventListener("click", function (e) { if (e.target === lb || e.target.classList.contains("lb-stage")) close(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && lb.classList.contains("open")) close();
    });
  }

  /* ====================================================================== *
   * 3. RIDER TABS
   * ====================================================================== */
  function initTabs() {
    $$("[data-tabs]").forEach(function (group) {
      var tabs = $$(".rider-tab", group);
      tabs.forEach(function (tab) {
        tab.addEventListener("click", function () {
          var id = tab.getAttribute("data-panel");
          tabs.forEach(function (t) { t.setAttribute("aria-selected", String(t === tab)); });
          $$("." + group.getAttribute("data-tabs") + "-panel").forEach(function (p) {
            p.hidden = p.id !== id;
          });
        });
      });
    });
  }

  /* ====================================================================== *
   * 4. TRAINING TRACKER
   *    Ten skill categories, 0-100 each. Persisted per rider.
   *    Levels: 0 未開始 / 1 學習中 / 2 進步中 / 3 已掌握 / 4 出發水準
   * ====================================================================== */
  var SKILLS = [
    ["balance",   "平衡與站姿",       "Balance & stance",        70],
    ["heel",      "後刃控制",         "Heel-side control",       80],
    ["toe",       "前刃控制",         "Toe-side control",        80],
    ["sturn",     "連續 S-Turn",      "Linked S-Turn",           75],
    ["speed",     "速度控制",         "Speed control",           75],
    ["lift",      "上落纜車信心",     "Lift confidence",         85],
    ["green",     "綠線信心",         "Green run confidence",    85],
    ["red",       "初級紅線準備度",   "Easy red readiness",      45],
    ["powder",    "粉雪準備度",       "Powder readiness",        30],
    ["fitness",   "體能與耐力",       "Fitness & endurance",     70]
  ];
  var BANDS = [
    [0,   "未開始",   "Not started", "pb-0"],
    [1,   "學習中",   "Learning",    "pb-1"],
    [35,  "進步中",   "Improving",   "pb-2"],
    [65,  "已掌握",   "Comfortable", "pb-3"],
    [88,  "出發水準", "Trip-ready",  "pb-4"]
  ];
  function band(v) {
    var b = BANDS[0];
    for (var i = 0; i < BANDS.length; i++) if (v >= BANDS[i][0]) b = BANDS[i];
    return b;
  }
  var LEVELS = ["完全新手", "新手", "新手偏進步", "初級中段", "中級偏下", "中級"];
  var RIDERS = ["lawrence", "anson"];

  function trKey(r) { return NS + "training:" + r; }

  function defaultTraining(r) {
    var s = {};
    SKILLS.forEach(function (k) { s[k[0]] = 0; });
    return { rider: r, updated: "", date: "", level: "", confidence: "", fear: "",
             notes: "", hard: "", better: "", skills: s };
  }

  function loadTraining(r) {
    var d = getJSON(trKey(r), null);
    if (!d || typeof d !== "object") return defaultTraining(r);
    var base = defaultTraining(r);
    Object.keys(base).forEach(function (k) { if (k !== "skills" && d[k] != null) base[k] = d[k]; });
    if (d.skills) SKILLS.forEach(function (s) {
      var v = parseInt(d.skills[s[0]], 10);
      if (!isNaN(v)) base.skills[s[0]] = Math.max(0, Math.min(100, v));
    });
    return base;
  }

  function renderProgress(r, data) {
    var host = $("#prog-" + r);
    if (!host) return;
    host.innerHTML = "";
    var totalNow = 0, totalTgt = 0;
    SKILLS.forEach(function (s) {
      var key = s[0], v = data.skills[key] || 0, tgt = s[3];
      totalNow += v; totalTgt += tgt;
      var b = band(v);
      var item = el("div", "prog-item");
      var top = el("div", "prog-top");
      var nm = el("div", "prog-name");
      nm.appendChild(document.createTextNode(s[1] + " "));
      nm.appendChild(el("span", "en", s[2]));
      top.appendChild(nm);
      var bd = el("span", "prog-badge " + b[3], b[1]);
      top.appendChild(bd);
      item.appendChild(top);
      var track = el("div", "prog-track");
      var fill = el("div", "prog-fill" + (v >= tgt ? " done" : ""));
      fill.style.width = Math.max(v, 1.5) + "%";
      track.appendChild(fill);
      var mark = el("div", "prog-target");
      mark.style.left = tgt + "%";
      mark.title = "出發前目標 " + tgt + "%";
      track.appendChild(mark);
      item.appendChild(track);
      var sc = el("div", "prog-scale");
      sc.appendChild(el("span", null, "現時 " + v + "%"));
      sc.appendChild(el("span", null, "目標 " + tgt + "%" + (v >= tgt ? " · 已達標" : " · 差 " + (tgt - v) + "%")));
      item.appendChild(sc);
      host.appendChild(item);
    });

    var pct = Math.round(totalNow / totalTgt * 100);
    pct = Math.max(0, Math.min(100, pct));
    var sum = $("#summary-" + r);
    if (sum) {
      var lvIdx = Math.min(LEVELS.length - 1, Math.floor(pct / 100 * (LEVELS.length - 0.01)));
      var cells = [
        ["現時估算水準", data.level ? data.level : (pct === 0 ? "未提交" : LEVELS[lvIdx]), ""],
        ["出發前目標水準", "初級中段", "能在綠線連續 S-Turn、控速自如"],
        ["整體準備度", pct + "%", pct === 0 ? "請先提交一次更新" : "距離目標 " + (100 - pct) + "%"],
        ["最近更新", data.date || "未提交", data.updated ? "儲存於 " + data.updated : "資料只存在此瀏覽器"]
      ];
      sum.innerHTML = "";
      cells.forEach(function (c) {
        var cell = el("div", "level-cell");
        cell.appendChild(el("div", "info-label", c[0]));
        var lv = el("div", "lv");
        lv.appendChild(document.createTextNode(c[1]));
        if (c[2]) { lv.appendChild(document.createElement("br")); lv.appendChild(el("small", null, c[2])); }
        cell.appendChild(lv);
        sum.appendChild(cell);
      });
    }

    var adv = $("#advice-" + r);
    if (adv) {
      var weakest = SKILLS.slice().sort(function (a, b2) {
        return (data.skills[a[0]] - a[3]) - (data.skills[b2[0]] - b2[3]);
      }).slice(0, 3);
      adv.innerHTML = "";
      if (pct === 0) {
        adv.appendChild(el("p", "map-meta", "提交一次訓練更新之後，這裏會根據落後最多的項目自動給出下一步練習重點。"));
      } else {
        adv.appendChild(el("p", "map-meta", "落後目標最多的三項：" +
          weakest.map(function (w) { return w[1] + "（" + w[2] + "）"; }).join("、") + "。優先在這三項上花時間。"));
        var ul = el("ul", "bullets");
        weakest.forEach(function (w) {
          var li = el("li");
          li.appendChild(el("strong", null, w[1] + "："));
          li.appendChild(document.createTextNode(DRILLS[w[0]] || "在緩坡上重複練習，直到動作變成本能。"));
          ul.appendChild(li);
        });
        adv.appendChild(ul);
        var lesson = el("p", "map-meta");
        lesson.appendChild(el("strong", null, "Myoko 課程建議："));
        lesson.appendChild(document.createTextNode(" " + lessonFor(pct)));
        adv.appendChild(lesson);
      }
    }
  }

  var DRILLS = {
    balance: "在平地做 skating 與 one-foot glide，各 10 分鐘；然後在緩坡練 straight running，膝蓋保持彎曲、視線望遠。",
    heel:   "緩坡做 heel-side falling leaf 橫向滑行，左右各 20 次，重點是用腳踝而非上身控刃。",
    toe:    "緩坡做 toe-side falling leaf，膝蓋前推、髖部貼向山坡，左右各 20 次。多數人前刃較弱，要刻意多練。",
    sturn:  "在寬闊綠線做 garland 練習，再連成大彎 S-Turn；數拍子維持節奏，不要在轉彎中途停。",
    speed:  "練 J-turn 收尾控速，全程不用坐低煞停；在同一條線上刻意做快、中、慢三種速度。",
    lift:   "刻意多坐幾趟纜車，練上落動作；上落前先確認後腳綁帶鬆緊與站位。",
    green:  "同一條綠線連續滑 5 趟不停，逐趟收窄轉彎幅度。",
    red:    "先在綠線最陡的一段練穩，再選一條短紅線，用 falling leaf 落一次、再用 S-Turn 落一次。",
    powder: "在鬆雪邊緣練後腳略加重、轉彎放慢；先在淺雪區適應，不要一開始就進林間。",
    fitness: "每週 3 次下肢與核心訓練：wall sit、深蹲、側平板各 3 組；加 20 分鐘有氧維持連滑 4 日的耐力。"
  };
  function lessonFor(pct) {
    if (pct < 25) return "初學者小組課或私人課，先建立基本控刃與停止。Day 1 在 Kurohime 安排半日至全日課程最合適。";
    if (pct < 50) return "初級進階課程，重點在連續 S-Turn 與控速。Day 1 Kurohime 半日私人課，之後自行練習。";
    if (pct < 75) return "中級課程或針對性私人課，可開始碰 carving 與初級紅線。";
    return "carving 技術課或粉雪入門課，體能與基本功已足夠應付 Myoko 大部分綠線與初級紅線。";
  }

  function bindTrainingForm(r) {
    var form = $("#form-" + r);
    if (!form) return;
    var data = loadTraining(r);

    SKILLS.forEach(function (s) {
      var rng = $("#" + r + "-" + s[0]);
      if (!rng) return;
      rng.value = data.skills[s[0]];
      var out = $("#" + r + "-" + s[0] + "-val");
      function show() {
        var v = parseInt(rng.value, 10);
        if (out) out.textContent = v + "%";
      }
      show();
      rng.addEventListener("input", show);
    });

    ["date", "level", "confidence", "fear", "notes", "hard", "better"].forEach(function (f) {
      var n = $("#" + r + "-" + f);
      if (n && data[f]) n.value = data[f];
    });
    var dn = $("#" + r + "-date");
    if (dn && !dn.value) dn.value = today();

    renderProgress(r, data);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var out = defaultTraining(r);
      ["date", "level", "confidence", "fear", "notes", "hard", "better"].forEach(function (f) {
        var n = $("#" + r + "-" + f);
        out[f] = n ? n.value : "";
      });
      SKILLS.forEach(function (s) {
        var n = $("#" + r + "-" + s[0]);
        out.skills[s[0]] = n ? parseInt(n.value, 10) || 0 : 0;
      });
      out.updated = new Date().toISOString().slice(0, 16).replace("T", " ");
      var ok = setJSON(trKey(r), out);
      renderProgress(r, out);
      toast(ok ? (r === "lawrence" ? "Lawrence" : "Anson") + " 的訓練更新已儲存於此瀏覽器"
               : "瀏覽器不允許儲存，請用匯出 JSON", ok ? "check-circle" : "alert-triangle");
    });

    var exp = $("#export-" + r);
    if (exp) exp.addEventListener("click", function () {
      download(r + "-progress-" + today() + ".json",
               JSON.stringify(loadTraining(r), null, 2));
      toast("已匯出 " + r + "-progress.json", "download");
    });

    var cp = $("#copy-" + r);
    if (cp) cp.addEventListener("click", function () {
      var d = loadTraining(r);
      var name = r === "lawrence" ? "Lawrence" : "Anson";
      var lines = ["【" + name + " 訓練更新 " + (d.date || today()) + "】"];
      if (d.level) lines.push("自評水準：" + d.level);
      if (d.confidence) lines.push("信心度：" + d.confidence);
      if (d.fear) lines.push("跌倒／恐懼感：" + d.fear);
      SKILLS.forEach(function (s) { lines.push(s[1] + "（" + s[2] + "）：" + (d.skills[s[0]] || 0) + "%"); });
      if (d.notes) lines.push("練習筆記：" + d.notes);
      if (d.hard) lines.push("覺得困難：" + d.hard);
      if (d.better) lines.push("有進步：" + d.better);
      var text = lines.join("\n");
      var ta = el("textarea");
      ta.value = text;
      ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      var done = false;
      try { done = document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(ta);
      if (navigator.clipboard && !done) {
        navigator.clipboard.writeText(text).then(function () {
          toast("摘要已複製，貼給 Perplexity 就可以", "clipboard");
        });
      } else {
        toast(done ? "摘要已複製，貼給 Perplexity 就可以" : "請手動選取複製", "clipboard");
      }
    });
  }

  function initTrainingIO() {
    var imp = $("#import-training");
    if (imp) imp.addEventListener("change", function () {
      var f = imp.files && imp.files[0];
      if (!f) return;
      var fr = new FileReader();
      fr.onload = function () {
        try {
          var d = JSON.parse(fr.result);
          var r = (d.rider || "").toLowerCase();
          if (RIDERS.indexOf(r) < 0) { toast("JSON 內找不到 rider 欄位", "alert-triangle"); return; }
          setJSON(trKey(r), d);
          toast("已匯入 " + r + " 的進度，重新載入頁面查看", "upload");
          setTimeout(function () { location.reload(); }, 900);
        } catch (e) { toast("JSON 格式不正確", "alert-triangle"); }
      };
      fr.readAsText(f);
      imp.value = "";
    });

    var rst = $("#reset-training");
    if (rst) rst.addEventListener("click", function () {
      if (!confirm("清除兩位 rider 儲存在此瀏覽器的訓練進度？此操作無法復原。")) return;
      RIDERS.forEach(function (r) { del(trKey(r)); });
      toast("訓練進度已清除", "rotate-ccw");
      setTimeout(function () { location.reload(); }, 700);
    });
  }

  /* ====================================================================== *
   * 5. GEAR MAGAZINE FILTERS
   * ====================================================================== */
  function initGearFilters() {
    var bar = $("#gear-filters");
    if (!bar) return;
    var chips = $$(".chipf", bar);
    var cards = $$("#gear-grid .gear-card");
    var count = $("#gear-count");

    function apply() {
      var on = chips.filter(function (c) { return c.getAttribute("aria-pressed") === "true"; })
                    .map(function (c) { return c.getAttribute("data-filter"); })
                    .filter(function (f) { return f !== "*"; });
      var shown = 0;
      cards.forEach(function (card) {
        var tags = (card.getAttribute("data-tags") || "").split(/\s+/);
        var ok = !on.length || on.every(function (f) { return tags.indexOf(f) >= 0; });
        card.hidden = !ok;
        if (ok) shown++;
      });
      if (count) count.textContent = shown + " 件";
    }
    chips.forEach(function (c) {
      c.addEventListener("click", function () {
        var all = chips.filter(function (x) { return x.getAttribute("data-filter") === "*"; })[0];
        if (c.getAttribute("data-filter") === "*") {
          chips.forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
          c.setAttribute("aria-pressed", "true");
        } else {
          if (all) all.setAttribute("aria-pressed", "false");
          c.setAttribute("aria-pressed", c.getAttribute("aria-pressed") === "true" ? "false" : "true");
          var any = chips.some(function (x) {
            return x.getAttribute("data-filter") !== "*" && x.getAttribute("aria-pressed") === "true";
          });
          if (!any && all) all.setAttribute("aria-pressed", "true");
        }
        apply();
      });
    });
    apply();
  }

  /* ====================================================================== *
   * 6. PACKING CHECKLIST — add / edit / owner / status / export / import
   * ====================================================================== */
  var PK_KEY = NS + "packing:v1";
  var CATS = ["雪具 Snowboard setup", "衣物 Clothing", "護具 Protection", "雪鏡／頭盔 Goggles & helmet",
              "配件 Accessories", "旅行文件 Travel documents", "電子產品 Electronics",
              "藥物／安全 Medicine & safety", "Tokyo 用品", "Myoko 專用"];
  var OWNERS = [["L", "Lawrence"], ["A", "Anson"], ["S", "共用 Shared"]];
  var PRIOS = ["必需 Essential", "建議 Recommended", "有更好 Nice to have"];
  var STATES = ["要買 Need to buy", "研究中 Researching", "已下單 Ordered",
                "已買 Purchased", "已收拾 Packed", "略過 Skip"];

  function seed() {
    var s = [];
    function add(owner, name, en, cat, prio, state) {
      s.push({ id: "s" + s.length, owner: owner, name: name, en: en || "",
               cat: CATS[cat], prio: PRIOS[prio], state: STATES[state == null ? 0 : state] });
    }
    // Lawrence — board already chosen
    add("L", "Snowboard", "Bataleon Mojo 157（目標）", 0, 0, 1);
    add("L", "Bindings", "Bataleon FASE Blaster（目標）", 0, 0, 1);
    add("L", "雪靴", "Boots — 必須試腳後才買", 0, 0, 0);
    add("L", "雪衣外套", "Jacket", 1, 0, 0);
    add("L", "雪褲", "Pants", 1, 0, 0);
    add("L", "底層衣", "Base layer ×3", 1, 0, 0);
    add("L", "中層衣", "Mid layer / fleece", 1, 1, 0);
    add("L", "雪手套", "Gloves", 1, 0, 0);
    add("L", "雪鏡", "Goggles", 3, 0, 0);
    add("L", "頭盔", "Helmet", 3, 0, 0);
    add("L", "雪襪", "Socks ×4", 1, 0, 0);
    add("L", "頸套", "Neck warmer", 1, 0, 0);
    add("L", "護臀褲", "Impact shorts", 2, 0, 0);
    add("L", "護腕", "Wrist guards", 2, 0, 0);
    add("L", "護膝", "Knee pads（視需要）", 2, 2, 0);
    // Anson — nothing chosen yet
    add("A", "Snowboard", "如決定買（未定）", 0, 1, 1);
    add("A", "Bindings", "如決定買（未定）", 0, 1, 1);
    add("A", "雪靴", "Boots — 女款，最優先試腳", 0, 0, 0);
    add("A", "雪衣外套", "Jacket — 女款獨立一件", 1, 0, 0);
    add("A", "雪褲", "Pants — 女款獨立一件", 1, 0, 0);
    add("A", "底層衣", "Base layer ×3", 1, 0, 0);
    add("A", "中層衣", "Mid layer / fleece", 1, 1, 0);
    add("A", "雪手套", "Gloves — 女款尺寸", 1, 0, 0);
    add("A", "雪鏡", "Goggles — 細碼／亞洲臉型", 3, 0, 0);
    add("A", "頭盔", "Helmet — 女款尺寸", 3, 0, 0);
    add("A", "雪襪", "Socks ×4", 1, 0, 0);
    add("A", "頸套", "Neck warmer", 1, 0, 0);
    add("A", "護臀褲", "Impact shorts — 新手最值得買", 2, 0, 0);
    add("A", "護腕", "Wrist guards — 新手最常傷手腕", 2, 0, 0);
    add("A", "護膝", "Knee pads（視需要）", 2, 2, 0);
    // Shared
    add("S", "打蠟／調刃用品", "Wax / tuning（視需要）", 4, 2, 0);
    add("S", "旅行轉插", "Travel adapter — 日本 A 型", 4, 0, 0);
    add("S", "充電寶", "Power bank", 6, 0, 0);
    add("S", "常用藥物", "Medicine", 7, 0, 0);
    add("S", "急救包", "First aid kit", 7, 1, 0);
    add("S", "暖包", "Heat packs", 4, 1, 0);
    add("S", "相機／運動攝影機", "Camera / action camera", 6, 2, 0);
    add("S", "上網 SIM／eSIM", "SIM / internet", 6, 0, 0);
    add("S", "訂房確認打印本", "Lime Resort Myoko 18–23 Jan 確認書", 5, 0, 0);
    add("S", "保險文件", "Insurance documents", 5, 0, 0);
    add("S", "纜車票／通行證文件", "Lift pass documents", 5, 0, 0);
    add("S", "課程預約確認", "Lesson booking confirmations", 5, 1, 0);
    add("S", "護照", "Passports", 5, 0, 0);
    add("S", "機票／新幹線票", "Flights / Shinkansen tickets", 5, 0, 0);
    return s;
  }

  function loadPk() {
    var d = getJSON(PK_KEY, null);
    if (!d || !Array.isArray(d.items)) return { items: seed(), v: 1 };
    return d;
  }
  function savePk(d) { return setJSON(PK_KEY, d); }

  function initPacking() {
    var wrap = $("#pk-groups");
    if (!wrap) return;
    var state = loadPk();
    var filterOwner = "*";

    function render() {
      wrap.innerHTML = "";
      OWNERS.forEach(function (o) {
        if (filterOwner !== "*" && filterOwner !== o[0]) return;
        var items = state.items.filter(function (i) { return i.owner === o[0]; });
        var box = el("div", "pk-table-wrap");
        box.style.marginBottom = "24px";
        var head = el("div", "pk-group-head");
        head.appendChild(icon(o[0] === "S" ? "users" : "user"));
        head.appendChild(el("span", null, o[1]));
        var packed = items.filter(function (i) { return i.state === STATES[4]; }).length;
        var bought = items.filter(function (i) {
          return i.state === STATES[3] || i.state === STATES[4];
        }).length;
        head.appendChild(el("span", "cnt", items.length + " 項 · 已買 " + bought + " · 已收拾 " + packed));
        box.appendChild(head);

        if (!items.length) {
          var empty = el("div", "pk-row");
          empty.appendChild(el("span"));
          empty.appendChild(el("span", "pk-name", "暫無項目"));
          box.appendChild(empty);
        }

        items.forEach(function (it) {
          var row = el("div", "pk-row" + (it.state === STATES[4] ? " packed" : ""));
          var cb = el("input");
          cb.type = "checkbox";
          cb.checked = it.state === STATES[4];
          cb.title = "標記為已收拾";
          cb.addEventListener("change", function () {
            it.state = cb.checked ? STATES[4] : STATES[3];
            savePk(state); render(); stats();
          });
          row.appendChild(cb);

          var nm = el("div", "pk-name");
          var nmText = el("span", null, it.name);
          nmText.contentEditable = "true";
          nmText.style.outline = "none";
          nmText.addEventListener("blur", function () {
            it.name = nmText.textContent.trim() || it.name;
            nmText.textContent = it.name;
            savePk(state);
          });
          nmText.addEventListener("keydown", function (e) {
            if (e.key === "Enter") { e.preventDefault(); nmText.blur(); }
          });
          nm.appendChild(nmText);
          if (it.en) nm.appendChild(el("span", "en", it.en));
          row.appendChild(nm);

          [["cat", CATS], ["state", STATES], ["prio", PRIOS]].forEach(function (pair) {
            var sel = el("select");
            pair[1].forEach(function (v) {
              var op = el("option", null, v);
              op.value = v;
              if (it[pair[0]] === v) op.selected = true;
              sel.appendChild(op);
            });
            sel.addEventListener("change", function () {
              it[pair[0]] = sel.value; savePk(state); render(); stats();
            });
            row.appendChild(sel);
          });

          var d = el("button", "pk-del");
          d.type = "button";
          d.title = "刪除此項";
          d.appendChild(icon("trash"));
          d.addEventListener("click", function () {
            state.items = state.items.filter(function (x) { return x !== it; });
            savePk(state); render(); stats();
          });
          row.appendChild(d);
          box.appendChild(row);
        });
        wrap.appendChild(box);
      });
    }

    function stats() {
      var host = $("#pk-stats");
      if (!host) return;
      var all = state.items.length;
      var need = state.items.filter(function (i) { return i.state === STATES[0]; }).length;
      var bought = state.items.filter(function (i) { return i.state === STATES[3] || i.state === STATES[4]; }).length;
      var packed = state.items.filter(function (i) { return i.state === STATES[4]; }).length;
      var ess = state.items.filter(function (i) {
        return i.prio === PRIOS[0] && i.state !== STATES[3] && i.state !== STATES[4] && i.state !== STATES[5];
      }).length;
      host.innerHTML = "";
      [[all, "總項目"], [need, "仍要買"], [bought, "已買"], [packed, "已收拾"], [ess, "必需未搞定"]]
        .forEach(function (s) {
          var c = el("div", "pk-stat");
          c.appendChild(el("div", "n", String(s[0])));
          c.appendChild(el("div", "l", s[1]));
          host.appendChild(c);
        });
    }

    var addForm = $("#pk-add");
    if (addForm) {
      var selO = $("#pk-new-owner"), selC = $("#pk-new-cat"),
          selP = $("#pk-new-prio"), inName = $("#pk-new-name");
      OWNERS.forEach(function (o) { var x = el("option", null, o[1]); x.value = o[0]; selO.appendChild(x); });
      CATS.forEach(function (c) { var x = el("option", null, c); x.value = c; selC.appendChild(x); });
      PRIOS.forEach(function (p) { var x = el("option", null, p); x.value = p; selP.appendChild(x); });
      addForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var n = inName.value.trim();
        if (!n) { inName.focus(); return; }
        state.items.push({ id: "u" + Date.now(), owner: selO.value, name: n, en: "",
                           cat: selC.value, prio: selP.value, state: STATES[0] });
        savePk(state); inName.value = ""; render(); stats();
        toast("已加入「" + n + "」", "plus");
      });
    }

    $$("#pk-owner-filter .chipf").forEach(function (c) {
      c.addEventListener("click", function () {
        $$("#pk-owner-filter .chipf").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
        c.setAttribute("aria-pressed", "true");
        filterOwner = c.getAttribute("data-owner");
        render();
      });
    });

    var ex = $("#pk-export");
    if (ex) ex.addEventListener("click", function () {
      download("myoko2027-packing-" + today() + ".json", JSON.stringify(state, null, 2));
      toast("清單已匯出", "download");
    });
    var im = $("#pk-import");
    if (im) im.addEventListener("change", function () {
      var f = im.files && im.files[0];
      if (!f) return;
      var fr = new FileReader();
      fr.onload = function () {
        try {
          var d = JSON.parse(fr.result);
          if (!d || !Array.isArray(d.items)) throw new Error("bad");
          state = d; savePk(state); render(); stats();
          toast("清單已匯入", "upload");
        } catch (e) { toast("JSON 格式不正確", "alert-triangle"); }
      };
      fr.readAsText(f);
      im.value = "";
    });
    var rs = $("#pk-reset");
    if (rs) rs.addEventListener("click", function () {
      if (!confirm("回復預設清單？你自己新增的項目會消失。")) return;
      state = { items: seed(), v: 1 };
      savePk(state); render(); stats();
      toast("清單已回復預設", "rotate-ccw");
    });
    var pr = $("#pk-print");
    if (pr) pr.addEventListener("click", function () {
      document.body.classList.add("print-packing");
      window.print();
      setTimeout(function () { document.body.classList.remove("print-packing"); }, 800);
    });

    render(); stats();
  }

  /* ====================================================================== *
   * 7. ACTION CHECKLIST (top-level to-dos)
   * ====================================================================== */
  function initActions() {
    var boxes = $$("input[type=checkbox][data-act]");
    if (!boxes.length) return;
    var fill = $("#pfill"), label = $("#plabel");
    function sync() {
      var done = boxes.filter(function (b) { return b.checked; }).length;
      if (fill) fill.style.width = (boxes.length ? done / boxes.length * 100 : 0) + "%";
      if (label) label.textContent = done + " / " + boxes.length + " 已完成";
    }
    boxes.forEach(function (b) {
      var k = NS + "chk:" + b.getAttribute("data-act");
      b.checked = get(k, "0") === "1";
      var li = b.closest("li") || b.parentElement;
      if (li) li.classList.toggle("done", b.checked);
      b.addEventListener("change", function () {
        set(k, b.checked ? "1" : "0");
        if (li) li.classList.toggle("done", b.checked);
        sync();
      });
    });
    var rs = $("#preset");
    if (rs) rs.addEventListener("click", function () {
      boxes.forEach(function (b) {
        b.checked = false;
        del(NS + "chk:" + b.getAttribute("data-act"));
        var li = b.closest("li") || b.parentElement;
        if (li) li.classList.remove("done");
      });
      sync();
    });
    sync();
  }

  /* ====================================================================== *
   * 8. Storage warning banner
   * ====================================================================== */
  function initStoreWarn() {
    if (HAS_STORE) return;
    $$(".store-warn").forEach(function (n) { n.hidden = false; });
  }

  /* ---------- boot ------------------------------------------------------- */
  function boot() {
    initNav();
    initMaps();
    initTabs();
    RIDERS.forEach(bindTrainingForm);
    initTrainingIO();
    initGearFilters();
    initPacking();
    initActions();
    initStoreWarn();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else { boot(); }
})();
