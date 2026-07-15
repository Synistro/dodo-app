// ── reader.js — bibliothèque, lecteur scroll infini natif, parallax, text swap ─

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
let endAutoTimer = null;

// ── Open story ────────────────────────────────────────────────────────────────

function openStory(id) {
  if (endAutoTimer) { clearTimeout(endAutoTimer); endAutoTimer = null; }
  if (locked) {
    locked = false;
    document.getElementById('reader').classList.remove('reader-locked');
    const btnL = document.getElementById('btnLock');
    if (btnL) btnL.textContent = '🔒';
  }
  currentStory = STORIES.find(s => s.id === id);
  currentScene = 0;
  totalScenes = currentStory.scenes.length;
  buildTrack();
  showView('reader');
  const scroll = document.getElementById('readerScroll');
  if (scroll) scroll.scrollTop = 0;
  const endEl = document.getElementById('readerEnd');
  if (endEl) endEl.classList.remove('visible');
  if (musicEnabled) startMusic();
}

// ── Back depuis reader ────────────────────────────────────────────────────────

function readerBack() {
  if (endAutoTimer) { clearTimeout(endAutoTimer); endAutoTimer = null; }
  stopTTS();
  stopMusic();
  showView('library');
}

// ── §7.1 Build track — panels sans texte ────────────────────────────────────

function buildTrack() {
  const track = document.getElementById('readerTrack');
  track.innerHTML = '';
  if (sceneObserver) { sceneObserver.disconnect(); sceneObserver = null; }

  currentStory.scenes.forEach((scene, i) => {
    const panel = document.createElement('div');
    panel.className = 'scene-panel';
    panel.id = `panel-${i}`;
    panel.dataset.index = i;

    const bg = document.createElement('div');
    bg.className = 'scene-bg';
    if (!scene.image) bg.style.background = scene.imgBg || '#0a1a3a';

    if (scene.image) {
      const img = document.createElement('img');
      img.src = scene.image;
      img.alt = scene.title;
      img.onerror = () => {
        img.style.display = 'none';
        bg.style.background = scene.imgBg || '#0a1a3a';
        const ph = document.createElement('div');
        ph.className = 'scene-bg-placeholder';
        ph.textContent = scene.imgEmoji || '✨';
        bg.appendChild(ph);
      };
      bg.appendChild(img);
    } else {
      const ph = document.createElement('div');
      ph.className = 'scene-bg-placeholder';
      ph.textContent = scene.imgEmoji || '✨';
      bg.appendChild(ph);
    }

    const overlay = document.createElement('div');
    overlay.className = 'scene-overlay';

    panel.appendChild(bg);
    panel.appendChild(overlay);
    track.appendChild(panel);
  });

  // Page tampon finale : donne l'espace de scroll qui rend le seuil de
  // checkReaderEnd atteignable (avec le snap, plus d'overscroll élastique)
  const spacer = document.createElement('div');
  spacer.className = 'scene-panel end-spacer';
  track.appendChild(spacer);

  // Texte de la première scène — immédiat, sans fade
  swapSceneTextImmediate(0);
  renderDots();
  initScroll();
  initSceneObserver();
  initPeek();
}

function formatText(t) {
  return t.split('\n\n').map(p => p.trim()).filter(Boolean)
    .map(p => p.startsWith('<blockquote>') ? p : `<p>${p}</p>`).join('');
}

// ── §7.4 Text swap — crossfade CSS 0.25s ─────────────────────────────────────

function swapSceneText(idx) {
  const box = document.getElementById('readerTextBox');
  if (!box || !currentStory) return;
  box.classList.add('fading');
  setTimeout(() => {
    const scene = currentStory.scenes[idx];
    document.getElementById('rdrTitle').textContent = scene.title;
    document.getElementById('rdrText').innerHTML = formatText(scene.text);
    box.classList.remove('fading');
  }, 250);
}

function swapSceneTextImmediate(idx) {
  const box = document.getElementById('readerTextBox');
  if (!box || !currentStory) return;
  const scene = currentStory.scenes[idx];
  document.getElementById('rdrTitle').textContent = scene.title;
  document.getElementById('rdrText').innerHTML = formatText(scene.text);
  box.classList.remove('fading');
}

// ── §7.5 Preload image suivante ───────────────────────────────────────────────

function preloadNextImage(idx) {
  const next = currentStory && currentStory.scenes[idx + 1];
  if (next && next.image) {
    const img = new Image();
    img.src = next.image;
  }
}

// ── §7.3 Scroll listener passif + rAF ────────────────────────────────────────

function initScroll() {
  const scroll = document.getElementById('readerScroll');
  if (!scroll) return;
  // Clone pour vider les anciens listeners
  const fresh = scroll.cloneNode(false);
  while (scroll.firstChild) fresh.appendChild(scroll.firstChild);
  scroll.parentNode.replaceChild(fresh, scroll);
  fresh.id = 'readerScroll';

  fresh.addEventListener('scroll', () => {
    if (!rafPending) { rafPending = true; requestAnimationFrame(updateParallax); }
  }, { passive: true });

  // Re-bind l'observer si déjà créé
  if (sceneObserver) {
    document.querySelectorAll('.scene-panel').forEach(p => sceneObserver.observe(p));
  }
}

