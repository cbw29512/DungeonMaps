// protocol.js — the SyncAdapter message contract.
//
// This is the seam that keeps Phase 1 (local websocket) and Phase 2 (cloud) using
// the SAME client logic. Every message is an envelope: { type, payload, requestId? }.
// Clients send ACTIONS; the server validates and broadcasts accepted STATE changes.
// No game logic lives here yet — only the vocabulary both sides will speak.

// Client -> Server (intent to do something; server is the authority).
export const ClientMessage = Object.freeze({
  HELLO: 'client/hello',        // first message after connect: who am I (dm | player + token)
  PING: 'client/ping',          // keepalive
  // --- declared now, implemented in later steps ---
  // MOVE_TOKEN, PLACE_TOKEN, ADD_CONDITION, REVEAL_REGION, etc.
});

// Server -> Client (accepted facts / state).
export const ServerMessage = Object.freeze({
  WELCOME: 'server/welcome',    // ack of HELLO: assigned connection id, server version
  PONG: 'server/pong',          // keepalive reply
  ERROR: 'server/error',        // rejected action or bad message
  // --- declared now, implemented in later steps ---
  // STATE_SNAPSHOT, TOKEN_MOVED, REGION_REVEALED, etc.
});

export const PROTOCOL_VERSION = 1;

// Build a well-formed envelope.
export function encode(type, payload = {}, requestId = null) {
  return JSON.stringify({ type, payload, requestId });
}

// Parse + shallow-validate an incoming raw message. Returns { ok, msg } or { ok:false, error }.
export function decode(raw) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'invalid_json' };
  }
  if (typeof parsed !== 'object' || parsed === null || typeof parsed.type !== 'string') {
    return { ok: false, error: 'missing_type' };
  }
  return {
    ok: true,
    msg: {
      type: parsed.type,
      payload: parsed.payload ?? {},
      requestId: parsed.requestId ?? null,
    },
  };
}
