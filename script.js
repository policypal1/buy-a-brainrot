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
    $("#cartCount").textContent = count;
    const body = $("#cartItems");
    if (!this.items.length) {
      body.classList.add("empty");
      body.innerHTML = "Cart is empty.";
    } else {
      body.classList.remove("empty");
      body.innerHTML = this.items.map(i => `
        <div class="cart-row">
          <div><strong>${i.name}</strong> × ${i.qty}</div>
          <div>$${(i.qty * i.price).toFixed(2)}</div>
        </div>
      `).join("");
      body.insertAdjacentHTML("afterbegin", `<style>
        .cart-row{display:flex;justify-content:space-between;gap:8px;padding:8px 0;border-bottom:1px solid #1f1f2e}
      </style>`);
    }
    $("#cartTotal").textContent = `$${this.total().toFixed(2)}`;
  }
};

// quantity buttons
$$(".card").forEach(card => {
  const input = $(".qty__input", card);
  $$(".qty__btn", card).forEach(btn => {
    btn.addEventListener("click", () => {
      const step = Number(btn.dataset.step || 0);
      input.value = Math.max(1, Number(input.value) + step);
    });
  });

  // add to cart
  $(".add", card).addEventListener("click", () => {
    const name = card.dataset.name;
    const qty = Number(input.value);
    const price = Number(card.querySelector(".price").textContent.replace("$",""));
    cart.add(name, qty, price);
  });

  // buy now (quick add + open drawer)
  $(".buy", card).addEventListener("click", () => {
    const name = card.dataset.name;
    const qty = Number(input.value);
    const price = Number(card.querySelector(".price").textContent.replace("$",""));
    cart.add(name, qty, price);
    openDrawer();
  });
});

// search
$("#searchInput").addEventListener("input", e => {
  const term = e.target.value.toLowerCase();
  $$("#grid .card").forEach(c => {
    const show = c.dataset.name.toLowerCase().includes(term);
    c.style.display = show ? "" : "none";
  });
});

// drawer
const drawer = $("#cartDrawer");
const openDrawer = () => drawer.classList.add("open");
const closeDrawer = () => drawer.classList.remove("open");
$("#openCart").addEventListener("click", openDrawer);
$("#closeCart").addEventListener("click", closeDrawer);

// checkout
$("#checkoutBtn").addEventListener("click", () => {
  if (!cart.items.length) { alert("Cart is empty."); return; }
  alert("Checkout placeholder — wire to your payment flow.");
});

// year footer
$("#y").textContent = new Date().getFullYear();
