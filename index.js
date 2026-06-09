// index.js — DungeonMaps Phase 1 server skeleton.
// Boots an HTTP server (health check), initializes the local SQLite DB,
// and attaches a websocket server that speaks the SyncAdapter protocol.
// No UI, no Konva, no game logic yet — this is the foundation only.

import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import express from 'express';
import { WebSocketServer } from 'ws';

import { initDb, closeDb } from './db.js';
import {
  ClientMessage,
  ServerMessage,
  PROTOCOL_VERSION,
  encode,
  decode,
} from './sync/protocol.js';

const PORT = process.env.PORT || 5174;
const SERVER_VERSION = '0.1.0';

// --- Database -------------------------------------------------------------
const { path: dbPath, tables } = initDb();
console.log(`[db]   SQLite ready at ${dbPath}`);
console.log(`[db]   tables: ${tables.join(', ')}`);

// --- HTTP -----------------------------------------------------------------
const app = express();
app.use(express.json());

// Health check — the Phase 1 verifiable checkpoint.
app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'dungeonmaps',
    serverVersion: SERVER_VERSION,
    protocolVersion: PROTOCOL_VERSION,
    tables,
    uptimeSeconds: Math.round(process.uptime()),
  });
});

const httpServer = createServer(app);

// --- WebSocket (sync seam) ------------------------------------------------
const wss = new WebSocketServer({ server: httpServer, path: '/sync' });

wss.on('connection', (ws) => {
  const connId = randomUUID();
  console.log(`[ws]   connect ${connId}`);

  ws.on('message', (raw) => {
    const result = decode(raw.toString());
    if (!result.ok) {
      ws.send(encode(ServerMessage.ERROR, { reason: result.error }));
      return;
    }

    const { type, requestId } = result.msg;
    switch (type) {
      case ClientMessage.HELLO:
        // Later steps: validate role/identity, send a state snapshot.
        ws.send(
          encode(
            ServerMessage.WELCOME,
            { connId, serverVersion: SERVER_VERSION, protocolVersion: PROTOCOL_VERSION },
            requestId,
          ),
        );
        break;
      case ClientMessage.PING:
        ws.send(encode(ServerMessage.PONG, {}, requestId));
        break;
      default:
        ws.send(encode(ServerMessage.ERROR, { reason: 'unknown_type', type }, requestId));
    }
  });

  ws.on('close', () => console.log(`[ws]   close   ${connId}`));
});

// --- Boot -----------------------------------------------------------------
httpServer.listen(PORT, () => {
  console.log(`[http] DungeonMaps server v${SERVER_VERSION} listening on http://localhost:${PORT}`);
  console.log(`[http] health: http://localhost:${PORT}/health`);
  console.log(`[ws]   sync:   ws://localhost:${PORT}/sync`);
});

// --- Graceful shutdown ----------------------------------------------------
function shutdown() {
  console.log('\n[sys]  shutting down…');
  wss.close();
  httpServer.close(() => {
    closeDb();
    console.log('[sys]  clean exit');
    process.exit(0);
  });
  // Safety net if something hangs.
  setTimeout(() => process.exit(0), 2000).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
