// Use Vercel OIDC token + Blob REST API — no manual token needed
const BLOB_BASE = 'https://blob.vercel-storage.com';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { uid } = req.query;
  if (!uid || uid.length < 6) {
    return res.status(400).json({ error: 'Missing or invalid uid' });
  }

  const storeId = process.env.BLOB_STORE_ID;
  const token = process.env.VERCEL_OIDC_TOKEN;
  if (!storeId || !token) {
    return res.status(500).json({ error: 'Storage not configured' });
  }

  const pathname = `assets/${uid}.json`;
  const url = `${BLOB_BASE}/${storeId}/${pathname}`;

  if (req.method === 'GET') {
    try {
      const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (resp.status === 404) return res.status(200).json({ data: [] });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
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
      const resp = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Cache-Control-Max-Age': '0',
        },
        body: JSON.stringify(data),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return res.status(200).json({ ok: true, count: data.length });
    } catch (err) {
      return res.status(500).json({ error: 'Write failed', detail: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
