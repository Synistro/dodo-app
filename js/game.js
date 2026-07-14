// ── game.js — jeu ballons/nuages/étoiles canvas ──────────────────────────────

let gameRunning = false, score = 0, balloons = [], animFrame = null;
let highScore = parseInt(localStorage.getItem('johanna-highscore') || '0', 10);
let gameInited = false, gCanvas = null, gCtx = null;
let celebration = null;

const BALLOON_TYPES = [
  { shape:'balloon', color:'#e84a8a', glow:'#ff80b0' },
  { shape:'balloon', color:'#4a8ae8', glow:'#80b0ff' },
  { shape:'balloon', color:'#f0c060', glow:'#ffe090' },
  { shape:'balloon', color:'#60d080', glow:'#90ffb0' },
  { shape:'balloon', color:'#e060c0', glow:'#ff90e0' },
  { shape:'cloud',   color:'rgba(200,220,255,0.7)', glow:'rgba(200,220,255,0.4)' },
  { shape:'cloud',   color:'rgba(220,200,255,0.7)', glow:'rgba(220,200,255,0.4)' },
  { shape:'star',    color:'#f0c060', glow:'#ffe090' },
];
const ROCKET_TYPE = { shape:'rocket', color:'#e86a4a', glow:'#ffe090', points:3 };

const SPEED = 1.15; // §14.7 vitesse +15%

