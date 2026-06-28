// Edge Config storage via Vercel REST API
const EC_ID = 'ecfg_sl7xspbksjdoq4mnyag4t4sv1be3';
const EC_URL = `https://edge-config.vercel.com/${EC_ID}`;
const API_URL = `https://api.vercel.com/v1/edge-config/${EC_ID}/items`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { uid } = req.query;
  if (!uid || uid.length < 6) {
    return res.status(400).json({ error: 'Missing or invalid uid' });
  }

  const key = `assets_${uid}`;

  if (req.method === 'GET') {
    try {
      const resp = await fetch(`${EC_URL}/item/${key}?token=${process.env.EDGE_CONFIG_TOKEN}`);
      if (resp.status === 404) return res.status(200).json({ data: [] });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const raw = await resp.text();
      const data = raw ? JSON.parse(raw) : [];
      return res.status(200).json({ data });
    } catch (err) {
      return res.status(500).json({ error: 'Read failed', detail: err.message });
    }
  }

  if (req.method === 'POST') {
    const { data } = req.body;
    if (!Array.isArray(data)) {
      return res.status(400).json({ error: 'data must be an array' });
    }
    try {
      const resp = await fetch(API_URL, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [{ operation: 'upsert', key, value: JSON.stringify(data) }],
        }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${await resp.text()}`);
      return res.status(200).json({ ok: true, count: data.length });
    } catch (err) {
      return res.status(500).json({ error: 'Write failed', detail: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
