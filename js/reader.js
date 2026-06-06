// ── reader.js — bibliothèque, lecteur scroll infini natif, parallax, fade, audio ─

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
let rafPending = false;

// ── Open story ────────────────────────────────────────────────────────────────

function openStory(id) {
  currentStory = STORIES.find(s => s.id === id);
  currentScene = 0;
  totalScenes = currentStory.scenes.length;
  buildTrack();
  showView('reader');
  const scroll = document.getElementById('readerScroll');
  if (scroll) scroll.scrollTop = 0;
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
      <div class="scene-text-layer" id="textLayer-${i}">
        <div class="scene-title">${scene.title}</div>
        <div class="scene-text">${formatText(scene.text)}</div>
      </div>`;
    track.appendChild(panel);
  });

  // Premier panel visible immédiatement
  requestAnimationFrame(() => {
    const tl = document.getElementById('textLayer-0');
    if (tl) tl.style.opacity = '1';
  });

  initScroll();
  initSceneObserver();
  initPeek();
  renderDots();
}

function formatText(t) {
  return t.split('\n\n').map(p => p.trim()).filter(Boolean)
    .map(p => p.startsWith('<blockquote>') ? p : `<p>${p}</p>`).join('');
}

// ── Scroll listener — parallax + fade texte ───────────────────────────────────

function initScroll() {
  const scroll = document.getElementById('readerScroll');
  if (!scroll) return;
  // Retirer l'ancien listener proprement via clone
  const fresh = scroll.cloneNode(false);
  while (scroll.firstChild) fresh.appendChild(scroll.firstChild);
  scroll.parentNode.replaceChild(fresh, scroll);
  fresh.id = 'readerScroll';

  fresh.addEventListener('scroll', () => {
    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(updateParallaxAndFade);
    }
  }, { passive: true });

  // Re-bind l'observer sur le nouveau nœud
  if (sceneObserver) {
    document.querySelectorAll('.scene-panel').forEach(p => sceneObserver.observe(p));
  }
}

function updateParallaxAndFade() {
  rafPending = false;
  const scroll = document.getElementById('readerScroll');
  if (!scroll || !currentStory) return;
  const scrollTop = scroll.scrollTop;
  const vh = window.innerHeight;

  currentStory.scenes.forEach((_, i) => {
    const panel = document.getElementById(`panel-${i}`);
    if (!panel) return;
    const panelTop = i * vh;
    const relScroll = scrollTop - panelTop;

    // Parallax image : l'image avance à 30% du scroll relatif au panel
    const bg = panel.querySelector('.scene-bg');
    if (bg) bg.style.transform = `translateY(${relScroll * 0.3}px)`;

    // Fade texte : fade-in sur 0→10% du panel, stable, fade-out sur 85→100%
    const tl = panel.querySelector('.scene-text-layer');
    if (tl) {
      const progress = relScroll / vh; // 0 = panel en haut du viewport, 1 = panel sorti
      let opacity;
      if (progress < 0) {
        opacity = 0;
      } else if (progress < 0.1) {
        opacity = progress / 0.1;
      } else if (progress > 0.85) {
        opacity = Math.max(0, (1 - progress) / 0.15);
      } else {
        opacity = 1;
      }
      tl.style.opacity = opacity;
    }
  });
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
    const startY = e.clientY;

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

// ── §14.11 Berceuse ───────────────────────────────────────────────────────────

let musicEnabled = true;

function startMusic() {
  const audio = document.getElementById('bgMusic');
  if (!audio) return;
  audio.play().catch(() => {});
  const btn = document.getElementById('btnMusic');
  if (btn) btn.textContent = '🔇';
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
  if (audio.paused) { musicEnabled = true; startMusic(); }
  else { musicEnabled = false; stopMusic(); }
}

// ── §14.11 TTS ────────────────────────────────────────────────────────────────

let ttsActive = false;
let ttsVoice = null;

function initTTSVoice() {
  const voices = window.speechSynthesis.getVoices();
  ttsVoice = voices.find(v => v.lang === 'fr-FR' && v.localService)
    || voices.find(v => v.lang.startsWith('fr-FR'))
    || voices.find(v => v.lang.startsWith('fr'))
    || null;
}

if (window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = initTTSVoice;
  initTTSVoice();
}

function getSceneText() {
  if (!currentStory) return '';
  const scene = currentStory.scenes[currentScene];
  if (!scene) return '';
  return (scene.title + '. ' + scene.text).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function startTTS() {
  if (!window.speechSynthesis) return;
  stopTTS();
  const text = getSceneText();
  if (!text) return;
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = 'fr-FR'; utt.rate = 0.85; utt.pitch = 0.9; utt.volume = 1;
  if (ttsVoice) utt.voice = ttsVoice;
  const resetBtn = () => {
    ttsActive = false;
    const btn = document.getElementById('btnTTS');
    if (btn) btn.textContent = '▶';
  };
  utt.onend = resetBtn;
  utt.onerror = resetBtn;
  ttsActive = true;
  window.speechSynthesis.speak(utt);
  document.getElementById('btnTTS').textContent = '■';
}

function stopTTS() {
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  ttsActive = false;
  const btn = document.getElementById('btnTTS');
  if (btn) btn.textContent = '▶';
}

function toggleTTS() {
  if (ttsActive) stopTTS(); else startTTS();
}
