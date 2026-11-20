// Static site generator for The M Co. lead-gen site. Run: node build/build.js
const fs = require('fs'), path = require('path');
const { SITE, CATEGORIES, PRODUCTS, FAQS } = require('./data');
const OUT = process.argv[2] || path.join(__dirname, '..', 'dist');
const U = SITE.U;
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true });

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const visible = PRODUCTS.filter(p => !p.hidden);
const cat = id => CATEGORIES.find(c => c.id === id);
const inCat = id => visible.filter(p => p.group === id);

/* ---------- assets ---------- */
fs.writeFileSync(path.join(OUT, 'assets/style.css'),
  fs.readFileSync(path.join(__dirname, 'base.css'), 'utf8') + fs.readFileSync(path.join(__dirname, 'extra.css'), 'utf8'));
fs.writeFileSync(path.join(OUT, 'assets/data.js'), 'window.MCO_DATA=' + JSON.stringify({
  products: PRODUCTS.map(p => ({ id: p.id, slug: p.slug, code: p.code, name: p.name, img: p.images[0], buy: p.buy, rent: p.rent, group: p.group, hidden: !!p.hidden }))
}) + ';');
fs.copyFileSync(path.join(__dirname, 'app.js'), path.join(OUT, 'assets/app.js'));

/* ---------- icons ---------- */
const I = {
  arrow: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  wa: '<svg class="ico" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1s-.5-.1-.7.1-.8 1-1 1.2-.4.2-.7.1a8 8 0 01-2.4-1.5 9 9 0 01-1.6-2.1c-.2-.3 0-.5.1-.6l.5-.6.3-.5v-.5l-1-2.2c-.2-.6-.5-.5-.7-.5h-.6a1.1 1.1 0 00-.8.4 3.4 3.4 0 00-1 2.5 5.9 5.9 0 001.2 3.1 13.3 13.3 0 005.1 4.5c.7.3 1.3.5 1.7.6a4.2 4.2 0 001.9.1 3.2 3.2 0 002.1-1.5 2.6 2.6 0 00.2-1.5c-.1-.1-.3-.2-.6-.3zM12 21.8a9.9 9.9 0 01-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4a9.9 9.9 0 1118.2-5.3 9.9 9.9 0 01-9.9 9.9zm8.4-18.3A11.8 11.8 0 001.7 17.7L0 24l6.4-1.7a11.8 11.8 0 005.6 1.4 11.8 11.8 0 008.4-20.2z"/></svg>',
  phone: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.4 1.8.7 2.7a2 2 0 01-.5 2.1L8 9.8a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.4c.9.3 1.8.6 2.7.7a2 2 0 011.7 2z"/></svg>',
  mail: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/></svg>',
  pin: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s7-6.2 7-12a7 7 0 10-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  list: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8V7a3 3 0 016 0v1"/></svg>',
  lock: '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 018 0v3"/></svg>',
  chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>',
  yt: '<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M23 7.2a3 3 0 00-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 001 7.2 31 31 0 00.5 12 31 31 0 001 16.8a3 3 0 002.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 002.1-2.1 31 31 0 00.5-4.8 31 31 0 00-.5-4.8zM9.7 15.1V8.9L15.5 12z"/></svg>'
};

/* ---------- layout ---------- */
function header(active) {
  const a = k => active === k ? ' class="active"' : '';
  const drop = CATEGORIES.map(c => `<div><h5><a href="${c.slug}.html">${c.short}</a></h5>${inCat(c.id).map(p => `<a href="${p.slug}.html">${esc(p.name)}</a>`).join('')}</div>`).join('');
  return `
<div class="topbar"><div class="wrap">
  <div class="tb-left"><span><i class="dot"></i> Sale &amp; Rental · Since 2008</span><span>📍 Bhowanipore, Kolkata</span></div>
  <div class="tb-right"><a href="tel:${SITE.tel}">${SITE.phone}</a><a href="mailto:${SITE.email}">${SITE.email}</a></div>
</div></div>
<header class="nav" id="nav"><div class="wrap">
  <a href="index.html" class="logo" aria-label="The M Co. home"><img src="${SITE.logo}" alt="The M Co. logo"><span><b>The M Co.</b><small>Mannequin Studio</small></span></a>
  <nav class="menu" aria-label="Main">
    <a href="index.html"${a('home')}>Home</a>
    <div class="has-drop"><button type="button"${active === 'products' ? ' style="color:var(--gold)"' : ''}>Products ${I.chev}</button><div class="drop">${drop}<a class="all" href="products.html">View all products →</a></div></div>
    <a href="rental.html"${a('rental')}>Rental</a>
    <a href="studio.html"${a('studio')}>Studio</a>
    <a href="about.html"${a('about')}>About</a>
    <a href="faq.html"${a('faq')}>FAQ</a>
    <a href="contact.html"${a('contact')}>Contact</a>
  </nav>
  <div class="nav-cta">
    <button class="quote-pill" data-open-drawer aria-label="Open quote list">${I.list}<span class="lbl-txt">Quote</span><span class="count qcount">0</span></button>
    <a class="btn btn-dark btn-sm" href="get-quote.html">Get Price Code</a>
    <button class="burger" id="burger" aria-label="Menu"><svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
  </div>
</div>
<nav class="mobile-menu" id="mmenu">
  <a href="index.html">Home</a><a href="products.html">All products</a>
  ${CATEGORIES.map(c => `<a class="sub" href="${c.slug}.html">${c.short}</a>`).join('')}
  <a href="rental.html">Rental</a><a href="studio.html">Studio</a><a href="about.html">About</a><a href="faq.html">FAQ</a><a href="contact.html">Contact</a><a href="get-quote.html"><b>Get Price Code →</b></a>
</nav></header>`;
}

