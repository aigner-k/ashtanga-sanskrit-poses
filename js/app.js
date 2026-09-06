// Ashtanga Sanskrit Poses — App-Logik (Explore- & Prüfungsmodus)

const STORAGE_KEY = 'ashtanga-pose-progress-v1';

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch (e) {
    return {};
  }
}
function saveProgress(p) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch (e) {}
}
let progress = loadProgress();

function recordResult(poseId, correct) {
  const e = progress[poseId] || { seen: 0, correct: 0, wrong: 0 };
  e.seen++;
  if (correct) e.correct++; else e.wrong++;
  progress[poseId] = e;
  saveProgress(progress);
}
function markSeen(poseId) {
  const e = progress[poseId] || { seen: 0, correct: 0, wrong: 0 };
  e.seen++;
  progress[poseId] = e;
  saveProgress(progress);
}
function weightFor(poseId) {
  const e = progress[poseId];
  if (!e) return 4; // nie gesehen -> hohe Priorität
  const ratio = e.correct / Math.max(1, e.seen);
  if (ratio < 0.5) return 3;
  if (ratio < 0.85) return 2;
  return 1;
}

function speak(text) {
  if (!('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/\(.*?\)/g, ''));
    u.rate = 0.85;
    u.pitch = 1;
    window.speechSynthesis.speak(u);
  } catch (e) {}
}

const root = document.getElementById('app');
let state = { mode: 'home' };

// ---------------------------------------------------------------- Router
function setMode(mode) {
  document.querySelectorAll('nav.modes button').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
  if (mode === 'shuffle' || mode === 'guess') {
    startCardSession(mode, cardFilter);
  } else {
    state = { mode };
    render();
  }
}

function render() {
  if (state.mode === 'home') renderHome();
  else if (state.mode === 'explore') renderExplore();
  else if (state.mode === 'exam-setup') renderExamSetup();
  else if (state.mode === 'exam-run') renderExamRun();
  else if (state.mode === 'exam-results') renderExamResults();
  else if (state.mode === 'shuffle' || state.mode === 'guess') renderCardMode();
  else if (state.mode === 'card-summary') renderCardSummary();
}

// ---------------------------------------------------------------- Home
function overallStats() {
  const total = POSES.length;
  let mastered = 0;
  POSES.forEach(p => {
    const e = progress[p.id];
    if (e && e.seen > 0 && e.correct / e.seen >= 0.85 && e.seen >= 2) mastered++;
  });
  return { total, mastered };
}

function renderHome() {
  const { total, mastered } = overallStats();
  const pct = Math.round((mastered / total) * 100);
  root.innerHTML = `
    <div class="home-hero">
      <h2>नमस्ते 🙏 Lerne die Sanskrit-Namen der Ashtanga-Yoga-Posen</h2>
      <p>Primary Series (Yoga Chikitsa) — Sanskrit, Aussprache, Englisch &amp; Deutsch, mit visuellem Piktogramm zu jeder Haltung.</p>
    </div>
    <div class="mode-cards">
      <div class="mode-card" id="card-explore">
        <div class="icon">🧘</div>
        <h3>Explore-Modus</h3>
        <p>Alle ${total} Posen in Ruhe durchblättern, anhören und die Details lernen — ganz ohne Zeitdruck.</p>
      </div>
      <div class="mode-card" id="card-shuffle">
        <div class="icon">🔀</div>
        <h3>Shuffle-Modus</h3>
        <p>Gemischte Lernkärtchen im Tinder-Stil: nach rechts wischen für „kenn ich“, nach links für „noch üben“.</p>
      </div>
      <div class="mode-card" id="card-guess">
        <div class="icon">👆</div>
        <h3>Erraten-Modus</h3>
        <p>Bild &amp; Übersetzung sehen, den Sanskrit-Namen im Kopf raten, dann antippen zum Aufdecken.</p>
      </div>
      <div class="mode-card" id="card-exam">
        <div class="icon">📝</div>
        <h3>Prüfungsmodus</h3>
        <p>Multiple-Choice-Fragen zu Bild, Name und Übersetzung. Schwache Posen kommen häufiger dran.</p>
      </div>
    </div>
    <div class="progress-overview">
      <h4>Dein Lernfortschritt</h4>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
      <div class="progress-stats"><span>${mastered} von ${total} Posen sicher gelernt</span><span>${pct}%</span></div>
    </div>
  `;
  document.getElementById('card-explore').onclick = () => setMode('explore');
  document.getElementById('card-shuffle').onclick = () => setMode('shuffle');
  document.getElementById('card-guess').onclick = () => setMode('guess');
  document.getElementById('card-exam').onclick = () => setMode('exam-setup');
}

// ---------------------------------------------------------------- Explore
let exploreState = { filter: 'all', selectedId: POSES[0].id };

function filteredPoses() {
  if (exploreState.filter === 'all') return POSES;
  return POSES.filter(p => p.category === exploreState.filter);
}

function renderExplore() {
  const list = filteredPoses();
  if (!list.find(p => p.id === exploreState.selectedId)) exploreState.selectedId = list[0].id;
  const pose = POSES.find(p => p.id === exploreState.selectedId);
  markSeen(pose.id);

  let bySection = {};
  list.forEach(p => { (bySection[p.section] = bySection[p.section] || []).push(p); });

  root.innerHTML = `
    <div class="filter-chips">
      ${CATEGORIES.map(c => `<button class="chip ${exploreState.filter === c.id ? 'active' : ''}" data-cat="${c.id}">${c.label}</button>`).join('')}
    </div>
    <div class="explore-layout">
      <div class="pose-list">
        ${Object.entries(bySection).map(([section, poses]) => `
          <div class="pose-list-section-label">${section}</div>
          ${poses.map(p => {
            const e = progress[p.id];
            const learned = e && e.seen > 0 && e.correct / e.seen >= 0.85 && e.seen >= 2;
            return `<div class="pose-list-item ${p.id === pose.id ? 'selected' : ''}" data-id="${p.id}">
              <span>${p.sanskrit}</span>
              ${learned ? '<span class="badge">✓ gelernt</span>' : ''}
            </div>`;
          }).join('')}
        `).join('')}
      </div>
      <div class="detail-card">
        <div class="detail-top">
          <div class="pose-figure"><svg viewBox="0 0 100 100">${renderShape(pose.shape)}</svg></div>
          <div class="pose-info">
            <span class="tag">${pose.section}</span>
            <h2>${pose.sanskrit}</h2>
            <div class="pronounce-row">
              <span>${pose.pronunciation}</span>
              <button class="speak-btn" title="Aussprache anhören" id="speak-btn">🔊</button>
            </div>
            <div class="titles-grid">
              <div class="title-box"><div class="lbl">Englisch</div><div class="val">${pose.english}</div></div>
              <div class="title-box"><div class="lbl">Deutsch</div><div class="val">${pose.german}</div></div>
            </div>
            ${pose.note ? `<div class="pose-note">${pose.note}</div>` : ''}
          </div>
        </div>
        <div class="detail-nav">
          <button id="prev-btn">← Vorherige</button>
          <button id="next-btn">Nächste →</button>
        </div>
      </div>
    </div>
  `;

  document.querySelectorAll('.chip').forEach(b => b.onclick = () => { exploreState.filter = b.dataset.cat; renderExplore(); });
  document.querySelectorAll('.pose-list-item').forEach(el => el.onclick = () => { exploreState.selectedId = el.dataset.id; renderExplore(); });
  document.getElementById('speak-btn').onclick = () => speak(pose.sanskrit);
  document.getElementById('prev-btn').onclick = () => {
    const idx = list.findIndex(p => p.id === pose.id);
    exploreState.selectedId = list[(idx - 1 + list.length) % list.length].id;
    renderExplore();
  };
  document.getElementById('next-btn').onclick = () => {
    const idx = list.findIndex(p => p.id === pose.id);
    exploreState.selectedId = list[(idx + 1) % list.length].id;
    renderExplore();
  };
}

// ---------------------------------------------------------------- Shuffle- & Erraten-Modus (Karten)
let cardFilter = 'all';
let cardSession = null;

function shuffleArr(arr) { return arr.map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(v => v[1]); }

function startCardSession(mode, filterId) {
  cardFilter = filterId || 'all';
  const pool = cardFilter === 'all' ? POSES : POSES.filter(p => p.category === cardFilter);
  const usable = pool.length ? pool : POSES;
  cardSession = { mode, deck: shuffleArr(usable), index: 0, flipped: false, known: [], practice: [], transitioning: false };
  state = { mode };
  renderCardMode();
}

function canRateCard() {
  return cardSession.mode === 'shuffle' || cardSession.flipped;
}

function cardFaceContent(pose) {
  return `
    <span class="tag">${pose.section}</span>
    <div class="card-figure"><svg viewBox="0 0 100 100">${renderShape(pose.shape)}</svg></div>
    <div class="card-name">${pose.sanskrit}</div>
    <div class="card-pron">${pose.pronunciation}</div>
    <div class="card-titles">
      <div class="title-box"><div class="lbl">Englisch</div><div class="val">${pose.english}</div></div>
      <div class="title-box"><div class="lbl">Deutsch</div><div class="val">${pose.german}</div></div>
    </div>
  `;
}

function flipCardContent(pose) {
  return `
    <div class="flip-card-inner">
      <div class="flip-face front">
        <span class="tag">${pose.section}</span>
        <div class="card-figure"><svg viewBox="0 0 100 100">${renderShape(pose.shape)}</svg></div>
        <div class="card-titles">
          <div class="title-box"><div class="lbl">Englisch</div><div class="val">${pose.english}</div></div>
          <div class="title-box"><div class="lbl">Deutsch</div><div class="val">${pose.german}</div></div>
        </div>
      </div>
      <div class="flip-face back">
        <span class="tag">${pose.section}</span>
        <div class="card-name">${pose.sanskrit}</div>
        <div class="card-pron">${pose.pronunciation}</div>
        <div class="card-titles small">
          <div class="title-box"><div class="lbl">Englisch</div><div class="val">${pose.english}</div></div>
          <div class="title-box"><div class="lbl">Deutsch</div><div class="val">${pose.german}</div></div>
        </div>
      </div>
    </div>
  `;
}

function renderCardMode() {
  if (cardSession.index >= cardSession.deck.length) { renderCardSummary(); return; }
  const pose = cardSession.deck[cardSession.index];
  const isGuess = cardSession.mode === 'guess';
  const title = isGuess ? '👆 Erraten-Modus' : '🔀 Shuffle-Modus';
  const rateable = canRateCard();

  root.innerHTML = `
    <div class="card-mode-header">
      <div class="filter-chips">
        ${CATEGORIES.map(c => `<button class="chip ${cardFilter === c.id ? 'active' : ''}" data-cat="${c.id}">${c.label}</button>`).join('')}
      </div>
      <div class="card-progress">
        <span>${title} — Karte ${cardSession.index + 1} / ${cardSession.deck.length}</span>
        <span class="tally"><span class="tally-yes">✓ ${cardSession.known.length}</span> <span class="tally-no">✗ ${cardSession.practice.length}</span></span>
      </div>
    </div>
    <div class="card-stack">
      <div class="stack-peek"></div>
      <div class="swipe-card ${isGuess ? 'flip-card' : ''} ${isGuess && cardSession.flipped ? 'flipped' : ''}" id="swipe-card">
        <div class="stamp stamp-yes">✓ KENN ICH</div>
        <div class="stamp stamp-no">✗ NOCHMAL</div>
        ${isGuess ? flipCardContent(pose) : `<div class="card-face">${cardFaceContent(pose)}</div>`}
      </div>
    </div>
    <div class="card-hint">${isGuess && !cardSession.flipped ? 'Tippen, um den Sanskrit-Namen aufzudecken' : 'Wischen: ← noch üben · kenn ich schon →'}</div>
    <div class="rate-buttons ${rateable ? '' : 'disabled'}">
      <button id="rate-no" aria-label="Noch nicht">✗</button>
      <button id="speak-card-btn" aria-label="Aussprache anhören">🔊</button>
      <button id="rate-yes" aria-label="Kenn ich">✓</button>
    </div>
  `;

  document.querySelectorAll('.filter-chips .chip').forEach(b => b.onclick = () => startCardSession(cardSession.mode, b.dataset.cat));
  document.getElementById('speak-card-btn').onclick = () => speak(pose.sanskrit);
  document.getElementById('rate-no').onclick = () => { if (canRateCard() && !cardSession.transitioning) triggerCardSwipe(-1); };
  document.getElementById('rate-yes').onclick = () => { if (canRateCard() && !cardSession.transitioning) triggerCardSwipe(1); };

  const cardEl = document.getElementById('swipe-card');
  let drag = null;

  function setStampOpacity(dx) {
    const yes = cardEl.querySelector('.stamp-yes');
    const no = cardEl.querySelector('.stamp-no');
    const t = Math.min(Math.abs(dx) / 90, 1);
    if (dx > 0) { yes.style.opacity = t; no.style.opacity = 0; }
    else { no.style.opacity = t; yes.style.opacity = 0; }
  }
  function resetCard() {
    cardEl.style.transform = '';
    cardEl.style.opacity = '';
    cardEl.querySelectorAll('.stamp').forEach(s => s.style.opacity = 0);
  }

  cardEl.addEventListener('pointerdown', e => {
    if (cardSession.transitioning) return;
    drag = { sx: e.clientX, sy: e.clientY, dx: 0, moved: false };
    cardEl.setPointerCapture(e.pointerId);
    cardEl.style.transition = 'none';
  });
  cardEl.addEventListener('pointermove', e => {
    if (!drag) return;
    drag.dx = e.clientX - drag.sx;
    const dy = e.clientY - drag.sy;
    if (Math.abs(drag.dx) > 6 || Math.abs(dy) > 6) drag.moved = true;
    if (canRateCard()) {
      cardEl.style.transform = `translate(${drag.dx}px, ${dy * 0.3}px) rotate(${drag.dx / 14}deg)`;
      setStampOpacity(drag.dx);
    }
  });
  function endDrag() {
    if (!drag) return;
    const { dx, moved } = drag;
    drag = null;
    cardEl.style.transition = 'transform .3s ease, opacity .3s ease';
    if (!moved) {
      if (isGuess && !cardSession.flipped) {
        cardSession.flipped = true;
        renderCardMode();
      } else {
        resetCard();
      }
      return;
    }
    if (canRateCard() && Math.abs(dx) > 80) {
      triggerCardSwipe(dx > 0 ? 1 : -1);
    } else {
      resetCard();
    }
  }
  cardEl.addEventListener('pointerup', endDrag);
  cardEl.addEventListener('pointercancel', () => { drag = null; resetCard(); });

  function triggerCardSwipe(direction) {
    cardSession.transitioning = true;
    cardEl.style.transition = 'transform .35s ease, opacity .35s ease';
    cardEl.style.transform = `translate(${direction * 520}px, -30px) rotate(${direction * 25}deg)`;
    cardEl.style.opacity = '0';
    const correct = direction === 1;
    recordResult(pose.id, correct);
    if (correct) cardSession.known.push(pose); else cardSession.practice.push(pose);
    setTimeout(() => {
      cardSession.index++;
      cardSession.flipped = false;
      cardSession.transitioning = false;
      renderCardMode();
    }, 260);
  }
}

document.addEventListener('keydown', e => {
  if (!cardSession || !(state.mode === 'shuffle' || state.mode === 'guess')) return;
  if (cardSession.transitioning || cardSession.index >= cardSession.deck.length) return;
  const noBtn = document.getElementById('rate-no');
  const yesBtn = document.getElementById('rate-yes');
  if (e.key === 'ArrowRight' && canRateCard() && yesBtn) yesBtn.click();
  else if (e.key === 'ArrowLeft' && canRateCard() && noBtn) noBtn.click();
  else if (e.key === ' ' && cardSession.mode === 'guess' && !cardSession.flipped) {
    e.preventDefault();
    cardSession.flipped = true;
    renderCardMode();
  }
});

function renderCardSummary() {
  state.mode = 'card-summary';
  const { known, practice, deck, mode } = cardSession;
  root.innerHTML = `
    <div class="results-card">
      <div class="score">${known.length} / ${deck.length}</div>
      <div class="score-sub">als „kenn ich“ markiert</div>
      ${practice.length ? `
        <div class="review-list">
          <strong>Zum Wiederholen:</strong>
          ${practice.map(p => `<div class="review-item"><span>${p.sanskrit}</span><span>${p.german}</span></div>`).join('')}
        </div>` : '<p>🎉 Alle Karten gewusst!</p>'}
      <div class="results-actions">
        <button class="secondary-btn" id="back-home">Zur Startseite</button>
        ${practice.length ? '<button class="secondary-btn" id="retry-practice">Nur Unsichere wiederholen</button>' : ''}
        <button class="primary-btn" id="reshuffle">🔀 Neu mischen</button>
      </div>
    </div>
  `;
  document.getElementById('back-home').onclick = () => setMode('home');
  document.getElementById('reshuffle').onclick = () => startCardSession(mode, cardFilter);
  const retryBtn = document.getElementById('retry-practice');
  if (retryBtn) retryBtn.onclick = () => {
    cardSession = { mode, deck: shuffleArr(practice), index: 0, flipped: false, known: [], practice: [], transitioning: false };
    state = { mode };
    renderCardMode();
  };
}

// ---------------------------------------------------------------- Exam Setup
let examConfig = {
  category: 'all',
  count: 15,
  types: { visualToName: true, nameToTranslation: true, translationToName: true, nameToVisual: true },
};

function renderExamSetup() {
  root.innerHTML = `
    <div class="exam-setup">
      <h3>📝 Prüfungsmodus einrichten</h3>
      <div class="setup-row">
        <label class="section-label">Themenbereich</label>
        <select id="cat-select">
          ${CATEGORIES.map(c => `<option value="${c.id}" ${examConfig.category === c.id ? 'selected' : ''}>${c.label}</option>`).join('')}
        </select>
      </div>
      <div class="setup-row">
        <label class="section-label">Anzahl Fragen</label>
        <select id="count-select">
          ${[10, 15, 20, 30].map(n => `<option value="${n}" ${examConfig.count === n ? 'selected' : ''}>${n} Fragen</option>`).join('')}
          <option value="999" ${examConfig.count === 999 ? 'selected' : ''}>Alle passenden Posen</option>
        </select>
      </div>
      <div class="setup-row">
        <label class="section-label">Fragetypen</label>
        <div class="check-list">
          <label><input type="checkbox" data-type="visualToName" ${examConfig.types.visualToName ? 'checked' : ''}> Bild zeigen → Sanskrit-Name erraten</label>
          <label><input type="checkbox" data-type="nameToVisual" ${examConfig.types.nameToVisual ? 'checked' : ''}> Sanskrit-Name → richtiges Bild erraten</label>
          <label><input type="checkbox" data-type="nameToTranslation" ${examConfig.types.nameToTranslation ? 'checked' : ''}> Sanskrit-Name → deutsche Übersetzung</label>
          <label><input type="checkbox" data-type="translationToName" ${examConfig.types.translationToName ? 'checked' : ''}> Englisch/Deutsch → Sanskrit-Name</label>
        </div>
      </div>
      <button class="primary-btn" id="start-exam">Prüfung starten</button>
      <p style="color:var(--ink-soft);font-size:0.82rem;margin-top:12px;">Posen, die du noch nicht sicher beherrschst, kommen häufiger dran.</p>
    </div>
  `;
  document.getElementById('cat-select').onchange = e => examConfig.category = e.target.value;
  document.getElementById('count-select').onchange = e => examConfig.count = parseInt(e.target.value, 10);
  document.querySelectorAll('[data-type]').forEach(cb => cb.onchange = () => examConfig.types[cb.dataset.type] = cb.checked);
  document.getElementById('start-exam').onclick = startExam;
}

// ---------------------------------------------------------------- Exam Run
let examSession = null;

function weightedSample(pool, n) {
  const items = pool.map(p => ({ p, w: weightFor(p.id) + Math.random() * 2 }));
  items.sort((a, b) => b.w - a.w);
  return items.slice(0, n).map(x => x.p);
}
function pickDistractors(pool, correct, n, keyFn) {
  const candidates = pool.filter(p => p.id !== correct.id && keyFn(p) !== keyFn(correct));
  const shuffled = candidates.sort(() => Math.random() - 0.5);
  const out = [];
  const seen = new Set([keyFn(correct)]);
  for (const c of shuffled) {
    if (out.length >= n) break;
    if (seen.has(keyFn(c))) continue;
    seen.add(keyFn(c));
    out.push(c);
  }
  return out;
}
function shuffle(arr) { return arr.map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(v => v[1]); }

function buildQuestion(pose, pool) {
  const activeTypes = Object.entries(examConfig.types).filter(([, v]) => v).map(([k]) => k);
  let candidates = activeTypes.slice();
  if (!pose.quizVisual) candidates = candidates.filter(t => t !== 'visualToName' && t !== 'nameToVisual');
  if (candidates.length === 0) candidates = ['nameToTranslation'];
  const type = candidates[Math.floor(Math.random() * candidates.length)];

  if (type === 'visualToName') {
    const distractors = pickDistractors(pool, pose, 3, p => p.sanskrit);
    const options = shuffle([pose, ...distractors]).map(p => ({ label: p.sanskrit, correct: p.id === pose.id }));
    return { pose, type, prompt: { fig: pose.shape }, question: 'Welche Pose ist das?', options };
  }
  if (type === 'nameToVisual') {
    const distractors = pickDistractors(pool, pose, 3, p => p.shape);
    const options = shuffle([pose, ...distractors]).map(p => ({ fig: p.shape, correct: p.id === pose.id }));
    return { pose, type, prompt: { text: pose.sanskrit, sub: pose.pronunciation }, question: 'Welches Bild zeigt diese Pose?', options };
  }
  if (type === 'nameToTranslation') {
    const distractors = pickDistractors(pool, pose, 3, p => p.german);
    const options = shuffle([pose, ...distractors]).map(p => ({ label: `${p.german} (${p.english})`, correct: p.id === pose.id }));
    return { pose, type, prompt: { text: pose.sanskrit, sub: pose.pronunciation }, question: 'Was bedeutet dieser Name?', options };
  }
  // translationToName
  const distractors = pickDistractors(pool, pose, 3, p => p.sanskrit);
  const options = shuffle([pose, ...distractors]).map(p => ({ label: p.sanskrit, correct: p.id === pose.id }));
  const useGerman = Math.random() < 0.5;
  return { pose, type, prompt: { text: useGerman ? pose.german : pose.english, sub: useGerman ? 'Deutsch' : 'English' }, question: 'Wie lautet der Sanskrit-Name?', options };
}

function startExam() {
  const pool = examConfig.category === 'all' ? POSES : POSES.filter(p => p.category === examConfig.category);
  const usablePool = pool.length >= 4 ? pool : POSES;
  const n = Math.min(examConfig.count, usablePool.length);
  const chosenPoses = weightedSample(usablePool, n);
  const questions = chosenPoses.map(p => buildQuestion(p, usablePool.length >= 4 ? usablePool : POSES));
  examSession = { questions, index: 0, score: 0, wrong: [], answered: false };
  state.mode = 'exam-run';
  renderExamRun();
}

function renderExamRun() {
  const q = examSession.questions[examSession.index];
  const total = examSession.questions.length;
  const isVisualOptions = q.options[0].fig !== undefined;

  root.innerHTML = `
    <div class="quiz-card">
      <div class="quiz-progress">
        <span>Frage ${examSession.index + 1} / ${total}</span>
        <span>Punkte: ${examSession.score}</span>
      </div>
      <div class="quiz-prompt">
        ${q.prompt.fig ? `<div class="qfig"><svg viewBox="0 0 100 100">${renderShape(q.prompt.fig)}</svg></div>` : ''}
        ${q.prompt.text ? `<div class="qtext">${q.prompt.text}</div>` : ''}
        ${q.prompt.sub ? `<div class="qsub">${q.prompt.sub}</div>` : ''}
        <div class="qmeta">${q.question}</div>
      </div>
      <div class="options-grid">
        ${q.options.map((o, i) => `
          <button class="option-btn ${o.fig ? 'visual' : ''}" data-idx="${i}">
            ${o.fig ? `<svg viewBox="0 0 100 100">${renderShape(o.fig)}</svg>` : o.label}
          </button>`).join('')}
      </div>
      <div class="feedback-row" id="feedback"></div>
      <div class="quiz-footer">
        <button class="primary-btn" id="next-q" style="display:none;">${examSession.index + 1 === total ? 'Ergebnis anzeigen' : 'Nächste Frage →'}</button>
      </div>
    </div>
  `;

  document.querySelectorAll('.option-btn').forEach(btn => {
    btn.onclick = () => {
      if (examSession.answered) return;
      examSession.answered = true;
      const idx = parseInt(btn.dataset.idx, 10);
      const chosen = q.options[idx];
      const correct = chosen.correct;
      recordResult(q.pose.id, correct);
      if (correct) examSession.score++;
      else examSession.wrong.push(q.pose);

      document.querySelectorAll('.option-btn').forEach((b2, i2) => {
        b2.disabled = true;
        if (q.options[i2].correct) b2.classList.add('correct');
        else if (i2 === idx) b2.classList.add('wrong');
      });
      const fb = document.getElementById('feedback');
      fb.textContent = correct ? '✓ Richtig!' : `✗ Leider falsch — richtig ist: ${q.options.find(o => o.correct).label || q.pose.sanskrit}`;
      fb.className = 'feedback-row ' + (correct ? 'ok' : 'no');
      document.getElementById('next-q').style.display = 'inline-block';
    };
  });

  document.getElementById('next-q').onclick = () => {
    examSession.answered = false;
    if (examSession.index + 1 < total) {
      examSession.index++;
      renderExamRun();
    } else {
      state.mode = 'exam-results';
      renderExamResults();
    }
  };
}

function renderExamResults() {
  const total = examSession.questions.length;
  const pct = Math.round((examSession.score / total) * 100);
  const uniqueWrong = [...new Map(examSession.wrong.map(p => [p.id, p])).values()];
  root.innerHTML = `
    <div class="results-card">
      <div class="score">${examSession.score} / ${total}</div>
      <div class="score-sub">${pct}% richtig beantwortet</div>
      ${uniqueWrong.length ? `
        <div class="review-list">
          <strong>Zum Wiederholen:</strong>
          ${uniqueWrong.map(p => `<div class="review-item"><span>${p.sanskrit}</span><span>${p.german}</span></div>`).join('')}
        </div>` : '<p>🎉 Alles richtig — großartig!</p>'}
      <div class="results-actions">
        <button class="secondary-btn" id="back-home">Zur Startseite</button>
        <button class="secondary-btn" id="review-explore">Im Explore-Modus üben</button>
        <button class="primary-btn" id="retry-exam">Neue Prüfung</button>
      </div>
    </div>
  `;
  document.getElementById('back-home').onclick = () => setMode('home');
  document.getElementById('retry-exam').onclick = () => setMode('exam-setup');
  document.getElementById('review-explore').onclick = () => {
    if (uniqueWrong.length) exploreState.selectedId = uniqueWrong[0].id;
    setMode('explore');
  };
}

// ---------------------------------------------------------------- Init
document.querySelectorAll('nav.modes button').forEach(b => b.onclick = () => setMode(b.dataset.mode));
render();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  });
}

