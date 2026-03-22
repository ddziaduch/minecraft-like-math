'use strict';

/* ============================================================
   MathCraft – app.js
   Minecraft-style multiplication PWA
   ============================================================ */

// ── Audio context (created on first user gesture) ──────────
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playHitSound() {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
  } catch (e) {}
}

function playDestroySound() {
  try {
    const ctx = getAudioCtx();
    const bufferSize = ctx.sampleRate * 0.4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.4);
    source.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    source.start(ctx.currentTime);
    source.stop(ctx.currentTime + 0.4);
  } catch (e) {}
}

function playErrorSound() {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.28, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.28);
  } catch (e) {}
}

function playLevelUpSound() {
  try {
    const ctx = getAudioCtx();
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4 E4 G4 C5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'triangle';
      const t = ctx.currentTime + i * 0.12;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.start(t); osc.stop(t + 0.22);
    });
  } catch (e) {}
}

function playBadgeSound() {
  try {
    const ctx = getAudioCtx();
    const notes = [392.00, 523.25, 659.25, 783.99, 1046.50]; // G4 C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'square';
      const t = ctx.currentTime + i * 0.15;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.start(t); osc.stop(t + 0.28);
    });
  } catch (e) {}
}

// ── Constants ──────────────────────────────────────────────
const STORAGE_KEY = 'mathcraft_progress';

const PICKAXES = [
  { id: 'wooden',  emoji: '🪵', name: 'Drewniana', tables: [2,5,10], xpReq: 0   },
  { id: 'stone',   emoji: '⛏️',  name: 'Kamienna',  tables: [3,4],   xpReq: 50  },
  { id: 'iron',    emoji: '🔩', name: 'Żelazna',   tables: [6,8],   xpReq: 150 },
  { id: 'gold',    emoji: '✨', name: 'Złota',     tables: [7,9],   xpReq: 300 },
  { id: 'diamond', emoji: '💎', name: 'Diamentowa',tables: ['mix'], xpReq: 500 },
];

const BADGES = {
  2:  { name: 'Deski',             emoji: '🪵' },
  3:  { name: 'Chleb',             emoji: '🍞' },
  4:  { name: 'Łuk',               emoji: '🏹' },
  5:  { name: 'Tarcza',            emoji: '🛡️' },
  6:  { name: 'Topór',             emoji: '🪓' },
  7:  { name: 'Miecz',             emoji: '⚔️' },
  8:  { name: 'Zbroja',            emoji: '🛡️⚔️' },
  9:  { name: 'Elytra',            emoji: '🦋' },
  10: { name: 'Diamentowy miecz',  emoji: '💎' },
};

const BLOCK_TYPES = {
  2:   'block-dirt',
  5:   'block-dirt',
  10:  'block-dirt',
  3:   'block-stone',
  4:   'block-stone',
  6:   'block-iron',
  8:   'block-iron',
  7:   'block-gold',
  9:   'block-gold',
  mix: 'block-diamond',
};

const RESOURCES = {
  2:   '🪵',
  3:   '🪨',
  4:   '🪨',
  5:   '🪵',
  6:   '⚙️',
  7:   '✨',
  8:   '⚙️',
  9:   '✨',
  10:  '🪵',
  mix: '💎',
};

const XP_PER_HIT       = 5;
const HITS_TO_BREAK    = 3;
const STREAK_BADGE     = 10;
const MAX_HP           = 3;
const MAX_ANSWER_LEN   = 3;  // max product is 10×10=100 (3 digits)

// ── Progress (loaded from localStorage) ────────────────────
let progress = {
  xp: 0,
  stats: {},
  badges: [],
  unlockedPickaxes: ['wooden'],
  mixRecord: 0,
  consecutivePerTable: {},
};

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      progress = Object.assign(progress, parsed);
    }
  } catch (e) {}
}

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {}
}

// ── Game State ─────────────────────────────────────────────
let state = {
  screen: 'start',
  table: 2,
  hp: MAX_HP,
  hits: 0,           // hits on current block
  question: null,    // { a, b, answer }
  answer: '',
  mixStreak: 0,
  pendingBadgeTable: null,
};

