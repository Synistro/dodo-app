// ── game.js — jeu ballons/nuages/étoiles canvas ──────────────────────────────

let gameRunning = false, score = 0, balloons = [], animFrame = null;

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

function startGame() {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  score = 0; balloons = []; gameRunning = true; updateScore();

  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);

  let spawnTimer = 0, lastTime = 0;

  function spawnBalloon() {
    const type = BALLOON_TYPES[Math.floor(Math.random() * BALLOON_TYPES.length)];
    const r = 25 + Math.random() * 20;
    balloons.push({
      x: r + Math.random() * (canvas.width - r * 2),
      y: canvas.height + r + 20,
      r, vy: -(0.4 + Math.random() * 0.6), vx: (Math.random() - 0.5) * 0.3,
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

  function loop(ts) {
    if (!gameRunning) return;
    const dt = ts - lastTime; lastTime = ts; spawnTimer += dt;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (spawnTimer > 1200) { spawnBalloon(); spawnTimer = 0; }
    balloons = balloons.filter(b => {
      if (b.popped) { b.popProgress += 0.06; if (b.popProgress >= 1) return false; }
      else { b.y += b.vy; b.x += b.vx; b.wobble += b.wobbleSpeed; b.opacity = Math.min(1, b.opacity + 0.03); }
      if (b.y < -100) return false;
      drawBalloon(ctx, b);
      return true;
    });
    animFrame = requestAnimationFrame(loop);
  }

  function hitTest(x, y) {
    for (let i = balloons.length - 1; i >= 0; i--) {
      const b = balloons[i]; if (b.popped) continue;
      if (Math.hypot(x - (b.x + Math.sin(b.wobble) * 8), y - b.y) < b.r * 1.1) {
        b.popped = true; score++; updateScore(); return;
      }
    }
  }

  canvas.addEventListener('click', e => {
    const r = canvas.getBoundingClientRect();
    hitTest(e.clientX - r.left, e.clientY - r.top);
  });
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    const r = canvas.getBoundingClientRect();
    Array.from(e.changedTouches).forEach(t => hitTest(t.clientX - r.left, t.clientY - r.top));
  }, { passive: false });

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
}
