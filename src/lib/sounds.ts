// Game sound effects using Web Audio API — no external dependencies
const ctx = () => {
  if (!(window as any).__audioCtx) {
    (window as any).__audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return (window as any).__audioCtx as AudioContext;
};

function playTone(freq: number, duration: number, type: OscillatorType = "sine", gain = 0.3) {
  try {
    const a = ctx();
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(gain, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + duration);
    o.connect(g).connect(a.destination);
    o.start();
    o.stop(a.currentTime + duration);
  } catch {}
}

export function playCorrect() {
  playTone(523, 0.12, "sine", 0.25);
  setTimeout(() => playTone(659, 0.12, "sine", 0.25), 100);
  setTimeout(() => playTone(784, 0.25, "sine", 0.3), 200);
}

export function playIncorrect() {
  playTone(200, 0.15, "sawtooth", 0.2);
  setTimeout(() => playTone(150, 0.3, "sawtooth", 0.2), 120);
}

export function playPodium() {
  const notes = [523, 659, 784, 1047, 784, 1047, 1319];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.2, "sine", 0.2), i * 150);
  });
}

export function playCountdown() {
  playTone(440, 0.1, "square", 0.15);
}

export function playJoin() {
  playTone(880, 0.08, "sine", 0.15);
  setTimeout(() => playTone(1100, 0.12, "sine", 0.15), 80);
}

export function playPowerUp() {
  playTone(600, 0.08, "sine", 0.2);
  setTimeout(() => playTone(900, 0.08, "sine", 0.2), 60);
  setTimeout(() => playTone(1200, 0.15, "sine", 0.25), 120);
}

export function playNotification() {
  playTone(800, 0.1, "sine", 0.2);
  setTimeout(() => playTone(1000, 0.15, "sine", 0.2), 100);
}
