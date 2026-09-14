// JUCA INFORMÁTICA — interações do site
document.addEventListener('DOMContentLoaded', () => {
    const y = document.getElementById('year'); if (y) y.textContent = new Date().getFullYear();
    const header = document.getElementById('siteHeader'); if (header) window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 10), { passive: true });
    const toggle = document.getElementById('menuToggle'), nav = document.getElementById('mainNav'); if (toggle && nav) { toggle.addEventListener('click', () => nav.classList.toggle('open')); nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open'))); }
    const openModal = id => document.getElementById(id)?.classList.add('open'), closeModal = id => document.getElementById(id)?.classList.remove('open');
    document.querySelectorAll('.servico-card[data-modal]').forEach(card => card.addEventListener('click', () => openModal(card.dataset.modal)));
    document.querySelectorAll('.fechar[data-fechar]').forEach(btn => btn.addEventListener('click', () => closeModal(btn.dataset.fechar)));
    document.querySelectorAll('.modal').forEach(m => m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); }));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') document.querySelectorAll('.modal.open').forEach(m => m.classList.remove('open')); });
    const form = document.getElementById('contactForm'); if (form) form.addEventListener('submit', e => { e.preventDefault(); const d = new FormData(form), nome = (d.get('nome') || '').toString().trim(), assunto = (d.get('assunto') || '').toString().trim(), msg = (d.get('mensagem') || '').toString().trim(), texto = `Olá! Me chamo ${nome}. ${assunto ? 'Assunto: ' + assunto + '. ' : ''}${msg}`; window.open('https://wa.me/5567996544981?text=' + encodeURIComponent(texto), '_blank'); const fm = document.getElementById('formMessage'); if (fm) fm.textContent = 'Abrimos o WhatsApp com sua mensagem. É só apertar enviar!'; });
    const chat = document.getElementById('whatsappChat'), chatOpen = document.getElementById('whatsappChatOpen'), chatClose = document.getElementById('whatsappChatClose');
    if (chat && chatOpen) { chatOpen.addEventListener('click', () => { const aberto = chat.classList.toggle('open'); chatOpen.setAttribute('aria-expanded', aberto ? 'true' : 'false'); const aviso = chatOpen.querySelector('.whatsapp-notify'); if (aviso && aberto) aviso.remove(); }); chatClose?.addEventListener('click', () => { chat.classList.remove('open'); chatOpen.setAttribute('aria-expanded', 'false'); }); }
});
