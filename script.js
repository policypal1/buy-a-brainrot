// --- Utilities
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
const money = (n) => `$${Number(n).toFixed(2)}`;

// --- Midnight countdown (resets daily)
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

// --- Sale pricing: show 2x as WAS, current as NOW, 50% off for all items
function applySaleToCard(card) {
  card.classList.add("card--sale");
  const was = card.querySelector(".price .was");
  const now = card.querySelector(".price .now");

  // Variant group?
  const variantGroupName = card.querySelector(".actions .add")?.dataset?.variantGroup;
  let salePrice;

  if (variantGroupName) {
    const checked = card.querySelector(`input[name="${variantGroupName}"]:checked`);
    salePrice = Number(checked?.dataset?.price || 0);
    card.dataset.price = String(salePrice);
  } else {
    salePrice = Number(card.dataset.price || 0);
  }

  const original = salePrice * 2; // “2x the current price” as WAS
  was.textContent = money(original);
  now.innerHTML = `${money(salePrice)} <span class="sale-pill">50% OFF</span>`;
}

// Update sale price when variant changes
function wireVariants(card) {
  const addBtn = card.querySelector(".actions .add");
  const group = addBtn?.dataset?.variantGroup;
  if (!group) return;

  $$(`input[name="${group}"]`, card).forEach((radio) => {
    radio.addEventListener("change", () => {
      // Update card-level price to selected variant
      card.dataset.price = radio.dataset.price;
      applySaleToCard(card);
      equalizeHeights(); // keep rows tidy after text reflow
    });
  });
}

// --- Duplicate merge: merge cards with same data-name OR same data-base
function mergeDuplicates() {
  const grid = $("#grid");
  const cards = $$(".card", grid);

  // Build map by name/base
  const buckets = new Map();
  cards.forEach((c) => {
    const key = c.dataset.base || c.dataset.name;
    if (!key) return;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(c);
  });

  buckets.forEach((list) => {
    if (list.length <= 1) return;

    // Keep the first, convert the rest into variant buttons
    const primary = list[0];
    const name = primary.dataset.base || primary.dataset.name;

    // Ensure a variant container exists
    let v = primary.querySelector(".variant");
    if (!v) {
      v = document.createElement("div");
      v.className = "variant";
      v.setAttribute("role", "group");
      v.setAttribute("aria-label", `${name} variants`);
      primary.querySelector("h3").insertAdjacentElement("afterend", v);
    }

    // For every extra card: try to infer a label & price, then remove the card
    list.slice(1).forEach((dup, idx) => {
      const labelText =
        dup.querySelector(".speed")?.textContent?.trim() ||
        dup.dataset.variant ||
        `Option ${idx + 2}`;
      const price = dup.dataset.price || dup.querySelector(".price .now")?.textContent?.replace(/[^\d.]/g, "") || "0";

      const id = `${name.replace(/\s+/g, "")}Var`;
      const lbl = document.createElement("label");
      lbl.innerHTML = `<input type="radio" name="${id}" data-price="${price}"> ${labelText}`;
      v.appendChild(lbl);

      // If the primary didn't have a group yet, assign it to the Add button
      const addBtn = primary.querySelector(".actions .add");
      if (!addBtn.dataset.variantGroup) addBtn.dataset.variantGroup = id;

      dup.remove();
    });

    // Make sure one option is checked
    const radios = $$(`input[type="radio"]`, v);
    if (radios.length) {
      // If the card already had a variant group, keep existing checked, else check first
      if (!radios.some((r) => r.checked)) radios[0].checked = true;
      wireVariants(primary);
      applySaleToCard(primary);
    }
  });
}

