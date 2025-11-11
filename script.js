/* basic cart + ui */
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

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
    const countEl = $("#cartCount");
    if (countEl) countEl.textContent = count;

    const body = $("#cartItems");
    const totalEl = $("#cartTotal");
    if (!body || !totalEl) return; // if drawer not present on this page

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

// quantity buttons + add/buy
$$(".card").forEach(card => {
  const input = $(".qty__input", card);
  const priceEl = card.querySelector(".price");
  const addBtn = $(".add", card);
  const buyBtn = $(".buy", card);

  // may be placeholder cards
  if (!input || !priceEl) return;

  $$(".qty__btn", card).forEach(btn => {
    btn.addEventListener("click", () => {
      const step = Number(btn.dataset.step || 0);
      input.value = Math.max(1, Number(input.value) + step);
    });
  });

  const addToCart = () => {
    const name = card.dataset.name || card.querySelector("h3")?.textContent || "Item";
    const qty = Math.max(1, Number(input.value));
    const price = Number(priceEl.textContent.replace("$","")) || 0;
    cart.add(name, qty, price);
  };

  if (addBtn) addBtn.addEventListener("click", addToCart);
  if (buyBtn) buyBtn.addEventListener("click", () => {
    addToCart();
    openDrawer();
  });
});

// search (guarded)
const searchEl = $("#searchInput");
if (searchEl) {
  searchEl.addEventListener("input", e => {
    const term = e.target.value.toLowerCase();
    $$("#grid .card").forEach(c => {
      const name = (c.dataset.name || c.querySelector("h3")?.textContent || "").toLowerCase();
      c.style.display = name.includes(term) ? "" : "none";
    });
  });
}

// drawer
const drawer = $("#cartDrawer");
const openDrawer = () => { if (drawer) drawer.classList.add("open"); };
const closeDrawer = () => { if (drawer) drawer.classList.remove("open"); };

const openBtn = $("#openCart");
const closeBtn = $("#closeCart");
if (openBtn) openBtn.addEventListener("click", openDrawer);
if (closeBtn) closeBtn.addEventListener("click", closeDrawer);

// checkout
const checkoutBtn = $("#checkoutBtn");
if (checkoutBtn) {
  checkoutBtn.addEventListener("click", () => {
    if (!cart.items.length) { alert("Cart is empty."); return; }
    alert("Checkout placeholder — wire to your payment flow.");
  });
}

// footer year
const yearEl = $("#y");
if (yearEl) yearEl.textContent = new Date().getFullYear();

