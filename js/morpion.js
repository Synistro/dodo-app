// ── morpion.js — morpion doux : ⭐ (enfant) contre 🌙 (la lune) ───────────────

let mrpBoard = [], mrpLock = false, mrpOver = false, mrpTimer = null;
let mrpMode = 'solo', mrpTurn = '⭐';

const MRP_LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

function setMorpionMode(mode) {
  mrpMode = mode;
  document.querySelectorAll('.mrp-mode').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
  startMorpion();
}

function startMorpion() {
  mrpBoard = Array(9).fill(null); mrpLock = false; mrpOver = false; mrpTurn = '⭐';
  if (mrpTimer) { clearTimeout(mrpTimer); mrpTimer = null; }
  const grid = document.getElementById('morpionGrid');
  grid.innerHTML = '';
  document.getElementById('morpionWin').classList.remove('show');
  document.getElementById('morpionTurn').textContent = mrpMode === 'duo' ? 'À toi, ⭐ !' : 'À toi de jouer ! ⭐';
  for (let i = 0; i < 9; i++) {
    const c = document.createElement('button');
    c.className = 'mrp-cell';
    c.addEventListener('click', () => mrpPlay(i));
    grid.appendChild(c);
  }
}

function mrpCells() { return document.querySelectorAll('#morpionGrid .mrp-cell'); }

function mrpSet(i, sym) {
  mrpBoard[i] = sym;
  const c = mrpCells()[i];
  c.textContent = sym;
  c.classList.add('filled');
}

function mrpPlay(i) {
  if (mrpLock || mrpOver || mrpBoard[i]) return;
  if (mrpMode === 'duo') {
    // 2 joueurs sur le même écran — chacun son tour
    mrpSet(i, mrpTurn);
    if (mrpEnd()) return;
    mrpTurn = mrpTurn === '⭐' ? '🌙' : '⭐';
    document.getElementById('morpionTurn').textContent = 'À toi, ' + mrpTurn + ' !';
    return;
  }
  mrpSet(i, '⭐');
  if (mrpEnd()) return;
  mrpLock = true;
  document.getElementById('morpionTurn').textContent = 'La lune réfléchit… 🌙';
  mrpTimer = setTimeout(() => {
    mrpSet(mrpAI(), '🌙');
    mrpLock = false;
    if (!mrpEnd()) document.getElementById('morpionTurn').textContent = 'À toi de jouer ! ⭐';
  }, 700);
}

function mrpWinner() {
  for (const [a, b, c] of MRP_LINES)
    if (mrpBoard[a] && mrpBoard[a] === mrpBoard[b] && mrpBoard[a] === mrpBoard[c]) return { sym: mrpBoard[a], line: [a, b, c] };
  return mrpBoard.every(Boolean) ? { sym: null } : null;
}

function mrpEnd() {
  const w = mrpWinner();
  if (!w) return false;
  mrpOver = true;
  if (w.line) w.line.forEach(i => mrpCells()[i].classList.add('win'));
  document.getElementById('morpionMsg').textContent =
    mrpMode === 'duo'
      ? (w.sym ? w.sym + ' a gagné ! Bravo !' : 'Égalité !')
      : (w.sym === '⭐' ? '⭐ Tu as gagné ! Bravo !' : w.sym === '🌙' ? '🌙 La lune a gagné !' : 'Égalité !');
  if (w.sym && (mrpMode === 'duo' || w.sym === '⭐') && typeof popSound === 'function') popSound();
  setTimeout(() => document.getElementById('morpionWin').classList.add('show'), w.line ? 900 : 400);
  return true;
}

// Gagne si possible, bloque sinon — mais ne voit pas les fourchettes : battable par un enfant
function mrpAI() {
  for (const sym of ['🌙', '⭐']) {
    for (const [a, b, c] of MRP_LINES) {
      const line = [mrpBoard[a], mrpBoard[b], mrpBoard[c]];
      if (line.filter(v => v === sym).length === 2 && line.includes(null)) return [a, b, c][line.indexOf(null)];
    }
  }
  if (!mrpBoard[4] && Math.random() < 0.8) return 4;
  const free = mrpBoard.map((v, i) => v ? null : i).filter(v => v !== null);
  const corners = [0, 2, 6, 8].filter(i => !mrpBoard[i]);
  if (corners.length && Math.random() < 0.6) return corners[Math.floor(Math.random() * corners.length)];
  return free[Math.floor(Math.random() * free.length)];
}

function stopMorpion() {
  if (mrpTimer) { clearTimeout(mrpTimer); mrpTimer = null; }
  mrpLock = false;
}
