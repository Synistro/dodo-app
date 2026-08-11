// ── bookview.js — Le Livre de Jayden : couverture 3D, sommaire, pages tournantes ─
// v2 : le livre-objet partout (portrait ET double page), texte scrollable dans sa
// page avec affordance visible, zoom pinch/double-tap sur les illustrations,
// DOM fenêtré (±2 feuilles montées) + lazy images = fluide sur mobile.
// Portrait : 1 feuille = 1 page plein écran. Large (pliable déplié, desktop) :
// vrai livre ouvert — image à gauche, texte à droite, pli central.

// ── Couverture + sommaire (inchangés) ─────────────────────────────────────────

function openBookView() {
  document.getElementById('bookView').classList.remove('open');
  showView('bookView');
}

function openBookCover() {
  document.getElementById('bookView').classList.add('open');
}

function buildBookToc() {
  const cover = document.getElementById('bookCoverImg');
  if (cover) cover.src = BOOK.cover;
  const toc = document.getElementById('bookToc');
  toc.innerHTML = '';
  BOOK.tomes.forEach(tome => {
    const entry = document.createElement('div');
    entry.className = 'toc-entry' + (tome.available ? '' : ' toc-disabled');
    const nbPages = tome.chapters.reduce((n, c) => n + c.pages.length, 0);
    const sub = tome.available
      ? (tome.id === 't0' ? `${nbPages} pages` : `${tome.chapters.length} chapitres`)
      : 'En préparation…';
    entry.innerHTML = `
      <div class="toc-info">
        <div class="toc-title">${tome.title}</div>
        <div class="toc-sub">${sub}</div>
      </div>
      <div class="toc-arrow">${tome.available ? '›' : ''}</div>`;
    if (tome.available) entry.onclick = () => openTome(tome.id);
    toc.appendChild(entry);
  });
}

// ── État du lecteur ───────────────────────────────────────────────────────────

let bkTomeId = null;
let bkPagesList = [];   // pages portrait : {type, img?, text?, kicker?, title?, spread}
let bkSpreads = [];     // doubles pages : {left, right, firstPage}
let bkMode = 'portrait';
let bkCur = 0;          // index page (portrait)
let bksCur = 0;         // index double page (spread)
let bkLeaves = [];      // feuilles portrait
let bkSheets = [];      // feuilles spread (moitié droite)
let bkTotal = 0;

const bkWideMQ = window.matchMedia('(min-width: 600px) and (min-aspect-ratio: 9/10)');
bkWideMQ.addEventListener('change', () => {
  if (bkTomeId && document.getElementById('bookReader').classList.contains('active')) bkRender(true);
});
window.addEventListener('resize', () => {
  // pliage/dépliage sans franchir la media query : rien à faire ; avec : géré ci-dessus
});

// ── Construction des données (pages + doubles pages) ─────────────────────────

function bkBuildData(tome) {
  const pages = [];
  const spreads = [];
  const isPrologue = tome.id === 't0';
  tome.chapters.forEach((ch, ci) => {
    const kicker = isPrologue ? 'Prologue' : `Chapitre ${ci + 1}`;
    pages.push({ type: 'title', kicker, title: ch.title, spread: spreads.length });
    spreads.push({ left: { type: 'deco' }, right: pages[pages.length - 1], firstPage: pages.length - 1 });
    ch.pages.forEach(p => {
      const ip = { type: 'image', img: p.img, kicker, title: ch.title, spread: spreads.length };
      const tp = { type: 'text', kicker, title: ch.title, text: p.text, spread: spreads.length };
      pages.push(ip, tp);
      spreads.push({ left: ip, right: tp, firstPage: pages.length - 2 });
    });
  });
  const ep = { type: 'end', isPrologue, spread: spreads.length };
  pages.push(ep);
  spreads.push({ left: { type: 'deco' }, right: ep, firstPage: pages.length - 1 });
  bkPagesList = pages;
  bkSpreads = spreads;
}

function formatBookText(t) {
  return t.split('\n\n').map(p => p.trim()).filter(Boolean).map(p => `<p>${p}</p>`).join('');
}

