const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const mock = `
window.calls=[];
window.fixture={user:{id:'owner',email:'rafaeljucacartuchos@gmail.com',user_metadata:{}},role:'admin',projects:[{id:'project-1',client_user_id:'client-1',titulo:'Sistema existente',sistema_key:'analise_documento',sistema_url:'https://example.com/',sistema_ativo:true,status:'em_andamento',progresso:25,descricao:'Descrição original',data_inicio:'2026-09-01',data_fim:'2026-09-30'}],events:[]};
window.supabase={createClient(){return {
auth:{getSession:async()=>({data:{session:fixture.user?{user:fixture.user}:null}}),getUser:async()=>({data:{user:fixture.user}}),onAuthStateChange(cb){if(location.hash.includes('type=recovery'))queueMicrotask(()=>cb('PASSWORD_RECOVERY',{user:fixture.user}));return {data:{subscription:{unsubscribe(){}}}};},signInWithPassword:async args=>{calls.push({action:'login',args});return {error:{code:'invalid_credentials'}};},resetPasswordForEmail:async(email,options)=>{calls.push({action:'recovery',email,options});return fixture.recoveryError?{error:{message:'offline'}}:{error:null};},updateUser:async(args)=>{calls.push({action:'password',args});return {error:null};},signOut:async()=>{fixture.user=null;return {error:null};}},
rpc:async(name,args)=>{calls.push({action:'rpc',name,args});return {data:[{id:'client-1',email:'cliente@example.com',raw_user_meta_data:{full_name:"D'Ávila"}}],error:null};},
from(table){let operation='select',payload,filters=[];const q={select(){return q},eq(k,v){filters.push([k,v]);return q},gte(){return q},lte(){return q},order(){return q},range(){return q},maybeSingle(){return q},insert(p){operation='insert';payload=p;return q},update(p){operation='update';payload=p;return q},delete(){operation='delete';return q},then(resolve,reject){calls.push({action:operation,table,payload,filters});if(fixture.failWrite&&operation!=='select')return Promise.resolve({error:{message:'denied'},data:null}).then(resolve,reject);if(table==='admin_profiles')return Promise.resolve({data:{role:fixture.role},error:null}).then(resolve,reject);if(table==='site_events')return Promise.resolve({data:operation==='select'?fixture.events:[],error:null}).then(resolve,reject);if(table==='client_projects'){if(operation==='update'){fixture.projects=fixture.projects.map(p=>filters.every(([k,v])=>p[k]===v)?{...p,...payload}:p);}if(operation==='insert')fixture.projects.push({id:'new-project',...payload});return Promise.resolve({data:fixture.projects.filter(p=>filters.every(([k,v])=>p[k]===v)),error:null}).then(resolve,reject);}return Promise.resolve({data:[],error:null}).then(resolve,reject);}};return q;}
}}};`;
const server = http.createServer((req, res) => {
  let pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (pathname === '/') pathname = '/index.html';
  const file = path.resolve(root, '.' + pathname);
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  try { res.setHeader('Content-Type', file.endsWith('.html') ? 'text/html; charset=utf-8' : file.endsWith('.js') ? 'text/javascript; charset=utf-8' : file.endsWith('.css') ? 'text/css; charset=utf-8' : 'image/png'); res.end(fs.readFileSync(file)); }
  catch { res.writeHead(404).end(); }
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL || 'chrome'});
  const context = await browser.newContext();
  const errors=[];
  await context.route('**/*', async route => {
    const url=route.request().url();
    if(url.startsWith(base)) return route.continue();
    if(url.includes('/supabase-js@')) return route.fulfill({contentType:'text/javascript',body:mock});
    if(url.includes('/storage/')&&url.endsWith('.png'))return route.fulfill({contentType:'image/png',body:fs.readFileSync(path.join(root,'img/logo.png'))});
    return route.abort();
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  try {
    await page.goto(base+'/index.html');
    await page.getByRole('button',{name:/Topdata/}).click();
    await page.waitForFunction(()=>document.activeElement.id==='brandModalClose');
    await page.keyboard.press('Shift+Tab');
    assert.equal(await page.locator('#brandModal').evaluate(el=>el.contains(document.activeElement)),true);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#brandModal').getAttribute('aria-hidden'),'true');
    assert.equal(await page.locator('[data-brand="topdata"]').evaluate(el=>el===document.activeElement),true);
    console.log('PASS modal keyboard, focus return and Escape');
    await page.setViewportSize({width:390,height:844});
    await page.locator('#menuToggle').click();
    assert.equal(await page.locator('#menuToggle').getAttribute('aria-expanded'),'true');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#menuToggle').getAttribute('aria-expanded'),'false');
    const overflow=await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(el=>el.getBoundingClientRect().right>innerWidth+1&&getComputedStyle(el).position!=='fixed').map(el=>({tag:el.tagName,class:el.className,right:el.getBoundingClientRect().right})).slice(0,15));
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,JSON.stringify(overflow));
    await page.locator('#contactName').fill('Cliente teste');await page.locator('#contactService').selectOption({label:'Assistência técnica'});await page.locator('#contactMessage').fill('Preciso de orçamento');
    await page.evaluate(()=>{window.open=()=>null;});
    await page.locator('#contactForm button').click();
    assert.match(await page.locator('#formMessage a').getAttribute('href'),/wa.me/);
    assert.equal((await page.evaluate(()=>calls.filter(c=>c.payload?.event_type==='whatsapp_click'))).length,0);
    await page.locator('#whatsappChatOpen').click();
    assert.equal((await page.evaluate(()=>calls.filter(c=>c.payload?.event_type==='chat_open'))).length,1);
    fs.mkdirSync(path.join(root,'test-results'),{recursive:true});
    await page.screenshot({path:path.join(root,'test-results/mobile.png'),fullPage:true});
    console.log('PASS mobile layout, menu, blocked-popup fallback and distinct chat event');
    await page.locator('#produtos').scrollIntoViewIfNeeded();
    await page.locator('#contactName').blur();
    const firstPosition=await page.locator('#productPosition').innerText();
    await page.waitForFunction(previous=>document.getElementById('productPosition').textContent!==previous,firstPosition,{timeout:6500});
    await page.locator('#productsPause').click();
    const pausedPosition=await page.locator('#productPosition').innerText();
    await page.waitForTimeout(4300);
    assert.equal(await page.locator('#productPosition').innerText(),pausedPosition);
    await page.locator('#productsNext').click();
    assert.notEqual(await page.locator('#productPosition').innerText(),pausedPosition);
    assert.equal(await page.locator('.product-slide.is-active').count(),1);
    assert.equal(await page.locator('.product-slide').count(),13);
    assert.equal(await page.locator('.product-slide:not(.is-active)').evaluateAll(slides=>slides.every(slide=>slide.inert)),true);
    console.log('PASS automatic banner, pause, manual navigation and hidden-slide focus protection');
    await page.goto(base+'/login.html');
    // Stop the automatic redirect by loading the login with a signed-out fixture.
    await page.route('**/supabase-js@*/**',r=>r.fulfill({contentType:'text/javascript',body:mock+'\nfixture.user=null;'}));
    await page.goto(base+'/login.html');
    await page.locator('#forgotPassword').click();await page.locator('#recoveryEmail').fill('cliente@example.com');await page.locator('#sendRecovery').click();
    await page.waitForFunction(()=>document.getElementById('recoveryMsg').textContent.includes('Se este'));
    const recovery=await page.evaluate(()=>calls.find(c=>c.action==='recovery'));
    assert.equal(recovery.options.redirectTo,base+'/recuperar-senha.html');
    await page.evaluate(()=>fixture.recoveryError=true);await page.locator('#sendRecovery').click();
    await page.waitForFunction(()=>document.getElementById('recoveryMsg').textContent.includes('Não foi possível'));
    assert.equal(await page.locator('#sendRecovery').isEnabled(),true);
    console.log('PASS password-recovery request and error retry');
    await page.unroute('**/supabase-js@*/**');
    await page.goto(base+'/recuperar-senha.html#type=recovery');
    await page.locator('#newPassword').fill('SenhaTeste123');await page.locator('#confirmPassword').fill('OutraSenha123');await page.locator('#savePassword').click();
    assert.match(await page.locator('#recoveryStatus').innerText(),/não coincidem/);
    await page.locator('#confirmPassword').fill('SenhaTeste123');await page.locator('#savePassword').click();
    await page.waitForFunction(()=>document.getElementById('recoveryStatus').textContent.includes('Senha alterada'));
    assert.equal((await page.evaluate(()=>calls.filter(c=>c.action==='password'))).length,1);
    await page.goto(base+'/recuperar-senha.html');assert.equal(await page.locator('#passwordForm').isHidden(),true);
    console.log('PASS password confirmation, update and invalid-link state');
    await page.setViewportSize({width:1280,height:900});await page.goto(base+'/admin.html');
    await page.locator('#listaClientes').getByRole('button',{name:'Sistemas',exact:true}).click();await page.getByRole('button',{name:'Editar',exact:true}).click();
    assert.equal(await page.locator('#pTitulo').inputValue(),'Sistema existente');
    await page.locator('#pTitulo').fill('Sistema atualizado');await page.locator('#saveProject').click();
    await page.waitForFunction(()=>fixture.projects[0].titulo==='Sistema atualizado');
    assert.equal(await page.evaluate(()=>calls.filter(c=>c.action==='update'&&c.table==='client_projects').length),1);
    page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Desativar',exact:true}).click();
    await page.waitForFunction(()=>fixture.projects[0].sistema_ativo===false);
    await page.getByRole('button',{name:'Ativar',exact:true}).click();await page.waitForFunction(()=>fixture.projects[0].sistema_ativo===true);
    await page.getByRole('button',{name:'Editar',exact:true}).click();await page.evaluate(()=>fixture.failWrite=true);await page.locator('#pTitulo').fill('Rascunho mantido');await page.locator('#saveProject').click();
    await page.waitForFunction(()=>document.getElementById('toast').textContent.includes('Não foi possível salvar'));
    assert.equal(await page.locator('#pTitulo').inputValue(),'Rascunho mantido');
    await page.screenshot({path:path.join(root,'test-results/admin.png'),fullPage:true});
    console.log('PASS customer apostrophe, edit, deactivate/reactivate and failed-save data retention');
    await page.goto(base+'/dashboard.html');await page.waitForFunction(()=>document.querySelectorAll('.dash-stat').length===8);
    await page.locator('#periodo').selectOption('all');await page.waitForFunction(()=>document.querySelectorAll('.dash-stat').length===8);
    assert.equal(await page.locator('#csv').isDisabled(),true);
    await page.screenshot({path:path.join(root,'test-results/dashboard.png'),fullPage:true});
    console.log('PASS empty dashboard and all-time loading');
    await page.route('**/supabase-js@*/**',r=>r.fulfill({contentType:'text/javascript',body:mock+"\nfixture.user={id:'client-1',email:'cliente@example.com',user_metadata:{}};fixture.role='client';"}));
    await page.goto(base+'/portal.html');await page.waitForFunction(()=>document.querySelector('.proj-card'));
    const filters=await page.evaluate(()=>calls.find(c=>c.table==='client_projects').filters);
    assert.deepEqual(filters,[['client_user_id','client-1'],['sistema_ativo',true]]);
    console.log('PASS portal query restricted to current client and active systems');
    assert.deepEqual(errors,[]);console.log('PASS no uncaught browser errors');
  } finally {await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
