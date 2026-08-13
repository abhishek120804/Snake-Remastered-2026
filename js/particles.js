/* ============================================================
   particles.js — background starfield + foreground burst engine
   Exposes: window.SG.Particles.StarField, window.SG.Particles.Burst
   ============================================================ */
window.SG = window.SG || {};

(function () {
  'use strict';

  /* ---------- Background starfield (drawn on its own full-screen canvas) ---------- */
  class StarField {
    constructor(canvas, count = 140) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.count = count;
      this.stars = [];
      this.shootingStar = null;
      this.nextShootAt = performance.now() + 4000 + Math.random() * 6000;

      this.resize = this.resize.bind(this);
      window.addEventListener('resize', this.resize);
      this.resize();
    }

    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = window.innerWidth * dpr;
      this.canvas.height = window.innerHeight * dpr;
      this.canvas.style.width = window.innerWidth + 'px';
      this.canvas.style.height = window.innerHeight + 'px';
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.buildStars();
    }

    buildStars() {
      this.stars = Array.from({ length: this.count }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 1.4 + 0.3,
        baseAlpha: Math.random() * 0.5 + 0.25,
        twinkleSpeed: Math.random() * 0.0018 + 0.0006,
        phase: Math.random() * Math.PI * 2
      }));
    }

    maybeSpawnShootingStar(now) {
      if (this.shootingStar || now < this.nextShootAt) return;
      this.shootingStar = {
        x: Math.random() * window.innerWidth * 0.6,
        y: Math.random() * window.innerHeight * 0.3,
        vx: 7 + Math.random() * 4,
        vy: 3 + Math.random() * 2,
        life: 1
      };
    }

    update(now) {
      this.maybeSpawnShootingStar(now);
      if (this.shootingStar) {
        const s = this.shootingStar;
        s.x += s.vx;
        s.y += s.vy;
        s.life -= 0.02;
        if (s.life <= 0 || s.x > window.innerWidth || s.y > window.innerHeight) {
          this.shootingStar = null;
          this.nextShootAt = now + 5000 + Math.random() * 8000;
        }
      }
    }

    draw(now) {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      for (const s of this.stars) {
        const twinkle = Math.sin(now * s.twinkleSpeed + s.phase) * 0.35 + 0.65;
        ctx.globalAlpha = s.baseAlpha * twinkle;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (this.shootingStar) {
        const s = this.shootingStar;
        const grad = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * 8, s.y - s.vy * 8);
        grad.addColorStop(0, `rgba(255,255,255,${s.life})`);
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.vx * 8, s.y - s.vy * 8);
        ctx.stroke();
      }
    }

    tick(now) {
      this.update(now);
      this.draw(now);
    }
  }

  /* ---------- Foreground burst particles (food sparkle, death explosion) ---------- */
  class Burst {
    constructor() {
      this.particles = [];
    }

    spawn(x, y, { count = 14, colors = ['#4deeea', '#8b6bff'], speed = 3, life = 28, size = 2.4 } = {}) {
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
        const velocity = speed * (0.5 + Math.random() * 0.8);
        this.particles.push({
          x, y,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          life,
          maxLife: life,
          size: size * (0.6 + Math.random() * 0.8),
          color: colors[Math.floor(Math.random() * colors.length)]
        });
      }
    }

    update() {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.94;
        p.vy *= 0.94;
        p.life--;
        if (p.life <= 0) this.particles.splice(i, 1);
      }
    }

    draw(ctx) {
      for (const p of this.particles) {
        const alpha = Math.max(p.life / p.maxLife, 0);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    get isActive() {
      return this.particles.length > 0;
    }
  }

  window.SG.Particles = { StarField, Burst };
})();
