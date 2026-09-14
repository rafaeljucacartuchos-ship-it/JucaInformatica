// JUCA INFORMÁTICA — interações do site
document.addEventListener('DOMContentLoaded', () => {
    // ano no rodapé
    const y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();

    // sombra no header ao rolar
    const header = document.getElementById('siteHeader');
    if (header) {
        window.addEventListener('scroll', () => {
            header.classList.toggle('scrolled', window.scrollY > 10);
        }, { passive: true });
    }

    // menu mobile
    const toggle = document.getElementById('menuToggle');
    const nav = document.getElementById('mainNav');
    if (toggle && nav) {
        toggle.addEventListener('click', () => nav.classList.toggle('open'));
        nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
    }

    // modais de serviços
    const openModal = id => document.getElementById(id)?.classList.add('open');
    const closeModal = id => document.getElementById(id)?.classList.remove('open');
    document.querySelectorAll('.servico-card[data-modal]').forEach(card => {
        card.addEventListener('click', () => openModal(card.dataset.modal));
    });
    document.querySelectorAll('.fechar[data-fechar]').forEach(btn => {
        btn.addEventListener('click', () => closeModal(btn.dataset.fechar));
    });
    document.querySelectorAll('.modal').forEach(m => {
        m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); });
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') document.querySelectorAll('.modal.open').forEach(m => m.classList.remove('open'));
    });

    // formulário de contato → WhatsApp
    const form = document.getElementById('contactForm');
    if (form) {
        form.addEventListener('submit', e => {
            e.preventDefault();
            const d = new FormData(form);
            const nome = (d.get('nome') || '').toString().trim();
            const assunto = (d.get('assunto') || '').toString().trim();
            const msg = (d.get('mensagem') || '').toString().trim();
            const texto = `Olá! Me chamo ${nome}. ${assunto ? 'Assunto: ' + assunto + '. ' : ''}${msg}`;
            window.open('https://wa.me/5567996544981?text=' + encodeURIComponent(texto), '_blank');
            const fm = document.getElementById('formMessage');
            if (fm) fm.textContent = 'Abrimos o WhatsApp com sua mensagem. É só apertar enviar!';
        });
    }
});
