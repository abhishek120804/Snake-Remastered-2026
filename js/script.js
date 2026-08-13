/* ============================================================
   script.js — entry point: boots the star field, the Game, and
   wires up every control (keyboard, buttons, swipe, mute, intro).
   ============================================================ */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const UI = window.SG.UI;
    const Audio = window.SG.Audio;

    /* ---------- background starfield ---------- */
    const starsCanvas = document.getElementById('stars');
    const starField = new window.SG.Particles.StarField(starsCanvas);
    (function starLoop(now) {
      starField.tick(now || performance.now());
      requestAnimationFrame(starLoop);
    })();

    /* ---------- game ---------- */
    const gameCanvas = document.getElementById('game');
    const game = new window.SG.Game(gameCanvas);

    /* ---------- one-time audio unlock + player name ---------- */
    let audioUnlocked = false;
    function unlockAudio() {
      if (audioUnlocked) return;
      Audio.init();
      audioUnlocked = true;
      UI.setMuteIcon(Audio.muted);
    }

    function getPlayerName() {
      let name = localStorage.getItem('snake_remastered_name');
      if (!name) {
        name = (window.prompt('Nice run! Enter a name for the leaderboard:', 'Player') || 'Player').trim().slice(0, 10) || 'Player';
        localStorage.setItem('snake_remastered_name', name);
      }
      return name;
    }

    /* ---------- intro ---------- */
    const introEnter = document.getElementById('introEnter');
    function beginFromIntro() {
      unlockAudio();
      UI.dismissIntro();
    }
    introEnter.addEventListener('click', beginFromIntro);
    // Also allow a tap anywhere on the intro to skip it
    document.getElementById('intro').addEventListener('click', beginFromIntro);

    /* ---------- ready / start ---------- */
    document.getElementById('readyStart').addEventListener('click', () => {
      unlockAudio();
      game.start();
    });

    /* ---------- game over panel ---------- */
    const gameOverEl = document.getElementById('gameOver');
    document.getElementById('playAgainBtn').addEventListener('click', () => {
      game.start();
    });
    document.getElementById('leaderboardBtn').addEventListener('click', () => {
      UI.toggleLeaderboard();
    });

    // Auto-record the score once, right when the game-over panel appears.
    const gameOverObserver = new MutationObserver(() => {
      const justShown = !gameOverEl.classList.contains('hidden');
      if (justShown && !gameOverEl.dataset.recorded) {
        gameOverEl.dataset.recorded = 'true';
        const name = getPlayerName();
        UI.submitScore(name, game.score);
      }
      if (!justShown) {
        delete gameOverEl.dataset.recorded;
      }
    });
    gameOverObserver.observe(gameOverEl, { attributes: true, attributeFilter: ['class'] });

    /* ---------- keyboard ---------- */
    const KEY_MAP = {
      ArrowUp: 'up', w: 'up', W: 'up',
      ArrowDown: 'down', s: 'down', S: 'down',
      ArrowLeft: 'left', a: 'left', A: 'left',
      ArrowRight: 'right', d: 'right', D: 'right'
    };

    window.addEventListener('keydown', (e) => {
      if (e.key === ' ') {
        e.preventDefault();
        unlockAudio();
        const readyHidden = document.getElementById('ready').classList.contains('hidden');
        if (readyHidden && game.state !== 'gameover') {
          game.togglePause();
        } else if (!readyHidden) {
          game.start();
        }
        return;
      }
      const dir = KEY_MAP[e.key];
      if (!dir) return;
      e.preventDefault();
      unlockAudio();
      game.handleDirection(dir);
    });

    /* ---------- on-screen d-pad ---------- */
    const dirButtons = { up: 'up', down: 'down', left: 'left', right: 'right' };
    Object.keys(dirButtons).forEach((id) => {
      document.getElementById(id).addEventListener('click', () => {
        unlockAudio();
        game.handleDirection(dirButtons[id]);
      });
    });
    document.getElementById('center').addEventListener('click', () => {
      unlockAudio();
      game.togglePause();
    });

/* ---------- swipe controls ---------- */
let touchStart = null;

gameCanvas.addEventListener('touchstart', (e) => {
  if (e.touches.length !== 1) return;

  const t = e.touches[0];
  touchStart = {
    x: t.clientX,
    y: t.clientY
  };
}, { passive: true });

gameCanvas.addEventListener('touchend', (e) => {
  if (!touchStart) return;

  const t = e.changedTouches[0];

  const dx = t.clientX - touchStart.x;
  const dy = t.clientY - touchStart.y;

  touchStart = null;

  // Ignore very small movements
  if (Math.hypot(dx, dy) < 18) return;

  const dir =
    Math.abs(dx) > Math.abs(dy)
      ? (dx > 0 ? 'right' : 'left')
      : (dy > 0 ? 'down' : 'up');

  unlockAudio();
  game.handleDirection(dir);
}, { passive: true });

    /* ---------- mute button ---------- */
    UI.setMuteIcon(Audio.muted);
    document.getElementById('muteBtn').addEventListener('click', () => {
      unlockAudio();
      const muted = Audio.toggleMuted();
      UI.setMuteIcon(muted);
    });
  });
})();
