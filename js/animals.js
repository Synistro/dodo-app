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
function soundWolf()    { animalTone(300, 520, 0.4, 0, 'sine', 0.2); animalTone(520, 260, 0.9, 0.4, 'sine', 0.2); }
function soundBird()    { for (let i = 0; i < 5; i++) animalTone(2000 + (i % 2) * 600, 2600 - (i % 2) * 400, 0.09, i * 0.13, 'sine', 0.08); }
function soundGecko()   { for (let i = 0; i < 5; i++) animalTone(1200, 700, 0.07, i * 0.16, 'square', 0.07); }
function soundMonkey()  { animalTone(160, 90, 0.5, 0, 'sawtooth', 0.18); animalTone(140, 80, 0.6, 0.55, 'sawtooth', 0.18); }

const ANIMALS = [
  { emoji: '🦉', label: 'Le hibou',       file: 'audio/chouette.wav',   sound: soundOwl },
  { emoji: '🐱', label: 'Le chat',        file: 'audio/chat.wav',       sound: soundCat },
  { emoji: '🐸', label: 'La grenouille',  file: 'audio/grenouille.wav', sound: soundFrog },
  { emoji: '🦗', label: 'Le criquet',     file: 'audio/criquet.wav',    sound: soundCricket },
  { emoji: '🐺', label: 'Le loup',        file: 'audio/loup.wav',       sound: soundWolf },
  { emoji: '🐦', label: 'Le rossignol',   file: 'audio/rossignol.wav',  sound: soundBird },
  { emoji: '🦎', label: 'Le gecko',       file: 'audio/gecko.wav',      sound: soundGecko },
  { emoji: '🐵', label: 'Le singe congo', file: 'audio/singe.wav',      sound: soundMonkey },
];

// La voix dit le nom après le cri — réutilise la voix FR du lecteur (ttsVoice, reader.js)
function speakAnimal(label) {
  try {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(label);
    utt.lang = 'fr-FR'; utt.rate = 0.85; utt.pitch = 1.1; utt.volume = 0.9;
    if (typeof ttsVoice !== 'undefined' && ttsVoice) utt.voice = ttsVoice;
    window.speechSynthesis.speak(utt);
  } catch (e) {}
}

// Vrais enregistrements (Wikimedia Commons, voir README) ; synthé en secours.
function playAnimal(a) {
  try {
    if (!a.audio) {
      a.audio = new Audio(a.file);
      a.audio.preload = 'auto';
      a.audio.addEventListener('ended', () => speakAnimal(a.label));
    }
    a.audio.currentTime = 0;
    a.audio.play().catch(() => {
      try { a.sound(); setTimeout(() => speakAnimal(a.label), 900); } catch (e) {}
    });
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
