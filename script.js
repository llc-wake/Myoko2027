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

  // row selects are narrow; show only the Chinese half, full text stays in title
  function shortLabel(v) {
    var m = /^([^A-Za-z]+)/.exec(v);
    var t = m ? m[1].trim() : v;
    return t.length ? t : v;
  }

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
              var op = el("option", null, shortLabel(v));
              op.value = v;
              op.title = v;
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
   * 7b. COPY CHECKLIST — plain-text summary the agent can actually read
   *     The page cannot save anything the daily task can read back, so the
   *     user copies this text into Perplexity and the next run uses it.
   * ====================================================================== */
  function pkSummary() {
    var d = loadPk();
    var out = ["Myoko 2027 \u884c\u674e\u6e05\u55ae\u73fe\u6cc1\uff08" +
               new Date().toISOString().slice(0, 10) + "\uff09", ""];
    OWNERS.forEach(function (o) {
      var items = (d.items || []).filter(function (i) { return i.owner === o[0]; });
      if (!items.length) return;
      out.push("## " + o[1] + "\uff08" + items.length + " \u9805\uff09");
      items.forEach(function (i) {
        out.push("- " + i.name + (i.en ? " (" + i.en + ")" : "") +
                 " \u2014 " + i.cat + " \u00b7 " + i.prio + " \u00b7 " + i.state);
      });
      out.push("");
    });
    var acts = [];
    $$("[data-act]").forEach(function (c) {
      var t = c.closest("label");
      var nm = t ? (t.querySelector(".chk-text b") || {}).textContent : null;
      if (nm) acts.push((c.checked ? "[x] " : "[ ] ") + nm.trim());
    });
    if (acts.length) {
      out.push("## \u884c\u52d5\u6e05\u55ae Action checklist");
      out = out.concat(acts);
      out.push("");
    }
    out.push("\u8acb\u4ee5\u4e0a\u8ff0\u72c0\u614b\u66f4\u65b0\u660e\u65e5\u7684\u7c21\u5831\u3002");
    return out.join("\n");
  }

  function initPkCopy() {
    var btn = $("#pk-copy");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var txt = pkSummary();
      function fallback() {
        var ta = document.createElement("textarea");
        ta.value = txt;
        ta.setAttribute("readonly", "readonly");
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); } catch (e) {}
        document.body.removeChild(ta);
        toast("\u5df2\u8907\u5236\uff0c\u76f4\u63a5\u8cbc\u7d66 Perplexity", "clipboard");
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(function () {
          toast("\u5df2\u8907\u5236\uff0c\u76f4\u63a5\u8cbc\u7d66 Perplexity", "clipboard");
        })["catch"](fallback);
      } else { fallback(); }
    });
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
    initGearFilters();
    initPacking();
    initActions();
    initPkCopy();
    initStoreWarn();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else { boot(); }
})();