function footer() {
  return `
<footer><div class="wrap">
  <div class="f-grid">
    <div class="f-logo"><img src="${SITE.logoWhite}" alt="The M Co.">
      <p>Kolkata's trusted source for mannequins, dress forms and display solutions, for sale and rent, since 2008.</p>
      <div class="socials">
        <a href="${SITE.instagram}" target="_blank" rel="noopener" aria-label="Instagram"><svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor"/></svg></a>
        <a href="${SITE.facebook}" target="_blank" rel="noopener" aria-label="Facebook"><svg class="ico" viewBox="0 0 24 24" fill="currentColor"><path d="M14 8h3V4h-3a4 4 0 00-4 4v2H8v4h2v8h4v-8h3l1-4h-4V8z"/></svg></a>
        <a href="${SITE.youtube}" target="_blank" rel="noopener" aria-label="YouTube"><svg class="ico" viewBox="0 0 24 24" fill="currentColor"><path d="M23 7.2a3 3 0 00-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 001 7.2 31 31 0 00.5 12 31 31 0 001 16.8a3 3 0 002.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 002.1-2.1 31 31 0 00.5-4.8 31 31 0 00-.5-4.8zM9.7 15.1V8.9L15.5 12z"/></svg></a>
        <a href="#" data-wa="Hi The M Co.!" aria-label="WhatsApp">${I.wa}</a>
      </div></div>
    <div><h4>Mannequins</h4><ul>${inCat('mannequins').map(p => `<li><a href="${p.slug}.html">${esc(p.name)}</a></li>`).join('')}</ul></div>
    <div><h4>Forms &amp; Fixtures</h4><ul>${visible.filter(p => p.group !== 'mannequins').slice(0, 9).map(p => `<li><a href="${p.slug}.html">${esc(p.name)}</a></li>`).join('')}</ul></div>
    <div><h4>Company</h4><ul>
      <li><a href="about.html">About us</a></li><li><a href="rental.html">Rental</a></li><li><a href="studio.html">Studio on rent</a></li><li><a href="faq.html">FAQ</a></li><li><a href="contact.html">Contact</a></li><li><a href="get-quote.html">Get a price code</a></li>
      <li style="margin-top:10px">${SITE.address}</li><li><a href="tel:${SITE.tel}">${SITE.phone}</a></li></ul></div>
  </div>
  <div class="f-bottom"><span>© <span class="yr"></span> The M Co. All rights reserved.</span><span><a href="https://themcostudio.com/blog/">Blog</a> · <a href="https://themcostudio.com/contact-us/">Privacy Policy / Terms</a></span></div>
</div></footer>
<a class="fab" href="#" data-wa="Hi The M Co., I'd like a price for mannequins." aria-label="Chat on WhatsApp"><svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1s-.5-.1-.7.1-.8 1-1 1.2-.4.2-.7.1a8 8 0 01-2.4-1.5 9 9 0 01-1.6-2.1c-.2-.3 0-.5.1-.6l.5-.6.3-.5v-.5l-1-2.2c-.2-.6-.5-.5-.7-.5h-.6a1.1 1.1 0 00-.8.4 3.4 3.4 0 00-1 2.5 5.9 5.9 0 001.2 3.1 13.3 13.3 0 005.1 4.5c.7.3 1.3.5 1.7.6a4.2 4.2 0 001.9.1 3.2 3.2 0 002.1-1.5 2.6 2.6 0 00.2-1.5c-.1-.1-.3-.2-.6-.3zM12 21.8a9.9 9.9 0 01-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4a9.9 9.9 0 1118.2-5.3 9.9 9.9 0 01-9.9 9.9zm8.4-18.3A11.8 11.8 0 001.7 17.7L0 24l6.4-1.7a11.8 11.8 0 005.6 1.4 11.8 11.8 0 008.4-20.2z"/></svg></a>
<div class="mbar"><a class="m-call" href="tel:${SITE.tel}">Call</a><a class="m-wa" href="#" data-wa="Hi The M Co., I'd like a price for mannequins.">WhatsApp</a><a class="m-code" href="get-quote.html">Get Price Code</a></div>
<div class="overlay" id="qOverlay" role="dialog" aria-modal="true" aria-label="Request a price code"><div class="modal qmodal" id="qModal"></div></div>
<div class="overlay" id="promoOverlay" role="dialog" aria-modal="true" aria-label="Get the catalogue"><div class="modal promo">
  <button class="x" data-close="promoOverlay" aria-label="Close">×</button>
  <div class="promo-img"><img src="${U}2021/09/c1.jpg" alt="Metallic pink mannequin" loading="lazy"></div>
  <form class="promo-txt" id="promoForm" novalidate><span class="eyebrow">Before you go</span><h2>Get the full catalogue on <em>WhatsApp</em></h2>
    <p>Every style, size and finish we stock, sent straight to your phone along with current offers.</p>
    <input class="field" id="promoPhone" type="tel" inputmode="numeric" placeholder="WhatsApp number (10 digits)" style="margin-bottom:10px">
    <button class="btn btn-dark btn-block" type="submit">Send me the catalogue</button><p class="fine">No spam. Only the catalogue and your quote.</p></form>
</div></div>
<div class="scrim" id="scrim" onclick="mcoCloseDrawer()"></div>
<aside class="drawer" id="drawer" aria-label="Quote list">
  <div class="drawer-head"><h3>Your quote list</h3><button class="x x-sm" onclick="mcoCloseDrawer()" aria-label="Close">×</button></div>
  <div class="drawer-list" id="dList"></div>
  <div class="drawer-foot"><p>Add everything you need, then request one price code for the whole list.</p><button class="btn btn-dark btn-block" data-quote="list">Request price code for all</button></div>
</aside>
<div class="toast" id="toast"></div>`;
}

