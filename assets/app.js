/* The M Co. – shared site script */
(function(){
'use strict';
/* ================= CONFIG – edit these ================= */
const CONFIG = {
  whatsapp: '919831766745',          // receives enquiries (no +)
  email: 'enquiry@themcostudio.com',
  endpoint: '',                      // optional: Google Apps Script / Formspree / Zapier URL to save every lead (see README.txt)
  replyPromise: 'usually the same working day',
  exitPopup: true
};
/* ======================================================= */

const D = window.MCO_DATA; const P = D.products;
const byId = id => P.find(p => p.id === id);
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const waLink = t => 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(t);
function track(ev, data){ window.dataLayer = window.dataLayer || []; window.dataLayer.push(Object.assign({event:ev}, data||{}));
  if(ev==='lead_submit'){ if(window.fbq) fbq('track','Lead'); if(window.gtag) gtag('event','generate_lead',data); } }
function toast(m){ const t=$('#toast'); t.textContent=m; t.classList.add('show'); clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove('show'),2400); }
window.mcoToast = toast;

/* ---------- Quote list (persists across pages) ---------- */
const KEY='mco_quote_list';
let list=[]; try{ list=JSON.parse(localStorage.getItem(KEY)||'[]').filter(i=>byId(i.id)); }catch(e){ list=[]; }
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(list)); }catch(e){} }
function inList(id){ return list.some(i=>i.id===id); }
function toggleList(id){
  const i=list.findIndex(x=>x.id===id);
  if(i>-1){ list.splice(i,1); toast('Removed from quote list'); }
  else { list.push({id,qty:1}); toast(byId(id).name+' added to quote list'); track('add_to_quote',{product:id}); }
  save(); sync();
}
function sync(){
  $$('.qcount').forEach(e=>e.textContent=list.length);
  $$('.quote-pill').forEach(el=>el.classList.toggle('has', list.length>0));
  $$('[data-add]').forEach(b=>{ const on=inList(b.dataset.add); b.classList.toggle('in',on);
    const name=(byId(b.dataset.add)||{}).name||'this product';
    b.setAttribute('aria-label', (on?'Remove ':'Add ')+name+' to quote');
    b.title=on?'Remove from quote':'Add to quote';
    if(b.classList.contains('add')) b.textContent=on?'✓':'+'; else b.textContent=on?'✓ In quote list':'Add to quote'; });
  renderDrawer();
}
function renderDrawer(){
  const el=$('#dList'); if(!el) return;
  el.innerHTML = list.length ? list.map(it=>{ const p=byId(it.id); return `
    <div class="d-item"><img src="${p.img}" alt="${esc(p.name)}"><div><a href="${p.slug}.html"><b>${esc(p.name)}</b></a><small>${p.buy&&p.rent?'Buy or rent':p.rent?'Rent':'Buy'}</small>
    <div class="qty"><button data-q="-1" data-id="${p.id}" aria-label="Decrease">−</button><input type="number" min="1" value="${it.qty}" data-id="${p.id}" aria-label="Quantity"><button data-q="1" data-id="${p.id}" aria-label="Increase">+</button></div></div>
    <button class="x x-sm" data-rm="${p.id}" aria-label="Remove">×</button></div>`; }).join('')
    : '<p class="empty" style="padding:30px 0">Your list is empty.<br>Tap “+” on any product to add it.</p>';
}
document.addEventListener('click',e=>{
  const a=e.target.closest('[data-add]'); if(a){ e.preventDefault(); e.stopPropagation(); toggleList(a.dataset.add); return; }
  const rm=e.target.closest('[data-rm]'); if(rm){ toggleList(rm.dataset.rm); return; }
  const q=e.target.closest('[data-q]'); if(q){ const it=list.find(x=>x.id===q.dataset.id); it.qty=Math.max(1,it.qty+ +q.dataset.q); save(); renderDrawer(); return; }
  const o=e.target.closest('[data-open-drawer]'); if(o){ openDrawer(); return; }
  const qb=e.target.closest('[data-quote]'); if(qb){ e.preventDefault();
    const ids = qb.dataset.quote==='list' ? null : (qb.dataset.quote ? qb.dataset.quote.split(',') : []);
    openQuote(ids,{mode:qb.dataset.mode,notes:qb.dataset.notes}); return; }
  const w=e.target.closest('[data-wa]'); if(w){ e.preventDefault(); track('whatsapp_click'); window.open(waLink(w.dataset.wa),'_blank','noopener'); }
});
document.addEventListener('change',e=>{ if(e.target.matches('#dList input')){ const it=list.find(x=>x.id===e.target.dataset.id); it.qty=Math.max(1,parseInt(e.target.value)||1); save(); }});
function openDrawer(){ renderDrawer(); $('#drawer').classList.add('open'); $('#scrim').classList.add('open'); }
function closeDrawer(){ $('#drawer').classList.remove('open'); $('#scrim').classList.remove('open'); }
window.mcoCloseDrawer=closeDrawer;

