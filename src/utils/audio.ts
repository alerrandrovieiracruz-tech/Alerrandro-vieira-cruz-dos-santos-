// Web Audio API Synthesizer for premium, zero-dependency sound effects.

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playTickSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.08);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  } catch (error) {
    console.warn('Audio play failed:', error);
  }
}

export function playToggleOffSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(250, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  } catch (error) {
    console.warn('Audio play failed:', error);
  }
}

export function playSuccessSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    
    // Play a lovely double-tone chime (perfect for completion)
    const playChime = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, startTime + duration * 0.5);
      
      gain.gain.setValueAtTime(0.0, startTime);
      gain.gain.linearRampToValueAtTime(0.12, startTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    playChime(523.25, now, 0.35); // C5
    playChime(659.25, now + 0.08, 0.4); // E5
    playChime(783.99, now + 0.16, 0.45); // G5
  } catch (error) {
    console.warn('Audio play failed:', error);
  }
}

export function playVictorySound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Magical celebratory arpeggio (C major 7 to C major 9)
    const notes = [261.63, 329.63, 392.00, 493.88, 523.25, 659.25, 783.99, 987.77, 1046.50];
    
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 2, now + idx * 0.08);

      gain.gain.setValueAtTime(0.0, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.08, now + idx * 0.08 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.6);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.6);
      osc2.start(now + idx * 0.08);
      osc2.stop(now + idx * 0.08 + 0.6);
    });
  } catch (error) {
    console.warn('Audio play failed:', error);
  }
}
