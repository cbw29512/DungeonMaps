// http.js — HTTP routes and static dashboard for the local server.

import { fileURLToPath } from 'node:url';

import express from 'express';

import { registerGameRoutes } from './routes/games.js';

const publicDirectory = fileURLToPath(new URL('../public', import.meta.url));

export function createApp({ tables, serverVersion, protocolVersion, gameStore }) {
  const app = express();
  app.disable('x-powered-by');

  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (req.path === '/health' || req.path.startsWith('/api/')) {
      res.setHeader('Cache-Control', 'no-store');
    }
    next();
  });

  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'dungeonmaps',
      serverVersion,
      protocolVersion,
      tables,
      uptimeSeconds: Math.round(process.uptime()),
    });
  });

  registerGameRoutes(app, gameStore);

  app.use(express.static(publicDirectory, {
    etag: true,
    index: 'index.html',
    maxAge: '1h',
  }));

  app.use((req, res) => {
    res.status(404).json({ ok: false, error: 'not_found', path: req.path });
  });

  app.use((err, _req, res, _next) => {
    res.status(500).json({ ok: false, error: 'internal_server_error', message: err.message });
  });

  return app;
}