// numéro de la paire image+texte (affiché sur la page papier)
function bkPairNum(pageIdx) {
  let n = 0;
  for (let i = 0; i <= pageIdx; i++) if (bkPagesList[i].type === 'image') n++;
  return n;
}

// ── Contenu d'une page (partagé portrait / spread) ────────────────────────────

function bkPageContent(page, pageIdx) {
  const el = document.createElement('div');
  if (page.type === 'image') {
    el.className = 'bk-face bk-image';
    const img = document.createElement('img');
    img.alt = page.title ? `Illustration — ${page.kicker} · ${page.title}` : 'Illustration';
    img.draggable = false;
    img.decoding = 'async';
    img.addEventListener('load', () => img.classList.add('ld'), { once: true });
    img.src = page.img;
    if (img.complete && img.naturalWidth) img.classList.add('ld');
    el.appendChild(img);
    bkAttachZoom(el, img);
  } else if (page.type === 'text') {
    el.className = 'bk-face bk-paper';
    el.innerHTML = `
      <div class="bk-kicker">${page.kicker} · ${page.title}</div>
      <div class="bk-body" tabindex="0">${formatBookText(page.text)}</div>
      <div class="bk-more">⌄</div>
      <div class="bk-num">~ ${bkPairNum(pageIdx)} ~</div>`;
    const body = el.querySelector('.bk-body');
    const upd = () => {
      const more = body.scrollHeight - body.clientHeight - body.scrollTop > 8;
      el.classList.toggle('has-more', more);
    };
    body.addEventListener('scroll', upd, { passive: true });
    requestAnimationFrame(upd);
    el._updMore = upd;
  } else if (page.type === 'title') {
    el.className = 'bk-face bk-paper bk-titlepage';
    el.innerHTML = `
      <div class="bk-tp-kicker">${page.kicker}</div>
      <div class="bk-tp-title">${page.title}</div>
      <div class="bk-tp-orn">⚓</div>`;
  } else if (page.type === 'deco') {
    el.className = 'bk-face bk-paper bk-deco';
    el.innerHTML = `<div class="bk-deco-orn">⚓</div>`;
  } else {
    el.className = 'bk-face bk-paper bk-endpage';
    el.innerHTML = `
      <div class="bk-end-moon">🌙</div>
      <div class="bk-end-msg">${page.isPrologue ? 'Fin du prologue.' : 'Fin du tome.'}<br>Bonne nuit, Capitaine.</div>
      <button class="reader-end-btn" onclick="bkReplay()">Revoir</button>
      <button class="reader-end-btn" onclick="closeTome()">Retour au sommaire</button>`;
  }
  return el;
}

// ── Ouverture / rendu ─────────────────────────────────────────────────────────

function openTome(id) {
  const tome = BOOK.tomes.find(t => t.id === id);
  if (!tome || !tome.available) return;
  bkTomeId = id;
  bkBuildData(tome);
  bkCur = 0; bksCur = 0;
  bkRender(false);
  showView('bookReader');
}

function bkRender(keepPos) {
  bkZoomActive = false; // le DOM est reconstruit, aucune image ne peut rester zoomée
  const wide = bkWideMQ.matches;
  if (keepPos) {
    // conserver la position en changeant de mode (pliage/dépliage)
    if (wide && bkMode === 'portrait') bksCur = bkPagesList[bkCur].spread;
    if (!wide && bkMode === 'spread') bkCur = bkSpreads[bksCur].firstPage;
  }
  bkMode = wide ? 'spread' : 'portrait';
  const container = document.getElementById('bkPages');
  container.innerHTML = '';
  container.classList.toggle('bk-wide', wide);
  bkLeaves = []; bkSheets = [];
  if (wide) bkRenderSpread(container); else bkRenderPortrait(container);
  bkUpdateNav();
}

// — Portrait : 1 feuille plein écran = 1 page —