function page(file, { title, desc, active, body, schema, ogImage }) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${ogImage || U + '2021/08/rental-img.jpg'}">
<link rel="icon" href="${SITE.logo}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/style.css">
<!-- TRACKING: paste GA4 / Google Ads / Meta Pixel here. Leads fire dataLayer event 'lead_submit'. -->
${schema ? `<script type="application/ld+json">${JSON.stringify(schema)}</script>` : ''}
</head>
<body>
${header(active)}
<main>
${body}
</main>
${footer()}
<script src="assets/data.js"></script>
<script src="assets/app.js"></script>
</body>
</html>`;
  fs.writeFileSync(path.join(OUT, file), html);
}

/* ---------- reusable blocks ---------- */
const card = p => `<a class="card" href="${p.slug}.html" data-group="${p.group}" data-rent="${p.rent ? 1 : 0}">
  <div class="card-img"><img class="main" src="${p.images[0]}" alt="${esc(p.name)}" loading="lazy">${p.images[1] ? `<img class="alt" src="${p.images[1]}" alt="" loading="lazy">` : ''}
    <div class="tags">${p.buy ? '<span class="tag">Buy</span>' : ''}${p.rent ? '<span class="tag rent">Rent</span>' : ''}</div>
    ${p.images.length > 1 ? `<span class="styles-count">${p.images.length} styles</span>` : ''}</div>
  <div class="card-body"><span class="cat">${cat(p.group).short}</span><h3>${esc(p.name)}</h3><p>${esc(p.tagline)}</p>
    <div class="card-actions"><span class="btn btn-dark">View sizes &amp; details</span><button class="add" data-add="${p.id}" aria-label="Add to quote list" title="Add to quote list">+</button></div></div></a>`;

const faqList = items => items.map(([q, a], i) => `<details${i === 0 ? ' open' : ''}><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('');
const crumbs = arr => `<nav class="crumbs" aria-label="Breadcrumb">${arr.map(([t, h]) => h ? `<a href="${h}">${esc(t)}</a>` : `<b style="color:var(--ink)">${esc(t)}</b>`).join('<span>/</span>')}</nav>`;
const ctaBand = (h = 'Ready for an exact price?', p = 'Pick your products and get a price code. It takes under a minute.') => `
<section style="padding-top:0"><div class="wrap"><div class="cta-band reveal"><div><h2>${h}</h2><p>${p}</p></div>
<div class="btns"><a class="btn btn-gold" href="get-quote.html">Get my price code</a><a class="btn btn-line" href="#" data-wa="Hi The M Co., I'd like a price.">${I.wa} WhatsApp us</a></div></div></div></section>`;
const steps = `<div class="steps">
  <div class="step reveal"><div class="num">01</div><h3>Pick your products</h3><p>Browse sizes, finishes and specs. Add as many items as you like to your quote list.</p></div>
  <div class="step reveal"><div class="num">02</div><h3>Request a price code</h3><p>Tell us buy or rent, quantity and dates. You get a unique reference code right away.</p><div class="code-sample-wrap"><small>Example code</small><span class="code-sample">MCO-HDL-7K3Q</span></div></div>
  <div class="step reveal"><div class="num">03</div><h3>Get your exact quote</h3><p>Send the code on WhatsApp and our team replies with a detailed price, usually the same working day.</p></div>
  <div class="step reveal"><div class="num">04</div><h3>Delivery or pickup</h3><p>Confirm, and we arrange delivery or showroom pickup. For rentals, we schedule the return too.</p></div>
</div>`;
const NAMES = ['Anamika Khanna', 'Sabyasachi Mukherjee', 'Kiran Uttam Ghosh', 'Shantanu Goenka', 'Anita Dongre', 'Masaba Gupta'];
const LOGOS = [1, 2, 3, 4, 5, 6].map(n => `${U}2021/09/logo-0${n}.jpg`);
const storeSchema = { '@context': 'https://schema.org', '@type': 'Store', name: 'The M Co. (The Mannequin Co.)', image: SITE.logo, url: 'https://themcostudio.com/', telephone: SITE.phone, email: SITE.email, foundingDate: '2008',
  address: { '@type': 'PostalAddress', streetAddress: '238B, Acharya Jagadish Chandra Bose Rd, Sreepally, Bhowanipore', addressLocality: 'Kolkata', addressRegion: 'West Bengal', postalCode: '700020', addressCountry: 'IN' },
  sameAs: [SITE.facebook, SITE.instagram, SITE.youtube] };

