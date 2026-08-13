/* ============================================================
   renderer.js — all canvas drawing: snake, food, glow, screen shake
   Exposes: window.SG.Renderer
   ============================================================ */
window.SG = window.SG || {};

(function () {
  'use strict';

  class Renderer {
    constructor(ctx, gridSize, cell) {
      this.ctx = ctx;
      this.gridSize = gridSize;
      this.cell = cell;
      this.shake = { intensity: 0 };
    }

    triggerShake(intensity = 6) {
      this.shake.intensity = intensity;
    }

    _applyShake() {
      const ctx = this.ctx;
      if (this.shake.intensity > 0.2) {
        const dx = (Math.random() - 0.5) * this.shake.intensity;
        const dy = (Math.random() - 0.5) * this.shake.intensity;
        ctx.translate(dx, dy);
        this.shake.intensity *= 0.85;
      } else {
        this.shake.intensity = 0;
      }
    }

    clear() {
      const ctx = this.ctx;
      const size = this.gridSize * this.cell;
      ctx.clearRect(-20, -20, size + 40, size + 40);
    }

    drawGrid() {
      const ctx = this.ctx;
      ctx.save();
      ctx.globalAlpha = 0.06;
      ctx.fillStyle = '#233b1c';
      for (let y = 0; y < this.gridSize; y++) {
        for (let x = 0; x < this.gridSize; x++) {
          if ((x + y) % 2 === 0) {
            ctx.fillRect(x * this.cell, y * this.cell, this.cell, this.cell);
          }
        }
      }
      ctx.restore();
    }

    _lerpSegments(snake, t) {
      return snake.segments.map((seg, i) => {
        const prev = snake.prevSegments[i] || seg;
        // guard against big jumps when snake just grew (prev array shorter)
        const px = prev.x, py = prev.y;
        let dx = seg.x - px;
        let dy = seg.y - py;
        // handle wrap-around interpolation (don't draw a line across the board)
        if (Math.abs(dx) > 1) dx = 0;
        if (Math.abs(dy) > 1) dy = 0;
        return { x: px + dx * t, y: py + dy * t };
      });
    }

    drawSnake(snake, t) {
      const ctx = this.ctx;
      const cell = this.cell;
      const cells = this._lerpSegments(snake, t);
      const n = cells.length;

      cells.forEach((c, i) => {
        const px = c.x * cell;
        const py = c.y * cell;
        const isHead = i === 0;
        const fade = 1 - (i / n) * 0.55;

        ctx.save();
        if (isHead) {
          ctx.shadowColor = 'rgba(35,59,28,0.55)';
          ctx.shadowBlur = 10;
        }
        ctx.fillStyle = isHead
          ? '#1b2e15'
          : `rgba(35,59,28,${0.85 * fade})`;

        const pad = isHead ? 1 : 2;
        const r = isHead ? 6 : 4;
        this._roundRect(px + pad, py + pad, cell - pad * 2, cell - pad * 2, r);
        ctx.fill();
        ctx.restore();

        if (isHead) {
          this._drawEyes(px, py, snake.direction);
        }
      });
    }

    _drawEyes(px, py, direction) {
      const ctx = this.ctx;
      const cell = this.cell;
      const offsets = {
        right: [[0.62, 0.28], [0.62, 0.72]],
        left: [[0.38, 0.28], [0.38, 0.72]],
        up: [[0.28, 0.38], [0.72, 0.38]],
        down: [[0.28, 0.62], [0.72, 0.62]]
      }[direction];

      ctx.fillStyle = '#d9f0c8';
      offsets.forEach(([ox, oy]) => {
        ctx.beginPath();
        ctx.arc(px + ox * cell, py + oy * cell, cell * 0.09, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    drawFood(food, now) {
      const ctx = this.ctx;
      const cell = this.cell;
      const cx = food.x * cell + cell / 2;
      const cy = food.y * cell + cell / 2;
      const pulse = food.pulsePhase(now);
      const baseR = cell * (food.isSpecial ? 0.34 : 0.28);
      const r = baseR + pulse * 2.2;

      ctx.save();
      const color = food.isSpecial ? '255,209,102' : '233,69,96';
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2.4);
      glow.addColorStop(0, `rgba(${color},${0.45 + pulse * 0.25})`);
      glow.addColorStop(1, 'rgba(233,69,96,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 2.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = food.isSpecial ? '#ffd166' : '#e94560';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath();
      ctx.arc(cx - r * 0.3, cy - r * 0.3, r * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    _roundRect(x, y, w, h, r) {
      const ctx = this.ctx;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    frame(snake, food, burst, t, now) {
      const ctx = this.ctx;
      ctx.save();
      this._applyShake();
      this.clear();
      this.drawGrid();
      this.drawFood(food, now);
      this.drawSnake(snake, t);
      if (burst && burst.isActive) burst.draw(ctx);
      ctx.restore();
    }
  }

  window.SG.Renderer = Renderer;
})();
