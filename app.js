(() => {
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];

  /* ---------- CART ---------- */
  const cart = {
    items: [],
    add(name, qty, price){
      const f = this.items.find(i => i.name === name && i.price === price);
      if (f) f.qty += qty; else this.items.push({ name, qty, price });
      this.render(); pulseCart();
    },
    total(){ return this.items.reduce((t,i)=>t + i.qty*i.price, 0); },
    render(){
      const c = this.items.reduce((t,i)=>t+i.qty,0);
      $("#cartCount") && ($("#cartCount").textContent = c);
      const body = $("#cartItems"), tot = $("#cartTotal");
      if (!body || !tot) return;
      body.innerHTML = this.items.length
        ? this.items.map(i=>`
            <div class="cart-row" style="display:flex;justify-content:space-between;gap:8px;padding:8px 0;border-bottom:1px solid #1f1f2e">
              <div><strong>${i.name}</strong> × ${i.qty}</div>
              <div>$${(i.qty*i.price).toFixed(2)}</div>
            </div>`).join("")
        : "Cart is empty.";
      tot.textContent = `$${this.total().toFixed(2)}`;
    }
  };
  function pulseCart(){ const b = $("#openCart"); if(!b) return; b.style.transform="scale(1.06)"; setTimeout(()=>b.style.transform="",120); }
  function openDrawer(){ $("#cartDrawer")?.classList.add("open"); }
  function closeDrawer(){ $("#cartDrawer")?.classList.remove("open"); }
  function getCard(el){ return el.closest(".card"); }
  function nameOf(card){ return card?.dataset?.name || card?.querySelector("h3")?.textContent || "Item"; }

  /* price uses active variant when present */
  function priceOf(card){
    const vs = card?.dataset?.variants ? JSON.parse(card.dataset.variants) : null;
    if (vs && vs.length){
      const idx = Number(card.dataset.variantIndex||0);
      return Number(vs[idx]?.price||0);
    }
    let p = Number(card?.dataset?.price||0);
    if (!p){
      const t = card?.querySelector(".price,[data-price]")?.textContent?.replace("$","") || "0";
      p = Number(t)||0;
    }
    return p;
  }

  /* ---------- VARIANT CYCLER (on-image ‹ ›) ---------- */
  function applyVariant(card, idxDelta){
    const vs = card?.dataset?.variants ? JSON.parse(card.dataset.variants) : null;
    if (!vs || !vs.length) return;
    let i = Number(card.dataset.variantIndex||0);
    i = (i + idxDelta + vs.length) % vs.length;
    card.dataset.variantIndex = String(i);

    const v = vs[i];
    const speedEl = card.querySelector("[data-speed]");
    const priceEl = card.querySelector("[data-price]");

    if (speedEl) speedEl.textContent = v.speed;
    if (priceEl) priceEl.textContent = `$${Number(v.price).toFixed(2)}`;
    card.dataset.price = String(v.price);
  }

  /* ---------- EVENTS ---------- */
  document.addEventListener("click", (e) => {
    const t = e.target;

    if (t.closest("#openCart")) return openDrawer();
    if (t.closest("#closeCart")) return closeDrawer();

    // Variant on-image nav
    if (t.closest(".vprev") || t.closest(".vnext")){
      const card = getCard(t);
      applyVariant(card, t.closest(".vprev") ? -1 : +1);
      return;
    }

    // Qty controls (all items are limit 1)
    if (t.closest(".qty__btn")){
      const card = getCard(t);
      const input = card?.querySelector(".qty__input");
      if (!input) return;
      if (Number(input.value) !== 1) alert("Limit 1 per order for this item.");
      input.value = 1;
      return;
    }

    // Add to cart
    if (t.closest(".add")){
      const card = getCard(t); if (!card) return;
      cart.add(nameOf(card), 1, priceOf(card));
      return;
    }

    // Buy now
    if (t.closest(".buy")){
      const card = getCard(t); if (!card) return;
      cart.add(nameOf(card), 1, priceOf(card));
      openDrawer();
      return;
    }
  });

  // Clamp manual qty to 1
  document.addEventListener("input", (e) => {
    if (!e.target.matches(".qty__input")) return;
    e.target.value = 1;
  });

  /* ---------- SEARCH ---------- */
  function applyFilter(term){
    const q = term.toLowerCase().trim();
    $$("#grid .card").forEach(c => {
      const nm = (c.dataset.name || c.querySelector("h3")?.textContent || "").toLowerCase();
      const tg = (c.dataset.tags || "").toLowerCase();
      c.style.display = q ? ((nm.includes(q)||tg.includes(q)) ? "" : "none") : "";
    });
  }
  $("#searchInput")?.addEventListener("input", e => applyFilter(e.target.value));

  /* ---------- SORT ---------- */
  const sortSelect = $("#sortSelect");
  function normalizePrices(){
    $$("#grid .card").forEach(c=>{
      if (!c.dataset.price){
        const t=c.querySelector(".price,[data-price]")?.textContent?.replace("$","")||"0";
        c.dataset.price = String(Number(t)||0);
      }
    });
  }
  function sortCards(mode="featured"){
    normalizePrices();
    const grid=$("#grid");
    const cards=[...$$("#grid .card")];
    if (mode==="price-asc")  cards.sort((a,b)=>(+a.dataset.price||0)-(+b.dataset.price||0));
    if (mode==="price-desc") cards.sort((a,b)=>(+b.dataset.price||0)-(+a.dataset.price||0));
    if (mode==="new")        cards.sort((a,b)=>(+b.dataset.added||0)-(+a.dataset.added||0));
    cards.forEach(c=>grid.appendChild(c));
  }
  sortSelect?.addEventListener("change", e => sortCards(e.target.value));
  if (sortSelect) sortCards(sortSelect.value);

  /* ---------- CHECKOUT ---------- */
  $("#checkoutBtn")?.addEventListener("click", () => {
    if (!cart.items.length){ alert("Cart is empty."); return; }
    localStorage.setItem("bab_cart", JSON.stringify(cart.items));
    window.location.href = "/checkout.html";
  });

  /* Footer year */
  $("#y") && ($("#y").textContent = new Date().getFullYear());
})();
