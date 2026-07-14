// ── app.js — navigation, étoiles, fullscreen, history, init ──────────────────

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

// ── §4 Bouton retour Android — popstate ──────────────────────────────────────

window.addEventListener('popstate', () => {
  switch (currentView) {
    case 'reader':
      if (typeof readerBack === 'function') readerBack();
      else showView('library');
      break;
    case 'library':
    case 'games':
      showView('landing');
      break;
    case 'game':
      if (typeof stopGame === 'function') stopGame();
      showView('games');
      break;
    case 'fireflies':
      if (typeof stopFireflies === 'function') stopFireflies();
      showView('games');
      break;
    case 'animals':
      showView('games');
      break;
    case 'memory':
      if (typeof stopMemory === 'function') stopMemory();
      showView('games');
      break;
    case 'morpion':
      if (typeof stopMorpion === 'function') stopMorpion();
      showView('games');
      break;
    case 'runner':
      if (typeof stopRunner === 'function') stopRunner();
      showView('games');
      break;
    case 'landing':
    default:
      // Repush pour ne pas vider la pile
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

// ── §15.3 Unlock audio iOS ────────────────────────────────────────────────────

let audioUnlocked = false;
function unlockAudio() {
  if (audioUnlocked) return;
  const audio = document.getElementById('bgMusic');
  if (!audio) return;
  audio.play().then(() => { audio.pause(); audio.currentTime = 0; audioUnlocked = true; }).catch(() => {});
}
document.addEventListener('touchstart', unlockAudio, { once: true });
document.addEventListener('click', unlockAudio, { once: true });

// ── §15.4 Orientation lock ────────────────────────────────────────────────────

try { screen.orientation.lock('portrait').catch(() => {}); } catch(e) {}

// ── PWA standalone ────────────────────────────────────────────────────────────

if (window.navigator.standalone === true) {
  document.body.classList.add('pwa-standalone');
}

// ── Init ──────────────────────────────────────────────────────────────────────

createStars();
buildLibrary();
syncFullscreenIcon();
history.replaceState({ view: 'landing' }, '');
