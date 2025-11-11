/* helpers */
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

/* cart */
const cart = {
  items: [],
  add(name, qty, price) {
    const found = this.items.find(i => i.name === name);
    if (found) found.qty += qty;
    else this.items.push({ name, qty, price });
    this.render();
  },
  total() { return this.items.reduce((t, i) => t + i.qty * i.price, 0); },
  render() {
    $("#cartCount").textContent = this.items.reduce((t, i) => t + i.qty, 0);
    const body = $("#cartItems"), totalEl = $("#cartTotal");
    if (!body || !totalEl) return;
    if (!this.items.length) { body.classList.add("empty"); body.innerHTML = "Cart is empty."; }
    else {
      body.classList.remove("empty");
      body.innerHTML = this.items.map(i => `
        <div class="cart-row" style="display:flex;justify-content:space-between;gap:8px;padding:8px 0;border-bottom:1px solid #1f1f2e">
          <div><strong>${i.name}</strong> × ${i.qty}</div>
          <div>$${(i.qty * i.price).toFixed(2)}</div>
        </div>
      `).join("");
    }
    totalEl.textContent = `$${this.total().toFixed(2)}`;
  }
};

/* limit 1 per item + alert */
function bindLimitOne(card){
  const input = card.querySelector(".qty__input");
  const inc = card.querySelector('.qty__btn[data-step="1"]');
  const dec = card.querySelector('.qty__btn[data-step="-1"]');
  if (!input || !inc || !dec) return;

  const clamp = () => {
    let val = Number(input.value) || 1;
    if (val > 1) { alert("Limit 1 per order for this item."); val = 1; }
    if (val < 1) val = 1;
    input.value = val;
  };
  inc.addEventListener("click", () => { if (+input.value >= 1) alert("Limit 1 per order for this item."); input.value = 1; });
  dec.addEventListener("click", () => { input.value = 1; });
  input.addEventListener("input", clamp);
  input.addEventListener("blur", clamp);
}

/* Esok variant toggle */
function bindEsokVariant(card){
  const priceEl = card.querySelector("[data-price]");
  const speedEl = card.querySelector("[data-speed]");
  const radios = $$('input[name="esok-variant"]', card);
  if (!priceEl || !speedEl || !radios.length) return;
  const apply = (r) => {
    const [price, _speedNum, speedLabel] = r.value.split("|");
    priceEl.textContent = `$${Number(price).toFixed(2)}`;
    card.dataset.price = String(price);
    speedEl.textContent = speedLabel;
  };
  radios.forEach(r => r.addEventListener("change", e => apply(e.target)));
  apply(radios.find(r=>r.checked) || radios[0]);
}

/* bind product cards */
$$(".card").forEach(card => {
  bindLimitOne(card);
  if (card.dataset.name?.toLowerCase().includes("esok")) bindEsokVariant(card);

  const overlayBuy = $(".mini-buy", card);
  const priceEl = card.querySelector(".price,[data-price]");
  const addBtn = $(".add", card);
  const buyBtn = $(".buy", card);

  const addToCart = () => {
    const name = card.dataset.name || card.querySelector("h3")?.textContent || "Item";
    const qty = 1;
    const price = Number(card.dataset.price || priceEl?.textContent?.replace("$","")) || 0;
    cart.add(name, qty, price);
  };

  overlayBuy?.addEventListener("click", addToCart);
  addBtn?.addEventListener("click", addToCart);
  buyBtn?.addEventListener("click", () => { addToCart(); openDrawer(); });
});

/* SEARCH */
function applyFilter(term){
  const q = term.toLowerCase().trim();
  $$("#grid .card").forEach(c => {
    const name = (c.dataset.name || c.querySelector("h3")?.textContent || "").toLowerCase();
    const tags = (c.dataset.tags || "").toLowerCase();
    c.style.display = q ? ((name.includes(q) || tags.includes(q)) ? "" : "none") : "";
  });
}
$("#searchInput")?.addEventListener("input", e => applyFilter(e.target.value));

/* SORT */
const sortSelect = $("#sortSelect");
function normalizePrices(){
  $$("#grid .card").forEach(c => {
    if (!c.dataset.price) {
      const t = c.querySelector(".price")?.textContent?.replace("$","") || "0";
      c.dataset.price = String(Number(t) || 0);
    }
  });
}
function sortCards(mode="featured"){
  normalizePrices();
  const grid = $("#grid");
  const cards = $$("#grid .card");
  const arr = [...cards];
  if (mode === "price-asc") arr.sort((a,b)=>(+a.dataset.price||0)-(+b.dataset.price||0));
  else if (mode === "price-desc") arr.sort((a,b)=>(+b.dataset.price||0)-(+a.dataset.price||0));
  else if (mode === "new") arr.sort((a,b)=>(+b.dataset.added||0)-(+a.dataset.added||0));
  arr.forEach(c=>grid.appendChild(c));
}
sortSelect?.addEventListener("change", e => sortCards(e.target.value));
if (sortSelect) sortCards(sortSelect.value);

/* drawer */
const drawer = $("#cartDrawer");
const openDrawer = () => drawer?.classList.add("open");
const closeDrawer = () => drawer?.classList.remove("open");
$("#openCart")?.addEventListener("click", openDrawer);
$("#closeCart")?.addEventListener("click", closeDrawer);

/* checkout → CashApp form page */
$("#checkoutBtn")?.addEventListener("click", () => {
  if (!cart.items.length) { alert("Cart is empty."); return; }
  localStorage.setItem("bab_cart", JSON.stringify(cart.items));
  window.location.href = "/checkout.html";
});

/* footer year */
$("#y").textContent = new Date().getFullYear();