function bkRenderPortrait(container) {
  bkTotal = bkPagesList.length;
  bkPagesList.forEach((page, i) => {
    const leaf = document.createElement('div');
    leaf.className = 'bk-leaf';
    leaf.dataset.index = i;
    leaf.dataset.type = page.type;
    if (i < bkCur) leaf.classList.add('turned');
    leaf.style.zIndex = i < bkCur ? (2 * bkTotal - i) - bkTotal : 2 * bkTotal - i;
    const back = document.createElement('div');
    back.className = 'bk-back';
    leaf.appendChild(back); // le front est monté par la fenêtre (bkWindow)
    leaf.addEventListener('transitionend', e => {
      if (e.propertyName !== 'transform') return;
      leaf.classList.remove('bk-anim', 'bk-live');
      leaf.style.zIndex = leaf.classList.contains('turned') ? (2 * bkTotal - i) - bkTotal : 2 * bkTotal - i;
    });
    container.appendChild(leaf);
    bkLeaves.push(leaf);
  });
  bkWindow();
}

function bkMountLeaf(i) {
  const leaf = bkLeaves[i];
  if (!leaf || leaf.querySelector('.bk-face')) return;
  leaf.insertBefore(bkPageContent(bkPagesList[i], i), leaf.firstChild);
}

function bkWindow() {
  // seules les feuilles voisines existent à l'écran : ±2 montées, le reste éteint
  bkLeaves.forEach((leaf, i) => {
    const near = Math.abs(i - bkCur) <= 2;
    leaf.style.display = near ? '' : 'none';
    if (near) bkMountLeaf(i);
    else {
      const f = leaf.querySelector('.bk-face');
      if (f) { if (f.classList.contains('bk-zoomed')) bkZoomActive = false; f.remove(); }
    }
  });
  bkPreload();
}

function bkPreload() {
  for (let i = bkCur + 1; i <= bkCur + 3; i++) {
    const p = bkPagesList[i];
    if (p && p.type === 'image') { const im = new Image(); im.src = p.img; }
  }
}

// — Spread : livre ouvert, feuilles = moitié droite qui pivote sur le pli —

function bkRenderSpread(container) {
  bkTotal = bkSpreads.length;
  const book = document.createElement('div');
  book.className = 'bks-book';
  book.id = 'bksBook';
  const baseL = document.createElement('div');
  baseL.className = 'bks-base bks-base-left';
  const baseR = document.createElement('div');
  baseR.className = 'bks-base bks-base-right';
  book.appendChild(baseL); book.appendChild(baseR);
  bkSpreads.forEach((sp, s) => {
    const sheet = document.createElement('div');
    sheet.className = 'bk-sheet';
    sheet.dataset.index = s;
    if (s < bksCur) sheet.classList.add('turned');
    sheet.style.zIndex = s < bksCur ? 10 + s : 10 + (bkTotal - s);
    const front = document.createElement('div');
    front.className = 'bks-front';
    const back = document.createElement('div');
    back.className = 'bks-back';
    sheet.appendChild(front); sheet.appendChild(back);
    sheet.addEventListener('transitionend', e => {
      if (e.propertyName !== 'transform') return;
      sheet.classList.remove('bk-anim', 'bk-live');
      const i = parseInt(sheet.dataset.index);
      sheet.style.zIndex = sheet.classList.contains('turned') ? 10 + i : 10 + (bkTotal - i);
    });
    book.appendChild(sheet);
    bkSheets.push(sheet);
  });
  const spine = document.createElement('div');
  spine.className = 'bks-spine';
  book.appendChild(spine);
  container.appendChild(book);
  bkWindowSpread();
}

function bkMountSheet(s) {
  const sheet = bkSheets[s];
  if (!sheet) return;
  const front = sheet.querySelector('.bks-front');
  const back = sheet.querySelector('.bks-back');
  // front (côté droit du spread s) : la page droite ; dos : la page gauche du spread s+1
  if (!front.firstChild) {
    const sp = bkSpreads[s];
    front.appendChild(bkPageContent(sp.right, sp.firstPage + (sp.right.type === 'text' ? 1 : 0)));
  }
  if (!back.firstChild) {
    const nxt = bkSpreads[s + 1];
    back.appendChild(bkPageContent(nxt ? nxt.left : { type: 'deco' }, nxt ? nxt.firstPage : 0));
  }
}

