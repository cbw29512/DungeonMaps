// db.js — local SQLite via Node's built-in node:sqlite (no native compilation).
// Creates ./data/dungeonmaps.db on first run and applies the schema idempotently.

import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_DB_PATH = join(__dirname, '..', 'data', 'dungeonmaps.db');
const SCHEMA_PATH = join(__dirname, 'schema.sql');

let db = null;

export function resolveDbPath(env = process.env) {
  const configured = env.DUNGEONMAPS_DB_PATH?.trim();
  return configured ? resolve(configured) : DEFAULT_DB_PATH;
}

export function initDb(env = process.env) {
  const dbPath = resolveDbPath(env);

  try {
    mkdirSync(dirname(dbPath), { recursive: true });
    db = new DatabaseSync(dbPath);

    db.exec('PRAGMA foreign_keys = ON;');
    db.exec('PRAGMA journal_mode = WAL;');

    const schema = readFileSync(SCHEMA_PATH, 'utf8');
    db.exec(schema);

    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
      .all()
      .map((row) => row.name);

    return { db, path: dbPath, tables };
  } catch (error) {
    closeDb();
    throw new Error(`Failed to initialize SQLite at ${dbPath}: ${error.message}`);
  }
}

export function getDb() {
  if (!db) throw new Error('Database not initialized — call initDb() first.');
  return db;
}

export function closeDb() {
  if (!db) return;

  try {
    db.close();
  } finally {
    db = null;
  }
}
