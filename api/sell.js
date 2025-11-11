// /api/sell.js
export default async function handler(req, res) {
  // CORS for your site
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "method_not_allowed" });

  try {
    const GAS_URL = "https://script.google.com/macros/s/AKfycbzQLaMIBv2wC7OGmsWLIXTwLJaA5g-_Uh83stNSQX5X0FDfMBzsDn4bhjS8_XcKLeVX/exec";

    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const resp = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" }, // server-to-server, no CORS issue
      body: JSON.stringify(body),
    });

    const json = await resp.json().catch(() => ({ ok: resp.ok }));
    if (!resp.ok) return res.status(500).json({ ok: false, error: "gas_error", details: json });

    return res.status(200).json({ ok: true, ...json });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
}
