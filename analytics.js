(function(){
  const start=()=>{
    const KEY='juca_analytics_session';
    let sid=sessionStorage.getItem(KEY); if(!sid){sid=(crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random());sessionStorage.setItem(KEY,sid)}
    const client=window.supabase?.createClient('https://klpbqpcwdhuegcmoqspj.supabase.co','sb_publishable_bPZBZOZQs01sI9yR85lfkg_9wVK41xi'); if(!client)return;
    const page=location.pathname||'/'; let started=Date.now(),lastSent=0;
    const send=(type,details={},duration=null)=>client.from('site_events').insert({session_id:sid,event_type:type,page,duration_seconds:duration,details}).then(()=>{}).catch(()=>{});
    send('page_view',{title:document.title,referrer:document.referrer||null});
    const heartbeat=()=>{const seconds=Math.floor((Date.now()-started)/1000);if(seconds-lastSent>=10){send('time_active',{title:document.title},seconds);lastSent=seconds}};
    setInterval(()=>{if(!document.hidden)heartbeat()},10000); document.addEventListener('visibilitychange',()=>{if(document.hidden)heartbeat()}); window.addEventListener('pagehide',()=>heartbeat());
    document.addEventListener('click',e=>{const el=e.target.closest('a,button,[data-brand]');if(!el)return;const href=el.getAttribute('href')||'';if(href.includes('wa.me')||el.id==='whatsappChatOpen'||el.classList.contains('whatsapp-chat-btn'))send('whatsapp_click',{label:(el.innerText||'WhatsApp').trim().slice(0,100),href});else if(el.matches('[data-brand]'))send('information_opened',{brand:el.dataset.brand,label:(el.innerText||'').trim().slice(0,100)});else if(href.startsWith('#'))send('navigation',{target:href,label:(el.innerText||'').trim().slice(0,100)});else if(el.tagName==='BUTTON')send('interaction',{label:(el.innerText||'').trim().slice(0,100)})},true);
  };
  if(window.supabase) start(); else {const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';s.onload=start;document.head.appendChild(s)}
})();