// ── DOM Helpers ────────────────────────────────────────────
const $ = id => document.getElementById(id);
const screens = {
  start:       $('screen-start'),
  game:        $('screen-game'),
  discoveries: $('screen-discoveries'),
  crafting:    $('screen-crafting'),
};

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
  screens[name].classList.add('screen-transition');
  setTimeout(() => screens[name].classList.remove('screen-transition'), 400);
  state.screen = name;
}

let toastTimer = null;
function showToast(msg, duration) {
  duration = duration || 1800;
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), duration);
}

// ── Start Screen ───────────────────────────────────────────
$('btn-play').addEventListener('click', () => {
  getAudioCtx(); // init audio on gesture
  checkPickaxeUnlocks();
  showScreen('game');
  initGameScreen();
});

$('btn-discoveries').addEventListener('click', () => {
  getAudioCtx();
  showScreen('discoveries');
  renderDiscoveries();
});

// ── Game Screen Init ───────────────────────────────────────
function initGameScreen() {
  state.hp = MAX_HP;
  renderHP();
  renderXPBar();
  buildTableSelector();
  setTable(getDefaultTable());
}

function getDefaultTable() {
  // return first available table for best unlocked pickaxe
  const pk = getBestPickaxe();
  const tables = pk.tables;
  if (tables[0] === 'mix') return 'mix';
  return tables[0];
}

function getBestPickaxe() {
  let best = PICKAXES[0];
  for (const pk of PICKAXES) {
    if (progress.unlockedPickaxes.includes(pk.id)) best = pk;
  }
  return best;
}

function getAvailableTables() {
  let tables = [];
  for (const pk of PICKAXES) {
    if (progress.unlockedPickaxes.includes(pk.id)) {
      pk.tables.forEach(t => { if (!tables.includes(t)) tables.push(t); });
    }
  }
  return tables;
}

function buildTableSelector() {
  const sel = $('table-selector');
  sel.innerHTML = '';
  const available = getAvailableTables();
  const allTables = [2,3,4,5,6,7,8,9,10,'mix'];
  allTables.forEach(t => {
    const btn = document.createElement('button');
    btn.className = 'table-btn';
    btn.dataset.table = t;
    btn.textContent = t === 'mix' ? '💎Mix' : '×' + t;
    if (!available.includes(t)) {
      btn.classList.add('locked');
      btn.setAttribute('disabled', 'true');
    }
    btn.addEventListener('click', () => {
      if (!available.includes(t)) { showToast('🔒 Zdobądź więcej XP!'); return; }
      setTable(t);
    });
    sel.appendChild(btn);
  });
}

function setTable(t) {
  state.table = t;
  state.hits = 0;
  // Highlight active
  document.querySelectorAll('.table-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.table == t);
  });
  // Set block type
  const block = $('game-block');
  block.className = 'game-block ' + (BLOCK_TYPES[t] || 'block-dirt');
  block.innerHTML = '<div class="block-crack-overlay" id="block-crack"></div>';
  newQuestion();
}

// ── Question Logic ─────────────────────────────────────────
function newQuestion() {
  if (state.table === 'mix') {
    const tables = [2,3,4,5,6,7,8,9,10];
    const t = tables[Math.floor(Math.random() * tables.length)];
    state.question = makeQuestion(t);
  } else {
    state.question = makeQuestion(state.table);
  }
  state.answer = '';
  updateAnswerDisplay();
  $('question-text').textContent = state.question.a + ' × ' + state.question.b + ' = ?';
}

function makeQuestion(table) {
  // Weighted random: low-accuracy questions get 2× weight
  const pool = [];
  for (let b = 1; b <= 10; b++) {
    const key = table + 'x' + b;
    const s = progress.stats[key] || { correct: 0, total: 0 };
    const acc = s.total === 0 ? 0.5 : s.correct / s.total;
    const weight = acc < 0.8 ? 2 : 1;
    for (let w = 0; w < weight; w++) pool.push(b);
  }
  const b = pool[Math.floor(Math.random() * pool.length)];
  return { a: table, b, answer: table * b };
}

function recordStat(key, correct) {
  if (!progress.stats[key]) progress.stats[key] = { correct: 0, total: 0 };
  progress.stats[key].total++;
  if (correct) progress.stats[key].correct++;
}

// ── Answer Handling ────────────────────────────────────────
function updateAnswerDisplay() {
  const disp = $('answer-display');
  if (state.answer === '') {
    disp.innerHTML = '<span class="answer-cursor">_</span>';
  } else {
    disp.textContent = state.answer;
  }
}

