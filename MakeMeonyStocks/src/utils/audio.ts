let audioCtx: AudioContext | null = null;

export function playStepDone() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.25);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.25);
  } catch {
    // ignore audio errors
  }
}

export function playSimulateDone() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(660, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, audioCtx.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.28);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  } catch {}
}

export function playPlanSaved() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const osc2 = audioCtx.createOscillator();
    const mix = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.05); // E5
    mix.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    mix.gain.exponentialRampToValueAtTime(0.3, audioCtx.currentTime + 0.03);
    mix.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.4);
    osc.connect(mix).connect(audioCtx.destination);
    osc2.connect(mix);
    osc.start();
    osc2.start(audioCtx.currentTime + 0.05);
    osc.stop(audioCtx.currentTime + 0.4);
    osc2.stop(audioCtx.currentTime + 0.4);
  } catch {}
}