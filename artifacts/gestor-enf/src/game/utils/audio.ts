let globalAudioCtx: AudioContext | null = null;
let musicNodes: AudioNode[] = [];
let musicGain: GainNode | null = null;
let currentTrack: string | null = null;
let musicSchedulerTimer: ReturnType<typeof setTimeout> | null = null;

function getAudioCtx(): AudioContext | null {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return null;
    if (!globalAudioCtx) globalAudioCtx = new Ctx();
    if (globalAudioCtx.state === 'suspended') globalAudioCtx.resume();
    return globalAudioCtx;
  } catch { return null; }
}

export const playSound = (type: 'hover' | 'click' | 'success' | 'error' | 'pulse') => {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    if (type === 'hover') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.05);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now); osc.stop(now + 0.05);
    } else if (type === 'click') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'success') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.setValueAtTime(600, now + 0.1);
      osc.frequency.setValueAtTime(800, now + 0.2);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.3);
      osc.start(now); osc.stop(now + 0.3);
    } else if (type === 'error') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.3);
      osc.start(now); osc.stop(now + 0.3);
    } else if (type === 'pulse') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.2);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now); osc.stop(now + 0.2);
    }
  } catch { }
};

// 8-bit note frequency
const NOTE: Record<string, number> = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
  Bb4: 466.16, Eb4: 311.13, Ab4: 415.30, Bb3: 233.08, Eb3: 155.56, Ab3: 207.65,
  R: 0,
};

type NoteStep = [string, number]; // [note, duration in beats]

// Menu theme: calm, hopeful hospital 8-bit melody (C major / A minor)
const MENU_MELODY: NoteStep[] = [
  ['C5',0.5],['E5',0.5],['G5',0.5],['E5',0.5],
  ['D5',0.5],['F5',0.5],['A5',0.5],['F5',0.5],
  ['E5',0.5],['G5',0.5],['B4',0.5],['G5',0.5],
  ['C5',1],['R',0.5],['C5',0.5],
  ['A4',0.5],['C5',0.5],['E5',0.5],['C5',0.5],
  ['G4',0.5],['B4',0.5],['D5',0.5],['B4',0.5],
  ['F4',0.5],['A4',0.5],['C5',0.5],['A4',0.5],
  ['G4',1],['R',1],
];
const MENU_BASS: NoteStep[] = [
  ['C3',1],['G3',1],['A3',1],['F3',1],
  ['C3',1],['G3',1],['A3',1],['F3',1],
];
const MENU_CHORD: NoteStep[] = [
  ['E3',1],['B3',1],['C4',1],['A3',1],
  ['E3',1],['B3',1],['C4',1],['A3',1],
];

// In-game theme: ambient hospital 8-bit BGM
const GAME_MELODY: NoteStep[] = [
  ['E4',0.5],['G4',0.5],['A4',1],['R',0.5],['A4',0.5],
  ['G4',0.5],['E4',0.5],['D4',1],['R',0.5],['D4',0.5],
  ['E4',0.5],['G4',0.5],['B4',1],['R',0.5],['G4',0.5],
  ['A4',1.5],['R',0.5],['E4',1],
  ['D4',0.5],['F4',0.5],['A4',1],['R',0.5],['A4',0.5],
  ['G4',0.5],['Bb4',0.5],['D5',1],['R',0.5],['Bb4',0.5],
  ['A4',0.5],['G4',0.5],['E4',1],['R',0.5],['G4',0.5],
  ['A4',2],['R',1],
];
const GAME_BASS: NoteStep[] = [
  ['A3',2],['G3',2],['A3',2],['D3',2],
  ['D3',2],['G3',2],['A3',2],['A3',2],
];
const GAME_CHORD: NoteStep[] = [
  ['C4',2],['B3',2],['C4',2],['F3',2],
  ['F3',2],['B3',2],['C4',2],['C4',2],
];

function scheduleTrack(
  ctx: AudioContext,
  masterGain: GainNode,
  melody: NoteStep[], bass: NoteStep[], chord: NoteStep[],
  startTime: number,
  bpm: number,
  onLoop: () => void,
): void {
  const beatDur = 60 / bpm;

  const makeOsc = (type: OscillatorType, freq: number, t: number, dur: number, vol: number) => {
    if (freq === 0) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.setValueAtTime(vol, t + dur * beatDur - 0.04);
    g.gain.linearRampToValueAtTime(0, t + dur * beatDur);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(t);
    osc.stop(t + dur * beatDur + 0.01);
    musicNodes.push(osc, g);
  };

  let t = startTime;
  for (const [n, d] of melody) {
    makeOsc('square', NOTE[n] || 0, t, d, 0.10);
    t += d * beatDur;
  }
  const totalBeats = melody.reduce((s, [, d]) => s + d, 0);
  const loopEnd = startTime + totalBeats * beatDur;

  let bt = startTime;
  for (const [n, d] of bass) {
    makeOsc('triangle', NOTE[n] || 0, bt, d, 0.14);
    bt += d * beatDur;
  }
  let ct = startTime;
  for (const [n, d] of chord) {
    makeOsc('square', NOTE[n] || 0, ct, d, 0.05);
    ct += d * beatDur;
  }

  // Pulse/arpegio percussion feel
  const arpNotes = ['C4','E4','G4','E4'];
  for (let i = 0; i < totalBeats * 2; i++) {
    const freq = NOTE[arpNotes[i % arpNotes.length]];
    const pt = startTime + i * (beatDur * 0.5);
    if (pt < loopEnd) makeOsc('square', freq, pt, 0.1, 0.03);
  }

  const until = loopEnd - ctx.currentTime;
  const timer = setTimeout(() => {
    onLoop();
  }, Math.max(0, (until - 0.1) * 1000));
  musicSchedulerTimer = timer;
}

export function playMusic(track: 'menu' | 'game') {
  if (currentTrack === track) return;
  stopMusic();
  const ctx = getAudioCtx();
  if (!ctx) return;
  currentTrack = track;

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0, ctx.currentTime);
  masterGain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 2.0);
  masterGain.connect(ctx.destination);
  musicGain = masterGain;

  const bpm = track === 'menu' ? 76 : 68;
  const melody = track === 'menu' ? MENU_MELODY : GAME_MELODY;
  const bass = track === 'menu' ? MENU_BASS : GAME_BASS;
  const chord = track === 'menu' ? MENU_CHORD : GAME_CHORD;

  const loop = () => {
    if (currentTrack !== track) return;
    const c = getAudioCtx();
    if (!c) return;
    scheduleTrack(c, masterGain, melody, bass, chord, c.currentTime, bpm, loop);
  };
  scheduleTrack(ctx, masterGain, melody, bass, chord, ctx.currentTime, bpm, loop);
}

export function stopMusic() {
  if (musicSchedulerTimer) { clearTimeout(musicSchedulerTimer); musicSchedulerTimer = null; }
  for (const n of musicNodes) { try { (n as any).stop?.(); n.disconnect(); } catch { } }
  musicNodes = [];
  if (musicGain) { try { musicGain.disconnect(); } catch { } musicGain = null; }
  currentTrack = null;
}

export function fadeOutMusic(duration = 1500) {
  const ctx = getAudioCtx();
  if (!ctx || !musicGain) { stopMusic(); return; }
  musicGain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration / 1000);
  setTimeout(() => stopMusic(), duration + 100);
}