function bkWindowSpread() {
  bkSheets.forEach((sheet, s) => {
    const near = Math.abs(s - bksCur) <= 2;
    sheet.style.display = near ? '' : 'none';
    if (near) bkMountSheet(s);
    else sheet.querySelectorAll('.bk-face').forEach(f => { if (f.classList.contains('bk-zoomed')) bkZoomActive = false; f.remove(); });
  });
  // la base gauche montre le décor quand rien n'est encore tourné
  for (let s = bksCur + 1; s <= bksCur + 2; s++) {
    const sp = bkSpreads[s];
    if (sp && sp.left && sp.left.type === 'image') { const im = new Image(); im.src = sp.left.img; }
  }
}

// ── Navigation (partagée) ─────────────────────────────────────────────────────

function bkAtEnd() { return bkMode === 'portrait' ? bkCur >= bkTotal - 1 : bksCur >= bkTotal - 1; }
function bkAtStart() { return bkMode === 'portrait' ? bkCur <= 0 : bksCur <= 0; }

function bkNext() {
  if (bkAtEnd()) return;
  bkResetZoom();
  if (bkMode === 'portrait') {
    const leaf = bkLeaves[bkCur];
    leaf.style.zIndex = 3 * bkTotal;
    leaf.style.transform = '';
    leaf.classList.add('bk-anim', 'bk-live', 'turned');
    bkCur++;
    bkWindow();
  } else {
    const sheet = bkSheets[bksCur];
    sheet.style.zIndex = 200;
    sheet.style.transform = '';
    sheet.classList.add('bk-anim', 'bk-live', 'turned');
    bksCur++;
    bkWindowSpread();
  }
  bkPageSound(); bkUpdateNav();
}

function bkPrev() {
  if (bkAtStart()) return;
  bkResetZoom();
  if (bkMode === 'portrait') {
    bkCur--;
    const leaf = bkLeaves[bkCur];
    leaf.style.zIndex = 3 * bkTotal;
    leaf.style.transform = '';
    leaf.classList.add('bk-anim', 'bk-live');
    leaf.classList.remove('turned');
    bkWindow();
  } else {
    bksCur--;
    const sheet = bkSheets[bksCur];
    sheet.style.zIndex = 200;
    sheet.style.transform = '';
    sheet.classList.add('bk-anim', 'bk-live');
    sheet.classList.remove('turned');
    bkWindowSpread();
  }
  bkPageSound(); bkUpdateNav();
}

function bkReplay() {
  bkCur = 0; bksCur = 0;
  bkRender(false);
}

function closeTome() {
  showView('bookView'); // le livre reste ouvert sur le sommaire
}

function bkUpdateNav() {
  // recalculer l'affordance des textes visibles (une page démasquée a clientHeight 0 → chevron faux)
  requestAnimationFrame(() => {
    document.querySelectorAll('#bkPages .bk-paper').forEach(p => { if (p._updMore) p._updMore(); });
  });
  const ind = document.getElementById('bkInd');
  const prev = document.getElementById('bkArrowPrev');
  const next = document.getElementById('bkArrowNext');
  if (!ind) return;
  const cur = bkMode === 'portrait' ? bkCur : bksCur;
  ind.textContent = `${cur + 1} / ${bkTotal}`;
  prev.classList.toggle('off', bkAtStart());
  next.classList.toggle('off', bkAtEnd());
}

// ── Zoom d'illustration : pinch + double-tap + pan (par image) ────────────────
// Tant que l'image est zoomée, le tourne-page est neutralisé (les événements
// sont consommés ici) ; pincer/double-taper ramène à l'échelle 1.

let bkZoomActive = false;    // au moins une image actuellement zoomée
let bkCancelPendingTap = () => {}; // posé par initBookGestures ; annule un tap différé (double-tap zoom)