function handleNumpad(val) {
  if (val === 'backspace') {
    state.answer = state.answer.slice(0, -1);
    updateAnswerDisplay();
    return;
  }
  if (val === 'check') {
    submitAnswer();
    return;
  }
  if (state.answer.length >= MAX_ANSWER_LEN) return;
  state.answer += val;
  updateAnswerDisplay();
}

function submitAnswer() {
  if (!state.question) return;
  const typed = parseInt(state.answer, 10);
  const correct = typed === state.question.answer;
  const key = state.question.a + 'x' + state.question.b;
  recordStat(key, correct);

  if (correct) {
    handleCorrect();
  } else {
    handleWrong();
  }
  saveProgress();
}

let animating = false;

function handleCorrect() {
  if (animating) return;
  animating = true;

  const tableKey = state.table === 'mix' ? 'mix' : state.table;

  // XP
  progress.xp += XP_PER_HIT;
  checkPickaxeUnlocks();
  renderXPBar();

  // Consecutive streak
  if (state.table !== 'mix') {
    progress.consecutivePerTable[state.table] = (progress.consecutivePerTable[state.table] || 0) + 1;
  } else {
    state.mixStreak++;
    if (state.mixStreak > progress.mixRecord) {
      progress.mixRecord = state.mixStreak;
    }
  }
  updateStreakDisplay();

  // Hit animation
  playHitSound();
  animatePickaxe();
  state.hits++;

  const block = $('game-block');
  block.classList.add('block-hit');
  setTimeout(() => block.classList.remove('block-hit'), 350);

  // Crack
  block.classList.remove('block-crack-1','block-crack-2');
  if (state.hits === 1) block.classList.add('block-crack-1');
  if (state.hits === 2) block.classList.add('block-crack-2');

  if (state.hits >= HITS_TO_BREAK) {
    // Destroy block
    setTimeout(() => destroyBlock(), 300);
  } else {
    // Refill HP on correct
    state.hp = Math.min(state.hp + 1, MAX_HP);
    renderHP();
    state.answer = '';
    setTimeout(() => {
      newQuestion();
      animating = false;
    }, 350);
  }

  // Check badge
  if (state.table !== 'mix') {
    const streak = progress.consecutivePerTable[state.table] || 0;
    if (streak >= STREAK_BADGE && !progress.badges.includes(state.table)) {
      state.pendingBadgeTable = state.table;
    }
  }
}

function handleWrong() {
  if (animating) return;
  animating = true;

  playErrorSound();

  // Reset streaks
  if (state.table !== 'mix') {
    progress.consecutivePerTable[state.table] = 0;
  } else {
    state.mixStreak = 0;
  }
  updateStreakDisplay();

  const block = $('game-block');
  block.classList.add('block-wrong');
  setTimeout(() => block.classList.remove('block-wrong'), 450);

  state.hp--;
  renderHP();

  state.answer = '';
  updateAnswerDisplay();

  if (state.hp <= 0) {
    showGameOver();
    setTimeout(() => {
      hideGameOver();
      state.hp = MAX_HP;
      renderHP();
      state.hits = 0;
      setTable(state.table);
      animating = false;
    }, 1500);
  } else {
    setTimeout(() => {
      newQuestion();
      animating = false;
    }, 450);
  }
}

function destroyBlock() {
  playDestroySound();
  const block = $('game-block');
  block.classList.add('block-explode');

  // Show resource popup
  const resource = RESOURCES[state.table] || '💎';
  const popup = $('item-popup');
  popup.textContent = resource;
  popup.classList.add('floating');
  setTimeout(() => popup.classList.remove('floating'), 1100);

  showToast(resource + ' Zdobyłeś blok!');

  state.hp = MAX_HP;
  renderHP();
  state.hits = 0;
  state.answer = '';

  setTimeout(() => {
    // Spawn new block
    block.className = 'game-block ' + (BLOCK_TYPES[state.table] || 'block-dirt');
    block.innerHTML = '<div class="block-crack-overlay" id="block-crack"></div>';
    block.classList.add('block-appear');
    setTimeout(() => block.classList.remove('block-appear'), 450);
    newQuestion();
    animating = false;

    // Badge?
    if (state.pendingBadgeTable !== null) {
      const bt = state.pendingBadgeTable;
      state.pendingBadgeTable = null;
      progress.badges.push(bt);
      saveProgress();
      setTimeout(() => showCraftingScreen(bt), 600);
    }
  }, 550);
}

