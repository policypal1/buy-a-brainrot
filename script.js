// --- Helpers
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
const money = (n) => `$${Number(n).toFixed(2)}`;

/* ============================
   CART (shared with checkout)
   ============================ */
const CART_KEY = "bab_cart";

// migrate legacy "cart" key once (older builds)
(function migrateCart() {
  try {
    const legacy = JSON.parse(localStorage.getItem("cart") || "[]");
    const current = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    if (legacy.length && !current.length) {
      localStorage.setItem(CART_KEY, JSON.stringify(legacy));
      localStorage.removeItem("cart");
    }
  } catch {}
})();

function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); }
  catch { return []; }
}
function setCart(arr) {
  localStorage.setItem(CART_KEY, JSON.stringify(arr));
  const badge = $("#cartCount");
  if (badge) badge.textContent = String(arr.length);
}
function addToCart(item) {
  const cart = getCart();
  cart.push(item);                    // one item per click
  setCart(cart);                      // persist
  renderCart();                       // refresh drawer UI
}
function removeFromCart(index) {
  const cart = getCart();
  cart.splice(index, 1);
  setCart(cart);
  renderCart();
}

// Drawer render
function renderCart() {
  const cart = getCart();
  const wrap = $("#cartItems");
  if (!wrap) return;

  if (!cart.length) {
    wrap.textContent = "Cart is empty.";
  } else {
    wrap.innerHTML = cart.map((i, idx) => `
      <div style="display:flex;align-items:center;justify-content:space-between;border:1px solid var(--line);padding:8px;border-radius:10px;margin-bottom:8px">
        <div style="display:flex;gap:10px;align-items:center">
          <img src="${i.img || ""}" alt="" style="width:52px;height:52px;object-fit:contain;border:1px solid var(--line);border-radius:8px;background:#0f0f14" />
          <div>
            <div style="font-weight:800">${i.name}${i.variant ? ` • ${i.variant}` : ""}</div>
            <div style="color:#a9adc0">${money((i.price || 0) * (i.qty || 1))}</div>
          </div>
        </div>
        <button data-i="${idx}" class="drawer__close" style="width:auto;height:auto;padding:6px 10px">Remove</button>
      </div>
    `).join("");
  }

  const total = cart.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.qty) || 1), 0);
  const totalEl = $("#cartTotal");
  if (totalEl) totalEl.textContent = money(total);

  $$("#cartItems .drawer__close").forEach((b) =>
    b.addEventListener("click", (e) => removeFromCart(Number(e.currentTarget.dataset.i)))
  );
}

/* ============================
   Midnight countdown
   ============================ */
function startMidnightCountdown(el) {
  function tick() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const ms = midnight - now;
    const h = String(Math.floor(ms / 3_600_000)).padStart(2, "0");
    const m = String(Math.floor((ms % 3_600_000) / 60_000)).padStart(2, "0");
    const s = String(Math.floor((ms % 60_000) / 1000)).padStart(2, "0");
    el.textContent = `${h}:${m}:${s}`;
  }
  tick();
  setInterval(tick, 1000);
}

/* ============================
   Sale pricing
   ============================ */
function applySaleToCard(card) {
  card.classList.add("card--sale");
  const was = card.querySelector(".price .was");
  const now = card.querySelector(".price .now");
  const variantGroupName = card.querySelector(".actions .add")?.dataset?.variantGroup;
  let salePrice;

  if (variantGroupName) {
    const checked = card.querySelector(`input[name="${variantGroupName}"]:checked`);
    salePrice = Number(checked?.dataset?.price || 0);
    card.dataset.price = String(salePrice);
  } else {
    salePrice = Number(card.dataset.price || 0);
  }

  const original = salePrice * 2;
  if (was) was.textContent = money(original);
  if (now) now.innerHTML = `${money(salePrice)} <span class="sale-pill">50% OFF</span>`;
}

function wireVariants(card) {
  const addBtn = card.querySelector(".actions .add");
  const group = addBtn?.dataset?.variantGroup;
  if (!group) return;
  $$(`input[name="${group}"]`, card).forEach((radio) => {
    radio.addEventListener("change", () => {
      card.dataset.price = radio.dataset.price;
      applySaleToCard(card);
      equalizeHeights();
    });
  });
}

/* ============================
   Merge duplicate cards
   ============================ */
