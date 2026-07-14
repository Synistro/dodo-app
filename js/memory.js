// ── memory.js — memory doux 2×3 : personnages des histoires ──────────────────
// Réutilise les illustrations existantes, zéro asset nouveau.

// Pool des 6 personnages — 3 tirés au hasard à chaque partie (toujours 6 tuiles)
const MEMORY_POOL = [
  { id: 'coton',       img: 'images/scene1_coton_ciel.jpg' },
  { id: 'etoile',      img: 'images/scene1_etoile_intro.jpg' },
  { id: 'train',       img: 'images/scene1_train_gare.jpg' },
  { id: 'pompon',      img: 'images/scene1_pompon_foret.jpg' },
  { id: 'gouttelette', img: 'images/scene1_gouttelette_intro.jpg' },
  { id: 'chocolat',    img: 'images/scene1_chocolat_foret.jpg' },
];
const MEMORY_PAIRS_COUNT = 3;

let memFirst = null, memLock = false, memFound = 0;

function startMemory() {
  const grid = document.getElementById('memoryGrid');
  grid.innerHTML = '';
  document.getElementById('memoryWin').classList.remove('show');
  memFirst = null; memLock = false; memFound = 0;

  const pairs = [...MEMORY_POOL].sort(() => Math.random() - 0.5).slice(0, MEMORY_PAIRS_COUNT);
  const cards = [...pairs, ...pairs]
    .map(p => ({ ...p }))
    .sort(() => Math.random() - 0.5);

  cards.forEach(card => {
    const el = document.createElement('button');
    el.className = 'mem-card';
    el.innerHTML = `
      <div class="mem-inner">
        <div class="mem-back">🌙</div>
        <div class="mem-front" style="background-image:url('${card.img}')"></div>
      </div>`;
    el.addEventListener('click', () => memFlip(el, card));
    grid.appendChild(el);
  });
}

function memFlip(el, card) {
  if (memLock || el.classList.contains('flipped') || el.classList.contains('matched')) return;
  el.classList.add('flipped');
  if (!memFirst) { memFirst = { el, card }; return; }
  const first = memFirst; memFirst = null;
  if (first.card.id === card.id) {
    first.el.classList.add('matched'); el.classList.add('matched');
    if (typeof popSound === 'function') popSound();
    if (navigator.vibrate) navigator.vibrate(25);
    memFound++;
    if (memFound === MEMORY_PAIRS_COUNT) {
      setTimeout(() => document.getElementById('memoryWin').classList.add('show'), 500);
    }
  } else {
    memLock = true;
    setTimeout(() => {
      first.el.classList.remove('flipped'); el.classList.remove('flipped');
      memLock = false;
    }, 900);
  }
}

function stopMemory() { memFirst = null; memLock = false; }
