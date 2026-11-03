(() => {
  const imageBanners = [
    ['banner-01.jpg', 'Тории'], ['banner-02.jpg', 'Горы'], ['banner-03.jpg', 'Сад'],
    ['banner-04.jpg', 'Охайо'], ['banner-05.jpg', 'Аниме'], ['banner-06.jpg', 'Монохром'],
    ['banner-07.jpg', 'Манга'], ['banner-08.jpg', 'Сакура'], ['banner-09.jpg', 'Ночной сад'],
    ['banner-10.jpg', 'Кот'], ['banner-11.jpg', 'Взгляд'], ['banner-12.jpg', 'Глаза'],
    ['banner-13.jpg', 'Питомцы'], ['banner-14.jpg', 'Флаг'], ['banner-15.jpg', 'Собаки'],
    ['banner-16.jpg', 'Welcome'], ['banner-17.jpg', 'Котёнок'],
    ['liquid-18', 'Изумрудная волна'], ['liquid-19', 'Северное сияние'], ['liquid-20', 'Стеклянный лес']
  ].map(([file, title], index) => ({ file, title, url: file.endsWith('.jpg') ? `./assets/banners/${file}` : '', gradient: [`radial-gradient(ellipse at 24% 30%,#78f1c788,transparent 42%),linear-gradient(135deg,#071b14,#1a6545,#18213a)`, `radial-gradient(ellipse at 70% 22%,#9ccaff99,transparent 42%),linear-gradient(135deg,#071923,#18495b,#252846)`, `radial-gradient(ellipse at 30% 80%,#76e6ac88,transparent 45%),linear-gradient(135deg,#102d22,#334832,#0f1821)`][index-17] || '' }));
  const videoBanners = Array.from({ length: 21 }, (_, index) => ({ file: `video-${String(index + 1).padStart(2, '0')}.mp4`, title: `Анимация ${index + 1}`, video: true, url: `./assets/banner-videos/video-${String(index + 1).padStart(2, '0')}.mp4` }));
  const banners = [...imageBanners, ...videoBanners];
  const randomFaces = ['😊', '😎', '🥰', '🤩', '😄', '🙂', '😺', '😉', '😁', '😇', '😋', '🤗'];
  const key = () => `mello.profile.banner:${account?.id || account?.email || account?.phone || 'guest'}`;
  const savedBanner = () => { try { return localStorage.getItem(key()) || ''; } catch { return ''; } };
  const getBanner = (selection) => banners.find(item => item.file === selection);
  const avatarMarkup = (person) => person?.avatar
    ? `<img src="${person.avatar}" alt="">`
    : `<span>${person?.emoji || (person?.name || 'M').trim().slice(0, 1).toUpperCase()}</span>`;
  const randomCover = () => {
    const face = randomFaces[Math.floor(Math.random() * randomFaces.length)];
    return `<div class="mello-profile-cover mello-random-cover"><span class="mello-cover-face">${face}</span><small>Смайлик профиля</small></div>`;
  };
  const coverMarkup = (selection) => {
    const banner = getBanner(selection);
    return banner
      ? `<div class="mello-profile-cover" style="${banner.video ? '' : `--profile-cover:${banner.url ? `url('${banner.url}')` : banner.gradient}`}" ${banner.video ? `<video class="mello-banner-video-cover" src="${banner.url}" muted autoplay loop playsinline preload="metadata" aria-hidden="true"></video>` : ''}><span>${banner.title}</span></div>`
      : randomCover();
  };

  const style = document.createElement('style');
  style.textContent = `
    .mello-profile-cover{height:148px;position:relative;overflow:hidden;border-radius:22px 22px 12px 12px;background-image:linear-gradient(0deg,#07130edb,transparent 65%),var(--profile-cover);background-position:center;background-size:cover;display:flex;align-items:flex-end;padding:14px;box-sizing:border-box;color:#effff4;font-size:12px;font-weight:700;letter-spacing:.03em}.mello-profile-cover>span{position:relative;z-index:1}.mello-banner-video-cover{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
    .mello-random-cover{justify-content:center;align-items:center;flex-direction:column;gap:4px;background:radial-gradient(circle at 52% 44%,#3ba57888,transparent 37%),linear-gradient(135deg,#163e2d,#172a26 55%,#272b38)}
    .mello-cover-face{font-size:64px;line-height:1;filter:drop-shadow(0 7px 16px #0008);animation:melloFaceFloat 3.2s ease-in-out infinite}
    .mello-random-cover small{font-size:10px;color:#d4f3dfaa}
    @keyframes melloFaceFloat{50%{transform:translateY(-5px) rotate(3deg)}}
    .mello-banner-box{margin:10px 0 14px;padding:12px;border:1px solid #ffffff19;border-radius:18px;background:#ffffff08}
    .mello-banner-heading{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:9px;font-size:12px;font-weight:700}
    .mello-banner-heading small{font-size:10px;font-weight:400;color:#a9c6b5}
    .mello-banner-options{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}
    .mello-banner-choice{position:relative;min-width:0;aspect-ratio:1.45;border:1px solid #ffffff20;border-radius:10px;overflow:hidden;padding:0;background:#12231b;cursor:pointer;transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease}
    .mello-banner-choice img,.mello-banner-choice video{width:100%;height:100%;object-fit:cover;display:block}
    .mello-banner-choice:hover{transform:scale(1.04)}
    .mello-banner-choice.selected{border:2px solid #79e5a9;box-shadow:0 0 0 2px #65d89738}
    .mello-banner-choice[data-banner="random"]{display:grid;place-items:center;color:white;font-size:26px;background:radial-gradient(circle,#38845d,#172c22)}
    .mello-banner-choice[data-banner="random"]::after{content:'Смайлик';position:absolute;bottom:3px;left:0;right:0;font-size:8px;color:#e2ffec}
    .mello-profile-card{width:min(100%,430px);max-height:88dvh;overflow:auto;padding:12px;border:1px solid #ffffff24;border-radius:25px;background:linear-gradient(145deg,#172a22f5,#101b17f5);box-shadow:0 24px 80px #0009;backdrop-filter:blur(24px);color:#eff9f1}
    .mello-profile-avatar{width:76px;height:76px;border:3px solid #b9f5cd;border-radius:50%;overflow:hidden;background:linear-gradient(135deg,#ee91b8,#66466c);display:grid;place-items:center;font-size:32px;box-shadow:0 8px 28px #0006}
    .mello-profile-avatar img{width:100%;height:100%;object-fit:cover}
    .mello-profile-summary{display:flex;align-items:center;gap:12px;margin:12px 4px 8px}
    .mello-profile-actions .mello-gift-open{background:#ffffff0b;color:inherit;font-weight:700}
    .mello-profile-actions .mello-gift-open img{width:17px;height:17px;object-fit:contain;vertical-align:-4px;margin-right:4px}
    .mello-profile-stars{display:flex;justify-content:center;margin:-2px 4px 9px}
    .mello-profile-summary h2{margin:0;font-size:18px}.mello-profile-summary p{margin:4px 0 0;color:#9db9a7;font-size:12px}
    .mello-profile-actions{display:flex;gap:8px;margin:12px 4px 3px}.mello-profile-actions button{flex:1;border:1px solid #ffffff20;border-radius:12px;padding:11px;background:#ffffff0b;color:inherit;cursor:pointer}.mello-profile-actions button:first-child{background:#77e7a9;color:#082416;font-weight:700}
    .mello-profile-top{display:flex;justify-content:flex-end;height:0;position:relative;z-index:1}.mello-profile-top button{margin:7px 6px 0 0;width:32px;height:32px;border:0;border-radius:50%;background:#07130e9c;color:#fff;font-size:20px;cursor:pointer}
    @media(max-width:520px){.mello-profile-cover{height:128px}.mello-banner-options{grid-template-columns:repeat(3,minmax(0,1fr))}.mello-profile-card{padding:10px}}
    @media(prefers-reduced-motion:reduce){.mello-cover-face{animation:none}}
  `;
  document.head.append(style);

  const createBannerPicker = () => {
    const box = document.createElement('section');
    box.className = 'mello-banner-box';
    box.innerHTML = `<div class="mello-banner-heading"><span>Баннер профиля</span><small>Картинка — 2100 монет · видео — 4200</small></div><div class="mello-banner-options"><button type="button" class="mello-banner-choice" data-banner="random" aria-label="Случайный смайлик">🙂</button>${banners.map(b => `<button type="button" class="mello-banner-choice" data-banner="${b.file}" aria-label="${b.title}" title="${b.title}">${b.video ? `<video data-video-src="${b.url}" muted loop playsinline preload="none"></video>` : b.url ? `<img src="${b.url}" alt="" loading="lazy">` : `<span style="display:block;width:100%;height:100%;background:${b.gradient}"></span>`}</button>`).join('')}</div>`;
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const video = entry.target.querySelector('video[data-video-src]');
        if (video && !video.src) { video.src = video.dataset.videoSrc; video.autoplay = true; video.play().catch(() => {}); }
        observer.unobserve(entry.target);
      }), { root: box, rootMargin: '80px' });
      box.querySelectorAll('.mello-banner-choice').forEach(choice => observer.observe(choice));
    }
    const refresh = () => box.querySelectorAll('[data-banner]').forEach(button => button.classList.toggle('selected', button.dataset.banner === (savedBanner() || 'random')));
    box.addEventListener('click', e => {
      const choice = e.target.closest('[data-banner]');
      if (!choice) return;
      try { choice.dataset.banner === 'random' ? localStorage.removeItem(key()) : localStorage.setItem(key(), choice.dataset.banner); } catch {}
      account.profileBanner = choice.dataset.banner === 'random' ? '' : choice.dataset.banner;
      if (typeof save === 'function') save();
      refresh();
      const preview = box.previousElementSibling;
      if (preview?.classList.contains('mello-profile-cover-preview')) preview.innerHTML = coverMarkup(savedBanner());
      toast(choice.dataset.banner === 'random' ? 'Будет случайный смайлик' : 'Баннер выбран');
    });
    refresh();
    return box;
  };

  const previousShowProfile = window.showProfile || showProfile;
  window.showProfile = function () {
    previousShowProfile();
    const form = document.querySelector('#profileForm');
    const firstField = form?.querySelector('.field');
    if (!form || !firstField || form.querySelector('.mello-banner-box')) return;
    const preview = document.createElement('div');
    preview.className = 'mello-profile-cover-preview';
    preview.innerHTML = coverMarkup(savedBanner());
    firstField.before(preview, createBannerPicker());
    form.addEventListener('submit', () => {
      try { account.profileBanner = savedBanner(); save(); } catch {}
    }, { capture: true });
  };

  const showPersonCard = ({ name, username, avatar, emoji, selection, own = false, personId = '', giftable = true, entityType = 'person' }) => {
    const host = document.querySelector('#modalHost');
    if (!host) return;
    const banner = own ? (savedBanner() || account?.profileBanner || '') : selection;
    const starBalance = Number.isFinite(account?.melloStars) ? account.melloStars : 10;
    const isBlocked = (account?.blockedUsers || []).includes(personId);
    const canGift = !own && giftable && !!personId && personId !== 'mello-support' && !String(personId).startsWith('bot_');
    const otherActions = `${canGift ? `<button type="button" class="mello-gift-open" data-gift-open data-person-id="${esc(personId)}"><img src="https://www.emojiall.com/images/120/telegram/1f381.gif" alt="">Подарить</button>` : ''}<button type="button" data-message>Написать</button>${entityType === 'person' && personId && personId !== 'mello-support' ? `<button type="button" data-block-user="${esc(personId)}">${isBlocked ? 'Разблокировать' : 'Заблокировать'}</button>` : ''}`;
    host.innerHTML = `<div class="modal-bg mello-profile-bg"><section class="mello-profile-card"><div class="mello-profile-top"><button type="button" aria-label="Закрыть">×</button></div>${coverMarkup(banner)}<div class="mello-profile-summary"><div class="mello-profile-avatar">${avatar || `<span>${emoji || '🙂'}</span>`}</div><div><h2>${esc(name || 'Пользователь Mello')}</h2><p>${esc(username || '@mello_user')}${own ? ' · это ты' : ''}</p></div></div>${own ? `<div class="mello-profile-stars"><span class="mello-stars-badge"><img src="https://www.emojiall.com/images/120/telegram/2b50.gif" alt=""> ${starBalance} Mello Stars</span></div>` : ''}<div class="mello-profile-actions">${own ? '<button type="button" data-edit-profile>Изменить профиль</button><button type="button" data-accounts>Аккаунты</button><button type="button" data-logout>Выйти</button>' : otherActions}<button type="button" data-close-profile>Закрыть</button></div></section></div>`;
    const close = () => host.replaceChildren();
    host.querySelector('[aria-label="Закрыть"]').onclick = close;
    host.querySelector('[data-close-profile]').onclick = close;
    host.querySelector('.mello-profile-bg').onclick = e => { if (e.target.classList.contains('mello-profile-bg')) close(); };
    host.querySelector('[data-edit-profile]')?.addEventListener('click', () => { close(); window.showProfile(); });
    host.querySelector('[data-accounts]')?.addEventListener('click', () => { close(); window.showAccounts?.(); });
    host.querySelector('[data-logout]')?.addEventListener('click', () => { close(); window.leave?.(); });
    host.querySelector('[data-message]')?.addEventListener('click', () => { close(); if (personId) startChat(personId); });
  };
  window.showPersonCard = showPersonCard;

  const showOwnProfileCard = () => showPersonCard({ name: account?.name, username: account?.username, avatar: account?.avatar ? `<img src="${account.avatar}" alt="">` : '', own: true });
  document.querySelector('#railProfile')?.addEventListener('click', e => { e.preventDefault(); e.stopImmediatePropagation(); showOwnProfileCard(); }, true);
  document.querySelector('#profileBtn')?.addEventListener('click', e => { e.preventDefault(); e.stopImmediatePropagation(); showOwnProfileCard(); }, true);
  document.addEventListener('click', e => {
    const avatar = e.target.closest('.avatar');
    if (!avatar || !document.querySelector('#appView:not(.hidden)')) return;
    if (avatar.id === 'railProfile') return;
    if (avatar.closest('#profileDrawer')) {
      const member = avatar.closest('.drawer-member');
      if (!member) {
        if (!avatar.closest('.drawer-person')) return;
        const chat = chats.find(c => c.id === current), p = chat && person(chat.personId);
        if (!p) return;
        e.preventDefault(); e.stopImmediatePropagation();
        showPersonCard({ name: chat.title || p.name, username: p.username, emoji: chat.type === 'groups' ? '👥' : p.emoji, selection: p.profileBanner, personId: p.id, giftable: chat.type === 'personal' && chat.id !== 'mello-support', entityType: ['groups','channels'].includes(chat.type) ? chat.type : 'person' });
        return;
      }
      const title = member.querySelector('b')?.textContent || 'Пользователь Mello';
      const username = member.querySelector('small')?.textContent || '@mello_user';
      const own = username.includes('это ты');
      if (own) { e.preventDefault(); e.stopImmediatePropagation(); showPersonCard({ name: account?.name, username: account?.username, avatar: avatar.querySelector('img')?.outerHTML, own: true }); return; }
      e.preventDefault(); e.stopImmediatePropagation();
      const memberIndex = [...avatar.closest('.drawer-members').querySelectorAll('.drawer-member')].indexOf(member) - 1;
      const chat = chats.find(c => c.id === current), id = (chat?.memberIds || [chat?.personId]).filter(Boolean)[memberIndex];
      const p = id ? person(id) : null;
      showPersonCard({ name: p?.name || title, username: p?.username || username, emoji: p?.emoji, selection: p?.profileBanner, personId: id });
      return;
    }
    if (avatar.closest('#conversationHead')) {
      const chat = chats.find(c => c.id === current); if (!chat) return;
      const p = person(chat.personId);
      e.preventDefault(); e.stopImmediatePropagation();
      showPersonCard({ name: chat.title || p.name, username: p.username, emoji: chat.type === 'groups' ? '👥' : p.emoji, selection: p.profileBanner, personId: p.id, giftable: chat.type === 'personal' && chat.id !== 'mello-support', entityType: ['groups','channels'].includes(chat.type) ? chat.type : 'person' });
      return;
    }
    const row = avatar.closest('[data-chat], [data-user-result], .person');
    if (!row) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (row.dataset.chat) {
      const chat = chats.find(c => c.id === row.dataset.chat), p = chat && person(chat.personId);
      if (p) showPersonCard({ name: chat.title || p.name, username: p.username, emoji: chat.type === 'groups' ? '👥' : p.emoji, selection: p.profileBanner, personId: p.id, giftable: chat.type === 'personal' && chat.id !== 'mello-support', entityType: ['groups','channels'].includes(chat.type) ? chat.type : 'person' });
    } else {
      const id = row.dataset.userResult || row.querySelector('[data-person]')?.dataset.person;
      const p = id && person(id);
      if (p) showPersonCard({ name: p.name, username: p.username, emoji: p.emoji, selection: p.profileBanner, personId: p.id, giftable: !p.isBot && p.type !== 'bot', entityType: p.isBot || p.type === 'bot' ? 'bot' : 'person' });
    }
  }, true);
})();
