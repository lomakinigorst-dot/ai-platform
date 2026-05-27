(function () {
  'use strict';

  const API_BASE = window.AIPlatformConfig?.apiBase || 'http://ai.lomakin-igor.ru';
  const DOMAIN = window.AIPlatformConfig?.domain || '';
  const ASSISTANT_NAME = window.AIPlatformConfig?.name || 'Алексей';
  const AVATAR_URL = window.AIPlatformConfig?.avatar || null;

  if (!DOMAIN) { console.error('[AI Widget] domain не задан'); return; }

  // ── Утилиты ────────────────────────────────────────────────────
  function visitorId() {
    let id = localStorage.getItem('_aipw_vid');
    if (!id) { id = Math.random().toString(36).slice(2) + Date.now(); localStorage.setItem('_aipw_vid', id); }
    return id;
  }

  function getUtm() {
    const p = new URLSearchParams(location.search);
    return { utm_source: p.get('utm_source'), utm_medium: p.get('utm_medium'), utm_campaign: p.get('utm_campaign'), referrer: document.referrer };
  }

  // ── Стили ──────────────────────────────────────────────────────
  const css = `
    #aipw-btn {
      position:fixed; bottom:24px; right:24px; z-index:99999;
      width:60px; height:60px; border-radius:50%; cursor:pointer;
      background:#2563EB; border:none; box-shadow:0 4px 20px rgba(37,99,235,.45);
      display:flex; align-items:center; justify-content:center;
      transition:transform .2s,box-shadow .2s;
      overflow:hidden;
    }
    #aipw-btn:hover { transform:scale(1.08); box-shadow:0 6px 28px rgba(37,99,235,.55); }
    #aipw-btn img { width:100%; height:100%; object-fit:cover; border-radius:50%; }
    #aipw-btn svg { fill:white; }

    #aipw-bubble {
      position:fixed; bottom:94px; right:24px; z-index:99998;
      background:#fff; border-radius:16px 16px 4px 16px;
      padding:12px 16px; max-width:240px;
      box-shadow:0 4px 20px rgba(0,0,0,.12);
      font:14px/1.4 system-ui,sans-serif; color:#111;
      animation:aipw-pop .3s ease;
      cursor:pointer;
    }
    #aipw-bubble::after {
      content:''; position:absolute; bottom:-8px; right:18px;
      border:8px solid transparent; border-top-color:#fff; border-bottom:0;
    }

    #aipw-window {
      position:fixed; bottom:24px; right:24px; z-index:99999;
      width:380px; height:560px; border-radius:20px;
      background:#fff; box-shadow:0 8px 40px rgba(0,0,0,.18);
      display:none; flex-direction:column;
      font:14px/1.5 system-ui,sans-serif;
      overflow:hidden;
    }
    #aipw-window.open { display:flex; animation:aipw-slide .25s ease; }

    #aipw-header {
      background:#2563EB; color:#fff;
      padding:14px 16px; display:flex; align-items:center; gap:12px;
      flex-shrink:0;
    }
    #aipw-header-avatar {
      width:40px; height:40px; border-radius:50%; background:#fff3;
      overflow:hidden; flex-shrink:0;
      display:flex; align-items:center; justify-content:center;
    }
    #aipw-header-avatar img { width:100%; height:100%; object-fit:cover; }
    #aipw-header-info { flex:1; }
    #aipw-header-name { font-weight:600; font-size:15px; }
    #aipw-header-status { font-size:12px; opacity:.85; }
    #aipw-close {
      background:none; border:none; color:#fff; cursor:pointer;
      font-size:22px; line-height:1; padding:0; opacity:.8;
    }
    #aipw-close:hover { opacity:1; }

    #aipw-messages {
      flex:1; overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:10px;
      scroll-behavior:smooth;
    }
    .aipw-msg { display:flex; gap:8px; max-width:85%; }
    .aipw-msg.user { align-self:flex-end; flex-direction:row-reverse; }
    .aipw-msg-bubble {
      padding:10px 14px; border-radius:16px; line-height:1.5;
      word-break:break-word;
    }
    .aipw-msg.bot .aipw-msg-bubble { background:#F3F4F6; color:#111; border-radius:4px 16px 16px 16px; }
    .aipw-msg.user .aipw-msg-bubble { background:#2563EB; color:#fff; border-radius:16px 4px 16px 16px; }
    .aipw-typing span {
      display:inline-block; width:7px; height:7px; border-radius:50%; background:#9CA3AF;
      animation:aipw-bounce 1.2s infinite;
    }
    .aipw-typing span:nth-child(2) { animation-delay:.2s; }
    .aipw-typing span:nth-child(3) { animation-delay:.4s; }

    #aipw-input-area {
      padding:12px; border-top:1px solid #E5E7EB; display:flex; gap:8px; flex-shrink:0;
    }
    #aipw-input {
      flex:1; border:1px solid #E5E7EB; border-radius:12px;
      padding:10px 14px; font:14px system-ui,sans-serif; outline:none;
      resize:none; max-height:100px;
    }
    #aipw-input:focus { border-color:#2563EB; }
    #aipw-send {
      width:42px; height:42px; border-radius:12px; background:#2563EB;
      border:none; cursor:pointer; display:flex; align-items:center; justify-content:center;
      flex-shrink:0; transition:background .15s;
    }
    #aipw-send:hover { background:#1D4ED8; }
    #aipw-send:disabled { background:#93C5FD; cursor:default; }
    #aipw-send svg { fill:white; }

    #aipw-powered {
      text-align:center; padding:6px; font-size:11px; color:#9CA3AF;
      background:#FAFAFA; border-top:1px solid #F3F4F6; flex-shrink:0;
    }

    @keyframes aipw-pop { from{opacity:0;transform:scale(.9)} to{opacity:1;transform:scale(1)} }
    @keyframes aipw-slide { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
    @keyframes aipw-bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }

    @media(max-width:420px) {
      #aipw-window { width:100vw; height:100dvh; bottom:0; right:0; border-radius:0; }
    }
  `;

  // ── DOM ─────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // Кнопка
  const btn = document.createElement('button');
  btn.id = 'aipw-btn';
  btn.innerHTML = AVATAR_URL
    ? `<img src="${AVATAR_URL}" alt="${ASSISTANT_NAME}">`
    : `<svg viewBox="0 0 24 24" width="28" height="28"><path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z"/></svg>`;
  document.body.appendChild(btn);

  // Всплывашка
  const bubble = document.createElement('div');
  bubble.id = 'aipw-bubble';
  bubble.textContent = `Привет! Я ${ASSISTANT_NAME}, чем могу помочь?`;
  document.body.appendChild(bubble);

  // Окно чата
  const win = document.createElement('div');
  win.id = 'aipw-window';
  win.innerHTML = `
    <div id="aipw-header">
      <div id="aipw-header-avatar">
        ${AVATAR_URL ? `<img src="${AVATAR_URL}" alt="">` : `<svg viewBox="0 0 24 24" width="22" height="22" fill="white"><path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z"/></svg>`}
      </div>
      <div id="aipw-header-info">
        <div id="aipw-header-name">${ASSISTANT_NAME}</div>
        <div id="aipw-header-status">● Онлайн</div>
      </div>
      <button id="aipw-close">×</button>
    </div>
    <div id="aipw-messages"></div>
    <div id="aipw-input-area">
      <textarea id="aipw-input" placeholder="Напишите сообщение..." rows="1"></textarea>
      <button id="aipw-send">
        <svg viewBox="0 0 24 24" width="18" height="18"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>
      </button>
    </div>
    <div id="aipw-powered">Powered by AI Platform</div>
  `;
  document.body.appendChild(win);

  // ── Состояние ───────────────────────────────────────────────────
  let messages = [];
  let isOpen = false;
  let isLoading = false;

  const messagesEl = win.querySelector('#aipw-messages');
  const input = win.querySelector('#aipw-input');
  const sendBtn = win.querySelector('#aipw-send');

  // ── Функции ─────────────────────────────────────────────────────
  function open() {
    isOpen = true;
    win.classList.add('open');
    btn.style.display = 'none';
    bubble.style.display = 'none';
    if (messages.length === 0) addBotMessage(`Здравствуйте! Я ${ASSISTANT_NAME}. Чем могу помочь?`);
    input.focus();
  }

  function close() {
    isOpen = false;
    win.classList.remove('open');
    btn.style.display = 'flex';
  }

  function addBotMessage(text) {
    const el = createMsgEl('bot', text);
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return el;
  }

  function addUserMessage(text) {
    messages.push({ role: 'user', content: text });
    const el = createMsgEl('user', text);
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function createMsgEl(role, text) {
    const wrap = document.createElement('div');
    wrap.className = `aipw-msg ${role}`;
    const bubble2 = document.createElement('div');
    bubble2.className = 'aipw-msg-bubble';
    bubble2.textContent = text;
    wrap.appendChild(bubble2);
    return wrap;
  }

  function showTyping() {
    const el = document.createElement('div');
    el.className = 'aipw-msg bot';
    el.id = 'aipw-typing';
    el.innerHTML = '<div class="aipw-msg-bubble aipw-typing"><span></span><span></span><span></span></div>';
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return el;
  }

  async function sendMessage(text) {
    if (isLoading || !text.trim()) return;
    isLoading = true;
    sendBtn.disabled = true;
    addUserMessage(text);
    input.value = '';
    input.style.height = 'auto';

    const typingEl = showTyping();

    try {
      const utm = getUtm();
      const res = await fetch(`${API_BASE}/api/v1/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_domain: DOMAIN,
          visitor_id: visitorId(),
          messages: messages.slice(-20),
          ...utm,
        }),
      });

      typingEl.remove();

      if (!res.ok) throw new Error('Ошибка сервера');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let botText = '';
      const botEl = addBotMessage('');
      const botBubble = botEl.querySelector('.aipw-msg-bubble');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.text) { botText += data.text; botBubble.textContent = botText; }
            if (data.done) break;
          } catch {}
        }
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }

      messages.push({ role: 'assistant', content: botText });

    } catch (e) {
      typingEl.remove();
      addBotMessage('Извините, произошла ошибка. Попробуйте ещё раз.');
    } finally {
      isLoading = false;
      sendBtn.disabled = false;
      input.focus();
    }
  }

  // ── События ─────────────────────────────────────────────────────
  btn.addEventListener('click', open);
  bubble.addEventListener('click', open);
  win.querySelector('#aipw-close').addEventListener('click', close);

  sendBtn.addEventListener('click', () => sendMessage(input.value));
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input.value); }
  });
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 100) + 'px';
  });

  // ── Автопоявление ───────────────────────────────────────────────
  const delay = window.AIPlatformConfig?.triggerDelay ?? 5000;
  if (delay > 0) {
    setTimeout(() => { if (!isOpen) bubble.style.display = 'block'; }, delay);
  }

  // Exit intent
  document.addEventListener('mouseleave', e => {
    if (e.clientY <= 0 && !isOpen) { bubble.style.display = 'block'; }
  });

})();
