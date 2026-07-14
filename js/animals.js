// ── animals.js — les animaux de la nuit : toucher → son + animation ──────────
// Sons synthétisés Web Audio, zéro asset (même approche que le pop de game.js).

let animalsAudioCtx = null, animalsBuilt = false;

function animalsCtx() {
  animalsAudioCtx = animalsAudioCtx || new (window.AudioContext || window.webkitAudioContext)();
  return animalsAudioCtx;
}

function animalTone(freqFrom, freqTo, dur, delay = 0, type = 'sine', vol = 0.25) {
  const c = animalsCtx(), t = c.currentTime + delay;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freqFrom, t);
  if (freqTo !== freqFrom) o.frequency.exponentialRampToValueAtTime(freqTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(c.destination);
  o.start(t); o.stop(t + dur + 0.05);
}

function soundOwl()     { animalTone(420, 330, 0.35); animalTone(420, 300, 0.5, 0.45); }
function soundCat()     { animalTone(450, 900, 0.25, 0, 'sine', 0.2); animalTone(900, 380, 0.45, 0.25, 'sine', 0.2); }
function soundFrog()    { animalTone(140, 90, 0.18, 0, 'sawtooth', 0.15); animalTone(140, 90, 0.18, 0.25, 'sawtooth', 0.15); }
function soundCricket() { for (let i = 0; i < 4; i++) animalTone(3800, 4200, 0.06, i * 0.12, 'square', 0.05); }

const ANIMALS = [
  { emoji: '🦉', label: 'Le hibou',      file: 'audio/chouette.wav',   sound: soundOwl },
  { emoji: '🐱', label: 'Le chat',       file: 'audio/chat.wav',       sound: soundCat },
  { emoji: '🐸', label: 'La grenouille', file: 'audio/grenouille.wav', sound: soundFrog },
  { emoji: '🦗', label: 'Le criquet',    file: 'audio/criquet.wav',    sound: soundCricket },
];

// Vrais enregistrements (Wikimedia Commons, voir README) ; synthé en secours.
function playAnimal(a) {
  try {
    if (!a.audio) { a.audio = new Audio(a.file); a.audio.preload = 'auto'; }
    a.audio.currentTime = 0;
    a.audio.play().catch(() => { try { a.sound(); } catch (e) {} });
  } catch (e) {
    try { a.sound(); } catch (e2) {}
  }
}

function startAnimals() {
  if (animalsBuilt) return;
  const grid = document.getElementById('animalsGrid');
  ANIMALS.forEach(a => {
    const el = document.createElement('button');
    el.className = 'animal';
    el.innerHTML = `<span class="animal-emoji">${a.emoji}</span><span class="animal-label">${a.label}</span>`;
    el.addEventListener('click', () => {
      playAnimal(a);
      if (navigator.vibrate) navigator.vibrate(20);
      el.classList.remove('poked'); void el.offsetWidth; el.classList.add('poked');
    });
    grid.appendChild(el);
  });
  animalsBuilt = true;
}

function stopAnimals() {}
