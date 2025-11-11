// checkout.js (v31)
const $ = (s, r = document) => r.querySelector(s);

const CART_KEY = "bab_cart";

// If you deployed the Vercel proxy use this:
const GAS_ENDPOINT = "/api/submit";

// If you want to hit Apps Script directly (will need CORS headers on server):
// const GAS_ENDPOINT = "https://script.google.com/macros/s/AKfycbxtHxafBn6ftXh1STRYaBOnldWbK17kCSXvwr53p6jUrpQ6CqNX3zrN6XvdG3nCgXxQ/exec";

function money(n) {
  return `$${(Number(n) || 0).toFixed(2)}`;
}
function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  } catch {
    return [];
  }
}
function renderSummary() {
  const items = loadCart();
  const box = $("#ckItems");
  const total = items.reduce((t, i) => t + i.qty * i.price, 0);
  $("#ckTotal").textContent = money(total);
  if (!items.length) {
    box.innerHTML = "Cart is empty.";
    return;
    }
  box.innerHTML = items
    .map(
      (i) => `
      <div class="ck-row">
        <div><strong>${i.name}</strong> × ${i.qty}</div>
        <div>${money(i.qty * i.price)}</div>
      </div>`
    )
    .join("");
}
renderSummary();
$("#y").textContent = new Date().getFullYear();

function atLeastOne(...vals) {
  return vals.some((v) => (v || "").trim().length > 0);
}
function selectedPay() {
  const r = [...document.querySelectorAll('input[name="pay"]')].find((x) => x.checked);
  return r ? r.value : ""; // 'cashapp' | 'paypal' | 'card'
}

async function submitOrder(e) {
  e.preventDefault();
  const items = loadCart();
  const errorBox = $("#ckError");
  if (!items.length) {
    errorBox.textContent = "Your cart is empty.";
    return;
  }

  const discord = $("#discord").value.trim();
  const phone = $("#phone").value.trim();
  const email = $("#email").value.trim();
  const pslink = $("#pslink").value.trim();
  const notes = $("#notes").value.trim();
  const pay = selectedPay(); // 'cashapp' | 'paypal' | 'card'

  if (!atLeastOne(discord, phone, email)) {
    errorBox.textContent = "Please provide at least one contact method (Discord, phone, or email).";
    return;
  }
  if (!pslink) {
    errorBox.textContent = "Please include your private server link.";
    return;
  }
  if (!pay) {
    errorBox.textContent = "Please select a payment method.";
    return;
  }
  errorBox.textContent = "";

  // Map to what your GAS script expects for email/template branching
  const paymentMethodLabel =
    pay === "cashapp" ? "CashApp" : pay === "paypal" ? "PayPal" : "Card";

  const total = items.reduce((t, i) => t + i.qty * i.price, 0);

  const payload = {
    source: "buy-a-brainrot",
    items,
    total,
    contact: { discord, phone, email },
    pslink,
    notes,
    payment_method: paymentMethodLabel,  // Capitalized for GAS
    payment_method_raw: pay,             // Lowercase (for your own logs if you want)
    ts: new Date().toISOString(),
    notify: "samuelkumpula4@gmail.com",
    checkout_url: window.location.href
  };

  const btn = $("#ckSubmit");
  btn.disabled = true;
  btn.textContent = "Submitting...";

  try {
    const res = await fetch(GAS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error(`Upstream status ${res.status}`);

    // Clear cart and confirm
    localStorage.removeItem(CART_KEY);
    $("#ckItems").innerHTML =
      "<div class='ck-row'><div>Submitted!</div><div></div></div>";
    $("#ckTotal").textContent = "$0.00";
    $("#ckForm").reset();
    btn.textContent = "Submitted";

    // Friendly next-step message based on selection
    let msg = "Thanks! We’ll contact you shortly.";
    if (pay === "cashapp")
      msg =
        "Send the total to $samuelkumpula on Cash App. We’ll DM you when received.";
    if (pay === "paypal")
      msg =
        "Send the total to PayPal: samuelkumpula235. We’ll DM you when received.";
    if (pay === "card")
      msg = "We’ll send you a Stripe checkout link to pay by card.";
    alert(msg);
  } catch (err) {
    btn.disabled = false;
    btn.textContent = "Submit Order";
    errorBox.textContent =
      "Error sending order. Check your connection and try again.";
  }
}

$("#ckForm")?.addEventListener("submit", submitOrder);
