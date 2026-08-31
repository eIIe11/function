/**
 * §4.6 Sound. Synthesised with the Web Audio API rather than shipping audio
 * files: the palette is six short UI sounds, and generating them keeps the
 * bundle at zero bytes and lets pitch carry meaning (rising = correct).
 *
 * Rules enforced here: nothing plays before a user gesture, nothing plays on
 * hover, mute persists, and reduced-motion users still get sound (they asked
 * about motion, not audio).
 */
const MUTE_KEY = "function.muted";

type Cue = "tap" | "correct" | "weak" | "reveal" | "levelup" | "stop";

let ctx: AudioContext | null = null;
let unlocked = false;

export function isMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setMuted(muted: boolean): void {
  try {
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    // Private browsing: mute stays session-only rather than breaking playback.
  }
}

/** Must be called from a real user gesture handler. */
export function unlockAudio(): void {
  if (unlocked) return;
  unlocked = true;
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    ctx = new Ctor();
  } catch {
    ctx = null;
  }
}

const CUES: Record<Cue, { notes: number[]; type: OscillatorType; gain: number; step: number }> = {
  // A soft wooden tick for taps.
  tap: { notes: [520], type: "triangle", gain: 0.05, step: 0.055 },
  // Rising major third: the sound of being right.
  correct: { notes: [660, 880], type: "triangle", gain: 0.07, step: 0.085 },
  // Falling, but warm — informative, not punitive.
  weak: { notes: [400, 320], type: "sine", gain: 0.06, step: 0.1 },
  // The full stop landing.
  reveal: { notes: [300, 300], type: "sine", gain: 0.09, step: 0.05 },
  // Arpeggio for a level-up.
  levelup: { notes: [523, 659, 784, 1047], type: "triangle", gain: 0.08, step: 0.09 },
  // Timer end.
  stop: { notes: [220], type: "square", gain: 0.05, step: 0.16 },
};

export function play(cue: Cue): void {
  if (!ctx || isMuted()) return;
  const spec = CUES[cue];
  const now = ctx.currentTime;
  spec.notes.forEach((freq, i) => {
    const osc = ctx!.createOscillator();
    const gain = ctx!.createGain();
    osc.type = spec.type;
    osc.frequency.value = freq;
    const start = now + i * spec.step;
    const end = start + spec.step * 1.6;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(spec.gain, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(gain).connect(ctx!.destination);
    osc.start(start);
    osc.stop(end);
  });
}
