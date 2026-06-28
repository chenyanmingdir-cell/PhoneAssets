export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    hasOidc: !!process.env.VERCEL_OIDC_TOKEN,
    hasEdgeConfig: !!process.env.EDGE_CONFIG,
    hasBlobStore: !!process.env.BLOB_STORE_ID,
    hasApiToken: !!process.env.VERCEL_API_TOKEN,
  });
}
