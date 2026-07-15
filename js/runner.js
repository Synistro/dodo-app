// ── runner.js — La course de Pompon : façon dino Chrome, un tap = un saut ─────

let runRunning = false, runFrame = null, runInited = false;
let runCanvas = null, runCtx = null;
let runScore = 0, runBest = parseInt(localStorage.getItem('johanna-runner-best') || '0', 10);
let pompon = null, runObstacles = [], runFloatStars = [], runBgStars = [];
let runSpeed = 0, runDist = 0, runOver = false, runGen = 0;

const RUN_GROUND = 90; // hauteur du sol depuis le bas

function runGroundY() { return runCanvas.height - RUN_GROUND; }

function initRunner() {
  runCanvas = document.getElementById('runner-canvas');
  runCtx = runCanvas.getContext('2d');
  const resize = () => { runCanvas.width = window.innerWidth; runCanvas.height = window.innerHeight; };
  resize();
  window.addEventListener('resize', resize);
  runCanvas.addEventListener('touchstart', e => { e.preventDefault(); runJump(); }, { passive: false });
  runCanvas.addEventListener('mousedown', runJump);
  runInited = true;
}

function runJump() {
  if (!runRunning || runOver) return;
  const restY = runGroundY() - pompon.r;
  if (pompon.y >= restY - 2) pompon.vy = -16; // saut seulement depuis le sol
}

function startRunner() {
  if (!runInited) initRunner();
  // jeton de génération : « Rejouer » relançait une 2e boucle sans tuer la 1re
  // → dist comptée en double à chaque chute, vitesse qui s'emballe
  const gen = ++runGen;
  if (runFrame) cancelAnimationFrame(runFrame);
  runScore = 0; runDist = 0; runSpeed = 4; runOver = false; runRunning = true;
  pompon = { x: 80, y: 0, vy: 0, r: 26 };
  pompon.y = runGroundY() - pompon.r;
  runObstacles = []; runFloatStars = [];
  runBgStars = Array.from({ length: 15 }, () => ({
    x: Math.random() * runCanvas.width,
    y: Math.random() * runCanvas.height * 0.55,
    r: 0.5 + Math.random() * 1.5,
    a: 0.15 + Math.random() * 0.3,
  }));
  document.getElementById('runnerEnd').classList.remove('show');
  updateRunnerScore();

  let last = 0, spawnT = 0, starT = 1500;

  function emoji(e, x, y, size) {
    runCtx.font = size + 'px serif';
    runCtx.textAlign = 'center'; runCtx.textBaseline = 'middle';
    runCtx.fillText(e, x, y);
  }

  function loop(ts) {
    if (!runRunning || gen !== runGen) return;
    const dt = last ? Math.min(ts - last, 50) : 16.7; last = ts;
    const k = dt / 16.7;
    const W = runCanvas.width, gy = runGroundY();

    if (!runOver) {
      runDist += runSpeed * k;
      runSpeed = Math.min(8, 4 + runDist * 0.0004); // accélère très doucement
      spawnT += dt; starT += dt;
      if (spawnT > 1500 + Math.random() * 900) {
        spawnT = 0;
        runObstacles.push({ x: W + 40, r: 20, emoji: Math.random() < 0.5 ? '🍄' : '🪨' });
      }
      if (starT > 2300 + Math.random() * 1500) {
        starT = 0;
        runFloatStars.push({ x: W + 40, y: gy - 70 - Math.random() * 110, r: 15, tw: Math.random() * Math.PI * 2 });
      }
      pompon.vy += 0.8 * k;
      pompon.y += pompon.vy * k;
      const restY = gy - pompon.r;
      if (pompon.y > restY) { pompon.y = restY; pompon.vy = 0; }

      runObstacles = runObstacles.filter(o => {
        o.x -= runSpeed * k;
        // hitbox généreuse (×0.6) — on pardonne les frôlements
        if (Math.hypot(o.x - pompon.x, (gy - o.r) - pompon.y) < (o.r + pompon.r) * 0.6) runGameOver();
        return o.x > -60;
      });
      runFloatStars = runFloatStars.filter(s => {
        s.x -= runSpeed * k; s.tw += 0.1 * k;
        if (Math.hypot(s.x - pompon.x, s.y - pompon.y) < s.r + pompon.r) {
          runScore++;
          if (runScore > runBest) { runBest = runScore; localStorage.setItem('johanna-runner-best', String(runBest)); }
          updateRunnerScore();
          if (typeof ffChime === 'function') ffChime();
          if (navigator.vibrate) navigator.vibrate(15);
          return false;
        }
        return s.x > -60;
      });
    }

    // dessin
    runCtx.clearRect(0, 0, W, runCanvas.height);
    runBgStars.forEach(s => {
      s.x -= runSpeed * 0.12 * k;
      if (s.x < -5) { s.x = W + 5; s.y = Math.random() * runCanvas.height * 0.55; }
      runCtx.globalAlpha = s.a;
      runCtx.fillStyle = '#ffffff';
      runCtx.beginPath(); runCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2); runCtx.fill();
    });
    runCtx.globalAlpha = 1;
    // sol
    runCtx.fillStyle = 'rgba(10,8,32,0.85)';
    runCtx.fillRect(0, gy, W, RUN_GROUND);
    runCtx.fillStyle = 'rgba(200,180,255,0.25)';
    runCtx.fillRect(0, gy, W, 2);
    // ombre de Pompon
    const h = (gy - pompon.r) - pompon.y;
    runCtx.globalAlpha = Math.max(0.1, 0.3 - h * 0.001);
    runCtx.fillStyle = '#000';
    runCtx.beginPath(); runCtx.ellipse(pompon.x, gy + 6, pompon.r * (1 - h * 0.001), 6, 0, 0, Math.PI * 2); runCtx.fill();
    runCtx.globalAlpha = 1;

    runFloatStars.forEach(s => {
      runCtx.globalAlpha = 0.7 + 0.3 * Math.sin(s.tw);
      emoji('⭐', s.x, s.y, s.r * 2.2);
    });
    runCtx.globalAlpha = 1;
    runObstacles.forEach(o => emoji(o.emoji, o.x, gy - o.r, o.r * 2.2));
    emoji(runOver ? '🙈' : '🐰', pompon.x, pompon.y, pompon.r * 2.3);

    runFrame = requestAnimationFrame(loop);
  }
  runFrame = requestAnimationFrame(loop);
}

function runGameOver() {
  if (runOver) return;
  runOver = true;
  if (navigator.vibrate) navigator.vibrate([40, 60, 40]);
  document.getElementById('runnerEndScore').textContent = '⭐ ' + runScore + ' · Record ' + runBest;
  setTimeout(() => document.getElementById('runnerEnd').classList.add('show'), 700);
}

function stopRunner() {
  runRunning = false;
  if (runFrame) cancelAnimationFrame(runFrame);
}

function updateRunnerScore() {
  document.getElementById('runScoreVal').textContent = runScore;
  document.getElementById('runBestVal').textContent = runBest;
}
