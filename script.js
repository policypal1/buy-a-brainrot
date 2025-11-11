(() => {
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];

  /* ---------- COUNTDOWN (resets at midnight local) ---------- */
  function secondsToMidnight() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24,0,0,0);
    return Math.max(0, Math.floor((midnight - now) / 1000));
  }
  function hhmmss(s){
    const h = String(Math.floor(s/3600)).padStart(2,'0');
    const m = String(Math.floor((s%3600)/60)).padStart(2,'0');
    const d = String(s%60).padStart(2,'0');
    return `${h}:${m}:${d}`;
  }
  function startTimer(){
    const el = $("#saleTimer");
    if(!el) return;
    let secs = secondsToMidnight();
    el.textContent = hhmmss(secs);
    const iv = setInterval(()=>{
      secs -= 1;
      if (secs <= 0){
        el.textContent = "00:00:00";
        clearInterval(iv);
        return; // sale persists daily; timer resets on reload
      }
      el.textContent = hhmmss(secs);
    }, 1000);
  }

  /* ---------- SITE-WIDE 50% OFF ---------- */
  function ensureSaleUI(card){
    let flag = card.querySelector(".flag");
    if (!flag){
      flag = document.createElement("div");
      flag.className = "flag";
      card.prepend(flag);
    }
    flag.textContent = "50% OFF";
    flag.classList.add("flag--sale");

    let priceWrap = card.querySelector(".price");
    if(!priceWrap){
      priceWrap = document.createElement("div");
      priceWrap.className = "price";
      card.appendChild(priceWrap);
    }
    if(!priceWrap.querySelector(".was")){
      priceWrap.innerHTML = `<span class="was"></span><span class="now"></span>`;
    }
  }

  function readVariant(card){
    const btn = card.querySelector(".add");
    const group = btn?.dataset?.variantGroup;
    if (!group) return null;
    const radio = document.querySelector(`input[name="${group}"]:checked`);
    if (!radio) return null;
    return { group, label: radio.value, price: Number(radio.dataset.price || 0) };
  }

  function nameWithVariant(card){
    const base = card.dataset.base || card.dataset.name || card.querySelector("h3")?.textContent || "Item";
    const v = readVariant(card);
    return v ? `${base} (${v.label})` : base;
  }

  function visiblePrice(card){
    const t = (card.querySelector(".price .now")?.textContent ||
               card.querySelector(".price")?.textContent || "$0").replace("$","");
    return Number(t) || 0;
  }

  function setWasNow(card, now){
    const was = now * 2;
    card.dataset.price = String(now); // for sorting
    const priceWrap = card.querySelector(".price");
    if (priceWrap){
      priceWrap.querySelector(".was").textContent = `$${was.toFixed(2)}`;
      priceWrap.querySelector(".now").textContent = `$${now.toFixed(2)}`;
    }
  }

  function applySaleToCard(card){
    ensureSaleUI(card);
    if (card.dataset.base){
      const v = readVariant(card);
      const now = v ? v.price : visiblePrice(card);
      setWasNow(card, now);
    } else {
      // if card has data-price, use it; else read current text
      const now = Number(card.dataset.price || 0) || visiblePrice(card);
      setWasNow(card, now);
    }
  }

  function applyGlobalSale(){
    $$("#grid .card").forEach(applySaleToCard);
  }

  // When variant changes, update price
  document.addEventListener("change", (e)=>{
    if (e.target.matches('input[type="radio"][name="esokVariant"], input[type="radio"][name="chicVariant"]')){
      const card = e.target.closest(".card");
      applySaleToCard(card);
    }
  });

  /* ---------- CART ---------- */
  const cart = {
    items: [],
    addOnce(name, price){
      const existing = this.items.find(i => i.name === name);
      if (existing){ alert("Limit 1 per product. This item is already in your cart."); return; }
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

  function priceForCart(card){
    if (card.dataset.base){
      const v = readVariant(card);
      return v ? v.price : Number(card.dataset.price || 0) || visiblePrice(card);
    }
    return Number(card.dataset.price || 0) || visiblePrice(card);
  }

  document.addEventListener("click", (e) => {
    const t = e.target;
    if (t.closest("#openCart")) return openDrawer();
    if (t.closest("#closeCart")) return closeDrawer();

    if (t.closest(".add")){
      const card = getCard(t); if (!card) return;
      const name = nameWithVariant(card);
      const price = priceForCart(card);
      cart.addOnce(name, price);
      return;
    }
  });

  /* ---------- SORT ---------- */
  const sortSelect = $("#sortSelect");
  function normalizePrices(){
    $$("#grid .card").forEach(c=>{
      if (!c.dataset.price){
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

  /* ---------- CHECKOUT ---------- */
  $("#checkoutBtn")?.addEventListener("click", () => {
    if (!cart.items.length){ alert("Cart is empty."); return; }
    localStorage.setItem("bab_cart", JSON.stringify(cart.items));
    window.location.href = "/checkout.html";
  });

  /* ---------- INIT ---------- */
  applyGlobalSale();                 // 50% off across the board
  startTimer();                      // midnight urgency
  if (sortSelect) sortCards(sortSelect.value);
  $("#y") && ($("#y").textContent = new Date().getFullYear());
})();
