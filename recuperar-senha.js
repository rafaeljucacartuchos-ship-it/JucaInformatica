'use strict';
const recoveryHash = new URLSearchParams(location.hash.slice(1));
const isRecoveryLink = recoveryHash.get('type') === 'recovery';
const sb = supabase.createClient('https://klpbqpcwdhuegcmoqspj.supabase.co', 'sb_publishable_bPZBZOZQs01sI9yR85lfkg_9wVK41xi');
const form = document.getElementById('passwordForm'), status = document.getElementById('recoveryStatus');
let ready = false;
function enableRecovery() { ready = true; form.hidden = false; status.textContent = 'Link confirmado. Digite sua nova senha.'; }
sb.auth.onAuthStateChange((event, session) => {
  if (event === 'PASSWORD_RECOVERY' && session) enableRecovery();
});
(async () => {
  try {
    const { data, error } = await sb.auth.getSession();
    if (isRecoveryLink && data?.session && !error) enableRecovery();
    if (!ready) status.textContent = 'Link inválido ou expirado. Volte ao login e solicite outro em “Esqueci minha senha”.';
  } catch { status.textContent = 'Não foi possível verificar o link. Confira sua conexão e abra novamente o link do e-mail.'; }
})();
form.addEventListener('submit', async e => {
  e.preventDefault();
  if (!ready) return;
  const password = document.getElementById('newPassword').value;
  if (password !== document.getElementById('confirmPassword').value) { status.textContent = 'As senhas não coincidem.'; return; }
  const button = document.getElementById('savePassword'); button.disabled = true;
  try {
    const { error } = await sb.auth.updateUser({ password });
    if (error) throw error;
    ready = false; form.hidden = true; form.reset();
    status.textContent = 'Senha alterada! Você já pode voltar ao login e entrar com a nova senha.';
    await sb.auth.signOut({ scope: 'local' });
  } catch { status.textContent = 'Não foi possível salvar a senha. Use uma senha diferente com pelo menos 8 caracteres ou solicite um novo link.'; }
  finally { button.disabled = false; }
});
