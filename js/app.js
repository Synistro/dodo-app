// ── app.js — navigation, étoiles, fullscreen, history nav, init ─────────────

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

// ── Vue courante ──────────────────────────────────────────────────────────────

let currentView = 'landing';

function showView(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  currentView = id;
  history.pushState({ view: id }, '');
  if (id === 'landing' || id === 'library') {
    if (typeof stopTTS === 'function') stopTTS();
    if (typeof stopMusic === 'function') stopMusic();
  }
}

// ── §14.12 Navigation bouton retour Android ───────────────────────────────────

window.addEventListener('popstate', e => {
  switch (currentView) {
    case 'reader':
      if (typeof readerBack === 'function') readerBack();
      else showView('library');
      break;
    case 'library':
      showView('landing');
      break;
    case 'game':
      if (typeof stopGame === 'function') stopGame();
      showView('landing');
      break;
    case 'landing':
    default:
      // Laisser l'OS gérer — repusher pour ne pas vider la pile
      history.pushState({ view: 'landing' }, '');
      break;
  }
});

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

if (window.navigator.standalone === true) {
  document.body.classList.add('pwa-standalone');
}

// ── Init ──────────────────────────────────────────────────────────────────────

createStars();
buildLibrary();
syncFullscreenIcon();
// État initial dans l'historique
history.replaceState({ view: 'landing' }, '');
