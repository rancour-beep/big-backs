// Procedural Web Audio engine — no external files needed
export class GameAudio {
  constructor() {
    this.ctx = null;
    this.engineOsc = null;
    this.engineGain = null;
    this.squeaGain = null;
    this.nosGain = null;
    this.masterGain = null;
    this.ready = false;
  }

  init() {
    if (this.ready) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.5;
      this.masterGain.connect(this.ctx.destination);

      // ── Engine oscillator ──
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 400;

      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.value = 0;
      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.value = 60;
      this.engineOsc.connect(lp).connect(this.engineGain).connect(this.masterGain);
      this.engineOsc.start();

      // ── Tire squeal (band-pass noise) ──
      const buf = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const noise = this.ctx.createBufferSource();
      noise.buffer = buf;
      noise.loop = true;

      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 3000;
      bp.Q.value = 1.5;

      this.squeaGain = this.ctx.createGain();
      this.squeaGain.gain.value = 0;
      noise.connect(bp).connect(this.squeaGain).connect(this.masterGain);
      noise.start();

      // ── NOS hiss ──
      const nosNoise = this.ctx.createBufferSource();
      const nosHpBuf = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
      const nosData = nosHpBuf.getChannelData(0);
      for (let i = 0; i < nosData.length; i++) nosData[i] = Math.random() * 2 - 1;
      nosNoise.buffer = nosHpBuf;
      nosNoise.loop = true;
      const nosHp = this.ctx.createBiquadFilter();
      nosHp.type = 'highpass';
      nosHp.frequency.value = 6000;
      this.nosGain = this.ctx.createGain();
      this.nosGain.gain.value = 0;
      nosNoise.connect(nosHp).connect(this.nosGain).connect(this.masterGain);
      nosNoise.start();

      this.ready = true;
    } catch (e) {
      console.warn('Audio failed:', e);
    }
  }

  beep(freq, dur, vol = 0.3) {
    if (!this.ready) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.frequency.value = freq;
    o.type = 'sine';
    g.gain.setValueAtTime(vol, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    o.connect(g).connect(this.masterGain);
    o.start();
    o.stop(this.ctx.currentTime + dur);
  }

  countdown(n) {
    // n=3,2,1 → high pitch; n=0 → "GO" chord
    if (n > 0) this.beep(440 * (n === 3 ? 1 : n === 2 ? 1 : 1.5), 0.15, 0.4);
    else { this.beep(660, 0.25, 0.5); this.beep(880, 0.25, 0.4); }
  }

  update(speed, topSpeed, isDrifting, nosActive) {
    if (!this.ready) return;
    // Engine pitch: 50Hz (idle) → 220Hz (full speed)
    const t = Math.min(1, Math.abs(speed) / topSpeed);
    const freq = 50 + t * 170 + (nosActive ? 40 : 0);
    this.engineOsc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.05);
    this.engineGain.gain.setTargetAtTime(0.08 + t * 0.1, this.ctx.currentTime, 0.05);

    // Squeal when drifting
    const targetSqueal = isDrifting && speed > 5 ? 0.18 : 0;
    this.squeaGain.gain.setTargetAtTime(targetSqueal, this.ctx.currentTime, 0.1);

    // NOS hiss
    this.nosGain.gain.setTargetAtTime(nosActive ? 0.15 : 0, this.ctx.currentTime, 0.05);
  }

  finishFanfare() {
    if (!this.ready) return;
    [523, 659, 784, 1047].forEach((f, i) => {
      setTimeout(() => this.beep(f, 0.4, 0.35), i * 120);
    });
  }
}