/* ================= HOME ================= */
page('index.html', {
  title: 'Buy or Rent Mannequins in Kolkata – Get Your Price Code | The M Co.',
  desc: 'Mannequins, dress forms, body forms, heads, legs, torsos, racks, hangers, mirrors & steamers for sale or rent in Kolkata. Pick a product, get a price code and receive exact pricing on WhatsApp.',
  active: 'home', schema: storeSchema,
  body: `
<section class="hero"><div class="wrap hero-grid">
  <div>
    <span class="eyebrow">Kolkata's mannequin studio · Buy or Rent</span>
    <h1>Display that <em>sells</em> the outfit, priced for exactly what you need.</h1>
    <p class="lead">Mannequins, dress forms, body forms, heads, legs, torsos, racks, hangers, mirrors and steamers. Pick what you need and request a price code. We'll send you the exact price on WhatsApp.</p>
    <div class="hero-ctas"><a href="products.html" class="btn btn-dark">Browse all products ${I.arrow}</a><a href="rental.html" class="btn btn-line">Rent for a shoot or event</a></div>
    <div class="hero-proof"><div><strong>2008</strong>serving fashion<br>since</div><div><strong>${visible.length}</strong>product lines,<br>buy or rent</div><div><strong>6+</strong>leading designer<br>labels served</div></div>
  </div>
  <div class="hero-visual">
    <div class="hero-img"><img src="${U}2021/08/rental-img.jpg" alt="Linen-finish mannequins at The M Co." fetchpriority="high"></div>
    <div class="badge-float"><i class="dot"></i> Rentals for shoots &amp; events</div>
    <form class="quick-card" id="quickForm" novalidate>
      <h3>Get your price code</h3><p>Takes 30 seconds. Exact pricing on WhatsApp.</p>
      <div class="qc-row"><div class="seg"><button type="button" class="on" data-v="Buy">Buy</button><button type="button" data-v="Rent">Rent</button></div></div>
      <input type="hidden" id="qmode" value="Buy">
      <div class="qc-row"><select class="field" id="qcat" aria-label="What do you need?"></select></div>
      <div class="qc-row"><input class="field" id="qphone" type="tel" inputmode="numeric" placeholder="WhatsApp number (10 digits)" aria-label="WhatsApp number"></div>
      <button class="btn btn-gold btn-block" type="submit">Get my price code</button>
    </form>
  </div>
</div></section>

<div class="clients"><div class="wrap"><p>Trusted by some of India's best-known fashion houses</p>
  <div class="marquee"><div class="track">${[0, 1].map(() => LOGOS.map(l => `<img src="${l}" alt="Client logo" loading="lazy">`).join('') + NAMES.map(n => `<span>${n}</span>`).join('')).join('')}</div></div></div></div>

<section><div class="wrap">
  <div class="sec-head reveal"><div><span class="eyebrow">Shop by category</span><h2>Everything for a <em>beautiful</em> display</h2></div>
    <a class="btn btn-line" href="products.html">View all ${visible.length} products</a></div>
  <div class="cat-tiles">${CATEGORIES.map(c => `<a class="cat-tile reveal" href="${c.slug}.html"><div class="ct-img"><img src="${c.hero}" alt="${esc(c.name)}" loading="lazy"></div>
    <div class="ct-body"><h3>${c.short}</h3><p>${esc(c.tagline)}. ${inCat(c.id).length} product lines.</p><span class="more">Explore ${I.arrow}</span></div></a>`).join('')}</div>
</div></section>

<section id="how" style="background:var(--ivory)"><div class="wrap">
  <div class="sec-head reveal"><div><span class="eyebrow">How it works</span><h2>From browsing to <em>exact price</em> in four steps</h2></div>
    <p class="lead">No guesswork and no outdated price lists. You get a quote for your exact quantity, finish and rental dates.</p></div>
  ${steps}
</div></section>

<section><div class="wrap">
  <div class="sec-head reveal"><div><span class="eyebrow">Most requested</span><h2>Popular <em>right now</em></h2></div><a class="btn btn-line" href="products.html">See everything</a></div>
  <div class="grid">${['headless', 'realistic', 'dress-forms', 'colourful', 'racks', 'mirrors'].map(id => card(PRODUCTS.find(p => p.id === id))).join('')}</div>
</div></section>

<section style="padding-top:0"><div class="wrap rental-grid">
  <div class="rental-mosaic reveal">
    <img src="${U}2021/09/1-2.jpg" alt="Abstract mannequins" loading="lazy"><img src="${U}2021/09/rent.jpg" alt="Photoshoot with a rented torso" loading="lazy"><img src="${U}2021/08/Events1.jpg" alt="Mannequins for events" loading="lazy">
  </div>
  <div class="reveal">
    <span class="eyebrow">Because you don't always need to buy</span>
    <h2>Rent premium mannequins, <em>only for as long</em> as you need</h2>
    <p class="lead" style="margin-top:16px">Shoots, launches, trials, exhibitions and events. Rent mannequins, forms, racks and mirrors, or book our studio with everything on set.</p>
    <ul class="ticks two"><li>Product photoshoots</li><li>Product launches</li><li>Fit &amp; product trials</li><li>Events &amp; exhibitions</li></ul>
    <div class="hero-btns"><a class="btn btn-dark" href="rental.html">How rental works</a><a class="btn btn-line" href="studio.html">Studio on rent</a></div>
  </div>
</div></section>

<section style="padding-top:0"><div class="wrap"><div class="quote-band reveal">
  <img src="${U}2021/09/man3.jpg" alt="Grey fibreglass mannequins" loading="lazy">
  <blockquote>“Our company is not just about the quantity of our offerings. It is also about the quality of our offerings.”<cite>The M Co., serving ${NAMES.slice(0, 5).join(', ')} &amp; ${NAMES[5]}. <a href="about.html" style="text-decoration:underline">Our story →</a></cite></blockquote>
</div></div></section>

<section style="background:var(--ivory)"><div class="wrap faq-grid">
  <div class="reveal"><span class="eyebrow">FAQ</span><h2>Good questions, <em>quick</em> answers</h2><p class="lead" style="margin:16px 0 26px">More answers on our <a href="faq.html" style="text-decoration:underline">FAQ page</a>.</p></div>
  <div class="reveal">${faqList(FAQS.general.slice(0, 4))}</div>
</div></section>
${ctaBand()}`
});

/* ================= ALL PRODUCTS ================= */
page('products.html', {
  title: 'All Products – Mannequins, Forms, Racks, Hangers & Mirrors | The M Co. Kolkata',
  desc: 'Browse every mannequin, dress form, body form, head, leg, torso, rack, hanger, mirror and steamer we sell or rent. View sizes and request a price code.',
  active: 'products',
  body: `
<section class="page-hero"><div class="wrap">
  ${crumbs([['Home', 'index.html'], ['All products']])}
  <h1>The full <em>catalogue</em></h1>
  <p class="lead">${visible.length} product lines for sale or rent. Open any product for sizes, finishes and specifications, then request your price code.</p>
</div></section>
<section style="background:var(--ivory);padding-top:40px"><div class="wrap">
  <div class="filters">
    <div class="chips" id="chips"><button class="chip on" data-g="all">All products</button>${CATEGORIES.map(c => `<button class="chip" data-g="${c.id}">${c.short}</button>`).join('')}</div>
    <label class="toggle"><input type="checkbox" id="rentOnly"><span class="sw"></span>Show rentable only</label>
  </div>
  <div class="grid" id="grid" data-filterable>${visible.map(card).join('')}</div>
  <p class="empty" id="emptyMsg" hidden>No products match this filter.</p>
</div></section>
${ctaBand('Not sure what you need?', 'Tell us about your store, shoot or event and we’ll recommend the right pieces with a price.')}`
});

