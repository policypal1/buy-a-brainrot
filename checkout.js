// checkout.js (v42)
const $ = (s, r = document) => r.querySelector(s);

const CART_KEY = "bab_cart";
const GAS_ENDPOINT = "/api/submit"; // Vercel proxy

function money(n){ return `$${(Number(n)||0).toFixed(2)}`; }
function loadCart(){ try{ return JSON.parse(localStorage.getItem(CART_KEY)||"[]"); }catch{ return []; } }

function renderSummary(){
  const items = loadCart();
  const box = $("#ckItems");
  const total = items.reduce((t,i)=>t + (i.qty||1)*(i.price||0), 0);
  $("#ckTotal").textContent = money(total);

  if(!items.length){ box.textContent = "Cart is empty."; return; }

  // fallback thumb: same unknown-user SVG
  const fallback = "data:image/svg+xml;utf8,"+
    "<svg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 56 56'>"+
    "<rect width='56' height='56' rx='10' fill='%2314161c'/>"+
    "<circle cx='28' cy='22' r='10' fill='%23333a46'/>"+
    "<rect x='10' y='36' width='36' height='12' rx='6' fill='%23333a46'/>"+
    "</svg>";

  box.innerHTML = items.map(i=>`
    <div class="ck-item">
      <div class="ck-item__left">
        <img class="ck-thumb" src="${i.img || fallback}" alt="">
        <div>
          <div class="ck-name">${i.name || i.title || "Item"}${i.qty>1 ? ` × ${i.qty}`:""}</div>
          ${i.variant ? `<div class="ck-variant">${i.variant}</div>` : ``}
        </div>
      </div>
      <div class="ck-price">${money((i.qty||1)*(i.price||0))}</div>
    </div>
  `).join("");
}
renderSummary();

// contact helpers
function atLeastOne(...vals){ return vals.some(v => (v||"").trim().length>0); }
function selectedPay(){
  const r = [...document.querySelectorAll('input[name="pay"]')].find(x=>x.checked);
  return r ? r.value : ""; // 'cashapp' | 'paypal' | 'card'
}

/* -------------------- Modal + Loading + Toast -------------------- */
let _showLoadingAfterClose = false;