function updateParallax() {
  rafPending = false;
  const scroll = document.getElementById('readerScroll');
  if (!scroll || !currentStory) return;
  const scrollTop = scroll.scrollTop;
  const vh = window.innerHeight;

  // §7.3 Parallax image : translateY(relScroll * 0.3)
  currentStory.scenes.forEach((_, i) => {
    const panel = document.getElementById(`panel-${i}`);
    if (!panel) return;
    const bg = panel.querySelector('.scene-bg');
    if (bg) bg.style.transform = `translateY(${(scrollTop - i * vh) * 0.3}px)`;
  });

  // §7.4 Micro-parallax boîte texte : translateY(panelScroll * 0.05)
  const panelScroll = scrollTop - currentScene * vh;
  const textBox = document.getElementById('readerTextBox');
  if (textBox) textBox.style.transform = `translateY(${panelScroll * 0.05}px)`;

  checkReaderEnd(scrollTop, vh);
}

// ── §7.8 Écran de fin ─────────────────────────────────────────────────────────

function checkReaderEnd(scrollTop, vh) {
  if (!currentStory) return;
  const endEl = document.getElementById('readerEnd');
  if (!endEl) return;
  if (endEl.classList.contains('visible')) {
    // remonté sur la dernière scène → masquer la fin
    if (scrollTop < (totalScenes - 0.5) * vh) {
      endEl.classList.remove('visible');
      if (endAutoTimer) { clearTimeout(endAutoTimer); endAutoTimer = null; }
    }
    return;
  }
  if (currentScene === totalScenes - 1 && scrollTop >= (totalScenes - 0.1) * vh) {
    endEl.classList.add('visible');
    endAutoTimer = setTimeout(() => readerBack(), 5000);
  }
}

// ── §7.10 IntersectionObserver — scène courante ───────────────────────────────

function initSceneObserver() {
  const scroll = document.getElementById('readerScroll');
  sceneObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const idx = parseInt(e.target.dataset.index);
        if (isNaN(idx)) return; // page tampon de fin — pas une scène
        if (idx !== currentScene) {
          currentScene = idx;
          stopTTS();
          renderDots();
          swapSceneText(idx);
          preloadNextImage(idx);
          // Masquer l'écran de fin si l'utilisateur remonte
          const endEl = document.getElementById('readerEnd');
          if (endEl && endEl.classList.contains('visible')) {
            endEl.classList.remove('visible');
            if (endAutoTimer) { clearTimeout(endAutoTimer); endAutoTimer = null; }
          }
        }
      }
    });
  }, { threshold: 0.5, root: scroll });

  document.querySelectorAll('.scene-panel').forEach(p => sceneObserver.observe(p));
}

// ── §7.12 Dots ────────────────────────────────────────────────────────────────

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

// ── §7.7 Peek ────────────────────────────────────────────────────────────────

function initPeek() {
  const scroll = document.getElementById('readerScroll');
  if (!scroll) return;
  const reader = document.getElementById('reader');

  scroll.addEventListener('pointerdown', e => {
    if (locked) return;
    let peekActive = false;
    const startY = e.clientY;

    const peekTimer = setTimeout(() => {
      peekActive = true;
      reader.classList.add('peek-active');
    }, 120);

    function cleanup() {
      scroll.removeEventListener('pointerup', cancel);
      scroll.removeEventListener('pointercancel', cancel);
      scroll.removeEventListener('pointermove', onMove);
    }

    const onMove = ev => {
      if (Math.abs(ev.clientY - startY) > 8) {
        clearTimeout(peekTimer);
        if (peekActive) { peekActive = false; reader.classList.remove('peek-active'); }
        cleanup();
      }
    };

    const cancel = () => {
      clearTimeout(peekTimer);
      if (peekActive) { peekActive = false; reader.classList.remove('peek-active'); }
      cleanup();
    };

    scroll.addEventListener('pointerup', cancel);
    scroll.addEventListener('pointercancel', cancel);
    scroll.addEventListener('pointermove', onMove);
  });
}

// ── §7.9 Mode lecture verrouillé ─────────────────────────────────────────────

let locked = false;
let tapTimes = [];

function toggleLock() {
  locked = !locked;
  const reader = document.getElementById('reader');
  const btn = document.getElementById('btnLock');
  reader.classList.toggle('reader-locked', locked);
  if (btn) btn.textContent = locked ? '🔓' : '🔒';
}

// Déverrouillage : 3 taps rapides (< 600ms entre chaque)
document.addEventListener('pointerdown', () => {
  if (!locked) return;
  const now = Date.now();
  tapTimes = tapTimes.filter(t => now - t < 600);
  tapTimes.push(now);
  if (tapTimes.length >= 3) { tapTimes = []; toggleLock(); }
});

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
  const btn = document.getElementById('btnTTS');
  if (btn) btn.textContent = '■';
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