// remet à 1 toute image zoomée encore montée et libère les gestes — appelé à
// chaque tournage/ouverture/replay et avant tout démontage de feuille
function bkResetZoom() {
  document.querySelectorAll('#bkPages .bk-zoomed').forEach(w => { if (w._zoomReset) w._zoomReset(); });
  bkZoomActive = false;
}

function bkAttachZoom(wrap, img) {
  let scale = 1, tx = 0, ty = 0;
  const ptrs = new Map();
  let startDist = 0, startScale = 1, startTx = 0, startTy = 0, startMid = null;
  let panPtr = null, panStart = null, lastTap = 0, lastTapX = 0, lastTapY = 0;

  // sortie de zoom visible (petits doigts : le double-tap/pincer ne suffit pas)
  const outBtn = document.createElement('button');
  outBtn.className = 'bk-zoom-out';
  outBtn.setAttribute('aria-label', 'Revenir à la page');
  outBtn.textContent = '↺';
  outBtn.addEventListener('pointerdown', e => e.stopPropagation());
  outBtn.addEventListener('pointerup', e => e.stopPropagation());
  outBtn.addEventListener('click', e => { e.stopPropagation(); wrap._zoomReset(); });
  wrap.appendChild(outBtn);

  function isDoubleTap(x, y, now) {
    // double-tap = proche dans le TEMPS **et** dans l'ESPACE (sinon deux taps
    // rapides à deux endroits — un enfant pressé — zoomeraient par accident)
    return now - lastTap < 300 && Math.hypot(x - lastTapX, y - lastTapY) < 48;
  }

  function apply(anim) {
    img.classList.toggle('bk-zoom-anim', !!anim);
    img.style.transform = scale === 1 && !tx && !ty ? '' : `translate(${tx}px, ${ty}px) scale(${scale})`;
    wrap.classList.toggle('bk-zoomed', scale > 1.01);
    bkZoomActive = scale > 1.01;
  }
  wrap._zoomReset = () => { scale = 1; tx = 0; ty = 0; apply(true); };
  function clamp() {
    scale = Math.max(1, Math.min(3.5, scale));
    const r = wrap.getBoundingClientRect();
    const mx = (scale - 1) * r.width / 2, my = (scale - 1) * r.height / 2;
    tx = Math.max(-mx, Math.min(mx, tx));
    ty = Math.max(-my, Math.min(my, ty));
    if (scale <= 1.01) { scale = 1; tx = 0; ty = 0; }
  }
  function toggleZoom(cx, cy) {
    bkCancelPendingTap(); // le double-tap zoome : le simple tap différé ne doit pas tourner la page
    const r = wrap.getBoundingClientRect();
    if (scale > 1.01) { scale = 1; tx = 0; ty = 0; }
    else {
      scale = 2.2;
      tx = (r.width / 2 - (cx - r.left)) * (scale - 1);
      ty = (r.height / 2 - (cy - r.top)) * (scale - 1);
    }
    clamp(); apply(true);
  }

  wrap.addEventListener('pointerdown', e => {
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 2) {
      // départ de pinch : on prend la main, le tourne-page ne voit rien
      e.stopPropagation();
      const [a, b] = [...ptrs.values()];
      startDist = Math.hypot(a.x - b.x, a.y - b.y);
      startScale = scale; startTx = tx; startTy = ty;
      startMid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      panPtr = null;
      try { wrap.setPointerCapture(e.pointerId); } catch (err) {}
    } else if (scale > 1.01) {
      e.stopPropagation();
      panPtr = e.pointerId;
      panStart = { x: e.clientX, y: e.clientY, tx, ty };
      try { wrap.setPointerCapture(e.pointerId); } catch (err) {}
    }
  });
  wrap.addEventListener('pointermove', e => {
    if (!ptrs.has(e.pointerId)) { if (panPtr !== e.pointerId) return; }
    if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 2) {
      e.stopPropagation();
      const [a, b] = [...ptrs.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      scale = startScale * (dist / (startDist || 1));
      tx = startTx + (mid.x - startMid.x);
      ty = startTy + (mid.y - startMid.y);
      clamp(); apply(false);
    } else if (panPtr === e.pointerId && scale > 1.01) {
      e.stopPropagation();
      tx = panStart.tx + (e.clientX - panStart.x);
      ty = panStart.ty + (e.clientY - panStart.y);
      clamp(); apply(false);
    }
  });
  function up(e) {
    const wasPinch = ptrs.size === 2;
    ptrs.delete(e.pointerId);
    if (wasPinch) { e.stopPropagation(); clamp(); apply(true); return; }
    if (panPtr === e.pointerId) {
      e.stopPropagation(); panPtr = null;
      // tap (sans déplacement) sur image zoomée : double-tap = dézoom
      const moved = Math.hypot(e.clientX - panStart.x, e.clientY - panStart.y);
      if (moved < 8) {
        const now = Date.now();
        if (isDoubleTap(e.clientX, e.clientY, now)) toggleZoom(e.clientX, e.clientY);
        lastTap = now; lastTapX = e.clientX; lastTapY = e.clientY;
      }
      return;
    }
    // échelle 1 : double-tap pour zoomer (le simple tap continue vers le lecteur)
    const now = Date.now();
    if (isDoubleTap(e.clientX, e.clientY, now)) { e.stopPropagation(); toggleZoom(e.clientX, e.clientY); lastTap = 0; return; }
    lastTap = now; lastTapX = e.clientX; lastTapY = e.clientY;
  }
  wrap.addEventListener('pointerup', up);
  wrap.addEventListener('pointercancel', e => { ptrs.delete(e.pointerId); if (panPtr === e.pointerId) panPtr = null; });
}