/* ================= CATEGORY PAGES ================= */
const catFaq = { mannequins: FAQS.products.slice(0, 2), forms: FAQS.products.slice(1, 2).concat([FAQS.general[3]]), fixtures: FAQS.products.slice(1, 3) };
CATEGORIES.forEach(c => {
  const items = inCat(c.id);
  page(c.slug + '.html', {
    title: `${c.name} for Sale & Rent in Kolkata | The M Co.`,
    desc: c.intro.slice(0, 155),
    active: 'products', ogImage: c.hero,
    body: `
<section class="page-hero"><div class="wrap ph-grid">
  <div>${crumbs([['Home', 'index.html'], ['Products', 'products.html'], [c.short]])}
    <h1>${esc(c.name)}</h1><p class="lead">${esc(c.intro)}</p>
    <ul class="ticks two">${c.points.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
    <div class="hero-btns"><a class="btn btn-dark" href="#range">See the range</a><a class="btn btn-line" href="get-quote.html">Get a price code</a></div></div>
  <div class="ph-img"><img src="${c.hero}" alt="${esc(c.name)}"></div>
</div></section>
<section id="range" style="background:var(--ivory)"><div class="wrap">
  <div class="sec-head reveal"><div><span class="eyebrow">${items.length} product lines</span><h2>Choose your <em>${c.short.toLowerCase()}</em></h2></div></div>
  <div class="grid">${items.map(card).join('')}</div>
</div></section>
<section><div class="wrap faq-grid">
  <div class="reveal"><span class="eyebrow">How it works</span><h2>Exact price, <em>no guesswork</em></h2>
    <div class="mini-steps"><div><b>1</b><span>Open a product to see sizes, finishes and specs.</span></div><div><b>2</b><span>Request a price code with your quantity, buy/rent choice and dates.</span></div><div><b>3</b><span>Send the code on WhatsApp and get your itemised quote, ${'usually the same working day'}.</span></div></div></div>
  <div class="reveal">${faqList(catFaq[c.id].concat(FAQS.general.slice(0, 2)))}</div>
</div></section>
${ctaBand()}`
  });
});

/* ================= PRODUCT PAGES ================= */
visible.forEach(p => {
  const c = cat(p.group);
  const related = visible.filter(x => x.group === p.group && x.id !== p.id).slice(0, 3);
  while (related.length < 3) { const r = visible.find(x => x.id !== p.id && !related.includes(x)); related.push(r); }
  const pfaq = [
    ['Are these exact measurements?', 'The sizes shown are standard ranges for ' + p.name.toLowerCase() + '. Exact dimensions vary by model, and your quote confirms the precise measurements of the pieces you choose.'],
    p.rent ? ['Can I rent ' + p.name.toLowerCase() + '?', 'Yes. Choose “Rent” in the form, add your start date and duration, and we’ll quote the exact rental price for your dates.']
           : ['Is there a minimum order?', 'You can order any quantity. Larger quantities get volume pricing, so add your quantity to the request.'],
    ['Can I see them in person?', 'Yes. Visit our Bhowanipore studio. Call ' + SITE.phone + ' ahead and we’ll keep your shortlisted pieces ready.']
  ];
  page(p.slug + '.html', {
    title: `${p.name}${p.rent ? ' – Buy or Rent' : ''} in Kolkata | Sizes & Price | The M Co.`,
    desc: `${p.desc.slice(0, 120)} View sizes & specs and get your price code.`,
    active: 'products', ogImage: p.images[0],
    schema: { '@context': 'https://schema.org', '@type': 'Product', name: p.name, image: p.images, description: p.desc, brand: { '@type': 'Brand', name: 'The M Co.' }, category: c.name },
    body: `
<div class="wrap" style="padding-top:22px">${crumbs([['Home', 'index.html'], ['Products', 'products.html'], [c.short, c.slug + '.html'], [p.name]])}</div>
<div class="wrap pd-page">
  <div class="pd-gallery">
    <div class="pd-main"><img id="pdMain" src="${p.images[0]}" alt="${esc(p.name)}"></div>
    ${p.images.length > 1 ? `<div class="thumbs">${p.images.map((s, i) => `<button class="${i ? '' : 'on'}" data-src="${s}" aria-label="Style ${i + 1}"><img src="${s}" alt="" loading="lazy"></button>`).join('')}</div>` : ''}
  </div>
  <div class="pd-info">
    <span class="eyebrow">${c.short}</span>
    <h1>${esc(p.name)}</h1>
    <div class="pd-tags">${p.buy ? '<span class="pill">Available to buy</span>' : ''}${p.rent ? '<span class="pill dark">Available to rent</span>' : ''}${p.images.length > 1 ? `<span class="pill">${p.images.length} styles</span>` : ''}</div>
    <p>${esc(p.desc)}</p><p class="pd-more">${esc(p.more)}</p>
    <div class="pd-sub">Options</div><div class="variants">${p.variants.map(v => `<span>${esc(v)}</span>`).join('')}</div>
    <div class="pd-sub">Sizes &amp; specifications</div>
    <table class="specs">${p.specs.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</table>
    <p class="note">ⓘ Dimensions vary by model. Your quote confirms the exact measurements of the pieces you pick.</p>
    <div class="pd-sub">Ideal for</div><div class="ideal">${p.ideal.map(v => `<span>${esc(v)}</span>`).join('')}</div>
    <div class="price-lock">${I.lock}<div><b>Price depends on model, quantity${p.rent ? ' &amp; rental days' : ''}</b><span>Request a code and we'll send the exact price on WhatsApp, usually the same working day.</span></div></div>
    <div class="pd-cta"><a class="btn btn-gold" href="#quote">Get price code</a><button class="btn btn-line" data-add="${p.id}">+ Add to quote list</button></div>
  </div>
</div>

<section class="quote-sec" id="quote"><div class="wrap quote-grid">
  <div class="reveal"><span class="eyebrow">Request a price code</span><h2>Get the exact price for <em>${esc(p.name.toLowerCase())}</em></h2>
    <div class="mini-steps"><div><b>1</b><span>Choose buy or rent, and add quantity and size or finish.</span></div><div><b>2</b><span>Get your unique price code instantly.</span></div><div><b>3</b><span>Send it on WhatsApp and receive your itemised quote.</span></div></div>
    <div class="pd-sub" style="margin-top:34px">Questions</div>${faqList(pfaq)}</div>
  <div class="form-card reveal"><h3>${esc(p.name)}</h3><p>Fill this once. We reply on WhatsApp &amp; email.</p><div data-inline-form data-items="${p.id}"${p.buy ? '' : ' data-mode="Rent"'}></div></div>
</div></section>

<section class="related"><div class="wrap"><h2>You may also <em>need</em></h2><div class="grid">${related.map(card).join('')}</div></div></section>`
  });
});

