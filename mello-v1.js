(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  const key = suffix => `mello:${account?.id || account?.email || account?.phone || 'guest'}:${suffix}`;
  const emojiUrl = emoji => `https://www.emojiall.com/images/120/telegram/${Array.from(emoji.replace(/[\uFE0E\uFE0F]/gu, ''), c => c.codePointAt(0).toString(16)).join('-')}.gif`;
  const symbols = { saved: '1f516', support: '1f4ac', stars: '2b50', coins: '1fa99', ads: '1f4fa' };
  const giftsShop = [
    ['🎂', 'Тортик', 20], ['🧸', 'Мишка', 20], ['❤️', 'Сердце', 20], ['😘', 'Поцелуй', 20], ['🍷', 'Вино', 30]
  ];
  const imageBannerTitles = ['Тории','Горы','Сад','Охайо','Аниме','Монохром','Манга','Сакура','Ночной сад','Кот','Взгляд','Глаза','Питомцы','Флаг','Собаки','Welcome','Котёнок'];
  const banners = [
    ...Array.from({ length: 17 }, (_, i) => ({ file: `banner-${String(i + 1).padStart(2, '0')}.jpg`, title: imageBannerTitles[i], kind: 'image' })),
    ...Array.from({ length: 21 }, (_, i) => ({ file: `video-${String(i + 1).padStart(2, '0')}.mp4`, title: `Анимация ${i + 1}`, kind: 'video' })),
    ...['Изумрудная волна','Северное сияние','Стеклянный лес'].map((title, i) => ({ file: `liquid-${18 + i}`, title, kind: 'image', gradient: ['#08251b,#28684b,#192944','#102c37,#39809a,#202342','#132b20,#667444,#121e1a'][i] }))
  ];
  let rewardTimer = 0, pinContinuation = null, pinTries = 0, lockTimeout = 0;

  const css = document.createElement('style');
  css.textContent = `
    .mello-terms-accept{display:flex;align-items:flex-start;gap:8px;margin:3px 0 12px;padding:10px;border:1px solid #ffffff20;border-radius:12px;background:#ffffff08;color:#c7dfcf;font-size:11px;line-height:1.55}
    .mello-username-tools{display:flex;justify-content:flex-end;margin-top:6px}.mello-username-tools button{border:1px solid #ffffff1c;border-radius:9px;padding:6px 9px;background:#ffffff08;color:#adf2c7;font-size:10px;cursor:pointer}
    .mello-terms-accept input{accent-color:#77e7a9;margin-top:3px}.mello-terms-accept button{border:0;padding:0;background:none;color:#9ff2bb;text-decoration:underline;cursor:pointer;font:inherit}
    .mello-mascot{display:flex;align-items:center;gap:12px;margin:0 0 12px;padding:12px 14px;border:1px solid #a7f5c226;border-radius:16px;background:linear-gradient(110deg,#ffffff0d,#5adc8d14);color:#b5d9c2;font-size:11px}.mello-mascot img{width:34px;height:34px;object-fit:contain;transition:transform .25s ease}.mello-mascot.closed img{transform:scale(.9) rotate(-8deg)}
    .mello-v1-tools{margin:16px 0 0;padding:13px;border:1px solid #ffffff1c;border-radius:18px;background:#ffffff07}.mello-v1-tools h3{margin:0 0 8px;font-size:12px}.mello-v1-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.mello-v1-grid button{display:flex;align-items:center;gap:8px;min-height:42px;padding:8px;border:1px solid #ffffff15;border-radius:12px;background:#ffffff08;color:inherit;text-align:left;font-size:11px;cursor:pointer}.mello-v1-grid img{width:20px;height:20px;object-fit:contain}
    .mello-pin-screen{width:min(100%,390px);padding:20px 18px 17px;border:1px solid #ffffff2a;border-radius:27px;background:radial-gradient(ellipse at 50% 12%,#264e84a1,transparent 50%),linear-gradient(155deg,#142b31f7,#0d1917f9);color:#f3fff6;text-align:center;box-shadow:0 25px 90px #000b;backdrop-filter:blur(26px)}.mello-pin-top{display:flex;justify-content:space-between;align-items:center;color:#d7e9dc}.mello-pin-mascot{width:76px;height:76px;margin:26px auto 8px;object-fit:contain;filter:drop-shadow(0 10px 24px #0007)}.mello-pin-screen h2{margin:7px 0 5px;font-size:20px}.mello-pin-screen p{margin:0;color:#a9c4b2;font-size:11px}.mello-pin-dots{display:flex;justify-content:center;gap:15px;margin:24px 0}.mello-pin-dot{width:10px;height:10px;border:1.5px solid #d9eee0;border-radius:50%;transition:transform .15s ease,background .15s ease}.mello-pin-dot.full{transform:scale(1.12);background:#8fffc0;border-color:#8fffc0}.mello-keypad{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;max-width:285px;margin:0 auto}.mello-keypad button{height:59px;border:1px solid #ffffff15;border-radius:50%;background:#ffffff08;color:#fff;font-size:23px;cursor:pointer;transition:transform .16s ease,background .16s ease}.mello-keypad button:active{transform:scale(.9);background:#8fffc029}.mello-keypad small{display:block;font-size:8px;letter-spacing:.14em;color:#b9c9c0}.mello-pin-bottom{display:flex;justify-content:space-between;margin:21px 8px 0}.mello-pin-bottom button,.mello-pin-top button{border:0;background:transparent;color:#cce4d4;font-size:11px;cursor:pointer}.mello-pin-screen .mello-pin-error{min-height:17px;color:#ff9d9d}
    .mello-dialog{width:min(100%,520px);max-height:84dvh;overflow:auto;padding:18px;border:1px solid #ffffff22;border-radius:22px;background:linear-gradient(145deg,#1d3027f5,#111b17f8);color:#eff9f2;box-shadow:0 24px 70px #0009}.mello-dialog h2{margin:0;font-size:17px}.mello-dialog p,.mello-dialog li{color:#a9c0b1;font-size:11px;line-height:1.6}.mello-dialog ul{padding-left:19px}.mello-dialog .primary{margin-top:9px}
    .community-mode .shell{grid-template-columns:82px 300px minmax(320px,1fr);border-radius:0}.community-mode .rail{background:#080e0c}.community-mode .side{background:#101714}.community-mode .pane{background:#080e0d}.community-mode .pane-head,.community-mode .composer{border-radius:14px}.community-mode .row{border-radius:12px}.community-mode .tabs{display:grid;grid-template-columns:repeat(4,1fr)}
    .mello-support-badge{display:inline-flex;align-items:center;padding:2px 6px;margin-right:5px;border-radius:6px;background:#60c78926;color:#9ef2bb;font-size:8px;font-weight:700}.mello-owner-label{display:inline-flex;margin-left:5px;padding:2px 6px;border-radius:9px;background:#8fffc01c;color:#aaffc8;font-size:9px}
    .mello-banner-shop-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.mello-banner-shop-card{min-width:0;overflow:hidden;border:1px solid #ffffff1a;border-radius:15px;background:#ffffff08}.mello-banner-shop-art{height:72px;position:relative;overflow:hidden;background-position:center;background-size:cover;animation:melloBannerDrift 10s ease-in-out infinite alternate}.mello-banner-shop-card:nth-child(3n) .mello-banner-shop-art{animation-duration:7s}.mello-shop-video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.mello-video-art{background:linear-gradient(135deg,#10251c,#253b30)}.mello-banner-shop-meta{display:flex;align-items:center;justify-content:space-between;gap:4px;padding:8px;font-size:10px}.mello-banner-shop-meta button{border:0;border-radius:9px;padding:6px 7px;background:#75e3a3;color:#072013;font-size:9px;font-weight:700;cursor:pointer}.mello-banner-shop-meta button:disabled{opacity:.6}.mello-liquid-art{background:radial-gradient(ellipse at 20% 40%,#72f0bd88,transparent 36%),radial-gradient(ellipse at 78% 20%,#63a0ff55,transparent 40%),linear-gradient(125deg,#071e16,#174e39,#13233b);background-size:140% 140%}
    @keyframes melloBannerDrift{to{background-position:72% 48%;filter:saturate(1.2) brightness(1.12)}}
    .mello-community-open{border:1px solid #ffffff22;border-radius:9px;padding:5px 8px;background:#ffffff09;color:inherit;font-size:9px;cursor:pointer}
    .mello-ios{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",sans-serif}.mello-android{font-family:Roboto,"Arial",sans-serif}
    .big-emoji-message{display:flex;flex-direction:column;align-items:flex-end;margin:10px 4px 14px}.big-emoji-message img{width:90px;height:90px;object-fit:contain}.big-emoji-message time{margin-top:4px;color:#a3bcae;font-size:9px}
    .mello-quick-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}.mello-quick-actions button{border:1px solid #ffffff20;border-radius:12px;padding:9px 11px;background:#ffffff0b;color:inherit;font-size:11px;cursor:pointer}
    @media(max-width:760px){#appView.shell{width:100%;height:100dvh;grid-template-columns:minmax(0,1fr);grid-template-rows:minmax(0,1fr) calc(64px + env(safe-area-inset-bottom));border:0}.rail{grid-column:1;grid-row:2;position:relative;z-index:8;width:100%;height:calc(64px + env(safe-area-inset-bottom));flex-direction:row;justify-content:space-around;gap:2px;padding:4px 5px calc(4px + env(safe-area-inset-bottom));border-right:0;border-top:1px solid #ffffff16;background:#0c1812ed;backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px)}.rail-logo,.rail-btn[title="Выйти"]{display:none}.rail-btn{flex:1;width:auto;min-width:0;height:52px;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:2px;border-radius:14px;font-size:19px}.rail-btn small{font-size:9px}.side{grid-column:1;grid-row:1;min-height:0}.pane{display:none;position:fixed;z-index:3;inset:0 0 calc(64px + env(safe-area-inset-bottom));background:#0b1712}.shell.chat-open .side{display:none}.shell.chat-open .pane{display:flex}.shell.chat-open .rail{display:flex}.community-mode .shell{grid-template-columns:minmax(0,1fr);grid-template-rows:minmax(0,1fr) calc(64px + env(safe-area-inset-bottom))}.community-mode .side{grid-column:1;grid-row:1}.community-mode .pane{display:none}.community-mode .chat-open .side{display:none}.community-mode .chat-open .pane{display:flex}.community-mode .chat-open .rail{display:flex}.mello-profile-actions{flex-wrap:wrap}}
    @media(max-width:390px){.rail{padding-inline:2px}.rail-btn{height:50px}.rail-btn small{font-size:8px}.mello-v1-grid{gap:5px}}
    @media(prefers-reduced-motion:reduce){.mello-banner-shop-art,.mello-pin-mascot,.mello-mascot img{animation:none;transition:none}}
  `;
  css.textContent += `
    @media(max-width:760px){#appView.shell.chat-open>.rail{display:flex!important;position:fixed!important;inset:auto 0 0!important;width:100%!important;height:calc(64px + env(safe-area-inset-bottom))!important;z-index:30!important;grid-column:auto;grid-row:auto}#appView.shell.chat-open>.pane{bottom:calc(64px + env(safe-area-inset-bottom))!important}}
  `;
  document.head.append(css);

  function returnToChatList(){
    current=null;
    $('#appView')?.classList.remove('chat-open');
    $('#welcome')?.classList.remove('hidden');
    $('#chatHead')?.classList.add('hidden');
    $('#messages')?.classList.add('hidden');
    $('#composer')?.classList.add('hidden');
    $('#profileDrawer')?.classList.remove('open');
    history.replaceState(history.state,'',location.pathname+location.search);
    window.renderChats?.();
  }
  document.addEventListener('click',event=>{
    const back=event.target.closest('#backBtn');
    if(!back)return;
    event.preventDefault();event.stopImmediatePropagation();
    returnToChatList();
  },true);
  document.addEventListener('click',event=>{
    const target=event.target instanceof Element?event.target:event.target?.parentElement;
    const close=target?.closest('#profileDrawer .drawer-close');
    if(!close)return;
    event.preventDefault();event.stopImmediatePropagation();
    const drawer=$('#profileDrawer');
    drawer?.classList.remove('open');
    drawer?.setAttribute('aria-hidden','true');
  },true);
  document.addEventListener('pointerdown',event=>{
    const target=event.target instanceof Element?event.target:event.target?.parentElement;
    const close=target?.closest('#profileDrawer .drawer-close, #modalHost .mello-profile-top [aria-label="Закрыть"], #modalHost [data-close-profile]');
    if(!close)return;
    event.preventDefault();event.stopImmediatePropagation();
    const drawer=close.closest('#profileDrawer');
    if(drawer){drawer.classList.remove('open');drawer.setAttribute('aria-hidden','true');}
    else close.closest('#modalHost')?.replaceChildren();
  },true);

  function showModal(html, onClick) {
    const host = $('#modalHost'); if (!host) return null;
    host.innerHTML = `<div class="modal-bg mello-v1-bg">${html}</div>`;
    const bg = host.firstElementChild;
    bg.addEventListener('click', e => { if (e.target === bg || e.target.closest('[data-v1-close]')) { if (e.target === bg && bg.querySelector('[data-security-request]')) return; if (e.target === bg) clearInterval(rewardTimer); host.replaceChildren(); } });
    bg.addEventListener('click', e => onClick?.(e));
    return bg;
  }
  document.addEventListener('click', e => {
    const close = e.target.closest('#modalHost .close,#modalHost [data-close],#modalHost [data-v1-close],#modalHost [data-close-profile],#modalHost [aria-label="Закрыть"],#closeAppSettings');
    if (!close) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (close.closest('#profileDrawer')) { $('#profileDrawer')?.classList.remove('open'); return; }
    clearInterval(rewardTimer);
    $('#modalHost')?.replaceChildren();
  }, true);
  function accountKey() { return account?.id || account?.email || account?.phone || 'guest'; }
  const securityTabId = sessionStorage.getItem('mello.security.tab') || (() => { const id=`tab_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;sessionStorage.setItem('mello.security.tab',id);return id; })();
  let pendingSecurityRequest = '';
  let activeSecurityPrompt = '';
  const securityBus = 'BroadcastChannel' in window ? new BroadcastChannel('mello-security') : null;
  function publishSecurity(message){const payload={...message,stamp:Date.now(),nonce:Math.random().toString(36).slice(2)};securityBus?.postMessage(payload);try{localStorage.setItem('mello.security.event',JSON.stringify(payload))}catch{}}
  function removePendingNotice(){document.querySelector('#securityPendingNotice')?.remove()}
  function showPendingNotice(){if($('#securityPendingNotice'))return;const notice=document.createElement('div');notice.id='securityPendingNotice';notice.textContent='Вход открыт · ожидает проверки на другом сеансе';notice.style.cssText='position:fixed;z-index:12;top:12px;left:50%;transform:translateX(-50%);max-width:calc(100vw - 24px);padding:10px 14px;border:1px solid #b8ffd455;border-radius:14px;background:#12291feF;color:#dffff0;font:12px system-ui;box-shadow:0 12px 35px #0006;backdrop-filter:blur(18px);text-align:center';document.body.append(notice)}
  function showSecurityPrompt(message){
    if(activeSecurityPrompt===message.requestId||!account||String(message.accountKey)!==String(accountKey())||$('#appView')?.classList.contains('hidden'))return;
    activeSecurityPrompt=message.requestId;
    const platform=navigator.userAgentData?.platform||navigator.platform||'браузер';
    showModal(`<section class="mello-dialog" data-security-request="${escape(message.requestId)}"><div class="modal-top"><div><h2>Внимание: вход с нового устройства</h2><p>Устройство: ${escape(platform)} · IP в демо не определяется.</p><strong>Это вы?</strong></div></div><div class="mello-quick-actions"><button type="button" data-security-approve>Да, это я</button><button type="button" data-security-deny>Нет, заблокировать доступ</button></div><p>Новый сеанс уже открыт как разрешённый. Если выбрать «Нет», его сразу завершит.</p></section>`,event=>{
      if(event.target.closest('[data-security-approve]')){publishSecurity({type:'approved',accountKey:message.accountKey,requestId:message.requestId,to:message.from});activeSecurityPrompt='';$('#modalHost').replaceChildren()}
      if(event.target.closest('[data-security-deny]')){publishSecurity({type:'denied',accountKey:message.accountKey,requestId:message.requestId,to:message.from});activeSecurityPrompt='';$('#modalHost').replaceChildren()}
    });
  }
  function receiveSecurity(message){if(!message||message.from===securityTabId)return;
    if(message.type==='request'){showSecurityPrompt(message);return}
    if(message.to!==securityTabId||message.requestId!==pendingSecurityRequest||String(message.accountKey)!==String(accountKey()))return;
    removePendingNotice();pendingSecurityRequest='';
    if(message.type==='approved'){localStorage.setItem(`mello.trusted:${accountKey()}`,'1');toast('Вход подтверждён на другом сеансе')}
    if(message.type==='denied'){toast('Другой сеанс заблокировал этот вход');window.leave?.()}
  }
  securityBus?.addEventListener('message',event=>receiveSecurity(event.data));
  window.addEventListener('storage',event=>{if(event.key==='mello.security.event'&&event.newValue){try{receiveSecurity(JSON.parse(event.newValue))}catch{}}});
  window.addEventListener('pagehide',()=>securityBus?.close(),{once:true});
  function pinStorageKey() { return `mello.pin.v1:${accountKey()}`; }
  async function pinDigest(pin, salt) {
    if (!window.isSecureContext || !crypto?.subtle) throw new Error('secure-context');
    const data = new TextEncoder().encode(`${salt}:${pin}`);
    const hashed = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashed), b => b.toString(16).padStart(2, '0')).join('');
  }
  function hasPin() { try { return !!JSON.parse(localStorage.getItem(pinStorageKey()) || 'null')?.hash; } catch { return false; } }
  async function setPin(pin) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const saltText = Array.from(salt, b => b.toString(16).padStart(2, '0')).join('');
    const hash = await pinDigest(pin, saltText);
    localStorage.setItem(pinStorageKey(), JSON.stringify({ salt: saltText, hash, length: pin.length }));
  }
  async function checkPin(pin) {
    const saved = JSON.parse(localStorage.getItem(pinStorageKey()) || 'null');
    return !!saved && saved.hash === await pinDigest(pin, saved.salt);
  }
  function lockScreen(done) {
    pinContinuation = done;
    let digits = '';
    const spec = JSON.parse(localStorage.getItem(pinStorageKey()) || 'null');
    if (!spec) { done?.(); return; }
    showModal(`<section class="mello-pin-screen"><div class="mello-pin-top"><span>🔒 Mello</span><button type="button" data-pin-cancel>Войти другим аккаунтом</button></div><img class="mello-pin-mascot" src="${emojiUrl('🙈')}" alt="Mello"><h2>Введи код-пароль</h2><p>Код остаётся на этом устройстве</p><div class="mello-pin-dots">${Array.from({length:spec.length},(_,i)=>`<i class="mello-pin-dot" data-pin-dot="${i}"></i>`).join('')}</div><div class="mello-pin-error" id="melloPinError"></div><div class="mello-keypad">${[1,2,3,4,5,6,7,8,9,'bio',0,'del'].map((n,i)=>n==='bio'?'<button type="button" data-biometric aria-label="Биометрия">⌁<small>БИОМЕТРИЯ</small></button>':n==='del'?'<button type="button" data-pin-del>⌫</button>':`<button type="button" data-pin-key="${n}">${n}<small>${['','ABC','DEF','GHI','JKL','MNO','PQRS','TUV','WXYZ'][Number(n)]||''}</small></button>`).join('')}</div><div class="mello-pin-bottom"><button type="button" data-pin-help>Забыли код?</button><span></span></div></section>`, e => {
      const btn = e.target.closest('[data-pin-cancel],[data-pin-key],[data-pin-del],[data-biometric],[data-pin-help]'); if (!btn) return;
      if (btn.hasAttribute('data-pin-cancel')) { $('#modalHost').replaceChildren();$('#appView').classList.add('hidden');$('#authView').classList.remove('hidden');sessionStorage.setItem('mello.forceLogin','1');return; }
      if (btn.hasAttribute('data-pin-help')) { $('#melloPinError').textContent = 'Сброс кода потребует выйти и снова войти в аккаунт.'; return; }
      if (btn.hasAttribute('data-biometric')) { authenticateBiometric().then(ok => { if (ok) finishUnlock(); else $('#melloPinError').textContent = 'Биометрия недоступна или не подтверждена.'; }); return; }
      if (btn.hasAttribute('data-pin-del')) { digits = digits.slice(0, -1); updateDots(); return; }
      digits += btn.dataset.pinKey;
      updateDots();
      if (digits.length >= spec.length) checkPin(digits).then(ok => { if (ok) finishUnlock(); else { digits = ''; pinTries++; updateDots(); $('#melloPinError').textContent = pinTries >= 5 ? 'Подожди 30 секунд и попробуй снова.' : 'Код не подошёл. Попробуй ещё раз.'; $('#melloPinScreen')?.classList.add('shake'); if (pinTries >= 5) { clearTimeout(lockTimeout); lockTimeout = setTimeout(() => { pinTries = 0; }, 30000); } } }).catch(() => { $('#melloPinError').textContent = 'Для защиты включи безопасный контекст HTTPS.'; });
    });
    function updateDots() { document.querySelectorAll('[data-pin-dot]').forEach((dot,i)=>dot.classList.toggle('full',i<digits.length)); }
    function finishUnlock() { const next=pinContinuation; pinContinuation=null; $('#modalHost').replaceChildren(); next?.(); }
  }
  async function authenticateBiometric() {
    const idText = localStorage.getItem(`mello.bio:${accountKey()}`); if (!idText || !navigator.credentials) return false;
    const id = Uint8Array.from(atob(idText), c => c.charCodeAt(0));
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const credential = await navigator.credentials.get({ publicKey: { challenge, allowCredentials: [{ type: 'public-key', id }], userVerification: 'required', timeout: 60000 } });
    return !!credential;
  }
  async function enableBiometric() {
    if (!window.isSecureContext || !navigator.credentials?.create || !window.PublicKeyCredential) throw new Error('unsupported');
    const challenge=crypto.getRandomValues(new Uint8Array(32)), userId=crypto.getRandomValues(new Uint8Array(16));
    const credential=await navigator.credentials.create({ publicKey: { challenge, rp:{name:'Mello',id:location.hostname}, user:{id:userId,name:account.email||account.phone||'mello-user',displayName:account.name||'Mello'}, pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}], authenticatorSelection:{authenticatorAttachment:'platform',residentKey:'preferred',userVerification:'required'}, timeout:60000, attestation:'none' } });
    if (!credential) throw new Error('cancelled');
    localStorage.setItem(`mello.bio:${accountKey()}`, btoa(String.fromCharCode(...new Uint8Array(credential.rawId))));
  }
  function setPinDialog() {
    if (!window.isSecureContext || !crypto?.subtle) { toast('Код-пароль доступен после открытия Mello по HTTPS или localhost.'); return; }
    showModal(`<section class="mello-dialog"><div class="modal-top"><div><h2>Защита приложения</h2><p>Создай код из 4–6 цифр. Это локальный замок прототипа.</p></div><button class="close" data-v1-close>×</button></div><label class="field"><span>Новый код-пароль</span><input id="pinSetOne" type="password" inputmode="numeric" autocomplete="new-password" maxlength="6" placeholder="4–6 цифр"></label><label class="field"><span>Повтори код</span><input id="pinSetTwo" type="password" inputmode="numeric" maxlength="6" placeholder="Повтори код"></label><div class="mello-quick-actions"><button type="button" data-pin-save>Сохранить код</button><button type="button" data-pin-remove>Отключить код</button><button type="button" data-bio-enable>Включить биометрию</button></div><p>Биометрия использует системный ключ устройства в поддерживаемом браузере. Для защиты аккаунтов на разных устройствах понадобится сервер.</p></section>`, e => {
      if (e.target.closest('[data-pin-save]')) {
        const a=$('#pinSetOne').value,b=$('#pinSetTwo').value;
        if(!/^\d{4,6}$/.test(a)||a!==b){toast('Введи одинаковый код из 4–6 цифр');return}
        setPin(a).then(()=>{ $('#modalHost').replaceChildren();toast('Код-пароль сохранён на устройстве'); }).catch(()=>toast('Не удалось сохранить код-пароль'));
      }
      if (e.target.closest('[data-pin-remove]')) { localStorage.removeItem(pinStorageKey());localStorage.removeItem(`mello.bio:${accountKey()}`);$('#modalHost').replaceChildren();toast('Защита отключена'); }
      if (e.target.closest('[data-bio-enable]')) enableBiometric().then(()=>toast('Биометрия устройства включена')).catch(()=>toast('На этом устройстве биометрия недоступна'));
    });
  }
  function termsDialog(kind) {
    const isRules = kind === 'rules';
    const title = isRules ? 'Правила сообщества Mello' : 'Условия использования Mello';
    const paragraphs = isRules ? [
      'Общайся уважительно. Не преследуй людей, не угрожай им и не выдавай себя за другого человека.',
      'Не рассылай спам, мошеннические предложения, вредоносные ссылки или нежелательные массовые сообщения.',
      'Не публикуй чужие личные данные, изображения или переписки без разрешения.',
      'Не отправляй материалы, нарушающие закон или права других людей. Пользуйся жалобой, если видишь нарушение.',
      'Администраторы сообществ могут задавать правила своих каналов и групп. Владелец отвечает за назначение модераторов.'
    ] : [
      'Mello — сервис для общения. Создавая аккаунт, ты отвечаешь за сохранность своего устройства и доступ к нему.',
      'Передаваемые сообщения и файлы доступны участникам соответствующего чата. Не отправляй то, чем не готов делиться с его участниками.',
      'Демо-версия хранит данные в браузере на текущем устройстве. Она не синхронизирует их между людьми и устройствами.',
      'Не используй Mello для нарушения закона, прав других людей или этих правил. Мы можем ограничивать функции аккаунта при злоупотреблениях.',
      'Платежи, рекламные награды и отдельные функции в прототипе могут быть только демонстрацией и не являются реальной покупкой.'
    ];
    showModal(`<section class="mello-dialog"><div class="modal-top"><h2>${title}</h2><button class="close" data-v1-close>×</button></div><p>Версия документа 1.0 · собственные условия Mello</p><ol>${paragraphs.map(p=>`<li>${escape(p)}</li>`).join('')}</ol><button class="primary" data-v1-close>Понятно</button></section>`);
  }

  function ensureSystemChats() {
    if (!account || !Array.isArray(chats)) return;
    if (!chats.some(chat => chat.id === 'mello-saved')) chats.unshift({ id:'mello-saved', personId:'mello-saved', type:'personal', title:'Избранное', messages:[] });
    if (!chats.some(chat => chat.id === 'mello-support')) chats.push({ id:'mello-support', personId:'mello-support', type:'personal', title:'Поддержка Mello', ownerId:'mello-creator', messages:[{ text:'Привет! Здесь можно оставить идею, вопрос или сообщение о проблеме.', time:timeNow(), mine:false, role:'Бот' }] });
    if (!chats.some(chat => chat.id === 'mello-maxim')) chats.push({ id:'mello-maxim', personId:'mello-maxim', type:'personal', title:'Помощь от ИИ', messages:[{ text:'Привет! Я помощник Mello на основе ИИ. Выбери в шапке мягкий или резкий стиль и напиши мне.', time:timeNow(), mine:false, role:'Помощь от ИИ' }] });
    const aiHelpChat=chats.find(chat=>chat.id==='mello-maxim');if(aiHelpChat){aiHelpChat.title='Помощь от ИИ';aiHelpChat.messages=aiHelpChat.messages.map(message=>message.role==='Максим'?{...message,role:'Помощь от ИИ',text:message.text?.includes('я Максим')?'Привет! Я помощник Mello на основе ИИ. Выбери в шапке чата мягкий или резкий стиль и напиши мне.':message.text}:message)}
    if (!Array.isArray(account.blockedUsers)) account.blockedUsers=[];
    if (!Array.isArray(account.unlockedBanners)) account.unlockedBanners=[];
    if (!Number.isFinite(account.melloCoins)) account.melloCoins=0;
    if (!Number.isFinite(account.melloStars)) account.melloStars=10;
    save();
  }
  const previousPerson = window.person || person;
  window.person = id => id === 'mello-saved' ? {id,name:'Избранное',username:'Только для тебя',emoji:'🔖',a:'#78e4a7',b:'#1c6441'} : id === 'mello-support' ? {id,name:'Поддержка Mello',username:'@mello_support',emoji:'💬',a:'#70e8ab',b:'#18714b'} : id === 'mello-maxim' ? {id,name:'Помощь от ИИ',username:'ИИ-помощник Mello',emoji:'🤖',a:'#95c9ff',b:'#5352ad'} : previousPerson(id);
  const previousRenderChats = window.renderChats || renderChats;
  window.renderChats = function(){ensureSystemChats();previousRenderChats();const list=$('#chatList');if(!list)return;const blocked=new Set(account?.blockedUsers||[]);for(const row of list.querySelectorAll('[data-chat]')){const c=chats.find(x=>x.id===row.dataset.chat),p=row.querySelector('.preview');if(c?.id==='mello-saved'){row.querySelector('.avatar').innerHTML=`<img src="${emojiUrl('🔖')}" alt="">`;row.querySelector('.title').textContent='Избранное';}if(c?.id==='mello-support'){row.querySelector('.avatar').innerHTML=`<img src="${emojiUrl('💬')}" alt="">`;row.querySelector('.title').textContent='Поддержка Mello';row.querySelector('.title')?.insertAdjacentHTML('beforebegin','<span class="mello-support-badge">MELLO</span>');}if(p&&c?.id==='mello-support')p.textContent='Написать в поддержку';if(p&&blocked.has(c?.personId))p.textContent='Пользователь в чёрном списке';}};

  const priorEnter = window.enter || enter;
  window.enter = function(){
    const continueLogin = () => { const go=()=>{ensureSystemChats();priorEnter();}; if(hasPin())lockScreen(go);else go(); };
    if (!isRegister && localStorage.getItem(`mello.trusted:${accountKey()}`)!=='1') {pendingSecurityRequest=`req_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;publishSecurity({type:'request',accountKey:accountKey(),requestId:pendingSecurityRequest,from:securityTabId,device:navigator.userAgentData?.platform||navigator.platform||'браузер'});continueLogin();showPendingNotice();}
    else continueLogin();
  };
  const submit = $('#authForm');
  if (submit) {
    const oldSubmit = submit.onsubmit;
    if (oldSubmit) submit.onsubmit = function(e){ oldSubmit.call(this,e); };
    submit.addEventListener('submit', e=>{if(isRegister&&!$('#melloTermsCheck')?.checked){e.preventDefault();e.stopImmediatePropagation();toast('Сначала прими условия Mello');}},true);
    $('#melloTermsOpen')?.addEventListener('click',()=>termsDialog('terms'));
    $('#melloRulesOpen')?.addEventListener('click',()=>termsDialog('rules'));
  }
  const usernameObserver=new MutationObserver(()=>{
    const input=$('#profileUsername'),form=$('#profileForm');if(!input||!form||input.dataset.usernameReady)return;
    input.dataset.usernameReady='1';
    if(!input.value.trim())input.value=window.suggestMelloUsername?.(account?.name)||'@mello_user';
    const tools=document.createElement('div');tools.className='mello-username-tools';tools.innerHTML='<button type="button" data-new-username>Сгенерировать другой вариант</button>';input.closest('.field')?.after(tools);
    tools.querySelector('button').onclick=()=>{input.value=window.suggestMelloUsername?.(account?.name)||`@mello${Date.now().toString().slice(-5)}`;input.focus()};
    form.addEventListener('submit',e=>{
      if(!input.value.trim())input.value=window.suggestMelloUsername?.(account?.name)||'';
      const normalized='@'+input.value.trim().replace(/^@+/,'').toLowerCase();
      let records=[];try{records=JSON.parse(localStorage.getItem('mello.accounts')||'[]')}catch{}
      if(records.some(r=>r.id!==account?.id&&r.username?.toLowerCase()===normalized)){e.preventDefault();e.stopImmediatePropagation();toast('Этот юзернейм уже занят. Сгенерируй другой или введи свой.');return}
      input.value=normalized;
    },true);
  });
  if($('#modalHost'))usernameObserver.observe($('#modalHost'),{childList:true,subtree:true});
  const authForm=$('#authForm');
  const mascot=document.createElement('div');mascot.className='mello-mascot';mascot.innerHTML=`<img src="${emojiUrl('🧸')}" alt=""><span>Привет! Mello бережёт твой личный круг.</span>`;
  authForm?.querySelector('.auth-method-tabs')?.after(mascot);
  $('#emailInput')?.addEventListener('focus',()=>{mascot.classList.remove('closed');mascot.querySelector('img').src=emojiUrl('🧸')});
  $('#codeInput')?.addEventListener('focus',()=>{mascot.classList.add('closed');mascot.querySelector('img').src=emojiUrl('🙈')});
  new MutationObserver(()=>{const show=!!isRegister;$('#melloTermsAccept')?.classList.toggle('hidden',!show)}).observe($('#authTitle'),{childList:true,characterData:true,subtree:true});

  function attachTools() {
    const content=$('#settingsContent');if(!content||content.querySelector('.mello-v1-tools'))return;
    const panel=document.createElement('section');panel.className='mello-v1-tools';
    panel.innerHTML=`<h3>Mello · сообщество и защита</h3><p class="setting-help">Проект X Protocol · Украина</p><div class="mello-v1-grid"><button data-v1-action="security"><img src="${emojiUrl('🔒')}" alt="">Код и биометрия</button><button data-v1-action="style"><img src="${emojiUrl('🧊')}" alt="">Стиль сообществ</button><button data-v1-action="saved"><img src="${emojiUrl('🔖')}" alt="">Избранное</button><button data-v1-action="support"><img src="${emojiUrl('💬')}" alt="">Поддержка</button><button data-v1-action="banner-shop"><img src="${emojiUrl('🖼️')}" alt="">Магазин баннеров</button></div><p class="setting-help">Баланс: <b><span data-v1-stars>${account?.melloStars??10}</span> Stars</b> · <b><span data-v1-coins>${account?.melloCoins??0}</span> <img class="mello-gift-emoji" src="${emojiUrl('🪙')}" alt="монет"></b>. Реальные платежи здесь не подключены.</p>`;
    content.append(panel);
  }
  function refreshBalance(){const stars=$('[data-v1-stars]'),coins=$('[data-v1-coins]');if(stars)stars.textContent=account?.melloStars??10;if(coins)coins.textContent=account?.melloCoins??0;}
  $('#settingsBtn')?.addEventListener('click',()=>setTimeout(attachTools,60));
  const tabs=$('.tabs');if(tabs&&!tabs.querySelector('[data-filter="channels"]'))tabs.insertAdjacentHTML('beforeend','<button class="tab" data-filter="channels">Каналы</button>');
  document.addEventListener('click',e=>{
    const nav=e.target.closest('.rail-btn[title="Чаты"],.rail-btn[title="Каналы"]');if(!nav)return;
    e.preventDefault();e.stopImmediatePropagation();if($('#appView')?.classList.contains('chat-open'))returnToChatList();filter=nav.title==='Каналы'?'channels':'all';
    document.querySelectorAll('.rail-btn').forEach(button=>button.classList.toggle('active',button===nav));
    document.querySelectorAll('.tab').forEach(button=>button.classList.toggle('active',button.dataset.filter===filter));
    window.renderChats();
  },true);
  document.addEventListener('click',e=>{
    const action=e.target.closest('[data-v1-action]')?.dataset.v1Action;if(!action)return;
    if(action==='security')setPinDialog();
    if(action==='style'){document.body.classList.toggle('community-mode');localStorage.setItem('mello.communityStyle',document.body.classList.contains('community-mode')?'1':'0');toast(document.body.classList.contains('community-mode')?'Включён стиль сообществ':'Включён классический Liquid Glass')}
    if(action==='saved')openSpecialChat('mello-saved');
    if(action==='support')openSpecialChat('mello-support');
    if(action==='banner-shop')openBannerShop();
  });
  document.addEventListener('click',e=>{
    const button=(e.target instanceof Element?e.target:e.target?.parentElement)?.closest('#earningsBtn');if(!button)return;
    e.preventDefault();e.stopImmediatePropagation();
    document.querySelectorAll('.rail-btn').forEach(item=>item.classList.toggle('active',item===button));
    openEarnings();
  },true);
  if(localStorage.getItem('mello.communityStyle')==='1')document.body.classList.add('community-mode');
  function openSpecialChat(id){ensureSystemChats();const chat=chats.find(c=>c.id===id);if(chat)openChat(chat.id)}

  function openEarnings(){
    const panel=showModal(`<section class="mello-dialog"><div class="modal-top"><div><h2>Заработок и награды</h2><p>Это демонстрационный баланс Mello, не реальные деньги.</p></div><button type="button" class="close" data-v1-close aria-label="Закрыть">×</button></div><p>Баланс: <b>${account?.melloCoins??0} монет</b> · <b>${account?.melloStars??10} Stars</b></p><p>Настоящая реклама, рекламная сеть и вывод средств пока не подключены. Демо-награда начисляет внутренние баллы для макета.</p><button type="button" class="primary" data-earn-demo>Показать демо-награду · +300 монет · +1 Star</button><p class="setting-help">X Protocol — название проекта; компания пока не зарегистрирована.</p></section>`,e=>{if(e.target.closest('[data-earn-demo]')){panel?.remove();watchDemoAd()}});
    return panel;
  }

  function watchDemoAd(){
    let seconds=8;
    const panel=showModal(`<section class="mello-dialog"><div class="modal-top"><h2>Демо-награда</h2><span class="mello-stars-badge"><img src="${emojiUrl('⭐')}" alt="">+1 <img src="${emojiUrl('🪙')}" alt="">+300</span></div><p>Рекламного ролика здесь нет. Таймер только показывает механику; после него начислятся внутренние баллы, не деньги.</p><div style="height:8px;border-radius:99px;background:#ffffff16;overflow:hidden"><i id="adProgress" style="display:block;width:0;height:100%;background:#80e6a9;transition:width 1s linear"></i></div><p id="adTimer">Осталось ${seconds} секунд</p><button type="button" class="primary" id="adClaim" disabled>Получить демо-награду</button></section>`);
    const timer=$('#adTimer'),progress=$('#adProgress'),claim=$('#adClaim');clearInterval(rewardTimer);rewardTimer=setInterval(()=>{seconds--;if(timer)timer.textContent=seconds?`Осталось ${seconds} секунд`:'Готово!';if(progress)progress.style.width=`${(8-seconds)/8*100}%`;if(seconds<=0){clearInterval(rewardTimer);if(claim){claim.disabled=false;claim.textContent='Забрать награду'}}},1000);
    claim?.addEventListener('click',()=>{account.melloStars=(account.melloStars??10)+1;account.melloCoins=(account.melloCoins??0)+300;save();refreshBalance();panel?.remove();toast('Демо-баланс: +1 Star и +300 монет')});
  }
  function openBannerShop(){
    const panel=showModal(`<section class="mello-dialog"><div class="modal-top"><div><h2>Баннеры профиля</h2><p>Статика стоит 2100 монет, анимация — 4200. Баланс пополняется демо-наградой в разделе «Заработок».</p></div><button class="close" data-v1-close>×</button></div><div class="mello-banner-shop-grid" style="margin-top:12px">${banners.map((b,i)=>{const unlocked=(account.unlockedBanners||[]).includes(b.file);const price=b.kind==='video'?4200:2100;const bg=b.kind==='image'&&b.file.endsWith('.jpg')?`url('./assets/banners/${b.file}')`:`linear-gradient(135deg,${b.gradient||['#08251b,#28684b,#192944','#102c37,#39809a,#202342','#132b20,#667444,#121e1a'][i-38]})`;const art=b.kind==='video'?`<video class="mello-shop-video" data-video-src="./assets/banner-videos/${b.file}" muted loop autoplay playsinline preload="none" aria-label="${escape(b.title)}"></video>`:'';return `<article class="mello-banner-shop-card"><div class="mello-banner-shop-art ${b.kind==='video'?'mello-video-art':''} ${b.kind==='image'&&!b.file.endsWith('.jpg')?'mello-liquid-art':''}" style="background-image:${b.kind==='video'?'none':`linear-gradient(#07150c22,#07150c22),${bg}`}" ${b.kind==='video'?'data-video-card':''}>${art}</div><div class="mello-banner-shop-meta"><span>${escape(b.title)}</span><button type="button" data-buy-banner="${i}" ${unlocked?'disabled':''}>${unlocked?'Есть':(b.kind==='video'?'Купить · 4200 монет':'Купить · 2100 монет')}</button></div></article>`}).join('')}</div><h3 style="margin:17px 0 4px;font-size:12px">Пакеты Stars</h3><p>Реальная покупка появится после подключения магазина и платёжного провайдера. Пакеты $0.99, $1.99 и $4.99 — макет.</p><div class="mello-quick-actions"><button disabled>50 Stars · $0.99</button><button disabled>120 Stars · $1.99</button><button disabled>350 Stars · $4.99</button></div></section>`,e=>{
      const buy=e.target.closest('[data-buy-banner]');if(!buy)return;
      const item=banners[Number(buy.dataset.buyBanner)];const price=item.kind==='video'?4200:2100;
      account.unlockedBanners=account.unlockedBanners||[];if(account.unlockedBanners.includes(item.file))return;if((account.melloCoins||0)<price){toast("Не хватает монет. Открой раздел «Заработок».");return}account.melloCoins-=price;account.unlockedBanners.push(item.file);save();refreshBalance();toast(`Баннер «${item.title}» куплен`);openBannerShop();
    });
    const videos=[...panel.querySelectorAll('[data-video-card]')];
    if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(!entry.isIntersecting)return;const video=entry.target.querySelector('video[data-video-src]');if(video&&!video.src){video.src=video.dataset.videoSrc;video.play().catch(()=>{})}observer.unobserve(entry.target)}),{root:panel,rootMargin:'100px'});videos.forEach(card=>observer.observe(card))}
    else videos.forEach(card=>{const video=card.querySelector('video');video.src=video.dataset.videoSrc;video.play().catch(()=>{})});
    return panel;
  }  window.openMelloBannerShop=openBannerShop;

  // One-click block controls on other users' profile cards.
  document.addEventListener('click',e=>{
    const block=e.target.closest('[data-block-user]');if(!block)return;
    const id=block.dataset.blockUser;if(!id)return;
    const blocked=new Set(account.blockedUsers||[]);blocked.has(id)?blocked.delete(id):blocked.add(id);account.blockedUsers=[...blocked];save();toast(blocked.has(id)?'Пользователь добавлен в чёрный список':'Пользователь разблокирован');$('#modalHost').replaceChildren();renderChats();const active=chats.find(c=>c.id===current);if(active?.personId===id)openChat(current);
  });
  const originalOpenChat=window.openChat||openChat;
  let lastChat=null;
  window.openChat=function(id){
    ensureSystemChats();
    if(!lastChat&&id)history.pushState({melloChat:id},'','#chat');
    lastChat=id;
    originalOpenChat(id);
    $('#chatHead [data-maxim-tone]')?.remove();
    const chat=chats.find(c=>c.id===id);
    if(chat?.id==='mello-support'){$('#conversationHead small')?.insertAdjacentHTML('afterbegin','<span class="mello-support-badge">MELLO</span>');}
    if(chat?.id==='mello-saved'){$('#conversationHead small')?.insertAdjacentHTML('afterbegin','<span class="mello-support-badge">ТОЛЬКО ТЫ</span>');}
    if(chat?.id==='mello-maxim'){
      const head=$('#chatHead'),actions=head?.querySelector('.head-actions');
      let toneButton=head?.querySelector('[data-maxim-tone]');
      if(head&&!toneButton){toneButton=document.createElement('button');toneButton.type='button';toneButton.dataset.maximTone='1';toneButton.style.cssText='margin-left:auto;border:1px solid #ffffff20;border-radius:999px;padding:8px 12px;background:#ffffff0a;color:#eafff2;font:inherit;font-size:12px;cursor:pointer';if(actions)head.insertBefore(toneButton,actions);else head.appendChild(toneButton);}
      if(toneButton)toneButton.textContent=`Тон: ${account.melloMaximTone==='sharp'?'Резкий + мат':'Мягкий'}`;
    }
  };
  document.addEventListener('click',e=>{const target=e.target instanceof Element?e.target:e.target?.parentElement;if(!target?.closest('[data-maxim-tone]'))return;account.melloMaximTone=account.melloMaximTone==='sharp'?'soft':'sharp';save();window.openChat('mello-maxim');toast(`Помощь от ИИ отвечает ${account.melloMaximTone==='sharp'?'резко, можно с матом':'мягко'}`)});
  $('#backBtn')?.addEventListener('click',()=>{lastChat=null;},true);
  window.addEventListener('popstate',()=>{if(current){lastChat=null;$('#backBtn')?.click();}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&current){lastChat=null;$('#backBtn')?.click();}});

  const oldMessageMarkup=window.messageMarkup||messageMarkup;
  window.messageMarkup=function(m){
    const chat=chats.find(c=>c.id===current),blocked=new Set(account?.blockedUsers||[]);
    if(!m.mine&&m.authorId&&blocked.has(m.authorId))return '';
    if(chat?.type==='personal'&&blocked.has(chat.personId)&&!m.mine)return '';
    if(m.role)return `<div class="bubble"><span class="mello-support-badge">${escape(m.role)}${m.role==='Бот'?' · АВТООТВЕТ':''}</span>${escape(m.text||'')}<time>${escape(m.time||'')}</time></div>`;
    if(m.kind==='mello-gift'){
      const status=m.mine?'Ожидает':'Забран';
      return `<div class="mello-gift-bubble ${m.mine?'mine':''}"><div class="mello-gift-bubble-main"><img src="${emojiUrl(m.emoji)}" alt="${escape(m.giftName)}"><span>${escape(m.giftName)}</span></div><small>Подарок · ${m.cost} Stars · ${status}</small><time>${escape(m.time||'')}</time></div>`;
    }
    const text=String(m.text||'').trim();
    if(text&&/^\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?)*$/u.test(text))return `<div class="big-emoji-message"><img src="${emojiUrl(text)}" alt="${escape(text)}"><time>${escape(m.time||'')} ${m.mine?'✓✓':''}</time></div>`;
    return oldMessageMarkup(m);
  };

  const messageForm=$('#composer'),oldMessageSubmit=messageForm?.onsubmit;
  if(messageForm&&oldMessageSubmit)messageForm.onsubmit=function(e){
    const old=current,chat=chats.find(c=>c.id===old),n=chat?.messages.length||0;
    const input=$('#messageInput'),draft=String(input?.value||'').trim();
    oldMessageSubmit.call(this,e);
    if(!chat||chat.messages.length===n)return;
    if(chat.id==='mello-support'){
      setTimeout(()=>{chat.messages.push({text:'Спасибо! Это демо-чат: обращение пока не отправляется команде поддержки.',time:timeNow(),mine:false,role:'Мелло'});save();openChat(chat.id)},250);
      return;
    }
    if(chat.id!=='mello-maxim')return;
    const tone=account.melloMaximTone==='sharp'?'РЕЗКИЙ ТОН: отвечай коротко, прямо и энергично, максимум 1–3 предложения. Допускается умеренный русский мат как разговорная эмоциональная окраска; не оскорбляй собеседника лично, не унижай и не угрожай.':'МЯГКИЙ ТОН: отвечай тепло и доброжелательно, тоже кратко — максимум 1–3 предложения, если пользователь не просит подробностей.';
    const typing={text:'ИИ отвечает…',time:timeNow(),mine:false,role:'Помощь от ИИ',typing:true};
    chat.messages.push(typing);save();openChat(chat.id);
    const conversation=chat.messages.filter(m=>!m.typing&&m.text).slice(-14).map(m=>({role:m.mine?'user':'assistant',content:String(m.text).slice(0,5000)}));
    if(conversation.length){const last=conversation[conversation.length-1];last.content=`[Стиль ответа: ${tone}]\n\n${last.content}`;}
    fetch('https://wild-meadow-76d1.phujna56.workers.dev',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:conversation}),signal:typeof AbortSignal.timeout==='function'?AbortSignal.timeout(45000):undefined})
      .then(async response=>{const data=await response.json().catch(()=>({}));if(!response.ok||typeof data.reply!=='string')throw new Error(data.error||'Сервис временно недоступен');return data.reply.trim()})
      .then(reply=>{chat.messages=chat.messages.filter(m=>m!==typing);chat.messages.push({text:reply,time:timeNow(),mine:false,role:'Помощь от ИИ'});save();if(current===chat.id)openChat(chat.id);})
      .catch(()=>{chat.messages=chat.messages.filter(m=>m!==typing);chat.messages.push({text:'Сейчас не получилось подключиться к ИИ. Попробуй отправить ещё раз чуть позже.',time:timeNow(),mine:false,role:'Максим'});save();if(current===chat.id)openChat(chat.id);});
  };

  const saveAdminRole=()=>{
    const chat=chats.find(c=>c.id===current);if(!chat||!['groups','channels'].includes(chat.type))return;
    chat.ownerId=chat.ownerId||account.id||account.email||account.phone;chat.adminIds=Array.isArray(chat.adminIds)?chat.adminIds:[];
  };
  const quickSettings=$('#quickSettings');quickSettings?.addEventListener('click',()=>setTimeout(()=>{
    const modal=$('#modalHost .modal');if(!modal||modal.querySelector('[data-community-admin]'))return;
    const chat=chats.find(c=>c.id===current);if(!chat||!['groups','channels'].includes(chat.type))return;
    saveAdminRole();modal.insertAdjacentHTML('beforeend',`<section class="mello-v1-tools"><h3>Управление сообществом</h3><p class="setting-help">Владелец: ${escape(account.name||'Ты')} <span class="mello-owner-label">ВЛАДЕЛЕЦ</span></p><button class="setting-action" data-community-admin>Назначить демо-администратора</button><p class="setting-help">Права администратора и список участников сохраняются только в этом демо.</p></section>`);
    modal.querySelector('[data-community-admin]').onclick=()=>{const ids=chat.memberIds||[chat.personId],member=ids[0];if(!member){toast('Сначала добавь участника');return}chat.adminIds=[...new Set([...(chat.adminIds||[]),member])];save();toast(`${person(member).name} назначен администратором`)};
  },0));
  $('#conversationHead')?.addEventListener('click',()=>setTimeout(()=>{
    const chat=chats.find(c=>c.id===current),personPanel=$('#profileDrawer .drawer-person');
    if(!chat||!personPanel||!['groups','channels'].includes(chat.type))return;
    chat.ownerId=chat.ownerId||account.id||account.email||account.phone;save();
    if(!personPanel.querySelector('.mello-owner-label'))personPanel.insertAdjacentHTML('beforeend',`<p><span class="mello-owner-label">Владелец: ${escape(account.name||'ты')}</span></p>`);
    const ids=chat.memberIds||[chat.personId];
    $('#profileDrawer .drawer-members')?.querySelectorAll('.drawer-member').forEach((row,index)=>{const id=ids[index-1];if(id&&chat.adminIds?.includes(id)&&!row.querySelector('.mello-admin-label'))row.querySelector('b')?.insertAdjacentHTML('afterend',' <span class="mello-owner-label mello-admin-label">Админ</span>')});
  },0));

  // Reward account initialization for newly created Mello profiles.
  if(account&&!Number.isFinite(account.melloStars)){account.melloStars=10;account.melloCoins=0;save();}
  if(account){ensureSystemChats();if(!$('#appView').classList.contains('hidden'))window.renderChats();}
  if(localStorage.getItem('mello.communityStyle')==='1')document.body.classList.add('community-mode');
  if(account&&hasPin()&&!$('#appView').classList.contains('hidden')){
    $('#appView').classList.add('hidden');$('#modalHost').replaceChildren();lockScreen(()=>$('#appView').classList.remove('hidden'));
  }
  let backgroundLockTimer=0;
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){if(hasPin())backgroundLockTimer=setTimeout(()=>{if(document.hidden){$('#appView')?.classList.add('hidden');localStorage.setItem('mello.needsUnlock','1')}},30000);return}
    clearTimeout(backgroundLockTimer);
    if(localStorage.getItem('mello.needsUnlock')==='1'&&account&&hasPin()){localStorage.removeItem('mello.needsUnlock');lockScreen(()=>$('#appView')?.classList.remove('hidden'))}
  });
  if(/iPhone|iPad|iPod/i.test(navigator.userAgent))document.body.classList.add('mello-ios');else if(/Android/i.test(navigator.userAgent))document.body.classList.add('mello-android');
})();
