'use strict';

const { existsSync, copyFileSync } = require('fs');
const path = require('path');

// Set env vars BEFORE importing backend — env.ts validates at import time
const DEMO_DB = path.join(process.cwd(), 'backend/prisma/demo.db');
const LIVE_DB = '/tmp/creditly.db';

if (!existsSync(LIVE_DB)) {
  try {
    copyFileSync(DEMO_DB, LIVE_DB);
  } catch (e) {
    console.error('[vercel] Failed to copy demo.db:', e.message);
  }
}

process.env.DATABASE_URL = `file:${LIVE_DB}`;
process.env.JWT_SECRET = process.env.JWT_SECRET || 'creditly-demo-secret-2024';
process.env.PORT = process.env.PORT || '3000';
process.env.CRM_BASE_URL = process.env.CRM_BASE_URL || 'https://example-crm.local';

const { app } = require('../../backend/dist/app');

module.exports = (req, res) => {
  const pathParts = (req.query && req.query.path) || [];
  const apiPath = Array.isArray(pathParts)
    ? pathParts.filter(Boolean).join('/')
    : String(pathParts || '');

  // Rebuild clean query string, removing Vercel's injected 'path' param
  const params = Object.assign({}, req.query);
  delete params.path;
  const qs = Object.keys(params).length > 0
    ? '?' + new URLSearchParams(params).toString()
    : '';

  req.url = `/${apiPath}${qs}`;
  app(req, res);
};
