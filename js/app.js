// ── app.js — navigation, étoiles, init ──────────────────────────────────────

function createStars() {
  const c = document.getElementById('starsBg');
  for (let i = 0; i < 120; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    const sz = Math.random() * 2.5 + 0.5;
    s.style.cssText = `width:${sz}px;height:${sz}px;left:${Math.random()*100}%;top:${Math.random()*100}%;--dur:${(Math.random()*4+2).toFixed(1)}s;--delay:${(Math.random()*5).toFixed(1)}s;--min-op:${(Math.random()*0.3+0.1).toFixed(2)};`;
    c.appendChild(s);
  }
}

function showView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// Init
createStars();
buildLibrary();