/* ---------- Overlays ---------- */
let lastFocus=null;
function openOv(id){ lastFocus=document.activeElement; const o=document.getElementById(id); o.classList.add('open'); document.body.style.overflow='hidden'; o.querySelector('.modal').scrollTop=0; setTimeout(()=>o.querySelector('input,.x')?.focus(),60); }
function closeOv(id){ document.getElementById(id).classList.remove('open'); if(!$('.overlay.open')) document.body.style.overflow=''; lastFocus?.focus?.(); }
window.mcoCloseOv=closeOv;
$$('.overlay').forEach(o=>o.addEventListener('click',e=>{ if(e.target===o) closeOv(o.id); }));
document.addEventListener('keydown',e=>{ if(e.key==='Escape'){ const o=$$('.overlay.open').pop(); if(o) closeOv(o.id); else closeDrawer(); }});

/* ---------- Lead form ---------- */
const BUSINESS=['Boutique / Retail store','Designer / Fashion label','Photographer / Studio','Event / Exhibition organiser','E-commerce brand','Tailor / Fashion school','Personal use','Other'];
function formHTML(prefix,items,opts){
  opts=opts||{};
  const mode=opts.mode||(items.length&&items.every(id=>!byId(id).buy)?'Rent':'Buy');
  const opt=P.filter(p=>!p.hidden).map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('');
  return `
  <form id="${prefix}Form" class="${mode!=='Buy'?'mode-rent':''}" novalidate>
    <input type="text" name="company_website" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
    <div class="fgrid">
      <div class="full"><label class="lbl">I want to</label>
        <div class="seg" data-mode><button type="button" data-v="Buy" class="${mode==='Buy'?'on':''}">Buy</button><button type="button" data-v="Rent" class="${mode==='Rent'?'on':''}">Rent</button><button type="button" data-v="Buy & Rent" class="${mode==='Buy & Rent'?'on':''}">Both</button></div>
        <input type="hidden" name="mode" value="${mode}"></div>
      ${items.length?'':`<div class="full"><label class="lbl">Product <i>*</i></label><select class="field" name="product"><option value="">Choose a product…</option>${opt}</select><div class="err">Please choose a product</div></div>`}
      <div><label class="lbl">Your name <i>*</i></label><input class="field" name="name" autocomplete="name" placeholder="Full name"><div class="err">Please enter your name</div></div>
      <div><label class="lbl">WhatsApp number <i>*</i></label><input class="field" name="phone" type="tel" inputmode="numeric" autocomplete="tel" placeholder="10-digit mobile"><div class="err">Enter a valid 10-digit number</div></div>
      <div><label class="lbl">Email</label><input class="field" name="email" type="email" autocomplete="email" placeholder="you@business.com"><div class="err">Enter a valid email</div></div>
      <div><label class="lbl">City / delivery area</label><input class="field" name="city" placeholder="e.g. Kolkata, Salt Lake"></div>
      <div class="${items.length>1?'hide':''}"><label class="lbl">Quantity</label><input class="field" name="qty" type="number" min="1" value="${opts.qty||1}"></div>
      <div><label class="lbl">You are a</label><select class="field" name="business">${BUSINESS.map(b=>`<option>${b}</option>`).join('')}</select></div>
      <div class="rent-only"><label class="lbl">Rental start date</label><input class="field" name="start" type="date"></div>
      <div class="rent-only"><label class="lbl">Duration</label><select class="field" name="duration"><option>1 day</option><option>2–3 days</option><option>1 week</option><option>2 weeks</option><option>1 month</option><option>Longer / not sure</option></select></div>
      <div class="full"><label class="lbl">Size, finish or anything else?</label><textarea class="field" name="notes" rows="3" placeholder="e.g. 4 female headless in matte white, UK size 10, plus 2 racks">${esc(opts.notes||'')}</textarea></div>
    </div>
    <button class="btn btn-gold btn-block" type="submit" style="margin-top:18px">Get my price code</button>
    <p class="fine">🔒 Your details are only used to send your quote.</p>
  </form>`;
}
function bindForm(form,itemsGetter,onDone){
  form.querySelector('[data-mode]').addEventListener('click',e=>{
    const b=e.target.closest('button'); if(!b) return;
    $$('[data-mode] button',form).forEach(x=>x.classList.toggle('on',x===b));
    form.mode.value=b.dataset.v; form.classList.toggle('mode-rent',b.dataset.v!=='Buy');
  });
  form.addEventListener('submit',e=>{
    e.preventDefault(); if(form.company_website.value) return;
    let ok=true; const setErr=(el,bad)=>{ el.parentNode.classList.toggle('invalid',!!bad); if(bad) ok=false; };
    const phone=form.phone.value.replace(/\D/g,'').replace(/^(91|0)(?=\d{10}$)/,'');
    setErr(form.name,form.name.value.trim().length<2);
    setErr(form.phone,!/^[6-9]\d{9}$/.test(phone));
    setErr(form.email,form.email.value&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.value));
    if(form.product) setErr(form.product,!form.product.value);
    if(!ok){ form.querySelector('.invalid .field')?.focus(); return; }
    let items=itemsGetter();
    if(form.product) items=[{id:form.product.value,qty:+form.qty.value||1}];
    else if(items.length===1) items[0].qty=+form.qty.value||1;
    const lead={ name:form.name.value.trim(), phone:'+91'+phone, email:form.email.value.trim(), city:form.city.value.trim(),
      mode:form.mode.value, business:form.business.value, start:form.start.value,
      duration:form.mode.value!=='Buy'?form.duration.value:'', notes:form.notes.value.trim(),
      items:items.map(i=>({product:byId(i.id).name,qty:i.qty})) };
    submitLead(lead,items).then(onDone);
  });
}
function makeCode(items){
  const c=items.length===1?byId(items[0].id).code:(items.length>1?'MIX':'GEN');
  const a='ABCDEFGHJKMNPQRSTUVWXYZ23456789'; let r=''; for(let i=0;i<4;i++) r+=a[Math.floor(Math.random()*a.length)];
  return 'MCO-'+c+'-'+r;
}
function leadText(l){
  return `Hi The M Co.! Please send me the price for code *${l.code}*\n\n• I want to: ${l.mode}\n`+
    l.items.map(i=>`• ${i.product} × ${i.qty}`).join('\n')+'\n'+
    (l.duration?`• Rental: from ${l.start||'TBD'}, ${l.duration}\n`:'')+(l.city?`• Location: ${l.city}\n`:'')+
    `• I am a: ${l.business}\n`+(l.notes?`• Notes: ${l.notes}\n`:'')+
    `\nName: ${l.name}\nPhone: ${l.phone}`+(l.email?`\nEmail: ${l.email}`:'');
}
async function submitLead(lead,items){
  lead.code=makeCode(items); lead.page=location.href; lead.time=new Date().toISOString();
  const p=new URLSearchParams(location.search); ['utm_source','utm_medium','utm_campaign','gclid','fbclid'].forEach(k=>{ if(p.get(k)) lead[k]=p.get(k); });
  if(CONFIG.endpoint){ try{ await fetch(CONFIG.endpoint,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(lead)}); }catch(e){} }
  track('lead_submit',{code:lead.code,mode:lead.mode,items:lead.items.length});
  return lead;
}
function successHTML(lead){
  const txt=leadText(lead);
  const mail='mailto:'+CONFIG.email+'?subject='+encodeURIComponent('Price request '+lead.code)+'&body='+encodeURIComponent(txt.replace(/\*/g,''));
  return `<div class="success">
    <div class="tick"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12l5 5L20 7"/></svg></div>
    <h2>Your price code is ready</h2>
    <p>Thanks ${esc(lead.name.split(' ')[0])}! Send it to us on WhatsApp and you'll get your exact quote, ${CONFIG.replyPromise}.</p>
    <div class="codebox"><small>Your price code</small><div class="code">${lead.code}</div><button type="button" data-copy="${lead.code}">Copy code</button></div>
    <div class="wa-mock"><b>What we reply on WhatsApp</b><p>Thanks ${esc(lead.name.split(' ')[0])}. Code ${esc(lead.code)} — ${esc(lead.items.map(i=>i.product+' × '+i.qty).join(', ')||'your request')}. Here is your itemised price…</p></div>
    <div class="btns">
      <a class="btn btn-wa" href="${waLink(txt)}" target="_blank" rel="noopener">Send code on WhatsApp (fastest)</a>
      <a class="btn btn-line" href="${mail}">Send by email instead</a>
    </div>
    <p class="fine">Prefer to talk? Call <a href="tel:+919831766745"><b>+91 98317 66745</b></a> and quote your code.</p>
  </div>`;
}
document.addEventListener('click',e=>{ const c=e.target.closest('[data-copy]'); if(c){ navigator.clipboard&&navigator.clipboard.writeText(c.dataset.copy); toast('Code copied'); }});

