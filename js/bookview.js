// ── bookview.js — Le Livre de Jayden : couverture 3D, sommaire, pages tournantes ─
// Une page-écran = une feuille : image pleine page, puis texte sur papier crème.
// Feuilles : [titre de chapitre] → image → texte → ... → page de fin.

// ── Couverture + sommaire ─────────────────────────────────────────────────────

function openBookView() {
  // depuis la landing : le livre se présente fermé
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

// ── Construction des feuilles d'un tome ───────────────────────────────────────

let bkLeaves = [];
let bkCurrent = 0;
let bkTotal = 0;

function openTome(id) {
  const tome = BOOK.tomes.find(t => t.id === id);
  if (!tome || !tome.available) return;
  const container = document.getElementById('bkPages');
  container.innerHTML = '';
  bkLeaves = [];
  bkCurrent = 0;

  const pages = [];
  const isPrologue = id === 't0';
  tome.chapters.forEach((ch, ci) => {
    const kicker = isPrologue ? 'Prologue' : `Chapitre ${ci + 1}`;
    pages.push({ type: 'title', kicker, title: ch.title });
    ch.pages.forEach(p => {
      pages.push({ type: 'image', img: p.img });
      pages.push({ type: 'text', kicker, title: ch.title, text: p.text });
    });
  });
  pages.push({ type: 'end', isPrologue });

  bkTotal = pages.length;
  let pairNum = 0;
  pages.forEach((page, i) => {
    if (page.type === 'image') pairNum++;
    const leaf = document.createElement('div');
    leaf.className = 'bk-leaf';
    leaf.dataset.index = i;
    leaf.dataset.type = page.type;
    leaf.style.zIndex = 2 * bkTotal - i;
    const front = document.createElement('div');
    front.className = 'bk-front';
    if (page.type === 'image') {
      front.classList.add('bk-image');
      front.innerHTML = `<img src="${page.img}" alt="" draggable="false">`;
    } else if (page.type === 'text') {
      front.classList.add('bk-paper');
      front.innerHTML = `
        <div class="bk-kicker">${page.kicker} · ${page.title}</div>
        <div class="bk-body">${formatBookText(page.text)}</div>
        <div class="bk-num">~ ${pairNum} ~</div>`;
    } else if (page.type === 'title') {
      front.classList.add('bk-paper', 'bk-titlepage');
      front.innerHTML = `
        <div class="bk-tp-kicker">${page.kicker}</div>
        <div class="bk-tp-title">${page.title}</div>
        <div class="bk-tp-orn">⚓</div>`;
    } else {
      front.classList.add('bk-paper', 'bk-endpage');
      front.innerHTML = `
        <div class="bk-end-moon">🌙</div>
        <div class="bk-end-msg">${page.isPrologue ? 'Fin du prologue.' : 'Fin du tome.'}<br>Bonne nuit, Capitaine.</div>
        <button class="reader-end-btn" onclick="bkReplay()">Revoir</button>
        <button class="reader-end-btn" onclick="closeTome()">Retour au sommaire</button>`;
    }
    const back = document.createElement('div');
    back.className = 'bk-back';
    leaf.appendChild(front);
    leaf.appendChild(back);
    leaf.addEventListener('transitionend', e => {
      if (e.propertyName !== 'transform') return;
      leaf.classList.remove('bk-anim');
      leaf.style.zIndex = leaf.classList.contains('turned') ? (2 * bkTotal - i) - bkTotal : 2 * bkTotal - i;
    });
    container.appendChild(leaf);
    bkLeaves.push(leaf);
  });

  showView('bookReader');
}

function formatBookText(t) {
  return t.split('\n\n').map(p => p.trim()).filter(Boolean).map(p => `<p>${p}</p>`).join('');
}

function closeTome() {
  showView('bookView'); // le livre reste ouvert sur le sommaire
}

// ── Tourner les pages ─────────────────────────────────────────────────────────

function bkNext() {
  if (bkCurrent >= bkTotal - 1) return;
  const leaf = bkLeaves[bkCurrent];
  leaf.style.zIndex = 3 * bkTotal; // au-dessus pendant l'animation
  leaf.style.transform = '';
  leaf.classList.add('bk-anim', 'turned');
  bkCurrent++;
  bkPageSound();
}

function bkPrev() {
  if (bkCurrent <= 0) return;
  bkCurrent--;
  const leaf = bkLeaves[bkCurrent];
  leaf.style.zIndex = 3 * bkTotal;
  leaf.style.transform = '';
  leaf.classList.add('bk-anim');
  leaf.classList.remove('turned');
  bkPageSound();
}

function bkReplay() {
  // retour à la première page, sans animation feuille par feuille
  bkLeaves.forEach((leaf, i) => {
    leaf.classList.remove('turned', 'bk-anim');
    leaf.style.transform = '';
    leaf.style.zIndex = 2 * bkTotal - i;
  });
  bkCurrent = 0;
}

// ── Geste : glissé horizontal (la page suit le doigt) + zones de tap ──────────

(function initBookGestures() {
  const container = document.getElementById('bkPages');
  if (!container) return;

  let startX = 0, startY = 0, startT = 0;
  let mode = null;      // null | 'drag-next' | 'drag-prev' | 'ignore'
  let dragLeaf = null;

  container.addEventListener('pointerdown', e => {
    startX = e.clientX; startY = e.clientY; startT = Date.now();
    mode = null; dragLeaf = null;
  });

  container.addEventListener('pointermove', e => {
    if (mode === 'ignore') return;
    const dx = e.clientX - startX, dy = e.clientY - startY;
    if (!mode) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      if (Math.abs(dy) > Math.abs(dx)) { mode = 'ignore'; return; } // scroll vertical natif
      if (dx < 0 && bkCurrent < bkTotal - 1) {
        mode = 'drag-next';
        dragLeaf = bkLeaves[bkCurrent];
      } else if (dx > 0 && bkCurrent > 0) {
        mode = 'drag-prev';
        dragLeaf = bkLeaves[bkCurrent - 1];
      } else { mode = 'ignore'; return; }
      dragLeaf.classList.remove('bk-anim');
      dragLeaf.style.zIndex = 3 * bkTotal;
      try { container.setPointerCapture(e.pointerId); } catch (err) {}
    }
    const w = container.clientWidth || 1;
    if (mode === 'drag-next') {
      const deg = Math.max(-180, Math.min(0, dx / w * 220));
      dragLeaf.style.transform = `rotateY(${deg}deg)`;
    } else if (mode === 'drag-prev') {
      const deg = Math.max(-180, Math.min(0, -180 + dx / w * 220));
      dragLeaf.style.transform = `rotateY(${deg}deg)`;
    }
  });

  function endDrag(e) {
    if (mode === 'drag-next' || mode === 'drag-prev') {
      const dx = e.clientX - startX;
      const dt = Date.now() - startT;
      const flick = Math.abs(dx) > 50 && dt < 300;
      const w = container.clientWidth || 1;
      const past = Math.abs(dx) / w > 0.28;
      dragLeaf.classList.add('bk-anim');
      dragLeaf.style.transform = '';
      if (mode === 'drag-next') {
        if (past || flick) { dragLeaf.classList.add('turned'); bkCurrent++; bkPageSound(); }
      } else {
        if (past || flick) { dragLeaf.classList.remove('turned'); bkCurrent--; bkPageSound(); }
        else dragLeaf.classList.add('turned');
      }
      // si la classe ne change pas, transitionend peut ne pas venir : re-z direct
      const i = parseInt(dragLeaf.dataset.index);
      const turned = dragLeaf.classList.contains('turned');
      setTimeout(() => {
        if (!dragLeaf.classList.contains('bk-anim')) return;
        dragLeaf.classList.remove('bk-anim');
        dragLeaf.style.zIndex = turned ? (2 * bkTotal - i) - bkTotal : 2 * bkTotal - i;
      }, 500);
    } else if (mode === null) {
      // tap sans glissé
      const dt = Date.now() - startT;
      if (dt < 350) bkTap(e);
    }
    mode = null; dragLeaf = null;
  }

  container.addEventListener('pointerup', endDrag);
  container.addEventListener('pointercancel', () => { mode = null; dragLeaf = null; });

  function bkTap(e) {
    const w = container.clientWidth || 1;
    const x = e.clientX;
    if (x > w * 0.66) { bkNext(); return; }
    if (x < w * 0.2) { bkPrev(); return; }
    // centre : étincelles sur une page image
    const leaf = bkLeaves[bkCurrent];
    if (leaf && leaf.dataset.type === 'image') {
      const r = container.getBoundingClientRect();
      bkSparkle(e.clientX - r.left, e.clientY - r.top, container);
    }
  }
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
