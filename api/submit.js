// /api/submit.js  (Node serverless function on Vercel)
export default async function handler(req, res) {
  // CORS for your site (you can restrict this to your domain)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const gasEndpoint = process.env.GAS_ENDPOINT; // set in Vercel → Project → Settings → Environment Variables
    const upstream = await fetch(gasEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const text = await upstream.text(); // GAS often returns plain text
    return res.status(200).json({ ok: true, text });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
