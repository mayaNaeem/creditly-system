// Vercel serverless proxy: forwards requests to a configured backend target.
// Set environment variable `API_TARGET` to the public backend URL (e.g. https://api.example.com)
// Optionally set `ALLOWED_ORIGIN` to restrict CORS (defaults to '*').

const joinPath = (parts) => parts.filter(Boolean).join('/');

module.exports = async (req, res) => {
  const target = process.env.API_TARGET;
  if (!target) {
    res.statusCode = 500;
    return res.end('API_TARGET not configured');
  }

  // req.query.path is an array from the catch-all route
  const pathParts = (req.query && req.query.path) || [];
  const path = Array.isArray(pathParts) ? joinPath(pathParts) : String(pathParts || '');

  // Rebuild query string if present
  const qsIndex = req.url.indexOf('?');
  const qs = qsIndex >= 0 ? req.url.slice(qsIndex) : '';

  const base = target.replace(/\/$/, '');
  const url = `${base}/${path}${qs}`;

  // Handle preflight here and add Private Network allow header if requested
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.headers['access-control-request-private-network']) {
      res.setHeader('Access-Control-Allow-Private-Network', 'true');
    }
    res.statusCode = 204;
    return res.end();
  }

  try {
    const headers = { ...req.headers };
    delete headers.host;

    const fetchOptions = {
      method: req.method,
      headers,
      // For non-GET methods, pipe the body
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : req,
      redirect: 'manual',
    };

    const upstream = await fetch(url, fetchOptions);

    // Copy response headers (but override CORS to allow the frontend origin)
    upstream.headers.forEach((value, key) => {
      try { res.setHeader(key, value); } catch (e) { /* ignore */ }
    });
    res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
    if (req.headers['access-control-request-private-network']) {
      res.setHeader('Access-Control-Allow-Private-Network', 'true');
    }

    res.statusCode = upstream.status;
    // Stream the response body back to the client
    const reader = upstream.body;
    if (!reader) return res.end();
    reader.pipeTo?.(res).catch(() => {
      // fallback for environments without pipeTo
      upstream.body.pipe(res);
    });
  } catch (err) {
    res.statusCode = 502;
    res.end('Bad gateway');
  }
};
