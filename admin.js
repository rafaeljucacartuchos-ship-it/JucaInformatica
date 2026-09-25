
const sb=supabase.createClient('https://klpbqpcwdhuegcmoqspj.supabase.co','sb_publishable_bPZBZOZQs01sI9yR85lfkg_9wVK41xi'),STATUS={orcamento:'Orçamento',em_andamento:'Em andamento',concluido:'Concluído',pausado:'Pausado'};let clienteSel=null,projetoEditando=null,projetosAtuais=[],projetosRequest=0;const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));function toast(x,e){const t=document.getElementById('toast');t.textContent=x;t.className='toast show'+(e?' err':'');setTimeout(()=>t.classList.remove('show'),3500)}document.querySelectorAll('.admin-tab[data-pane]').forEach(t=>t.onclick=()=>{document.querySelectorAll('.admin-tab').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.admin-pane').forEach(x=>x.classList.remove('active'));t.classList.add('active');document.getElementById(t.dataset.pane).classList.add('active')});(async()=>{const {data:{session}}=await sb.auth.getSession();if(!session)return location.href='login.html';const u=session.user,{data:prof}=await sb.from('admin_profiles').select('role').eq('id',u.id).maybeSingle();if(prof?.role!=='admin'||u.email.toLowerCase()!=='rafaeljucacartuchos@gmail.com')return location.href='portal.html';whoName.textContent=u.user_metadata?.full_name||'Admin';whoEmail.textContent=u.email;btnLogout.onclick=async()=>{await sb.auth.signOut();location.href='login.html'};await carregarClientes();await carregarVisitas()})();async function carregarVisitas(){
    const box=document.getElementById('visitStats');
    try {
      const rows=await JucaMetrics.fetchEvents(sb,'all');
      const views=rows.filter(x=>x.event_type==='page_view');
      const today=JucaMetrics.periodStart(1),week=JucaMetrics.periodStart(7);
      box.innerHTML=[['Páginas vistas',views.length],['Hoje',views.filter(v=>v.occurred_at>=today).length],['Últimos 7 dias',views.filter(v=>v.occurred_at>=week).length]].map(([label,count])=>'<div class="auth-field"><label>'+label+'</label><input readonly value="'+count+'"></div>').join('');
    } catch {box.textContent='Não foi possível carregar as visitas. Atualize a página para tentar novamente.';}
  }async function carregarClientes(){const {data:users,error}=await sb.rpc('list_client_users');if(error)return listaClientes.innerHTML='<p class="hint">Erro: '+esc(error.message)+'</p>';if(!users?.length)return listaClientes.innerHTML='<p class="hint">Nenhum cliente cadastrado.</p>';listaClientes.innerHTML=users.map(u=>{const n=esc(u.raw_user_meta_data?.full_name||u.email.split('@')[0]).replace(/'/g,"\\'");return `<div class="client-row"><div class="cinfo"><strong>${esc(u.raw_user_meta_data?.full_name||u.email.split('@')[0])}</strong><span>${esc(u.email)}</span></div><div class="cacoes"><button class="btn-mini" data-client-id="${esc(u.id)}" data-client-name="${esc(u.raw_user_meta_data?.full_name||u.email.split('@')[0])}"><i class="fas fa-diagram-project"></i> Sistemas</button></div></div>`}).join('')}window.selecionarCliente=async(id,nome)=>{clienteSel=id;cancelarEdicao();novoProjCard.style.display='block';npCliente.textContent=nome;document.querySelector('[data-pane="paneProjetos"]').click();await carregarProjetos()};async function carregarProjetos(){if(!clienteSel)return;const request=++projetosRequest;const {data:ps,error}=await sb.from('client_projects').select('*').eq('client_user_id',clienteSel).order('created_at',{ascending:false});if(request!==projetosRequest)return;projetosAtuais=ps||[];if(error)return listaProjetos.innerHTML='<p class="hint">Erro: '+esc(error.message)+'</p>';if(!ps?.length)return listaProjetos.innerHTML='<p class="hint">Nenhum sistema liberado.</p>';listaProjetos.innerHTML=ps.map(p=>`<div class="proj-admin-row"><div class="pinfo"><strong>${esc(p.titulo)}</strong><span>${p.sistema_ativo===false?'INATIVO':'ATIVO'} · ${STATUS[p.status]||p.status} · ${p.progresso||0}%</span></div><div class="pacoes"><select onchange="mudarStatus('${p.id}',this.value)">${Object.entries(STATUS).map(([v,l])=>`<option value="${v}" ${p.status===v?'selected':''}>${l}</option>`).join('')}</select><input type="range" class="prog" min="0" max="100" value="${p.progresso||0}" onchange="mudarProgresso('${p.id}',this.value)"><button class="btn-mini" onclick="editarProjeto('${p.id}')">Editar</button><button class="btn-mini" onclick="alternarAcesso('${p.id}')">${p.sistema_ativo===false?'Ativar':'Desativar'}</button><button class="btn-mini" aria-label="Excluir sistema" onclick="excluirProjeto('${p.id}')"><i class="fas fa-trash"></i></button></div></div>`).join('')}formCliente.onsubmit=async e=>{e.preventDefault();btnCriar.disabled=true;const {error}=await sb.rpc('create_client_user',{p_email:cEmail.value.trim().toLowerCase(),p_password:cSenha.value,p_name:cEmpresa.value.trim()||cNome.value.trim()});btnCriar.disabled=false;if(error)return toast('Erro: '+error.message,true);toast('Acesso criado!');e.target.reset();await carregarClientes()};window.mudarStatus=async(id,status)=>{const {error}=await sb.from('client_projects').update({status}).eq('id',id);toast(error?'Erro: '+error.message:'Status atualizado!',!!error);if(!error)await carregarProjetos()};window.mudarProgresso=async(id,progresso)=>{const p=parseInt(progresso),patch={progresso:p};if(p===100)patch.status='concluido';const {error}=await sb.from('client_projects').update(patch).eq('id',id);toast(error?'Erro: '+error.message:'Progresso atualizado!',!!error);if(!error)await carregarProjetos()};window.excluirProjeto=async id=>{if(!confirm('Excluir este sistema?'))return;const {error}=await sb.from('client_projects').delete().eq('id',id);toast(error?'Erro: '+error.message:'Sistema excluído.',!!error);if(!error)await carregarProjetos()};
document.getElementById('listaClientes').addEventListener('click', e => {
  const button=e.target.closest('[data-client-id]');
  if(button) selecionarCliente(button.dataset.clientId,button.dataset.clientName);
});
function cancelarEdicao(){
  projetoEditando=null;document.getElementById('formProjeto').reset();
  document.getElementById('projectFormTitle').textContent='Novo sistema para';
  document.getElementById('saveProject').textContent='Liberar sistema';
  document.getElementById('cancelProjectEdit').hidden=true;
}
document.getElementById('cancelProjectEdit').onclick=cancelarEdicao;
window.editarProjeto=id=>{
  const p=projetosAtuais.find(p=>p.id===id);if(!p)return;
  projetoEditando=id;
  const fields={pTitulo:p.titulo,pSistema:p.sistema_key,pUrl:p.sistema_url,pDesc:p.descricao,pStatus:p.status,pProgresso:p.progresso,pInicio:p.data_inicio,pFim:p.data_fim,pObs:p.observacoes};
  // Preserve systems registered outside the current dropdown catalog.
  const select=document.getElementById('pSistema');
  if(p.sistema_key&&![...select.options].some(o=>o.value===p.sistema_key))select.add(new Option(p.sistema_key,p.sistema_key));
  for(const [id,value] of Object.entries(fields))document.getElementById(id).value=value??'';
  document.getElementById('pAtivo').checked=p.sistema_ativo!==false;
  document.getElementById('projectFormTitle').textContent='Editar sistema de';
  document.getElementById('saveProject').textContent='Salvar alterações';
  document.getElementById('cancelProjectEdit').hidden=false;
  document.getElementById('novoProjCard').scrollIntoView({behavior:'smooth',block:'start'});
  document.getElementById('pTitulo').focus({preventScroll:true});
};
window.alternarAcesso=async id=>{
  const p=projetosAtuais.find(p=>p.id===id);if(!p)return;
  const active=p.sistema_ativo===false;
  if(!active&&!confirm('Ocultar este sistema no portal do cliente? O cadastro será mantido. Se o sistema tem login próprio, o bloqueio deve ser feito também nele.'))return;
  try{
    const {data,error}=await sb.from('client_projects').update({sistema_ativo:active}).eq('id',id).eq('client_user_id',clienteSel).select('id');
    if(error||!data?.length)throw error||new Error('Sem permissão para alterar este sistema.');
    toast(active?'Acesso ativado!':'Acesso desativado.');await carregarProjetos();
    if(projetoEditando===id)document.getElementById('pAtivo').checked=active;
  }catch{toast('Não foi possível alterar o acesso. Tente novamente.',true);}
};
document.getElementById('formProjeto').onsubmit=async e=>{
  e.preventDefault();if(!clienteSel)return toast('Selecione um cliente.',true);
  const value=id=>document.getElementById(id).value.trim();
  let url;try{url=new URL(value('pUrl'));if(!['https:','http:'].includes(url.protocol))throw Error();}catch{return toast('Informe um endereço que comece com https:// ou http://.',true);}
  if(value('pInicio')&&value('pFim')&&value('pFim')<value('pInicio'))return toast('A data de término deve ser igual ou posterior ao início.',true);
  const payload={titulo:value('pTitulo'),descricao:value('pDesc')||null,status:value('pStatus'),progresso:Number(value('pProgresso'))||0,data_inicio:value('pInicio')||null,data_fim:value('pFim')||null,observacoes:value('pObs')||null,sistema_key:value('pSistema'),sistema_url:url.href,sistema_ativo:document.getElementById('pAtivo').checked};
  const button=document.getElementById('saveProject'),client=clienteSel,editing=projetoEditando;
  button.disabled=true;
  try{
    const query=editing?sb.from('client_projects').update(payload).eq('id',editing).eq('client_user_id',client):sb.from('client_projects').insert({...payload,client_user_id:client});
    const {data,error}=await query.select('id');
    if(error||!data?.length)throw error||new Error('Sem permissão para salvar.');
    toast(editing?'Sistema atualizado!':'Sistema liberado!');
    if(clienteSel===client&&projetoEditando===editing)cancelarEdicao();
    await carregarProjetos();
  }catch{toast('Não foi possível salvar. Seus dados foram mantidos para tentar novamente.',true);}
  finally{button.disabled=false;}
};
