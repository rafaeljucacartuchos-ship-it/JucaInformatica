document.addEventListener('DOMContentLoaded', () => {
  const track = document.getElementById('productTrack');
  if (track) {
    const slides = [...track.children], pause = document.getElementById('productsPause');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let index = 0, paused = reduced.matches;
    track.classList.add('photo-banner');
    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        const active = i === index;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', String(!active));
        slide.inert = !active;
      });
      document.getElementById('productPosition').textContent = (index + 1) + ' de ' + slides.length;
    }
    function updatePause() {
      pause.textContent = paused ? 'Reproduzir' : 'Pausar';
      pause.setAttribute('aria-label', paused ? 'Iniciar rotação automática' : 'Pausar rotação automática');
    }
    document.getElementById('productsPrev').onclick = () => show(index - 1);
    document.getElementById('productsNext').onclick = () => show(index + 1);
    pause.onclick = () => { paused = !paused; updatePause(); };
    track.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); show(index + (e.key === 'ArrowRight' ? 1 : -1)); }
    });
    reduced.addEventListener('change', () => { paused = reduced.matches; updatePause(); });
    setInterval(() => {
      const bounds = track.getBoundingClientRect();
      if (!paused && !document.hidden && !track.contains(document.activeElement) && bounds.top < innerHeight && bounds.bottom > 0) show(index + 1);
    }, 4000);
    show(0); updatePause();
  }
  const year = document.getElementById('year'); if (year) year.textContent = new Date().getFullYear();
  const header = document.getElementById('siteHeader');
  if (header) window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 10), { passive: true });
  const toggle = document.getElementById('menuToggle'), nav = document.getElementById('mainNav');
  function menu(open) {
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  }
  if (toggle && nav) {
    toggle.addEventListener('click', () => menu(!nav.classList.contains('open')));
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => menu(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('open')) { menu(false); toggle.focus(); } });
  }
  const modal = document.getElementById('brandModal');
  if (modal) {
    let opener = null, background = [], wasOpen = false;
    const focusables = () => [...modal.querySelectorAll('button,a[href],input,select,textarea,[tabindex="0"]')].filter(el => !el.disabled);
    new MutationObserver(() => {
      const open = modal.classList.contains('open');
      if (open === wasOpen) return;
      wasOpen = open;
      document.body.classList.toggle('modal-open', open);
      if (open) {
        opener = document.activeElement;
        background = [...document.body.children].filter(el => el !== modal && !['SCRIPT','STYLE'].includes(el.tagName)).map(el => [el, el.inert]);
        background.forEach(([el]) => { el.inert = true; });
        document.getElementById('brandModalClose').focus();
      } else {
        background.forEach(([el, inert]) => { el.inert = inert; });
        opener?.focus();
      }
    }).observe(modal, { attributes: true, attributeFilter: ['class'] });
    modal.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.preventDefault(); closeBrand(); }
      if (e.key !== 'Tab') return;
      const elements = focusables(), first = elements[0], last = elements.at(-1);
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }
  const form = document.getElementById('contactForm');
  if (form) form.addEventListener('submit', e => {
    e.preventDefault();
    const data = new FormData(form);
    const name = (data.get('nome') || '').toString().trim();
    const subject = (data.get('assunto') || '').toString().trim();
    const message = (data.get('mensagem') || '').toString().trim();
    const text = 'Olá! Me chamo ' + name + '. Assunto: ' + subject + '. ' + message;
    const url = 'https://wa.me/5567996544981?text=' + encodeURIComponent(text);
    // Opening synchronously keeps this inside the browser's user gesture.
    const popup = window.open('', '_blank');
    const feedback = document.getElementById('formMessage');
    if (popup) {
      popup.opener = null; popup.location.href = url;
      document.dispatchEvent(new CustomEvent('juca:whatsapp'));
      feedback.textContent = 'Abrimos o WhatsApp com sua mensagem. É só apertar enviar!';
    } else {
      feedback.textContent = 'Seu navegador bloqueou a nova janela. ';
      const link = document.createElement('a'); link.href = url; link.target = '_blank'; link.rel = 'noopener'; link.textContent = 'Continuar no WhatsApp';
      feedback.append(link);
    }
  });
  const chat = document.getElementById('whatsappChat'), chatOpen = document.getElementById('whatsappChatOpen'), chatClose = document.getElementById('whatsappChatClose');
  if (chat && chatOpen) {
    chatOpen.addEventListener('click', () => {
      const open = chat.classList.toggle('open');
      chatOpen.setAttribute('aria-expanded', String(open));
      if (open) chatOpen.querySelector('.whatsapp-notify')?.remove();
    });
    chatClose?.addEventListener('click', () => { chat.classList.remove('open'); chatOpen.setAttribute('aria-expanded', 'false'); chatOpen.focus(); });
  }
});
if (!document.querySelector('script[src*="analytics.js"]')) {
  const script = document.createElement('script'); script.src = 'analytics.js?v=3'; document.body.appendChild(script);
}
