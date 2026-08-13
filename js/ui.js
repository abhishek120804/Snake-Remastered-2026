/* ============================================================
   ui.js — DOM wiring: intro, HUD, in-phone panels, leaderboard
   Exposes: window.SG.UI
   ============================================================ */
window.SG = window.SG || {};

(function () {
  'use strict';

  const LB_KEY = 'snake_remastered_scores';
  const BEST_KEY = 'snake_remastered_best';

  class UIManager {
    constructor() {
      this.el = {
        intro: document.getElementById('intro'),
        introEnter: document.getElementById('introEnter'),
        score: document.getElementById('score'),
        best: document.getElementById('best'),
        ready: document.getElementById('ready'),
        readyStart: document.getElementById('readyStart'),
        gameOver: document.getElementById('gameOver'),
        finalScore: document.getElementById('finalScore'),
        playAgainBtn: document.getElementById('playAgainBtn'),
        leaderboardBtn: document.getElementById('leaderboardBtn'),
        leaderboardView: document.getElementById('leaderboardView'),
        leaderboardList: document.getElementById('leaderboardList'),
        screenGlow: document.querySelector('.screen-glow'),
        muteBtn: document.getElementById('muteBtn')
      };
      this.best = Number(localStorage.getItem(BEST_KEY) || 0);
      this.updateBest(this.best);
    }

    /* ---------- intro ---------- */
    dismissIntro() {
      this.el.intro.classList.add('fade-out');
    }

    /* ---------- HUD ---------- */
    updateScore(score) {
      this.el.score.textContent = String(score).padStart(3, '0');
    }

    updateBest(best) {
      this.best = best;
      this.el.best.textContent = String(best).padStart(3, '0');
      localStorage.setItem(BEST_KEY, String(best));
    }

    maybeUpdateBest(score) {
      if (score > this.best) {
        this.updateBest(score);
        return true;
      }
      return false;
    }

    /* ---------- panels ---------- */
    showReady() {
      this.el.ready.classList.remove('hidden');
    }
    hideReady() {
      this.el.ready.classList.add('hidden');
    }

    showGameOver(score) {
      this.el.finalScore.textContent = String(score);
      this.el.leaderboardView.classList.add('hidden');
      this.el.gameOver.classList.remove('hidden');
    }
    hideGameOver() {
      this.el.gameOver.classList.add('hidden');
    }

    toggleLeaderboard() {
      const isHidden = this.el.leaderboardView.classList.contains('hidden');
      if (isHidden) {
        this.renderLeaderboard(this.loadLeaderboard());
        this.el.leaderboardView.classList.remove('hidden');
      } else {
        this.el.leaderboardView.classList.add('hidden');
      }
    }

    /* ---------- screen glow pulse (on eat) ---------- */
    pulseGlow() {
      this.el.screenGlow.classList.add('pulse');
      clearTimeout(this._glowTimer);
      this._glowTimer = setTimeout(() => this.el.screenGlow.classList.remove('pulse'), 180);
    }

    /* ---------- local leaderboard ---------- */
    loadLeaderboard() {
      try {
        return JSON.parse(localStorage.getItem(LB_KEY) || '[]');
      } catch (e) {
        return [];
      }
    }

    submitScore(name, score) {
      const list = this.loadLeaderboard();
      list.push({ name: (name || 'Player').slice(0, 10), score });
      list.sort((a, b) => b.score - a.score);
      const trimmed = list.slice(0, 20);
      localStorage.setItem(LB_KEY, JSON.stringify(trimmed));
      return trimmed;
    }

    renderLeaderboard(list) {
      if (!list.length) {
        this.el.leaderboardList.innerHTML = '<li>No scores yet — be the first!</li>';
        return;
      }
      this.el.leaderboardList.innerHTML = list
        .slice(0, 10)
        .map((e) => `<li><span>${this._escape(e.name)}</span><span>${e.score}</span></li>`)
        .join('');
    }

    _escape(str) {
      return String(str).replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
      }[c]));
    }

    /* ---------- mute button ---------- */
    setMuteIcon(muted) {
      this.el.muteBtn.textContent = muted ? '🔇' : '🔊';
    }
  }

  window.SG.UI = new UIManager();
})();
