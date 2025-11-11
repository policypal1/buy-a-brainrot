// /api/submit.js
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const gasEndpoint = process.env.GAS_ENDPOINT; // set in Vercel settings
    const body = req.body || {};

    // Flatten into form fields so Apps Script can use e.parameter.*
    const form = new URLSearchParams();
    form.set("source", body.source || "buy-a-brainrot");
    form.set("total", String(body.total || 0));
    form.set("payment_method", body.payment_method || "Card");
    form.set("payment_method_raw", body.payment_method_raw || "");
    form.set("subject_prefix", body.subject_prefix || body.payment_method || "Card");
    form.set("pslink", body.pslink || "");
    form.set("notes", body.notes || "");
    form.set("notify", body.notify || "");
    form.set("checkout_url", body.checkout_url || "");

    // contact.*
    const c = body.contact || {};
    form.set("contact_discord", c.discord || "");
    form.set("contact_phone", c.phone || "");
    form.set("contact_email", c.email || "");

    // items as a JSON string field (your GAS can JSON.parse this)
    form.set("items_json", JSON.stringify(body.items || []));

    // post to GAS as x-www-form-urlencoded
    const upstream = await fetch(gasEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });

    const text = await upstream.text(); // GAS often returns text
    return res.status(200).json({ ok: true, text });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}

