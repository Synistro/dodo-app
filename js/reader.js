// ── reader.js — bibliothèque, lecteur, swipe, parallax vertical, fade texte ──

// ── Library ─────────────────────────────────────────────────────────────────

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

// ── Reader ───────────────────────────────────────────────────────────────────

let currentStory = null, currentScene = 0, totalScenes = 0;
let dragStartX = 0, dragStartY = 0, dragDeltaX = 0;
let isDragging = false, isVerticalScroll = false, directionLocked = false;

function openStory(id) {
  currentStory = STORIES.find(s => s.id === id);
  currentScene = 0;
  totalScenes = currentStory.scenes.length;
  buildTrack();
  renderDots();
  updateParallax();
  updateHints();
  showView('reader');
}

function buildTrack() {
  const track = document.getElementById('readerTrack');
  track.innerHTML = '';
  currentStory.scenes.forEach((scene, i) => {
    const panel = document.createElement('div');
    panel.className = 'scene-panel';
    panel.id = `panel-${i}`;
    const bgContent = scene.image
      ? `<img src="${scene.image}" alt="${scene.title}">`
      : `<div class="scene-bg-placeholder">${scene.imgEmoji || '✨'}</div>`;
    panel.innerHTML = `
      <div class="scene-bg" id="sceneBg-${i}" style="${!scene.image ? 'background:' + scene.imgBg : ''}">
        ${bgContent}
      </div>
      <div class="scene-overlay"></div>
      <div class="scene-text-layer" id="textLayer-${i}">
        <div class="scene-title">${scene.title}</div>
        <div class="scene-text">${formatText(scene.text)}</div>
      </div>`;
    track.appendChild(panel);
  });

  // Fade in initial de la première scène après un court délai
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const tl = document.getElementById(`textLayer-0`);
      if (tl) tl.classList.add('visible');
    });
  });

  setTrackX(currentScene, false);
  initSwipe();
  initPeek();
}

function formatText(t) {
  return t.split('\n\n').map(p => p.trim()).filter(Boolean)
    .map(p => p.startsWith('<blockquote>') ? p : `<p>${p}</p>`).join('');
}

function setTrackX(idx, animated = true) {
  const track = document.getElementById('readerTrack');
  if (!track) return;
  if (animated) track.classList.remove('dragging');
  else track.classList.add('dragging');
  track.style.transform = `translateX(${-idx * 100}%)`;
}

function goScene(dir) {
  const next = Math.max(0, Math.min(totalScenes - 1, currentScene + dir));
  if (next === currentScene) return;

  // 1. Fade out texte courant
  const curTL = document.getElementById(`textLayer-${currentScene}`);
  if (curTL) curTL.classList.remove('visible');

  // 2. Slide image après 300ms (pendant le fade out)
  setTimeout(() => {
    // Reset scroll sur la nouvelle scène (invisible pendant le fade)
    const nextTL = document.getElementById(`textLayer-${next}`);
    if (nextTL) nextTL.scrollTop = 0;

    currentScene = next;
    setTrackX(currentScene, true);
    updateParallax();
    renderDots();
    updateHints();

    // 3. Fade in texte nouvelle scène après la transition slide
    setTimeout(() => {
      const tl = document.getElementById(`textLayer-${currentScene}`);
      if (tl) tl.classList.add('visible');
    }, 300);

  }, 280);
}

// ── Parallax vertical ────────────────────────────────────────────────────────

function updateParallax() {
  const h = window.innerHeight;
  currentStory.scenes.forEach((_, i) => {
    const bg = document.getElementById(`sceneBg-${i}`);
    if (!bg) return;
    // Chaque scène non active décalée verticalement de 30% de la hauteur d'écran
    bg.style.transform = `translateY(${-(i - currentScene) * h * 0.3}px)`;
  });
}

// ── Hints ─────────────────────────────────────────────────────────────────────

function updateHints() {
  const l = document.getElementById('hintLeft');
  const r = document.getElementById('hintRight');
  if (l) l.style.opacity = currentScene > 0 ? '' : '0';
  if (r) r.style.opacity = currentScene < totalScenes - 1 ? '' : '0';
}

// ── Dots ──────────────────────────────────────────────────────────────────────

function renderDots() {
  const c = document.getElementById('readerDots');
  c.innerHTML = '';
  for (let i = 0; i < totalScenes; i++) {
    const d = document.createElement('div');
    d.className = 'reader-dot' + (i === currentScene ? ' active' : '');
    c.appendChild(d);
  }
}

// ── Peek : appui long pour masquer le texte et voir l'image ──────────────────

