/* ===== 天然色漢字フォーカスリーダー v4 — reader.js ===== */

const BOOKS = { kokoro: KOKORO, botchan: BOTCHAN, takekurabe: TAKEKURABE };
const speedMap = { 1: 3500, 2: 2500, 3: 1500, 4: 800, 5: 400 };
const kanjiProgress = ['読','一','二','三','四','五','六','七','八','九','完'];

let chunks = [];
let cur = 0;
let timer = null;
let mode = 'tate'; // 'tate' or 'yoko'

const stageTate    = document.getElementById('stage-tate');
const stageYoko    = document.getElementById('stage-yoko');
const trackTate    = document.getElementById('track-tate');
const trackYoko    = document.getElementById('track-yoko');
const pb           = document.getElementById('progress-bar');
const pl           = document.getElementById('progress-label');
const btnNext      = document.getElementById('btn-next');
const btnPrev      = document.getElementById('btn-prev');
const btnAuto      = document.getElementById('btn-auto');
const speedSlider  = document.getElementById('speed-slider');
const speedVal     = document.getElementById('speed-val');
const kanji        = document.getElementById('kanji-badge');
const headerTitle  = document.getElementById('header-title');
const headerSub    = document.getElementById('header-sub');
const banner       = document.getElementById('complete-banner');
const resetBtn     = document.getElementById('reset-btn');
const backBtn      = document.getElementById('back-btn');
const btnBack      = document.getElementById('btn-back');
const chunkInfo    = document.getElementById('chunk-info');
const resizer      = document.getElementById('stage-resizer');

// ===== コンテンツ読み込み =====
function loadContent() {
  const customChunks = localStorage.getItem('customChunks');
  if (customChunks) {
    chunks = JSON.parse(customChunks);
    const splitMode = localStorage.getItem('splitMode') || 'kuten';
    const modeLabel = { kuten:'句点ごと', touten:'読点ごと', both:'句点＋読点', line:'改行ごと', word:'単語ごと' };
    headerTitle.textContent = 'テキストリーダー';
    headerSub.textContent = '天然色漢字INDEX™';
    chunkInfo.textContent = '区切り：' + (modeLabel[splitMode] || splitMode) + ' / ' + chunks.length + 'ブロック';
    document.title = 'テキストリーダー — 天然色漢字INDEX™';
  } else {
    const id = localStorage.getItem('selectedBook') || 'kokoro';
    const book = BOOKS[id] || KOKORO;
    chunks = book.lines;
    headerTitle.textContent = book.title;
    headerSub.textContent = book.author + ' — 青空文庫';
    chunkInfo.textContent = '';
    document.title = book.title + ' — フォーカスリーダー';
  }
  buildTate();
  buildYoko();
  restoreHeight();
  setTimeout(render, 150);
}

// ===== 縦書きコラム構築 =====
function buildTate() {
  trackTate.innerHTML = '';
  trackTate.style.transform = 'translateX(0)';
  const N = chunks.length;
  for (let i = N - 1; i >= 0; i--) {
    const col = document.createElement('div');
    col.className = 'col-tate far';
    col.dataset.i = String(i);
    const ct = document.createElement('span');
    ct.className = 'ct';
    ct.textContent = chunks[i];
    col.appendChild(ct);
    col.addEventListener('click', () => { cur = i; render(); });
    trackTate.appendChild(col);
  }
}

// ===== 横書きコラム構築 =====
function buildYoko() {
  trackYoko.innerHTML = '';
  trackYoko.style.transform = 'translateY(0)';
  chunks.forEach((text, i) => {
    const col = document.createElement('div');
    col.className = 'col-yoko far';
    col.dataset.i = String(i);
    const ct = document.createElement('span');
    ct.className = 'ct';
    ct.textContent = text;
    col.appendChild(ct);
    col.addEventListener('click', () => { cur = i; render(); });
    trackYoko.appendChild(col);
  });
}

// ===== 縦書きレンダリング =====
function renderTate() {
  const cols = Array.from(trackTate.querySelectorAll('.col-tate'));
  cols.forEach(c => {
    const i = parseInt(c.dataset.i);
    c.classList.remove('future', 'active', 'near', 'far');
    const d = i - cur;
    if (d > 0)        c.classList.add('future');
    else if (d === 0) c.classList.add('active');
    else if (d >= -2) c.classList.add('near');
    else              c.classList.add('far');
  });
  requestAnimationFrame(() => {
    const stageW = stageTate.getBoundingClientRect().width || 520;
    const activeEl = trackTate.querySelector(`.col-tate[data-i="${cur}"]`);
    if (!activeEl) return;
    const colW = activeEl.getBoundingClientRect().width || 90;
    const colLeft = activeEl.offsetLeft;
    trackTate.style.transform = `translateX(${-(colLeft - (stageW / 2 - colW / 2) + 24)}px)`;
  });
}

