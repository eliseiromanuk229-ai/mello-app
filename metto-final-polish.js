(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  const demoIds = new Set(['p_masha','p_ilya','p_liza','p_danya','p_sasha','p_katya','mello-maxim','mello-support']);

  const style = document.createElement('style');
  style.textContent = `
    .tabs{position:relative;isolation:isolate;overflow-x:auto;scrollbar-width:none;scroll-behavior:smooth}
    .tabs::-webkit-scrollbar{display:none}
    .tabs .tab{position:relative;z-index:1;white-space:nowrap;transition:color .22s ease,background .22s ease,transform .22s ease}
    .tabs .tab.active{background:transparent;box-shadow:none;color:#d9ffe7}
    .metto-tab-indicator{position:absolute;z-index:0;left:0;bottom:7px;height:2px;border-radius:3px;background:linear-gradient(90deg,#72e5a2,#caffdd);box-shadow:0 0 12px #78ecaa88;transition:transform .32s cubic-bezier(.2,.8,.2,1),width .32s cubic-bezier(.2,.8,.2,1);pointer-events:none}
    .metto-search-note{padding:15px 12px;color:#91a99a;font-size:11px;line-height:1.5;border-top:1px solid #ffffff12;margin:8px 6px 0}
    .metto-people-search{display:grid;grid-template-columns:1fr;gap:10px}
    .metto-search-modes{display:flex;gap:6px;padding:4px;border:1px solid #ffffff16;border-radius:13px;background:#ffffff08}
    .metto-search-modes button{flex:1;border:0;border-radius:9px;padding:8px 5px;background:transparent;color:#a9c0b2;font-size:11px;transition:background .2s,color .2s}
    .metto-search-modes button[aria-pressed="true"]{background:#9bffd022;color:#dcffe8;box-shadow:inset 0 1px #ffffff20}
    .metto-search-input{width:100%;height:43px;padding:0 12px;border:1px solid #ffffff20;border-radius:12px;background:#07130f;color:#effcf4;outline:none}
    .metto-search-input:focus{border-color:#8fffc080;box-shadow:0 0 0 3px #52d98e18}
    .metto-search-status{min-height:36px;margin:2px 0;color:#9bb0a2;font-size:11px;line-height:1.5}
    .metto-avatar-change{display:flex;align-items:center;gap:12px;margin:8px 0 16px}
    .metto-avatar-preview{width:72px;height:72px;border-radius:50%;overflow:hidden;display:grid;place-items:center;background:linear-gradient(140deg,#70e8ab,#18714b);box-shadow:0 0 0 3px #ffffff18,0 8px 24px #0005;font-size:24px}
    .metto-avatar-preview img{width:100%;height:100%;object-fit:cover}
    .metto-avatar-actions{display:flex;flex-wrap:wrap;gap:7px}
    .metto-avatar-actions button{border:1px solid #9fffc044;border-radius:10px;padding:8px 10px;background:#a5ffd911;color:#dfffea;font-size:11px;cursor:pointer}
    .metto-avatar-hint{display:block;margin-top:5px;color:#91a99a;font-size:10px}
    .metto-edit-presets{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin:8px 0}
    .metto-edit-presets button{display:grid;justify-items:center;gap:3px;min-height:52px;padding:7px 4px;border:1px solid #ffffff12;border-radius:12px;background:#ffffff08;color:#d8f4e1;font-size:10px;transition:transform .2s,background .2s,border-color .2s}
    .metto-edit-presets button:hover{transform:translateY(-2px);background:#9bffd018;border-color:#9bffd044}
    .metto-edit-presets button span{font-size:18px}
    .metto-edit-emoji{display:flex;align-items:center;gap:7px;margin:8px 2px 12px;color:#b8cdbd;font-size:11px}
    @media(prefers-reduced-motion:reduce){.tabs .tab,.metto-tab-indicator,.metto-search-modes button{transition:none}}
  `;
  document.head.append(style);

  function updateTabIndicator() {
    const tabs = $('.tabs'); if (!tabs) return;
    let indicator = $('.metto-tab-indicator', tabs);
    if (!indicator) { indicator = document.createElement('span'); indicator.className = 'metto-tab-indicator'; indicator.setAttribute('aria-hidden','true'); tabs.append(indicator); }
    const active = $('.tab.active', tabs); if (!active) { indicator.hidden = true; return; }
    indicator.hidden = false;
    indicator.style.width = `${Math.max(20, active.getBoundingClientRect().width - 16)}px`;
    indicator.style.transform = `translateX(${active.offsetLeft + (active.offsetWidth - parseFloat(indicator.style.width)) / 2}px)`;
  }
  document.addEventListener('click', event => {
    if (event.target.closest('.tabs .tab')) requestAnimationFrame(() => requestAnimationFrame(updateTabIndicator));
  });
  window.addEventListener('resize', updateTabIndicator, { passive:true });
  new MutationObserver(updateTabIndicator).observe($('.tabs') || document.body, { subtree:true, attributes:true, attributeFilter:['class'] });
  requestAnimationFrame(updateTabIndicator);

  // Replace the sample directory with search over actual, non-bot contacts already present locally.
  window.showPeople = function showPeopleMetto() {
    const host = $('#modalHost'); if (!host) return;
    host.innerHTML = `<div class="modal-bg" id="mettoPeopleBg"><section class="modal"><div class="modal-top"><h2>Найти людей</h2><button class="close" type="button" id="mettoPeopleClose" aria-label="Закрыть">×</button></div><p class="setting-help">Поиск по нику, номеру телефона или почте. Сейчас доступны только контакты, уже сохранённые в этом браузере.</p><div class="metto-people-search"><div class="metto-search-modes" role="group" aria-label="Тип поиска"><button type="button" aria-pressed="true" data-search-kind="username">Юзернейм</button><button type="button" aria-pressed="false" data-search-kind="phone">Телефон</button><button type="button" aria-pressed="false" data-search-kind="email">Почта</button></div><input class="metto-search-input" id="mettoPeopleQuery" autocomplete="off" placeholder="Например, @username" aria-label="Поиск контакта"><div class="metto-search-status" id="mettoPeopleStatus" aria-live="polite">Между разными устройствами поиск заработает после подключения общей серверной базы Метто.</div><div id="mettoPeopleResults"></div></div></section></div>`;
    const close = () => host.replaceChildren();
    $('#mettoPeopleClose').onclick = close;
    $('#mettoPeopleBg').onclick = event => { if (event.target.id === 'mettoPeopleBg') close(); };
    let kind = 'username';
    const query = $('#mettoPeopleQuery'), status = $('#mettoPeopleStatus'), results = $('#mettoPeopleResults');
    const update = () => {
      const value = query.value.trim().toLocaleLowerCase('ru');
      results.replaceChildren();
      if (!value) { status.textContent = 'Между разными устройствами поиск заработает после подключения общей серверной базы Метто.'; return; }
      const chatsForSearch = (chats || []).filter(chat => chat.type === 'personal' && !demoIds.has(chat.personId) && !chat.isBot && !String(chat.personId || '').startsWith('bot_'));
      const matches = chatsForSearch.filter(chat => {
        const p = person(chat.personId) || {};
        const field = kind === 'username' ? p.username : kind === 'phone' ? (p.phone || chat.phone || chat.contact?.phone) : (p.email || chat.email || chat.contact?.email);
        return String(field || '').toLocaleLowerCase('ru').includes(value);
      });
      if (!matches.length) {
        status.textContent = 'Совпадений среди сохранённых контактов нет. Поиск аккаунтов Метто на других устройствах пока не подключён.';
        return;
      }
      status.textContent = `Найдено локальных контактов: ${matches.length}`;
      results.innerHTML = matches.map(chat => { const p = person(chat.personId) || {}; return `<button type="button" class="person" data-local-chat="${esc(chat.id)}" style="width:100%;text-align:left;background:transparent;color:inherit"><span class="avatar" style="--a:${esc(p.a||'#71c8a0')};--b:${esc(p.b||'#286348')}">${esc(p.emoji||'🙂')}</span><span><b>${esc(p.name||chat.title||'Контакт')}</b><small>${esc(p.username||p.phone||p.email||'Сохранённый контакт')}</small></span><span class="setting-action">Открыть</span></button>`; }).join('');
      results.querySelectorAll('[data-local-chat]').forEach(button => button.onclick = () => { close(); openChat(button.dataset.localChat); });
    };
    host.querySelectorAll('[data-search-kind]').forEach(button => button.onclick = () => {
      kind = button.dataset.searchKind;
      host.querySelectorAll('[data-search-kind]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      query.placeholder = kind === 'username' ? 'Например, @username' : kind === 'phone' ? 'Например, +380…' : 'Например, name@example.com';
      query.inputMode = kind === 'phone' ? 'tel' : 'search'; query.type = kind === 'email' ? 'email' : 'search'; update(); query.focus();
    });
    query.oninput = update; query.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
    window.MettoAnimations?.refresh(host); query.focus();
  };

  // Keep sidebar filtering limited to existing chats; never append the old fake directory or auto-open a match.
  const searchBox = $('#filterInput');
  if (searchBox) {
    searchBox.oninput = event => {
      search = event.target.value.trim().toLocaleLowerCase('ru');
      renderChats();
      document.querySelectorAll('.person-search-result,.search-people-heading').forEach(node => node.remove());
      if (search && !$('#chatList [data-chat]')) {
        const note = document.createElement('div'); note.className = 'metto-search-note';
        note.textContent = 'Здесь фильтруются ваши чаты. Чтобы искать людей по нику, телефону или почте, нажмите ＋. Общий поиск пока требует серверной базы.';
        $('#chatList')?.append(note);
      }
    };
  }

  // Square crop on-device for a clean Telegram-style circular avatar; no image is uploaded anywhere.
  const previousShowProfile = window.showProfile;
  if (previousShowProfile) window.showProfile = function showProfileWithMettoAvatar() {
    previousShowProfile();
    const input = $('#avatarFile'), preview = $('#avatarPreview'), label = input?.parentElement;
    if (!input || !preview || !label || input.dataset.mettoCropBound) return;
    input.dataset.mettoCropBound = '1';
    const controls = document.createElement('div'); controls.className = 'metto-avatar-actions'; label.insertAdjacentElement('afterend', controls);
    const imageButton = document.createElement('button'); imageButton.type = 'button'; imageButton.textContent = 'Фото или камера';
    imageButton.onclick = () => input.click(); controls.append(imageButton);
    const hint = document.createElement('small'); hint.className = 'metto-avatar-hint'; hint.textContent = 'Выбери фото: можно сделать снимок камерой телефона. Квадратная обрезка выполняется на устройстве.'; controls.append(hint);
    input.onchange = async event => {
      const file = event.target.files?.[0]; if (!file) return;
      if (!file.type.startsWith('image/')) { toast('Выбери файл изображения'); input.value = ''; return; }
      if (file.size > 200 * 1024 * 1024) { toast('Фото профиля должно быть до 200 МБ'); input.value = ''; return; }
      try {
        const bitmap = await createImageBitmap(file), side = Math.min(bitmap.width, bitmap.height), sx = Math.floor((bitmap.width-side)/2), sy = Math.floor((bitmap.height-side)/2), canvas = document.createElement('canvas');
        canvas.width = canvas.height = Math.min(512, side);
        canvas.getContext('2d', { alpha:false }).drawImage(bitmap, sx, sy, side, side, 0, 0, canvas.width, canvas.height); bitmap.close();
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', .84)); if (!blob) throw new Error('encode');
        const data = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(blob); });
        preview.innerHTML = `<img src="${data}" alt="Предпросмотр аватара">`; preview.dataset.image = data;
        if (typeof profileVideoURL !== 'undefined' && profileVideoURL) { URL.revokeObjectURL(profileVideoURL); profileVideoURL = ''; }
        if (account) account.profileVideoName = '';
        toast('Аватар обрезан и готов к сохранению');
      } catch { toast('Не получилось обработать фото в этом браузере'); }
    };
    if (!controls.querySelector('[data-avatar-remove]')) {
      const remove = document.createElement('button'); remove.type = 'button'; remove.dataset.avatarRemove = '1'; remove.textContent = 'Убрать фото';
      remove.onclick = () => { preview.innerHTML = '🙂'; delete preview.dataset.image; if (account) { account.avatar = ''; account.profileVideoName = ''; } toast('Фото убрано. Нажми «Сохранить профиль».'); };
      controls.append(remove);
    }
  };
})();
