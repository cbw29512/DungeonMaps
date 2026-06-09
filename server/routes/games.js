// routes/games.js — tiny HTTP API for the future DM dashboard.
// These routes expose state actions, while gamesStore keeps the SQLite details hidden.

import { logError, logInfo } from '../logger.js';

function sendBadRequest(res, message) {
  res.status(400).json({ ok: false, error: 'bad_request', message });
}

function sendServerError(res, error) {
  logError('http', 'games route failed', error);
  res.status(500).json({ ok: false, error: 'internal_server_error', message: error.message });
}

export function registerGameRoutes(app, gameStore) {
  app.get('/api/games', (_req, res) => {
    try {
      const games = gameStore.listGames();
      res.json({ ok: true, games });
    } catch (error) {
      sendServerError(res, error);
    }
  });

  app.post('/api/games', (req, res) => {
    try {
      const game = gameStore.createGame(req.body);
      logInfo('games', 'created game', { gameId: game.id, name: game.name, system: game.system });
      res.status(201).json({ ok: true, game });
    } catch (error) {
      sendBadRequest(res, error.message);
    }
  });
}
