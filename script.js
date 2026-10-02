/* Personaliza la ruta mi-foto.png y los audios viento.mp3, hover.mp3 y carta.mp3 en index.html. */
const scene = document.querySelector('#scene');
const candleHost = document.querySelector('#candles');
const reflectionHost = document.querySelector('#candleReflections');
const wind = document.querySelector('#wind');
const scroll = document.querySelector('#scroll');
const photo = document.querySelector('#memoryPhoto');
const photoCanvas = document.querySelector('#photoCanvas');
const celebration = document.querySelector('#celebration');
const replay = document.querySelector('#replay');
const audio = {
  wind: document.querySelector('#windAudio'),
  hover: document.querySelector('#hoverAudio'),
  paper: document.querySelector('#paperAudio'),
};
let blown = false;
let finaleStarted = false;
let audioContext;

// Genera exactamente 20 velas para que sea fácil cambiar el número aquí.
const candleCount = 20;
for (let index = 0; index < candleCount; index += 1) {
  const candle = document.createElement('span');
  candle.className = 'candle';
  candle.innerHTML = '<i class="smoke"></i><i class="wick"></i><i class="flame"></i>';
  candleHost.append(candle);
  const reflection = document.createElement('i');
  reflection.className = 'candle-reflection';
  reflection.style.animationDelay = `${-index * .12}s`;
  reflectionHost.append(reflection);
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

// Fuegos artificiales de partículas con los colores de mi-foto.png; al terminar,
// las partículas forman la imagen y permanecen en el lienzo.
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
  const bursts = Array.from({ length: 6 }, (_, index) => ({
    x: bounds.width * (0.06 + index * 0.176),
    y: bounds.height * (0.25 + Math.random() * 0.18),
  }));
  for (let y = 0; y < height; y += gap) for (let x = 0; x < width; x += gap) {
    const index = (y * width + x) * 4;
    const targetX = x * bounds.width / width;
    const targetY = y * bounds.height / height;
    const burst = bursts[Math.min(bursts.length - 1, Math.floor((x / width) * bursts.length))];
    const radius = 24 + Math.random() * Math.min(bounds.width, bounds.height) * 0.18;
    const angle = Math.random() * Math.PI * 2;
    points.push({
      x: targetX, y: targetY,
      color: `rgba(${pixels[index]},${pixels[index + 1]},${pixels[index + 2]},${pixels[index + 3] / 255})`,
      launchX: burst.x + (Math.random() - 0.5) * 12,
      launchY: bounds.height + Math.random() * 18,
      burstX: burst.x, burstY: burst.y,
      sparkX: targetX + Math.cos(angle) * radius,
      sparkY: targetY + Math.sin(angle) * radius,
      delay: Math.random() * 450,
    });
  }
  const start = performance.now();
  function draw(now) {
    context.clearRect(0, 0, bounds.width, bounds.height);
    let active = false;
    for (const point of points) {
      const progress = Math.max(0, Math.min(1, (now - start - point.delay) / 1750));
      if (progress < 1) active = true;
      let x; let y;
      if (progress < 0.24) {
        const flight = progress / 0.24;
        const eased = 1 - (1 - flight) ** 3;
        x = point.launchX + (point.burstX - point.launchX) * eased;
        y = point.launchY + (point.burstY - point.launchY) * eased;
      } else if (progress < 0.7) {
        const burst = (progress - 0.24) / 0.46;
        const eased = 1 - (1 - burst) ** 2;
        x = point.burstX + (point.sparkX - point.burstX) * eased;
        y = point.burstY + (point.sparkY - point.burstY) * eased;
      } else {
        const gather = (progress - 0.7) / 0.3;
        const eased = 1 - (1 - gather) ** 3;
        x = point.sparkX + (point.x - point.sparkX) * eased;
        y = point.sparkY + (point.y - point.sparkY) * eased;
      }
      context.globalAlpha = Math.min(1, 0.32 + progress * 1.2);
      context.fillStyle = point.color;
      context.shadowBlur = progress < 0.7 ? 5 : 1;
      context.shadowColor = point.color;
      const particleSize = Math.max(1, gap * (progress < 0.7 ? 0.72 : 0.5));
      context.beginPath(); context.arc(x, y, particleSize, 0, Math.PI * 2); context.fill();
    }
    context.globalAlpha = 1;
    context.shadowBlur = 0;
    if (active) requestAnimationFrame(draw);
    // No se borra ni se desvanece al acabar: la imagen queda formada en el canvas.
  }
  photoCanvas.style.opacity = '1'; requestAnimationFrame(draw);
}

