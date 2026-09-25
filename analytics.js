(function () {
  'use strict';
  if (/\/(admin|dashboard|portal|login|recuperar-senha)\.html$/.test(location.pathname)) return;
  const start = () => {
    const randomId = () => crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random();
    let sid;
    try {
      sid = sessionStorage.getItem('juca_analytics_session') || randomId();
      sessionStorage.setItem('juca_analytics_session', sid);
    } catch { sid = randomId(); }
    const client = window.supabase?.createClient('https://klpbqpcwdhuegcmoqspj.supabase.co', 'sb_publishable_bPZBZOZQs01sI9yR85lfkg_9wVK41xi', {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });
    if (!client) return;
    const page = location.pathname || '/', viewId = randomId();
    const device = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'Celular/tablet' : 'Computador';
    let source = 'Acesso direto';
    try { if (document.referrer) source = new URL(document.referrer).hostname; } catch {}
    const send = (type, details = {}, duration = null) => {
      Promise.resolve(client.from('site_events').insert({
        session_id: sid, event_type: type, page, duration_seconds: duration,
        details: { ...details, device, source, version: 2, view_id: viewId }
      })).catch(() => {});
    };
    send('page_view', { title: document.title });
    let elapsed = 0, visibleSince = document.hidden ? null : performance.now(), lastSent = 0;
    function heartbeat() {
      const now = performance.now();
      if (visibleSince !== null) elapsed += Math.max(0, now - visibleSince);
      visibleSince = document.hidden ? null : now;
      const seconds = Math.floor(elapsed / 1000);
      if (seconds > lastSent) { send('time_active', {}, seconds); lastSent = seconds; }
    }
    setInterval(() => { if (!document.hidden) heartbeat(); }, 10000);
    document.addEventListener('visibilitychange', heartbeat);
    window.addEventListener('pagehide', () => { heartbeat(); visibleSince = null; });
    window.addEventListener('pageshow', () => { visibleSince = document.hidden ? null : performance.now(); });
    document.addEventListener('click', e => {
      const el = e.target.closest('a,button,[data-brand]');
      if (!el) return;
      const href = el.getAttribute('href') || '';
      const label = (el.innerText || '').trim().slice(0, 100);
      if (/^https:\/\/wa\.me\//i.test(href)) send('whatsapp_click', { label, href });
      else if (el.id === 'whatsappChatOpen') {
        if (el.getAttribute('aria-expanded') !== 'true') send('chat_open', { label });
      } else if (el.matches('[data-brand]')) send('information_opened', { brand: el.dataset.brand, label });
      else if (href.startsWith('#')) send('navigation', { target: href, label });
    }, true);
    document.addEventListener('juca:whatsapp', () => send('whatsapp_click', {
      label: 'Formulário de orçamento', href: 'https://wa.me/5567996544981'
    }));
  };
  if (window.supabase) start();
  else {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
    script.onload = start; document.head.appendChild(script);
  }
})();