function ensureModal(){
  if ($("#bab-modal")) return;
  const el = document.createElement("div");
  el.id = "bab-modal";
  el.innerHTML = `
    <style>
      #bab-modal { position:fixed; inset:0; display:none; align-items:center; justify-content:center; z-index:2000; }
      #bab-modal.show { display:flex; }
      #bab-mask { position:absolute; inset:0; background:rgba(0,0,0,.55); }
      #bab-panel { position:relative; max-width:560px; width:92%; background:#13131a; border:1px solid #2a2a33; border-radius:18px; padding:18px; color:#fff; box-shadow:0 12px 40px rgba(0,0,0,.45); }
      #bab-panel h3 { margin:0 0 6px; font-family:Orbitron, Inter, sans-serif; }
      #bab-panel p, #bab-panel li { color:#a9adc0; }
      #bab-actions { display:flex; gap:10px; justify-content:flex-end; margin-top:12px; }
      .bab-btn { border:1px solid #2a2a33; background:#181820; color:#fff; padding:9px 14px; border-radius:999px; cursor:pointer; font-weight:800; }
      .bab-btn.primary { background:#ff2b45; border-color:#ff2b45; }
      .bab-chip { background:#0f0f14; border:1px solid #2a2a33; padding:8px 12px; border-radius:999px; font-weight:800; }
      .bab-row { display:flex; gap:8px; align-items:center; margin:8px 0 0; flex-wrap:wrap; }
      /* Toast */
      #bab-toast { position:fixed; left:50%; bottom:24px; transform:translateX(-50%); background:#0f0f14; color:#fff; border:1px solid #2a2a33; border-radius:999px; padding:10px 14px; font-weight:800; opacity:0; pointer-events:none; transition:opacity .2s, transform .2s; z-index:2100; }
      #bab-toast.show { opacity:1; transform:translateX(-50%) translateY(-4px); }
      /* Loading overlay shown after closing modal */
      #bab-loading { position:fixed; inset:0; display:none; align-items:center; justify-content:center; z-index:2050; background:rgba(12,11,15,.86); backdrop-filter:blur(2px); }
      #bab-loading.show { display:flex; }
      .bab-loadbox { background:#13131a; border:1px solid #2a2a33; color:#fff; padding:18px 20px; border-radius:16px; box-shadow:0 12px 40px rgba(0,0,0,.45); text-align:center; width:92%; max-width:420px; }
      .bab-spinner { width:26px; height:26px; border:3px solid #2a2a33; border-top-color:#ff2b45; border-radius:50%; margin:0 auto 10px; animation:bab-spin 1s linear infinite; }
      @keyframes bab-spin { to { transform:rotate(360deg); } }
    </style>
    <div id="bab-mask"></div>
    <div id="bab-panel" role="dialog" aria-modal="true" aria-labelledby="bab-title">
      <h3 id="bab-title"></h3>
      <div id="bab-body"></div>
      <div id="bab-actions">
        <button id="bab-close" class="bab-btn">Close</button>
      </div>
    </div>
    <div id="bab-toast" aria-live="polite"></div>
    <div id="bab-loading">
      <div class="bab-loadbox">
        <div class="bab-spinner"></div>
        <div style="font-family:Orbitron,Inter,sans-serif;font-weight:800;margin-bottom:4px">Preparing your brainrot…</div>
        <div style="color:#a9adc0">We’re getting ready to join your private server. This won’t take long.</div>
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
function hideModal(){
  const m = $("#bab-modal");
  if (m) m.classList.remove("show");
  // After closing instructions, show comfort loading screen
  if (_showLoadingAfterClose) {
    const ld = $("#bab-loading");
    if (ld){ 
      ld.classList.add("show");
      setTimeout(()=>{ ld.classList.remove("show"); _showLoadingAfterClose = false; }, 2800);
    }
  }
}

function showToast(msg){
  const t = $("#bab-toast"); if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=> t.classList.remove("show"), 1300);
}
async function copyAndToast(text, label="Copied!"){
  try {
    await navigator.clipboard.writeText(text);
    showToast(label);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
    showToast(label);
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

  const total = items.reduce((t,i)=>t + (i.qty||1)*(i.price||0), 0);
  const payLabel = pay === "cashapp" ? "CashApp" : pay === "paypal" ? "PayPal" : "Card";

  const payload = {
  source: "buy-a-brainrot",
  items, total,
  contact: { discord, phone, email },
  pslink, notes,
  payment_method: payLabel,
  payment_method_raw: pay,
  subject_prefix: payLabel,
  ts: new Date().toISOString(),
  // 🔽 alert both emails
  notify: "samuelkumpula4@gmail.com,micahjohnkolb@gmail.com",
  notify_list: ["samuelkumpula4@gmail.com","micahjohnkolb@gmail.com"],
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

    // Clear cart/UI
    localStorage.removeItem(CART_KEY);
    $("#ckItems").innerHTML = "<div class='ck-item'><div class='ck-item__left'><div class='ck-name'>Submitted!</div></div><div></div></div>";
    $("#ckTotal").textContent = "$0.00";
    $("#ckForm").reset();
    btn.textContent = "Submitted";

    // After they close the modal, show comfort loading overlay
    _showLoadingAfterClose = true;

    // Payment instructions — NOTE: ask for ROBLOX username (not Discord)
    if (pay === "cashapp") {
      const html = `
        <p>Send your total of <strong>${money(total)}</strong> to <strong>$samuelkumpula</strong> on Cash App.</p>
        <div class="bab-row">
          <span class="bab-chip">$samuelkumpula</span>
          <button class="bab-btn" id="copy-cash-tag">Copy tag</button>
          <button class="bab-btn" id="copy-cash-total">Copy total</button>
        </div>
        <ol style="margin:10px 0 0 20px;line-height:1.55">
          <li>Open Cash App → tap <em>Pay</em>.</li>
          <li>Enter <strong>${money(total)}</strong> and pay to <strong>$samuelkumpula</strong>.</li>
          <li><strong>In the note:</strong> put your <strong>ROBLOX username</strong> (do <em>not</em> put your Discord @).</li>
          <li>Tap <strong>Pay</strong>. We’ll add you and join your private server to deliver.</li>
        </ol>
      `;
      showModal("Cash App — Next Steps", html);
      $("#copy-cash-tag")?.addEventListener("click", ()=> copyAndToast("$samuelkumpula", "Cash App tag copied"));
      $("#copy-cash-total")?.addEventListener("click", ()=> copyAndToast(`${money(total)}`, "Total copied"));
    } else if (pay === "paypal") {
      const html = `
        <p>Send your total of <strong>${money(total)}</strong> to <strong>samuelkumpula235</strong> on PayPal.</p>
        <div class="bab-row">
          <span class="bab-chip">samuelkumpula235</span>
          <button class="bab-btn" id="copy-pp-id">Copy PayPal</button>
          <button class="bab-btn" id="copy-pp-total">Copy total</button>
        </div>
        <ol style="margin:10px 0 0 20px;line-height:1.55">
          <li>Open PayPal → send to <strong>samuelkumpula235</strong>.</li>
          <li>Select <strong>Friends &amp; Family</strong>.</li>
          <li>Enter <strong>${money(total)}</strong>.</li>
          <li><strong>In the note:</strong> put your <strong>ROBLOX username</strong> (not your Discord @).</li>
          <li>Send. We’ll add you and join your private server to deliver.</li>
        </ol>
      `;
      showModal("PayPal — Next Steps", html);
      $("#copy-pp-id")?.addEventListener("click", ()=> copyAndToast("samuelkumpula235", "PayPal copied"));
      $("#copy-pp-total")?.addEventListener("click", ()=> copyAndToast(`${money(total)}`, "Total copied"));
    } else {
      showModal("Card (Stripe) — Next Steps",
        `<p>We’ll send you a secure Stripe checkout link for <strong>${money(total)}</strong>. After paying, we’ll add you and join your private server. <br><br><strong>Tip:</strong> have your <strong>ROBLOX username</strong> ready for delivery notes.</p>`);
    }

  } catch(err){
    btn.disabled = false; btn.textContent = "Submit Order";
    $("#ckError").textContent = "Error sending order. Check your connection and try again.";
  }
}

$("#ckForm")?.addEventListener("submit", submitOrder);
