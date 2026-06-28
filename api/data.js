import { get, createClient } from '@vercel/edge-config';

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
  const edgeConfig = createClient(process.env.EDGE_CONFIG);

  if (req.method === 'GET') {
    try {
      const raw = await get(key);
      const data = raw ? JSON.parse(raw) : [];
      return res.status(200).json({ data });
    } catch (err) {
      return res.status(500).json({ error: 'Edge Config read failed', detail: err.message });
    }
  }

  if (req.method === 'POST') {
    const { data } = req.body;
    if (!Array.isArray(data)) {
      return res.status(400).json({ error: 'data must be an array' });
    }
    try {
      await edgeConfig.put(key, JSON.stringify(data));
      return res.status(200).json({ ok: true, count: data.length });
    } catch (err) {
      return res.status(500).json({ error: 'Edge Config write failed', detail: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
