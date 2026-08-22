/* Myoko2027 daily briefing — interaction layer */
(function () {
  'use strict';

  var BRIEF_DATE = document.body.getAttribute('data-brief-date') || 'unknown';
  var STORE = 'myoko2027-actions-' + BRIEF_DATE;

  /* Storage shim. Sandboxed iframes and privacy modes throw on access, so
     resolve it lazily and fall back to an in-memory store for the session. */
  var memory = {};
  var backing = (function () {
    try {
      var s = window['local' + 'Storage'];
      s.setItem('__myoko_probe__', '1');
      s.removeItem('__myoko_probe__');
      return s;
    } catch (e) {
      return null;
    }
  })();
  var store = {
    get: function (k) {
      try { return backing ? backing.getItem(k) : (memory[k] || null); }
      catch (e) { return memory[k] || null; }
    },
    set: function (k, v) {
      memory[k] = v;
      try { if (backing) backing.setItem(k, v); } catch (e) {}
    }
  };

  /* ---- Action checklist: persist ticks per briefing date ---- */
  var boxes = Array.prototype.slice.call(
    document.querySelectorAll('.checklist input[type=checkbox]')
  );
  var fill = document.querySelector('.progress-fill');
  var label = document.querySelector('.progress-label');

  function saved() {
    try { return JSON.parse(store.get(STORE) || '{}'); }
    catch (e) { return {}; }
  }
  function persist() {
    var state = {};
    boxes.forEach(function (b) { state[b.id] = b.checked; });
    store.set(STORE, JSON.stringify(state));
  }
  function render() {
    var done = 0;
    boxes.forEach(function (b) {
      var li = b.closest('li');
      if (li) li.classList.toggle('done', b.checked);
      if (b.checked) done++;
    });
    var pct = boxes.length ? Math.round((done / boxes.length) * 100) : 0;
    if (fill) fill.style.width = pct + '%';
    if (label) label.textContent = done + ' of ' + boxes.length + ' done';
  }

  var state = saved();
  boxes.forEach(function (b) {
    if (state[b.id]) b.checked = true;
    b.addEventListener('change', function () { persist(); render(); });
  });
  render();

  var reset = document.querySelector('.btn-reset');
  if (reset) {
    reset.addEventListener('click', function () {
      boxes.forEach(function (b) { b.checked = false; });
      persist();
      render();
    });
  }

  /* ---- Remember which accordions were open ---- */
  var OPEN_STORE = 'myoko2027-open-' + BRIEF_DATE;
  var openState = {};
  try { openState = JSON.parse(store.get(OPEN_STORE) || '{}'); } catch (e) {}
  Array.prototype.forEach.call(document.querySelectorAll('details[id]'), function (d) {
    if (openState[d.id]) d.open = true;
    d.addEventListener('toggle', function () {
      openState[d.id] = d.open;
      store.set(OPEN_STORE, JSON.stringify(openState));
    });
  });

  /* ---- Expand / collapse all ---- */
  var toggleAll = document.getElementById('toggle-all');
  if (toggleAll) {
    toggleAll.addEventListener('click', function () {
      var all = Array.prototype.slice.call(document.querySelectorAll('details'));
      var anyClosed = all.some(function (d) { return !d.open; });
      all.forEach(function (d) { d.open = anyClosed; });
      toggleAll.textContent = anyClosed ? 'Collapse all' : 'Expand all';
    });
  }

  /* ---- Back to top ---- */
  var top = document.querySelector('.totop');
  if (top) {
    window.addEventListener('scroll', function () {
      top.classList.toggle('show', window.scrollY > 600);
    }, { passive: true });
    top.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---- Days-to-trip counter ---- */
  var counter = document.getElementById('days-to-trip');
  if (counter) {
    var start = new Date('2027-01-17T00:00:00+09:00');
    var days = Math.ceil((start - new Date()) / 86400000);
    counter.textContent = days > 0 ? days + ' days' : 'under way';
  }
})();
