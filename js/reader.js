/* ===== 天然色漢字フォーカスリーダー v3 — reader.js ===== */

const BOOKS = { kokoro: KOKORO, botchan: BOTCHAN, takekurabe: TAKEKURABE };
const speedMap = { 1: 3500, 2: 2500, 3: 1500, 4: 800, 5: 400 };
const kanjiProgress = ['読','一','二','三','四','五','六','七','八','九','完'];

let chunks = [];
let cur = 0;
let timer = null;
let isCustomMode = false;

const track       = document.getElementById('track');
const pb          = document.getElementById('progress-bar');
const pl          = document.getElementById('progress-label');
const btnNext     = document.getElementById('btn-next');
const btnPrev     = document.getElementById('btn-prev');
const btnAuto     = document.getElementById('btn-auto');
const speedSlider = document.getElementById('speed-slider');
const speedVal    = document.getElementById('speed-val');
const kanji       = document.getElementById('kanji-badge');
const headerTitle = document.getElementById('header-title');
const headerSub   = document.getElementById('header-sub');
const banner      = document.getElementById('complete-banner');
const stage       = document.getElementById('stage');
const resetBtn    = document.getElementById('reset-btn');
const backBtn     = document.getElementById('back-btn');
const btnBack     = document.getElementById('btn-back');
const chunkInfo   = document.getElementById('chunk-info');

function loadContent() {
  const customChunks = localStorage.getItem('customChunks');

  if (customChunks) {
    // カスタムテキストモード
    isCustomMode = true;
    chunks = JSON.parse(customChunks);
    const splitMode = localStorage.getItem('splitMode') || 'kuten';
    const modeLabel = { kuten:'句点ごと', touten:'読点ごと', both:'句点＋読点', line:'改行ごと', word:'単語ごと' };
    headerTitle.textContent = 'テキストリーダー';
    headerSub.textContent = '天然色漢字INDEX™';
    chunkInfo.textContent = '区切り：' + (modeLabel[splitMode] || splitMode) + ' / ' + chunks.length + 'ブロック';
    document.title = 'テキストリーダー — 天然色漢字INDEX™';
  } else {
    // 作品モード
    isCustomMode = false;
    const id = localStorage.getItem('selectedBook') || 'kokoro';
    const book = BOOKS[id] || KOKORO;
    chunks = book.lines;
    headerTitle.textContent = book.title;
    headerSub.textContent = book.author + ' — 青空文庫';
    chunkInfo.textContent = '';
    document.title = book.title + ' — フォーカスリーダー';
  }

  buildCols();
  setTimeout(render, 150);
}

function buildCols() {
  track.innerHTML = '';
  track.style.transform = 'translateX(0)';
  stage.style.display = 'block';
  banner.style.display = 'none';

  const N = chunks.length;
  for (let i = N - 1; i >= 0; i--) {
    const col = document.createElement('div');
    col.className = 'col far';
    col.dataset.i = String(i);
    const ct = document.createElement('span');
    ct.className = 'ct';
    ct.textContent = chunks[i];
    col.appendChild(ct);
    col.addEventListener('click', () => { cur = i; render(); });
    track.appendChild(col);
  }
}

function render() {
  const N = chunks.length;
  track.querySelectorAll('.col').forEach(c => {
    const i = parseInt(c.dataset.i);
    c.classList.remove('future', 'active', 'near', 'far');
    const d = i - cur;
    if (d > 0)        c.classList.add('future');
    else if (d === 0) c.classList.add('active');
    else if (d >= -2) c.classList.add('near');
    else              c.classList.add('far');
  });

  requestAnimationFrame(() => {
    const stageW = stage.getBoundingClientRect().width || 520;
    const activeEl = track.querySelector(`.col[data-i="${cur}"]`);
    if (!activeEl) return;
    const colW = activeEl.getBoundingClientRect().width || 90;
    const colLeft = activeEl.offsetLeft;
    track.style.transform = `translateX(${-(colLeft - (stageW / 2 - colW / 2) + 24)}px)`;
  });

  const pct = N > 1 ? Math.round((cur / (N - 1)) * 100) : 100;
  pb.style.width = pct + '%';
  pl.textContent = (cur + 1) + ' / ' + N;
  btnNext.disabled = cur >= N - 1;
  btnPrev.disabled = cur === 0;

  // 漢字バッジ（進捗10段階）
  const step = Math.min(Math.floor((cur / N) * 10), 10);
  kanji.textContent = kanjiProgress[step];

  if (cur >= N - 1 && timer) {
    stopAuto();
    setTimeout(() => {
      stage.style.display = 'none';
      banner.style.display = 'flex';
      kanji.textContent = '完';
    }, 700);
  }
}

function stopAuto() {
  clearInterval(timer);
  timer = null;
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
  stage.style.display = 'block';
  banner.style.display = 'none';
  render();
}

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