// ===== 横書きレンダリング =====
function renderYoko() {
  const cols = Array.from(trackYoko.querySelectorAll('.col-yoko'));
  cols.forEach(c => {
    const i = parseInt(c.dataset.i);
    c.classList.remove('future', 'active', 'near', 'far');
    const d = i - cur;
    if (d < 0)        c.classList.add('far');
    else if (d === 0) c.classList.add('active');
    else if (d <= 2)  c.classList.add('near');
    else              c.classList.add('future');
  });
  requestAnimationFrame(() => {
    const stageH = stageYoko.getBoundingClientRect().height || 300;
    const activeEl = trackYoko.querySelector(`.col-yoko[data-i="${cur}"]`);
    if (!activeEl) return;
    const colH = activeEl.getBoundingClientRect().height || 48;
    const colTop = activeEl.offsetTop;
    trackYoko.style.transform = `translateY(${-(colTop - (stageH / 2 - colH / 2))}px)`;
  });
}

// ===== 共通レンダリング =====
function render() {
  const N = chunks.length;
  if (mode === 'tate') renderTate();
  else renderYoko();

  const pct = N > 1 ? Math.round((cur / (N - 1)) * 100) : 100;
  pb.style.width = pct + '%';
  pl.textContent = (cur + 1) + ' / ' + N;
  btnNext.disabled = cur >= N - 1;
  btnPrev.disabled = cur === 0;

  const step = Math.min(Math.floor((cur / N) * 10), 10);
  kanji.textContent = kanjiProgress[step];

  if (cur >= N - 1 && timer) { stopAuto(); setTimeout(showComplete, 700); }
}

function showComplete() {
  stageTate.style.display = 'none';
  stageYoko.style.display = 'none';
  banner.style.display = 'flex';
  kanji.textContent = '完';
}

// ===== モード切替 =====
function setMode(m) {
  mode = m;
  document.getElementById('btn-tate').classList.toggle('active', m === 'tate');
  document.getElementById('btn-yoko').classList.toggle('active', m === 'yoko');
  stageTate.style.display = m === 'tate' ? 'block' : 'none';
  stageYoko.style.display = m === 'yoko' ? 'block' : 'none';
  localStorage.setItem('reader_mode', m);
  setTimeout(render, 50);
}

// ===== 自動再生 =====
function stopAuto() {
  clearInterval(timer); timer = null;
  btnAuto.textContent = '自動再生';
  btnAuto.classList.add('primary');
}

function startAuto() {
  const ms = speedMap[speedSlider.value] || 1500;
  timer = setInterval(() => {
    if (cur < chunks.length - 1) { cur++; render(); }
    else stopAuto();
  }, ms);
  btnAuto.textContent = '停止';
}

function reset() {
  cur = 0;
  stageTate.style.display = mode === 'tate' ? 'block' : 'none';
  stageYoko.style.display = mode === 'yoko' ? 'block' : 'none';
  banner.style.display = 'none';
  render();
}

// ===== リサイザー =====
let isResizing = false, startY = 0, startH = 0;

resizer.addEventListener('mousedown', e => {
  isResizing = true;
  startY = e.clientY;
  startH = (mode === 'tate' ? stageTate : stageYoko).getBoundingClientRect().height;
  document.body.style.cursor = 'ns-resize';
  e.preventDefault();
});

document.addEventListener('mousemove', e => {
  if (!isResizing) return;
  const newH = Math.max(160, Math.min(700, startH + (e.clientY - startY)));
  stageTate.style.height = newH + 'px';
  stageYoko.style.height = newH + 'px';
  render();
});

document.addEventListener('mouseup', () => {
  if (!isResizing) return;
  isResizing = false;
  document.body.style.cursor = '';
  localStorage.setItem('stage_height', stageTate.style.height);
});

function restoreHeight() {
  const savedH = localStorage.getItem('stage_height');
  if (savedH) { stageTate.style.height = savedH; stageYoko.style.height = savedH; }
  const savedMode = localStorage.getItem('reader_mode');
  if (savedMode) setMode(savedMode);
}

// ===== イベント =====
btnNext.addEventListener('click', () => { if (cur < chunks.length - 1) { cur++; render(); } });
btnPrev.addEventListener('click', () => { if (cur > 0) { cur--; render(); } });
btnAuto.addEventListener('click', () => { timer ? stopAuto() : startAuto(); });
speedSlider.addEventListener('input', () => {
  speedVal.textContent = speedSlider.value;
  if (timer) { stopAuto(); startAuto(); }
});
resetBtn.addEventListener('click', reset);
backBtn.addEventListener('click', () => { window.location.href = 'index.html'; });
btnBack.addEventListener('click', () => { window.location.href = 'index.html'; });

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft')  { if (cur < chunks.length - 1) { cur++; render(); } }
  if (e.key === 'ArrowRight') { if (cur > 0) { cur--; render(); } }
});

loadContent();
