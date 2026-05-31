/**
 * app.js
 * Main application logic for the Weekend Spin Wheel.
 * State is held in-memory. No persistence between page loads.
 * Depends on: data.js, storage.js
 */

import { CATEGORIES, CONFIG } from './data.js';
import { exportJS } from './storage.js';

// ── In-memory state ───────────────────────────────────────
// Deep-clone defaults so edits don't mutate the imported constants
let DATA       = JSON.parse(JSON.stringify(CATEGORIES));
const CFG      = JSON.parse(JSON.stringify(CONFIG));

let currentCat = null;
const spinAngles = { main: 0, yesno: 0, splurge: 0 };
const spinnings  = { main: false, yesno: false, splurge: false };
const DPR        = window.devicePixelRatio || 1;
const canvases   = {};

// ── Bootstrap ─────────────────────────────────────────────
export function init() {
  initCanvases();
  rebuildCatBar();
  drawPlaceholder(canvases.main, 'Select a category');
  wireEvents();
}

// ── Canvas ────────────────────────────────────────────────
function getLogicalSizes() {
  const w = document.body.clientWidth || window.innerWidth;
  return { main: Math.min(380, w - 32), small: Math.min(200, w - 32) };
}

function setupCanvas(id, logical) {
  const c = document.getElementById(id);
  if (!c) return null;
  c.width  = logical * DPR;
  c.height = logical * DPR;
  c.style.width  = logical + 'px';
  c.style.height = logical + 'px';
  const ctx = c.getContext('2d');
  ctx.scale(DPR, DPR);
  return { c, ctx, logical };
}

function initCanvases() {
  const { main, small } = getLogicalSizes();
  canvases.main    = setupCanvas('wheelMain',    main);
  canvases.yesno   = setupCanvas('wheelYesNo',   small);
  canvases.splurge = setupCanvas('wheelSplurge', small);
}

// ── Drawing ───────────────────────────────────────────────
function resolveWeights(items) {
  const total = items.reduce((s, i) => s + i.weight, 0) || 1;
  return items.map(i => ({ ...i, pct: i.weight / total }));
}

function drawWheel(cv, items, angle, palette) {
  if (!cv) return;
  const { ctx, logical: L } = cv;
  const cx = L / 2, cy = L / 2, r = cx - 4;
  ctx.clearRect(0, 0, L, L);
  const resolved = resolveWeights(items);
  let start = angle;

  resolved.forEach((item, i) => {
    const sweep = item.pct * 2 * Math.PI;
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, start + sweep);
    ctx.closePath();
    ctx.fillStyle = (palette || CFG.palette)[i % (palette || CFG.palette).length];
    ctx.fill();
    ctx.strokeStyle = '#1a1a2e'; ctx.lineWidth = 2; ctx.stroke();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(start + sweep / 2);
    const arcLen   = sweep * r;
    const fontSize = Math.max(9, Math.min(13, Math.floor(arcLen / 18)));
    ctx.font        = `bold ${fontSize}px Segoe UI`;
    ctx.textAlign   = 'right';
    ctx.fillStyle   = '#fff';
    ctx.shadowColor = '#0008';
    ctx.shadowBlur  = 4;

    const maxWidth = r - 20;
    const maxLineH = sweep * (r * 0.6);
    const lineH    = fontSize + 2;
    const words    = item.label.split(' ');
    let lines = [], cur = '';
    words.forEach(w => {
      const test = cur ? `${cur} ${w}` : w;
      if (ctx.measureText(test).width <= maxWidth) cur = test;
      else { if (cur) lines.push(cur); cur = w; }
    });
    if (cur) lines.push(cur);
    const maxLines = Math.max(1, Math.floor(maxLineH / lineH));
    if (lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
      lines[maxLines - 1] = lines[maxLines - 1].replace(/\s?\S+$/, '…');
    }
    const totalH = lines.length * lineH;
    const startY = -totalH / 2 + fontSize * 0.8;
    lines.forEach((ln, li) => ctx.fillText(ln, r - 10, startY + li * lineH));
    ctx.restore();
    start += sweep;
  });

  ctx.beginPath(); ctx.arc(cx, cy, L < 250 ? 12 : 18, 0, 2 * Math.PI);
  ctx.fillStyle   = '#1a1a2e'; ctx.fill();
  ctx.strokeStyle = '#e0aaff'; ctx.lineWidth = 3; ctx.stroke();
}

function drawPlaceholder(cv, msg) {
  if (!cv) return;
  const { ctx, logical: L } = cv;
  ctx.clearRect(0, 0, L, L);
  ctx.beginPath(); ctx.arc(L / 2, L / 2, L / 2 - 4, 0, 2 * Math.PI);
  ctx.fillStyle = '#2a2a4a'; ctx.fill();
  ctx.fillStyle = '#555';
  ctx.font      = `${L < 250 ? 12 : 16}px Segoe UI`;
  ctx.textAlign = 'center';
  ctx.fillText(msg || 'Select a category', L / 2, L / 2);
}

