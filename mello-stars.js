(() => {
  const gifts = [
    { id: 'cake', emoji: '🎂', name: 'Тортик', stars: 20 },
    { id: 'bear', emoji: '🧸', name: 'Мишка', stars: 20 },
    { id: 'heart', emoji: '❤️', name: 'Сердце', stars: 20 },
    { id: 'kiss', emoji: '😘', name: 'Поцелуй', stars: 20 },
    { id: 'wine', emoji: '🍷', name: 'Вино', stars: 30 }
  ];
  const emojiFile = emoji => Array.from(emoji.replace(/[\uFE0E\uFE0F]/gu, ''), ch => ch.codePointAt(0).toString(16)).join('-');
  const emojiUrl = emoji => `https://www.emojiall.com/images/120/telegram/${emojiFile(emoji)}.gif`;
  const storedStars = () => {
    if (!account) return 0;
    if (!Number.isFinite(account.melloStars)) account.melloStars = 10;
    return Math.max(0, account.melloStars);
  };
  const infiniteWallet = () => !!window.melloHasInfiniteWallet?.();
  const saveStars = () => { if (account && typeof save === 'function') save(); };

  const styles = document.createElement('style');
  styles.textContent = `
    .mello-stars-badge{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border:1px solid #a8ffce2f;border-radius:999px;background:linear-gradient(120deg,#81e7aa22,#ffffff08);color:#d9ffe7;font-size:11px;font-weight:700;white-space:nowrap}
    .mello-stars-badge img,.mello-gift-emoji,.mello-stars-inline{width:1.35em;height:1.35em;object-fit:contain;vertical-align:-.28em}
    .mello-stars-panel{width:min(100%,430px);padding:17px;border:1px solid #ffffff25;border-radius:24px;background:linear-gradient(145deg,#1d3328f5,#101a16f8);color:#effaf2;box-shadow:0 24px 80px #0009;backdrop-filter:blur(24px)}
    .mello-stars-balance{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px;border:1px solid #ffffff15;border-radius:16px;background:#ffffff09}
    .mello-stars-balance strong{font-size:19px}.mello-stars-balance small{display:block;margin-top:3px;color:#a9c2b2;font-size:10px}
    .mello-gift-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:13px}
    .mello-gift-choice{display:flex;align-items:center;gap:10px;min-height:64px;padding:10px;border:1px solid #ffffff1b;border-radius:15px;background:#ffffff08;color:inherit;text-align:left;cursor:pointer;transition:transform .18s ease,border-color .18s ease,background .18s ease}
    .mello-gift-choice:hover{transform:translateY(-2px);border-color:#79e4a6;background:#ffffff11}
    .mello-gift-choice:disabled{opacity:.42;cursor:not-allowed;transform:none}
    .mello-gift-choice img{width:38px;height:38px;object-fit:contain}.mello-gift-choice b{display:block;font-size:12px}.mello-gift-choice small{display:block;margin-top:4px;color:#9ec2ab;font-size:10px}
    .mello-stars-note{margin:11px 2px 0;color:#a2b9aa;font-size:10px;line-height:1.5}
    .mello-gift-bubble{min-width:190px;padding:13px 15px;border:1px solid #9af3be2a;border-radius:20px;background:linear-gradient(145deg,#24563d,#183c2b);box-shadow:0 8px 25px #0002;color:#f4fff7}
    .mello-gift-bubble.mine{background:linear-gradient(145deg,#236344,#17442f)}.mello-gift-bubble-main{display:flex;align-items:center;gap:9px;font-size:12px;font-weight:700}.mello-gift-bubble-main img{width:42px;height:42px;object-fit:contain}.mello-gift-bubble small{display:block;margin-top:8px;color:#c3e4ce;font-size:10px}.mello-gift-bubble time{display:block;margin-top:7px;color:#b7d4c1;font-size:9px;text-align:right}
    .mello-profile-actions [data-gift-open]{background:#ffffff0b;color:inherit;font-weight:700}
    .light-theme .mello-stars-badge{color:#315740;background:#e3f8e9}.light-theme .mello-stars-panel{background:#f5fff8;color:#213b2b;border-color:#41674b30}.light-theme .mello-gift-choice{background:#e8f5ec;color:#243e2d}.light-theme .mello-stars-note,.light-theme .mello-gift-choice small{color:#5d7865}
  `;
  document.head.append(styles);

  const priorMarkup = window.messageMarkup || messageMarkup;
  window.messageMarkup = function (message) {
    if (message.kind === 'mello-gift') {
      return `<div class="mello-gift-bubble ${message.mine ? 'mine' : ''}"><div class="mello-gift-bubble-main"><img src="${emojiUrl(message.emoji)}" alt="${esc(message.giftName)}"><span>${esc(message.giftName)}</span></div><small>Подарок от ${esc(message.sender || 'пользователя Metto')} · ${Number(message.cost) || 0} <img class="mello-stars-inline" src="${emojiUrl('⭐')}" alt="Stars"></small><time>${esc(message.time || '')}</time></div>`;
    }
    return priorMarkup(message);
  };

  function openGiftChooser(target) {
    const host = document.querySelector('#modalHost');
    if (!host || !account) return;
    const balance = storedStars();
    host.innerHTML = `<div class="modal-bg" id="melloGiftBg"><section class="mello-stars-panel"><div class="modal-top"><h2>Подарки Metto</h2><button type="button" class="close" data-gift-close aria-label="Закрыть">×</button></div><div class="mello-stars-balance"><div><strong>Твои Stars</strong><small>Баланс этого демо-аккаунта</small></div><span class="mello-stars-badge"><img src="${emojiUrl('⭐')}" alt=""> <span data-stars-count>${infiniteWallet()?'∞':balance}</span></span></div><div class="mello-gift-grid">${gifts.map(gift => `<button type="button" class="mello-gift-choice" data-gift-id="${gift.id}" ${!infiniteWallet()&&balance < gift.stars ? 'disabled' : ''}><img src="${emojiUrl(gift.emoji)}" alt="${gift.name}"><span><b>${gift.name}</b><small>${gift.stars} <img class="mello-stars-inline" src="${emojiUrl('⭐')}" alt="Stars"></small></span></button>`).join('')}</div><p class="mello-stars-note">Подарок спишет звёзды с твоего демо-баланса и появится в чате. Покупки и реальные платежи пока не подключены.</p></section></div>`;
    const close = () => host.replaceChildren();
    host.querySelector('[data-gift-close]').onclick = close;
    host.querySelector('#melloGiftBg').onclick = e => { if (e.target.id === 'melloGiftBg') close(); };
    host.querySelectorAll('[data-gift-id]').forEach(button => button.onclick = () => {
      const gift = gifts.find(item => item.id === button.dataset.giftId);
      if (!gift || (!infiniteWallet() && storedStars() < gift.stars)) return;
      if (!infiniteWallet()) { account.melloStars = storedStars() - gift.stars; saveStars(); }
      close();
      if (target.personId) {
        let chosen = chats.find(item => item.personId === target.personId);
        if (!chosen) { startChat(target.personId); chosen = chats.find(item => item.id === current); }
        if (chosen) {
          chosen.messages.push({ kind: 'mello-gift', giftId: gift.id, giftName: gift.name, emoji: gift.emoji, cost: gift.stars, sender: account.name || 'ты', mine: true, time: timeNow() });
          save();
          openChat(chosen.id);
        }
      }
      toast(`${gift.name} отправлен за ${gift.stars} Stars`);
    });
  }

  document.addEventListener('click', e => {
    const button = e.target.closest('[data-gift-open]');
    if (!button) return;
    const personId = button.dataset.personId;
    if (!personId) { toast('Открой профиль собеседника из чата'); return; }
    openGiftChooser({ personId });
  });

  window.MettoStars = { gifts, openGiftChooser, balance: storedStars };
})();
