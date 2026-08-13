/* ============================================================
   food.js — food spawning + pulse/glow state
   Exposes: window.SG.Food
   ============================================================ */
window.SG = window.SG || {};

(function () {
  'use strict';

  const SPECIAL_CHANCE = 0.12; // ~1 in 8 foods is a bonus golden apple

  class Food {
    constructor(gridSize) {
      this.gridSize = gridSize;
      this.x = 0;
      this.y = 0;
      this.isSpecial = false;
      this.spawnedAt = performance.now();
    }

    respawn(occupiedCells) {
      let candidate;
      let attempts = 0;
      do {
        candidate = {
          x: Math.floor(Math.random() * this.gridSize),
          y: Math.floor(Math.random() * this.gridSize)
        };
        attempts++;
      } while (
        occupiedCells.some((c) => c.x === candidate.x && c.y === candidate.y) &&
        attempts < 200
      );

      this.x = candidate.x;
      this.y = candidate.y;
      this.isSpecial = Math.random() < SPECIAL_CHANCE;
      this.spawnedAt = performance.now();
    }

    get value() {
      return this.isSpecial ? 30 : 10;
    }

    pulsePhase(now) {
      // 0..1 pulsing scale factor, faster pulse for special food
      const speed = this.isSpecial ? 0.006 : 0.0035;
      return Math.sin((now - this.spawnedAt) * speed) * 0.5 + 0.5;
    }
  }

  window.SG.Food = Food;
})();
