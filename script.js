(() => {
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];

  /* ---------- SALE TIMER (resets at midnight local) ---------- */
  function secondsToMidnight() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24,0,0,0);       // next midnight
    return Math.max(0, Math.floor((midnight - now) / 1000));
  }
  function formatHHMMSS(s){
    const h = String(Math.floor(s/3600)).padStart(2,'0');
    const m = String(Math.floor((s%3600)/60)).padStart(2,'0');
    const d = String(s%60).padStart(2,'0');
    return `${h}:${m}:${d}`;
  }
  function startTimer(){
    const el = $("#saleTimer");
    if(!el) return;
    let secs = secondsToMidnight();
    el.textContent = formatHHMMSS(secs);
    const iv = setInterval(()=>{
      secs -= 1;
      if (secs <= 0){
        el.textContent = "00:00:00";
        clearInterval(iv);
        // reset sale visuals/prices at midnight
        applySalePricing();
        return;
      }
      el.textContent = formatHHMMSS(secs);
    }, 1000);
  }

  /* ---------- SALE PRICING (Spooky 50% off until midnight) ---------- */
  function applySalePricing(){
    const spooky = $("#spooky");
    if (!spooky) return;
    const onSale = true; // sale toggled by timer window (we keep it active until midnight)
    const original = Number(spooky.dataset.original || 100);
    const discounted = Math.round((original / 2) * 100) / 100;

    const nowEl = $("#spookyNow");
    const wasEl = $("#spookyWas");
    if (onSale){
      spooky.dataset.price = String(discounted);
      nowEl.textContent = `$${discounted.toFixed(2)}`;
      wasEl.textContent = `$${original.toFixed(2)}`;
      spooky.querySelector(".flag")?.classList.add("flag--sale");
    } else {
      spooky.dataset.price = String(original);
      nowEl.textContent = `$${original.toFixed(2)}`;
      wasEl.textContent = "";
      spooky.querySelector(".flag")?.classList.remove("flag--sale");
    }
  }

  /* ---------- CART ---------- */
  const cart = {
    items: [],
    addOnce(name, price){
      const existing = this.items.find(i => i.name === name);
      if (existing){
        alert("Limit 1 per product. This item is already in your cart.");
        return;
      }
      this.items.push({ name, qty: 1, price });
      this.render(); openDrawer(); pulseCart();
    },
    total(){ return this.items.reduce((t,i)=>t + i.qty*i.price, 0); },
    render(){
      const count = this.items.length;
      $("#cartCount") && ($("#cartCount").textContent = count);
      const body = $("#cartItems"), tot = $("#cartTotal");
      if (!body || !tot) return;
      if (!count){ body.textContent = "Cart is empty."; }
      else {
        body.innerHTML = this.items.map(i => `
          <div class="cart-row" style="display:flex;justify-content:space-between;gap:8px;padding:8px 0;border-bottom:1px solid #1f1f2e">
            <div><strong>${i.name}</strong> × ${i.qty}</div>
            <div>$${(i.qty*i.price).toFixed(2)}</div>
          </div>`).join("");
      }
      tot.textContent = `$${this.total().toFixed(2)}`;
    }
  };
  function pulseCart(){ const b=$("#openCart"); if(!b) return; b.style.transform="scale(1.06)"; setTimeout(()=>b.style.transform="",120); }
  function openDrawer(){ $("#cartDrawer")?.classList.add("open"); }
  function closeDrawer(){ $("#cartDrawer")?.classList.remove("open"); }
  function getCard(el){ return el.closest(".card"); }

  // read variant (if present) for name+price
  function readVariant(card){
    const btn = card.querySelector(".add");
    const group = btn?.dataset?.variantGroup;
    if (!group) return null;
    const radio = document.querySelector(`input[name="${group}"]:checked`);
    if (!radio) return null;
    return { label: radio.value, price: Number(radio.dataset.price || 0) };
  }

  function nameOf(card){
    // if variant card, append selected label
    const base = card?.dataset?.base || card?.dataset?.name || card?.querySelector("h3")?.textContent || "Item";
    const v = readVariant(card);
    return v ? `${base} (${v.label})` : base;
  }
  function priceOf(card){
    const v = readVariant(card);
    if (v) return v.price;

    // fallback to dataset price (handles sale) or visible text
    const p = Number(card?.dataset?.price || 0);
    if (p) return p;
    const txt = card?.querySelector(".price")?.textContent?.replace("$","") || "0";
    return Number(txt) || 0;
  }

  /* ---------- EVENTS ---------- */
  document.addEventListener("click", (e) => {
    const t = e.target;

    if (t.closest("#openCart")) return openDrawer();
    if (t.closest("#closeCart")) return closeDrawer();

    if (t.closest(".add")){
      const card = getCard(t); if (!card) return;
      cart.addOnce(nameOf(card), priceOf(card));
      return;
    }

    // update displayed price when variant changes
    if (t.matches('input[type="radio"][name="esokVariant"], input[type="radio"][name="chicVariant"]')){
      const card = getCard(t);
      const v = readVariant(card);
      const disp = card.querySelector(".price .now") || card.querySelector(".price");
      if (v && disp) disp.textContent = `$${Number(v.price).toFixed(2)}`;
    }
  });

  /* ---------- SORT ---------- */
  const sortSelect = $("#sortSelect");
  function normalizePrices(){
    $$("#grid .card").forEach(c=>{
      if (!c.dataset.price){
        // for variant cards we’ll use the currently-selected variant price to rank
        const v = readVariant(c);
        if (v){ c.dataset.price = String(v.price); return; }
        const t=c.querySelector(".price .now")?.textContent
             || c.querySelector(".price")?.textContent || "$0";
        c.dataset.price = String(Number((t||"$0").replace("$",""))||0);
      }
    });
  }
  function sortCards(mode="price-asc"){
    normalizePrices();
    const grid=$("#grid");
    const cards=[...$$("#grid .card")];
    if (mode==="price-asc")  cards.sort((a,b)=>(+a.dataset.price||0)-(+b.dataset.price||0));
    if (mode==="price-desc") cards.sort((a,b)=>(+b.dataset.price||0)-(+a.dataset.price||0));
    cards.forEach(c=>grid.appendChild(c));
  }
  sortSelect?.addEventListener("change", e => sortCards(e.target.value));

  /* ---------- CHECKOUT ---------- */
  $("#checkoutBtn")?.addEventListener("click", () => {
    if (!cart.items.length){ alert("Cart is empty."); return; }
    localStorage.setItem("bab_cart", JSON.stringify(cart.items));
    window.location.href = "/checkout.html";
  });

  /* Initializers */
  applySalePricing();     // set sale pricing right away
  startTimer();           // start countdown to midnight
  if (sortSelect) sortCards(sortSelect.value);
  $("#y") && ($("#y").textContent = new Date().getFullYear());
})();
