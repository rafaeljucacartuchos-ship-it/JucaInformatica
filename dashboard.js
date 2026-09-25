'use strict';
const sb = supabase.createClient('https://klpbqpcwdhuegcmoqspj.supabase.co', 'sb_publishable_bPZBZOZQs01sI9yR85lfkg_9wVK41xi');
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let rows = [], authorized = false, requestId = 0;
const line = (label, value) => `<div class="list-item"><span>${esc(label)}</span><b>${value}</b></div>`;
function render() {
  const result = JucaMetrics.summarize(rows);
  $('stats').innerHTML = [
    ['Sessões', result.sessions], ['Páginas vistas', result.views.length],
    ['Tempo ativo médio por página', result.average === null ? 'Sem medição' : result.average + 's'],
    ['Balão de atendimento aberto', rows.filter(r => r.event_type === 'chat_open').length],
    ['Informações abertas', rows.filter(r => r.event_type === 'information_opened').length],
    ['Cliques para WhatsApp', result.clicks], ['Sessões que clicaram no WhatsApp', result.rate + '%'], ['Eventos', rows.length]
  ].map(([label, value]) => `<div class="dash-stat"><b>${value}</b><span>${label}</span></div>`).join('');
  const byDay = {};
  result.views.forEach(r => { const key = JucaMetrics.dayKey(r.occurred_at); byDay[key] = (byDay[key] || 0) + 1; });
  const days = Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b)).slice(-14);
  const max = Math.max(1, ...days.map(([, n]) => n));
  $('daily').innerHTML = days.map(([day, count]) => `<div class="bar" style="height:${Math.max(8, count / max * 170)}px" title="${day}: ${count} acessos"><small>${day.slice(8)}/${day.slice(5, 7)}</small></div>`).join('') || '<p class="hint">Sem dados</p>';
  $('funnel').innerHTML = [
    ['Entraram', result.sessions],
    ['Navegaram', new Set(rows.filter(r => r.event_type === 'navigation').map(r => r.session_id)).size],
    ['Abriram informações', new Set(rows.filter(r => r.event_type === 'information_opened').map(r => r.session_id)).size],
    ['Clicaram para ir ao WhatsApp', result.conversions]
  ].map(([label, value]) => line(label, value)).join('');
  function list(id, key) {
    const counts = new Map();
    const sessions = new Map(result.views.map(r => [r.session_id, r]));
    sessions.forEach(r => { const value = r.details?.[key] || 'Não identificado'; counts.set(value, (counts.get(value) || 0) + 1); });
    $(id).innerHTML = [...counts].sort((a, b) => b[1] - a[1]).slice(0, 8)
      .map(([label, value]) => line(label, value)).join('') || '<p class="hint">Sem dados</p>';
  }
  list('sources', 'source'); list('devices', 'device');
  const hours = {};
  result.views.forEach(r => {
    const hour = new Intl.DateTimeFormat('pt-BR', { timeZone: JucaMetrics.ZONE, hour: '2-digit', hourCycle: 'h23' }).format(new Date(r.occurred_at));
    hours[hour] = (hours[hour] || 0) + 1;
  });
  $('hours').innerHTML = Object.entries(hours).sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([hour, count]) => line(hour + 'h', count + ' páginas vistas')).join('') || '<p class="hint">Sem dados</p>';
}
async function load() {
  if (!authorized) return;
  const id = ++requestId;
  $('csv').disabled = true;
  $('stats').textContent = 'Carregando...';
  ['daily', 'funnel', 'sources', 'devices', 'hours'].forEach(key => $(key).replaceChildren());
  try {
    const data = await JucaMetrics.fetchEvents(sb, $('periodo').value);
    if (id !== requestId) return;
    rows = data; render(); $('csv').disabled = !rows.length;
  } catch {
    if (id === requestId) { rows = []; $('stats').textContent = 'Não foi possível carregar. Selecione o período para tentar novamente.'; }
  }
}
$('periodo').onchange = load;
$('csv').disabled = true;
$('csv').onclick = () => {
  const cell = value => '"' + String(value ?? '').replace(/^[=+@-]/, "'$&").replaceAll('"', '""') + '"';
  const body = rows.map(r => [r.event_type, r.page, r.occurred_at, r.duration_seconds, JSON.stringify(r.details)].map(cell).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob(['\uFEFFevento,pagina,data,duracao,detalhes\n' + body], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = 'juca-analytics.csv'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
(async () => {
  try {
    const { data: { user }, error } = await sb.auth.getUser();
    if (error || !user) return location.replace('login.html');
    const { data: profile, error: profileError } = await sb.from('admin_profiles').select('role').eq('id', user.id).maybeSingle();
    if (profileError || profile?.role !== 'admin' || user.email?.toLowerCase() !== 'rafaeljucacartuchos@gmail.com') return location.replace('portal.html');
    $('email').textContent = user.email;
    $('sair').onclick = async () => { await sb.auth.signOut(); location.replace('login.html'); };
    authorized = true; await load();
  } catch { $('stats').textContent = 'Não foi possível verificar seu acesso. Atualize a página.'; }
})();
