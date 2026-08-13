/* ============================================================
   snake.js — segments, movement, collision, smooth interpolation
   Exposes: window.SG.Snake
   ============================================================ */
window.SG = window.SG || {};

(function () {
  'use strict';

  const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };

  class Snake {
    constructor(gridSize, startLength = 3) {
      this.gridSize = gridSize;
      this.reset(startLength);
    }

    reset(startLength = 3) {
      const midY = Math.floor(this.gridSize / 2);
      const startX = Math.floor(this.gridSize / 3);

      this.segments = [];
      for (let i = 0; i < startLength; i++) {
        this.segments.push({ x: startX - i, y: midY });
      }
      this.prevSegments = this.segments.map((s) => ({ ...s }));
      this.direction = 'right';
      this.nextDirection = 'right';
      this.pendingGrowth = 0;
    }

    setDirection(dir) {
      if (dir === OPPOSITE[this.direction]) return; // no reversing into yourself
      this.nextDirection = dir;
    }

    grow(amount = 1) {
      this.pendingGrowth += amount;
    }

    get head() {
      return this.segments[0];
    }

    /** Advances one logic tick. Returns { ateSelf, ateWall } collision flags
        based on wrap setting supplied by the caller. */
    step(wrapWalls) {
      this.prevSegments = this.segments.map((s) => ({ ...s }));
      this.direction = this.nextDirection;

      const head = { ...this.segments[0] };
      if (this.direction === 'up') head.y -= 1;
      if (this.direction === 'down') head.y += 1;
      if (this.direction === 'left') head.x -= 1;
      if (this.direction === 'right') head.x += 1;

      let ateWall = false;
      if (head.x < 0 || head.x >= this.gridSize || head.y < 0 || head.y >= this.gridSize) {
        if (wrapWalls) {
          head.x = (head.x + this.gridSize) % this.gridSize;
          head.y = (head.y + this.gridSize) % this.gridSize;
        } else {
          ateWall = true;
        }
      }

      const ateSelf = this.segments.some((s) => s.x === head.x && s.y === head.y);

      this.segments.unshift(head);
      if (this.pendingGrowth > 0) {
        this.pendingGrowth--;
      } else {
        this.segments.pop();
      }

      return { ateSelf, ateWall };
    }

    occupiedCells() {
      return this.segments;
    }
  }

  window.SG.Snake = Snake;
})();
