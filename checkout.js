// checkout.js (v32)
const $ = (s, r = document) => r.querySelector(s);

const CART_KEY = "bab_cart";

// Use the Vercel proxy (no CORS)
const GAS_ENDPOINT = "/api/submit";

// If you want to hit Apps Script directly, you'd need CORS headers server-side
// const GAS_ENDPOINT = "https://script.google.com/macros/s/AKfycbxtHxafBn6ftXh1STRYaBOnldWbK17kCSXvwr53p6jUrpQ6CqNX3zrN6XvdG3nCgXxQ/exec";

function money(n){ return `$${(Number(n)||0).toFixed(2)}`; }
function loadCart(){ try{ return JSON.parse(localStorage.getItem(CART_KEY)||"[]"); }catch{ return []; } }

function renderSummary(){
  const items = loadCart();
  const box = $("#ckItems");
  const total = items.reduce((t,i)=>t + i.qty*i.price, 0);
  $("#ckTotal").textContent = money(total);
  if(!items.length){ box.textContent = "Cart is empty."; return; }
  box.innerHTML = items.map(i=>`
    <div class="ck-row">
      <div><strong>${i.name}</strong> × ${i.qty}</div>
      <div>${money(i.qty*i.price)}</div>
    </div>`).join("");
}
renderSummary();
$("#y").textContent = new Date().getFullYear();

function atLeastOne(...vals){ return vals.some(v => (v||"").trim().length>0); }
function selectedPay(){
  const r = [...document.querySelectorAll('input[name="pay"]')].find(x=>x.checked);
  return r ? r.value : ""; // 'cashapp' | 'paypal' | 'card'
}

/* -------------------- Lightweight modal -------------------- */
function ensureModal(){
  if ($("#bab-modal")) return;
  const el = document.createElement("div");
  el.id = "bab-modal";
  el.innerHTML = `
    <style>
      #bab-modal { position:fixed; inset:0; display:none; align-items:center; justify-content:center; z-index:2000; }
      #bab-modal.show { display:flex; }
      #bab-mask { position:absolute; inset:0; background:rgba(0,0,0,.55); }
      #bab-panel { position:relative; max-width:560px; width:92%; background:#13131a; border:1px solid #2a2a33; border-radius:16px; padding:18px; color:#fff; }
      #bab-panel h3 { margin:0 0 6px; font-family:Orbitron, Inter, sans-serif; }
      #bab-panel p, #bab-panel li { color:#a9adc0; }
      #bab-actions { display:flex; gap:10px; justify-content:flex-end; margin-top:12px; }
      .bab-btn { border:1px solid #2a2a33; background:#181820; color:#fff; padding:9px 12px; border-radius:10px; cursor:pointer; }
      .bab-btn.primary { background:#ff2b45; border-color:#ff2b45; }
      .bab-copyrow { display:flex; gap:8px; align-items:center; margin:6px 0 0; }
      .bab-chip { background:#0f0f14; border:1px solid #2a2a33; padding:6px 10px; border-radius:999px; font-weight:700; }
    </style>
    <div id="bab-mask"></div>
    <div id="bab-panel" role="dialog" aria-modal="true" aria-labelledby="bab-title">
      <h3 id="bab-title"></h3>
      <div id="bab-body"></div>
      <div id="bab-actions">
        <button id="bab-close" class="bab-btn">Close</button>
      </div>
    </div>
  `;
  document.body.appendChild(el);
  $("#bab-mask").addEventListener("click", hideModal);
  $("#bab-close").addEventListener("click", hideModal);
}
function showModal(title, html){
  ensureModal();
  $("#bab-title").textContent = title;
  $("#bab-body").innerHTML = html;
  $("#bab-modal").classList.add("show");
}
function hideModal(){ $("#bab-modal")?.classList.remove("show"); }

function copyText(txt){
  try{
    navigator.clipboard.writeText(txt);
    alert("Copied!");
  }catch{
    // fallback
    const ta = document.createElement("textarea");
    ta.value = txt; document.body.appendChild(ta); ta.select();
    document.execCommand("copy"); document.body.removeChild(ta);
    alert("Copied!");
  }
}

