(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const style = document.createElement('style');
  style.textContent = `
    .metto-message-menu{position:fixed;z-index:30;width:min(310px,calc(100vw - 24px));padding:8px;border:1px solid #ffffff20;border-radius:18px;background:#15231c;box-shadow:0 18px 55px #000b;animation:metto-menu-in .18s cubic-bezier(.2,.8,.2,1) both}
    .metto-reaction-row{display:flex;justify-content:space-around;gap:3px;padding:3px 2px 8px;border-bottom:1px solid #ffffff12;margin-bottom:4px}
    .metto-reaction-row button{width:38px;height:38px;border:0;border-radius:12px;background:transparent;font-size:20px;transition:transform .18s,background .18s}
    .metto-reaction-row button:hover{background:#ffffff12;transform:scale(1.15)}
    .metto-message-menu [data-message-action]{display:flex;align-items:center;gap:12px;width:100%;min-height:40px;padding:0 11px;border:0;border-radius:11px;background:transparent;color:#e7f5eb;text-align:left;font-size:13px}
    .metto-message-menu [data-message-action]:hover{background:#ffffff0d}
    .metto-message-menu [data-danger]{color:#ff9ca7}
    .metto-message-reactions{display:flex;gap:4px;margin-top:5px}
    .metto-message-reactions button{border:1px solid #ffffff1c;border-radius:11px;background:#ffffff0b;color:#e4f8eb;padding:2px 7px;font-size:12px}
    @keyframes metto-menu-in{from{opacity:0;transform:translateY(7px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}
    @media(max-width:600px){.metto-message-menu{left:12px!important;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));top:auto!important;width:auto;border-radius:22px;padding:10px;animation:metto-menu-sheet .24s cubic-bezier(.2,.8,.2,1) both}}
    @keyframes metto-menu-sheet{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
    @media(prefers-reduced-motion:reduce){.metto-message-menu{animation:none}.metto-reaction-row button{transition:none}}
  `;
  document.head.append(style);
  let replyDraft = null, menu = null, pressTimer = 0, startPoint = null;
  const reactionChoices = ['👍','❤️','😂','😮','😢','🔥'];

  function currentMessage(index) { const chat = chats.find(item => item.id === current); return { chat, message:chat?.messages?.[index], index }; }
  function paintReactions(root = $('#messages')) {
    if (!root) return;
    root.querySelectorAll('[data-message-index]').forEach(node => {
      const { message } = currentMessage(Number(node.dataset.messageIndex));
      let quote = node.querySelector('.metto-reply-quote');
      if (message?.replyTo != null) {
        const chat = chats.find(item => item.id === current), original = chat?.messages?.[message.replyTo];
        if (!quote) { quote = document.createElement('div'); quote.className = 'metto-reply-quote'; quote.style.cssText = 'padding:5px 8px;margin:0 0 6px;border-left:2px solid #8beab0;background:#ffffff08;border-radius:0 7px 7px 0;color:#bcd9c7;font-size:11px'; node.prepend(quote); }
        quote.textContent = `Ответ: ${String(original?.text || 'сообщение').slice(0,90)}`;
      } else quote?.remove();
      if (message?.edited && !node.querySelector('.metto-edited-label')) { const label=document.createElement('small'); label.className='metto-edited-label'; label.textContent='изменено'; label.style.cssText='display:block;color:#9eb7a7;font-size:9px;text-align:right'; const time=node.querySelector('time'); (time||node).before(label); }
      let tray = node.querySelector('.metto-message-reactions');
      if (!message?.reactions?.length) { tray?.remove(); return; }
      if (!tray) { tray = document.createElement('div'); tray.className = 'metto-message-reactions'; node.append(tray); }
      const counts = new Map(); message.reactions.forEach(value => counts.set(value,(counts.get(value)||0)+1));
      tray.innerHTML = [...counts].map(([emoji,count]) => `<button type="button" data-react-again="${esc(emoji)}">${esc(emoji)} ${count}</button>`).join('');
    });
  }
  const originalOpenChat = window.openChat;
  if (originalOpenChat) window.openChat = function(...args) {
    const result = originalOpenChat.apply(this,args);
    requestAnimationFrame(() => {
      const box = $('#messages'); if (!box) return;
      let index = 0;
      [...box.children].forEach(node => {
        if (node.classList.contains('day')) return;
        node.dataset.messageIndex = String(index++);
      });
      paintReactions(box);
    });
    return result;
  };

  function closeMenu() { menu?.remove(); menu = null; }
  function showMenu(target, index) {
    const { message } = currentMessage(index); if (!message) return;
    closeMenu(); menu = document.createElement('section'); menu.className = 'metto-message-menu'; menu.setAttribute('role','menu');
    menu.innerHTML = `<div class="metto-reaction-row" aria-label="Реакции">${reactionChoices.map(x=>`<button type="button" data-message-action="react" data-emoji="${x}" aria-label="Реакция ${x}">${x}</button>`).join('')}</div>
      <button type="button" data-message-action="reply">↩ <span>Ответить</span></button>
      ${message.mine ? '<button type="button" data-message-action="edit">✎ <span>Изменить</span></button>' : ''}
      <button type="button" data-message-action="pin">⌖ <span>${currentMessage(index).chat.pinnedMessageIndex===index?'Открепить':'Закрепить'}</span></button>
      <button type="button" data-message-action="copy">▢ <span>Копировать текст</span></button>
      ${message.mine ? '<button type="button" data-message-action="delete" data-danger="1">⌫ <span>Удалить у себя</span></button>' : ''}`;
    document.body.append(menu);
    if (innerWidth > 600) {
      const rect = target.getBoundingClientRect(), width = 310, left = Math.min(innerWidth-width-12,Math.max(12,rect.left)), top = Math.min(innerHeight-menu.offsetHeight-12,Math.max(12,rect.bottom+6));
      menu.style.left = `${left}px`; menu.style.top = `${top}px`;
    }
    menu.addEventListener('click', event => {
      const button = event.target.closest('[data-message-action]'); if (!button) return;
      const action = button.dataset.messageAction, { chat, message:msg } = currentMessage(index); if (!chat || !msg) return;
      if (action === 'react') { const emoji = button.dataset.emoji; msg.reactions ||= []; msg.reactions.push(emoji); save(); closeMenu(); window.openChat(chat.id); return; }
      if (action === 'reply') { replyDraft = { chatId:chat.id, index }; const input = $('#messageInput'); if (input) { input.placeholder = `Ответ на: ${String(msg.text||'сообщение').slice(0,36)}`; input.focus(); } closeMenu(); return; }
      if (action === 'edit') { const next = prompt('Измени своё сообщение',msg.text||''); if (next?.trim()) { msg.text=next.trim(); msg.edited=true; save(); closeMenu(); window.openChat(chat.id); } return; }
      if (action === 'pin') { chat.pinnedMessageIndex = chat.pinnedMessageIndex===index ? null : index; save(); closeMenu(); toast(chat.pinnedMessageIndex===null?'Сообщение откреплено':'Сообщение закреплено в этом чате'); return; }
      if (action === 'copy') { const text=String(msg.text||''); navigator.clipboard?.writeText(text).then(()=>toast('Текст скопирован')).catch(()=>toast(text?'Не удалось скопировать текст':'У сообщения нет текста')); closeMenu(); return; }
      if (action === 'delete') { if (confirm('Удалить это сообщение из локальной истории?')) { chat.messages.splice(index,1); save(); closeMenu(); window.openChat(chat.id); } }
    });
  }
  document.addEventListener('contextmenu', event => {
    const bubble = event.target.closest('#messages [data-message-index]'); if (!bubble) return;
    event.preventDefault(); showMenu(bubble,Number(bubble.dataset.messageIndex));
  });
  document.addEventListener('pointerdown', event => {
    const bubble = event.target.closest('#messages [data-message-index]'); if (!bubble || event.pointerType === 'mouse') return;
    startPoint = { x:event.clientX, y:event.clientY, bubble }; pressTimer = setTimeout(()=>{if(startPoint?.bubble===bubble)showMenu(bubble,Number(bubble.dataset.messageIndex));},520);
  }, {passive:true});
  document.addEventListener('pointermove', event => { if(startPoint&&Math.hypot(event.clientX-startPoint.x,event.clientY-startPoint.y)>12){clearTimeout(pressTimer);startPoint=null;} },{passive:true});
  document.addEventListener('pointerup',()=>{clearTimeout(pressTimer);startPoint=null;},{passive:true});
  document.addEventListener('click', event => {
    const again = event.target.closest('[data-react-again]');
    if (again) { const node=again.closest('[data-message-index]'),{chat,message}=currentMessage(Number(node?.dataset.messageIndex)); if(chat&&message){message.reactions||=[];message.reactions.push(again.dataset.reactAgain);save();paintReactions();} }
    if (menu && !event.target.closest('.metto-message-menu')) closeMenu();
  });
  $('#composer')?.addEventListener('submit', () => {
    if (!replyDraft || replyDraft.chatId!==current) return;
    setTimeout(()=>{const chat=chats.find(item=>item.id===replyDraft?.chatId),sent=chat?.messages?.at(-1);if(sent){sent.replyTo=replyDraft.index;save();}replyDraft=null;const input=$('#messageInput');if(input)input.placeholder='Написать сообщение…';},0);
  }, true);
})();