// --- Cart
const cart = [];
function addToCart(item) {
  cart.push(item); // 1 per click (quantity locked to 1 per your spec)
  $("#cartCount").textContent = String(cart.length);
  renderCart();
}
function renderCart() {
  const wrap = $("#cartItems");
  if (!cart.length) {
    wrap.textContent = "Cart is empty.";
  } else {
    wrap.innerHTML = cart
      .map(
        (i, idx) => `
        <div style="display:flex;align-items:center;justify-content:space-between;border:1px solid var(--line);padding:8px;border-radius:10px;margin-bottom:8px">
          <div style="display:flex;gap:10px;align-items:center">
            <img src="${i.img}" alt="" style="width:52px;height:52px;object-fit:contain;border:1px solid var(--line);border-radius:8px;background:#0f0f14" />
            <div>
              <div style="font-weight:800">${i.title}${i.variant ? ` • ${i.variant}` : ""}</div>
              <div style="color:#a9adc0">${money(i.price)}</div>
            </div>
          </div>
          <button data-i="${idx}" class="drawer__close" style="width:auto;height:auto;padding:6px 10px">Remove</button>
        </div>`
      )
      .join("");
  }
  const total = cart.reduce((s, i) => s + i.price, 0);
  $("#cartTotal").textContent = money(total);

  // remove handlers
  $$("#cartItems .drawer__close").forEach((b) =>
    b.addEventListener("click", (e) => {
      const i = Number(e.currentTarget.dataset.i);
      cart.splice(i, 1);
      $("#cartCount").textContent = String(cart.length);
      renderCart();
    })
  );
}

// --- Sorting
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

// --- Equalize card heights (hard equalizer for mixed content)
function equalizeHeights() {
  const cards = $$(".card");
  let max = 0;
  cards.forEach((c) => {
    c.style.minHeight = "auto";
  });
  cards.forEach((c) => {
    const h = c.getBoundingClientRect().height;
    if (h > max) max = h;
  });
  cards.forEach((c) => (c.style.minHeight = `${Math.ceil(max)}px`));
}

// --- Init
document.addEventListener("DOMContentLoaded", () => {
  // Year in footer
  $("#y").textContent = String(new Date().getFullYear());

  // Countdown
  const timerEl = $("#saleTimer");
  if (timerEl) startMidnightCountdown(timerEl);

  // Attach cart drawer
  $("#openCart").addEventListener("click", () => $("#cartDrawer").classList.add("open"));
  $("#closeCart").addEventListener("click", () => $("#cartDrawer").classList.remove("open"));

  // Initial pricing + sale state
  const cards = $$(".card");
  cards.forEach((c) => {
    // ensure sale flag exists on all
    if (!c.querySelector(".flag")) {
      const f = document.createElement("span");
      f.className = "flag flag--sale";
      f.textContent = "50% OFF";
      c.prepend(f);
    }
    c.classList.add("card--sale");
    applySaleToCard(c);
    wireVariants(c);
  });

  // Merge duplicates into variant buttons
  mergeDuplicates();

  // Add-to-cart buttons
  $$(".add").forEach((btn) =>
    btn.addEventListener("click", (e) => {
      const card = e.currentTarget.closest(".card");
      const title = card.querySelector("h3").textContent.trim();
      const img = card.querySelector("img")?.src || "";
      let price = Number(card.dataset.price || 0);

      // if variant button group present, get label
      const group = btn.dataset.variantGroup;
      let variant = "";
      if (group) {
        const checked = card.querySelector(`input[name="${group}"]:checked`);
        if (checked) {
          price = Number(checked.dataset.price || price);
          // try to get the visible label text
          variant = checked.parentElement.textContent.trim();
        }
      }

      addToCart({ title, img, price, variant });
      $("#cartDrawer").classList.add("open");
    })
  );

  // Sorting
  $("#sortSelect").addEventListener("change", (e) => sortGrid(e.target.value));

  // First layout pass
  equalizeHeights();
  window.addEventListener("resize", () => {
    clearTimeout(window.__eqT);
    window.__eqT = setTimeout(equalizeHeights, 120);
  });
});