/* Quote modal */
function openQuote(ids,opts){
  opts=opts||{};
  const items = ids===null ? list.map(x=>({...x})) : ids.filter(byId).map(id=>({id,qty:(list.find(x=>x.id===id)||{}).qty||1}));
  const studio=items.some(i=>i.id==='studio');
  $('#qModal').innerHTML=`
    <button class="x" data-close="qOverlay" aria-label="Close">×</button>
    <div class="qhead">
      <span class="eyebrow">Request a price code</span>
      <h2>${items.length===1?esc(byId(items[0].id).name):items.length?'Your quote list':'What do you need?'}</h2>
      <p>Takes under a minute. We'll reply with an exact, itemised quote.</p>
      ${items.length?`<div class="qitems">${items.map(i=>{const p=byId(i.id);return `<span class="qitem"><img src="${p.img}" alt="${esc(p.name)}">${esc(p.name)}${items.length>1?' × '+i.qty:''}</span>`;}).join('')}</div>`:''}
    </div>
    <div class="qbody" id="qBody">${formHTML('m',items.map(i=>i.id),{mode:opts.mode,qty:items.length===1?items[0].qty:1,notes:opts.notes||(studio?'Studio booking for a product shoot. Date & hours: ':'')})}</div>`;
  bindForm($('#mForm'),()=>items.map(x=>({...x})),lead=>{ $('#qModal').innerHTML='<button class="x" data-close="qOverlay" aria-label="Close">×</button>'+successHTML(lead); });
  closeDrawer(); openOv('qOverlay'); track('open_quote',{items:items.length});
  return $('#mForm');
}
window.mcoOpenQuote=openQuote;
document.addEventListener('click',e=>{ const c=e.target.closest('[data-close]'); if(c) closeOv(c.dataset.close); });

