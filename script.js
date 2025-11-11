(() => {
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];

  /* ---------------- CART ---------------- */
  const cart = {
    items: [],
    add(name, qty, price){
      const f = this.items.find(i => i.name === name);
      if (f) f.qty += qty; else this.items.push({ name, qty, price });
      this.render(); pulseCart();
    },
    total(){ return this.items.reduce((t,i)=>t + i.qty*i.price, 0); },
    render(){
      const count = this.items.reduce((t,i)=>t+i.qty,0);
      $("#cartCount") && ($("#cartCount").textContent = count);
      const body = $("#cartItems"), totalEl = $("#cartTotal");
      if (!body || !totalEl) return;
      if (!this.items.length){ body.innerHTML = "Cart is empty."; }
      else {
        body.innerHTML = this.items.map(i => `
          <div class="cart-row" style="display:flex;justify-content:space-between;gap:8px;padding:8px 0;border-bottom:1px solid #1f1f2e">
            <div><strong>${i.name}</strong> × ${i.qty}</div>
            <div>$${(i.qty*i.price).toFixed(2)}</div>
          </div>`).join("");
      }
      totalEl.textContent = `$${this.total().toFixed(2)}`;
    }
  };
  function pulseCart(){ const b = $("#openCart"); if(!b) return; b.style.transform="scale(1.06)"; setTimeout(()=>b.style.transform="",120); }

  function getCard(el){ return el.closest(".card"); }
  function getName(card){ return card?.dataset?.name || card?.querySelector("h3")?.textContent || "Item"; }
  function getPrice(card){
    let p = Number(card?.dataset?.price || 0);
    if (!p){
      const t = card?.querySelector(".price,[data-price]")?.textContent || "";
      p = Number((t.replace("$","")||"0")) || 0;
    }
    if ((card?.dataset?.name||"").toLowerCase().includes("esok")){
      const r = card.querySelector('input[name="esok-variant"]:checked');
      if (r){ const [price] = r.value.split("|"); p = Number(price)||p; }
    }
    return p;
  }
  function openDrawer(){ $("#cartDrawer")?.classList.add("open"); }
  function closeDrawer(){ $("#cartDrawer")?.classList.remove("open"); }

  /* Clicks (delegated) */
  document.addEventListener("click", (e) => {
    const t = e.target;

    if (t.closest("#openCart")) return openDrawer();
    if (t.closest("#closeCart")) return closeDrawer();

    if (t.closest(".qty__btn")){
      const btn = t.closest(".qty__btn");
      const card = getCard(btn); const input = card?.querySelector(".qty__input");
      if (!input) return;
      const step = Number(btn.dataset.step||0);
      let next = Math.max(1,(Number(input.value)||1)+step);
      if (next > 1){ alert("Limit 1 per order for this item."); next = 1; }
      input.value = next; return;
    }

    if (t.closest(".add")){
      const card = getCard(t); if (!card) return;
      cart.add(getName(card), 1, getPrice(card));
      return;
    }

    if (t.closest(".buy")){
      const card = getCard(t); if (!card) return;
      cart.add(getName(card), 1, getPrice(card));
      openDrawer();
      return;
    }
  });

  document.addEventListener("input", (e) => {
    if (!e.target.matches(".qty__input")) return;
    e.target.value = 1; // limit 1 always
  });

  /* Esok variant updates UI price/speed */
  (function wireEsok(){
    const card = $$(".card").find(c => (c.dataset.name||"").toLowerCase().includes("esok"));
    if (!card) return;
    const priceEl = card.querySelector("[data-price]");
    const speedEl = card.querySelector("[data-speed]");
    const apply = (r) => {
      if (!r || !priceEl || !speedEl) return;
      const [price, _speed, speedLabel] = r.value.split("|");
      priceEl.textContent = `$${Number(price).toFixed(2)}`;
      speedEl.textContent = speedLabel;
      card.dataset.price = String(price);
    };
    card.querySelectorAll('input[name="esok-variant"]').forEach(r => r.addEventListener("change", ()=>apply(r)));
    apply(card.querySelector('input[name="esok-variant"]:checked'));
  })();

  /* Search */
  function applyFilter(term){
    const q = term.toLowerCase().trim();
    $$("#grid .card").forEach(c => {
      const name = (c.dataset.name || c.querySelector("h3")?.textContent || "").toLowerCase();
      const tags = (c.dataset.tags || "").toLowerCase();
      c.style.display = q ? ((name.includes(q)||tags.includes(q)) ? "" : "none") : "";
    });
  }
  $("#searchInput")?.addEventListener("input", e => applyFilter(e.target.value));

  /* Sort */
  const sortSelect = $("#sortSelect");
  function normalizePrices(){
    $$("#grid .card").forEach(c => {
      if (!c.dataset.price){
        const t = c.querySelector(".price,[data-price]")?.textContent?.replace("$","") || "0";
        c.dataset.price = String(Number(t)||0);
      }
    });
  }
  function sortCards(mode="featured"){
    normalizePrices();
    const grid = $("#grid");
    const cards = [...$$("#grid .card")];
    if (mode === "price-asc")  cards.sort((a,b)=>(+a.dataset.price||0)-(+b.dataset.price||0));
    if (mode === "price-desc") cards.sort((a,b)=>(+b.dataset.price||0)-(+a.dataset.price||0));
    if (mode === "new")        cards.sort((a,b)=>(+b.dataset.added||0)-(+a.dataset.added||0));
    cards.forEach(c=>grid.appendChild(c));
  }
  sortSelect?.addEventListener("change", e => sortCards(e.target.value));
  if (sortSelect) sortCards(sortSelect.value);

  /* Checkout */
  $("#checkoutBtn")?.addEventListener("click", () => {
    if (!cart.items.length) { alert("Cart is empty."); return; }
    localStorage.setItem("bab_cart", JSON.stringify(cart.items));
    window.location.href = "/checkout.html";
  });

  /* Footer year */
  $("#y") && ($("#y").textContent = new Date().getFullYear());
})();
