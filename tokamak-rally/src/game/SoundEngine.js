/**
 * SoundEngine v2 — Realistic rally car audio + Eurobeat BGM
 * Web Audio API procedural generation
 */

export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.started = false;
    this.masterGain = null;
    this.sfxGain = null;
    this.bgmGain = null;
    this.bgmPlaying = false;
  }

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.4;
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 1.0;
      this.sfxGain.connect(this.masterGain);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = 0.18;
      this.bgmGain.connect(this.masterGain);

      this._setupEngine();
      this._setupOffroad();
      this._setupDrift();
      this._setupBrake();
      this.started = true;
    } catch (e) {
      console.warn('SoundEngine init failed:', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  // =============================================
  // RALLY CAR ENGINE — layered oscillators + noise
  // Sawtooth base + square overtone + filtered noise (exhaust)
  // =============================================
  _setupEngine() {
    const ctx = this.ctx;

    // Layer 1: Low-frequency base rumble (sawtooth)
    this.engBase = ctx.createOscillator();
    this.engBase.type = 'sawtooth';
    this.engBase.frequency.value = 45;
    const baseFilter = ctx.createBiquadFilter();
    baseFilter.type = 'lowpass';
    baseFilter.frequency.value = 300;
    baseFilter.Q.value = 3;

    // Layer 2: Mid overtone (square — gives "boxer engine" character)
    this.engMid = ctx.createOscillator();
    this.engMid.type = 'square';
    this.engMid.frequency.value = 90;
    const midFilter = ctx.createBiquadFilter();
    midFilter.type = 'bandpass';
    midFilter.frequency.value = 500;
    midFilter.Q.value = 2;
    this.engMidGain = ctx.createGain();
    this.engMidGain.gain.value = 0;

    // Layer 3: Exhaust crackle (filtered noise)
    const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    this.engNoise = ctx.createBufferSource();
    this.engNoise.buffer = noiseBuf;
    this.engNoise.loop = true;
    this.engNoiseFilter = ctx.createBiquadFilter();
    this.engNoiseFilter.type = 'bandpass';
    this.engNoiseFilter.frequency.value = 200;
    this.engNoiseFilter.Q.value = 4;
    this.engNoiseGain = ctx.createGain();
    this.engNoiseGain.gain.value = 0;

    // Master engine gain
    this.engineGain = ctx.createGain();
    this.engineGain.gain.value = 0;

    // Connect layers
    this.engBase.connect(baseFilter);
    baseFilter.connect(this.engineGain);

    this.engMid.connect(midFilter);
    midFilter.connect(this.engMidGain);
    this.engMidGain.connect(this.engineGain);

    this.engNoise.connect(this.engNoiseFilter);
    this.engNoiseFilter.connect(this.engNoiseGain);
    this.engNoiseGain.connect(this.engineGain);

    this.engineGain.connect(this.sfxGain);

    this.engBase.start();
    this.engMid.start();
    this.engNoise.start();
  }

  updateEngine(speed, maxSpeed) {
    if (!this.started) return;
    const t = this.ctx.currentTime;
    const ratio = Math.min(Math.abs(speed) / (maxSpeed || 400), 1);

    // RPM simulation: idle 40Hz → redline 220Hz
    const rpm = 40 + ratio * 180;
    this.engBase.frequency.setTargetAtTime(rpm, t, 0.08);
    this.engMid.frequency.setTargetAtTime(rpm * 2, t, 0.08); // 2nd harmonic

    // Exhaust noise shifts up with RPM
    this.engNoiseFilter.frequency.setTargetAtTime(150 + ratio * 400, t, 0.1);

    // Volume layers
    this.engineGain.gain.setTargetAtTime(0.04 + ratio * 0.14, t, 0.08);
    this.engMidGain.gain.setTargetAtTime(ratio * 0.08, t, 0.1);
    this.engNoiseGain.gain.setTargetAtTime(0.02 + ratio * 0.06, t, 0.1);
  }

  // =============================================
  // OFFROAD — zone-specific tire noise
  // =============================================
  _setupOffroad() {
    const ctx = this.ctx;
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

    this.offroadSrc = ctx.createBufferSource();
    this.offroadSrc.buffer = buf;
    this.offroadSrc.loop = true;

    this.offroadFilter = ctx.createBiquadFilter();
    this.offroadFilter.type = 'bandpass';
    this.offroadFilter.frequency.value = 800;
    this.offroadFilter.Q.value = 1.5;

    this.offroadGain = ctx.createGain();
    this.offroadGain.gain.value = 0;

    this.offroadSrc.connect(this.offroadFilter);
    this.offroadFilter.connect(this.offroadGain);
    this.offroadGain.connect(this.sfxGain);
    this.offroadSrc.start();
  }

  _zoneFreq = {
    desert: 500, canyon: 1100, riverbed: 400,
    mountain: 800, sprint: 1400,
  };

  updateOffroad(isOffroad, speed, zoneName) {
    if (!this.started) return;
    const t = this.ctx.currentTime;
    if (isOffroad && Math.abs(speed) > 15) {
      this.offroadFilter.frequency.setTargetAtTime(this._zoneFreq[zoneName] || 800, t, 0.15);
      this.offroadGain.gain.setTargetAtTime(Math.min(Math.abs(speed) / 200, 1) * 0.1, t, 0.1);
    } else {
      this.offroadGain.gain.setTargetAtTime(0, t, 0.1);
    }
  }

  // =============================================
  // DRIFT — tire skid screech (~1300-1550Hz dominant, sharp tearing sound)
  // Based on real tire skid audio reference
  // =============================================
  _setupDrift() {
    const ctx = this.ctx;
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

    // Layer 1: Shaped noise — narrow band around 1300-1550Hz (tire friction core)
    this.driftSrc = ctx.createBufferSource();
    this.driftSrc.buffer = buf;
    this.driftSrc.loop = true;

    this.driftFilter = ctx.createBiquadFilter();
    this.driftFilter.type = 'bandpass';
    this.driftFilter.frequency.value = 1350;
    this.driftFilter.Q.value = 4;

    // Resonant peak at ~1350Hz for that piercing skid character
    const driftResonance = ctx.createBiquadFilter();
    driftResonance.type = 'peaking';
    driftResonance.frequency.value = 1350;
    driftResonance.gain.value = 14;
    driftResonance.Q.value = 5;

    // Upper harmonic presence ~1550Hz
    const upperPeak = ctx.createBiquadFilter();
    upperPeak.type = 'peaking';
    upperPeak.frequency.value = 1550;
    upperPeak.gain.value = 8;
    upperPeak.Q.value = 4;

    // Cut below 800Hz and above 3000Hz to keep it tight/sharp
    const locut = ctx.createBiquadFilter();
    locut.type = 'highpass';
    locut.frequency.value = 800;
    locut.Q.value = 1;

    const hicut = ctx.createBiquadFilter();
    hicut.type = 'lowpass';
    hicut.frequency.value = 3000;
    hicut.Q.value = 1;

    // Layer 2: Sawtooth oscillator at ~1320Hz for tonal screech
    this.driftSqueal = ctx.createOscillator();
    this.driftSqueal.type = 'sawtooth';
    this.driftSqueal.frequency.value = 1320;
    const squealFilter = ctx.createBiquadFilter();
    squealFilter.type = 'bandpass';
    squealFilter.frequency.value = 1350;
    squealFilter.Q.value = 10;
    this.driftSquealGain = ctx.createGain();
    this.driftSquealGain.gain.value = 0;

    this.driftGain = ctx.createGain();
    this.driftGain.gain.value = 0;

    // Connect noise chain
    this.driftSrc.connect(locut);
    locut.connect(this.driftFilter);
    this.driftFilter.connect(driftResonance);
    driftResonance.connect(upperPeak);
    upperPeak.connect(hicut);
    hicut.connect(this.driftGain);

    // Connect squeal
    this.driftSqueal.connect(squealFilter);
    squealFilter.connect(this.driftSquealGain);
    this.driftSquealGain.connect(this.sfxGain);

    this.driftGain.connect(this.sfxGain);
    this.driftSrc.start();
    this.driftSqueal.start();
  }

  updateDrift(isDrifting, speed, driftAngle) {
    if (!this.started) return;
    const t = this.ctx.currentTime;
    if (isDrifting && Math.abs(speed) > 40) {
      const i = Math.min(Math.abs(driftAngle || 0) / 30, 1);
      // Drift angle shifts pitch slightly (1200→1500Hz) — keeps it in skid range
      this.driftFilter.frequency.setTargetAtTime(1200 + i * 300, t, 0.03);
      this.driftGain.gain.setTargetAtTime(0.06 + i * 0.12, t, 0.02);
      // Oscillator tracks the noise center
      this.driftSqueal.frequency.setTargetAtTime(1250 + i * 250, t, 0.04);
      this.driftSquealGain.gain.setTargetAtTime(0.02 + i * 0.04, t, 0.02);
    } else {
      this.driftGain.gain.setTargetAtTime(0, t, 0.04);
      this.driftSquealGain.gain.setTargetAtTime(0, t, 0.04);
    }
  }

  // =============================================
  // BRAKE — screech
  // =============================================
  _setupBrake() {
    const ctx = this.ctx;
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

    this.brakeSrc = ctx.createBufferSource();
    this.brakeSrc.buffer = buf;
    this.brakeSrc.loop = true;
    const bFilter = ctx.createBiquadFilter();
    bFilter.type = 'highpass';
    bFilter.frequency.value = 2200;
    bFilter.Q.value = 6;
    this.brakeGain = ctx.createGain();
    this.brakeGain.gain.value = 0;
    this.brakeSrc.connect(bFilter);
    bFilter.connect(this.brakeGain);
    this.brakeGain.connect(this.sfxGain);
    this.brakeSrc.start();
  }

  updateBrake(isBraking, speed) {
    if (!this.started) return;
    const t = this.ctx.currentTime;
    if (isBraking && Math.abs(speed) > 30) {
      this.brakeGain.gain.setTargetAtTime(Math.min(Math.abs(speed) / 300, 1) * 0.05, t, 0.04);
    } else {
      this.brakeGain.gain.setTargetAtTime(0, t, 0.06);
    }
  }

  // =============================================
  // ONE-SHOT EFFECTS
  // =============================================
  playHit() {
    if (!this.started) return;
    const ctx = this.ctx;
    const len = Math.floor(ctx.sampleRate * 0.18);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.04));
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 600;
    const g = ctx.createGain(); g.gain.value = 0.35;
    src.connect(f); f.connect(g); g.connect(this.sfxGain);
    src.start();
  }

  playCheckpoint() {
    if (!this.started) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(1047, ctx.currentTime + 0.12);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.12, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25);
    osc.connect(g); g.connect(this.sfxGain);
    osc.start(); osc.stop(ctx.currentTime + 0.25);
  }

  playFinish() {
    if (!this.started) return;
    const ctx = this.ctx;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine'; osc.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.05);
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + i * 0.05 + 1.0);
      osc.connect(g); g.connect(this.sfxGain);
      osc.start(ctx.currentTime + i * 0.05);
      osc.stop(ctx.currentTime + i * 0.05 + 1.0);
    });
  }

  // =============================================
  // BGM — Eurobeat-inspired dance track (procedural)
  // 150 BPM, driving bass, synth leads, arpeggios
  // Inspired by Initial D / Cyber Formula OST energy
  // =============================================
  startBGM() {
    if (!this.started || this.bgmPlaying) return;
    this.bgmPlaying = true;
    const ctx = this.ctx;

    // Tempo: 170 BPM — fast eurobeat energy
    const BPM = 170;
    const beatSec = 60 / BPM;
    const barSec = beatSec * 4;
    const totalBars = 32; // ~51 seconds, then loop
    const loopLen = totalBars * barSec;

    // Create offline buffer for the BGM
    const sr = ctx.sampleRate;
    const bufLen = Math.ceil(loopLen * sr);
    const buf = ctx.createBuffer(2, bufLen, sr);
    const L = buf.getChannelData(0);
    const R = buf.getChannelData(1);

    // Helper: add sine tone to buffer
    const addTone = (freq, start, dur, vol, type = 'sine') => {
      const s = Math.floor(start * sr);
      const e = Math.min(Math.floor((start + dur) * sr), bufLen);
      for (let i = s; i < e; i++) {
        const t = (i - s) / sr;
        const env = Math.min(t / 0.005, 1) * Math.min((dur - t) / 0.02, 1);
        let v = 0;
        if (type === 'sine') v = Math.sin(2 * Math.PI * freq * t);
        else if (type === 'saw') v = 2 * ((freq * t) % 1) - 1;
        else if (type === 'square') v = Math.sin(2 * Math.PI * freq * t) > 0 ? 1 : -1;
        const sample = v * vol * Math.max(0, env);
        L[i] += sample;
        R[i] += sample;
      }
    };

    // Helper: add noise hit (kick/snare)
    const addHit = (start, dur, vol, lowpass = 200) => {
      const s = Math.floor(start * sr);
      const e = Math.min(Math.floor((start + dur) * sr), bufLen);
      for (let i = s; i < e; i++) {
        const t = (i - s) / sr;
        const env = Math.exp(-t / (dur * 0.3));
        // Simple lowpass approximation
        const noise = (Math.random() * 2 - 1);
        const v = noise * vol * env;
        L[i] += v;
        R[i] += v;
      }
    };

    // Kick drum — pitched sine + click
    const addKick = (start) => {
      const s = Math.floor(start * sr);
      const e = Math.min(s + Math.floor(0.15 * sr), bufLen);
      for (let i = s; i < e; i++) {
        const t = (i - s) / sr;
        const pitchEnv = 150 * Math.exp(-t * 30) + 45;
        const ampEnv = Math.exp(-t * 12);
        const v = Math.sin(2 * Math.PI * pitchEnv * t) * 0.25 * ampEnv;
        L[i] += v; R[i] += v;
      }
    };

    // Snare — noise + tone body
    const addSnare = (start) => {
      const s = Math.floor(start * sr);
      const e = Math.min(s + Math.floor(0.12 * sr), bufLen);
      for (let i = s; i < e; i++) {
        const t = (i - s) / sr;
        const env = Math.exp(-t * 15);
        const noise = (Math.random() * 2 - 1) * 0.15 * env;
        const tone = Math.sin(2 * Math.PI * 200 * t) * 0.08 * env;
        L[i] += noise + tone;
        R[i] += noise + tone;
      }
    };

    // Hi-hat — short noise burst
    const addHihat = (start, open = false) => {
      const dur = open ? 0.08 : 0.03;
      const s = Math.floor(start * sr);
      const e = Math.min(s + Math.floor(dur * sr), bufLen);
      for (let i = s; i < e; i++) {
        const t = (i - s) / sr;
        const env = Math.exp(-t / (dur * 0.4));
        const v = (Math.random() * 2 - 1) * (open ? 0.06 : 0.04) * env;
        L[i] += v; R[i] += v;
      }
    };

    // === DRUM PATTERN (4/4 eurobeat) ===
    for (let bar = 0; bar < totalBars; bar++) {
      const barStart = bar * barSec;
      for (let beat = 0; beat < 4; beat++) {
        const t = barStart + beat * beatSec;
        addKick(t); // kick on every beat (4 on the floor)
        if (beat === 1 || beat === 3) addSnare(t); // snare on 2 & 4
        // Hi-hats on 8th notes
        addHihat(t);
        addHihat(t + beatSec / 2, beat % 2 === 1);
      }
    }

    // === BASS LINE (driving eurobeat bass) ===
    // Key: A minor / E minor pattern
    const bassNotes = [
      // Pattern repeats every 4 bars
      110, 110, 130.81, 130.81,  // A2, A2, C3, C3
      146.83, 146.83, 130.81, 123.47, // D3, D3, C3, B2
      110, 110, 146.83, 146.83,  // A2, A2, D3, D3
      164.81, 146.83, 130.81, 110, // E3, D3, C3, A2
    ];
    for (let bar = 0; bar < totalBars; bar++) {
      const barStart = bar * barSec;
      const noteIdx = bar % bassNotes.length;
      const bassFreq = bassNotes[noteIdx];
      // Bass plays 8th note pattern
      for (let eighth = 0; eighth < 8; eighth++) {
        const t = barStart + eighth * beatSec / 2;
        addTone(bassFreq, t, beatSec / 2 * 0.8, 0.12, 'saw');
      }
    }

    // === SYNTH LEAD — eurobeat melody ===
    // Energetic arpeggio patterns
    const leadPatterns = [
      // Pattern A (bars 0-7): Rising energy
      [440, 523, 659, 784, 880, 784, 659, 523],
      // Pattern B (bars 8-15): Peak melody
      [880, 1047, 880, 784, 659, 784, 880, 1047],
      // Pattern C (bars 16-23): Tension
      [659, 784, 880, 784, 659, 523, 659, 784],
      // Pattern D (bars 24-31): Resolution
      [880, 784, 659, 523, 440, 523, 659, 880],
    ];
    for (let bar = 0; bar < totalBars; bar++) {
      const barStart = bar * barSec;
      const patIdx = Math.floor(bar / 8) % leadPatterns.length;
      const pattern = leadPatterns[patIdx];
      const noteInBar = bar % 8;
      const freq = pattern[noteInBar];
      // Play lead note for most of the bar
      if (bar >= 4) { // intro is drums only
        addTone(freq, barStart, barSec * 0.7, 0.06, 'square');
        // Add a subtle harmony 5th above
        addTone(freq * 1.5, barStart + beatSec, barSec * 0.4, 0.025, 'sine');
      }
    }

    // === ARPEGGIO LAYER — fast 16th note arpeggios ===
    const arpChords = [
      [440, 523, 659, 784],  // Am
      [523, 659, 784, 1047], // C
      [587, 698, 880, 1047], // Dm
      [659, 784, 988, 1175], // Em
    ];
    for (let bar = 8; bar < totalBars; bar++) { // starts bar 8
      const barStart = bar * barSec;
      const chord = arpChords[bar % arpChords.length];
      for (let sixteenth = 0; sixteenth < 16; sixteenth++) {
        const t = barStart + sixteenth * beatSec / 4;
        const noteIdx2 = sixteenth % chord.length;
        addTone(chord[noteIdx2], t, beatSec / 4 * 0.6, 0.025, 'sine');
      }
    }

    // Create looping source
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    src.connect(this.bgmGain);
    src.start();
    this._bgmSrc = src;
  }

  stopBGM() {
    if (this._bgmSrc) {
      try { this._bgmSrc.stop(); } catch (e) {}
      this._bgmSrc = null;
    }
    this.bgmPlaying = false;
  }

  // =============================================
  // CONTROL
  // =============================================
  stopAll() {
    if (!this.started) return;
    const t = this.ctx.currentTime;
    this.engineGain.gain.setTargetAtTime(0, t, 0.05);
    this.offroadGain.gain.setTargetAtTime(0, t, 0.05);
    this.driftGain.gain.setTargetAtTime(0, t, 0.05);
    this.brakeGain.gain.setTargetAtTime(0, t, 0.05);
  }

  destroy() {
    this.stopBGM();
    if (this.ctx) {
      try { this.ctx.close(); } catch (e) {}
    }
    this.ctx = null;
    this.started = false;
    this.masterGain = null;
    this.sfxGain = null;
    this.bgmGain = null;
    this.bgmPlaying = false;
  }
}

export const soundEngine = new SoundEngine();
