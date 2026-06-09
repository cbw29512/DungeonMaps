// http.js — HTTP routes for the local server.
// Right now this is intentionally tiny: health check only, no UI yet.

import express from 'express';

export function createApp({ tables, serverVersion, protocolVersion }) {
  const app = express();

  // JSON parsing is enabled now so later API actions use the same server foundation.
  app.use(express.json({ limit: '1mb' }));

  // Health check — the Phase 1 verifiable checkpoint.
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

  // Unknown routes should return JSON, not an HTML error page.
  app.use((req, res) => {
    res.status(404).json({ ok: false, error: 'not_found', path: req.path });
  });

  // Last-resort HTTP error handler. This protects the process from route errors.
  app.use((err, _req, res, _next) => {
    res.status(500).json({ ok: false, error: 'internal_server_error', message: err.message });
  });

  return app;
}