/* ================= RENTAL ================= */
const rentable = visible.filter(p => p.rent);
page('rental.html', {
  title: 'Mannequin Rental in Kolkata – Shoots, Launches & Events | The M Co.',
  desc: 'Rent mannequins, dress forms, body forms, heads, legs, torsos, racks, mirrors and steamers in Kolkata for photoshoots, product launches, trials and events. Get a rental price code.',
  active: 'rental',
  body: `
<section class="page-hero"><div class="wrap ph-grid">
  <div>${crumbs([['Home', 'index.html'], ['Rental']])}
    <span class="eyebrow" style="display:block;margin-top:14px">Because you don't always need to buy</span>
    <h1>Mannequin <em>rental</em>, made simple</h1>
    <p class="lead">Your display needs change. Rent high-quality mannequins, dress forms, heads, legs, torsos, mirrors and more for a special event, a seasonal change or a regular refresh. Try new styles and setups without the cost of a long-term purchase.</p>
    <div class="hero-btns"><a class="btn btn-dark" href="#rent-form">Get a rental price code</a><a class="btn btn-line" href="#rentable">What can I rent?</a></div></div>
  <div class="ph-img cover"><img src="${U}2021/08/rental-img.jpg" alt="Mannequins available on rent"></div>
</div></section>

<section><div class="wrap">
  <div class="sec-head reveal"><div><span class="eyebrow">How rental works</span><h2>Four steps, <em>zero hassle</em></h2></div></div>
  <div class="steps rent-steps">
    <div class="step reveal"><div class="num">01</div><h3>Share your dates</h3><p>Tell us what you need, how many and for how long.</p></div>
    <div class="step reveal"><div class="num">02</div><h3>Get your code &amp; quote</h3><p>You get a price code instantly and an exact rental quote on WhatsApp.</p></div>
    <div class="step reveal"><div class="num">03</div><h3>Delivery or pickup</h3><p>We deliver to your venue or studio, or you collect from our showroom.</p></div>
    <div class="step reveal"><div class="num">04</div><h3>Easy return</h3><p>When you're done, we schedule the pickup or you drop them back.</p></div>
  </div>
</div></section>

<section style="background:var(--ivory)"><div class="wrap">
  <div class="sec-head reveal"><div><span class="eyebrow">Use cases</span><h2>What our rentals <em>power</em></h2></div></div>
  <div class="use-cards">${[
    ['Product photoshoots', 'We rent mannequins and accessories for catalogue, lookbook and e-commerce shoots.', U + '2021/09/rent.jpg', 'Product Photoshoot'],
    ['Studio space on rent', 'Book our spacious studio to shoot your products, with mannequins on set.', U + '2021/09/p1.png', 'Studio booking'],
    ['Product launches', 'Statement mannequins to make your launch stand out.', U + '2021/08/supplier.jpg', 'Product Launch'],
    ['Product trials', 'A range of the best mannequins for fit and product trials.', U + '2021/08/Trials.jpg', 'Product Trials'],
    ['Events & exhibitions', 'Whether you’re buying or renting, we have enough stock to cover your event.', U + '2021/08/Events1.jpg', 'Events / Exhibition'],
    ['Seasonal refresh', 'Swap your window look each season without buying new stock.', U + '2021/09/c1.jpg', 'Seasonal display refresh']
  ].map(([h, t, img, n]) => `<div class="use-card reveal"><img src="${img}" alt="${esc(h)}" loading="lazy"><div><h3>${h}</h3><p>${t}</p>
    <button data-quote="${n === 'Studio booking' ? 'studio' : ''}" data-mode="Rent" data-notes="Purpose: ${n}. ">Get a rental quote →</button></div></div>`).join('')}</div>
</div></section>

<section id="rentable"><div class="wrap">
  <div class="sec-head reveal"><div><span class="eyebrow">${rentable.length} product lines on rent</span><h2>What you can <em>rent</em></h2></div></div>
  <div class="grid">${rentable.map(card).join('')}</div>
</div></section>

<section class="quote-sec" id="rent-form"><div class="wrap quote-grid">
  <div class="reveal"><span class="eyebrow">Rental FAQ</span><h2>Before you <em>rent</em></h2><div style="margin-top:24px">${faqList(FAQS.rental)}</div></div>
  <div class="form-card reveal"><h3>Get a rental price code</h3><p>Share your dates and we’ll quote the exact rental price.</p><div data-inline-form data-mode="Rent"></div></div>
</div></section>`
});

/* ================= STUDIO ================= */
page('studio.html', {
  title: 'Photo Studio on Rent in Kolkata with Mannequins | The M Co.',
  desc: 'Book The M Co. studio in Bhowanipore, Kolkata for product photoshoots, with mannequins, dress forms and props on set. Request availability and price.',
  active: 'studio',
  body: `
<section class="page-hero"><div class="wrap ph-grid">
  <div>${crumbs([['Home', 'index.html'], ['Studio']])}
    <span class="eyebrow" style="display:block;margin-top:14px">Studio space on rent</span>
    <h1>Shoot here, with the <em>mannequins</em> on hand</h1>
    <p class="lead">Book our spacious studio in Bhowanipore for product photography. Mannequins, dress forms, torsos and props from our full range are ready on set, so there's nothing to transport.</p>
    <div class="hero-btns"><a class="btn btn-gold" href="#studio-form">Check availability</a><a class="btn btn-line" href="#" data-wa="Hi The M Co., I'd like to book your studio for a shoot.">${I.wa} WhatsApp</a></div></div>
  <div class="ph-img cover"><img src="${U}2021/09/p1.png" alt="Photo studio with lighting"></div>
</div></section>
<section><div class="wrap split">
  <img src="${U}2021/09/rent.jpg" alt="Photographer shooting a garment on a torso" loading="lazy" class="reveal">
  <div class="reveal"><span class="eyebrow">Why shoot with us</span><h2>Studio + mannequins in <em>one booking</em></h2>
    <ul class="ticks"><li>Ideal for catalogue, e-commerce, lookbook and social content</li><li>Choose from headless, realistic, abstract, colourful and children’s mannequins, plus dress forms, torsos, heads and legs</li><li>Racks, hangers, mirrors and steamers available on set</li><li>Combine studio and mannequin rental in one price code</li><li>Central Kolkata location in Bhowanipore</li></ul>
    <div class="hero-btns"><a class="btn btn-dark" href="products.html?rent=1">Browse rentable mannequins</a></div></div>
</div></section>
<section class="quote-sec" id="studio-form"><div class="wrap quote-grid">
  <div class="reveal"><span class="eyebrow">Book the studio</span><h2>Tell us about your <em>shoot</em></h2>
    <div class="mini-steps"><div><b>1</b><span>Share your date, hours and what you're shooting.</span></div><div><b>2</b><span>Mention any mannequins or props you need on set.</span></div><div><b>3</b><span>Get your price code and confirm on WhatsApp.</span></div></div></div>
  <div class="form-card reveal"><h3>Studio availability &amp; price</h3><p>We’ll confirm availability and send the exact price.</p><div data-inline-form data-items="studio" data-mode="Rent" data-notes="Shoot date & hours: \nWhat we're shooting: \nMannequins / props needed: "></div></div>
</div></section>`
});

