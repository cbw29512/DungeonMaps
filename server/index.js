// index.js — DungeonMaps Phase 1 server foundation.
// Boots HTTP health, initializes SQLite, and attaches the websocket sync seam.

import { createServer } from 'node:http';

import { loadConfig } from './config.js';
import { initDb, closeDb } from './db.js';
import { createApp } from './http.js';
import { createGameStore } from './store/gamesStore.js';
import { logError, logInfo } from './logger.js';
import { PROTOCOL_VERSION } from './sync/protocol.js';
import { createSyncServer } from './ws.js';

let httpServer = null;
let wsServer = null;
let shuttingDown = false;

function listen(server, host, port) {
  // Convert callback-style listen() into a promise so startup has one try/catch path.
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      server.off('error', reject);
      resolve();
    });
  });
}

function registerProcessSafety() {
  // These handlers turn hard crashes into readable logs before Node exits.
  process.on('uncaughtException', (error) => {
    logError('sys', 'uncaught exception', error);
    shutdown(1);
  });

  process.on('unhandledRejection', (reason) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    logError('sys', 'unhandled promise rejection', error);
    shutdown(1);
  });

  process.on('SIGINT', () => shutdown(0));
  process.on('SIGTERM', () => shutdown(0));
}

async function start() {
  try {
    registerProcessSafety();

    const config = loadConfig();
    const { db, path: dbPath, tables } = initDb();

    logInfo('db', 'SQLite ready', { dbPath });
    logInfo('db', 'schema tables ready', { tables });

    const gameStore = createGameStore(db);

    const app = createApp({
      tables,
      serverVersion: config.serverVersion,
      protocolVersion: PROTOCOL_VERSION,
      gameStore,
    });

    httpServer = createServer(app);
    wsServer = createSyncServer(httpServer, {
      serverVersion: config.serverVersion,
      protocolVersion: PROTOCOL_VERSION,
    });

    await listen(httpServer, config.host, config.port);

    logInfo('http', 'DungeonMaps server listening', {
      host: config.host,
      port: config.port,
      localUrl: `http://localhost:${config.port}`,
      healthUrl: `http://localhost:${config.port}/health`,
      syncUrl: `ws://localhost:${config.port}/sync`,
    });
  } catch (error) {
    logError('boot', 'server startup failed', error);
    closeDb();
    process.exit(1);
  }
}

function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  logInfo('sys', 'shutting down');

  try {
    if (wsServer) wsServer.close();
    if (httpServer) {
      httpServer.close(() => {
        closeDb();
        logInfo('sys', 'clean exit');
        process.exit(exitCode);
      });
    } else {
      closeDb();
      process.exit(exitCode);
    }
  } catch (error) {
    logError('sys', 'shutdown failed', error);
    process.exit(1);
  }

  // Safety net if a socket hangs open.
  setTimeout(() => process.exit(exitCode), 2000).unref();
}

start();
