// ── reader.js — bibliothèque, lecteur scroll infini natif, dots, audio ───────

// ── Library ──────────────────────────────────────────────────────────────────

function buildLibrary() {
  const grid = document.getElementById('libGrid');
  grid.innerHTML = '';
  STORIES.forEach(story => {
    const card = document.createElement('div');
    card.className = 'story-card';
    card.onclick = () => openStory(story.id);
    const img = story.scenes[0].image;
    card.innerHTML = `
      <div class="story-thumb" style="background:${story.thumbBg}">
        ${img ? `<img src="${img}" alt="">` : story.emoji}
      </div>
      <div class="story-info">
        <div class="story-name">${story.title}</div>
        <div class="story-scenes">${story.scenes.length} scènes</div>
      </div>
      <div class="story-arrow">›</div>`;
    grid.appendChild(card);
  });
}

// ── Reader state ──────────────────────────────────────────────────────────────

let currentStory = null;
let currentScene = 0;
let totalScenes = 0;
let sceneObserver = null;

// ── Open story ────────────────────────────────────────────────────────────────

function openStory(id) {
  currentStory = STORIES.find(s => s.id === id);
  currentScene = 0;
  totalScenes = currentStory.scenes.length;
  buildTrack();
  showView('reader');
  // Scroll au top immédiatement
  const scroll = document.getElementById('readerScroll');
  if (scroll) scroll.scrollTop = 0;
  // Démarrer la berceuse si activée
  if (musicEnabled) startMusic();
}

// ── Back depuis reader ────────────────────────────────────────────────────────

function readerBack() {
  stopTTS();
  stopMusic();
  showView('library');
}

// ── Build track ───────────────────────────────────────────────────────────────

function buildTrack() {
  const track = document.getElementById('readerTrack');
  track.innerHTML = '';

  // Déconnecter l'observer précédent
  if (sceneObserver) { sceneObserver.disconnect(); sceneObserver = null; }

  currentStory.scenes.forEach((scene, i) => {
    const panel = document.createElement('div');
    panel.className = 'scene-panel';
    panel.id = `panel-${i}`;
    panel.dataset.index = i;

    const bgContent = scene.image
      ? `<img src="${scene.image}" alt="${scene.title}">`
      : `<div class="scene-bg-placeholder">${scene.imgEmoji || '✨'}</div>`;

    panel.innerHTML = `
      <div class="scene-bg" ${!scene.image ? `style="background:${scene.imgBg}"` : ''}>
        ${bgContent}
      </div>
      <div class="scene-overlay"></div>
      <div class="scene-text-layer">
        <div class="scene-title">${scene.title}</div>
        <div class="scene-text">${formatText(scene.text)}</div>
      </div>`;
    track.appendChild(panel);
  });

  initSceneObserver();
  initPeek();
  renderDots();
}

function formatText(t) {
  return t.split('\n\n').map(p => p.trim()).filter(Boolean)
    .map(p => p.startsWith('<blockquote>') ? p : `<p>${p}</p>`).join('');
}

// ── IntersectionObserver — dots + TTS stop ────────────────────────────────────

function initSceneObserver() {
  const scroll = document.getElementById('readerScroll');
  sceneObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const idx = parseInt(e.target.dataset.index);
        if (idx !== currentScene) {
          stopTTS();
          currentScene = idx;
          renderDots();
        }
      }
    });
  }, { threshold: 0.5, root: scroll });

  document.querySelectorAll('.scene-panel').forEach(p => sceneObserver.observe(p));
}

// ── Dots ──────────────────────────────────────────────────────────────────────

function renderDots() {
  const c = document.getElementById('readerDots');
  if (!c) return;
  c.innerHTML = '';
  for (let i = 0; i < totalScenes; i++) {
    const d = document.createElement('div');
    d.className = 'reader-dot' + (i === currentScene ? ' active' : '');
    c.appendChild(d);
  }
}

// ── Peek ──────────────────────────────────────────────────────────────────────