/* ================= ABOUT ================= */
page('about.html', {
  title: 'About The M Co. – Kolkata’s Mannequin Studio Since 2008',
  desc: 'Since 2008, The M Co. has been the one-stop shop for mannequins and display accessories, trusted by Sabyasachi, Anita Dongre, Masaba Gupta, Anamika Khanna and more.',
  active: 'about', schema: storeSchema,
  body: `
<section class="page-hero"><div class="wrap ph-grid">
  <div>${crumbs([['Home', 'index.html'], ['About']])}
    <span class="eyebrow" style="display:block;margin-top:14px">Our success &amp; company history</span>
    <h1>Kolkata’s mannequin studio, <em>since 2008</em></h1>
    <p class="lead">A one-stop shop for every type of mannequin and display accessory, trusted by some of the biggest names in Indian fashion.</p></div>
  <div class="ph-img cover"><img src="${U}2021/09/1-2.jpg" alt="Mannequins at The M Co."></div>
</div></section>
<section><div class="wrap split">
  <div class="prose reveal"><span class="eyebrow">Our story</span><h2 style="margin:12px 0 20px">Quality <em>and</em> quantity</h2>
    <p>Starting in 2008, The M Co. has become the one-stop shop for all types of mannequins and related accessories. Though we're only in our second decade, we have served some of the biggest names in the fashion industry.</p>
    <p>They trust us because the merchandise we provide is of the highest quality. Our company is not just about the quantity of our offerings. It is also focused on their quality.</p>
    <p>Today we sell and rent mannequins, dress forms, body forms, heads, legs, torsos, racks, hangers, mirrors and steam irons, and our studio is available on rent for product shoots.</p></div>
  <img src="${U}2021/08/rental-img.jpg" alt="Linen mannequins" loading="lazy" class="reveal">
</div>
<div class="wrap"><div class="stats">
  <div class="stat reveal"><strong>2008</strong><span>Founded in Kolkata</span></div>
  <div class="stat reveal"><strong>${visible.length}</strong><span>Product lines</span></div>
  <div class="stat reveal"><strong>Buy + Rent</strong><span>Flexible for every need</span></div>
  <div class="stat reveal"><strong>Studio</strong><span>Shoot space on rent</span></div>
</div></div></section>
<section style="background:var(--ivory)"><div class="wrap">
  <div class="sec-head reveal"><div><span class="eyebrow">Our clientele</span><h2>Esteemed patrons who <em>trust</em> us</h2></div></div>
  <div class="names reveal">${NAMES.map(n => `<span>${n}</span>`).join('')}</div>
  <div class="logos reveal">${LOGOS.map(l => `<div><img src="${l}" alt="Client logo" loading="lazy"></div>`).join('')}</div>
</div></section>
<section><div class="wrap">
  <div class="sec-head reveal"><div><span class="eyebrow">Product videos</span><h2>See The M Co. <em>studio</em></h2></div><a class="btn btn-line" href="${SITE.youtube}" target="_blank" rel="noopener">Open our YouTube channel</a></div>
  <div class="video-grid">${[1, 2, 3, 4, 5, 6].map(n => `<a href="${SITE.youtube}" target="_blank" rel="noopener">${I.yt} The M Co. Studio, Part ${n}</a>`).join('')}</div>
</div></section>
${ctaBand('Visit our showroom', SITE.address)}`
});

