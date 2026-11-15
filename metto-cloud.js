(() => {
  'use strict';
  const API = 'https://metto-messenger-api.eliseiromanuk229.workers.dev';
  const AI_WORKER = 'https://wild-meadow-76d1.phujna56.workers.dev';
  const $ = selector => document.querySelector(selector);
  const state = { token: sessionStorage.getItem('metto.cloud.token') || '', user: null, chats: [], current: '', after: 0, register: false, timer: 0, view: 'home', banner: '', avatar: '', pendingUser: new URLSearchParams(location.search).get('u') || '' };
  const stickerPack = ['😀','🥰','😂','😭','😎','🤔','😴','😡','🥳','🤝','👍','👎','❤️','🔥','✨','🎉','🌸','🐱','🐸','🦊'];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
  const initials = value => [...String(value || 'M').trim()].slice(0, 1).join('').toUpperCase() || 'M';
  const bannerPath = id => /^banner-(0[1-9]|[1-3][0-9]|40)\.jpg$/.test(id || '') ? `./assets/banners/${id}` : /^video-(0[1-9]|1[0-9]|2[01])\.mp4$/.test(id || '') ? `./assets/banner-videos/${id}` : '';
  const isVideoBanner = id => /^video-(0[1-9]|1[0-9]|2[01])\.mp4$/.test(id || '');
  const toast = message => { const node = $('#toast'); node.textContent = message; node.classList.add('on'); clearTimeout(toast.timer); toast.timer = setTimeout(() => node.classList.remove('on'), 2600); };

  async function api(path, options = {}) {
    const response = await fetch(API + path, { ...options, headers: { ...(options.body ? { 'Content-Type':'application/json' } : {}), ...(state.token ? { Authorization:`Bearer ${state.token}` } : {}), ...(options.headers || {}) } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { if (response.status === 401 && state.token) clearSession(); throw new Error(data.error || `Ошибка сервера (${response.status})`); }
    return data;
  }
  const post = (path, body) => api(path, { method:'POST', body:JSON.stringify(body) });
  function closeModal() {
    const host = $('#modalHost'), overlay = host.querySelector('.overlay');
    if (!overlay) { host.replaceChildren(); return; }
    overlay.classList.add('closing');
    const finish = event => { if (!event || event.target === overlay) { if (host.contains(overlay)) host.replaceChildren(); } };
    const onEnd = event => { if (event.target === overlay) { overlay.removeEventListener('animationend', onEnd); finish(event); } };
    overlay.addEventListener('animationend', onEnd);
    setTimeout(() => finish(), 220);
  }
  function setAvatar(node, user) {
    node.replaceChildren();
    if (user?.avatar) { const image = document.createElement('img'); image.src = user.avatar; image.alt = ''; node.append(image); }
    else node.textContent = initials(user?.name);
  }
  function setBanner(node, id) { node.replaceChildren(); const path = bannerPath(id); if (!path) return; const media = document.createElement(isVideoBanner(id) ? 'video' : 'img'); media.src = path; if (media.tagName === 'VIDEO') { media.autoplay = true; media.loop = true; media.muted = true; media.playsInline = true; media.preload = 'metadata'; } else media.alt = 'Баннер профиля'; node.append(media); }
  function renderMessage(body, mine, createdAt, favoriteBody = body) {
    const bubble = document.createElement('article');
    const isSticker = body.startsWith('[[metto-sticker]]');
    bubble.className = `bubble${mine ? ' mine' : ''}${isSticker ? ' sticker-bubble' : ''}`;
    const content = document.createElement('div');
    if (isSticker) content.textContent = body.slice('[[metto-sticker]]'.length);
    else {
      const urlPattern = /https?:\/\/[^\s<>()]+/g; let cursor = 0, match;
      while ((match = urlPattern.exec(body))) {
        content.append(document.createTextNode(body.slice(cursor, match.index)));
        let safeUrl; try { safeUrl = new URL(match[0]); } catch { content.append(document.createTextNode(match[0])); cursor = urlPattern.lastIndex; continue; }
        if (!['http:', 'https:'].includes(safeUrl.protocol)) content.append(document.createTextNode(match[0]));
        else { const link = document.createElement('a'); link.href = safeUrl.href; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = match[0]; content.append(link); }
        cursor = urlPattern.lastIndex;
      }
      content.append(document.createTextNode(body.slice(cursor)));
    }
    bubble.append(content);
    const time = document.createElement('time'); time.textContent = new Intl.DateTimeFormat('ru', { hour:'2-digit', minute:'2-digit' }).format(new Date(createdAt)); bubble.append(time);
    const save = document.createElement('button'); save.className = 'message-save'; save.type = 'button'; save.title = 'Сохранить в Избранное'; save.setAttribute('aria-label', save.title); save.textContent = '☆';
    save.onclick = async () => { try { await post('/api/favorites', { body:favoriteBody }); toast('Сохранено в Избранное'); save.textContent = '★'; } catch (error) { toast(error.message); } };
    bubble.append(save); return bubble;
  }
  async function sendMessage(body) {
    const id = state.current; if (!body || !id) return;
    try { const data = await post(`/api/chats/${encodeURIComponent(id)}/messages`, { body });
      if (state.current === id) { $('#messages').append(renderMessage(data.message.body, true, data.message.createdAt)); $('#messages').scrollTop = $('#messages').scrollHeight; state.after = Math.max(state.after, Number(data.message.id) || 0); }
      loadChats(true);
    } catch (error) { toast(error.message); }
  }
  function applyGlass(value) { const amount = Math.max(0, Math.min(22, Number(value) || 0)); document.documentElement.style.setProperty('--glass-alpha', String(amount / 100)); localStorage.setItem('metto.glass.alpha', String(amount)); const label = $('#glassValue'); if (label) label.textContent = `${amount}%`; }
  function applyAccent(value) { const accents = { mint:['#8fffc0','#b7ffda','#63e6a0'], lavender:['#c7a8ff','#e0ccff','#a982ff'], blue:['#91d1ff','#c1e5ff','#70bbff'], rose:['#ff9dcc','#ffd0e5','#ff77ad'] }; const valid = Object.hasOwn(accents, value); const colors = valid ? accents[value] : accents.mint; const root = document.documentElement; root.style.setProperty('--green', colors[0]); root.style.setProperty('--accent-soft', colors[1]); root.style.setProperty('--accent-strong', colors[2]); localStorage.setItem('metto.accent', valid ? value : 'mint'); }
  function applyMotion(value) { const mode = ['calm','balanced','full'].includes(value) ? value : 'balanced'; document.documentElement.dataset.motion = mode; localStorage.setItem('metto.motion', mode); }
  function clearSession() { state.token = ''; state.user = null; sessionStorage.removeItem('metto.cloud.token'); clearInterval(state.timer); $('#app').classList.add('hidden'); $('#auth').classList.remove('hidden'); }
  async function setSession(data) {
    state.token = data.token; state.user = data.user; sessionStorage.setItem('metto.cloud.token', state.token); clearInterval(state.timer); $('#auth').classList.add('hidden'); $('#app').classList.remove('hidden'); $('#sidebar').classList.remove('mobile-hidden'); await loadChats(); state.timer = setInterval(() => { loadChats(true); if (state.current) loadMessages(true); }, 12000);
    if (state.pendingUser) { const pending = state.pendingUser; state.pendingUser = ''; showFind(pending); }
  }
  function setMode(register) {
    state.register = register; $('#authTitle').textContent = register ? 'Создать аккаунт' : 'Войти в Metto'; $('#authSub').textContent = register ? 'Новый аккаунт Metto — со своим юзернеймом.' : 'Твой аккаунт Metto, отдельно от других мессенджеров.'; $('#nameField').classList.toggle('hidden', !register); $('#usernameField').classList.toggle('hidden', !register); $('#name').required = register; $('#username').required = register; $('#password').autocomplete = register ? 'new-password' : 'current-password'; $('#submit').textContent = register ? 'Зарегистрироваться' : 'Войти'; $('#switch').textContent = register ? 'Уже есть аккаунт? Войти' : 'Создать аккаунт';
  }
  $('#switch').onclick = () => setMode(!state.register);
  $('#identityType').onchange = () => { const phone = $('#identityType').value === 'phone'; $('#identityLabel').textContent = phone ? 'Номер телефона' : 'Почта'; $('#identity').type = phone ? 'tel' : 'email'; $('#identity').inputMode = phone ? 'tel' : 'email'; $('#identity').placeholder = phone ? '+380 00 000 0000' : 'name@example.com'; };
  $('#authForm').onsubmit = async event => { event.preventDefault(); $('#submit').disabled = true; try { const payload = { identityType:$('#identityType').value, identity:$('#identity').value.trim(), password:$('#password').value }; const data = state.register ? await post('/api/auth/register', { ...payload, name:$('#name').value.trim(), username:$('#username').value.trim() }) : await post('/api/auth/login', payload); await setSession(data); toast(state.register ? 'Аккаунт создан' : 'Ты вошёл в Metto'); } catch (error) { toast(error.message); } finally { $('#submit').disabled = false; } };

  function renderChats(animate = false) {
    const host = $('#chatList');
    if (!state.chats.length) { host.innerHTML = '<p class="empty-list">Пока нет чатов.<br>Нажми ＋ и найди человека.</p>'; return; }
    host.innerHTML = state.chats.map(chat => `<div class="chat-row ${animate ? 'chat-row-enter' : ''} ${state.current === chat.id ? 'active' : ''}" data-chat="${esc(chat.id)}"><div class="avatar">${chat.peer.avatar ? `<img src="${esc(chat.peer.avatar)}" alt="">` : esc(initials(chat.peer.name))}</div><div class="row-copy"><b>${esc(chat.peer.name)}</b><small>${esc(chat.lastMessage?.body || chat.peer.username)}</small></div></div>`).join('');
    host.querySelectorAll('[data-chat]').forEach(row => row.onclick = () => openChat(row.dataset.chat));
  }
  async function loadChats(silent = false) { try { const data = await api('/api/chats'); state.chats = data.chats; if (state.current && !state.chats.some(chat => chat.id === state.current)) { state.current = ''; showWelcome(); } renderChats(!silent); } catch (error) { if (!silent) toast(error.message); } }
  function hideChat() { ['#chatHead', '#peerBanner', '#messages', '#composer', '#chatInfo', '#specialView'].forEach(selector => $(selector).classList.add('hidden')); }
  function showWelcome() { state.current = ''; state.view = 'home'; hideChat(); $('#welcome').classList.remove('hidden'); $('#pane').classList.remove('mobile-open'); $('#sidebar').classList.remove('mobile-hidden'); }
  function openChat(id) {
    const chat = state.chats.find(item => item.id === id); if (!chat) return; state.current = id; state.view = 'chat'; state.after = 0; $('#welcome').classList.add('hidden'); $('#specialView').classList.add('hidden'); $('#chatHead').classList.remove('hidden'); $('#messages').classList.remove('hidden'); $('#composer').classList.remove('hidden'); $('#chatInfo').classList.remove('hidden'); $('#peerBanner').classList.toggle('hidden', !bannerPath(chat.peer.banner)); setBanner($('#peerBanner'), chat.peer.banner); setAvatar($('#peerAvatar'), chat.peer); $('#peerName').textContent = chat.peer.name; $('#peerHandle').textContent = chat.peer.username; $('#peerQR').onclick = () => showQR(chat.peer); $('#pane').classList.add('mobile-open'); $('#sidebar').classList.add('mobile-hidden'); renderChats(); loadMessages();
  }
  async function loadMessages(silent = false) {
    const id = state.current; if (!id) return;
    try { const data = await api(`/api/chats/${encodeURIComponent(id)}/messages?after=${state.after}`); if (state.current !== id) return; const host = $('#messages');
      for (const message of data.messages) { state.after = Math.max(state.after, Number(message.id) || 0); host.append(renderMessage(message.body, message.senderId === state.user.id, message.createdAt)); }
      if (data.messages.length) host.scrollTop = host.scrollHeight;
    } catch (error) { if (!silent) toast(error.message); }
  }
  $('#composer').onsubmit = async event => { event.preventDefault(); const field = $('#message'), body = field.value.trim(); if (!body || !state.current) return; field.value = ''; await sendMessage(body); };

  function showStickers() {
    const host = $('#modalHost'); host.innerHTML = `<div class="overlay" id="overlay"><section class="modal glass"><div class="modal-head"><h2>Стикеры Metto</h2><button id="closeStickers" class="icon" aria-label="Закрыть">×</button></div><p class="info" style="text-align:left;padding:0 0 10px">Набор Metto. Выбранный стикер отправится в этот чат.</p><div class="sticker-grid">${stickerPack.map((emoji,i)=>`<button class="sticker-choice" type="button" data-sticker="${i}" aria-label="Стикер ${i+1}">${emoji}</button>`).join('')}</div></section></div>`;
    const close = () => closeModal(); $('#closeStickers').onclick = close; $('#overlay').onclick = event => { if (event.target.id === 'overlay') close(); };
    host.querySelectorAll('[data-sticker]').forEach(button => button.onclick = async () => { close(); await sendMessage(`[[metto-sticker]]${stickerPack[Number(button.dataset.sticker)]}`); });
  }
  function showGifLink() {
    const host = $('#modalHost'); host.innerHTML = `<div class="overlay" id="overlay"><section class="modal glass"><div class="modal-head"><h2>GIF в чате</h2><button id="closeGif" class="icon" aria-label="Закрыть">×</button></div><p class="info" style="text-align:left;padding:0 0 10px">Открой каталог, скопируй GIF-ссылку и отправь её. Встроенный поиск GIF подключается вместе с сервером медиа.</p><div class="modal-actions"><a class="secondary" href="https://tenor.com/" target="_blank" rel="noopener noreferrer">Открыть каталог GIF</a><a class="secondary" href="https://giphy.com/" target="_blank" rel="noopener noreferrer">Другой каталог</a></div><label class="field"><span>Ссылка на GIF</span><input id="gifUrl" type="url" placeholder="https://…" inputmode="url"></label><button id="sendGif" class="primary">Отправить ссылку</button></section></div>`;
    const close = () => closeModal(); $('#closeGif').onclick = close; $('#overlay').onclick = event => { if (event.target.id === 'overlay') close(); }; $('#sendGif').onclick = async () => { try { const url = new URL($('#gifUrl').value.trim()); if (!['http:','https:'].includes(url.protocol)) throw new Error(); close(); await sendMessage(url.href); } catch { toast('Вставь корректную ссылку GIF с https://'); } };
  }
  $('#stickerButton').onclick = showStickers; $('#gifButton').onclick = showGifLink;

  function showSpecial(title, content, back = showWelcome) { state.current = ''; state.view = title.toLowerCase(); $('#welcome').classList.add('hidden'); $('#chatHead').classList.add('hidden'); $('#peerBanner').classList.add('hidden'); $('#messages').classList.add('hidden'); $('#composer').classList.add('hidden'); $('#chatInfo').classList.add('hidden'); $('#specialView').classList.remove('hidden'); $('#specialTitle').textContent = title; $('#specialContent').replaceChildren(); if (typeof content === 'function') content($('#specialContent')); $('#specialBack').onclick = back; $('#favoriteAdd').classList.toggle('hidden', title !== 'Избранное'); $('#pane').classList.add('mobile-open'); $('#sidebar').classList.add('mobile-hidden'); }
  async function showFavorites() {
    showSpecial('Избранное', host => { host.innerHTML = '<p class="empty-list">Загружаем сохранённое…</p>'; });
    try { const data = await api('/api/favorites'); const host = $('#specialContent'); if (!data.items.length) { host.innerHTML = '<p class="empty-list">Здесь будут сохранённые сообщения и личные заметки.</p>'; return; } host.innerHTML = data.items.map(item => `<article class="saved-item" data-saved="${esc(item.id)}">${esc(item.body)}<small>${new Intl.DateTimeFormat('ru', { dateStyle:'medium', timeStyle:'short' }).format(new Date(item.createdAt))}</small><button class="icon" data-delete="${esc(item.id)}" title="Удалить">×</button></article>`).join(''); host.querySelectorAll('[data-delete]').forEach(button => button.onclick = async () => { try { await api(`/api/favorites/${button.dataset.delete}`, { method:'DELETE' }); button.closest('[data-saved]').remove(); if (!host.querySelector('[data-saved]')) host.innerHTML = '<p class="empty-list">Избранное пока пусто.</p>'; } catch (error) { toast(error.message); } }); } catch (error) { $('#specialContent').textContent = error.message; }
  }
  function addFavoriteNote() { const host = $('#modalHost'); host.innerHTML = `<div class="overlay" id="overlay"><section class="modal glass"><div class="modal-head"><h2>Новая заметка</h2><button id="closeNote" class="icon" aria-label="Закрыть">×</button></div><form id="noteForm"><textarea id="noteText" maxlength="4000" placeholder="Сохрани сюда текст, ссылку или напоминание…" required style="width:100%;min-height:110px;padding:12px;border:1px solid var(--line);border-radius:14px;background:#07110c"></textarea><button class="primary">Сохранить</button></form></section></div>`; const close = () => closeModal(); $('#closeNote').onclick = close; $('#overlay').onclick = event => { if (event.target.id === 'overlay') close(); }; $('#noteForm').onsubmit = async event => { event.preventDefault(); try { await post('/api/favorites', { body:$('#noteText').value }); close(); showFavorites(); toast('Добавлено в Избранное'); } catch (error) { toast(error.message); } }; }

  function showFind(query = '') {
    const host = $('#modalHost'); host.innerHTML = `<div class="overlay" id="overlay"><section class="modal glass"><div class="modal-head"><h2>Найти человека</h2><button id="closeFind" class="icon" aria-label="Закрыть">×</button></div><input id="findQuery" class="searchbox" placeholder="Юзернейм, например @eliseizac" autocomplete="off"><p class="info">Ищем людей только среди аккаунтов Metto.</p><div id="findResults"></div></section></div>`;
    const close = () => closeModal(); $('#closeFind').onclick = close; $('#overlay').onclick = event => { if (event.target.id === 'overlay') close(); }; let timer; $('#findQuery').oninput = () => { clearTimeout(timer); timer = setTimeout(searchUsers, 240); }; $('#findQuery').value = query; $('#findQuery').focus(); if (query) searchUsers();
  }
  async function searchUsers() {
    const query = $('#findQuery')?.value.trim(); if (!query || query.replace(/^@/, '').length < 3) { $('#findResults').innerHTML = ''; return; } $('#findResults').textContent = 'Ищем…';
    try { const data = await api('/api/users/search?q=' + encodeURIComponent(query)); const host = $('#findResults'); if (!data.users.length) { host.textContent = 'Не нашли. Проверь юзернейм Metto.'; return; }
      host.innerHTML = data.users.map(user => `<div class="user-result"><div class="avatar">${user.avatar ? `<img src="${esc(user.avatar)}" alt="">` : esc(initials(user.name))}</div><div class="row-copy"><b>${esc(user.name)}</b><small>${esc(user.username)}</small></div><button data-person="${esc(user.id)}">Написать</button></div>`).join('');
      host.querySelectorAll('[data-person]').forEach(button => button.onclick = async () => { try { const chat = await post('/api/chats', { userId:button.dataset.person }); closeModal(); await loadChats(true); openChat(chat.id); } catch (error) { toast(error.message); } });
    } catch (error) { $('#findResults').textContent = error.message; }
  }

  function showProfile() {
    const user = state.user || {}; state.banner = user.banner || ''; state.avatar = user.avatar || ''; const host = $('#modalHost');
    const cards = Array.from({ length:40 }, (_, index) => { const id = `banner-${String(index + 1).padStart(2, '0')}.jpg`; return `<button type="button" class="banner-choice ${state.banner === id ? 'selected' : ''}" data-banner="${id}" aria-label="Фото-баннер ${index + 1}"><img loading="lazy" src="./assets/banners/${id}" alt=""></button>`; }).join('') + Array.from({ length:21 }, (_, index) => { const id = `video-${String(index + 1).padStart(2, '0')}.mp4`; return `<button type="button" class="banner-choice banner-video-choice ${state.banner === id ? 'selected' : ''}" data-banner="${id}" aria-label="Анимированный баннер ${index + 1}"><span>▶</span><small>АНИМАЦИЯ ${String(index + 1).padStart(2, '0')}</small></button>`; }).join('');
    host.innerHTML = `<div class="overlay" id="overlay"><section class="modal glass"><div class="modal-head"><h2>Мой профиль</h2><button id="closeProfile" class="icon" aria-label="Закрыть">×</button></div><div class="profile-top"><img id="avatarPreview" class="profile-avatar" alt="Аватар"><div><label class="secondary" style="display:inline-block">Сменить аватар<input id="avatarFile" type="file" accept="image/png,image/jpeg,image/webp" hidden></label><p class="info" style="text-align:left;padding:5px 0">${esc(user.username || '')} · JPG, PNG или WebP</p></div></div><label class="field"><span>Имя</span><input id="profileName" maxlength="60" value="${esc(user.name || '')}"></label><b>Баннер профиля · 40 фото и 21 анимация</b><div id="bannerPreview" class="profile-banner-preview"></div><div id="bannerGrid" class="banner-grid">${cards}</div><div class="modal-actions"><button id="profileQR" class="secondary">▦ Мой QR-код</button><button id="saveProfile" class="primary" style="margin-top:0">Сохранить</button></div></section></div>`;
    const close = () => closeModal(); $('#closeProfile').onclick = close; $('#overlay').onclick = event => { if (event.target.id === 'overlay') close(); }; updateProfilePreviews();
    $('#bannerGrid').querySelectorAll('[data-banner]').forEach(button => button.onclick = () => { state.banner = button.dataset.banner; $('#bannerGrid').querySelectorAll('[data-banner]').forEach(item => item.classList.toggle('selected', item.dataset.banner === state.banner)); updateProfilePreviews(); });
    $('#avatarFile').onchange = async event => { const file = event.target.files?.[0]; if (!file) return; if (!file.type.startsWith('image/') || file.size > 8 * 1024 * 1024) { toast('Выбери изображение до 8 МБ.'); return; } try { const bitmap = await createImageBitmap(file); const side = Math.min(bitmap.width, bitmap.height), canvas = document.createElement('canvas'); canvas.width = canvas.height = 320; canvas.getContext('2d').drawImage(bitmap, (bitmap.width-side)/2, (bitmap.height-side)/2, side, side, 0, 0, 320, 320); state.avatar = canvas.toDataURL('image/jpeg', .72); $('#avatarPreview').src = state.avatar; } catch { toast('Не удалось обработать изображение.'); } };
    $('#saveProfile').onclick = async () => { const button = $('#saveProfile'); button.disabled = true; try { const data = await post('/api/me', { name:$('#profileName').value.trim(), avatar:state.avatar, banner:state.banner }); state.user = data.user; await loadChats(true); close(); toast('Профиль обновлён'); } catch (error) { toast(error.message); } finally { button.disabled = false; } };
    $('#profileQR').onclick = () => showQR(state.user);
  }
  function updateProfilePreviews() { const avatar = $('#avatarPreview'); if (avatar) avatar.src = state.avatar || `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" rx="50" fill="#286b4c"/><text x="50" y="62" text-anchor="middle" font-size="46" fill="white">${esc(initials(state.user?.name))}</text></svg>`)}`; const banner = $('#bannerPreview'); if (banner) setBanner(banner, state.banner); }
  function showQR(user) {
    const handle = String(user?.username || '').replace(/^@/, '');
    if (!handle) { toast('Сначала создай профиль Metto.'); return; }
    const link = new URL('./metto-cloud.html', location.href); link.searchParams.set('u', `@${handle}`);
    const image = `https://api.qrserver.com/v1/create-qr-code/?size=420x420&format=png&color=10261a&bgcolor=f4fff7&margin=2&data=${encodeURIComponent(link.href)}`;
    const host = $('#modalHost');
    host.innerHTML = `<div class="overlay" id="overlay"><section class="modal glass"><div class="modal-head"><h2>Твой QR-профиль</h2><button id="closeQR" class="icon" aria-label="Закрыть">×</button></div><div class="qr-card"><div class="qr-brand"><span class="qr-brand-mark">M</span> METTO · ПРОФИЛЬ</div><div class="qr-code-frame"><img src="${esc(image)}" alt="QR-код профиля Metto" referrerpolicy="no-referrer"></div><div class="qr-handle">@${esc(handle)}</div><small>Наведи камеру, чтобы открыть профиль и написать</small><div class="qr-scan-line" aria-hidden="true"></div></div><div class="qr-actions"><button id="copyProfileLink" class="secondary">Копировать ссылку</button><button id="shareProfileLink" class="secondary">Поделиться</button></div></section></div>`;
    $('#closeQR').onclick = closeModal; $('#overlay').onclick = event => { if (event.target.id === 'overlay') closeModal(); };
    const qrImage = $('.qr-code-frame img'); qrImage.onload = () => qrImage.classList.add('qr-ready'); qrImage.onerror = () => { qrImage.classList.add('qr-failed'); toast('Не удалось загрузить QR-код. Проверь интернет.'); };
    $('#copyProfileLink').onclick = async () => { try { await navigator.clipboard.writeText(link.href); toast('Ссылка скопирована'); } catch { toast(link.href); } };
    $('#shareProfileLink').onclick = async () => { try { if (navigator.share) await navigator.share({ title:`Metto · @${handle}`, text:'Найди меня в Metto', url:link.href }); else { await navigator.clipboard.writeText(link.href); toast('Ссылка скопирована'); } } catch (error) { if (error.name !== 'AbortError') toast('Не удалось поделиться ссылкой'); } };
  }

  function showSettings() {
    const host = $('#modalHost'), current = Number(localStorage.getItem('metto.glass.alpha') ?? 8), accent = localStorage.getItem('metto.accent') || 'mint', motion = localStorage.getItem('metto.motion') || 'balanced';
    host.innerHTML = `<div class="overlay" id="overlay"><section class="modal glass settings-modal"><div class="modal-head"><div><small class="settings-kicker">METTO · ПАРАМЕТРЫ</small><h2>Настройки</h2></div><button id="closeSettings" class="icon" aria-label="Закрыть">×</button></div><nav class="settings-tabs" aria-label="Разделы настроек"><button class="settings-tab active" data-tab="appearance">Внешний вид</button><button class="settings-tab" data-tab="motion">Анимации</button><button class="settings-tab" data-tab="about">Аккаунт</button></nav><div id="settingsPanels"><section class="settings-panel" data-panel="appearance"><div class="settings-card"><b>Цвет Metto</b><small>Выбери акцент интерфейса</small><div class="accent-options"><button class="accent-choice mint" data-accent="mint" aria-label="Мятный"></button><button class="accent-choice lavender" data-accent="lavender" aria-label="Лавандовый"></button><button class="accent-choice blue" data-accent="blue" aria-label="Голубой"></button><button class="accent-choice rose" data-accent="rose" aria-label="Розовый"></button></div></div><div class="settings-card"><label class="field"><span>Эффект стекла <b id="glassValue">${current}%</b></span><div class="range-row"><span>Матовый</span><input id="glassRange" type="range" min="0" max="22" step="1" value="${current}"><span>Стекло</span></div></label><small>Изменение сохраняется на этом устройстве.</small></div><button id="settingsProfile" class="secondary settings-wide">Открыть профиль и QR-код</button></section><section class="settings-panel hidden" data-panel="motion"><div class="settings-card"><b>Движение интерфейса</b><small>Выбери скорость и выразительность переходов</small><div class="motion-options"><button class="motion-choice" data-motion-choice="calm">Спокойно<span>Короткие переходы</span></button><button class="motion-choice" data-motion-choice="balanced">Мягко<span>Рекомендуемый режим</span></button><button class="motion-choice" data-motion-choice="full">Выразительно<span>Больше движения</span></button></div></div><div class="motion-preview"><span class="preview-orb"></span><b>Пример анимации Metto</b><small>Так будут появляться окна и панели</small></div><small class="settings-note">Системная настройка «Уменьшить движение» всегда имеет приоритет.</small></section><section class="settings-panel hidden" data-panel="about"><div class="settings-card account-card"><div class="settings-account-avatar">${esc(initials(state.user?.name))}</div><div><b>${esc(state.user?.name || 'Аккаунт Metto')}</b><small>${esc(state.user?.username || '')}</small></div></div><div class="settings-card"><b>Вход и приватность</b><small>Настройки оформления хранятся в этом браузере. Сообщения доступны серверу Metto и пока не защищены сквозным шифрованием.</small></div><button id="settingsProfileAbout" class="secondary settings-wide">Изменить профиль</button></section></div></section></div>`;
    const close = () => closeModal(); $('#closeSettings').onclick = close; $('#overlay').onclick = event => { if (event.target.id === 'overlay') close(); };
    const switchTab = name => { host.querySelectorAll('[data-tab]').forEach(button => button.classList.toggle('active', button.dataset.tab === name)); host.querySelectorAll('[data-panel]').forEach(panel => { const shown = panel.dataset.panel === name; panel.classList.toggle('hidden', !shown); if (shown) { panel.classList.remove('panel-enter'); requestAnimationFrame(() => panel.classList.add('panel-enter')); } }); };
    host.querySelectorAll('[data-tab]').forEach(button => button.onclick = () => switchTab(button.dataset.tab));
    host.querySelectorAll('[data-accent]').forEach(button => { button.classList.toggle('active', button.dataset.accent === accent); button.onclick = () => { applyAccent(button.dataset.accent); host.querySelectorAll('[data-accent]').forEach(item => item.classList.toggle('active', item === button)); toast('Цвет Metto изменён'); }; });
    host.querySelectorAll('[data-motion-choice]').forEach(button => { button.classList.toggle('active', button.dataset.motionChoice === motion); button.onclick = () => { applyMotion(button.dataset.motionChoice); host.querySelectorAll('[data-motion-choice]').forEach(item => item.classList.toggle('active', item === button)); toast('Анимации настроены'); }; });
    $('#glassRange').oninput = event => applyGlass(event.target.value); $('#settingsProfile').onclick = showProfile; $('#settingsProfileAbout').onclick = showProfile;
  }
  function showAI() {
    const host = $('#modalHost');
    host.innerHTML = `<div class="overlay" id="overlay"><section class="modal glass"><div class="modal-head"><h2>Metto AI</h2><button id="closeAI" class="icon" aria-label="Закрыть">×</button></div><p class="info" style="text-align:left;padding:0 0 10px">Помощник, переводчик и редактор текста. Контекст диалога хранится только пока это окно открыто.</p><form id="aiForm" class="assistant-form"><label class="field"><span>Что сделать?</span><select id="aiMode" class="searchbox"><option value="help">Ответить на вопрос</option><option value="improve">Исправить и улучшить текст</option><option value="rewrite">Переписать проще и понятнее</option><option value="summarize">Кратко пересказать</option><option value="translate">Перевести на английский</option><option value="reply">Предложить ответ собеседнику</option></select></label><textarea id="aiQuestion" maxlength="4000" placeholder="Напиши вопрос или вставь текст" required></textarea><label class="ai-deep"><input id="aiDeep" type="checkbox"><span>Глубокий режим</span><small>дольше, но подробнее</small></label><button class="primary" id="aiSend">Спросить ИИ</button></form><div id="aiAnswer" class="assistant-answer hidden" aria-live="polite"></div><div class="ai-actions"><button id="aiInsert" class="secondary hidden">Вставить в чат</button><button id="aiClear" class="secondary hidden">Очистить диалог</button></div><small class="info">Не отправляй пароли, коды подтверждения и другие секреты.</small></section></div>`;
    const history = [];
    const close = () => closeModal(); $('#closeAI').onclick = close; $('#overlay').onclick = event => { if (event.target.id === 'overlay') close(); };
    $('#aiForm').onsubmit = async event => {
      event.preventDefault(); const button = $('#aiSend'), question = $('#aiQuestion').value.trim(), mode = $('#aiMode').value; if (!question) return;
      const instructions = { help:'Ответь на вопрос ясно и полезно.', improve:'Исправь ошибки и улучши стиль, сохранив смысл и язык оригинала. Выведи только готовый текст.', rewrite:'Перепиши проще и естественнее, сохранив смысл и язык оригинала. Выведи только готовый текст.', summarize:'Сделай короткое резюме на языке оригинала, сохрани важные факты.', translate:'Переведи текст на английский. Выведи только перевод.', reply:'Предложи дружелюбный и уместный ответ на сообщение. Не придумывай факты о пользователе.' };
      button.disabled = true; button.textContent = 'Думаю…'; const answer = $('#aiAnswer'); answer.classList.remove('hidden'); answer.textContent = 'Готовлю ответ…'; $('#aiInsert').classList.add('hidden');
      const prompt = `Ты Metto AI — помощник и редактор текста. ${instructions[mode]} Не утверждай, что видишь переписку или данные аккаунта. Пользователь явно передал тебе этот текст: «${question}»`;
      history.push({ role:'user', content:prompt });
      try { const response = await fetch(AI_WORKER, { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ messages:history.slice(-20), deepThinking:$('#aiDeep').checked }) }); const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.error || `Ошибка ИИ (${response.status})`); const reply = data.reply || 'Пустой ответ.'; history.push({ role:'assistant', content:reply }); answer.textContent = reply; $('#aiClear').classList.remove('hidden'); if (state.current) $('#aiInsert').classList.remove('hidden'); $('#aiQuestion').value = ''; }
      catch (error) { history.pop(); answer.textContent = `Не удалось получить ответ: ${error.message}`; }
      finally { button.disabled = false; button.textContent = 'Спросить ИИ'; }
    };
    $('#aiInsert').onclick = () => { const field = $('#message'); if (!state.current || !field) return; field.value = $('#aiAnswer').textContent; closeModal(); field.focus(); toast('Текст добавлен в поле сообщения'); };
    $('#aiClear').onclick = () => { history.length = 0; $('#aiAnswer').classList.add('hidden'); $('#aiClear').classList.add('hidden'); $('#aiInsert').classList.add('hidden'); toast('Контекст диалога очищен'); };
  }

  function showPlans() {
    const host = $('#modalHost');
    host.innerHTML = `<div class="overlay" id="overlay"><section class="modal glass"><div class="modal-head"><h2>Metto Plus и Business</h2><button id="closePlans" class="icon" aria-label="Закрыть">×</button></div><p class="info" style="text-align:left;padding:0 0 10px">Предварительный просмотр будущих планов. Оплата и подписки пока не подключены — деньги с карты не списываются.</p><div class="saved-item" style="padding:16px;margin:10px 0"><b>Metto Plus</b><p class="info" style="text-align:left;padding:8px 0 0">Идеи для личного аккаунта: больше вариантов оформления, анимированные баннеры и расширенные настройки профиля.</p><small>Статус: планируется</small></div><div class="saved-item" style="padding:16px;margin:10px 0"><b>Metto Business</b><p class="info" style="text-align:left;padding:8px 0 0">Идеи для команд и небольших компаний: профиль организации, несколько администраторов и инструменты поддержки клиентов.</p><small>Статус: планируется</small></div><div class="saved-item" style="padding:14px;margin-top:14px"><b>Звёзды, монеты и реклама</b><p class="info" style="text-align:left;padding:8px 0 0">Рекламные награды появятся только после подключения официальной рекламной сети и её проверки. Сейчас баланс и награды не выдаются.</p></div></section></div>`;
    $('#closePlans').onclick = closeModal;
    $('#overlay').onclick = event => { if (event.target.id === 'overlay') closeModal(); };
  }

  function showFind(query = '') {
    const host = $('#modalHost'); host.innerHTML = `<div class="overlay" id="overlay"><section class="modal glass"><div class="modal-head"><h2>Найти человека</h2><button id="closeFind" class="icon" aria-label="Закрыть">×</button></div><input id="findQuery" class="searchbox" placeholder="Юзернейм, например @eliseizac" autocomplete="off"><p class="info">Ищем людей только среди аккаунтов Metto.</p><div id="findResults"></div></section></div>`;
    const close = () => closeModal(); $('#closeFind').onclick = close; $('#overlay').onclick = event => { if (event.target.id === 'overlay') close(); }; let timer; $('#findQuery').oninput = () => { clearTimeout(timer); timer = setTimeout(searchUsers, 240); }; $('#findQuery').value = query; $('#findQuery').focus(); if (query) searchUsers();
  }
  async function searchUsers() {
    const query = $('#findQuery')?.value.trim(); if (!query || query.replace(/^@/, '').length < 3) { $('#findResults').innerHTML = ''; return; } $('#findResults').textContent = 'Ищем…';
    try { const data = await api('/api/users/search?q=' + encodeURIComponent(query)); const host = $('#findResults'); if (!data.users.length) { host.textContent = 'Не нашли. Проверь юзернейм Metto.'; return; }
      host.innerHTML = data.users.map(user => `<div class="user-result"><div class="avatar">${user.avatar ? `<img src="${esc(user.avatar)}" alt="">` : esc(initials(user.name))}</div><div class="row-copy"><b>${esc(user.name)}</b><small>${esc(user.username)}</small></div><button data-person="${esc(user.id)}">Написать</button></div>`).join('');
      host.querySelectorAll('[data-person]').forEach(button => button.onclick = async () => { try { const chat = await post('/api/chats', { userId:button.dataset.person }); closeModal(); await loadChats(true); openChat(chat.id); } catch (error) { toast(error.message); } });
    } catch (error) { $('#findResults').textContent = error.message; }
  }

  $('#newChat').onclick = $('#railFind').onclick = $('#welcomeFind').onclick = () => showFind();
  $('#railFavorites').onclick = showFavorites; $('#railAI').onclick = showAI; $('#railPlans').onclick = showPlans; $('#railProfile').onclick = showProfile; $('#railQR').onclick = () => showQR(state.user); $('#railSettings').onclick = showSettings;
  $('#back').onclick = showWelcome; $('#refresh').onclick = () => loadMessages(); $('#specialBack').onclick = showWelcome; $('#favoriteAdd').onclick = addFavoriteNote;
  $('#logout').onclick = async () => { try { await post('/api/auth/logout', {}); } catch {} clearSession(); setMode(false); };
  async function health() {
    try { await api('/api/health'); $('#apiState').textContent = 'Сервер Metto подключён'; $('#apiState').style.color = 'var(--green)'; applyGlass(localStorage.getItem('metto.glass.alpha') ?? 8); if (state.token) { const data = await api('/api/me'); state.user = data.user; $('#auth').classList.add('hidden'); $('#app').classList.remove('hidden'); await loadChats(); state.timer = setInterval(() => { loadChats(true); if (state.current) loadMessages(true); }, 12000); if (state.pendingUser) { const pending = state.pendingUser; state.pendingUser = ''; showFind(pending); } } }
    catch (error) { $('#apiState').textContent = 'Не удалось подключиться к серверу Metto'; $('#apiState').style.color = '#ffc58f'; if (state.token) { sessionStorage.removeItem('metto.cloud.token'); state.token = ''; } }
  }
  setMode(false); applyGlass(localStorage.getItem('metto.glass.alpha') ?? 8); applyAccent(localStorage.getItem('metto.accent') || 'mint'); applyMotion(localStorage.getItem('metto.motion') || 'balanced'); health();
})();