/* Inline forms: <div data-inline-form data-items="id,id" data-mode="Rent" data-from-list></div> */
function mountInline(host){
  const params=new URLSearchParams(location.search);
  let ids = host.dataset.items ? host.dataset.items.split(',') : [];
  if(host.hasAttribute('data-from-url')){
    if(params.get('product') && byId(params.get('product'))) ids=[params.get('product')];
    else if(list.length) ids=list.map(i=>i.id);
  }
  const mode = params.get('mode') || host.dataset.mode;
  const items = ids.filter(byId).map(id=>({id,qty:(list.find(x=>x.id===id)||{}).qty||1}));
  const summary = items.length>1||host.hasAttribute('data-from-url')&&items.length ? `<div class="qitems" style="margin:0 0 18px">${items.map(i=>{const p=byId(i.id);return `<span class="qitem"><img src="${p.img}" alt="${esc(p.name)}">${esc(p.name)}${items.length>1?' × '+i.qty:''}</span>`;}).join('')}</div>`:'';
  host.innerHTML = summary + formHTML('i'+Math.random().toString(36).slice(2,6), items.map(i=>i.id), {mode, notes:host.dataset.notes||'', qty:items.length===1?items[0].qty:1});
  bindForm(host.querySelector('form'),()=>items.map(x=>({...x})),lead=>{
    host.innerHTML=successHTML(lead)+'<p class="fine"><button class="link" type="button">Request another code</button></p>';
    host.querySelector('.link').onclick=()=>mountInline(host);
    host.scrollIntoView({behavior:'smooth',block:'center'});
  });
}
$$('[data-inline-form]').forEach(mountInline);

