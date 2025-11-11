(() => {
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];

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
  function nameOf(card){ return card?.dataset?.name || card?.querySelector("h3")?.textContent || "Item"; }
  function priceOf(card){
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
        const t=c.querySelector(".price")?.textContent?.replace("$","")||"0";
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
