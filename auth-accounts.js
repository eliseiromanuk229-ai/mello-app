/* Local-only password sign-in and account switching for the Mello demo.
   Passwords are PBKDF2 hashes stored in this browser only; this is not server authentication. */
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const parse = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; } };
  const identityInput = $('#emailInput');
  const passwordLabel = $('#passwordInput')?.closest('label');
  const nameField = $('#nameField');
  const form = $('#authForm');
  if (!identityInput || !form) return;

  let records = parse('mello.accounts', []);
  let activeId = localStorage.getItem('mello.activeAccount') || '';
  let method = 'email';

  function suggestUsername(displayName) {
    const tr = { а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'i',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'shch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya' };
    let base = String(displayName || '').toLowerCase().split('').map(ch => tr[ch] ?? ch).join('').replace(/[^a-z0-9_]/g, '').slice(0, 15) || `mello${Date.now().toString().slice(-5)}`;
    if (base.length < 3) base = (base + 'mello').slice(0, 15);
    for (let n = 0; n < 1000; n++) {
      const suffix = n ? String(n + Math.floor(Math.random() * 9)).slice(-3) : '';
      const candidate = `@${(base.slice(0, 20 - suffix.length - (suffix ? 1 : 0)) + (suffix ? `_${suffix}` : '')).slice(0,20)}`;
      if (!records.some(r => r.username?.toLowerCase() === candidate.toLowerCase())) return candidate;
    }
    return `@mello${Date.now().toString().slice(-8)}`;
  }
  window.suggestMelloUsername = suggestUsername;

  // Import the single-account 0.8 demo once, then keep each account's chats apart.
  if (!Array.isArray(records)) records = [];
  const legacy = parse('mello.account', null);
  if (legacy && (legacy.email || legacy.phone) && !records.some(r => r.email === legacy.email && r.phone === legacy.phone)) {
    const imported = { ...legacy, id: legacy.id || `acc_${Date.now()}`, chats: parse('mello.chats', []) };
    records.push(imported);
  }
  records = records.map(r => {
    if (!r.id) r.id = `acc_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
    if (!Array.isArray(r.chats)) r.chats = [];
    return r;
  });
  if (!activeId || !records.some(r => r.id === activeId)) activeId = records[0]?.id || '';

  function writeActive() {
    if (!account || !activeId) return;
    const idx = records.findIndex(r => r.id === activeId);
    const previous = idx >= 0 ? records[idx] : {};
    const next = { ...previous, ...account, id: activeId, chats: Array.isArray(chats) ? chats : [] };
    delete next.password;
    if (idx < 0) records.push(next); else records[idx] = next;
    localStorage.setItem('mello.accounts', JSON.stringify(records));
    localStorage.setItem('mello.activeAccount', activeId);
    // Keep the old keys in sync so the existing prototype's startup code can migrate cleanly.
    localStorage.setItem('mello.account', JSON.stringify(next));
    localStorage.setItem('mello.chats', JSON.stringify(next.chats));
  }

  function restore(id) {
    const found = records.find(r => r.id === id);
    if (!found) return false;
    activeId = found.id;
    account = { ...found };
    chats = Array.isArray(found.chats) ? [...found.chats] : [];
    localStorage.setItem('mello.activeAccount', activeId);
    localStorage.setItem('mello.account', JSON.stringify(account));
    localStorage.setItem('mello.chats', JSON.stringify(chats));
    return true;
  }

  // Replace the single-account persistence functions used by the existing demo.
  window.save = function saveAllAccounts() { writeActive(); };
  window.read = function readActiveAccount() { if (activeId) restore(activeId); };
  window.enter = function enterActiveAccount() {
    window.read();
    if (!account) return;
    sessionStorage.removeItem('mello.forceLogin');
    $('#authView')?.classList.add('hidden');
    $('#appView')?.classList.remove('hidden');
    const welcome = $('#welcomeName'); if (welcome) welcome.textContent = account.name || 'Mello';
    window.updateSelfAvatar?.();
    window.renderChats?.();
    window.consumeMelloInvite?.();
  };

  function identityValue() {
    const raw = identityInput.value.trim();
    if (method === 'email') return raw.toLocaleLowerCase('ru');
    const digits = raw.replace(/[^0-9+]/g, '');
    return digits.startsWith('+') ? `+${digits.slice(1).replace(/\+/g, '')}` : digits.replace(/\+/g, '');
  }
  function validIdentity(value) {
    return method === 'email'
      ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      : /^\+?[0-9]{7,15}$/.test(value);
  }
  function matchesRecord(record, value) {
    return method === 'email' ? record.email?.toLocaleLowerCase('ru') === value : record.phone === value;
  }
  function setMethod(next) {
    method = next;
    identityInput.type = next === 'email' ? 'email' : 'tel';
    identityInput.autocomplete = next === 'email' ? 'email' : 'tel';
    identityInput.inputMode = next === 'email' ? 'email' : 'tel';
    identityInput.placeholder = next === 'email' ? 'name@example.com' : `${phoneRegionSelect.value.split(':')[1]} 123 456 7890`;
    $('#authIdentityLabel').textContent = next === 'email' ? 'Электронная почта' : 'Номер телефона';
    regionField.classList.toggle('hidden', next !== 'phone');
    phoneControl.classList.toggle('is-phone', next === 'phone');
    phoneControl.dataset.flag = flagForRegion(selectedRegion());
    phoneRegionFlag.textContent = flagForRegion(selectedRegion());
    if (next === 'phone' && !identityInput.value.trim()) updatePhonePrefix();
    document.querySelectorAll('[data-auth-method]').forEach(b => b.classList.toggle('selected', b.dataset.authMethod === next));
    resetChallenge();
  }
  function mode(register) {
    isRegister = !!register;
    $('#authTitle').textContent = register ? 'Создать аккаунт' : 'Войти в Mello';
    $('#authIntro').textContent = register ? 'Почта или номер нужны как логин. Создай постоянный пароль только из цифр, минимум 8.' : 'Войди с помощью почты или номера и постоянного цифрового пароля.';
    nameField.classList.toggle('hidden', !register);
    $('#nameInput').required = register;
    if (passwordLabel) passwordLabel.classList.remove('hidden');
    $('#passwordInput').required = true;
    $('#passwordInput').disabled = false;
    $('#passwordInput').autocomplete = register ? 'new-password' : 'current-password';
    $('#passwordInput').minLength = 8;
    $('#passwordInput').pattern = '[0-9]{8,}';
    $('#passwordInput').inputMode = 'numeric';
    $('#passwordInput').placeholder = 'Минимум 8 цифр';
    if (passwordLabel) passwordLabel.querySelector('span').textContent = 'Пароль (минимум 8 цифр)';
    $('#authSubmit').textContent = register ? 'Создать аккаунт' : 'Войти';
    $('#authSubmit').classList.remove('hidden');
    $('#switchAuth').textContent = register ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться';
    resetChallenge();
  }
  function resetChallenge() {
    const note = $('#demo-note');
    if (note) note.textContent = 'Это демо-вход по постоянному паролю из 8 или более цифр. Email или номер служит логином. Аккаунт и парольный хеш хранятся только в этом браузере и не синхронизируются между устройствами.';
  }

  const passwordRules = pass => /^[0-9]{8,}$/.test(pass);
  const toHex = bytes => Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
  async function makePassword(pass, salt = crypto.getRandomValues(new Uint8Array(16))) {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveBits']);
    const hash = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' }, key, 256);
    return { passwordSalt: toHex(salt), passwordHash: toHex(hash) };
  }
  async function verifyPassword(pass, record) {
    if (!record.passwordSalt || !record.passwordHash) return false;
    const salt = Uint8Array.from(record.passwordSalt.match(/.{2}/g) || [], part => parseInt(part, 16));
    const result = await makePassword(pass, salt);
    return result.passwordHash === record.passwordHash;
  }

  // Use a persistent numeric password with either an email or phone login.
  const identityLabel = identityInput.closest('label');
  identityLabel.querySelector('span').id = 'authIdentityLabel';
  const regionField = document.createElement('label');
  regionField.id = 'phoneRegionField'; regionField.className = 'field hidden';
  regionField.innerHTML = '<span>Регион</span><div class="phone-region-control"><b id="phoneRegionFlag" aria-hidden="true">🇺🇦</b><select id="phoneRegionSelect" aria-label="Выбери регион и код страны"></select></div>';
  identityLabel.before(regionField);
  const callingRegions = 'AF:+93 AL:+355 DZ:+213 AS:+1 AD:+376 AO:+244 AI:+1 AG:+1 AR:+54 AM:+374 AW:+297 AU:+61 AT:+43 AZ:+994 BS:+1 BH:+973 BD:+880 BB:+1 BY:+375 BE:+32 BZ:+501 BJ:+229 BM:+1 BT:+975 BO:+591 BA:+387 BW:+267 BR:+55 BN:+673 BG:+359 BF:+226 BI:+257 KH:+855 CM:+237 CA:+1 CV:+238 KY:+1 CF:+236 TD:+235 CL:+56 CN:+86 CO:+57 KM:+269 CG:+242 CD:+243 CK:+682 CR:+506 CI:+225 HR:+385 CU:+53 CY:+357 CZ:+420 DK:+45 DJ:+253 DM:+1 DO:+1 EC:+593 EG:+20 SV:+503 GQ:+240 ER:+291 EE:+372 ET:+251 FK:+500 FO:+298 FJ:+679 FI:+358 FR:+33 GF:+594 PF:+689 GA:+241 GM:+220 GE:+995 DE:+49 GH:+233 GI:+350 GR:+30 GL:+299 GD:+1 GP:+590 GU:+1 GT:+502 GN:+224 GW:+245 GY:+592 HT:+509 HN:+504 HK:+852 HU:+36 IS:+354 IN:+91 ID:+62 IR:+98 IQ:+964 IE:+353 IL:+972 IT:+39 JM:+1 JP:+81 JO:+962 KZ:+7 KE:+254 KI:+686 KP:+850 KR:+82 KW:+965 KG:+996 LA:+856 LV:+371 LB:+961 LS:+266 LR:+231 LY:+218 LI:+423 LT:+370 LU:+352 MO:+853 MK:+389 MG:+261 MW:+265 MY:+60 MV:+960 ML:+223 MT:+356 MH:+692 MQ:+596 MR:+222 MU:+230 YT:+262 MX:+52 FM:+691 MD:+373 MC:+377 MN:+976 ME:+382 MS:+1 MA:+212 MZ:+258 MM:+95 NA:+264 NR:+674 NP:+977 NL:+31 NC:+687 NZ:+64 NI:+505 NE:+227 NG:+234 NU:+683 NF:+672 MP:+1 NO:+47 OM:+968 PK:+92 PW:+680 PA:+507 PG:+675 PY:+595 PE:+51 PH:+63 PL:+48 PT:+351 PR:+1 QA:+974 RE:+262 RO:+40 RU:+7 RW:+250 KN:+1 LC:+1 VC:+1 WS:+685 SM:+378 ST:+239 SA:+966 SN:+221 RS:+381 SC:+248 SL:+232 SG:+65 SK:+421 SI:+386 SB:+677 SO:+252 ZA:+27 SS:+211 ES:+34 LK:+94 SD:+249 SR:+597 SZ:+268 SE:+46 CH:+41 SY:+963 TW:+886 TJ:+992 TZ:+255 TH:+66 TL:+670 TG:+228 TK:+690 TO:+676 TT:+1 TN:+216 TR:+90 TM:+993 TC:+1 TV:+688 UG:+256 UA:+380 AE:+971 GB:+44 US:+1 UY:+598 UZ:+998 VU:+678 VA:+39 VE:+58 VN:+84 VG:+1 VI:+1 YE:+967 ZM:+260 ZW:+263'.split(' ');
  const phoneRegionSelect = regionField.querySelector('select');
  const phoneRegionFlag = regionField.querySelector('#phoneRegionFlag');
  const flagForRegion = region => String.fromCodePoint(...region.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0)));
  const displayRegion = new Intl.DisplayNames([navigator.language || 'ru'], { type: 'region' });
  const localeRegion = (navigator.language || '').split('-')[1]?.toUpperCase();
  callingRegions.sort((a,b) => displayRegion.of(a.slice(0,2)).localeCompare(displayRegion.of(b.slice(0,2)), navigator.language || 'ru'));
  callingRegions.forEach(entry => { const [region,dial] = entry.split(':'); const option = document.createElement('option'); option.value = entry; option.textContent = `${flagForRegion(region)} ${displayRegion.of(region)} (${dial})`; phoneRegionSelect.append(option); });
  phoneRegionSelect.value = callingRegions.find(entry => entry.startsWith(`${localeRegion}:`)) || 'UA:+380';
  function selectedDial(){return phoneRegionSelect.value.split(':')[1]}
  function selectedRegion(){return phoneRegionSelect.value.split(':')[0]}
  let lastSelectedDial=selectedDial();
  function updatePhonePrefix(){if(method!=='phone')return;const dial=selectedDial(),digits=identityInput.value.replace(/\D/g,''),dialDigits=dial.slice(1),subscriber=digits.startsWith(dialDigits)?digits.slice(dialDigits.length):digits;identityInput.value=`${dial}${subscriber?` ${subscriber}`:' '}`;phoneRegionFlag.textContent=flagForRegion(selectedRegion())}
  phoneRegionSelect.addEventListener('change', () => { const digits=identityInput.value.replace(/\D/g,'');const oldPrefix=lastSelectedDial.slice(1);const subscriber=digits.startsWith(oldPrefix)?digits.slice(oldPrefix.length):digits;identityInput.value=`${selectedDial()}${subscriber?` ${subscriber}`:' '}`;lastSelectedDial=selectedDial();phoneControl.dataset.flag=flagForRegion(selectedRegion());phoneRegionFlag.textContent=flagForRegion(selectedRegion());identityInput.focus(); });
  identityInput.addEventListener('input', updatePhonePrefix);
  identityInput.addEventListener('keydown', event => {if(method!=='phone'||!['Backspace','Delete'].includes(event.key))return;const prefixLength=selectedDial().length;if(identityInput.selectionStart<prefixLength||(identityInput.selectionStart===prefixLength&&event.key==='Backspace'))event.preventDefault()});
  const phoneControl=document.createElement('div');phoneControl.className='phone-number-control';identityInput.before(phoneControl);phoneControl.append(identityInput);
  phoneControl.dataset.flag=flagForRegion(selectedRegion());
  const phoneStyle=document.createElement('style');phoneStyle.textContent='.phone-region-control{display:flex;align-items:center;gap:9px}.phone-region-control>b{font-size:21px;line-height:1}.phone-region-control select{flex:1;min-width:0}.phone-number-control{display:contents}.phone-number-control.is-phone{display:block;position:relative}.phone-number-control.is-phone:before{content:attr(data-flag);position:absolute;left:13px;top:50%;transform:translateY(-50%);z-index:1;font-size:18px}.phone-number-control.is-phone input{padding-left:43px!important;letter-spacing:.03em}.phone-number-control.is-phone input::selection{background:#62dd9a55}';document.head.append(phoneStyle);
  identityInput.type = 'email';
  identityInput.autocomplete = 'email';
  if (passwordLabel) passwordLabel.classList.add('hidden');
  $('#passwordInput').required = false;
  $('#passwordInput').disabled = true;
  identityLabel.insertAdjacentHTML('beforebegin', '<div class="auth-method-tabs"><button type="button" data-auth-method="email" class="selected">Email</button><button type="button" data-auth-method="phone">Номер телефона</button></div>');
  passwordLabel?.insertAdjacentHTML('afterend', '<label id="melloTermsAccept" class="mello-terms-accept hidden"><input type="checkbox" id="melloTermsCheck"><span>Я принимаю <button type="button" id="melloTermsOpen">Условия Mello</button> и <button type="button" id="melloRulesOpen">Правила сообщества</button>.</span></label>');
  const otpStyle = document.createElement('style');
  otpStyle.textContent = '.demo-note{margin:9px 0;padding:10px 12px;border:1px solid #ffffff18;border-radius:12px;background:#ffffff08;color:#bbd5c4;font-size:11px;line-height:1.5}.field select{width:100%;height:47px;border:1px solid #ffffff1b;border-radius:14px;background:#07110c;color:var(--text,#effcf4);padding:0 12px}';
  document.head.append(otpStyle);
  document.querySelectorAll('[data-auth-method]').forEach(b => b.onclick = () => setMethod(b.dataset.authMethod));
  $('#switchAuth').onclick = () => mode(!isRegister);
  const syncMelloTerms = () => $('#melloTermsAccept')?.classList.toggle('hidden', !isRegister);
  const switchAuthButton = $('#switchAuth');
  switchAuthButton.addEventListener('click', () => setTimeout(syncMelloTerms, 0));
  syncMelloTerms();
  form.addEventListener('submit', e => {
    if (isRegister && !$('#melloTermsCheck')?.checked) {
      e.preventDefault(); e.stopImmediatePropagation();
      toast('Для регистрации прими условия и правила Mello');
    }
  }, true);
  mode(false);

  form.onsubmit = async e => {
    e.preventDefault();
    const value = identityValue(), pass = $('#passwordInput').value;
    let firstPasswordSetup = false;
    if (!validIdentity(value)) { toast(method === 'email' ? 'Введи корректный email' : 'Введи номер с кодом страны'); return; }
    if (!passwordRules(pass)) { toast('Пароль должен состоять минимум из 8 цифр'); $('#passwordInput').focus(); return; }
    if (isRegister) {
      if (!$('#nameInput').value.trim()) { toast('Сначала введи имя'); $('#nameInput').focus(); return; }
      if (!passwordRules(pass)) { toast('Пароль должен состоять минимум из 8 цифр'); $('#passwordInput').focus(); return; }
      if (records.some(r => matchesRecord(r, value))) { toast('Этот email или номер уже добавлен. Переключись на вход.'); return; }
      const name = $('#nameInput').value.trim();
      const credentials = await makePassword(pass);
      const created = { id: `acc_${Date.now()}_${Math.random().toString(36).slice(2,7)}`, name, username: suggestUsername(name), avatar: '', email: method === 'email' ? value : '', phone: method === 'phone' ? value : '', chats: [], ...credentials, termsAcceptedAt: Date.now(), melloStars: 10, melloCoins: 0, blockedUsers: [], unlockedBanners: [] };
      records.push(created); activeId = created.id; account = { ...created }; chats = [];
    } else {
      const found = records.find(r => matchesRecord(r, value));
      if (!found) { toast('Аккаунт на этом устройстве не найден. Сначала зарегистрируйся.'); return; }
      if (found.passwordHash) {
        if (!(await verifyPassword(pass, found))) { toast('Неверный пароль'); $('#passwordInput').focus(); return; }
      } else if (found.password) {
        if (found.password !== pass) { toast('Неверный пароль'); $('#passwordInput').focus(); return; }
        Object.assign(found, await makePassword(pass)); delete found.password;
      } else {
        Object.assign(found, await makePassword(pass));
        firstPasswordSetup = true;
      }
      activeId = found.id; account = { ...found }; chats = Array.isArray(found.chats) ? [...found.chats] : [];
    }
    sessionStorage.removeItem('mello.forceLogin');
    writeActive();
    window.enter();
    toast(isRegister ? 'Демо-аккаунт создан' : firstPasswordSetup ? 'Постоянный пароль создан' : 'Вход выполнен');
  };

  window.leave = function leaveToAccountLogin() {
    writeActive();
    sessionStorage.setItem('mello.forceLogin', '1');
    current = null;
    $('#appView').classList.add('hidden');
    $('#authView').classList.remove('hidden');
    $('#passwordInput').value = '';
    mode(false);
  };
  $('#logout').onclick = window.leave;

  function refreshAccountView() {
    if (!account) return;
    const greeting = $('#welcomeName'); if (greeting) greeting.textContent = account.name || 'Mello';
    window.updateSelfAvatar?.();
    const activeLine = $('#accountSwitcherActive');
    if (activeLine) activeLine.textContent = account.name || account.email || account.phone || 'Текущий аккаунт';
  }
  function switchTo(id) {
    if (id === activeId || !records.some(r => r.id === id)) return;
    writeActive();
    if (!restore(id)) return;
    sessionStorage.removeItem('mello.forceLogin');
    $('#modalHost').replaceChildren();
    current = null;
    $('#welcome')?.classList.remove('hidden');
    $('#chatHead')?.classList.add('hidden');
    $('#messages')?.classList.add('hidden');
    $('#composer')?.classList.add('hidden');
    $('#appView')?.classList.remove('chat-open');
    $('#authView')?.classList.add('hidden');
    $('#appView')?.classList.remove('hidden');
    refreshAccountView();
    window.renderChats?.();
    toast(`Переключено на аккаунт ${account.name || account.email || account.phone}`);
  }
  function showAccounts() {
    writeActive();
    const modal = document.createElement('div');
    modal.className = 'modal-bg';
    modal.innerHTML = `<section class="modal account-switcher"><div class="modal-top"><h2>Аккаунты</h2><button class="close" type="button" data-close>×</button></div><p class="setting-help">Переключение работает только в этом браузере на этом устройстве.</p><div class="account-switcher-list">${records.map(r => `<button type="button" class="account-switcher-row ${r.id === activeId ? 'selected' : ''}" data-switch-id="${esc(r.id)}"><span class="account-switcher-avatar">${esc((r.name || 'M').trim().charAt(0).toUpperCase())}</span><span><b>${esc(r.name || 'Аккаунт')}</b><small>${esc(r.email || r.phone || '')}</small></span>${r.id === activeId ? '<i>✓</i>' : ''}</button>`).join('')}</div><button type="button" class="primary" data-add-account>＋ Добавить аккаунт</button><small id="accountSwitcherActive" class="setting-help"></small></section>`;
    $('#modalHost').replaceChildren(modal);
    window.MettoAnimations?.refresh(modal);
    modal.addEventListener('click', e => {
      if (e.target === modal || e.target.closest('[data-close]')) { $('#modalHost').replaceChildren(); return; }
      const id = e.target.closest('[data-switch-id]')?.dataset.switchId;
      if (id) switchTo(id);
      if (e.target.closest('[data-add-account]')) { $('#modalHost').replaceChildren(); window.leave(); mode(true); $('#nameInput').focus(); }
    });
    refreshAccountView();
  }
  window.showAccounts = showAccounts;

  // Reuse the logo and quick actions as convenient account switch entry points.
  const logo = $('#railProfile'); if (logo) { logo.title = 'Сменить аккаунт'; logo.setAttribute('aria-label', 'Сменить аккаунт'); logo.onclick = showAccounts; }
  const headActions = document.querySelector('.head-actions');
  if (headActions && !$('#headerAccountSwitch')) headActions.insertAdjacentHTML('afterbegin', '<button id="headerAccountSwitch" type="button" title="Сменить аккаунт" aria-label="Сменить аккаунт">⇄</button>');
  $('#headerAccountSwitch')?.addEventListener('click', showAccounts);
  const originalProfile = window.showProfile;
  if (originalProfile) {
    window.showProfile = function showProfileWithAccountContact() {
      originalProfile();
      const label = $('#profileForm label:nth-of-type(3) span');
      const contact = $('#profileForm label:nth-of-type(3) input');
      if (label) label.textContent = account.phone ? 'Номер телефона' : 'Электронная почта';
      if (contact) contact.value = account.email || account.phone || '';
    };
    $('#profileBtn').onclick = window.showProfile;
  }

  // Restore accounts after the prototype's original single-account startup code ran.
  localStorage.setItem('mello.accounts', JSON.stringify(records));
  if (activeId) restore(activeId);
  if (sessionStorage.getItem('mello.forceLogin') === '1') {
    $('#appView').classList.add('hidden'); $('#authView').classList.remove('hidden'); mode(false);
  } else if (account && !$('#appView').classList.contains('hidden')) refreshAccountView();
  if ($('#demo-note')) $('#demo-note').textContent = 'Демо: пароли и чаты хранятся только в этом браузере. Для настоящего входа с разных устройств понадобится сервер.';
})();