// ── Spin ──────────────────────────────────────────────────
function doSpin(key, cv, items, palette, onDone) {
  if (spinnings[key] || !cv) return;
  spinnings[key] = true;
  const extra  = (5 + Math.floor(Math.random() * 5)) * 2 * Math.PI;
  const rand   = Math.random() * 2 * Math.PI;
  const target = spinAngles[key] + extra + rand;
  const dur    = 4000 + Math.random() * 1500;
  const t0 = performance.now(), a0 = spinAngles[key];
  const ease = t => 1 - Math.pow(1 - t, 4);

  function frame(now) {
    const t = Math.min((now - t0) / dur, 1);
    spinAngles[key] = a0 + (target - a0) * ease(t);
    drawWheel(cv, items, spinAngles[key], palette);
    if (t < 1) { requestAnimationFrame(frame); }
    else {
      spinAngles[key] = target % (2 * Math.PI);
      drawWheel(cv, items, spinAngles[key], palette);
      spinnings[key] = false;
      onDone(pickWinner(items, spinAngles[key]));
    }
  }
  requestAnimationFrame(frame);
}

function pickWinner(items, angle) {
  const resolved = resolveWeights(items);
  let norm = ((-Math.PI / 2 - angle) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
  let acc = 0;
  for (let i = 0; i < resolved.length; i++) {
    acc += resolved[i].pct * 2 * Math.PI;
    if (norm < acc) return resolved[i];
  }
  return resolved[resolved.length - 1];
}

// ── Category ──────────────────────────────────────────────
function selectCategory(cat) {
  if (!cat || !DATA[cat]) return;
  currentCat = cat;
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.toggle('active', b.dataset.cat === cat));
  const dd = el('catDropdown');
  if (dd.value !== cat) dd.value = cat;

  const isSplurge = cat === CFG.splurgeCategoryName;
  el('singleWheelLayout').style.display = isSplurge ? 'none' : 'flex';
  el('dualWheelLayout').style.display   = isSplurge ? 'flex' : 'none';

  if (isSplurge) {
    spinAngles.yesno = 0; spinAngles.splurge = 0;
    el('resultYesNo').textContent   = '';
    el('resultSplurge').textContent = '';
    el('hintYesNo').textContent     = '';
    el('spinBtnSplurge').disabled   = true;
    const yesNoItems = [
      { label: 'Yes', weight: CFG.splurgeYesWeight },
      { label: 'No',  weight: CFG.splurgeNoWeight  }
    ];
    drawWheel(canvases.yesno,   yesNoItems,                0, CFG.splurgePalette);
    drawWheel(canvases.splurge, DATA[CFG.splurgeCategoryName], 0, CFG.palette);
  } else {
    spinAngles.main = 0;
    el('resultMain').textContent = '';
    el('spinBtnMain').disabled   = false;
    drawWheel(canvases.main, DATA[cat], 0, CFG.palette);
  }
}

function rebuildCatBar() {
  const bar = el('catBar');
  const dd  = el('catDropdown');
  bar.innerHTML = '';
  dd.innerHTML  = '<option value="" disabled>Select a category…</option>';

  Object.keys(DATA).forEach(cat => {
    const btn = document.createElement('button');
    btn.className   = 'cat-btn' + (cat === currentCat ? ' active' : '');
    btn.dataset.cat = cat;
    btn.textContent = cat;
    btn.addEventListener('click', () => selectCategory(cat));
    bar.appendChild(btn);

    const opt = document.createElement('option');
    opt.value = cat; opt.textContent = cat;
    if (cat === currentCat) opt.selected = true;
    dd.appendChild(opt);
  });

  if (currentCat && DATA[currentCat]) selectCategory(currentCat);
  else {
    el('singleWheelLayout').style.display = 'flex';
    el('dualWheelLayout').style.display   = 'none';
    el('spinBtnMain').disabled = true;
    drawPlaceholder(canvases.main, 'Select a category');
  }
}

// ── View switching ────────────────────────────────────────
function showView(v) {
  el('wheelView').classList.toggle('show', v === 'wheel');
  el('editView').classList.toggle('show',  v === 'edit');
  el('tabWheel').classList.toggle('active', v === 'wheel');
  el('tabEdit').classList.toggle('active',  v === 'edit');
  if (v === 'edit')  loadEditorSelect();
  if (v === 'wheel') rebuildCatBar();
}

// ── Editor ────────────────────────────────────────────────
function loadEditorSelect() {
  const sel  = el('catSelect');
  const prev = sel.value;
  sel.innerHTML = '';
  Object.keys(DATA).forEach(cat => {
    const o = document.createElement('option');
    o.value = cat; o.textContent = cat; sel.appendChild(o);
  });
  if (prev && DATA[prev]) sel.value = prev;
  loadEditor();
}