/* Hero quick form */
const qf=$('#quickForm');
if(qf){
  $('#qcat').innerHTML='<option value="">What do you need?</option>'+P.filter(p=>!p.hidden).map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('');
  $('.seg',qf).addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; $$('.seg button',qf).forEach(x=>x.classList.toggle('on',x===b)); $('#qmode').value=b.dataset.v; });
  qf.addEventListener('submit',e=>{ e.preventDefault();
    const id=$('#qcat').value, ph=$('#qphone').value.replace(/\D/g,'').slice(-10);
    const f=openQuote(id?[id]:[],{mode:$('#qmode').value});
    if(/^[6-9]\d{9}$/.test(ph)) f.phone.value=ph;
    setTimeout(()=>f.name.focus(),80);
  });
}

/* ---------- Catalogue filter (products page) ---------- */
const grid=$('#grid[data-filterable]');
if(grid){
  let g=new URLSearchParams(location.search).get('cat')||'all', rentOnly=new URLSearchParams(location.search).get('rent')==='1';
  const apply=()=>{ let n=0; $$('.card',grid).forEach(c=>{ const show=(g==='all'||c.dataset.group===g)&&(!rentOnly||c.dataset.rent==='1'); c.hidden=!show; if(show)n++; });
    $$('#chips .chip').forEach(c=>c.classList.toggle('on',c.dataset.g===g)); $('#emptyMsg').hidden=n>0; $('#rentOnly').checked=rentOnly; };
  $('#chips').addEventListener('click',e=>{ const b=e.target.closest('.chip'); if(!b) return; g=b.dataset.g; apply(); });
  $('#rentOnly').addEventListener('change',e=>{ rentOnly=e.target.checked; apply(); });
  apply();
}

/* ---------- Product gallery ---------- */
const thumbs=$('.thumbs');
if(thumbs) thumbs.addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; $('#pdMain').src=b.dataset.src; $$('button',thumbs).forEach(x=>x.classList.toggle('on',x===b)); });

/* ---------- Nav ---------- */
const nav=$('#nav'); addEventListener('scroll',()=>nav.classList.toggle('scrolled',scrollY>10),{passive:true});
$('#burger')?.addEventListener('click',()=>$('#mmenu').classList.toggle('open'));
$$('.has-drop > button').forEach(b=>b.addEventListener('click',e=>{ e.stopPropagation(); b.parentNode.classList.toggle('open'); }));
document.addEventListener('click',()=>$$('.has-drop.open').forEach(d=>d.classList.remove('open')));

/* ---------- Reveal ---------- */
if(matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)){
  $$('.reveal').forEach(el=>el.classList.add('in'));
} else {
  const io=new IntersectionObserver(es=>es.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); }}),{threshold:0.01,rootMargin:'0px 0px 12% 0px'});
  $$('.reveal').forEach(el=>io.observe(el));
}
const fabBtn=document.querySelector('.fab'), heroForm=document.querySelector('#quickForm');
if(fabBtn&&heroForm&&'IntersectionObserver' in window){
  new IntersectionObserver(([en])=>fabBtn.classList.toggle('is-clear', en.isIntersecting),{threshold:.2}).observe(heroForm);
}

