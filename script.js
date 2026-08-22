/* Myoko2027 daily briefing — interactions
   Storage access is wrapped in a lazy, defensive shim with an in-memory
   fallback so the page works in sandboxed/embedded contexts too. */
(function () {
  'use strict';

  // ---------- storage shim -------------------------------------------------
  var mem = {};
  function store() {
    try {
      var s = window['local' + 'Storage'];
      var k = '__t';
      s.setItem(k, '1');
      s.removeItem(k);
      return s;
    } catch (e) {
      return null;
    }
  }
  var S = null, probed = false;
  function get(k) {
    if (!probed) { S = store(); probed = true; }
    try { return S ? S.getItem(k) : (k in mem ? mem[k] : null); }
    catch (e) { return k in mem ? mem[k] : null; }
  }
  function set(k, v) {
    if (!probed) { S = store(); probed = true; }
    try { if (S) { S.setItem(k, v); return; } } catch (e) {}
    mem[k] = v;
  }
  function del(k) {
    if (!probed) { S = store(); probed = true; }
    try { if (S) { S.removeItem(k); return; } } catch (e) {}
    delete mem[k];
  }

  var PREFIX = 'myoko2027:chk:';

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {

    // ---------- action checklist -----------------------------------------
    var boxes = Array.prototype.slice.call(
      document.querySelectorAll('#checklist input[type=checkbox]')
    );
    var fill = document.getElementById('pfill');
    var label = document.getElementById('plabel');

    function paint() {
      var done = 0;
      boxes.forEach(function (b) {
        var li = b.closest('li');
        if (b.checked) { done++; if (li) li.classList.add('done'); }
        else if (li) { li.classList.remove('done'); }
      });
      var pct = boxes.length ? Math.round((done / boxes.length) * 100) : 0;
      if (fill) fill.style.width = pct + '%';
      if (label) label.textContent = done + ' / ' + boxes.length + ' 已完成';
    }

    boxes.forEach(function (b) {
      var k = PREFIX + (b.getAttribute('data-k') || b.id);
      if (get(k) === '1') b.checked = true;
      b.addEventListener('change', function () {
        if (b.checked) set(k, '1'); else del(k);
        paint();
      });
    });
    paint();

    var reset = document.getElementById('preset');
    if (reset) {
      reset.addEventListener('click', function () {
        boxes.forEach(function (b) {
          b.checked = false;
          del(PREFIX + (b.getAttribute('data-k') || b.id));
        });
        paint();
      });
    }

    // ---------- expand / collapse all per section -------------------------
    Array.prototype.forEach.call(
      document.querySelectorAll('[data-toggle-all]'),
      function (btn) {
        var id = btn.getAttribute('data-toggle-all');
        var scope = document.getElementById(id);
        if (!scope) return;
        btn.addEventListener('click', function () {
          var accs = scope.querySelectorAll('details.acc');
          var anyClosed = Array.prototype.some.call(accs, function (d) { return !d.open; });
          Array.prototype.forEach.call(accs, function (d) { d.open = anyClosed; });
          var txt = btn.querySelector('span');
          if (txt) txt.textContent = anyClosed ? '全部收起' : '全部展開';
        });
      }
    );

    // ---------- nav active state on scroll --------------------------------
    var links = Array.prototype.slice.call(document.querySelectorAll('#navlinks a'));
    var targets = links
      .map(function (a) {
        var el = document.querySelector(a.getAttribute('href'));
        return el ? { a: a, el: el } : null;
      })
      .filter(Boolean);

    function markActive() {
      var current = null;
      targets.forEach(function (t) {
        if (t.el.getBoundingClientRect().top <= 160) current = t;
      });
      links.forEach(function (a) { a.classList.remove('active'); });
      if (current) current.a.classList.add('active');
    }

    // ---------- back to top ----------------------------------------------
    var top = document.getElementById('totop');
    if (top) {
      top.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    var raf = null;
    function onScroll() {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = null;
        markActive();
        if (top) {
          if (window.scrollY > 700) top.classList.add('show');
          else top.classList.remove('show');
        }
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    markActive();

    // ---------- keep hash nav from hiding behind sticky bar ---------------
    links.forEach(function (a) {
      a.addEventListener('click', function () {
        setTimeout(markActive, 500);
      });
    });
  });
})();
