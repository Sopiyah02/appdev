// ============================================================
// AUDIO ENGINE — Web Audio API (no external files)
// ============================================================
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx    = null;
let bgMusicOn   = false;
let bgGain      = null;

function getAudio() {
  if (!audioCtx) audioCtx = new AudioCtx();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playTone(type, freq, duration, gain = 0.25, delay = 0, detune = 0) {
  try {
    const ctx = getAudio();
    const t   = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    osc.detune.setValueAtTime(detune, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.start(t); osc.stop(t + duration + 0.05);
  } catch(e) {}
}

// ── SFX ───────────────────────────────────────────────────
function soundCorrect() {
  playTone('sine', 523, 0.18, 0.28, 0);
  playTone('sine', 659, 0.18, 0.28, 0.11);
  playTone('sine', 784, 0.18, 0.28, 0.22);
  playTone('sine', 1047,0.30, 0.35, 0.33);
  playTone('triangle',1047,0.4,0.13,0.34);
}
function soundWrong() {
  playTone('sawtooth', 220, 0.14, 0.22, 0);
  playTone('sawtooth', 165, 0.18, 0.18, 0.11);
  playTone('square',   110, 0.22, 0.18, 0.21);
}
function soundClick()  { playTone('triangle', 880, 0.07, 0.12, 0); }
function soundFlip()   {
  playTone('sine', 660, 0.10, 0.13, 0);
  playTone('sine', 880, 0.09, 0.10, 0.09);
}
function soundLevelUp() {
  [392,523,659,784,1047,1568].forEach((f,i) =>
    playTone('sine', f, 0.28, 0.28, i * 0.09));
}
function soundComplete() {
  [1047,1319,1568,2093].forEach((f,i) => {
    playTone('sine',    f,   0.55, 0.32, i*0.14);
    playTone('triangle',f*2, 0.22, 0.15, i*0.14+0.05);
  });
}

// ── CHILL AMBIENT BACKGROUND MUSIC ───────────────────────
// Procedural: slow chord pads (Am7→Fmaj7→Cmaj7→G7) +
//             pentatonic arpeggio + warm bass root
const BPM      = 68;
const BEAT     = 60 / BPM;
const CHORD_BEATS = 8;
const CHORD_DUR   = BEAT * CHORD_BEATS;

// Each chord: [pad freqs], bass root
const CHORDS = [
  { pads:[220,262,330,392], bass:110  },  // Am7
  { pads:[175,220,262,349], bass:87.3 },  // Fmaj7
  { pads:[131,165,196,262], bass:65.4 },  // Cmaj7
  { pads:[196,247,294,392], bass:98   },  // G7
];
// Am pentatonic scale (multi-octave)
const PENTA = [220,247,262,294,330,392,440,494,523,587,659,784];

function startBgMusic() {
  if (bgMusicOn) return;
  bgMusicOn = true;
  const ctx = getAudio();
  bgGain = ctx.createGain();
  bgGain.gain.setValueAtTime(0, ctx.currentTime);
  bgGain.gain.linearRampToValueAtTime(0.20, ctx.currentTime + 4);
  bgGain.connect(ctx.destination);

  padLoop(ctx, ctx.currentTime);
  bassLoop(ctx, ctx.currentTime + 0.5);
  arpeggioLoop(ctx, ctx.currentTime + 5); // arp enters after pads bloom
}

function stopBgMusic() {
  if (!bgGain || !audioCtx) return;
  try {
    bgGain.gain.cancelScheduledValues(audioCtx.currentTime);
    bgGain.gain.setValueAtTime(bgGain.gain.value, audioCtx.currentTime);
    bgGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 2);
  } catch(e) {}
  setTimeout(() => { bgMusicOn = false; bgGain = null; }, 2500);
}

// Pad: detuned sine layers with long fade in/out
function padLoop(ctx, startTime) {
  if (!bgMusicOn) return;
  CHORDS.forEach((chord, ci) => {
    chord.pads.forEach(freq => {
      [-8, 0, 8].forEach(det => {
        try {
          const when = startTime + ci * CHORD_DUR;
          const osc  = ctx.createOscillator();
          const g    = ctx.createGain();
          osc.connect(g); g.connect(bgGain);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, when);
          osc.detune.setValueAtTime(det, when);
          g.gain.setValueAtTime(0, when);
          g.gain.linearRampToValueAtTime(0.065, when + 1.8);
          g.gain.setValueAtTime(0.065, when + CHORD_DUR - 1.5);
          g.gain.linearRampToValueAtTime(0, when + CHORD_DUR + 0.1);
          osc.start(when);
          osc.stop(when + CHORD_DUR + 0.15);
        } catch(e) {}
      });
    });
  });

  const loopDur = CHORDS.length * CHORD_DUR;
  setTimeout(() => {
    if (!bgMusicOn) return;
    padLoop(ctx, startTime + loopDur);
  }, (loopDur - 2.5) * 1000);
}

// Bass: slow root notes
function bassLoop(ctx, startTime) {
  if (!bgMusicOn) return;
  CHORDS.forEach((chord, ci) => {
    const when = startTime + ci * CHORD_DUR;
    try {
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      osc.connect(g); g.connect(bgGain);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(chord.bass, when);
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(0.13, when + 0.5);
      g.gain.setValueAtTime(0.13, when + CHORD_DUR - 0.8);
      g.gain.linearRampToValueAtTime(0, when + CHORD_DUR);
      osc.start(when); osc.stop(when + CHORD_DUR + 0.1);
    } catch(e) {}
  });

  const loopDur = CHORDS.length * CHORD_DUR;
  setTimeout(() => {
    if (!bgMusicOn) return;
    bassLoop(ctx, startTime + loopDur);
  }, (loopDur - 2) * 1000);
}