/* -------------------- Submit -------------------- */
async function submitOrder(e){
  e.preventDefault();
  const items = loadCart();
  const errorBox = $("#ckError");

  if(!items.length){ errorBox.textContent = "Your cart is empty."; return; }

  const discord = $("#discord").value.trim();
  const phone   = $("#phone").value.trim();
  const email   = $("#email").value.trim();
  const pslink  = $("#pslink").value.trim();
  const notes   = $("#notes").value.trim();
  const pay     = selectedPay(); // 'cashapp' | 'paypal' | 'card'

  if(!atLeastOne(discord, phone, email)){
    errorBox.textContent = "Please provide at least one contact method (Discord, phone, or email).";
    return;
  }
  if(!pslink){
    errorBox.textContent = "Please include your private server link.";
    return;
  }
  if(!pay){
    errorBox.textContent = "Please select a payment method.";
    return;
  }
  errorBox.textContent = "";

  // Labels Apps Script expects
  const payLabel = pay === "cashapp" ? "CashApp" : pay === "paypal" ? "PayPal" : "Card";

  const total = items.reduce((t,i)=>t + i.qty*i.price, 0);

  const payload = {
    source: "buy-a-brainrot",
    items,
    total,
    contact: { discord, phone, email },
    pslink,
    notes,
    payment_method: payLabel,     // Capitalized for GAS
    payment_method_raw: pay,      // Lowercase for your logs
    subject_prefix: payLabel,     // Hint for GAS email subject
    ts: new Date().toISOString(),
    notify: "samuelkumpula4@gmail.com",
    checkout_url: window.location.href
  };

  const btn = $("#ckSubmit");
  btn.disabled = true; btn.textContent = "Submitting...";

  try{
    const res = await fetch(GAS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify(payload)
    });

    if(!res.ok) throw new Error(`Upstream status ${res.status}`);

    // Clear cart, reset UI
    localStorage.removeItem(CART_KEY);
    $("#ckItems").innerHTML = "<div class='ck-row'><div>Submitted!</div><div></div></div>";
    $("#ckTotal").textContent = "$0.00";
    $("#ckForm").reset();
    btn.textContent = "Submitted";

    // Show post-submit instructions popup
    if (pay === "cashapp") {
      const html = `
        <p>Send your total of <strong>${money(total)}</strong> to <strong>$samuelkumpula</strong> on Cash App.</p>
        <div class="bab-copyrow">
          <span class="bab-chip">$samuelkumpula</span>
          <button class="bab-btn" onclick="navigator.clipboard.writeText('$samuelkumpula')">Copy tag</button>
          <button class="bab-btn" onclick="navigator.clipboard.writeText('${money(total)}')">Copy total</button>
        </div>
        <ol style="margin:10px 0 0 20px;line-height:1.55">
          <li>Open Cash App → tap <em>Pay</em>.</li>
          <li>Enter <strong>${money(total)}</strong> and pay to <strong>$samuelkumpula</strong>.</li>
          <li>Add your Discord <strong>@${discord || "username"}</strong> in the note.</li>
          <li>Tap <strong>Pay</strong>. We’ll DM you and join your private server to deliver.</li>
        </ol>
      `;
      showModal("Cash App — Next Steps", html);
    } else if (pay === "paypal") {
      const html = `
        <p>Send your total of <strong>${money(total)}</strong> to <strong>samuelkumpula235</strong> on PayPal.</p>
        <div class="bab-copyrow">
          <span class="bab-chip">samuelkumpula235</span>
          <button class="bab-btn" onclick="navigator.clipboard.writeText('samuelkumpula235')">Copy PayPal</button>
          <button class="bab-btn" onclick="navigator.clipboard.writeText('${money(total)}')">Copy total</button>
        </div>
        <ol style="margin:10px 0 0 20px;line-height:1.55">
          <li>Open PayPal → <em>Send</em> money to <strong>samuelkumpula235</strong>.</li>
          <li>Select <strong>Friends &amp; Family</strong>.</li>
          <li>Enter <strong>${money(total)}</strong> and add your Discord <strong>@${discord || "username"}</strong> in the note.</li>
          <li>Send. We’ll DM you and join your private server to deliver.</li>
        </ol>
      `;
      showModal("PayPal — Next Steps", html);
    } else {
      // Card
      showModal("Card (Stripe) — Next Steps",
        `<p>We’ll send you a secure Stripe checkout link for <strong>${money(total)}</strong>. Fill it out to pay by card. We’ll DM you and join your private server as soon as it’s processed.</p>`);
    }

  } catch(err){
    btn.disabled = false; btn.textContent = "Submit Order";
    $("#ckError").textContent = "Error sending order. Check your connection and try again.";
  }
}

$("#ckForm")?.addEventListener("submit", submitOrder);
