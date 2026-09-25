'use strict';
const sb = supabase.createClient('https://klpbqpcwdhuegcmoqspj.supabase.co', 'sb_publishable_bPZBZOZQs01sI9yR85lfkg_9wVK41xi');
const $ = id => document.getElementById(id);
function message(id, text, error = false) { $(id).textContent = text; $(id).className = 'auth-msg ' + (error ? 'err' : 'ok'); }
sb.auth.getSession().then(({ data }) => { if (data?.session) location.replace('portal.html'); }).catch(() => {});
$('loginForm').addEventListener('submit', async e => {
  e.preventDefault(); $('btnLogin').disabled = true; message('loginMsg', 'Entrando...');
  try {
    const { error } = await sb.auth.signInWithPassword({ email: $('email').value.trim(), password: $('senha').value });
    if (error) {
      message('loginMsg', error.code === 'invalid_credentials' || error.message === 'Invalid login credentials'
        ? 'E-mail ou senha incorretos.' : 'Não foi possível entrar. Tente novamente em instantes.', true);
    } else location.replace('portal.html');
  } catch { message('loginMsg', 'Falha de conexão. Confira sua internet e tente novamente.', true); }
  finally { $('btnLogin').disabled = false; }
});
$('forgotPassword').onclick = () => {
  $('recoveryPanel').hidden = false; $('loginForm').hidden = true; $('forgotPassword').hidden = true;
  $('recoveryEmail').value = $('email').value; $('recoveryEmail').focus();
};
$('backToLogin').onclick = () => {
  $('recoveryPanel').hidden = true; $('loginForm').hidden = false; $('forgotPassword').hidden = false; $('email').focus();
};
$('recoveryForm').addEventListener('submit', async e => {
  e.preventDefault(); $('sendRecovery').disabled = true; message('recoveryMsg', 'Solicitando link...');
  try {
    const redirectTo = new URL('recuperar-senha.html', location.href).href;
    const { error } = await sb.auth.resetPasswordForEmail($('recoveryEmail').value.trim(), { redirectTo });
    if (error) throw error;
    message('recoveryMsg', 'Se este e-mail estiver cadastrado, você receberá um link para criar uma nova senha. Confira também a pasta de spam.');
  } catch { message('recoveryMsg', 'Não foi possível solicitar o link. Aguarde alguns instantes e tente novamente.', true); }
  finally { $('sendRecovery').disabled = false; }
});