// ---------------------------------------------------------------- Install banner (PWA)
const INSTALL_DISMISS_KEY = 'ashtanga-install-dismissed';
let deferredInstallPrompt = null;
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

function dismissInstallBanner() {
  document.getElementById('install-banner').hidden = true;
  try { localStorage.setItem(INSTALL_DISMISS_KEY, '1'); } catch (e) {}
}

function showInstallBanner({ text, actionLabel, onAction }) {
  if (isStandalone) return;
  try { if (localStorage.getItem(INSTALL_DISMISS_KEY)) return; } catch (e) {}
  const banner = document.getElementById('install-banner');
  document.getElementById('install-banner-text').textContent = text;
  const actionBtn = document.getElementById('install-banner-action');
  if (actionLabel && onAction) {
    actionBtn.textContent = actionLabel;
    actionBtn.hidden = false;
    actionBtn.onclick = onAction;
  } else {
    actionBtn.hidden = true;
  }
  banner.hidden = false;
}

document.getElementById('install-banner-close').onclick = dismissInstallBanner;

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredInstallPrompt = e;
  showInstallBanner({
    text: '📲 Als App installieren für den schnellen Zugriff vom Homescreen.',
    actionLabel: 'Installieren',
    onAction: async () => {
      dismissInstallBanner();
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
    },
  });
});

window.addEventListener('appinstalled', dismissInstallBanner);

if (isIOS && !isStandalone) {
  showInstallBanner({ text: '📲 Zum Homescreen hinzufügen: Teilen-Symbol ⬆️ antippen, dann „Zum Home-Bildschirm“.' });
}
