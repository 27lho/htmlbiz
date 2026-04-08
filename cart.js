// Client-side product data and cart handling
(function(){
  const PRODUCTS = [
    {id:'p1',name:'March Birthstone Tumble',category:'tumbles',price:18.00,img:'3_MarchBirthstone-Dropdown.jpg'},
    {id:'p2',name:'March Birthstone Variant',category:'tumbles',price:16.00,img:'3_MarchBirthstone-Dropdown.jpg'},
    {id:'p3',name:'Serpentine Toadstool Carving',category:'carvings',price:48.00,img:'Serpentine-Toadstool-Mushroom-Standing-Gemstone-LNS0542.jpg'},
    {id:'p4',name:'Dual Frequency Amethyst Tower',category:'specimens',price:86.00,img:'Dual-Frequency-Amethyst-Clear-Quartz-Tower-LNS0023A.jpg'},
    {id:'p5',name:'Sunny Side Up Banded Calcite Tower',category:'specimens',price:46.00,img:'Sunny-Side-Up-Banded-Calcite-Mini-Gemstone-Tower-LNS0397B.jpg'},
    {id:'p6',name:'Crystal Voltage Quartz Tower',category:'specimens',price:52.00,img:'Crystal-Voltage-Quartz-Mini-Gemstone-Tower-LNS0036.jpg'},
    {id:'p7',name:'Bloom Within Blossom Agate Tower',category:'specimens',price:64.00,img:'Bloom-Within-Blossom-Agate-Mini-Gemstone-Tower-LNS0349C.jpg'},
    {id:'p8',name:'Clear Quartz Mini Cluster',category:'other',price:32.00,img:'LNS0030CLR-2.jpg'},
    {id:'p9',name:'Mystic Curio Special',category:'other',price:28.00,img:'LNS0721.jpg'}
  ];

  function getCart(){
    try{ return JSON.parse(localStorage.getItem('mc_cart')||'{}') }catch(e){return {}}
  }
  function saveCart(cart){ localStorage.setItem('mc_cart', JSON.stringify(cart)); updateCartCount(); }
  function updateCartCount(){
    const cart = getCart();
    const count = Object.values(cart).reduce((s,q)=>s+q,0);
    document.querySelectorAll('#cart-count').forEach(el=>el.textContent = count);
  }

  function addToCart(id,qty=1){
    const cart = getCart(); cart[id] = (cart[id]||0) + qty; saveCart(cart);
  }
  function removeFromCart(id){ const cart=getCart(); delete cart[id]; saveCart(cart); }
  function setQty(id,q){ const cart=getCart(); if(q<=0) delete cart[id]; else cart[id]=q; saveCart(cart); }

  function renderProducts(filter='all'){
    const container = document.getElementById('products'); if(!container) return;
    container.innerHTML='';
    const list = PRODUCTS.filter(p=> filter==='all' || p.category===filter );
    list.forEach(p=>{
      const card = document.createElement('div'); card.className='product-card';
      card.innerHTML = `
        <img src="${p.img}" alt="${p.name}"/>
        <div class="meta"><span>${p.name}</span><span class="price">$${p.price.toFixed(2)}</span></div>
        <div style="padding:12px"><button class="btn add" data-id="${p.id}">Add to cart</button></div>
      `;
      container.appendChild(card);
    });
    container.querySelectorAll('.btn.add').forEach(b=>b.addEventListener('click',e=>{ addToCart(e.currentTarget.dataset.id,1); alert('Added to cart'); }))
  }

  function renderCartPage(){
    const el = document.getElementById('cart-container'); if(!el) return;
    const cart = getCart();
    if(Object.keys(cart).length===0){ el.innerHTML = '<p>Your cart is empty. <a href="products.html">Continue shopping</a></p>'; document.getElementById('cart-total').textContent='Total: $0.00'; return; }
    const rows=[]; let total=0;
    const table = document.createElement('div');
    table.style.display='grid'; table.style.gap='10px';
    Object.keys(cart).forEach(id=>{
      const p = PRODUCTS.find(x=>x.id===id); if(!p) return;
      const qty = cart[id]; const line = p.price * qty; total += line;
      const row = document.createElement('div'); row.className='product-card';
      row.innerHTML = `<div style="display:flex;gap:12px;align-items:center"><img src="${p.img}" style="width:90px;height:60px;object-fit:cover;border-radius:6px"/><div style="flex:1"><strong>${p.name}</strong><div style="color:var(--muted)">$${p.price.toFixed(2)} each</div></div><div><label>Qty <input type="number" min="0" value="${qty}" data-id="${id}" style="width:64px;padding:6px;border-radius:6px;border:1px solid #efe7df"/></label><div style="margin-top:8px"><button class="btn remove" data-id="${id}">Remove</button></div></div></div>`;
      table.appendChild(row);
    });
    el.innerHTML=''; el.appendChild(table);
    // attach events
    el.querySelectorAll('input[type="number"]').forEach(inp=>inp.addEventListener('change',e=>{ setQty(e.target.dataset.id, parseInt(e.target.value)||0); renderCartPage(); }));
    el.querySelectorAll('.btn.remove').forEach(b=>b.addEventListener('click',e=>{ removeFromCart(e.currentTarget.dataset.id); renderCartPage(); }));
    const totalEl = document.getElementById('cart-total'); if(totalEl) totalEl.textContent = 'Total: $' + total.toFixed(2);
    // expose total for PayPal
    window.MC_cart_total = total;
    window.MC_cart_items = Object.keys(cart).map(id=>{ const p=PRODUCTS.find(x=>x.id===id); return {name:p.name,unit_amount:{currency_code:'USD',value:p.price.toFixed(2)},quantity: String(cart[id])}; });
  }

  function initShopUI(){
    // category tabs
    document.querySelectorAll('.category-tabs .cat').forEach(btn=>{
      btn.addEventListener('click',e=>{
        document.querySelectorAll('.category-tabs .cat').forEach(c=>c.classList.remove('active'));
        e.currentTarget.classList.add('active');
        renderProducts(e.currentTarget.dataset.cat);
      })
    });
    renderProducts('all');
  }

  // PayPal setup (on cart page)
  function setupPayPal(){
    if(typeof paypal === 'undefined') return; // SDK not loaded
    const container = document.getElementById('paypal-buttons'); if(!container) return;
    // clear previous buttons
    container.innerHTML='';
    paypal.Buttons({
      createOrder: function(data, actions){
        const total = window.MC_cart_total || 0.00;
        const items = window.MC_cart_items || [];
        return actions.order.create({
          purchase_units: [{
            amount: {
              currency_code: 'USD',
              value: total.toFixed(2),
              breakdown: { item_total: { currency_code: 'USD', value: total.toFixed(2) } }
            },
            items: items
          }]
        });
      },
      onApprove: function(data, actions){
        return actions.order.capture().then(function(details){
          // simple success flow
          localStorage.removeItem('mc_cart'); updateCartCount(); alert('Thanks, ' + (details.payer.name && details.payer.name.given_name ? details.payer.name.given_name : '') + '! Your payment was successful.');
          window.location.href = 'index.html';
        });
      }
    }).render('#paypal-buttons');
  }

  // Init on load
  document.addEventListener('DOMContentLoaded', function(){
    updateCartCount();
    initShopUI();
    renderCartPage();
    // if PayPal SDK is loaded after DOMContentLoaded, try setup when it becomes available
    try{ if(window.paypal) setupPayPal(); }
    catch(e){}
    // observe for PayPal SDK load
    const scriptChecker = setInterval(()=>{ if(window.paypal){ clearInterval(scriptChecker); setupPayPal(); } }, 300);
  });

  // Expose functions (for debugging)
  window.MC = {addToCart, getCart, setQty, removeFromCart, PRODUCTS};
})();
