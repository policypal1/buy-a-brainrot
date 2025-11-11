// --- Helpers
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
const money = (n) => `$${Number(n).toFixed(2)}`;

/* ===== Cart (shared with checkout) ===== */
const CART_KEY = "bab_cart";
function getCart(){ try{ return JSON.parse(localStorage.getItem(CART_KEY)||"[]"); }catch{ return []; } }
function setCart(v){ localStorage.setItem(CART_KEY, JSON.stringify(v)); $("#cartCount").textContent = String(v.length); }
function addToCart(i){ const c = getCart(); c.push(i); setCart(c); renderCart(); }
function removeFromCart(idx){ const c = getCart(); c.splice(idx,1); setCart(c); renderCart(); }

/* ===== Countdown ===== */
function startMidnightCountdown(el) {
  function tick() {
    const now = new Date();
    const midnight = new Date(now); midnight.setHours(24,0,0,0);
    const ms = midnight - now;
    const h = String(Math.floor(ms/3_600_000)).padStart(2,"0");
    const m = String(Math.floor((ms%3_600_000)/60_000)).padStart(2,"0");
    const s = String(Math.floor((ms%60_000)/1000)).padStart(2,"0");
    el.textContent = `${h}:${m}:${s}`;
  }
  tick(); setInterval(tick,1000);
}

/* ===== Sale pricing / display =====
   - Show 50% OFF chip
   - Original “was” is a clean whole number (rounded from 2x)
   - Sale numbers normalize to .99 unless card has data-lock="exact"
*/
function normalizedSale(n, card){
  if (card?.dataset.lock === "exact") return Number(n); // keep exact (e.g., toilets 15.00)
  const base = Math.floor(Number(n));
  return Number((base + 0.99).toFixed(2));
}
function applySaleToCard(card) {
  card.classList.add("card--sale");
  const was = card.querySelector(".price .was");
  const now = card.querySelector(".price .now");
  const addBtn = card.querySelector(".actions .add");
  const variantGroup = addBtn?.dataset?.variantGroup;

  let sale = Number(card.dataset.price || 0);
  if (variantGroup) {
    const checked = card.querySelector(`input[name="${variantGroup}"]:checked`);
    if (checked) sale = Number(checked.dataset.price || sale);
  }

  // Normalize to .99 when not locked
  sale = normalizedSale(sale, card);
  card.dataset.price = String(sale);

  const original = Math.round(sale * 2); // clean whole look

  if (was) was.textContent = `$${original}.00`;
  if (now) now.innerHTML = `${money(sale)} <span class="sale-pill">50% OFF</span>`;
}
function wireVariants(card) {
  const addBtn = card.querySelector(".actions .add");
  const group = addBtn?.dataset?.variantGroup;
  if (!group) return;
  $$(`input[name="${group}"]`, card).forEach(r => {
    r.addEventListener("change", () => { applySaleToCard(card); equalizeHeights(); });
  });
}

/* ===== Merge duplicates (by data-name/base) ===== */
function mergeDuplicates() {
  const grid = $("#grid"); const cards = $$(".card", grid); const buckets = new Map();
  cards.forEach(c => {
    const key = c.dataset.base || c.dataset.name;
    if (!key) return;
    (buckets.get(key) || buckets.set(key,[]).get(key)).push(c);
  });

  buckets.forEach(list => {
    if (list.length <= 1) return;
    const primary = list[0];
    const name = primary.dataset.base || primary.dataset.name;

    let v = primary.querySelector(".variant");
    if (!v) {
      v = document.createElement("div");
      v.className = "variant";
      v.setAttribute("role","group");
      v.setAttribute("aria-label", `${name} variants`);
      primary.querySelector("h3").insertAdjacentElement("afterend", v);
    }

    list.slice(1).forEach((dup, i) => {
      const labelText = dup.querySelector(".speed")?.textContent?.trim() || `Option ${i+2}`;
      const price = dup.dataset.price || dup.querySelector(".price .now")?.textContent?.replace(/[^\d.]/g,"") || "0";
      const id = `${name.replace(/\s+/g,"")}Var`;
      const lbl = document.createElement("label");
      lbl.innerHTML = `<input type="radio" name="${id}" data-price="${price}"> ${labelText}`;
      v.appendChild(lbl);
      const addBtn = primary.querySelector(".actions .add");
      if (!addBtn.dataset.variantGroup) addBtn.dataset.variantGroup = id;
      dup.remove();
    });

    const radios = $$("input[type=radio]", v);
    if (radios.length && !radios.some(r=>r.checked)) radios[0].checked = true;
    wireVariants(primary);
    applySaleToCard(primary);
  });
}