function loadEditor() {
  const cat  = el('catSelect').value;
  const list = el('itemsList');
  list.innerHTML = '';
  if (!cat || !DATA[cat]) return;

  DATA[cat].forEach((item, idx) => {
    const row = document.createElement('div');
    row.className = 'item-row';

    const ni = document.createElement('input');
    ni.type = 'text'; ni.value = item.label;
    ni.addEventListener('change', e => { DATA[cat][idx].label = e.target.value; });

    const ww = document.createElement('div');
    ww.className = 'weight-wrap';
    ww.appendChild(document.createTextNode('Wt: '));
    const wi = document.createElement('input');
    wi.type = 'number'; wi.min = '0.1'; wi.step = '0.1'; wi.value = item.weight;
    wi.addEventListener('change', e => { DATA[cat][idx].weight = parseFloat(e.target.value) || 1; });
    ww.appendChild(wi);

    const del = document.createElement('button');
    del.className   = 'del-btn';
    del.textContent = '✕';
    del.addEventListener('click', () => { DATA[cat].splice(idx, 1); loadEditor(); });

    row.appendChild(ni); row.appendChild(ww); row.appendChild(del);
    list.appendChild(row);
  });
}

function addItem() {
  const cat    = el('catSelect').value;
  const name   = el('newItemName').value.trim();
  const weight = parseFloat(el('newItemWeight').value) || 1;
  if (!name || !cat) return;
  DATA[cat].push({ label: name, weight });
  el('newItemName').value   = '';
  el('newItemWeight').value = '1';
  loadEditor();
}

function deleteCategory() {
  const cat = el('catSelect').value;
  if (!cat) return;
  if (!confirm(`Delete "${cat}" and all its items?`)) return;
  delete DATA[cat];
  if (currentCat === cat) currentCat = null;
  loadEditorSelect();
}

function openModal() {
  el('newCatName').value = '';
  el('modalBg').classList.add('show');
  setTimeout(() => el('newCatName').focus(), 50);
}
function closeModal() { el('modalBg').classList.remove('show'); }

function confirmAddCat() {
  const name = el('newCatName').value.trim();
  if (!name || DATA[name]) return;
  DATA[name] = [];
  closeModal();
  loadEditorSelect();
  el('catSelect').value = name;
  loadEditor();
}

// ── Utility ───────────────────────────────────────────────
function el(id) { return document.getElementById(id); }

// ── Wire events ───────────────────────────────────────────
function wireEvents() {
  el('tabWheel').addEventListener('click', () => showView('wheel'));
  el('tabEdit').addEventListener('click',  () => showView('edit'));
  el('catDropdown').addEventListener('change', function() { selectCategory(this.value); });
  el('catSelect').addEventListener('change', loadEditor);
  el('btnAddCat').addEventListener('click', openModal);
  el('btnDelCat').addEventListener('click', deleteCategory);
  el('btnAddItem').addEventListener('click', addItem);
  el('btnExport').addEventListener('click', () => exportJS(DATA, CFG));
  el('btnModalCancel').addEventListener('click', closeModal);
  el('btnModalConfirm').addEventListener('click', confirmAddCat);
  el('newCatName').addEventListener('keydown', e => { if (e.key === 'Enter') confirmAddCat(); });
  el('modalBg').addEventListener('click', e => { if (e.target === el('modalBg')) closeModal(); });

  el('spinBtnMain').addEventListener('click', function() {
    if (!currentCat) return;
    this.disabled = true;
    el('resultMain').textContent = '';
    doSpin('main', canvases.main, DATA[currentCat], CFG.palette, winner => {
      el('spinBtnMain').disabled   = false;
      el('resultMain').textContent = '🎉 ' + winner.label + '!';
    });
  });

  el('spinBtnYesNo').addEventListener('click', function() {
    this.disabled = true;
    el('resultYesNo').textContent   = '';
    el('hintYesNo').textContent     = '';
    el('spinBtnSplurge').disabled   = true;
    el('resultSplurge').textContent = '';
    const yesNoItems = [
      { label: 'Yes', weight: CFG.splurgeYesWeight },
      { label: 'No',  weight: CFG.splurgeNoWeight  }
    ];
    doSpin('yesno', canvases.yesno, yesNoItems, CFG.splurgePalette, winner => {
      el('spinBtnYesNo').disabled = false;
      if (winner.label === 'Yes') {
        el('resultYesNo').textContent = '🤑 Yes!';
        el('hintYesNo').textContent   = 'Now spin to find out what!';
        el('spinBtnSplurge').disabled = false;
      } else {
        el('resultYesNo').textContent = '🙅 No.';
        el('hintYesNo').textContent   = 'Maybe next time!';
      }
    });
  });

  el('spinBtnSplurge').addEventListener('click', function() {
    this.disabled = true;
    el('resultSplurge').textContent = '';
    doSpin('splurge', canvases.splurge, DATA[CFG.splurgeCategoryName], CFG.palette, winner => {
      el('spinBtnSplurge').disabled   = false;
      el('resultSplurge').textContent = '🎉 ' + winner.label + '!';
    });
  });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { initCanvases(); rebuildCatBar(); }, 150);
  });
}
