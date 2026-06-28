import { put, list } from '@vercel/blob';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { uid } = req.query;
  if (!uid || uid.length < 6) {
    return res.status(400).json({ error: 'Missing or invalid uid' });
  }

  const blobPath = `assets/${uid}.json`;

  if (req.method === 'GET') {
    try {
      const { blobs } = await list({ prefix: blobPath, limit: 1 });
      const blob = blobs.find(b => b.pathname === blobPath);
      if (!blob) return res.status(200).json({ data: [] });
      const resp = await fetch(blob.url);
      const data = await resp.json();
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
      const result = await put(blobPath, JSON.stringify(data), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
        cacheControlMaxAge: 0,
      });
      return res.status(200).json({ ok: true, count: data.length });
    } catch (err) {
      return res.status(500).json({ error: 'Write failed', detail: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
