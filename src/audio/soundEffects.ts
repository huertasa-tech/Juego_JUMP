/**
 * Procedural Web Audio API sound synthesizer for hilarious cartoon sounds & catchy background beat.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private musicEnabled: boolean = true;
  private isBgmPlaying: boolean = false;
  private bgmIntervalId: number | null = null;
  private bgmStep: number = 0;

  constructor() {
    // Lazy init AudioContext on first user interaction to satisfy browser policies
  }

  private initContext() {
    try {
      if (!this.ctx && typeof window !== 'undefined') {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    } catch (e) {
      console.warn('AudioContext initialization error', e);
    }
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public isSoundOn(): boolean {
    return this.soundEnabled;
  }

  public setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (!enabled) {
      this.stopBgm();
    } else {
      this.startBgm();
    }
  }

  public isMusicOn(): boolean {
    return this.musicEnabled;
  }

  // Cartoon "BOING!" jump sound
  public playJump(isDouble: boolean = false) {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      const startFreq = isDouble ? 340 : 220;
      const endFreq = isDouble ? 880 : 660;

      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.18);
      osc.frequency.exponentialRampToValueAtTime(startFreq * 1.5, now + 0.28);

      // Spring vibrato
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(isDouble ? 35 : 28, now);
      lfoGain.gain.setValueAtTime(45, now);
      lfoGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      lfo.connect(osc.frequency);
      lfo.start(now);
      lfo.stop(now + 0.28);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.28);
    } catch {
      // ignore audio errors
    }
  }

  // Funny cartoon "BONK / SPLAT" crash sound
  public playCrash() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // 1. Low Thud / Bonk
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(260, now);
      osc1.frequency.exponentialRampToValueAtTime(45, now + 0.25);
      gain1.gain.setValueAtTime(0.6, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.25);

      // 2. Goofy cartoon slide-down squeak/whistle
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(600, now + 0.05);
      osc2.frequency.linearRampToValueAtTime(120, now + 0.45);
      gain2.gain.setValueAtTime(0.0001, now);
      gain2.gain.setValueAtTime(0.25, now + 0.05);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.05);
      osc2.stop(now + 0.45);

      // 3. Noise crunch
      const bufferSize = Math.max(1, Math.floor(this.ctx.sampleRate * 0.15));
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(1200, now);
      noiseFilter.frequency.exponentialRampToValueAtTime(200, now + 0.15);
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.3, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(now);
      noise.stop(now + 0.15);
    } catch {
      // ignore audio errors
    }
  }

  // Star collect chime
  public playStarCollect() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const notes = [587.33, 880, 1174.66]; // D5, A5, D6
      notes.forEach((freq, index) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * 0.04);
        gain.gain.setValueAtTime(0.2, now + index * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.04 + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + index * 0.04);
        osc.stop(now + index * 0.04 + 0.2);
      });
    } catch {
      // ignore audio errors
    }
  }

  // Power-up fanfare
  public playPowerUp() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880, 1108.73];
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        gain.gain.setValueAtTime(0.28, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.25);
      });
    } catch {
      // ignore audio errors
    }
  }

  // Shield pop / absorb
  public playShieldAbsorb() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(700, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.2);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch {
      // ignore audio errors
    }
  }

  // Near miss cartoon whoosh
  public playNearMiss() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(800, now + 0.08);
      osc.frequency.linearRampToValueAtTime(200, now + 0.2);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch {
      // ignore audio errors
    }
  }

  // Giant crush obstacle
  public playCrush() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch {
      // ignore audio errors
    }
  }

  // Speed Up Fanfare
  public playSpeedUp() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        gain.gain.setValueAtTime(0.12, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.18);
      });
    } catch {
      // ignore audio errors
    }
  }

  // UI Button Click pop
  public playClick() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.06);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch {
      // ignore audio errors
    }
  }

  // Catchy cartoon BGM synthesizer
  public startBgm() {
    if (!this.musicEnabled || this.isBgmPlaying) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      this.isBgmPlaying = true;
      this.bgmStep = 0;

      // Upbeat cartoon pentatonic bass & melody sequence
      const bassScale = [130.81, 146.83, 164.81, 196.00, 220.00]; // C3, D3, E3, G3, A3
      const melodyScale = [261.63, 329.63, 392.00, 523.25, 659.25]; // C4, E4, G4, C5, E5
      
      const bassPattern = [0, 2, 3, 4, 3, 2, 0, 3];
      const melodyPattern = [0, -1, 2, -1, 3, 2, 1, 4, 0, 3, 2, -1, 4, 3, 2, 0];

      const stepDuration = 180; // ms

      this.bgmIntervalId = window.setInterval(() => {
        try {
          if (!this.musicEnabled || !this.ctx || this.ctx.state !== 'running') return;
          const now = this.ctx.currentTime;

          // Bass note
          const bassIndex = bassPattern[this.bgmStep % bassPattern.length];
          if (bassIndex >= 0) {
            const bassOsc = this.ctx.createOscillator();
            const bassGain = this.ctx.createGain();
            bassOsc.type = 'triangle';
            bassOsc.frequency.setValueAtTime(bassScale[bassIndex % bassScale.length], now);
            bassGain.gain.setValueAtTime(0.08, now);
            bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
            bassOsc.connect(bassGain);
            bassGain.connect(this.ctx.destination);
            bassOsc.start(now);
            bassOsc.stop(now + 0.16);
          }

          // Melody note
          const melodyIndex = melodyPattern[this.bgmStep % melodyPattern.length];
          if (melodyIndex >= 0) {
            const melOsc = this.ctx.createOscillator();
            const melGain = this.ctx.createGain();
            melOsc.type = 'sine';
            melOsc.frequency.setValueAtTime(melodyScale[melodyIndex % melodyScale.length], now);
            melGain.gain.setValueAtTime(0.05, now);
            melGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
            melOsc.connect(melGain);
            melGain.connect(this.ctx.destination);
            melOsc.start(now);
            melOsc.stop(now + 0.14);
          }

          this.bgmStep++;
        } catch {
          // ignore interval sound errors
        }
      }, stepDuration);
    } catch {
      // ignore
    }
  }

  public stopBgm() {
    this.isBgmPlaying = false;
    if (this.bgmIntervalId !== null) {
      clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }
  }
}

export const soundManager = new SoundEngine();
