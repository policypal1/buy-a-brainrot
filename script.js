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
  total() {
    return this.items.reduce((t, i) => t + i.qty * i.price, 0);
  },
  render() {
    const count = this.items.reduce((t, i) => t + i.qty, 0);
    $("#cartCount").textContent = count;

    const body = $("#cartItems");
    const totalEl = $("#cartTotal");
    if (!body || !totalEl) return;

    if (!this.items.length) {
      body.classList.add("empty");
      body.innerHTML = "Cart is empty.";
    } else {
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

/* enforce: limit 1 per item + alert if user tries more */
function enforceLimitOne(container) {
  const input = container.querySelector(".qty__input");
  const inc = container.querySelector('.qty__btn[data-step="1"]');
  const dec = container.querySelector('.qty__btn[data-step="-1"]');

  if (!input || !inc || !dec) return;

  const clamp = () => {
    let val = Number(input.value) || 1;
    if (val > 1) {
      alert("Limit 1 per order for this item.");
      val = 1;
    }
    if (val < 1) val = 1;
    input.value = val;
  };

  // clicks
  inc.addEventListener("click", () => {
    if (Number(input.value) >= 1) {
      alert("Limit 1 per order for this item.");
      input.value = 1;
    } else {
      input.value = 1;
    }
  });
  dec.addEventListener("click", () => {
    input.value = 1; // can't go below 1 either
  });

  // manual typing
  input.addEventListener("input", clamp);
  input.addEventListener("blur", clamp);
}

/* bind product cards */
$$(".card").forEach(card => {
  // limit-one controls
  enforceLimitOne(card);

  const input = $(".qty__input", card);
  const priceEl = card.querySelector(".price");
  const addBtn = $(".add", card);
  const buyBtn = $(".buy", card);

  // may be placeholders (but we removed those)
  if (!input || !priceEl) return;

  const addToCart = () => {
    const name = card.dataset.name || card.querySelector("h3")?.textContent || "Item";
    const qty = 1; // force 1
    const price = Number(priceEl.textContent.replace("$","")) || Number(card.dataset.price) || 0;
    cart.add(name, qty, price);
  };

  addBtn?.addEventListener("click", addToCart);
  buyBtn?.addEventListener("click", () => { addToCart(); openDrawer(); });
});

/* search: filters cards by name */
const searchEl = $("#searchInput");
if (searchEl) {
  searchEl.addEventListener("input", e => {
    const term = e.target.value.toLowerCase().trim();
    $$("#grid .card").forEach(c => {
      const name = (c.dataset.name || c.querySelector("h3")?.textContent || "").toLowerCase();
      c.style.display = name.includes(term) ? "" : "none";
    });
  });
}

/* sort: featured / price asc / newly added */
const sortSelect = $("#sortSelect");
function sortCards(mode = "featured") {
  const grid = $("#grid");
  const cards = $$("#grid .card");
  const arr = [...cards];

  if (mode === "price-asc") {
    arr.sort((a,b) => (Number(a.dataset.price)||0) - (Number(b.dataset.price)||0));
  } else if (mode === "new") {
    arr.sort((a,b) => (Number(b.dataset.added)||0) - (Number(a.dataset.added)||0));
  } // featured = DOM order

  arr.forEach(card => grid.appendChild(card));
}
if (sortSelect) {
  sortSelect.addEventListener("change", e => sortCards(e.target.value));
}

/* drawer */
const drawer = $("#cartDrawer");
const openDrawer = () => drawer?.classList.add("open");
const closeDrawer = () => drawer?.classList.remove("open");
$("#openCart")?.addEventListener("click", openDrawer);
$("#closeCart")?.addEventListener("click", closeDrawer);

/* checkout */
$("#checkoutBtn")?.addEventListener("click", () => {
  if (!cart.items.length) { alert("Cart is empty."); return; }
  alert("Checkout placeholder — wire to your payment flow.");
});

/* footer year */
$("#y").textContent = new Date().getFullYear();

/* default sort = Featured; but you can switch: */
// sortCards("price-asc"); // uncomment if you want cheapest on top by default
