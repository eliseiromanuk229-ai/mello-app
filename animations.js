/* Metto / Mello v1.0 — opt-in motion helpers. No framework dependency. */
(() => {
  'use strict';
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const one = (selector, root = document) => root.querySelector(selector);
  const addOnce = (el, cls, duration = 650) => {
    if (!el || reduced) return;
    el.classList.remove(cls);
    void el.offsetWidth; // restart a one-shot CSS animation
    el.classList.add(cls);
    window.setTimeout(() => el.classList.remove(cls), duration);
  };

  function ripple(el, event) {
    if (reduced) return;
    const rect = el.getBoundingClientRect();
    const x = (event?.clientX ?? rect.left + rect.width / 2) - rect.left;
    const y = (event?.clientY ?? rect.top + rect.height / 2) - rect.top;
    const size = Math.max(rect.width, rect.height) / 6;
    const wave = document.createElement('span');
    wave.className = 'anim-ripple';
    wave.setAttribute('aria-hidden', 'true');
    wave.style.setProperty('--ripple-x', `${x}px`);
    wave.style.setProperty('--ripple-y', `${y}px`);
    wave.style.setProperty('--ripple-size', `${size}px`);
    el.append(wave);
    wave.addEventListener('animationend', () => wave.remove(), { once: true });
  }

  function attachClickMotion(root = document) {
    root.querySelectorAll('button:not([data-no-anim]), [role="button"]').forEach(el => {
      if (!el.hasAttribute('data-anim')) el.setAttribute('data-anim', 'click');
    });
    root.querySelectorAll('[data-anim="click"]').forEach(el => {
      if (el.dataset.animBound) return;
      el.dataset.animBound = 'true';
      el.classList.add('anim-btn-click');
      el.addEventListener('pointerdown', e => ripple(el, e), { passive: true });
      el.addEventListener('click', () => addOnce(el, 'anim-click-release', 420));
    });
  }

  function setupSend(form) {
    if (!form || form.dataset.animSendBound) return;
    form.dataset.animSendBound = 'true';
    const button = form.querySelector('.send,[type="submit"]');
    const input = form.querySelector('input:not([type="file"]),textarea,[contenteditable="true"]');
    if (!button) return;
    let icon = button.querySelector('[data-anim-icon]');
    if (!icon) {
      icon = document.createElement('span');
      icon.className = 'anim-send-icon';
      icon.dataset.animIcon = '';
      icon.textContent = button.textContent.trim() || '➤';
      button.replaceChildren(icon);
    }
    button.addEventListener('click', () => {
      if (!input || !String(input.value ?? input.textContent ?? '').trim()) {
        addOnce(button, 'anim-send-empty', 390);
        return;
      }
      addOnce(icon, 'anim-send-flight', 470);
    });
  }

  function annotateRows(root = document) {
    root.querySelectorAll('.row,[data-chat]').forEach(row => {
      row.classList.add('anim-chat-row');
      row.classList.toggle('is-selected', row.classList.contains('active'));
    });
  }

  function annotateNewMessages(root = document) {
    root.querySelectorAll('#messages .bubble:not([data-motion-ready])').forEach((bubble, index) => {
      bubble.dataset.motionReady = 'true';
      bubble.classList.add(bubble.classList.contains('mine') ? 'anim-msg-out' : 'anim-msg-in');
      if (index < 8) bubble.style.animationDelay = `${Math.min(index * 24, 168)}ms`;
    });
  }

  function annotateSurfaces(root = document) {
    root.querySelectorAll('.modal').forEach(el => el.classList.add('anim-modal-open'));
    root.querySelectorAll('.modal-bg').forEach(el => el.classList.add('anim-overlay'));
    root.querySelectorAll('.profile-drawer,[data-anim="drawer"]').forEach(el => el.classList.add('anim-drawer'));
    root.querySelectorAll('.shell.chat-open .pane,.pane.anim-chat-open').forEach(el => {
      if (el.dataset.chatMotionPlaying) return;
      el.dataset.chatMotionPlaying = 'true';
      el.classList.add('anim-chat-open');
      el.addEventListener('animationend', e => {
        if (e.animationName === 'anim-chat-enter') { el.classList.remove('anim-chat-open'); delete el.dataset.chatMotionPlaying; }
      });
    });
    root.querySelectorAll('#appView:not(.hidden)').forEach(el => {
      if (el.dataset.motionOpened) return;
      el.dataset.motionOpened = 'true';
      el.classList.add('anim-app-open');
      el.addEventListener('animationend', e => { if (e.animationName === 'anim-app-enter') el.classList.remove('anim-app-open'); }, { once: true });
    });
  }

  function init(root = document) {
    attachClickMotion(root);
    root.querySelectorAll('.search,.pane-head,.composer,.row,.modal,.profile-drawer').forEach(el => el.classList.add('anim-glass-hover'));
    root.querySelectorAll('.composer-tool,.add,.send,.rail-btn,.back,.close').forEach(el => el.classList.add('anim-icon-tilt'));
    setupSend(one('#composer', root));
    annotateRows(root);
    annotateNewMessages(root);
    annotateSurfaces(root);
  }

  // Public helpers for interactions created by the app at runtime.
  window.MettoAnimations = Object.freeze({
    play: (element, name = 'anim-pop-bubble', duration) => addOnce(element, name, duration || 700),
    ripple,
    remove: (element, after = 240) => {
      if (!element) return;
      element.classList.add('anim-msg-remove');
      window.setTimeout(() => element.remove(), reduced ? 0 : after);
    },
    close: (element, after = 150) => {
      if (!element) return;
      element.classList.add('anim-modal-close');
      window.setTimeout(() => element.remove(), reduced ? 0 : after);
    },
    reward: (coin, count, container = coin?.parentElement) => {
      if (!coin) return;
      addOnce(coin, 'anim-coin-spin', 900);
      if (container) { container.classList.add('anim-coin-reward'); container.dataset.coins = `+${count} Coins`; window.setTimeout(() => { container.classList.remove('anim-coin-reward'); delete container.dataset.coins; }, 1200); }
    },
    refresh: init
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init(), { once: true });
  else init();

  const observer = new MutationObserver(records => {
    let refresh = false;
    for (const record of records) {
      if (record.type === 'childList' && record.addedNodes.length) {
        for (const node of record.addedNodes) if (node.nodeType === 1) { init(node); refresh = true; }
      }
      if (record.type === 'attributes' && record.attributeName === 'class') {
        const el = record.target;
        if (el.matches?.('#appView:not(.hidden), #pane.chat-open')) annotateSurfaces(el.parentElement || document);
        if (el.matches?.('.row,[data-chat]')) el.classList.toggle('is-selected', el.classList.contains('active'));
      }
    }
    if (refresh) { annotateRows(); annotateNewMessages(); annotateSurfaces(); setupSend(one('#composer')); }
  });
  observer.observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
})();