function fireworkPalette() {
  const fallback = ['#aac6ff', '#d9e6ff', '#efb6a8', '#7289ba', '#e8d6bd'];
  if (!photo.complete || !photo.naturalWidth) return fallback;
  const sampler = document.createElement('canvas');
  sampler.width = 7; sampler.height = 7;
  const samplerContext = sampler.getContext('2d', { willReadFrequently: true });
  samplerContext.drawImage(photo, 0, 0, sampler.width, sampler.height);
  const pixels = samplerContext.getImageData(0, 0, sampler.width, sampler.height).data;
  const palette = [];
  for (let pixel = 0; pixel < pixels.length; pixel += 16) {
    let red = pixels[pixel]; let green = pixels[pixel + 1]; let blue = pixels[pixel + 2];
    if (red + green + blue < 115) { red += 70; green += 82; blue += 115; }
    palette.push(`rgb(${Math.min(255, red)}, ${Math.min(255, green)}, ${Math.min(255, blue)})`);
  }
  return palette.length ? palette : fallback;
}

function launchFirework(color, index) {
  const firework = document.createElement('div');
  firework.className = 'firework';
  firework.style.setProperty('--x', `${8 + Math.random() * 84}%`);
  firework.style.setProperty('--y', `${7 + Math.random() * 42}%`);
  firework.style.setProperty('--color', color);
  firework.style.setProperty('--delay', `${index * 170 + Math.random() * 220}ms`);
  firework.innerHTML = '<i class="rocket"></i>';
  for (let spark = 0; spark < 28; spark += 1) {
    const particle = document.createElement('i');
    particle.className = 'firework-spark';
    const angle = (Math.PI * 2 * spark / 28) + (Math.random() - .5) * .18;
    const distance = 38 + Math.random() * 82;
    particle.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
    particle.style.setProperty('--dy', `${Math.sin(angle) * distance + 22}px`);
    firework.append(particle);
  }
  celebration.append(firework);
}

function launchConfetti(colors) {
  for (let piece = 0; piece < 100; piece += 1) {
    const confetti = document.createElement('i');
    confetti.className = 'confetti';
    confetti.style.setProperty('--x', `${Math.random() * 100}%`);
    confetti.style.setProperty('--color', colors[piece % colors.length]);
    confetti.style.setProperty('--drift', `${-150 + Math.random() * 300}px`);
    confetti.style.setProperty('--turn', `${Math.random() * 720 - 360}deg`);
    confetti.style.setProperty('--delay', `${Math.random() * 680}ms`);
    confetti.style.setProperty('--duration', `${2500 + Math.random() * 1900}ms`);
    celebration.append(confetti);
  }
}

function launchBalloons(colors) {
  for (let balloonNumber = 0; balloonNumber < 13; balloonNumber += 1) {
    const balloon = document.createElement('i');
    balloon.className = 'balloon';
    balloon.style.setProperty('--x', `${-3 + Math.random() * 106}%`);
    balloon.style.setProperty('--color', colors[balloonNumber % colors.length]);
    balloon.style.setProperty('--drift', `${-90 + Math.random() * 180}px`);
    balloon.style.setProperty('--delay', `${250 + Math.random() * 1600}ms`);
    balloon.style.setProperty('--duration', `${5400 + Math.random() * 2300}ms`);
    celebration.append(balloon);
  }
}

function startFinale() {
  if (finaleStarted) return;
  finaleStarted = true;
  const colors = fireworkPalette();
  scene.classList.add('celebrating');
  for (let firework = 0; firework < 9; firework += 1) launchFirework(colors[firework % colors.length], firework);
  launchConfetti(colors);
  launchBalloons(colors);
  window.setTimeout(() => replay.classList.add('visible'), 2700);
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
  scene.classList.add('letter-open', 'heartbeating');
  playSound(audio.paper, () => softTone('paper'));
  window.setTimeout(() => scene.classList.remove('heartbeating'), 1250);
  window.setTimeout(startFinale, 850);
});

replay.addEventListener('click', () => window.location.reload());

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