/* ---------- Catalogue popup (once per visit) ---------- */
let shown=false; try{ shown=sessionStorage.getItem('mco_promo')==='1'; }catch(e){}
function showPromo(){ if(!CONFIG.exitPopup||shown||$('.overlay.open')||!$('#promoOverlay')) return; shown=true; try{sessionStorage.setItem('mco_promo','1');}catch(e){} openOv('promoOverlay'); track('promo_shown'); }
document.addEventListener('mouseout',e=>{ if(!e.relatedTarget) showPromo(); });
addEventListener('scroll',()=>{ const s=scrollY/Math.max(1,document.body.scrollHeight-innerHeight); if(s>.45) showPromo(); },{passive:true});
setTimeout(showPromo, 20000);
$('#promoForm')?.addEventListener('submit',async e=>{
  e.preventDefault(); const ph=$('#promoPhone').value.replace(/\D/g,'').slice(-10);
  if(!/^[6-9]\d{9}$/.test(ph)){ $('#promoPhone').focus(); toast('Enter a valid 10-digit number'); return; }
  const lead={name:'Catalogue request',phone:'+91'+ph,mode:'Catalogue',business:'',items:[],notes:'Requested full catalogue'};
  await submitLead(lead,[]);
  window.open(waLink(`Hi The M Co.! Please send me your full catalogue. (Ref ${lead.code})`),'_blank','noopener');
  closeOv('promoOverlay'); toast('Opening WhatsApp…');
});

$$('.yr').forEach(e=>e.textContent=new Date().getFullYear());
const HINT={
  headless:'UK 8–10 and size M · matte, gloss or black',
  realistic:'UK 8–10 and size M · sculpted faces',
  abstract:'UK 8–10 and size M · gloss black or white',
  colourful:'UK 8–10 and size M · metallic and gloss colours',
  sports:'Athletic build · running and training poses',
  children:'Toddler to pre-teen · girl and boy',
  'dress-forms':'Pinnable · a range of dress sizes',
  'body-forms':'For tops and dresses · table or floor stand',
  heads:'For wigs, jewellery and eyewear',
  legs:'For denim, hosiery and footwear',
  torsos:'For tops and jackets · floor or hanging',
  racks:'Wrought iron · single pieces or bulk',
  'hangers-plastic':'Any quantity · volume pricing',
  'hangers-metal':'Any quantity · volume pricing',
  'hangers-wooden':'Any quantity · volume pricing',
  't-stand':'Display stands · buy or rent',
  mirrors:'Full length · distortion-free glass',
  'steam-irons':'For sale or rent, to finish a display',
  studio:'Bhowanipore studio · mannequins ready on set'
};
$$('.card').forEach(card=>{
  const b=card.querySelector('[data-add]');
  if(!b||!HINT[b.dataset.add]||card.querySelector('.card-spec')) return;
  const spec=document.createElement('span');
  spec.className='card-spec';
  spec.textContent=HINT[b.dataset.add];
  const title=card.querySelector('.card-body h3');
  if(title) title.insertAdjacentElement('afterend', spec);
});
(function structured(){
  const blocks=[];
  const faqs=[...document.querySelectorAll('details')].map(d=>{
    const q=d.querySelector('summary'); const a=d.querySelector('p');
    if(!q||!a) return null;
    return {'@type':'Question',name:q.textContent.trim(),acceptedAnswer:{'@type':'Answer',text:a.textContent.trim()}};
  }).filter(Boolean);
  const hasType=type=>[...document.querySelectorAll('script[type="application/ld+json"]')].some(s=>{ try{ return JSON.parse(s.textContent)['@type']===type; }catch(e){ return false; } });
  if(faqs.length && !hasType('FAQPage')) blocks.push({'@context':'https://schema.org','@type':'FAQPage',mainEntity:faqs});
  const slug=(location.pathname.split('/').pop()||'index.html').replace(/\.html$/,'');
  const product=P.find(p=>p.slug===slug);
  if(product && !hasType('Product')){
    const desc=document.querySelector('meta[name="description"]');
    blocks.push({'@context':'https://schema.org','@type':'Product',name:product.name,image:product.img,description:desc?desc.content:'',brand:{'@type':'Brand',name:'The M Co.'},category:product.group});
  }
  blocks.forEach(obj=>{ const s=document.createElement('script'); s.type='application/ld+json'; s.textContent=JSON.stringify(obj); document.head.appendChild(s); });
})();
sync();
})();
