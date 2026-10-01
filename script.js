/* Personaliza las rutas mi-foto.jpg, viento.mp3, hover.mp3 y carta.mp3 en index.html. */
const scene = document.querySelector('#scene');
const candleHost = document.querySelector('#candles');
const wind = document.querySelector('#wind');
const scroll = document.querySelector('#scroll');
const photo = document.querySelector('#memoryPhoto');
const photoCanvas = document.querySelector('#photoCanvas');
const audio = {
  wind: document.querySelector('#windAudio'),
  hover: document.querySelector('#hoverAudio'),
  paper: document.querySelector('#paperAudio'),
};
let blown = false;
let audioContext;

// Genera exactamente 20 velas para que sea fácil cambiar el número aquí.
const candleCount = 20;
for (let index = 0; index < candleCount; index += 1) {
  const candle = document.createElement('span');
  candle.className = 'candle';
  candle.innerHTML = '<i class="wick"></i><i class="flame"></i>';
  candleHost.append(candle);
}

function playSound(element, fallback) {
  if (!element) return;
  element.currentTime = 0;
  const play = element.play();
  if (play) play.catch(() => fallback?.());
}

// Respaldo generado con Web Audio si no hay MP3 o el navegador no puede reproducirlo.
function softTone(kind) {
  try {
    audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume();
    const now = audioContext.currentTime;
    if (kind === 'wind') {
      const length = Math.floor(audioContext.sampleRate * .75);
      const buffer = audioContext.createBuffer(1, length, audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
      const source = audioContext.createBufferSource(); source.buffer = buffer;
      const filter = audioContext.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.setValueAtTime(950, now); filter.frequency.exponentialRampToValueAtTime(180, now + .7);
      const gain = audioContext.createGain(); gain.gain.setValueAtTime(.0001, now); gain.gain.exponentialRampToValueAtTime(.16, now + .08); gain.gain.exponentialRampToValueAtTime(.0001, now + .75);
      source.connect(filter).connect(gain).connect(audioContext.destination); source.start(now); source.stop(now + .76);
      return;
    }
    const oscillator = audioContext.createOscillator(); const gain = audioContext.createGain();
    oscillator.type = 'sine'; oscillator.frequency.value = kind === 'paper' ? 480 : 740;
    gain.gain.setValueAtTime(.0001, now); gain.gain.exponentialRampToValueAtTime(kind === 'paper' ? .035 : .018, now + .025); gain.gain.exponentialRampToValueAtTime(.0001, now + (kind === 'paper' ? .32 : .09));
    oscillator.connect(gain).connect(audioContext.destination); oscillator.start(now); oscillator.stop(now + .34);
  } catch { /* El sonido es decorativo; la experiencia funciona sin audio. */ }
}

function makeWind() {
  wind.replaceChildren();
  for (let i = 0; i < 42; i += 1) {
    const particle = document.createElement('i');
    particle.className = 'wind-particle';
    particle.style.setProperty('--x', `${15 + Math.random() * 70}%`);
    particle.style.setProperty('--y', `${32 + Math.random() * 42}%`);
    particle.style.setProperty('--dx', `${100 + Math.random() * 300}px`);
    particle.style.setProperty('--dy', `${-35 + Math.random() * 70}px`);
    particle.style.setProperty('--size', `${1 + Math.random() * 3}px`);
    particle.style.animationDelay = `${Math.random() * .28}s`;
    wind.append(particle);
  }
  window.setTimeout(() => wind.replaceChildren(), 1400);
}

function blowCandles() {
  if (blown) return;
  blown = true;
  scene.classList.add('blown');
  makeWind();
  playSound(audio.wind, () => softTone('wind'));
  window.setTimeout(() => {
    buildPhoto();
  }, 2000);
}

// Lienzo de partículas que se reúnen para revelar mi-foto.jpg. Si falta la imagen,
// se conserva una tarjeta vacía con la ruta visible para que sepas dónde ponerla.
function buildPhoto() {
  const context = photoCanvas.getContext('2d', { willReadFrequently: true });
  const bounds = photoCanvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  photoCanvas.width = Math.max(1, Math.round(bounds.width * ratio));
  photoCanvas.height = Math.max(1, Math.round(bounds.height * ratio));
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  if (!photo.complete || !photo.naturalWidth) {
    photoCanvas.classList.add('photo-missing');
    context.clearRect(0, 0, bounds.width, bounds.height);
    return;
  }
  const width = Math.min(130, Math.floor(bounds.width));
  const height = Math.max(1, Math.round(width * bounds.height / bounds.width));
  const sample = document.createElement('canvas'); sample.width = width; sample.height = height;
  const sampleCtx = sample.getContext('2d', { willReadFrequently: true });
  const scale = Math.max(width / photo.naturalWidth, height / photo.naturalHeight);
  const sw = width / scale; const sh = height / scale;
  sampleCtx.drawImage(photo, (photo.naturalWidth - sw) / 2, (photo.naturalHeight - sh) / 2, sw, sh, 0, 0, width, height);
  const pixels = sampleCtx.getImageData(0, 0, width, height).data;
  const points = [];
  const gap = Math.max(2, Math.round(width / 75));
  for (let y = 0; y < height; y += gap) for (let x = 0; x < width; x += gap) {
    const index = (y * width + x) * 4;
    points.push({ x: x * bounds.width / width, y: y * bounds.height / height, color: `rgba(${pixels[index]},${pixels[index + 1]},${pixels[index + 2]},${pixels[index + 3] / 255})`, delay: Math.random() * 650 });
  }
  const start = performance.now();
  function draw(now) {
    context.clearRect(0, 0, bounds.width, bounds.height);
    let active = false;
    for (const point of points) {
      const progress = Math.max(0, Math.min(1, (now - start - point.delay) / 850));
      if (progress < 1) active = true;
      const eased = 1 - (1 - progress) ** 3;
      const x = point.x + (bounds.width * .5 - point.x) * (1 - eased);
      const y = point.y + (bounds.height * .5 - point.y) * (1 - eased);
      context.globalAlpha = progress;
      context.fillStyle = point.color;
      context.beginPath(); context.arc(x, y, Math.max(1, gap * .55 * (0.45 + eased * .55)), 0, Math.PI * 2); context.fill();
    }
    context.globalAlpha = 1;
    if (active) requestAnimationFrame(draw);
    else window.setTimeout(() => { photoCanvas.style.opacity = '0'; }, 180);
  }
  photoCanvas.style.opacity = '1'; requestAnimationFrame(draw);
}

document.addEventListener('click', (event) => {
  if (!blown && !scroll.contains(event.target)) blowCandles();
}, { once: true });

// The scroll button remains usable after the first click anywhere in the scene.
scroll.addEventListener('click', (event) => {
  event.stopPropagation();
  if (!blown) { blowCandles(); return; }
  if (scroll.classList.contains('open')) return;
  scroll.classList.add('open'); scroll.setAttribute('aria-expanded', 'true');
  playSound(audio.paper, () => softTone('paper'));
});

for (const target of [document.querySelector('#cakeWrap'), scroll]) {
  target.addEventListener('pointerenter', () => {
    if (!blown || target === scroll) playSound(audio.hover, () => softTone('hover'));
  }, { passive: true });
}

photo.addEventListener('error', () => {
  // El lienzo explica qué archivo debe añadirse en lugar de mostrar el icono roto.
  if (blown) buildPhoto();
});
photo.addEventListener('load', () => {
  // Si la imagen tarda más que la animación de entrada, dibújala al terminar de cargar.
  if (blown) buildPhoto();
});
window.addEventListener('resize', () => { if (blown && photo.complete && photo.naturalWidth) buildPhoto(); });
