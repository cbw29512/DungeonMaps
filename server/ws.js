// ws.js — local websocket sync seam.
// Clients send intent messages; later the server validates and broadcasts state.

import { randomUUID } from 'node:crypto';
import { WebSocketServer } from 'ws';

import { logError, logInfo, logWarn } from './logger.js';
import { ClientMessage, ServerMessage, encode, decode } from './sync/protocol.js';

function safeSend(ws, type, payload = {}, requestId = null) {
  // A broken socket should not crash the server during a live game.
  try {
    ws.send(encode(type, payload, requestId));
  } catch (error) {
    logError('ws', 'failed to send websocket message', error, { type, requestId });
  }
}

function handleMessage(ws, connId, raw, serverInfo) {
  const result = decode(raw.toString());
  if (!result.ok) {
    safeSend(ws, ServerMessage.ERROR, { reason: result.error });
    return;
  }

  const { type, requestId } = result.msg;

  switch (type) {
    case ClientMessage.HELLO:
      // Later steps: validate role/identity, then send a state snapshot.
      safeSend(
        ws,
        ServerMessage.WELCOME,
        {
          connId,
          serverVersion: serverInfo.serverVersion,
          protocolVersion: serverInfo.protocolVersion,
        },
        requestId,
      );
      break;

    case ClientMessage.PING:
      safeSend(ws, ServerMessage.PONG, {}, requestId);
      break;

    default:
      safeSend(ws, ServerMessage.ERROR, { reason: 'unknown_type', type }, requestId);
  }
}

export function createSyncServer(httpServer, serverInfo) {
  const wss = new WebSocketServer({ server: httpServer, path: '/sync' });

  wss.on('connection', (ws) => {
    const connId = randomUUID();
    logInfo('ws', 'client connected', { connId });

    ws.on('message', (raw) => {
      try {
        handleMessage(ws, connId, raw, serverInfo);
      } catch (error) {
        logError('ws', 'message handling failed', error, { connId });
        safeSend(ws, ServerMessage.ERROR, { reason: 'message_handling_failed' });
      }
    });

    ws.on('close', () => logInfo('ws', 'client disconnected', { connId }));
    ws.on('error', (error) => logWarn('ws', 'socket error', { connId, message: error.message }));
  });

  return wss;
}
