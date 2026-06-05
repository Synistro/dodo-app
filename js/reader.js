// ── reader.js — bibliothèque, lecteur, swipe, parallax ──────────────────────

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
  updateParallax(0);
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
      <div class="scene-text-layer">
        <div class="scene-title">${scene.title}</div>
        <div class="scene-text">${formatText(scene.text)}</div>
      </div>`;
    track.appendChild(panel);
  });
  setTrackX(currentScene, false);
  initSwipe();
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
  const panel = document.getElementById(`panel-${next}`);
  if (panel) {
    const tl = panel.querySelector('.scene-text-layer');
    if (tl) tl.scrollTop = 0;
  }
  currentScene = next;
  setTrackX(currentScene, true);
  renderDots();
  updateParallax(0);
  updateHints();
}

function updateParallax(dragOffset) {
  const w = window.innerWidth;
  currentStory.scenes.forEach((_, i) => {
    const bg = document.getElementById(`sceneBg-${i}`);
    if (!bg) return;
    bg.style.transform = `translateX(${-(i - currentScene) * w * 0.3 + dragOffset * 0.3}px)`;
  });
}

function updateHints() {
  const l = document.getElementById('hintLeft');
  const r = document.getElementById('hintRight');
  if (l) l.style.opacity = currentScene > 0 ? '' : '0';
  if (r) r.style.opacity = currentScene < totalScenes - 1 ? '' : '0';
}

function renderDots() {
  const c = document.getElementById('readerDots');
  c.innerHTML = '';
  for (let i = 0; i < totalScenes; i++) {
    const d = document.createElement('div');
    d.className = 'reader-dot' + (i === currentScene ? ' active' : '');
    c.appendChild(d);
  }
}

// ── Swipe ────────────────────────────────────────────────────────────────────

function initSwipe() {
  const swipe = document.getElementById('readerSwipe');
  if (!swipe) return;
  // Remove old listeners by cloning
  const fresh = swipe.cloneNode(true);
  swipe.parentNode.replaceChild(fresh, swipe);
  fresh.addEventListener('touchstart', onTouchStart, { passive: true });
  fresh.addEventListener('touchmove', onTouchMove, { passive: false });
  fresh.addEventListener('touchend', onTouchEnd);
  fresh.addEventListener('mousedown', onMouseDown);
  // Re-wire hint buttons
  document.getElementById('hintLeft').onclick = () => goScene(-1);
  document.getElementById('hintRight').onclick = () => goScene(1);
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
  if (!directionLocked) { directionLocked = true; isVerticalScroll = Math.abs(dy) > Math.abs(dx); }
  if (isVerticalScroll) return;
  e.preventDefault();
  dragDeltaX = dx;
  const track = document.getElementById('readerTrack');
  if (track) {
    track.classList.add('dragging');
    track.style.transform = `translateX(${-currentScene * window.innerWidth + dx}px)`;
  }
  updateParallax(dx);
}

function onTouchEnd() {
  if (!isDragging || isVerticalScroll) { isDragging = false; return; }
  isDragging = false;
  const thr = window.innerWidth * 0.25;
  if (dragDeltaX < -thr && currentScene < totalScenes - 1) goScene(1);
  else if (dragDeltaX > thr && currentScene > 0) goScene(-1);
  else { setTrackX(currentScene, true); updateParallax(0); }
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
  updateParallax(dragDeltaX);
}

function onMouseUp() {
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);
  onTouchEnd();
}
