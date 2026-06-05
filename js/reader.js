// ── reader.js — bibliothèque, lecteur scroll vertical snappé, parallax, fade ─

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

let currentStory = null, currentScene = 0, totalScenes = 0;
let dragStartY = 0, dragDeltaY = 0, isDragging = false, isSnapping = false;

// ── Open story ────────────────────────────────────────────────────────────────

function openStory(id) {
  currentStory = STORIES.find(s => s.id === id);
  currentScene = 0;
  totalScenes = currentStory.scenes.length;
  buildTrack();
  renderDots();
  updateParallax(0);
  showView('reader');
}

// ── Build track ───────────────────────────────────────────────────────────────

function buildTrack() {
  const track = document.getElementById('readerTrack');
  track.innerHTML = '';
  track.style.transition = 'none';
  track.style.transform = 'translateY(0)';

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

  // Fade in premier texte
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const tl = document.getElementById('textLayer-0');
    if (tl) tl.classList.add('visible');
  }));

  initSwipe();
  initPeek();
}

function formatText(t) {
  return t.split('\n\n').map(p => p.trim()).filter(Boolean)
    .map(p => p.startsWith('<blockquote>') ? p : `<p>${p}</p>`).join('');
}

// ── Parallax vertical ─────────────────────────────────────────────────────────

function updateParallax(dragOffset) {
  const h = window.innerHeight;
  currentStory.scenes.forEach((_, i) => {
    const bg = document.getElementById(`sceneBg-${i}`);
    if (!bg) return;
    bg.style.transform = `translateY(${-(i - currentScene) * h * 0.4 + dragOffset * 0.4}px)`;
  });
}

// ── Snap to scene ─────────────────────────────────────────────────────────────

function snapToScene(next) {
  if (isSnapping) return;
  const goTo = Math.max(0, Math.min(totalScenes - 1, next));
  const changing = goTo !== currentScene;

  if (changing) {
    // Fade out texte courant
    const curTL = document.getElementById(`textLayer-${currentScene}`);
    if (curTL) curTL.classList.remove('visible');
  }

  isSnapping = true;
  currentScene = goTo;

  const track = document.getElementById('readerTrack');
  if (track) {
    track.classList.remove('dragging');
    track.style.transform = `translateY(${-currentScene * window.innerHeight}px)`;
  }

  // Parallax sans offset
  updateParallax(0);
  renderDots();

  // Fade in nouveau texte après la transition (500ms)
  if (changing) {
    setTimeout(() => {
      const tl = document.getElementById(`textLayer-${currentScene}`);
      if (tl) { tl.scrollTop = 0; tl.classList.add('visible'); }
      isSnapping = false;
    }, 500);
  } else {
    setTimeout(() => { isSnapping = false; }, 300);
  }
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

// ── Swipe vertical ────────────────────────────────────────────────────────────

function initSwipe() {
  // Cloner #readerSwipe pour reset les listeners
  const old = document.getElementById('readerSwipe');
  if (!old) return;
  const fresh = old.cloneNode(true);
  old.parentNode.replaceChild(fresh, old);

  fresh.addEventListener('touchstart', onTouchStart, { passive: true });
  fresh.addEventListener('touchmove', onTouchMove, { passive: false });
  fresh.addEventListener('touchend', onTouchEnd);
  fresh.addEventListener('mousedown', onMouseDown);

  initPeekOn(fresh);
}

function onTouchStart(e) {
  if (isSnapping) return;
  dragStartY = e.touches[0].clientY;
  dragDeltaY = 0;
  isDragging = true;
}

function onTouchMove(e) {
  if (!isDragging || isSnapping) return;
  e.preventDefault();
  dragDeltaY = e.touches[0].clientY - dragStartY;
  const track = document.getElementById('readerTrack');
  if (track) {
    track.classList.add('dragging');
    track.style.transform = `translateY(${-currentScene * window.innerHeight + dragDeltaY}px)`;
  }
  updateParallax(dragDeltaY);
}

function onTouchEnd() {
  if (!isDragging) return;
  isDragging = false;
  const thr = window.innerHeight * 0.20;
  if (dragDeltaY < -thr) snapToScene(currentScene + 1);
  else if (dragDeltaY > thr) snapToScene(currentScene - 1);
  else snapToScene(currentScene);
  dragDeltaY = 0;
}

function onMouseDown(e) {
  if (isSnapping) return;
  dragStartY = e.clientY;
  dragDeltaY = 0;
  isDragging = true;
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}

function onMouseMove(e) {
  if (!isDragging || isSnapping) return;
  dragDeltaY = e.clientY - dragStartY;
  const track = document.getElementById('readerTrack');
  if (track) {
    track.classList.add('dragging');
    track.style.transform = `translateY(${-currentScene * window.innerHeight + dragDeltaY}px)`;
  }
  updateParallax(dragDeltaY);
}

function onMouseUp() {
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);
  onTouchEnd();
}

// ── Peek ──────────────────────────────────────────────────────────────────────

function initPeek() {}  // appelé depuis buildTrack, initPeekOn s'occupe de tout

function initPeekOn(swipe) {
  swipe.addEventListener('pointerdown', () => {
    if (isSnapping) return;
    let peekActive = false;

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
      swipe.removeEventListener('pointerup', cancel);
      swipe.removeEventListener('pointercancel', cancel);
      swipe.removeEventListener('pointermove', onMove);
    };

    const onMove = () => {
      if (Math.abs(dragDeltaY) > 8) {
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
