/* ============================================================
   game.js — state machine + main loop
   Exposes: window.SG.Game (class)
   ============================================================ */
window.SG = window.SG || {};

(function () {
  'use strict';

  const GRID_SIZE = 21;
  const CELL = 20;
  const BASE_TICK_MS = 150;
  const MIN_TICK_MS = 75;
  const SPEEDUP_EVERY_POINTS = 40; // speed up every N score points
  const WRAP_WALLS = false; // classic keypad behaviour: hitting a wall ends the run

  class Game {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');

      this.snake = new window.SG.Snake(GRID_SIZE);
      this.food = new window.SG.Food(GRID_SIZE);
      this.renderer = new window.SG.Renderer(this.ctx, GRID_SIZE, CELL);
      this.burst = new window.SG.Particles.Burst();

      this.state = 'ready'; // ready | playing | paused | gameover
      this.score = 0;
      this.tickMs = BASE_TICK_MS;
      this.acc = 0;
      this.lastFrame = 0;

      this.food.respawn(this.snake.occupiedCells());
      this._raf = this._raf.bind(this);
      requestAnimationFrame(this._raf);
    }

    /* ---------- public controls ---------- */
    start() {
      this.snake.reset();
      this.score = 0;
      this.tickMs = BASE_TICK_MS;
      this.acc = 0;
      this.food.respawn(this.snake.occupiedCells());
      this.state = 'playing';
      window.SG.UI.updateScore(0);
      window.SG.UI.hideReady();
      window.SG.UI.hideGameOver();
      window.SG.Audio.play('start');
    }

    togglePause() {
      if (this.state === 'playing') {
        this.state = 'paused';
        window.SG.Audio.play('pause');
      } else if (this.state === 'paused') {
        this.state = 'playing';
      }
    }

    handleDirection(dir) {
      if (this.state !== 'playing') return;
      this.snake.setDirection(dir);
    }

    /* ---------- logic tick ---------- */
    _tick() {
      const { ateSelf, ateWall } = this.snake.step(WRAP_WALLS);

      if (ateWall || ateSelf) {
        this._gameOver();
        return;
      }

      const head = this.snake.head;
      if (head.x === this.food.x && head.y === this.food.y) {
        this.score += this.food.value;
        this.snake.grow(1);
        window.SG.UI.updateScore(this.score);
        window.SG.UI.pulseGlow();
        window.SG.Audio.play(this.food.isSpecial ? 'specialFood' : 'eat');
        this.renderer.triggerShake(this.food.isSpecial ? 6 : 3);

        const cx = (this.food.x + 0.5) * CELL;
        const cy = (this.food.y + 0.5) * CELL;
        this.burst.spawn(cx, cy, {
          count: this.food.isSpecial ? 22 : 12,
          colors: this.food.isSpecial ? ['#ffd166', '#ffb703'] : ['#e94560', '#ff6b81'],
          speed: this.food.isSpecial ? 4 : 2.6
        });

        this.food.respawn(this.snake.occupiedCells());

        if (this.score > 0 && this.score % SPEEDUP_EVERY_POINTS === 0) {
          this.tickMs = Math.max(MIN_TICK_MS, this.tickMs - 6);
        }
      }
    }

    _gameOver() {
      this.state = 'gameover';
      this.renderer.triggerShake(12);
      window.SG.Audio.play('gameover');

      const head = this.snake.head;
      this.burst.spawn((head.x + 0.5) * CELL, (head.y + 0.5) * CELL, {
        count: 30,
        colors: ['#e94560', '#4deeea', '#8b6bff'],
        speed: 5,
        life: 40
      });

      window.SG.UI.maybeUpdateBest(this.score);
      window.SG.UI.showGameOver(this.score);
    }

    /* ---------- main loop ---------- */
    _raf(now) {
      if (!this.lastFrame) this.lastFrame = now;
      const dt = now - this.lastFrame;
      this.lastFrame = now;

      if (this.state === 'playing') {
        this.acc += dt;
        while (this.acc >= this.tickMs) {
          this._tick();
          this.acc -= this.tickMs;
          if (this.state !== 'playing') { this.acc = 0; break; }
        }
      }

      const t = this.state === 'playing' ? this.acc / this.tickMs : 1;
      this.burst.update();
      this.renderer.frame(this.snake, this.food, this.burst, t, now);

      requestAnimationFrame(this._raf);
    }
  }

  window.SG.Game = Game;
})();