// Arpeggio: gentle pentatonic melody, quarter-note grid
function arpeggioLoop(ctx, startTime) {
  if (!bgMusicOn) return;
  const NOTES  = 32;
  const noteDur = BEAT * 0.95;

  // Generate a pattern with musical phrasing:
  // more likely to go to nearby notes (random walk)
  let idx = Math.floor(PENTA.length / 2);
  const pattern = [];
  for (let i = 0; i < NOTES; i++) {
    pattern.push(PENTA[idx]);
    const step = Math.floor(Math.random() * 3) - 1; // -1, 0, +1
    idx = Math.max(0, Math.min(PENTA.length - 1, idx + step));
  }

  pattern.forEach((freq, i) => {
    if (Math.random() < 0.28) return; // ~28% rests for breathing room
    const t = startTime + i * BEAT;
    try {
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      osc.connect(g); g.connect(bgGain);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.048, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + noteDur * 0.75);
      osc.start(t); osc.stop(t + noteDur);
    } catch(e) {}
  });

  const loopDur = NOTES * BEAT;
  setTimeout(() => {
    if (!bgMusicOn) return;
    arpeggioLoop(ctx, startTime + loopDur);
  }, (loopDur - 1) * 1000);
}

// ============================================================
// PARTICLES
// ============================================================
function spawnParticles() {
  const container = document.getElementById('bg-particles');
  const colors = ['#c9a84c','#8b2fc9','#c0314a','#2ecc71','#bf7fff'];
  for (let i = 0; i < 30; i++) {
    const p     = document.createElement('div');
    p.className = 'particle';
    const size  = Math.random() * 3 + 1;
    const x     = Math.random() * 100;
    const dur   = Math.random() * 20 + 15;
    const delay = Math.random() * 20;
    const color = colors[Math.floor(Math.random() * colors.length)];
    p.style.cssText = `width:${size}px;height:${size}px;left:${x}%;bottom:-10px;
      background:${color};animation-duration:${dur}s;animation-delay:-${delay}s;
      box-shadow:0 0 ${size*2}px ${color};`;
    container.appendChild(p);
  }
}
spawnParticles();

// ============================================================
// DIFFICULTY CONFIG
// Beginner:  Lv 1-2 → 10 questions  (easy pool)
// Normal:    Lv 1-3 → 15 questions  (medium pool)
// Expert:    Lv 1-5 → 20 questions  (full pool, harder skew)
// ============================================================
const difficultyConfig = {
  beginner: {
    levels:  [1, 2],
    qCount:  10,
    // weight: how many questions to take from each level (ratio)
    weights: { 1: 0.6, 2: 0.4 },
    label:   '🌿 Beginner',
    badge:   'beginner',
  },
  normal: {
    levels:  [1, 2, 3],
    qCount:  15,
    weights: { 1: 0.33, 2: 0.34, 3: 0.33 },
    label:   '⚔️ Normal',
    badge:   'normal',
  },
  expert: {
    levels:  [1, 2, 3, 4, 5],
    qCount:  20,
    // Expert skews harder: more from levels 3-5
    weights: { 1: 0.10, 2: 0.15, 3: 0.25, 4: 0.25, 5: 0.25 },
    label:   '💀 Expert',
    badge:   'expert',
  },
};

// ============================================================
// PLAYERS & STATE
// ============================================================
let players    = [];
let currentPlayer       = null;
let playerAvatar        = '';
let selectedDifficulty  = 'normal';
let index      = 0;
let score      = 0;
let category   = 'javascript';
let currentQuestions    = [];
let answered            = false;
let pendingCorrect      = false;

// ============================================================
// BUILD QUESTION POOL
// Takes weighted samples from each level, then shuffles the
// final pool so questions appear in random order (not level order)
// ============================================================
function buildQuestionPool(cat, diff) {
  const cfg     = difficultyConfig[diff];
  const total   = cfg.qCount;
  let   pool    = [];

  cfg.levels.forEach(lvl => {
    const all    = database[cat]['level' + lvl] || [];
    const frac   = cfg.weights[lvl] || (1 / cfg.levels.length);
    const want   = Math.round(total * frac);
    const sample = shuffle(all).slice(0, want);
    // Tag each question with its source level (shown in level-tag)
    sample.forEach(q => pool.push({ ...q, _level: lvl }));
  });

  // Full shuffle so levels are interleaved, not grouped
  pool = shuffle(pool);

  // Trim/pad to exact count if rounding caused drift
  return pool.slice(0, total);
}

// ============================================================
// AVATAR & DIFFICULTY UI
// ============================================================
document.querySelectorAll('.avatar').forEach(img => {
  img.addEventListener('click', () => {
    soundClick();
    playerAvatar = img.src;
    document.querySelectorAll('.avatar').forEach(a => a.classList.remove('selected'));
    img.classList.add('selected');
  });
});

document.querySelectorAll('.diff-card').forEach(card => {
  card.addEventListener('click', () => {
    soundClick();
    selectedDifficulty = card.dataset.diff;
  });
});

// ============================================================
// LOGIN / LOGOUT
// ============================================================
function loginPlayer() {
  const username  = document.getElementById('username').value.trim();
  category        = document.getElementById('category').value;
  const diffInput = document.querySelector('input[name="difficulty"]:checked');
  selectedDifficulty = diffInput ? diffInput.value : 'normal';

  if (!username)     { alert('Enter your name, warrior.');  return; }
  if (!playerAvatar) { alert('Choose your seal first.');    return; }

  soundClick();
  let existing = players.find(p => p.name === username);
  if (existing) {
    currentPlayer = existing;
  } else {
    currentPlayer = { name: username, score: 0, avatar: playerAvatar,
                      category, difficulty: selectedDifficulty };
    players.push(currentPlayer);
  }

  hideAllPanels();
  document.getElementById('player-dashboard').classList.remove('hidden');
  updateDashboard();
}