/* ===== Cart drawer ===== */
function renderCart(){
  const cart = getCart(); const wrap = $("#cartItems");
  if (!wrap) return;
  if (!cart.length){ wrap.textContent = "Cart is empty."; }
  else {
    wrap.innerHTML = cart.map((i, idx) => `
      <div style="display:flex;align-items:center;justify-content:space-between;border:1px solid var(--line);padding:8px;border-radius:10px;margin-bottom:8px">
        <div style="display:flex;gap:10px;align-items:center">
          <img src="${i.img||""}" alt="" style="width:52px;height:52px;object-fit:contain;border:1px solid var(--line);border-radius:8px;background:#0f0f14" />
          <div>
            <div style="font-weight:800">${i.name}${i.variant ? ` • ${i.variant}` : ""}</div>
            <div style="color:#a9adc0">${money((i.price||0)*(i.qty||1))}</div>
          </div>
        </div>
        <button data-i="${idx}" class="drawer__close" style="width:auto;height:auto;padding:6px 10px">Remove</button>
      </div>`).join("");
  }
  const total = cart.reduce((s,i)=> s + (Number(i.price)||0)*(Number(i.qty)||1), 0);
  $("#cartTotal").textContent = money(total);
  $$("#cartItems .drawer__close").forEach(b => b.addEventListener("click", e => removeFromCart(Number(e.currentTarget.dataset.i))));
}

/* ===== Sorting & heights ===== */
function sortGrid(by) {
  const grid = $("#grid"); const cards = $$(".card", grid);
  const getPrice = (c) => Number(c.dataset.price || 0);
  const getDate = (c) => Number(c.dataset.added || 0);
  const sorted = [...cards].sort((a,b)=>{
    if(by==="price-asc") return getPrice(a)-getPrice(b);
    if(by==="price-desc") return getPrice(b)-getPrice(a);
    if(by==="newest") return getDate(b)-getDate(a);
    return 0;
  });
  sorted.forEach(c=>grid.appendChild(c));
  equalizeHeights();
}
function equalizeHeights(){
  const cards = $$(".card");
  let max = 0;
  cards.forEach(c=>c.style.minHeight="auto");
  cards.forEach(c=>{ const h = c.getBoundingClientRect().height; if(h>max) max=h; });
  cards.forEach(c=>c.style.minHeight = `${Math.ceil(max)}px`);
}

/* ===== Init ===== */
document.addEventListener("DOMContentLoaded", () => {
  $("#y").textContent = String(new Date().getFullYear());
  const timerEl = $("#saleTimer"); if (timerEl) startMidnightCountdown(timerEl);

  $("#openCart").addEventListener("click", () => $("#cartDrawer").classList.add("open"));
  $("#closeCart").addEventListener("click", () => $("#cartDrawer").classList.remove("open"));
  $("#checkoutBtn").addEventListener("click", () => { window.location.href = "./checkout.html"; });

  // Initial pricing + variants + dup-merge
  $$(".card").forEach(c => { applySaleToCard(c); wireVariants(c); });
  mergeDuplicates();

  // Add-to-cart
  $$(".add").forEach(btn => btn.addEventListener("click", (e)=>{
    const card = e.currentTarget.closest(".card");
    const name = card.querySelector("h3").textContent.trim();
    const img = card.querySelector("img")?.src || "";
    const group = btn.dataset.variantGroup;
    let variant = "", price = Number(card.dataset.price || 0);
    if (group) {
      const checked = card.querySelector(`input[name="${group}"]:checked`);
      if (checked) {
        price = Number(checked.dataset.price || price);
        variant = checked.parentElement.textContent.trim();
      }
    }
    price = normalizedSale(price, card); // ensure .99 if not locked
    addToCart({ name, img, price, qty:1, variant });
    $("#cartDrawer").classList.add("open");
  }));

  $("#sortSelect").addEventListener("change", (e)=> sortGrid(e.target.value));
  setCart(getCart()); // refresh badge
  renderCart();
  equalizeHeights();
  window.addEventListener("resize", ()=>{ clearTimeout(window.__eqT); window.__eqT = setTimeout(equalizeHeights,120); });
});