function initPeek() {
  const track = document.getElementById('readerTrack');
  if (!track) return;

  track.addEventListener('pointerdown', e => {
    let peekActive = false;
    let startY = e.clientY;

    const peekTimer = setTimeout(() => {
      peekActive = true;
      const panel = document.getElementById(`panel-${currentScene}`);
      if (panel) panel.classList.add('text-hidden');
    }, 120);

    const cancel = () => {
      clearTimeout(peekTimer);
      if (peekActive) {
        peekActive = false;
        const panel = document.getElementById(`panel-${currentScene}`);
        if (panel) panel.classList.remove('text-hidden');
      }
      track.removeEventListener('pointerup', cancel);
      track.removeEventListener('pointercancel', cancel);
      track.removeEventListener('pointermove', onMove);
    };

    const onMove = ev => {
      if (Math.abs(ev.clientY - startY) > 8) {
        clearTimeout(peekTimer);
        if (peekActive) {
          peekActive = false;
          const panel = document.getElementById(`panel-${currentScene}`);
          if (panel) panel.classList.remove('text-hidden');
        }
      }
    };

    track.addEventListener('pointerup', cancel);
    track.addEventListener('pointercancel', cancel);
    track.addEventListener('pointermove', onMove);
  });
}

// ── §14.11 Audio : berceuse ───────────────────────────────────────────────────

let musicEnabled = true;

function startMusic() {
  const audio = document.getElementById('bgMusic');
  if (!audio) return;
  audio.play().catch(() => {});
  document.getElementById('btnMusic').textContent = '🔇';
}

function stopMusic() {
  const audio = document.getElementById('bgMusic');
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
  const btn = document.getElementById('btnMusic');
  if (btn) btn.textContent = '🎵';
}

function toggleMusic() {
  const audio = document.getElementById('bgMusic');
  if (!audio) return;
  if (audio.paused) {
    musicEnabled = true;
    startMusic();
  } else {
    musicEnabled = false;
    stopMusic();
  }
}

// ── §14.11 Audio : TTS ───────────────────────────────────────────────────────

let ttsActive = false;
let currentUtterance = null;
let ttsVoice = null;

function initTTSVoice() {
  const voices = window.speechSynthesis.getVoices();
  // Préférer voix locale fr-FR
  ttsVoice = voices.find(v => v.lang === 'fr-FR' && v.localService)
    || voices.find(v => v.lang.startsWith('fr-FR'))
    || voices.find(v => v.lang.startsWith('fr'))
    || null;
}

// Les voix sont chargées async sur certains navigateurs
if (window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = initTTSVoice;
  initTTSVoice();
}

function getSceneText() {
  if (!currentStory) return '';
  const scene = currentStory.scenes[currentScene];
  if (!scene) return '';
  const raw = scene.title + '. ' + scene.text;
  return raw.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function startTTS() {
  if (!window.speechSynthesis) return;
  stopTTS();
  const text = getSceneText();
  if (!text) return;

  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = 'fr-FR';
  utt.rate = 0.85;
  utt.pitch = 0.9;
  utt.volume = 1;
  if (ttsVoice) utt.voice = ttsVoice;

  utt.onend = () => {
    ttsActive = false;
    currentUtterance = null;
    const btn = document.getElementById('btnTTS');
    if (btn) btn.textContent = '▶';
  };
  utt.onerror = () => {
    ttsActive = false;
    currentUtterance = null;
    const btn = document.getElementById('btnTTS');
    if (btn) btn.textContent = '▶';
  };

  currentUtterance = utt;
  ttsActive = true;
  window.speechSynthesis.speak(utt);
  document.getElementById('btnTTS').textContent = '■';
}

function stopTTS() {
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  ttsActive = false;
  currentUtterance = null;
  const btn = document.getElementById('btnTTS');
  if (btn) btn.textContent = '▶';
}

function toggleTTS() {
  if (ttsActive) stopTTS();
  else startTTS();
}