// ── Gestes du lecteur : glissé horizontal (la feuille suit le doigt) + taps ───

(function initBookGestures() {
  const container = document.getElementById('bkPages');
  if (!container) return;

  let startX = 0, startY = 0, startT = 0;
  let mode = null;      // null | 'drag-next' | 'drag-prev' | 'scroll-text' | 'ignore'
  let dragEl = null;
  let scrollBody = null, scrollStartTop = 0, velY = 0, lastY = 0, lastT = 0, flingRaf = 0;
  let tapTimer = null;
  bkCancelPendingTap = () => clearTimeout(tapTimer);
  const livePtrs = new Set();

  function dragWidth() {
    if (bkMode === 'portrait') return container.clientWidth || 1;
    const book = document.getElementById('bksBook');
    return book ? book.clientWidth / 2 : (container.clientWidth || 1);
  }
  function curEl() { return bkMode === 'portrait' ? bkLeaves[bkCur] : bkSheets[bksCur]; }
  function prevEl() { return bkMode === 'portrait' ? bkLeaves[bkCur - 1] : bkSheets[bksCur - 1]; }

  // comptage des pointeurs en phase CAPTURE : le zoom peut stopper la
  // propagation (pinch), le comptage doit rester exact malgré tout
  container.addEventListener('pointerdown', e => {
    livePtrs.add(e.pointerId);
    if (livePtrs.size > 1 && (mode === 'drag-next' || mode === 'drag-prev')) {
      // un 2e doigt arrive en plein glissé : on rend la feuille, le pinch prend la main
      dragEl.classList.add('bk-anim');
      dragEl.style.transform = '';
      if (mode === 'drag-prev') dragEl.classList.add('turned');
      mode = 'ignore'; dragEl = null;
    }
  }, true);
  container.addEventListener('pointerup', e => livePtrs.delete(e.pointerId), true);
  container.addEventListener('pointercancel', e => livePtrs.delete(e.pointerId), true);

  container.addEventListener('pointerdown', e => {
    cancelAnimationFrame(flingRaf); // un doigt posé stoppe l'inertie en cours
    if (livePtrs.size > 1) { mode = 'ignore'; return; } // pinch : le zoom a la main
    if (bkZoomActive) { mode = 'ignore'; return; }
    startX = e.clientX; startY = e.clientY; startT = Date.now();
    mode = null; dragEl = null;
    scrollBody = e.pointerType !== 'mouse' ? e.target.closest('.bk-body') : null;
  });

  container.addEventListener('pointermove', e => {
    if (mode === 'ignore' || livePtrs.size > 1 || bkZoomActive) return;
    const dx = e.clientX - startX, dy = e.clientY - startY;
    if (!mode) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        // vertical : sur un texte scrollable au TOUCHER, on pilote le scroll en JS —
        // Chrome Android ne pan-e pas nativement dans une feuille transformée 3D
        if (scrollBody && scrollBody.scrollHeight > scrollBody.clientHeight + 2) {
          mode = 'scroll-text';
          scrollStartTop = scrollBody.scrollTop;
          lastY = e.clientY; lastT = Date.now(); velY = 0;
          try { container.setPointerCapture(e.pointerId); } catch (err) {}
        } else mode = 'ignore';
        return;
      }
      if (dx < 0 && !bkAtEnd()) {
        mode = 'drag-next'; dragEl = curEl();
      } else if (dx > 0 && !bkAtStart()) {
        mode = 'drag-prev'; dragEl = prevEl();
      } else { mode = 'ignore'; return; }
      dragEl.classList.remove('bk-anim');
      dragEl.classList.add('bk-live');
      dragEl.style.zIndex = bkMode === 'portrait' ? 3 * bkTotal : 200;
      try { container.setPointerCapture(e.pointerId); } catch (err) {}
    }
    const w = dragWidth();
    if (mode === 'drag-next') {
      const deg = Math.max(-180, Math.min(0, dx / w * 220));
      dragEl.style.transform = `rotateY(${deg}deg)`;
    } else if (mode === 'drag-prev') {
      const deg = Math.max(-180, Math.min(0, -180 + dx / w * 220));
      dragEl.style.transform = `rotateY(${deg}deg)`;
    } else if (mode === 'scroll-text') {
      scrollBody.scrollTop = scrollStartTop - (e.clientY - startY);
      const now = Date.now();
      if (now > lastT) velY = (e.clientY - lastY) / (now - lastT); // px/ms
      lastY = e.clientY; lastT = now;
    }
  });

  function flingText(body, v0) {
    let v = v0; // px/ms, décroissance douce
    let prev = performance.now();
    const step = now => {
      const dt = now - prev; prev = now;
      body.scrollTop -= v * dt;
      v *= Math.pow(0.94, dt / 16);
      if (Math.abs(v) > 0.04) flingRaf = requestAnimationFrame(step);
    };
    flingRaf = requestAnimationFrame(step);
  }

  function endDrag(e) {
    if (mode === 'scroll-text') {
      if (Math.abs(velY) > 0.25) flingText(scrollBody, velY); // inertie
      mode = null; scrollBody = null; return;
    }
    if (mode === 'drag-next' || mode === 'drag-prev') {
      const dx = e.clientX - startX;
      const dt = Date.now() - startT;
      const flick = Math.abs(dx) > 50 && dt < 300;
      const w = dragWidth();
      const past = Math.abs(dx) / w > 0.28;
      dragEl.classList.add('bk-anim');
      dragEl.style.transform = '';
      if (mode === 'drag-next') {
        if (past || flick) {
          dragEl.classList.add('turned');
          if (bkMode === 'portrait') { bkCur++; bkWindow(); } else { bksCur++; bkWindowSpread(); }
          bkPageSound();
        }
      } else {
        if (past || flick) {
          dragEl.classList.remove('turned');
          if (bkMode === 'portrait') { bkCur--; bkWindow(); } else { bksCur--; bkWindowSpread(); }
          bkPageSound();
        } else dragEl.classList.add('turned');
      }
      bkUpdateNav();
      // si la classe ne change pas, transitionend peut ne pas venir : re-z direct
      const el = dragEl, i = parseInt(el.dataset.index);
      const turned = el.classList.contains('turned');
      setTimeout(() => {
        if (!el.classList.contains('bk-anim')) return;
        el.classList.remove('bk-anim', 'bk-live');
        el.style.zIndex = bkMode === 'portrait'
          ? (turned ? (2 * bkTotal - i) - bkTotal : 2 * bkTotal - i)
          : (turned ? 10 + i : 10 + (bkTotal - i));
      }, 500);
    } else if (mode === null) {
      const dt = Date.now() - startT;
      if (dt < 350) bkTap(e);
    }
    mode = null; dragEl = null;
  }

  container.addEventListener('pointerup', endDrag);
  container.addEventListener('pointercancel', () => { mode = null; dragEl = null; });

  function bkTap(e) {
    if (bkZoomActive) return;
    const w = container.clientWidth || 1;
    const x = e.clientX;
    const el = curEl();
    const onImage = e.target.closest('.bk-image');
    const inNavZone = x > w * 0.7 || x < w * 0.18;
    const fire = () => {
      if (bkZoomActive) return;
      if (x > w * 0.7) { bkNext(); return; }
      if (x < w * 0.18) { bkPrev(); return; }
      if (onImage) {
        const r = container.getBoundingClientRect();
        bkSparkle(e.clientX - r.left, e.clientY - r.top, container);
      }
    };
    if (onImage && !inNavZone) {
      // au centre d'une illustration, laisser 280 ms au double-tap (zoom) ;
      // les zones de bord tournent IMMÉDIATEMENT (latence homogène partout)
      clearTimeout(tapTimer);
      tapTimer = setTimeout(fire, 280);
    } else fire();
  }

  // molette : tourne les pages — sauf au-dessus d'un texte encore scrollable
  let lastWheel = 0;
  container.addEventListener('wheel', e => {
    const body = e.target.closest('.bk-body');
    if (body) {
      const canDown = body.scrollTop + body.clientHeight < body.scrollHeight - 2;
      const canUp = body.scrollTop > 2;
      if ((e.deltaY > 0 && canDown) || (e.deltaY < 0 && canUp)) return; // scroll natif du texte
    }
    if (bkZoomActive) return;
    const now = Date.now();
    if (now - lastWheel < 400 || Math.abs(e.deltaY) < 12) return;
    lastWheel = now;
    e.preventDefault();
    if (e.deltaY > 0) bkNext(); else bkPrev();
  }, { passive: false });

  // clavier : flèches / espace
  document.addEventListener('keydown', e => {
    if (!document.getElementById('bookReader').classList.contains('active')) return;
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); bkNext(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); bkPrev(); }
  });
})();