function logoutPlayer() {
  soundClick();
  stopBgMusic();
  hideAllPanels();
  document.getElementById('player-login').classList.remove('hidden');
  currentPlayer = null; playerAvatar = '';
  document.querySelectorAll('.avatar').forEach(a => a.classList.remove('selected'));
  document.getElementById('username').value = '';
}

// ============================================================
// DASHBOARD
// ============================================================
function updateDashboard() {
  const diff = currentPlayer.difficulty || 'normal';
  const cfg  = difficultyConfig[diff];

  document.getElementById('dashboard-avatar').src      = currentPlayer.avatar;
  document.getElementById('dashboard-name').innerText  = currentPlayer.name;
  document.getElementById('dashboard-score').innerText = `⚜ Score: ${currentPlayer.score}`;
  document.getElementById('dashboard-diff').innerText  = cfg.label;

  const labelsEl = document.getElementById('level-labels');
  labelsEl.innerHTML = '';
  cfg.levels.forEach(l => {
    const sp = document.createElement('span'); sp.innerText = `Lv${l}`;
    labelsEl.appendChild(sp);
  });

  const pct = Math.min(100, (currentPlayer.score / (cfg.qCount || 10)) * 100);
  document.getElementById('level-fill').style.width      = pct + '%';
  document.getElementById('level-fill-glow').style.width = pct + '%';
}

