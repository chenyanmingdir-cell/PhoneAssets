import { kv } from '@vercel/kv';

// CORS headers for PWA
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  const { uid } = req.query;
  if (!uid || typeof uid !== 'string' || uid.length < 6) {
    return res.status(400).json({ error: 'Missing or invalid uid' });
  }

  const key = `assets:${uid}`;

  if (req.method === 'GET') {
    try {
      const data = await kv.get(key);
      return res.status(200).json({ data: data || [] });
    } catch (err) {
      return res.status(500).json({ error: 'KV read failed', detail: err.message });
    }
  }

  if (req.method === 'POST') {
    const { data } = req.body;
    if (!Array.isArray(data)) {
      return res.status(400).json({ error: 'data must be an array' });
    }
    try {
      await kv.set(key, data);
      return res.status(200).json({ ok: true, count: data.length });
    } catch (err) {
      return res.status(500).json({ error: 'KV write failed', detail: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
