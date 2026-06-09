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
  // Ensure the (gitignored) data directory exists.
  mkdirSync(DATA_DIR, { recursive: true });

  db = new DatabaseSync(DB_PATH);

  // Enforce foreign keys (so map-delete-with-tokens is blocked) and use WAL for
  // continuous, crash-safe persistence during a live session.
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA journal_mode = WAL;');

  // Apply schema. Every statement is CREATE TABLE IF NOT EXISTS, so this is safe
  // to run on every boot.
  const schema = readFileSync(SCHEMA_PATH, 'utf8');
  db.exec(schema);

  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
    .all()
    .map((r) => r.name);

  return { db, path: DB_PATH, tables };
}

export function getDb() {
  if (!db) throw new Error('Database not initialized — call initDb() first.');
  return db;
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}