// ============================================================
// QUIZ
// ============================================================
function startQuiz() {
  soundClick();
  hideAllPanels();
  document.getElementById('quiz').classList.remove('hidden');
  startBgMusic();

  category = currentPlayer.category;
  const diff = currentPlayer.difficulty || 'normal';

  index = 0; score = 0;
  currentQuestions = buildQuestionPool(category, diff);

  document.getElementById('player-avatar').src = currentPlayer.avatar;
  resetFlipCard();
  showQ();
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function showQ() {
  answered = false; pendingCorrect = false;
  resetFlipCard();

  const q    = currentQuestions[index];
  const diff = currentPlayer.difficulty || 'normal';
  const cfg  = difficultyConfig[diff];

  document.getElementById('q-number').innerText  = `Q${index + 1} / ${currentQuestions.length}`;
  document.getElementById('question').innerText   = q.q;
  document.getElementById('level-tag').innerText  =
    `${cfg.label}  •  Q${index + 1}/${currentQuestions.length}  •  Lv${q._level}`;
  document.getElementById('flip-hint').innerText  = 'Select an answer to reveal the rune';

  const div = document.getElementById('choices');
  div.innerHTML = '';
  shuffle(q.choices).forEach(choice => {
    const btn = document.createElement('button');
    btn.innerText = choice;
    btn.classList.add('choice-btn');
    btn.onclick = () => pickAnswer(choice, btn);
    div.appendChild(btn);
  });
}

function resetFlipCard() {
  document.getElementById('flip-inner').classList.remove('flipped');
  document.getElementById('flip-back').className = 'flip-back';
}

function pickAnswer(choice, btn) {
  if (answered) return;
  answered = true;
  soundClick();
  document.querySelectorAll('.choice-btn').forEach(b => b.disabled = true);

  const correct   = currentQuestions[index].a;
  const isCorrect = choice === correct;
  pendingCorrect  = isCorrect;

  btn.classList.add(isCorrect ? 'correct' : 'wrong');
  if (!isCorrect) {
    document.querySelectorAll('.choice-btn').forEach(b => {
      if (b.innerText === correct) b.classList.add('correct');
    });
  }

  document.getElementById('back-result-icon').innerText = isCorrect ? '✅' : '❌';
  document.getElementById('back-result-text').innerText = isCorrect ? 'Correct! +1 Point' : 'Wrong!';
  document.getElementById('back-result-text').className = 'back-result-text ' + (isCorrect ? 'text-green' : 'text-red');
  document.getElementById('back-your').innerText    = choice;
  document.getElementById('back-correct').innerText = correct;
  document.getElementById('flip-back').className    = 'flip-back ' + (isCorrect ? 'back-correct' : 'back-wrong');

  setTimeout(() => {
    document.getElementById('flip-inner').classList.add('flipped');
    document.getElementById('flip-hint').innerText = 'Flip back to review choices ↺';
    if (isCorrect) soundCorrect(); else soundWrong();
  }, 320);
}

// Tap card body to flip back and forth (not the Next button)
document.getElementById('flip-card')?.addEventListener('click', function(e) {
  if (!answered) return;
  if (e.target.id === 'btn-next' || e.target.closest('#btn-next')) return;
  soundFlip();
  const inner   = document.getElementById('flip-inner');
  const flipped = inner.classList.toggle('flipped');
  document.getElementById('flip-hint').innerText = flipped
    ? 'Flip back to review choices ↺'
    : 'Flip to see result ↺';
});

function nextQuestion(e) {
  e.stopPropagation();
  soundClick();
  if (pendingCorrect) { score++; currentPlayer.score++; updateDashboard(); }
  pendingCorrect = false;
  index++;
  if (index < currentQuestions.length) {
    showQ();
  } else {
    finishQuiz();
  }
}

function finishQuiz() {
  soundComplete();
  stopBgMusic();
  hideAllPanels();
  document.getElementById('result').classList.remove('hidden');
  document.getElementById('score').innerText =
    `${score} / ${currentQuestions.length} correct  —  ${currentPlayer.score} total pts`;
  const sorted = [...players].sort((a,b) => b.score - a.score);
  const rank   = sorted.findIndex(p => p.name === currentPlayer.name) + 1;
  document.getElementById('result-rank').innerText =
    `Your Rank: #${rank} of ${players.length} warriors`;
}

// ============================================================
// HIDE ALL
// ============================================================
function hideAllPanels() {
  ['player-login','player-dashboard','quiz','result','ranking'].forEach(id => {
    document.getElementById(id).classList.add('hidden');
  });
}

function goBack() {
  soundClick();
  stopBgMusic();
  hideAllPanels();
  document.getElementById('player-dashboard').classList.remove('hidden');
  updateDashboard();
}

// ============================================================
// RANKING
// ============================================================
function showRanking() {
  soundClick();
  hideAllPanels();
  document.getElementById('ranking').classList.remove('hidden');
  renderRanking();
}

function renderRanking() {
  const list = document.getElementById('rank-list');
  list.innerHTML = '';
  if (!players.length) {
    list.innerHTML = '<p class="no-players">No warriors yet. Be the first legend!</p>';
    return;
  }
  const sorted = [...players].sort((a,b) => b.score - a.score);
  const medals = ['🥇','🥈','🥉'];
  sorted.forEach((p, i) => {
    const isMe = currentPlayer && p.name === currentPlayer.name;
    const diff = p.difficulty || 'normal';
    const row  = document.createElement('div');
    row.className = 'rank-row' + (isMe ? ' rank-me' : '');
    row.innerHTML = `
      <span class="rank-pos">${medals[i] || '#'+(i+1)}</span>
      <img src="${p.avatar}" class="rank-avatar">
      <div class="rank-info">
        <span class="rank-name">${p.name}${isMe ? ' <span class="you-tag">YOU</span>' : ''}</span>
        <span class="rank-cat">${p.category} <span class="diff-badge ${diff}">${diff}</span></span>
      </div>
      <span class="rank-score">${p.score} pts</span>`;
    list.appendChild(row);
  });
}

// ============================================================
// DATABASE — full question bank
// ============================================================
const database = {
  javascript: {
    level1: [
      {q:"Which keyword declares a constant?",                  choices:["var","let","const","define"],                        a:"const"},
      {q:"Inside which HTML element do we put JavaScript?",     choices:["<js>","<scripting>","<script>","<javascript>"],      a:"<script>"},
      {q:"How do you write a comment in JavaScript?",           choices:["// comment","<!-- comment -->","# comment","** comment"], a:"// comment"},
      {q:"What does 'typeof' return for a number?",             choices:["'number'","'integer'","'float'","'num'"],            a:"'number'"},
      {q:"Which symbol is used for strict equality?",           choices:["==","!=","===","="],                                 a:"==="},
      {q:"How do you declare a variable in modern JS?",         choices:["var","let","dim","variable"],                       a:"let"},
      {q:"What is the output of typeof null?",                  choices:["'null'","'object'","'undefined'","'void'"],         a:"'object'"},
      {q:"Which method converts a string to uppercase?",        choices:["toUpperCase()","uppercase()","toUpper()","upper()"],a:"toUpperCase()"},
      {q:"How do you write 'Hello' to the console?",            choices:["console.log('Hello')","print('Hello')","log('Hello')","echo('Hello')"], a:"console.log('Hello')"},
      {q:"What does NaN stand for?",                            choices:["Not a Number","Null and None","Not any Notation","No assigned Name"], a:"Not a Number"},
      {q:"Which operator is used for exponentiation?",          choices:["^","**","^^","exp()"],                              a:"**"},
      {q:"What is the correct way to write an array?",          choices:["var a=(1,2,3)","var a=[1,2,3]","var a={1,2,3}","var a=<1,2,3>"], a:"var a=[1,2,3]"},
      {q:"How do you get the length of a string?",              choices:[".length",".size()",".count()",".len()"],            a:".length"},
      {q:"Which method removes the last element of an array?",  choices:["pop()","push()","shift()","splice()"],              a:"pop()"},
      {q:"What does 'undefined' mean in JS?",                   choices:["Variable declared but not assigned","Variable is null","Variable is zero","Variable is empty string"], a:"Variable declared but not assigned"},
      {q:"How do you create a function?",                       choices:["function myFunc(){}","func myFunc(){}","def myFunc():","create myFunc(){}"], a:"function myFunc(){}"},
      {q:"Which method adds an element to end of an array?",    choices:["push()","pop()","append()","add()"],                a:"push()"},
      {q:"How do you round a number to nearest integer?",       choices:["Math.round()","Math.floor()","Math.ceil()","round()"], a:"Math.round()"},
      {q:"How do you convert a string to a number?",            choices:["parseInt()","toNumber()","strToNum()","convert()"], a:"parseInt()"},
      {q:"What is the result of '5' + 3 in JS?",                choices:["'53'","8","53","Error"],                            a:"'53'"},
    ],
    level2: [
      {q:"What does the spread operator (...) do?",             choices:["Spreads array/object elements","Multiplies values","Creates a new scope","Joins strings"], a:"Spreads array/object elements"},
      {q:"What is a Promise in JavaScript?",                    choices:["An async operation placeholder","A strict variable","A loop type","A class method"], a:"An async operation placeholder"},
      {q:"Which method creates a new array by transforming each element?", choices:["map()","filter()","reduce()","forEach()"], a:"map()"},
      {q:"What does 'async/await' do?",                         choices:["Handles async code synchronously","Creates loops","Defines classes","Imports modules"], a:"Handles async code synchronously"},
      {q:"What is destructuring?",                              choices:["Unpacking values from arrays/objects","Deleting variables","Breaking a loop","Removing DOM elements"], a:"Unpacking values from arrays/objects"},
      {q:"Which method filters an array based on a condition?",  choices:["filter()","map()","find()","some()"],               a:"filter()"},
      {q:"What is the purpose of 'use strict'?",                choices:["Enforces stricter JS rules","Makes code faster","Locks variables","Disables console"], a:"Enforces stricter JS rules"},
      {q:"What does Object.keys() return?",                     choices:["Array of property names","Array of values","Array of entries","Number of keys"], a:"Array of property names"},
      {q:"What is a template literal?",                         choices:["String with backticks and ${}","A CSS template","An HTML template","A regular string"], a:"String with backticks and ${}"},
      {q:"Which method reduces an array to a single value?",    choices:["reduce()","map()","filter()","flat()"],              a:"reduce()"},
      {q:"What is 'hoisting' in JavaScript?",                   choices:["Moving declarations to the top","Lifting DOM elements","Optimizing loops","Caching variables"], a:"Moving declarations to the top"},
      {q:"What is an arrow function?",                          choices:["Shorter function syntax with =>","A function pointer","A recursive function","An async function"], a:"Shorter function syntax with =>"},
      {q:"What does JSON.parse() do?",                          choices:["Converts JSON string to JS object","Converts object to JSON","Validates JSON","Compresses JSON"], a:"Converts JSON string to JS object"},
      {q:"What is event bubbling?",                             choices:["Events propagate up the DOM","Events fire multiple times","Events are cancelled","Events are delayed"], a:"Events propagate up the DOM"},
      {q:"Which method finds the first matching element?",       choices:["find()","filter()","search()","match()"],           a:"find()"},
      {q:"What does 'fetch()' return?",                         choices:["A Promise","A string","An object","A boolean"],     a:"A Promise"},
      {q:"What is optional chaining (?.) for?",                 choices:["Safely access nested properties","A loop shortcut","A ternary shorthand","A null check"], a:"Safely access nested properties"},
      {q:"What does the nullish coalescing operator (??) do?",   choices:["Returns right side if left is null/undefined","Checks equality","Chains promises","Assigns null"], a:"Returns right side if left is null/undefined"},
      {q:"What does Array.from() do?",                          choices:["Creates array from iterable","Copies an array","Merges arrays","Sorts an array"], a:"Creates array from iterable"},
      {q:"What does localStorage store?",                       choices:["Persistent key-value pairs","Temporary session data","Cookies","Server data"], a:"Persistent key-value pairs"},
    ],
    level3: [
      {q:"What is the Event Loop?",                             choices:["Mechanism handling async callbacks","A for loop type","A DOM event","A CSS animation"], a:"Mechanism handling async callbacks"},
      {q:"What is a Proxy object?",                             choices:["Intercepts object operations","A cached object","A cloned object","A frozen object"], a:"Intercepts object operations"},
      {q:"What does Object.freeze() do?",                       choices:["Prevents object modification","Copies an object","Seals an object","Deletes properties"], a:"Prevents object modification"},
      {q:"What is memoization?",                                choices:["Caching function results","Memorizing variables","Looping efficiently","Storing in localStorage"], a:"Caching function results"},
      {q:"What is the prototype chain?",                        choices:["Inheritance lookup mechanism","A CSS chain","A promise chain","A function chain"], a:"Inheritance lookup mechanism"},
      {q:"What is a microtask?",                                choices:["High-priority async task (e.g. Promise)","A small function","A setTimeout callback","A DOM mutation"], a:"High-priority async task (e.g. Promise)"},
      {q:"What does structuredClone() do?",                     choices:["Deep clones an object","Shallow copies","Freezes an object","Serializes to JSON"], a:"Deep clones an object"},
      {q:"What is currying?",                                   choices:["Transforming f(a,b) into f(a)(b)","A loop pattern","A sorting method","An array method"], a:"Transforming f(a,b) into f(a)(b)"},
      {q:"What does Symbol.iterator define?",                   choices:["Custom iteration behavior","Symbol creation","Event handling","Type checking"], a:"Custom iteration behavior"},
      {q:"What does Reflect.apply() do?",                       choices:["Calls a function with given args","Reflects DOM","Applies styles","Mirrors an object"], a:"Calls a function with given args"},
      {q:"What is a generator function?",                       choices:["A function that can pause and resume","A random number creator","A factory function","A class constructor"], a:"A function that can pause and resume"},
      {q:"What is a Blob in JavaScript?",                       choices:["Binary large object","A DOM node","An array buffer","A JSON object"], a:"Binary large object"},
      {q:"What is lazy evaluation?",                            choices:["Delaying computation until needed","Slow loops","Deferred promises","Late variable declaration"], a:"Delaying computation until needed"},
      {q:"What does the 'in' operator check?",                  choices:["If property exists in object","If value is in array","If string contains substring","If variable is defined"], a:"If property exists in object"},
      {q:"What is a WeakRef?",                                  choices:["Weak reference to an object","A weak variable","A ref hook","A null reference"], a:"Weak reference to an object"},
    ],
    level4: [
      {q:"What is a Service Worker?",                           choices:["Script running in background for PWA","A web worker thread","A server-side script","A DOM listener"], a:"Script running in background for PWA"},
      {q:"What is the Virtual DOM?",                            choices:["In-memory DOM representation","A hidden DOM","A faster DOM","A shadow DOM"], a:"In-memory DOM representation"},
      {q:"What does WebAssembly enable?",                       choices:["Running compiled code in browser","Web animations","Assembly-like CSS","Binary HTML"], a:"Running compiled code in browser"},
      {q:"What is tree shaking?",                               choices:["Removing unused code at build time","A DOM traversal","A garbage collection","A sorting algorithm"], a:"Removing unused code at build time"},
      {q:"What is code splitting?",                             choices:["Loading JS in chunks on demand","Splitting strings","Dividing functions","Breaking loops"], a:"Loading JS in chunks on demand"},
      {q:"What does Intersection Observer do?",                 choices:["Detects element visibility","Observes mutations","Tracks performance","Monitors network"], a:"Detects element visibility"},
      {q:"What does requestAnimationFrame do?",                 choices:["Schedules animation before next repaint","Creates CSS animations","Requests GPU resources","Delays a function"], a:"Schedules animation before next repaint"},
      {q:"What does top-level await enable?",                   choices:["await outside async functions in modules","Global async","Top-level promises","Awaiting DOM"], a:"await outside async functions in modules"},
      {q:"What is the Observer pattern?",                       choices:["Notifying dependents of state changes","Watching DOM changes","A MutationObserver","An event listener"], a:"Notifying dependents of state changes"},
      {q:"What is a BroadcastChannel?",                         choices:["Messaging between browsing contexts","A web socket","A server channel","A stream channel"], a:"Messaging between browsing contexts"},
      {q:"What is module federation?",                          choices:["Sharing modules across apps at runtime","Federating imports","Bundling modules","Splitting modules"], a:"Sharing modules across apps at runtime"},
      {q:"What is declarative shadow DOM?",                     choices:["Server-rendered shadow DOM","A React pattern","A CSS feature","A DOM template"], a:"Server-rendered shadow DOM"},
    ],
    level5: [
      {q:"What is the difference between microtasks and macrotasks?", choices:["Microtasks run before macrotasks after each task","Macrotasks run first","They run simultaneously","They are the same"], a:"Microtasks run before macrotasks after each task"},
      {q:"What is temporal dead zone (TDZ)?",                   choices:["Period before let/const initialization","A deleted variable","A null zone","A frozen scope"], a:"Period before let/const initialization"},
      {q:"How does V8's JIT compilation work?",                 choices:["Compiles hot code paths to machine code","Interprets JS directly","Transpiles to bytecode only","Compiles all code upfront"], a:"Compiles hot code paths to machine code"},
      {q:"What is a monad in functional JS?",                   choices:["A design pattern for chaining computations","A loop abstraction","A type system","A class pattern"], a:"A design pattern for chaining computations"},
      {q:"What is trampolining in JS?",                         choices:["Replacing recursion with iteration to avoid stack overflow","A DOM technique","An animation trick","A caching pattern"], a:"Replacing recursion with iteration to avoid stack overflow"},
      {q:"What is referential transparency?",                   choices:["Same input always produces same output","Transparent references","Immutable variables","Pure imports"], a:"Same input always produces same output"},
      {q:"What is isomorphic JavaScript?",                      choices:["Code that runs on both server and client","Platform-independent JS","Universal imports","Cross-browser JS"], a:"Code that runs on both server and client"},
      {q:"What is algebraic effect handling?",                  choices:["Managing side effects with resumable handlers","Algebraic math in JS","Type-level effects","Effect decorators"], a:"Managing side effects with resumable handlers"},
      {q:"What is point-free style?",                           choices:["Defining functions without naming arguments","No dot notation","Arrow functions only","No return statements"], a:"Defining functions without naming arguments"},
      {q:"What does 'Functor' mean in JS?",                     choices:["An object with a mappable interface","A factory function","A functional component","A constructor"], a:"An object with a mappable interface"},
      {q:"What is a lens in functional programming?",           choices:["A composable getter/setter for nested data","A view abstraction","A data pipe","A selector"], a:"A composable getter/setter for nested data"},
      {q:"What is deoptimization in V8?",                       choices:["Falling back from compiled to interpreted code","A CSS operation","A failed import","A GC event"], a:"Falling back from compiled to interpreted code"},
    ],
  },
  python: {
    level1: [
      {q:"How do you print 'Hello World' in Python?",           choices:["print('Hello World')","echo('Hello World')","console.log('Hello World')","printf('Hello World')"], a:"print('Hello World')"},
      {q:"Which keyword creates a function in Python?",         choices:["function","def","func","create"],                   a:"def"},
      {q:"How do you write a single-line comment in Python?",   choices:["// comment","# comment","/* comment */","-- comment"], a:"# comment"},
      {q:"What is the correct file extension for Python files?", choices:[".py",".pt",".python",".pyt"],                     a:".py"},
      {q:"How do you create a list in Python?",                 choices:["list=(1,2,3)","list=[1,2,3]","list={1,2,3}","list=<1,2,3>"], a:"list=[1,2,3]"},
      {q:"What does len() do?",                                 choices:["Returns length of object","Loops through object","Creates a list","Converts to integer"], a:"Returns length of object"},
      {q:"How do you start an if statement in Python?",         choices:["if x == 1:","if (x == 1)","if x == 1 then","if x == 1 {"], a:"if x == 1:"},
      {q:"What is the output of type(42)?",                     choices:["<class 'int'>","<class 'float'>","<class 'str'>","<class 'num'>"], a:"<class 'int'>"},
      {q:"How do you create a variable in Python?",             choices:["var x=5","int x=5","x=5","let x=5"],               a:"x=5"},
      {q:"Which operator is used for integer division?",        choices:["//","/","÷","%"],                                   a:"//"},
      {q:"What does 'not' do in Python?",                       choices:["Logical negation","Checks inequality","Removes element","Stops loop"], a:"Logical negation"},
      {q:"What does range(5) generate?",                        choices:["0 to 4","1 to 5","0 to 5","1 to 4"],               a:"0 to 4"},
      {q:"What is a tuple?",                                    choices:["An immutable sequence","A mutable list","A dictionary","A set"], a:"An immutable sequence"},
      {q:"What does input() do?",                               choices:["Takes user input as string","Reads a file","Imports a module","Creates input field"], a:"Takes user input as string"},
      {q:"What does append() do to a list?",                    choices:["Adds element to end","Removes element","Sorts list","Copies list"], a:"Adds element to end"},
      {q:"How do you create a dictionary?",                     choices:["{'key':'value'}","['key','value']","('key','value')","<key:value>"], a:"{'key':'value'}"},
      {q:"How do you import a module?",                         choices:["import module","include module","require module","using module"], a:"import module"},
      {q:"What does the 'pass' statement do?",                  choices:["Does nothing, placeholder","Passes a value","Skips a loop","Returns None"], a:"Does nothing, placeholder"},
      {q:"What is None in Python?",                             choices:["Absence of value","Zero","Empty string","False"],   a:"Absence of value"},
      {q:"How do you repeat a string 3 times?",                 choices:["str * 3","str + 3","str ** 3","repeat(str,3)"],    a:"str * 3"},
    ],
    level2: [
      {q:"What is a list comprehension?",                       choices:["Compact way to create lists","A loop","A filter function","A sorted list"], a:"Compact way to create lists"},
      {q:"What does *args allow?",                              choices:["Variable positional arguments","Pointer args","Required args","Array args"], a:"Variable positional arguments"},
      {q:"What is a lambda function?",                          choices:["Anonymous one-line function","A named function","A recursive function","A class method"], a:"Anonymous one-line function"},
      {q:"What does map() do?",                                 choices:["Applies function to each iterable item","Creates a map","Loops through a list","Returns a dictionary"], a:"Applies function to each iterable item"},
      {q:"What is the difference between a list and a tuple?",  choices:["Lists are mutable, tuples are immutable","Lists are faster","Tuples can be sorted","No difference"], a:"Lists are mutable, tuples are immutable"},
      {q:"What does zip() do?",                                 choices:["Combines multiple iterables","Compresses files","Joins strings","Creates a set"], a:"Combines multiple iterables"},
      {q:"What is a generator?",                                choices:["Lazy iterator yielding values","A factory function","A class constructor","A comprehension"], a:"Lazy iterator yielding values"},
      {q:"What does enumerate() do?",                           choices:["Adds index to iterable","Counts items","Numbers a list","Creates tuples"], a:"Adds index to iterable"},
      {q:"What is the purpose of 'with' statement?",            choices:["Context manager for resource handling","A condition","A loop","An import statement"], a:"Context manager for resource handling"},
      {q:"What is string formatting with f-strings?",           choices:["f'Hello {name}' syntax","format() method","% formatting","Template strings"], a:"f'Hello {name}' syntax"},
      {q:"What does filter() do?",                              choices:["Filters items by function condition","Removes all items","Sorts items","Maps items"], a:"Filters items by function condition"},
      {q:"What is a set in Python?",                            choices:["Unordered collection of unique items","An ordered list","A frozen tuple","A dictionary without values"], a:"Unordered collection of unique items"},
      {q:"What does sorted() return?",                          choices:["A new sorted list","Sorts in place","A sorted iterator","A tuple"], a:"A new sorted list"},
      {q:"What does try/except do?",                            choices:["Handles exceptions","Tries a loop","Tests conditions","Imports safely"], a:"Handles exceptions"},
      {q:"What does __init__ do?",                              choices:["Initializes a class instance","Imports a module","Creates a list","Defines a module"], a:"Initializes a class instance"},
      {q:"What does super() do?",                               choices:["Calls parent class method","Creates superclass","Deletes parent","Copies parent"], a:"Calls parent class method"},
      {q:"What is a decorator?",                                choices:["A function wrapping another function","A class attribute","A CSS-like modifier","A template"], a:"A function wrapping another function"},
      {q:"What does list.sort() do?",                           choices:["Sorts list in place","Returns sorted list","Creates new list","Reverses list"], a:"Sorts list in place"},
      {q:"What is slicing in Python?",                          choices:["Extracting a portion of a sequence","Splitting a string","Removing items","Copying a list"], a:"Extracting a portion of a sequence"},
      {q:"What does 'yield' do in a generator?",                choices:["Pauses and returns a value","Returns and exits","Yields to another thread","Skips iteration"], a:"Pauses and returns a value"},
    ],
    level3: [
      {q:"What is a metaclass?",                                choices:["A class that creates classes","A base class","An abstract class","A class decorator"], a:"A class that creates classes"},
      {q:"What is the GIL?",                                    choices:["Global Interpreter Lock limiting threads","A global variable","A garbage collector","A loop limiter"], a:"Global Interpreter Lock limiting threads"},
      {q:"What is a descriptor?",                               choices:["Object defining __get__, __set__, __delete__","A function annotation","A docstring","A method decorator"], a:"Object defining __get__, __set__, __delete__"},
      {q:"What is monkey patching?",                            choices:["Modifying code at runtime","A debugging technique","A testing pattern","A refactoring method"], a:"Modifying code at runtime"},
      {q:"What does functools.lru_cache do?",                   choices:["Caches function results","Loops with cache","Creates cached lists","Runs functions lazily"], a:"Caches function results"},
      {q:"What is a coroutine?",                                choices:["A function that can suspend execution","A co-process","A thread","A generator"], a:"A function that can suspend execution"},
      {q:"What does asyncio.gather() do?",                      choices:["Runs multiple coroutines concurrently","Gathers data","Joins threads","Collects results"], a:"Runs multiple coroutines concurrently"},
      {q:"What is a data class?",                               choices:["A class auto-generating boilerplate","A class holding data only","A database model","A NamedTuple"], a:"A class auto-generating boilerplate"},
      {q:"What does copy.deepcopy do?",                         choices:["Creates a fully independent copy","Copies references","Clones a class","Copies module"], a:"Creates a fully independent copy"},
      {q:"What does __repr__ do?",                              choices:["Returns developer-friendly string","Represents as number","Creates repr object","Defines print behavior"], a:"Returns developer-friendly string"},
      {q:"What does __slots__ do?",                             choices:["Restricts instance attributes","Creates slots in GUI","Locks class attributes","Defines class methods"], a:"Restricts instance attributes"},
      {q:"What does __new__ do?",                               choices:["Creates a new instance","Initializes instance","Creates a class","Copies an object"], a:"Creates a new instance"},
      {q:"What does itertools.chain() do?",                     choices:["Chains multiple iterables","Chains functions","Creates a linked list","Connects generators"], a:"Chains multiple iterables"},
      {q:"What does __call__ enable?",                          choices:["Makes an instance callable","Calls a method","Creates a call stack","Invokes a decorator"], a:"Makes an instance callable"},
      {q:"What is the purpose of the typing module?",           choices:["Type hints and annotations","Runtime type checking","Type conversion","Static typing"], a:"Type hints and annotations"},
    ],
    level4: [
      {q:"What is CPython?",                                    choices:["Reference implementation of Python in C","A Python compiler","A Python optimizer","A Python IDE"], a:"Reference implementation of Python in C"},
      {q:"What is PyPy?",                                       choices:["Python implementation with JIT compiler","A Python package","A testing framework","A Python IDE"], a:"Python implementation with JIT compiler"},
      {q:"What does __mro__ represent?",                        choices:["Method Resolution Order","Module run order","Method registry","Memory reference order"], a:"Method Resolution Order"},
      {q:"What does ctypes allow?",                             choices:["Calling C libraries from Python","C-type variables","Compiled types","C-extension types"], a:"Calling C libraries from Python"},
      {q:"What does multiprocessing.Pool do?",                  choices:["Manages worker process pool","Creates threads","Pools memory","Manages coroutines"], a:"Manages worker process pool"},
      {q:"What does pickle module do?",                         choices:["Serializes Python objects","Pickles data types","Compresses data","Encrypts objects"], a:"Serializes Python objects"},
      {q:"What does dis module do?",                            choices:["Disassembles Python bytecode","Displays objects","Disconnects imports","Distributes tasks"], a:"Disassembles Python bytecode"},
      {q:"What does ast module provide?",                       choices:["Abstract Syntax Tree manipulation","Assembly tools","Attribute scanning","Async task tools"], a:"Abstract Syntax Tree manipulation"},
      {q:"What does heapq module provide?",                     choices:["Heap queue algorithm","Hash queue","Heavy queue","Header queue"], a:"Heap queue algorithm"},
      {q:"What is a NamedTuple?",                               choices:["Tuple with named fields","A named list","A typed dict","A labeled set"], a:"Tuple with named fields"},
      {q:"What is a semaphore in threading?",                   choices:["Controls access with a counter","A signal type","A mutex lock","A thread pool"], a:"Controls access with a counter"},
      {q:"What is __hash__ used for?",                          choices:["Returns integer hash for use in dicts/sets","Hashes a string","Creates hash map","Validates equality"], a:"Returns integer hash for use in dicts/sets"},
    ],
    level5: [
      {q:"What is the difference between concurrency and parallelism?", choices:["Concurrency manages multiple tasks, parallelism runs them simultaneously","They are the same","Parallelism is single-threaded","Concurrency uses multiple CPUs"], a:"Concurrency manages multiple tasks, parallelism runs them simultaneously"},
      {q:"What does the walrus operator := do?",                choices:["Assigns and returns value in expression","Walrus pattern match","Assigns a variable","Compares values"], a:"Assigns and returns value in expression"},
      {q:"What is structural pattern matching?",                choices:["Match/case statement matching data shapes","A regex pattern","A class structure","An import pattern"], a:"Match/case statement matching data shapes"},
      {q:"What is a TypeVarTuple?",                             choices:["A variadic generic type parameter","A tuple type variable","A type for tuples","A list of TypeVars"], a:"A variadic generic type parameter"},
      {q:"What does ParamSpec capture?",                        choices:["Captures function parameter types for higher-order functions","Parameter specifications","A function spec","Call signatures"], a:"Captures function parameter types for higher-order functions"},
      {q:"What is free threading in Python 3.13?",              choices:["Experimental GIL-free mode","Free thread creation","Lightweight threads","Thread pooling"], a:"Experimental GIL-free mode"},
      {q:"What is an Annotated type?",                          choices:["Type with attached metadata","An annotated variable","A commented type","A documented type"], a:"Type with attached metadata"},
      {q:"What is a memory view in Python?",                    choices:["A buffer protocol object accessing memory directly","A memory snapshot","A view of variables","A memory log"], a:"A buffer protocol object accessing memory directly"},
      {q:"What is ExceptionGroup?",                             choices:["Groups multiple exceptions together","A list of exceptions","An exception handler","A multi-catch block"], a:"Groups multiple exceptions together"},
      {q:"What is type narrowing in Python?",                   choices:["Refining a type within a conditional branch","Casting a type","Removing type hints","Strict typing"], a:"Refining a type within a conditional branch"},
    ],
  }
};