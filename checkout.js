const $ = (s, r=document) => r.querySelector(s);

const CART_KEY = "bab_cart";

// ✅ Your Apps Script Web App URL:
const GAS_ENDPOINT = "/api/submit";   // same origin → no CORS issue

function money(n){ return `$${(Number(n)||0).toFixed(2)}`; }
function loadCart(){ try{ return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); } catch{ return []; } }

function renderSummary(){
  const items = loadCart();
  const box = $("#ckItems");
  const total = items.reduce((t,i)=>t+(i.qty*i.price),0);
  $("#ckTotal").textContent = money(total);
  if(!items.length){ box.innerHTML = "Cart is empty."; return; }
  box.innerHTML = items.map(i => `
    <div class="ck-row">
      <div><strong>${i.name}</strong> × ${i.qty}</div>
      <div>${money(i.qty*i.price)}</div>
    </div>`).join("");
}
renderSummary();
$("#y").textContent = new Date().getFullYear();

function atLeastOne(...vals){ return vals.some(v => (v||"").trim().length>0); }
function selectedPay(){ const r=[...document.querySelectorAll('input[name="pay"]')].find(x=>x.checked); return r ? r.value : ""; }

async function submitOrder(e){
  e.preventDefault();
  const items = loadCart();
  if(!items.length){ $("#ckError").textContent = "Your cart is empty."; return; }

  const discord = $("#discord").value.trim();
  const phone   = $("#phone").value.trim();
  const email   = $("#email").value.trim();
  const pslink  = $("#pslink").value.trim();
  const notes   = $("#notes").value.trim();
  const pay     = selectedPay();

  if(!atLeastOne(discord, phone, email)){
    $("#ckError").textContent = "Please provide at least one contact method (Discord, phone, or email).";
    return;
  }
  if(!pslink){
    $("#ckError").textContent = "Please include your private server link.";
    return;
  }
  if(!pay){
    $("#ckError").textContent = "Please select a payment method.";
    return;
  }
  $("#ckError").textContent = "";

  const payload = {
    source: "buy-a-brainrot",
    items,
    total: items.reduce((t,i)=>t+(i.qty*i.price),0),
    contact: { discord, phone, email },
    pslink,
    notes,
    payment_method: pay,
    ts: new Date().toISOString(),
    notify: "samuelkumpula4@gmail.com"
  };

  const btn = $("#ckSubmit");
  btn.disabled = true; btn.textContent = "Submitting...";

  try{
    const res = await fetch(GAS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify(payload)
    });
    if(!res.ok) throw new Error("Bad response");

    localStorage.removeItem(CART_KEY);
    $("#ckItems").innerHTML = "<div class='ck-row'><div>Submitted!</div><div></div></div>";
    $("#ckTotal").textContent = "$0.00";
    $("#ckForm").reset();
    btn.textContent = "Submitted";

    let msg = "Thanks! We’ll contact you shortly.";
    if (pay === "cashapp") msg = "Send the total to $samuelkumpula on Cash App. We’ll DM you when received.";
    if (pay === "paypal")  msg = "Send the total to PayPal: samuelkumpula235. We’ll DM you when received.";
    if (pay === "card")    msg = "We’ll send you a Stripe checkout link to pay by card.";
    alert(msg);
  } catch(err){
    btn.disabled = false; btn.textContent = "Submit Order";
    $("#ckError").textContent = "Error sending order. Check your connection and try again.";
  }
}
$("#ckForm")?.addEventListener("submit", submitOrder);
