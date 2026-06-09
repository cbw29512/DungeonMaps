// smoke-ws.mjs — verifies the websocket SyncAdapter handshake.

import { randomUUID } from 'node:crypto';
import WebSocket from 'ws';

import { ClientMessage, ServerMessage, PROTOCOL_VERSION, encode, decode } from '../server/sync/protocol.js';

const syncUrl = process.env.DUNGEONMAPS_WS_URL ?? 'ws://localhost:5174/sync';
const requestId = randomUUID();

function fail(message, ws = null) {
  console.error(`[smoke:ws] FAIL ${syncUrl}`);
  console.error(message);
  if (ws) ws.close();
  process.exit(1);
}

const ws = new WebSocket(syncUrl);
const timeout = setTimeout(() => fail('Timed out waiting for websocket welcome.', ws), 3000);

ws.on('open', () => {
  ws.send(encode(ClientMessage.HELLO, { role: 'dm' }, requestId));
});

ws.on('message', (raw) => {
  const decoded = decode(raw.toString());
  if (!decoded.ok) fail(`Could not decode server message: ${decoded.error}`, ws);

  const message = decoded.msg;
  if (message.type !== ServerMessage.WELCOME) {
    fail(`Expected ${ServerMessage.WELCOME}, got ${message.type}`, ws);
  }

  if (message.requestId !== requestId) {
    fail(`Expected requestId ${requestId}, got ${message.requestId}`, ws);
  }

  if (message.payload.protocolVersion !== PROTOCOL_VERSION) {
    fail(`Expected protocol ${PROTOCOL_VERSION}, got ${message.payload.protocolVersion}`, ws);
  }

  clearTimeout(timeout);
  console.log(`[smoke:ws] PASS ${syncUrl}`);
  console.log(JSON.stringify(message, null, 2));
  ws.close();
});

ws.on('error', (error) => fail(error.message, ws));
