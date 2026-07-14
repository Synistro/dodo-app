// ── fireflies.js — lucioles : traînée d'étoiles au doigt, zéro échec ─────────

let ffRunning = false, ffFrame = null, ffInited = false;
let ffCanvas = null, ffCtx = null;
let ffSparks = [], ffFlies = [], ffTouch = null;
let ffLastSpawn = 0, ffAudioCtx = null;

// Carillon doux (pentatonique — toujours joli, jamais faux), très bas : appli du soir
function ffChime() {
  try {
    ffAudioCtx = ffAudioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523.25, 587.33, 659.25, 783.99, 880];
    const t = ffAudioCtx.currentTime;
    const o = ffAudioCtx.createOscillator(), g = ffAudioCtx.createGain();
    o.type = 'sine';
    o.frequency.value = notes[Math.floor(Math.random() * notes.length)];
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.07, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    o.connect(g); g.connect(ffAudioCtx.destination);
    o.start(t); o.stop(t + 0.55);
  } catch (e) {}
}

function ffNewFly(x, y) {
  return {
    x, y,
    a: Math.random() * Math.PI * 2,
    sp: 0.5 + Math.random() * 0.5,
    tw: Math.random() * Math.PI * 2,
    dead: 0, fade: 0,
    grace: 1200, // les nouvelles-nées ne s'attrapent pas tout de suite
  };
}

function ffBurst(x, y) {
  for (let i = 0; i < 12; i++) {
    const a = Math.random() * Math.PI * 2, sp = 1 + Math.random() * 2;
    ffSparks.push({ x, y, r: 2 + Math.random() * 2.5, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 0.3, life: 1, hue: 65 + Math.random() * 30, tw: Math.random() * Math.PI * 2 });
  }
  ffChime();
  if (navigator.vibrate) navigator.vibrate(15);
}

function ffCatch(x, y) {
  ffFlies.forEach(f => {
    if (f.dead || f.grace > 0) return;
    if (Math.hypot(x - f.x, y - f.y) < 45) {
      f.dead = 1500 + Math.random() * 1500; // éclate… puis renaît ailleurs — rien ne disparaît pour de bon
      ffBurst(f.x, f.y);
    }
  });
}

function initFireflies() {
  ffCanvas = document.getElementById('fireflies-canvas');
  ffCtx = ffCanvas.getContext('2d');

  function resize() { ffCanvas.width = window.innerWidth; ffCanvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);

  const onMove = (cx, cy) => {
    const r = ffCanvas.getBoundingClientRect();
    ffTouch = { x: cx - r.left, y: cy - r.top };
    for (let i = 0; i < 3; i++) ffSpark(ffTouch.x, ffTouch.y);
    ffCatch(ffTouch.x, ffTouch.y);
    // le glissé fait naître des lucioles le long du chemin
    const now = performance.now();
    if (now - ffLastSpawn > 500 && ffFlies.filter(f => !f.dead).length < 20) {
      ffLastSpawn = now;
      ffFlies.push(ffNewFly(ffTouch.x, ffTouch.y));
    }
  };
  ffCanvas.addEventListener('touchstart', e => { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
  ffCanvas.addEventListener('touchmove', e => { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
  ffCanvas.addEventListener('touchend', () => { ffTouch = null; });
  let mouseDown = false;
  ffCanvas.addEventListener('mousedown', e => { mouseDown = true; onMove(e.clientX, e.clientY); });
  ffCanvas.addEventListener('mousemove', e => { if (mouseDown) onMove(e.clientX, e.clientY); });
  window.addEventListener('mouseup', () => { mouseDown = false; ffTouch = null; });

  ffInited = true;
}

function ffSpark(x, y) {
  ffSparks.push({
    x: x + (Math.random() - 0.5) * 20,
    y: y + (Math.random() - 0.5) * 20,
    r: 1.5 + Math.random() * 3,
    vx: (Math.random() - 0.5) * 0.8,
    vy: (Math.random() - 0.5) * 0.8 - 0.3,
    life: 1,
    hue: 40 + Math.random() * 30,
    tw: Math.random() * Math.PI * 2,
  });
  if (ffSparks.length > 400) ffSparks.splice(0, ffSparks.length - 400);
}

function startFireflies() {
  if (!ffInited) initFireflies();
  ffRunning = true; ffSparks = []; ffTouch = null;
  ffFlies = Array.from({ length: 10 }, () =>
    ffNewFly(Math.random() * ffCanvas.width, Math.random() * ffCanvas.height));
  let lastTime = 0;

  function loop(ts) {
    if (!ffRunning) return;
    const dt = lastTime ? Math.min(ts - lastTime, 50) : 16.7;
    lastTime = ts;
    const k = dt / 16.7;
    ffCtx.clearRect(0, 0, ffCanvas.width, ffCanvas.height);

    // traînée d'étoiles
    ffSparks = ffSparks.filter(s => {
      s.life -= 0.015 * k;
      if (s.life <= 0) return false;
      s.x += s.vx * k; s.y += s.vy * k; s.tw += 0.3 * k;
      ffCtx.globalAlpha = Math.max(0, s.life * (0.6 + 0.4 * Math.sin(s.tw)));
      ffCtx.fillStyle = `hsl(${s.hue}, 90%, 75%)`;
      ffCtx.shadowColor = `hsl(${s.hue}, 90%, 65%)`;
      ffCtx.shadowBlur = 8;
      ffCtx.beginPath(); ffCtx.arc(s.x, s.y, s.r * s.life, 0, Math.PI * 2); ffCtx.fill();
      return true;
    });

    // lucioles — errance + attirance douce vers le doigt
    ffFlies.forEach(f => {
      if (f.dead) {
        f.dead -= dt;
        if (f.dead <= 0) {
          f.dead = 0; f.fade = 0; f.grace = 600;
          f.x = Math.random() * ffCanvas.width;
          f.y = Math.random() * ffCanvas.height * 0.6; // renaît plutôt vers le haut
        }
        return;
      }
      if (f.grace > 0) f.grace -= dt;
      f.fade = Math.min(1, f.fade + 0.02 * k);
      f.a += (Math.random() - 0.5) * 0.3 * k;
      if (ffTouch) {
        const want = Math.atan2(ffTouch.y - f.y, ffTouch.x - f.x);
        let d = want - f.a;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        f.a += d * 0.04 * k;
      }
      f.x += Math.cos(f.a) * f.sp * k;
      f.y += Math.sin(f.a) * f.sp * k;
      if (f.x < 20 || f.x > ffCanvas.width - 20 || f.y < 20 || f.y > ffCanvas.height - 20) {
        f.a = Math.atan2(ffCanvas.height / 2 - f.y, ffCanvas.width / 2 - f.x);
      }
      f.tw += 0.08 * k;
      const glow = 0.5 + 0.5 * Math.sin(f.tw);
      ffCtx.globalAlpha = (0.35 + glow * 0.65) * f.fade;
      ffCtx.fillStyle = '#d8f080';
      ffCtx.shadowColor = '#d8f080';
      ffCtx.shadowBlur = 12 + glow * 10;
      ffCtx.beginPath(); ffCtx.arc(f.x, f.y, 3 + glow * 1.5, 0, Math.PI * 2); ffCtx.fill();
    });
    ffCtx.shadowBlur = 0; ffCtx.globalAlpha = 1;

    ffFrame = requestAnimationFrame(loop);
  }
  ffFrame = requestAnimationFrame(loop);
}

function stopFireflies() {
  ffRunning = false;
  if (ffFrame) cancelAnimationFrame(ffFrame);
  ffSparks = []; ffTouch = null;
}
