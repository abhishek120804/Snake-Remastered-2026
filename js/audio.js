/* ============================================================
   audio.js — procedural sound via WebAudio (no sound files needed)
   Exposes: window.SG.Audio
   ============================================================ */
window.SG = window.SG || {};

(function () {
  'use strict';

  class AudioManager {
    constructor() {
      this.ctx = null;
      this.muted = localStorage.getItem('snake_muted') === 'true';
      this.masterGain = null;
    }

    /* Must be called from within a user-gesture handler (click/keydown)
       because browsers block AudioContext until the user interacts. */
    init() {
      if (this.ctx) return;
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : 0.28;
      this.masterGain.connect(this.ctx.destination);
    }

    setMuted(muted) {
      this.muted = muted;
      localStorage.setItem('snake_muted', String(muted));
      if (this.masterGain) this.masterGain.gain.value = muted ? 0 : 0.28;
    }

    toggleMuted() {
      this.setMuted(!this.muted);
      return this.muted;
    }

    _tone(freq, duration, { type = 'sine', delay = 0, glideTo = null, volume = 1 } = {}) {
      if (!this.ctx) return;
      const t0 = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (glideTo !== null) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(glideTo, 1), t0 + duration);
      }

      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t0);
      osc.stop(t0 + duration + 0.02);
    }

    play(name) {
      if (!this.ctx) return;
      switch (name) {
        case 'eat':
          this._tone(660, 0.09, { type: 'square', glideTo: 880 });
          break;
        case 'specialFood':
          this._tone(520, 0.07, { type: 'square', glideTo: 1040 });
          this._tone(880, 0.09, { type: 'square', delay: 0.06, glideTo: 1320 });
          break;
        case 'move':
          this._tone(220, 0.02, { type: 'square', volume: 0.35 });
          break;
        case 'start':
          this._tone(392, 0.09, { type: 'triangle', glideTo: 523 });
          this._tone(523, 0.12, { type: 'triangle', delay: 0.1, glideTo: 659 });
          break;
        case 'pause':
          this._tone(300, 0.08, { type: 'sine' });
          break;
        case 'gameover':
          this._tone(392, 0.14, { type: 'sawtooth', glideTo: 220 });
          this._tone(261, 0.22, { type: 'sawtooth', delay: 0.12, glideTo: 110 });
          break;
        default:
          break;
      }
    }
  }

  window.SG.Audio = new AudioManager();
})();