function mergeDuplicates() {
  const grid = $("#grid");
  const cards = $$(".card", grid);
  const buckets = new Map();
  cards.forEach((c) => {
    const key = c.dataset.base || c.dataset.name;
    if (!key) return;
    (buckets.get(key) || buckets.set(key, []).get(key)).push(c);
  });

  buckets.forEach((list) => {
    if (list.length <= 1) return;
    const primary = list[0];
    const name = primary.dataset.base || primary.dataset.name;

    let v = primary.querySelector(".variant");
    if (!v) {
      v = document.createElement("div");
      v.className = "variant";
      v.setAttribute("role", "group");
      v.setAttribute("aria-label", `${name} variants`);
      primary.querySelector("h3").insertAdjacentElement("afterend", v);
    }

    list.slice(1).forEach((dup, i) => {
      const labelText = dup.querySelector(".speed")?.textContent?.trim() || `Option ${i + 2}`;
      const price = dup.dataset.price || dup.querySelector(".price .now")?.textContent?.replace(/[^\d.]/g, "") || "0";
      const id = `${name.replace(/\s+/g, "")}Var`;
      const lbl = document.createElement("label");
      lbl.innerHTML = `<input type="radio" name="${id}" data-price="${price}"> ${labelText}`;
      v.appendChild(lbl);
      const addBtn = primary.querySelector(".actions .add");
      if (!addBtn.dataset.variantGroup) addBtn.dataset.variantGroup = id;
      dup.remove();
    });

    const radios = $$("input[type=radio]", v);
    if (radios.length && !radios.some(r => r.checked)) radios[0].checked = true;
    wireVariants(primary);
    applySaleToCard(primary);
  });
}

/* ============================
   Sorting & equal heights
   ============================ */
function sortGrid(by) {
  const grid = $("#grid");
  const cards = $$(".card", grid);
  const getPrice = (c) => Number(c.dataset.price || 0);
  const getDate = (c) => Number(c.dataset.added || 0);
  const sorted = [...cards].sort((a, b) => {
    if (by === "price-asc") return getPrice(a) - getPrice(b);
    if (by === "price-desc") return getPrice(b) - getPrice(a);
    if (by === "newest") return getDate(b) - getDate(a);
    return 0;
  });
  sorted.forEach((c) => grid.appendChild(c));
  equalizeHeights();
}

function equalizeHeights() {
  const cards = $$(".card");
  let max = 0;
  cards.forEach((c) => (c.style.minHeight = "auto"));
  cards.forEach((c) => { const h = c.getBoundingClientRect().height; if (h > max) max = h; });
  cards.forEach((c) => (c.style.minHeight = `${Math.ceil(max)}px`));
}

/* ============================
   Init
   ============================ */
document.addEventListener("DOMContentLoaded", () => {
  $("#y").textContent = String(new Date().getFullYear());
  const timerEl = $("#saleTimer");
  if (timerEl) startMidnightCountdown(timerEl);

  $("#openCart")?.addEventListener("click", () => $("#cartDrawer").classList.add("open"));
  $("#closeCart")?.addEventListener("click", () => $("#cartDrawer").classList.remove("open"));

  // checkout goes to checkout.html
  $("#checkoutBtn")?.addEventListener("click", () => {
    window.location.href = "./checkout.html";
  });

  // Initial pricing + variants + dup-merge
  $$(".card").forEach((c) => {
    if (!c.querySelector(".flag")) {
      const f = document.createElement("span");
      f.className = "flag";
      f.textContent = "50% OFF";
      c.prepend(f);
    }
    applySaleToCard(c);
    wireVariants(c);
  });
  mergeDuplicates();

  // Add-to-cart (save in shape checkout expects)
  $$(".add").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      const card = e.currentTarget.closest(".card");
      const name = card.querySelector("h3").textContent.trim();
      const img = card.querySelector("img")?.src || "";
      let price = Number(card.dataset.price || 0);
      let variant = "";
      const group = btn.dataset.variantGroup;
      if (group) {
        const checked = card.querySelector(`input[name="${group}"]:checked`);
        if (checked) {
          price = Number(checked.dataset.price || price);
          variant = checked.parentElement.textContent.trim();
        }
      }
      addToCart({ name, img, qty: 1, price, variant }); // <-- shape checkout.js reads
      $("#cartDrawer").classList.add("open");
    })
  );

  // first render + badge refresh
  setCart(getCart());
  renderCart();

  $("#sortSelect")?.addEventListener("change", (e) => sortGrid(e.target.value));
  equalizeHeights();
  window.addEventListener("resize", () => {
    clearTimeout(window.__eqT);
    window.__eqT = setTimeout(equalizeHeights, 120);
  });
});