// ── Étincelles dorées (toucher magique, très sobre) ───────────────────────────

function bkSparkle(x, y, container) {
  for (let i = 0; i < 7; i++) {
    const s = document.createElement('span');
    s.className = 'bk-spark';
    s.textContent = '✦';
    const a = Math.random() * Math.PI * 2;
    const r = 24 + Math.random() * 46;
    s.style.left = x + 'px';
    s.style.top = y + 'px';
    s.style.setProperty('--dx', (Math.cos(a) * r) + 'px');
    s.style.setProperty('--dy', (Math.sin(a) * r - 30) + 'px');
    s.style.fontSize = (9 + Math.random() * 10) + 'px';
    s.style.animationDelay = (Math.random() * 0.1).toFixed(2) + 's';
    s.addEventListener('animationend', () => s.remove());
    container.appendChild(s);
  }
}

// ── Bruissement de page (Web Audio synthétisé, zéro asset) ────────────────────

let bkAudioCtx = null;

function bkPageSound() {
  try {
    bkAudioCtx = bkAudioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const ctx = bkAudioCtx;
    if (ctx.state === 'suspended') ctx.resume();
    const dur = 0.14;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      const t = i / d.length;
      d[i] = (Math.random() * 2 - 1) * Math.sin(t * Math.PI) * (1 - t * 0.5);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 2400; bp.Q.value = 0.7;
    const g = ctx.createGain();
    g.gain.value = 0.12;
    src.connect(bp); bp.connect(g); g.connect(ctx.destination);
    src.start();
  } catch (err) {}
}
