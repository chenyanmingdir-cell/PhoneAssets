import { put, head, list, del } from '@vercel/blob';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { uid } = req.query;
  if (!uid || typeof uid !== 'string' || uid.length < 6) {
    return res.status(400).json({ error: 'Missing or invalid uid' });
  }

  const blobPath = `assets/${uid}.json`;

  if (req.method === 'GET') {
    try {
      const { blobs } = await list({ prefix: blobPath, limit: 1 });
      const blob = blobs.find(b => b.pathname === blobPath);
      if (!blob) {
        return res.status(200).json({ data: [] });
      }
      const resp = await fetch(blob.url);
      const data = await resp.json();
      return res.status(200).json({ data });
    } catch (err) {
      return res.status(500).json({ error: 'Blob read failed', detail: err.message });
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
      return res.status(500).json({ error: 'Blob write failed', detail: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