// Son de pop synthétisé — zéro asset, créé au premier pop (geste utilisateur → autorisé)
let popAudioCtx = null;
function popSound() {
  try {
    popAudioCtx = popAudioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const t = popAudioCtx.currentTime;
    const o = popAudioCtx.createOscillator(), g = popAudioCtx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(550 + Math.random() * 250, t);
    o.frequency.exponentialRampToValueAtTime(140, t + 0.12);
    g.gain.setValueAtTime(0.22, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    o.connect(g); g.connect(popAudioCtx.destination);
    o.start(t); o.stop(t + 0.16);
  } catch (e) {}
}

function spawnBalloon() {
  const type = Math.random() < 0.08 ? ROCKET_TYPE
    : BALLOON_TYPES[Math.floor(Math.random() * BALLOON_TYPES.length)];
  const r = 25 + Math.random() * 20;
  const fast = type.shape === 'rocket' ? 2.2 : 1;
  balloons.push({
    x: r + Math.random() * (gCanvas.width - r * 2),
    y: gCanvas.height + r + 20,
    r,
    vy: -(0.4 + Math.random() * 0.6) * SPEED * fast,
    vx: (Math.random() - 0.5) * 0.3 * SPEED,
    wobble: Math.random() * Math.PI * 2,
    wobbleSpeed: 0.02 + Math.random() * 0.02,
    opacity: 0, popped: false, popProgress: 0, ...type
  });
}

function drawBalloon(ctx, b) {
  ctx.save();
  ctx.globalAlpha = b.popped ? (1 - b.popProgress) * 0.8 : b.opacity;
  const x = b.x + Math.sin(b.wobble) * 8, y = b.y;

  if (b.shape === 'balloon') {
    const grd = ctx.createRadialGradient(x, y - b.r * 0.2, b.r * 0.1, x, y, b.r * 1.5);
    grd.addColorStop(0, b.glow); grd.addColorStop(1, 'transparent');
    ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(x, y, b.r * 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = b.color; ctx.beginPath(); ctx.ellipse(x, y - b.r * 0.1, b.r * 0.9, b.r, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(x - b.r * 0.25, y - b.r * 0.45, b.r * 0.22, b.r * 0.16, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = b.color; ctx.beginPath(); ctx.arc(x, y + b.r * 0.95, 4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y + b.r + 3);
    for (let i = 0; i < 30; i++) ctx.lineTo(x + Math.sin(i * 0.5) * 4, y + b.r + 3 + i * 3);
    ctx.stroke();
  } else if (b.shape === 'cloud') {
    const sc = b.r / 28; ctx.fillStyle = b.color;
    [[0,0,22],[-14,8,14],[14,8,14],[-22,14,10],[22,14,10],[0,18,16]].forEach(([cx, cy, cr]) => {
      ctx.beginPath(); ctx.arc(x + cx * sc, y + cy * sc, cr * sc, 0, Math.PI * 2); ctx.fill();
    });
  } else if (b.shape === 'star') {
    ctx.fillStyle = b.glow; ctx.shadowColor = b.glow; ctx.shadowBlur = 15;
    drawStar(ctx, x, y, 5, b.r, b.r * 0.45);
    ctx.fillStyle = b.color; ctx.shadowBlur = 5;
    drawStar(ctx, x, y, 5, b.r * 0.85, b.r * 0.38);
  } else if (b.shape === 'rocket') {
    ctx.save();
    ctx.translate(x, y);
    const f = 0.7 + Math.sin(b.wobble * 6) * 0.3;
    const grd = ctx.createRadialGradient(0, b.r * 1.1, 2, 0, b.r * 1.1, b.r * f);
    grd.addColorStop(0, '#ffe090'); grd.addColorStop(1, 'transparent');
    ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(0, b.r * 1.1, b.r * f, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = b.color;
    ctx.beginPath(); ctx.moveTo(-b.r * 0.4, b.r * 0.4); ctx.lineTo(-b.r * 0.85, b.r); ctx.lineTo(-b.r * 0.35, b.r * 0.95); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(b.r * 0.4, b.r * 0.4); ctx.lineTo(b.r * 0.85, b.r); ctx.lineTo(b.r * 0.35, b.r * 0.95); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e8e8f0'; ctx.beginPath(); ctx.ellipse(0, 0, b.r * 0.45, b.r, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = b.color; ctx.beginPath(); ctx.moveTo(-b.r * 0.42, -b.r * 0.35); ctx.quadraticCurveTo(0, -b.r * 1.5, b.r * 0.42, -b.r * 0.35); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#4a8ae8'; ctx.beginPath(); ctx.arc(0, -b.r * 0.15, b.r * 0.22, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  if (b.popped && b.popProgress < 1) {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2, d = b.popProgress * b.r * 2.5;
      ctx.globalAlpha = (1 - b.popProgress) * 0.8;
      ctx.fillStyle = b.color; ctx.beginPath();
      ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, b.r * 0.15 * (1 - b.popProgress), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawStar(ctx, cx, cy, spikes, outerR, innerR) {
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;
  ctx.beginPath(); ctx.moveTo(cx, cy - outerR);
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR); rot += step;
    ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR); rot += step;
  }
  ctx.lineTo(cx, cy - outerR); ctx.closePath(); ctx.fill();
}

function drawCelebration(dt) {
  if (!celebration) return;
  celebration.t += dt / 1600;
  if (celebration.t >= 1) { celebration = null; return; }
  const t = celebration.t;
  const alpha = t < 0.15 ? t / 0.15 : (t > 0.7 ? (1 - t) / 0.3 : 1);
  gCtx.save();
  gCtx.globalAlpha = alpha;
  gCtx.font = `600 ${Math.min(gCanvas.width * 0.13, 64)}px 'Baloo 2', sans-serif`;
  gCtx.textAlign = 'center'; gCtx.textBaseline = 'middle';
  gCtx.fillStyle = '#ffe090';
  gCtx.shadowColor = '#f0a040'; gCtx.shadowBlur = 25;
  gCtx.fillText('⭐ Bravo ! ⭐', gCanvas.width / 2, gCanvas.height * 0.35);
  gCtx.restore();
}

function hitTest(x, y) {
  for (let i = balloons.length - 1; i >= 0; i--) {
    const b = balloons[i]; if (b.popped) continue;
    // rayon généreux ×1.3 — doigts de 2 ans
    if (Math.hypot(x - (b.x + Math.sin(b.wobble) * 8), y - b.y) < b.r * 1.3) {
      b.popped = true;
      const prev = score;
      score += b.points || 1;
      if (score > highScore) { highScore = score; localStorage.setItem('johanna-highscore', String(highScore)); }
      if (Math.floor(score / 10) > Math.floor(prev / 10)) celebration = { t: 0 };
      updateScore();
      popSound();
      if (navigator.vibrate) navigator.vibrate(25);
      return;
    }
  }
}

function initGame() {
  gCanvas = document.getElementById('game-canvas');
  gCtx = gCanvas.getContext('2d');

  function resize() { gCanvas.width = window.innerWidth; gCanvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);

  gCanvas.addEventListener('click', e => {
    const r = gCanvas.getBoundingClientRect();
    hitTest(e.clientX - r.left, e.clientY - r.top);
  });
  gCanvas.addEventListener('touchstart', e => {
    e.preventDefault();
    const r = gCanvas.getBoundingClientRect();
    Array.from(e.changedTouches).forEach(t => hitTest(t.clientX - r.left, t.clientY - r.top));
  }, { passive: false });

  gameInited = true;
}

function startGame() {
  if (!gameInited) initGame();
  score = 0; balloons = []; celebration = null; gameRunning = true; updateScore();

  let spawnTimer = 1e9; // premier spawn immédiat
  let lastTime = 0;

  function loop(ts) {
    if (!gameRunning) return;
    // dt borné : vitesse indépendante du refresh (60/120 Hz), pas de saut au retour d'onglet
    const dt = lastTime ? Math.min(ts - lastTime, 50) : 16.7;
    lastTime = ts; spawnTimer += dt;
    const k = dt / 16.7;
    const diff = 1 + Math.min(score * 0.01, 0.4); // montée douce, +40 % max
    gCtx.clearRect(0, 0, gCanvas.width, gCanvas.height);
    if (spawnTimer > Math.max(650, 1200 - score * 12)) { spawnBalloon(); spawnTimer = 0; }
    balloons = balloons.filter(b => {
      if (b.popped) { b.popProgress += 0.06 * k; if (b.popProgress >= 1) return false; }
      else {
        b.y += b.vy * k * diff; b.x += b.vx * k;
        b.wobble += b.wobbleSpeed * k;
        b.opacity = Math.min(1, b.opacity + 0.03 * k);
      }
      if (b.y < -100) return false;
      drawBalloon(gCtx, b);
      return true;
    });
    drawCelebration(dt);
    animFrame = requestAnimationFrame(loop);
  }

  animFrame = requestAnimationFrame(loop);
}

function stopGame() {
  gameRunning = false;
  if (animFrame) cancelAnimationFrame(animFrame);
  balloons = [];
  score = 0;
}

function updateScore() {
  document.getElementById('scoreVal').textContent = score;
  const hs = document.getElementById('highVal');
  if (hs) hs.textContent = highScore;
}
