// ── app.js — navigation, étoiles, fullscreen, init ──────────────────────────

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
  // Stop audio quand on quitte le reader
  if (id === 'landing' || id === 'library') {
    if (typeof stopTTS === 'function') stopTTS();
    if (typeof stopMusic === 'function') stopMusic();
  }
}

// ── §14.9 Fullscreen ─────────────────────────────────────────────────────────

function toggleFullscreen() {
  if (!document.fullscreenElement && !document.webkitFullscreenElement) {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  } else {
    if (document.exitFullscreen) document.exitFullscreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
  }
}

function syncFullscreenIcon() {
  const btn = document.getElementById('btnFullscreen');
  if (!btn) return;
  const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
  btn.textContent = isFs ? '⊡' : '⛶';
  btn.title = isFs ? 'Quitter le plein écran' : 'Plein écran';
}

document.addEventListener('fullscreenchange', syncFullscreenIcon);
document.addEventListener('webkitfullscreenchange', syncFullscreenIcon);

// Masquer le bouton en PWA standalone (déjà plein écran)
if (window.navigator.standalone === true) {
  document.body.classList.add('pwa-standalone');
}

// Init
createStars();
buildLibrary();
syncFullscreenIcon();
