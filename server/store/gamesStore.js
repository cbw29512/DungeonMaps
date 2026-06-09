// gamesStore.js — database access for dashboard game cards.
// State rule: the server owns game records; clients ask for actions, never write DB rows directly.

import { randomBytes, randomUUID } from 'node:crypto';

const VALID_SYSTEMS = new Set(['dnd5e', 'coc']);
const GAME_NAME_MAX = 80;

function nowIso() {
  // ISO text sorts correctly in SQLite and ports cleanly to Postgres later.
  return new Date().toISOString();
}

function makeJoinToken() {
  // High-entropy join token now, so Phase 2 can reuse the same invite-link shape.
  return randomBytes(24).toString('base64url');
}

function cleanName(name) {
  if (typeof name !== 'string') {
    throw new Error('Game name is required.');
  }

  const trimmed = name.trim().replace(/\s+/g, ' ');
  if (!trimmed) throw new Error('Game name cannot be blank.');
  if (trimmed.length > GAME_NAME_MAX) {
    throw new Error(`Game name must be ${GAME_NAME_MAX} characters or fewer.`);
  }
  return trimmed;
}

function cleanSystem(system) {
  if (typeof system !== 'string' || !VALID_SYSTEMS.has(system)) {
    throw new Error('Game system must be dnd5e or coc.');
  }
  return system;
}

function toGameCard(row) {
  // This is the exact shape the future flex-card dashboard needs.
  return {
    id: row.id,
    name: row.name,
    system: row.system,
    joinToken: row.join_token,
    activeMapId: row.active_map_id,
    thumbnailUrl: row.thumbnail_url,
    createdAt: row.created_at,
    lastPlayedAt: row.last_played_at,
  };
}

export function createGameStore(db) {
  return {
    listGames() {
      try {
        return db
          .prepare(`
            SELECT id, name, system, join_token, active_map_id, thumbnail_url, created_at, last_played_at
            FROM games
            ORDER BY last_played_at DESC, created_at DESC
          `)
          .all()
          .map(toGameCard);
      } catch (error) {
        throw new Error(`Could not list games: ${error.message}`);
      }
    },

    createGame(input) {
      try {
        const id = randomUUID();
        const name = cleanName(input?.name);
        const system = cleanSystem(input?.system);
        const timestamp = nowIso();
        const joinToken = makeJoinToken();

        db.prepare(`
          INSERT INTO games (id, name, system, join_token, active_map_id, thumbnail_url, created_at, last_played_at)
          VALUES (?, ?, ?, ?, NULL, NULL, ?, ?)
        `).run(id, name, system, joinToken, timestamp, timestamp);

        return this.getGameById(id);
      } catch (error) {
        throw new Error(`Could not create game: ${error.message}`);
      }
    },

    getGameById(id) {
      try {
        const row = db
          .prepare(`
            SELECT id, name, system, join_token, active_map_id, thumbnail_url, created_at, last_played_at
            FROM games
            WHERE id = ?
          `)
          .get(id);

        return row ? toGameCard(row) : null;
      } catch (error) {
        throw new Error(`Could not read game: ${error.message}`);
      }
    },
  };
}
