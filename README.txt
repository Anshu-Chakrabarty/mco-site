THE M CO. – LEAD GENERATION SITE
=================================
Open index.html in a browser. Upload the whole folder (keep the assets/ folder) to any host,
or to a sub-folder of your WordPress server, e.g. themcostudio.com/catalogue/.

Pages: index, products, mannequins, forms-and-parts, racks-hangers-mirrors, 18 product pages,
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
    MailApp.sendEmail('enquiry@themcostudio.com','New price-code lead '+d.code, JSON.stringify(d,null,2));
    return ContentService.createTextOutput('ok');
  }

 2. Deploy -> New deployment -> Web app -> Execute as: Me, Who has access: Anyone.
 3. Paste the web-app URL into CONFIG.endpoint in assets/app.js.

TRACKING: paste GA4 / Meta Pixel in each page <head>. Every lead fires dataLayer event 'lead_submit'.
