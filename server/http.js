// http.js — HTTP routes for the local server.
// Step 3 adds the first real state API: create/list games for the DM dashboard.

import express from 'express';

import { registerGameRoutes } from './routes/games.js';

export function createApp({ tables, serverVersion, protocolVersion, gameStore }) {
  const app = express();

  // JSON parsing is enabled now so API actions all share one safe input path.
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

  // Dashboard data API. No UI yet — this only proves the server state contract.
  registerGameRoutes(app, gameStore);

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