function animatePickaxe() {
  const pk = $('pickaxe-icon');
  pk.classList.add('pickaxe-swing');
  setTimeout(() => pk.classList.remove('pickaxe-swing'), 350);
}

function renderHP() {
  for (let i = 1; i <= MAX_HP; i++) {
    const h = $('heart-' + i);
    if (h) {
      h.textContent = i <= state.hp ? '❤️' : '🖤';
      h.classList.toggle('empty', i > state.hp);
    }
  }
}

function renderXPBar() {
  $('xp-label').textContent = progress.xp + ' XP';
  const best = getBestPickaxe();
  const pkIdx = PICKAXES.indexOf(best);
  $('pickaxe-icon').textContent = best.emoji;

  let pct = 100;
  if (pkIdx < PICKAXES.length - 1) {
    const next = PICKAXES[pkIdx + 1];
    const prev = best.xpReq;
    const range = next.xpReq - prev;
    pct = Math.min(100, Math.max(0, ((progress.xp - prev) / range) * 100));
  }
  $('xp-bar-fill').style.width = pct + '%';
}

function updateStreakDisplay() {
  const val = state.table === 'mix'
    ? state.mixStreak
    : (progress.consecutivePerTable[state.table] || 0);
  $('streak-count').textContent = val;
}

function checkPickaxeUnlocks() {
  let unlocked = false;
  PICKAXES.forEach(pk => {
    if (!progress.unlockedPickaxes.includes(pk.id) && progress.xp >= pk.xpReq) {
      progress.unlockedPickaxes.push(pk.id);
      unlocked = true;
      playLevelUpSound();
      showToast('🎉 Odblokowałeś: ' + pk.emoji + ' ' + pk.name + '!', 2500);
    }
  });
  if (unlocked) buildTableSelector();
}

function showGameOver() {
  $('game-over-overlay').style.display = 'flex';
}
function hideGameOver() {
  $('game-over-overlay').style.display = 'none';
}

// ── Numpad Events ──────────────────────────────────────────
document.querySelectorAll('.numpad-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    getAudioCtx();
    handleNumpad(btn.dataset.val);
  });
});

// Keyboard support
document.addEventListener('keydown', e => {
  if (state.screen !== 'game') return;
  if (e.key >= '0' && e.key <= '9') handleNumpad(e.key);
  else if (e.key === 'Backspace') handleNumpad('backspace');
  else if (e.key === 'Enter') handleNumpad('check');
});

$('btn-back-game').addEventListener('click', () => {
  showScreen('start');
});

// ── Discoveries Screen ─────────────────────────────────────
$('btn-back-discoveries').addEventListener('click', () => showScreen('start'));