function initPeek() {
  const swipe = document.getElementById('readerSwipe');
  if (!swipe) return;

  swipe.addEventListener('pointerdown', e => {
    // Seulement si on tape sur la zone texte ou l'overlay
    const tl = document.getElementById(`textLayer-${currentScene}`);
    if (!tl) return;
    const panel = document.getElementById(`panel-${currentScene}`);
    if (!panel) return;
    panel.classList.add('text-hidden');

    const cancel = () => {
      panel.classList.remove('text-hidden');
      swipe.removeEventListener('pointerup', cancel);
      swipe.removeEventListener('pointercancel', cancel);
    };
    swipe.addEventListener('pointerup', cancel);
    swipe.addEventListener('pointercancel', cancel);
  });
}

// ── Swipe ────────────────────────────────────────────────────────────────────

function initSwipe() {
  const swipe = document.getElementById('readerSwipe');
  if (!swipe) return;
  // Cloner pour supprimer anciens listeners
  const fresh = swipe.cloneNode(true);
  swipe.parentNode.replaceChild(fresh, swipe);

  fresh.addEventListener('touchstart', onTouchStart, { passive: true });
  fresh.addEventListener('touchmove', onTouchMove, { passive: false });
  fresh.addEventListener('touchend', onTouchEnd);
  fresh.addEventListener('mousedown', onMouseDown);

  // Re-wire hints
  const hl = document.getElementById('hintLeft');
  const hr = document.getElementById('hintRight');
  if (hl) hl.onclick = () => goScene(-1);
  if (hr) hr.onclick = () => goScene(1);

  // Peek sur le nouveau nœud
  initPeekOn(fresh);
}

function initPeekOn(swipe) {
  let peekActive = false;

  swipe.addEventListener('pointerdown', () => {
    peekActive = false;
    // Petit délai : évite le déclenchement sur swipe rapide
    const peekTimer = setTimeout(() => {
      peekActive = true;
      const panel = document.getElementById(`panel-${currentScene}`);
      if (panel) panel.classList.add('text-hidden');
    }, 120);

    const cancel = () => {
      clearTimeout(peekTimer);
      peekActive = false;
      const panel = document.getElementById(`panel-${currentScene}`);
      if (panel) panel.classList.remove('text-hidden');
      swipe.removeEventListener('pointerup', cancel);
      swipe.removeEventListener('pointercancel', cancel);
      swipe.removeEventListener('pointermove', onMove);
    };

    const onMove = (e) => {
      // Si le doigt bouge de plus de 8px → c'est un swipe, pas un peek
      if (Math.abs(e.movementX) > 8 || Math.abs(e.movementY) > 8) {
        clearTimeout(peekTimer);
        if (peekActive) {
          peekActive = false;
          const panel = document.getElementById(`panel-${currentScene}`);
          if (panel) panel.classList.remove('text-hidden');
        }
      }
    };

    swipe.addEventListener('pointerup', cancel);
    swipe.addEventListener('pointercancel', cancel);
    swipe.addEventListener('pointermove', onMove);
  });
}

function onTouchStart(e) {
  dragStartX = e.touches[0].clientX;
  dragStartY = e.touches[0].clientY;
  dragDeltaX = 0;
  isDragging = true;
  directionLocked = false;
  isVerticalScroll = false;
}

function onTouchMove(e) {
  if (!isDragging) return;
  const dx = e.touches[0].clientX - dragStartX;
  const dy = e.touches[0].clientY - dragStartY;
  if (!directionLocked) {
    directionLocked = true;
    isVerticalScroll = Math.abs(dy) > Math.abs(dx);
  }
  if (isVerticalScroll) return;
  e.preventDefault();
  dragDeltaX = dx;
  const track = document.getElementById('readerTrack');
  if (track) {
    track.classList.add('dragging');
    track.style.transform = `translateX(${-currentScene * window.innerWidth + dx}px)`;
  }
}

function onTouchEnd() {
  if (!isDragging || isVerticalScroll) { isDragging = false; return; }
  isDragging = false;
  const thr = window.innerWidth * 0.25;
  if (dragDeltaX < -thr && currentScene < totalScenes - 1) goScene(1);
  else if (dragDeltaX > thr && currentScene > 0) goScene(-1);
  else { setTrackX(currentScene, true); }
  dragDeltaX = 0;
}

function onMouseDown(e) {
  dragStartX = e.clientX;
  dragDeltaX = 0;
  isDragging = true;
  isVerticalScroll = false;
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}

function onMouseMove(e) {
  if (!isDragging) return;
  dragDeltaX = e.clientX - dragStartX;
  const track = document.getElementById('readerTrack');
  if (track) {
    track.classList.add('dragging');
    track.style.transform = `translateX(${-currentScene * window.innerWidth + dragDeltaX}px)`;
  }
}

function onMouseUp() {
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);
  onTouchEnd();
}
