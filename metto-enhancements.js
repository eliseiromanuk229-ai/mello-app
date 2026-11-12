(() => {
  'use strict';

  const $ = selector => document.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
  const handle = () => String(account?.username || '@eliseizac').replace(/^@/, '');
  const accountId = () => account?.id || account?.email || account?.phone || 'guest';
  const historyKey = () => `metto.profile.history:${accountId()}`;
  const addHistory = text => {
    try {
      const items = JSON.parse(localStorage.getItem(historyKey()) || '[]');
      items.unshift({ text, at: new Date().toLocaleString('ru-RU') });
      localStorage.setItem(historyKey(), JSON.stringify(items.slice(0, 100)));
    } catch {}
  };

  const style = document.createElement('style');
  style.textContent = `
    .metto-brand-logo{width:100%;height:100%;object-fit:cover;border-radius:inherit;display:block}
    .metto-message-edit{float:right;margin:-3px -4px 3px 9px;padding:3px 7px;border:1px solid #c4ffdc36;border-radius:8px;background:#07160f;color:#c6ffda;font-size:10px;cursor:pointer;opacity:.72}
    .bubble:hover .metto-message-edit{opacity:1}.metto-message-link{color:#b7f5cb;text-decoration:underline;text-decoration-color:#9df5bb99;text-shadow:0 0 12px #5fe39488;cursor:pointer}
    .metto-message-link:hover{color:#e4ffed;text-shadow:0 0 18px #77ffa6}
    .metto-tools{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}.metto-tools button,.metto-tool-link{border:1px solid #9fffc044;border-radius:11px;padding:9px 12px;background:#a5ffd911;color:#dfffea;font:inherit;font-size:12px;text-decoration:none;cursor:pointer}
    .metto-qr{display:block;width:180px;height:180px;margin:12px auto;border:8px solid white;border-radius:15px;background:white}
    .metto-country-list{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;max-height:45dvh;overflow:auto;margin-top:12px}
    .metto-country-list button{padding:9px 4px;border:1px solid #ffffff18;border-radius:10px;background:#ffffff09;color:inherit;cursor:pointer}
    .metto-country-list button:hover{border-color:#a5ffd9}.metto-flag-badge{font-size:20px;margin-left:7px;vertical-align:middle}
    .metto-edit-card textarea{width:100%;min-height:130px;resize:vertical;padding:12px;border:1px solid #ffffff25;border-radius:14px;background:#09130f;color:#effcf4;font:inherit;line-height:1.5}
    .metto-edit-actions{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}.metto-edit-actions button{border:1px solid #9fffc044;border-radius:10px;padding:9px 11px;background:#a5ffd911;color:#dfffea;cursor:pointer}
    .metto-activity-list{max-height:45dvh;overflow:auto;list-style:none;padding:0}.metto-activity-list li{padding:10px;border-bottom:1px solid #ffffff12;color:#d9e9de;font-size:12px}.metto-activity-list small{display:block;color:#92aa99;margin-top:3px}
    body.metto-low-power *,body.metto-low-power *::before,body.metto-low-power *::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}
    body.metto-low-power .mello-cover-face,body.metto-low-power .gif-shimmer{filter:none!important}
    @media(max-width:520px){.metto-country-list{grid-template-columns:repeat(3,minmax(0,1fr))}.metto-message-edit{opacity:1}}
  `;
  document.head.append(style);

  // Use the supplied Metto icon in the app identity while retaining the old storage keys for upgrades.
  const iconURL = new URL('./assets/metto-logo.jpg', location.href).href;
  document.querySelectorAll('.logo,.rail-logo').forEach(node => {
    if (node.querySelector('img')) return;
    node.textContent = '';
    const image = document.createElement('img');
    image.className = 'metto-brand-logo'; image.src = iconURL; image.alt = 'Metto';
    node.append(image);
  });

  // Lightweight flag selector (ISO country/territory codes; unsupported flags fall back to emoji glyphs).
  const countryCodes = ('AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW').split(' ');
  const flagFor = code => [...code.toUpperCase()].map(c => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65)).join('');
  const countryName = code => { try { return new Intl.DisplayNames([navigator.language || 'ru'], { type: 'region' }).of(code) || code; } catch { return code; } };
  const countryGrid = () => countryCodes.map(code => `<button type="button" data-country="${code}">${flagFor(code)} ${esc(countryName(code))}</button>`).join('');

  const previousShowProfile = window.showProfile;
  if (previousShowProfile) window.showProfile = function () {
    previousShowProfile();
    const form = $('#profileForm');
    if (!form || form.querySelector('[data-metto-country]')) return;
    const row = document.createElement('div'); row.className = 'metto-tools';
    row.innerHTML = `<button type="button" data-metto-country>🌍 Страна: ${account?.countryCode ? flagFor(account.countryCode) + ' ' + esc(countryName(account.countryCode)) : 'выбрать флаг'}</button>`;
    form.querySelector('button.primary')?.before(row);
    row.querySelector('[data-metto-country]').onclick = () => {
      const host = document.body;
      host.insertAdjacentHTML('beforeend', `<div class="modal-bg metto-country-bg"><section class="modal"><div class="modal-top"><h2>Флаг страны</h2><button type="button" class="close" data-metto-country-close>×</button></div><input id="mettoCountrySearch" placeholder="Найти страну" style="width:100%;padding:10px;border-radius:10px;background:#102018;color:white;border:1px solid #ffffff22"><div class="metto-country-list">${countryGrid()}</div></section></div>`);
      const bg = host.lastElementChild;
      bg.querySelector('[data-metto-country-close]').onclick = () => bg.remove();
      bg.querySelector('#mettoCountrySearch').oninput = e => bg.querySelectorAll('[data-country]').forEach(b => b.hidden = !b.textContent.toLocaleLowerCase().includes(e.target.value.toLocaleLowerCase()));
      bg.querySelectorAll('[data-country]').forEach(button => button.onclick = () => { account.countryCode = button.dataset.country; addHistory(`Изменён флаг: ${countryName(button.dataset.country)}`); save(); bg.remove(); row.querySelector('button').textContent = `🌍 Страна: ${flagFor(account.countryCode)} ${countryName(account.countryCode)}`; toast('Флаг профиля сохранён на этом устройстве'); });
    };
  };

  const previousShowPersonCard = window.showPersonCard;
  if (previousShowPersonCard) window.showPersonCard = function (options) {
    previousShowPersonCard(options);
    if (!options?.own) return;
    const card = document.querySelector('.mello-profile-card');
    const actions = card?.querySelector('.mello-profile-actions');
    if (!card || !actions || card.querySelector('[data-metto-qr]')) return;
    if (account?.countryCode) card.querySelector('.mello-profile-summary h2')?.insertAdjacentHTML('beforeend', `<span class="metto-flag-badge" title="${esc(countryName(account.countryCode))}">${flagFor(account.countryCode)}</span>`);
    const tools = document.createElement('div'); tools.className = 'metto-tools';
    tools.innerHTML = '<button type="button" data-metto-qr>Показать QR-код</button><button type="button" data-metto-history>История профиля</button><button type="button" data-metto-password>Сменить пароль</button><a class="metto-tool-link" href="https://t.me/eliseizac" target="_blank" rel="noopener">Поддержка: @eliseizac</a>';
    actions.after(tools);
    tools.querySelector('[data-metto-password]').onclick = () => {
      const bg = document.createElement('div'); bg.className = 'modal-bg';
      bg.innerHTML = `<section class="modal"><div class="modal-top"><h2>Сменить пароль</h2><button class="close" aria-label="Закрыть">×</button></div><label class="field"><span>Текущий пароль</span><input data-current-password type="password" inputmode="numeric" autocomplete="current-password"></label><label class="field"><span>Новый пароль · от 8 цифр</span><input data-next-password type="password" inputmode="numeric" autocomplete="new-password"></label><label class="field"><span>Повтори пароль</span><input data-repeat-password type="password" inputmode="numeric" autocomplete="new-password"></label><button class="primary" data-save-password>Сохранить пароль</button><small class="setting-help" data-password-status>Пароль хранится только в этом браузере и не синхронизируется.</small></section>`;
      document.body.append(bg); const close = () => bg.remove(); bg.querySelector('.close').onclick = close; bg.onclick = e => { if (e.target === bg) close(); };
      bg.querySelector('[data-save-password]').onclick = async () => {
        const next = bg.querySelector('[data-next-password]').value, repeat = bg.querySelector('[data-repeat-password]').value, status = bg.querySelector('[data-password-status]');
        if (next !== repeat) { status.textContent = 'Пароли не совпадают.'; return; }
        const result = await window.changeMettoPassword?.(bg.querySelector('[data-current-password]').value, next);
        if (result !== true) { status.textContent = result || 'Смена пароля недоступна.'; return; }
        addHistory('Пароль изменён'); toast('Пароль обновлён на этом устройстве'); close();
      };
    };
    tools.querySelector('[data-metto-qr]').onclick = () => {
      const publicLink = `https://t.me/${encodeURIComponent(handle())}`;
      const qr = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(publicLink)}`;
      const bg = document.createElement('div'); bg.className = 'modal-bg'; bg.innerHTML = `<section class="modal" style="text-align:center"><div class="modal-top"><h2>Мой Telegram QR</h2><button class="close" aria-label="Закрыть">×</button></div><img class="metto-qr" src="${qr}" alt="QR-код Telegram"><p>${esc('@' + handle())}</p><small class="setting-help">Этот QR ведёт в Telegram. История и профиль Metto пока хранятся отдельно, на этом устройстве.</small><button class="setting-action" data-copy-profile-link>Скопировать Telegram-ссылку</button></section>`;
      document.body.append(bg); bg.querySelector('.close').onclick = () => bg.remove();
      bg.querySelector('[data-copy-profile-link]').onclick = async () => { try { await navigator.clipboard.writeText(publicLink); toast('Ссылка скопирована'); } catch { toast(publicLink); } };
      bg.onclick = e => { if (e.target === bg) bg.remove(); };
    };
    tools.querySelector('[data-metto-history]').onclick = () => {
      let items = []; try { items = JSON.parse(localStorage.getItem(historyKey()) || '[]'); } catch {}
      const bg = document.createElement('div'); bg.className = 'modal-bg';
      bg.innerHTML = `<section class="modal"><div class="modal-top"><h2>История профиля</h2><button class="close" aria-label="Закрыть">×</button></div>${items.length ? `<ul class="metto-activity-list">${items.map(item => `<li>${esc(item.text)}<small>${esc(item.at)}</small></li>`).join('')}</ul>` : '<p class="setting-help">История начнёт собираться на этом устройстве.</p>'}</section>`;
      document.body.append(bg); bg.querySelector('.close').onclick = () => bg.remove(); bg.onclick = e => { if (e.target === bg) bg.remove(); };
    };
  };

  // Battery saver disables decorative animation under 10% and pauses animated video previews.
  let batteryState = null;
  const applyBatterySaver = battery => {
    batteryState = battery;
    const low = battery.level <= 0.10;
    document.body.classList.toggle('metto-low-power', low);
    document.querySelectorAll('img[src$=".gif" i]').forEach(image => {
      if (low) {
        if (!image.dataset.mettoAnimatedSrc) image.dataset.mettoAnimatedSrc = image.src;
        if (!image.nextElementSibling?.classList.contains('metto-static-emoji')) {
          const fallback = document.createElement('span'); fallback.className = 'metto-static-emoji'; fallback.textContent = image.alt || '✨';
          image.after(fallback);
        }
        image.hidden = true;
      } else if (image.dataset.mettoAnimatedSrc) {
        image.hidden = false; image.src = image.dataset.mettoAnimatedSrc; delete image.dataset.mettoAnimatedSrc;
        if (image.nextElementSibling?.classList.contains('metto-static-emoji')) image.nextElementSibling.remove();
      }
    });
    document.querySelectorAll('video').forEach(video => {
      if (low) { video.dataset.mettoPaused = video.paused ? '0' : '1'; video.pause(); }
      else if (video.dataset.mettoPaused === '1') { video.play().catch(() => {}); delete video.dataset.mettoPaused; }
    });
  };
  if (navigator.getBattery) navigator.getBattery().then(battery => {
    applyBatterySaver(battery); battery.addEventListener('levelchange', () => applyBatterySaver(battery));
    new MutationObserver(() => { if (batteryState) applyBatterySaver(batteryState); }).observe(document.body, { childList:true, subtree:true });
  }).catch(() => {});

  // Make URLs in chat bubbles visibly clickable. target=_blank routes them to a new X Browser tab in the desktop shell.
  const linkifyMessages = () => {
    const box = $('#messages'), chat = chats.find(item => item.id === current);
    if (!box || !chat) return;
    const bubbles = [...box.querySelectorAll('.bubble')];
    bubbles.forEach((bubble, index) => {
      const message = chat.messages[index];
      if (!message) return;
      bubble.dataset.messageIndex = String(index);
      if (message.mine && !message.kind && !bubble.querySelector('[data-metto-edit]')) {
        const edit = document.createElement('button'); edit.className = 'metto-message-edit'; edit.type = 'button'; edit.dataset.mettoEdit = '1'; edit.textContent = '✦ Изменить';
        bubble.prepend(edit);
      }
      const walker = document.createTreeWalker(bubble, NodeFilter.SHOW_TEXT);
      const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
      for (const node of nodes) {
        if (!/https?:\/\//i.test(node.nodeValue)) continue;
        const parts = node.nodeValue.split(/(https?:\/\/[^\s<]+)/gi); if (parts.length < 2) continue;
        const frag = document.createDocumentFragment();
        parts.forEach(part => {
          if (/^https?:\/\//i.test(part)) { const a = document.createElement('a'); a.className = 'metto-message-link'; a.href = part.replace(/[),.!?]+$/, ''); a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = part; frag.append(a); }
          else frag.append(document.createTextNode(part));
        });
        node.replaceWith(frag);
      }
    });
  };
  const previousOpenChat = window.openChat;
  if (previousOpenChat) window.openChat = function (id) {
    previousOpenChat(id); requestAnimationFrame(linkifyMessages);
    const chat = chats.find(item => item.id === id);
    if (chat) addHistory(`Открыт чат: ${chat.title || person(chat.personId)?.name || 'сообщения'}`);
    if (chat?.id === 'mello-support' && !document.querySelector('[data-metto-support-link]')) {
      const link = document.createElement('a'); link.dataset.mettoSupportLink = '1'; link.className = 'metto-tool-link'; link.href = 'https://t.me/eliseizac'; link.target = '_blank'; link.rel = 'noopener'; link.textContent = 'Написать @eliseizac';
      $('#chatHead .head-actions')?.prepend(link);
    }
    if (chat?.id !== 'mello-support') document.querySelector('[data-metto-support-link]')?.remove();
  };

  const workerURL = 'https://wild-meadow-76d1.phujna56.workers.dev';
  const openEditor = (message, index) => {
    const chat = chats.find(item => item.id === current); if (!chat || !message?.mine) return;
    const bg = document.createElement('div'); bg.className = 'modal-bg';
    bg.innerHTML = `<section class="modal metto-edit-card"><div class="modal-top"><div><h2>ИИ-редактор</h2><small class="setting-help">Перевод, стилизация, исправление или сокращение</small></div><button class="close" aria-label="Закрыть">×</button></div><div class="metto-edit-actions" role="group" aria-label="Режим редактора"><button data-edit-action="Исправь орфографию и пунктуацию, сохрани язык и смысл">Исправление</button><button data-edit-action="Переведи текст на английский, сохрани смысл и тон">Перевод</button><button data-edit-action="Стилизуй текст, сохрани смысл и язык">Стилизация</button></div><div class="metto-edit-presets" aria-label="Быстрые стили">${[['✨','Создать','Сделай текст выразительным и оригинальным, но сохрани смысл'],['🤝','Дружелюбно','Перепиши дружелюбно и тепло, сохрани смысл'],['🧑‍💼','Formal','Перепиши официально и грамотно'],['💼','Corp','Перепиши в лаконичном деловом стиле'],['⚡','Short','Сократи до самого важного'],['📖','Понятно','Объясни простыми словами']].map(([icon,label,action])=>`<button type="button" data-edit-action="${action}"><span>${icon}</span>${label}</button>`).join('')}</div><label class="metto-edit-emoji"><input type="checkbox" data-edit-emoji> Добавить подходящие эмодзи</label><textarea aria-label="Текст сообщения">${esc(message.text || '')}</textarea><div class="metto-edit-actions"><button class="primary" data-edit-apply>Применить</button><button data-edit-close>Отмена</button></div><small class="setting-help" data-edit-status>Выбери действие для ИИ. Проверь результат перед применением.</small></section>`;
    document.body.append(bg);
    const textarea = bg.querySelector('textarea'), status = bg.querySelector('[data-edit-status]');
    const close = () => bg.remove(); bg.querySelector('.close').onclick = close; bg.querySelector('[data-edit-close]').onclick = close; bg.onclick = e => { if (e.target === bg) close(); };
    bg.querySelectorAll('[data-edit-action]').forEach(button => button.onclick = async () => {
      status.textContent = 'Исправляю…';
      try {
        const addEmoji = bg.querySelector('[data-edit-emoji]')?.checked;
        const response = await fetch(workerURL, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({messages:[{role:'system',content:`Ты редактор текста. ${button.dataset.editAction}.${addEmoji?' Добавь уместные эмодзи, не перегружай текст.':''} Верни только готовый вариант без пояснений.`},{role:'user',content:textarea.value}]}) });
        const data = await response.json(); if (!response.ok || typeof data.reply !== 'string') throw new Error(data.error || 'Worker недоступен');
        textarea.value = data.reply.trim(); status.textContent = 'Готово. Проверь результат и нажми «Применить».';
      } catch { status.textContent = 'Не удалось связаться с ИИ. Можно отредактировать текст вручную.'; }
    });
    bg.querySelector('[data-edit-apply]').onclick = () => {
      const next = textarea.value.trim(); if (!next) return;
      message.text = next; message.edited = true; save(); addHistory('Изменено своё сообщение'); close(); window.openChat(chat.id); toast('Сообщение изменено локально');
    };
  };
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-metto-edit]'); if (!button) return;
    const chat = chats.find(item => item.id === current), index = Number(button.closest('[data-message-index]')?.dataset.messageIndex);
    if (chat && Number.isInteger(index)) openEditor(chat.messages[index], index);
  });

  // Record profile updates and purchases in the local activity history.
  document.addEventListener('submit', event => { if (event.target?.id === 'profileForm') addHistory('Профиль сохранён'); }, true);
  document.addEventListener('click', event => {
    if (event.target.closest('[data-buy-banner]')) setTimeout(() => addHistory('Куплен баннер профиля'), 0);
  }, true);

  // The account handle shown on the QR reference may be either of these; keep the owner demo wallet consistent.
  if (window.melloHasInfiniteWallet) {
    const existing = window.melloHasInfiniteWallet;
    window.melloHasInfiniteWallet = () => existing() || ['eliseizac','eliseizac1'].includes(handle().toLocaleLowerCase('en'));
  }
})();
