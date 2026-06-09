// db.js — local SQLite via Node's built-in node:sqlite (no native compilation).
// Creates ./data/dungeonmaps.db on first run and applies the v4 schema idempotently.

import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DATA_DIR = join(__dirname, '..', 'data');
const DB_PATH = join(DATA_DIR, 'dungeonmaps.db');
const SCHEMA_PATH = join(__dirname, 'schema.sql');

let db = null;

export function initDb() {
  try {
    // Ensure the gitignored data directory exists before SQLite opens the file.
    mkdirSync(DATA_DIR, { recursive: true });

    db = new DatabaseSync(DB_PATH);

    // Foreign keys make SQLite enforce our schema rules instead of trusting UI code.
    db.exec('PRAGMA foreign_keys = ON;');

    // WAL improves crash resilience during live sessions.
    db.exec('PRAGMA journal_mode = WAL;');

    // Every schema statement is idempotent, so boot can safely re-run it.
    const schema = readFileSync(SCHEMA_PATH, 'utf8');
    db.exec(schema);

    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
      .all()
      .map((row) => row.name);

    return { db, path: DB_PATH, tables };
  } catch (error) {
    closeDb();
    throw new Error(`Failed to initialize SQLite at ${DB_PATH}: ${error.message}`);
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
