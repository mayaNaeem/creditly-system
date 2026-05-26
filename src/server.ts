import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import http from 'node:http';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');
const BACKEND_HOST = process.env['BACKEND_HOST'] || 'localhost';
const BACKEND_PORT = parseInt(process.env['BACKEND_PORT'] || '5001', 10);

const app = express();
const angularApp = new AngularNodeAppEngine();

// Forward /api/proxy/* → backend Express server
app.use('/api/proxy', (req, res) => {
  const options: http.RequestOptions = {
    hostname: BACKEND_HOST,
    port: BACKEND_PORT,
    path: req.url || '/',
    method: req.method,
    headers: { ...req.headers, host: `${BACKEND_HOST}:${BACKEND_PORT}` },
  };

  const proxy = http.request(options, (upstream) => {
    res.writeHead(upstream.statusCode ?? 502, upstream.headers);
    upstream.pipe(res);
  });

  proxy.on('error', () => {
    if (!res.headersSent) res.status(502).json({ error: 'Backend unavailable' });
  });

  req.pipe(proxy);
});

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