/* ================= FAQ ================= */
page('faq.html', {
  title: 'FAQ – Mannequin Sale, Rental & Price Codes | The M Co. Kolkata',
  desc: 'Answers about price codes, mannequin sizes, finishes, bulk pricing, rental, delivery and visiting The M Co. showroom in Kolkata.',
  active: 'faq',
  schema: { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [...FAQS.general, ...FAQS.products, ...FAQS.rental].map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
  body: `
<section class="page-hero"><div class="wrap">${crumbs([['Home', 'index.html'], ['FAQ']])}<h1>Frequently asked <em>questions</em></h1><p class="lead">Everything about price codes, products, rental and delivery. Still unsure? Message us on WhatsApp.</p></div></section>
<section><div class="wrap faq-grid">
  <div class="reveal"><div style="position:sticky;top:110px"><span class="eyebrow">Need a human?</span><h2 style="margin:12px 0 16px">We reply <em>fast</em></h2>
    <p class="lead" style="margin-bottom:24px">Chat with our team or call us directly.</p>
    <div class="hero-btns" style="margin:0"><a class="btn btn-wa" href="#" data-wa="Hi The M Co., I have a question.">${I.wa} WhatsApp</a><a class="btn btn-line" href="tel:${SITE.tel}">${I.phone} Call</a></div></div></div>
  <div>
    <div class="faq-group reveal"><h3>Price codes &amp; quotes</h3>${faqList(FAQS.general)}</div>
    <div class="faq-group reveal"><h3>Products &amp; sizes</h3>${faqList(FAQS.products)}</div>
    <div class="faq-group reveal"><h3>Rental</h3>${faqList(FAQS.rental)}</div>
  </div>
</div></section>
${ctaBand()}`
});

/* ================= CONTACT ================= */
page('contact.html', {
  title: 'Contact The M Co. – Mannequin Shop in Bhowanipore, Kolkata',
  desc: `Visit or contact The M Co. at ${SITE.address}. Call ${SITE.phone} or email ${SITE.email}.`,
  active: 'contact', schema: storeSchema,
  body: `
<section class="page-hero"><div class="wrap">${crumbs([['Home', 'index.html'], ['Contact']])}<h1>We'd love to <em>hear</em> from you</h1><p class="lead">Questions about products, pricing, rental or a visit? Reach us any way you like, or request a price code below.</p></div></section>
<section><div class="wrap">
  <div class="contact-cards">
    <a href="tel:${SITE.tel}" class="reveal"><span class="ci">${I.phone}</span><small>Call</small><b>${SITE.phone}</b></a>
    <a href="#" data-wa="Hi The M Co.!" class="reveal"><span class="ci">${I.wa}</span><small>WhatsApp</small><b>${SITE.phone}</b></a>
    <a href="mailto:${SITE.email}" class="reveal"><span class="ci">${I.mail}</span><small>Email</small><b>${SITE.email}</b></a>
  </div>
  <div class="contact-grid">
    <div class="reveal"><span class="eyebrow">Studio &amp; showroom</span><h2 style="margin:12px 0 14px">Visit <em>us</em></h2><p class="lead" style="margin-bottom:22px">${SITE.address}</p>
      <div class="map" style="height:360px"><iframe loading="lazy" title="The M Co. location" src="https://www.google.com/maps?q=238B+Acharya+Jagadish+Chandra+Bose+Rd,+Bhowanipore,+Kolkata+700020&output=embed"></iframe></div></div>
    <div class="form-card reveal"><h3>Request your price code</h3><p>Fill this once. We reply on WhatsApp &amp; email.</p><div data-inline-form></div></div>
  </div>
</div></section>`
});

/* ================= GET QUOTE ================= */
page('get-quote.html', {
  title: 'Get Your Price Code – The M Co. Mannequins Kolkata',
  desc: 'Request a price code for mannequins, forms, racks, hangers and mirrors, to buy or rent. Receive an exact quote on WhatsApp.',
  active: '',
  body: `
<section class="page-hero"><div class="wrap">${crumbs([['Home', 'index.html'], ['Get price code']])}<h1>Get your <em>price code</em></h1><p class="lead">Tell us what you need. You'll get a unique code instantly. Send it on WhatsApp for your exact, itemised quote.</p></div></section>
<section style="background:var(--ivory)"><div class="wrap quote-grid">
  <div class="reveal"><span class="eyebrow">How it works</span><h2>Under a <em>minute</em></h2>
    <div class="mini-steps"><div><b>1</b><span>Pick a product, or use your quote list (it carries over from the product pages).</span></div><div><b>2</b><span>Choose buy or rent, and add quantity, sizes and dates.</span></div><div><b>3</b><span>Get your code, e.g. <span class="code-sample" style="display:inline">MCO-HDL-7K3Q</span>.</span></div><div><b>4</b><span>Send it on WhatsApp and get your quote, usually the same working day.</span></div></div>
    <div class="hero-btns"><a class="btn btn-line" href="products.html">Browse products first</a><button class="btn btn-line" data-open-drawer>View quote list (<span class="qcount">0</span>)</button></div></div>
  <div class="form-card reveal"><h3>Your requirement</h3><p>We'll reply on WhatsApp &amp; email.</p><div data-inline-form data-from-url></div></div>
</div></section>`
});

/* README */
fs.writeFileSync(path.join(OUT, 'README.txt'), `THE M CO. – LEAD GENERATION SITE
=================================
Open index.html in a browser. Upload the whole folder (keep the assets/ folder) to any host,
or to a sub-folder of your WordPress server, e.g. themcostudio.com/catalogue/.

Pages: index, products, mannequins, forms-and-parts, racks-hangers-mirrors, ${visible.length} product pages,
rental, studio, about, faq, contact, get-quote.

SETTINGS  ->  assets/app.js  (CONFIG at the top)
  whatsapp  : number that receives enquiries
  endpoint  : optional URL that silently saves every lead (see below)

PRODUCT SIZES / TEXT
  Product specs are typical ranges. Edit them in each product page, or edit build/data.js
  and run "node build/build.js" (Node.js) to regenerate every page into a new "dist" folder.

IMAGES are loaded from https://themcostudio.com/wp-content/uploads/ – don't delete them from WordPress.

SAVE EVERY LEAD TO A GOOGLE SHEET (free)
 1. New Google Sheet -> Extensions -> Apps Script -> paste:

  function doPost(e){
    const d = JSON.parse(e.postData.contents);
    const sh = SpreadsheetApp.getActive().getSheets()[0];
    if (sh.getLastRow() === 0) sh.appendRow(['Time','Code','Name','Phone','Email','City','Mode','Business','Items','Start','Duration','Notes','Page','Source']);
    sh.appendRow([d.time,d.code,d.name,d.phone,d.email,d.city,d.mode,d.business,
      (d.items||[]).map(i=>i.product+' x'+i.qty).join(', '),d.start,d.duration,d.notes,d.page,d.utm_source||'']);
    MailApp.sendEmail('${SITE.email}','New price-code lead '+d.code, JSON.stringify(d,null,2));
    return ContentService.createTextOutput('ok');
  }

 2. Deploy -> New deployment -> Web app -> Execute as: Me, Who has access: Anyone.
 3. Paste the web-app URL into CONFIG.endpoint in assets/app.js.

TRACKING: paste GA4 / Meta Pixel in each page <head>. Every lead fires dataLayer event 'lead_submit'.
`);
fs.mkdirSync(path.join(OUT, 'build'), { recursive: true });
['data.js', 'build.js', 'app.js', 'base.css', 'extra.css'].forEach(f => fs.copyFileSync(path.join(__dirname, f), path.join(OUT, 'build', f)));
console.log('Built', fs.readdirSync(OUT).filter(f => f.endsWith('.html')).length, 'pages ->', OUT);