function renderDiscoveries() {
  $('total-xp-display').textContent = progress.xp;
  $('mix-record-display').textContent = progress.mixRecord;

  const grid = $('table-grid');
  grid.innerHTML = '';
  const available = getAvailableTables().filter(t => t !== 'mix');
  const allNum = [2,3,4,5,6,7,8,9,10];

  allNum.forEach(t => {
    const cell = document.createElement('div');
    cell.className = 'table-cell';
    const isMastered = progress.badges.includes(t);
    const isUnlocked = available.includes(t);

    if (isMastered) {
      cell.classList.add('mastered');
      const star = document.createElement('span');
      star.className = 'star-badge';
      star.textContent = '⭐';
      cell.appendChild(star);
      const icon = document.createElement('div');
      icon.className = 'cell-icon';
      icon.textContent = BADGES[t] ? BADGES[t].emoji : '🏆';
      cell.appendChild(icon);
      const num = document.createElement('div');
      num.className = 'cell-num';
      num.textContent = '×' + t;
      cell.appendChild(num);
    } else if (isUnlocked) {
      cell.classList.add('unlocked');
      cell.classList.add(BLOCK_TYPES[t] || 'block-stone');
      const num = document.createElement('div');
      num.className = 'cell-num';
      num.textContent = '×' + t;
      cell.appendChild(num);
      // accuracy
      let correct = 0, total = 0;
      for (let b = 1; b <= 10; b++) {
        const s = progress.stats[t + 'x' + b];
        if (s) { correct += s.correct; total += s.total; }
      }
      if (total > 0) {
        const acc = document.createElement('div');
        acc.className = 'cell-accuracy';
        acc.textContent = Math.round(correct / total * 100) + '%';
        cell.appendChild(acc);
      }
    } else {
      cell.classList.add('locked');
      const lk = document.createElement('div');
      lk.className = 'cell-lock';
      lk.textContent = '🔒';
      cell.appendChild(lk);
      const num = document.createElement('div');
      num.className = 'cell-num';
      num.textContent = '×' + t;
      cell.appendChild(num);
    }
    grid.appendChild(cell);
  });

  // Pickaxe progress list
  const list = $('pickaxe-progress-list');
  list.innerHTML = '';
  PICKAXES.forEach(pk => {
    const row = document.createElement('div');
    row.className = 'pickaxe-row';
    if (progress.unlockedPickaxes.includes(pk.id)) row.classList.add('unlocked');
    row.innerHTML =
      '<span class="pk-icon">' + pk.emoji + '</span>' +
      '<span class="pk-name">' + pk.name + '</span>' +
      '<span class="pk-req">' + (pk.xpReq === 0 ? 'Start' : pk.xpReq + ' XP') + '</span>';
    list.appendChild(row);
  });
}

// ── Crafting Screen ────────────────────────────────────────
function showCraftingScreen(tableNum) {
  playBadgeSound();
  const badge = BADGES[tableNum];
  if (!badge) return;

  $('crafting-subtitle').textContent = 'Odznaka × ' + tableNum + ' zdobyta!';
  $('crafting-item-name').textContent = badge.emoji + '  ' + badge.name;
  $('crafting-result-item').textContent = badge.emoji;
  $('crafting-result-item').classList.remove('visible');
  $('btn-crafting-continue').style.display = 'none';

  // Fill crafting grid with themed emojis
  const grid = $('crafting-grid');
  grid.innerHTML = '';
  const mats = getCraftingMaterials(tableNum);

  for (let i = 0; i < 9; i++) {
    const cell = document.createElement('div');
    cell.className = 'crafting-cell';
    cell.textContent = mats[i] || '';
    grid.appendChild(cell);
  }

  showScreen('crafting');

  // Staggered reveal
  const cells = grid.querySelectorAll('.crafting-cell');
  cells.forEach((cell, i) => {
    if (!cell.textContent) return;
    setTimeout(() => cell.classList.add('revealed'), 150 + i * 200);
  });

  // Show result after grid fills
  setTimeout(() => {
    $('crafting-result-item').classList.add('visible');
    setTimeout(() => {
      $('btn-crafting-continue').style.display = '';
    }, 400);
  }, 150 + 9 * 200);
}

function getCraftingMaterials(tableNum) {
  // Returns 9 emojis for the crafting grid (sparse, by table)
  const maps = {
    2:  ['🪵','🪵','🪵','🪵','🪵','🪵','🪵','🪵','🪵'],
    3:  ['🌾','🌾','🌾','',  '',  '',  '',  '',  ''  ],
    4:  ['🪵','🪵','🪵','',  '🪢','',  '🪵','',  '🪵'],
    5:  ['⬜','⬜','⬜','⬜','⬜','⬜','⬜','⬜','⬜'],
    6:  ['🪵','🪵','🪵','🪵','🪵','🪵','',  '🪵',''],
    7:  ['⬜','⬜','',  '',  '⬜','',  '',  '⬜',''],
    8:  ['💎','💎','💎','💎','',  '💎','💎','💎','💎'],
    9:  ['💎','💎','💎','💎','💎','💎','💎','💎','💎'],
    10: ['💎','💎','💎','',  '💎','',  '',  '💎',''],
  };
  return maps[tableNum] || ['⭐','⭐','⭐','⭐','⭐','⭐','⭐','⭐','⭐'];
}

$('btn-crafting-continue').addEventListener('click', () => {
  showScreen('game');
  initGameScreen();
});

// ── Boot ───────────────────────────────────────────────────
function boot() {
  loadProgress();
  checkPickaxeUnlocks();
  showScreen('start');
}

boot();
