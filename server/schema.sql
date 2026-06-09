-- DungeonMaps — Phase 1 schema (v4)
-- Idempotent: safe to run on every boot. UUID PKs stored as TEXT (Phase 2 readiness).
-- Foreign keys are enforced (see db.js: PRAGMA foreign_keys = ON).

-- A game / room. One row = one dashboard flex card.
CREATE TABLE IF NOT EXISTS games (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  system          TEXT NOT NULL CHECK (system IN ('dnd5e', 'coc')),
  join_token      TEXT NOT NULL UNIQUE,
  active_map_id   TEXT,                       -- FK -> game_maps.id (set after maps exist)
  thumbnail_url   TEXT,
  created_at      TEXT NOT NULL,
  last_played_at  TEXT NOT NULL
);

-- Reusable library: source images/videos for maps and token art.
CREATE TABLE IF NOT EXISTS library_assets (
  id                TEXT PRIMARY KEY,
  kind              TEXT NOT NULL CHECK (kind IN ('map', 'token')),
  name              TEXT NOT NULL,
  url               TEXT NOT NULL,            -- served as /assets/<id>; real disk path stays private server-side
  storage_provider  TEXT NOT NULL DEFAULT 'local',
  map_type          TEXT CHECK (map_type IN ('static', 'animated')),  -- maps only; NULL for tokens
  size_category     TEXT,                     -- tokens only; NULL for maps
  created_at        TEXT NOT NULL
);

-- A map (scene) made available inside a game, with per-game grid calibration.
CREATE TABLE IF NOT EXISTS game_maps (
  id                TEXT PRIMARY KEY,
  game_id           TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  library_asset_id  TEXT REFERENCES library_assets(id),  -- NULL if added ad-hoc
  url               TEXT NOT NULL,
  map_type          TEXT NOT NULL CHECK (map_type IN ('static', 'animated')),
  grid_size_px      REAL NOT NULL,            -- pixels per 5-ft square (anchor for auto-sizing)
  grid_offset_x     REAL NOT NULL DEFAULT 0,
  grid_offset_y     REAL NOT NULL DEFAULT 0,
  grid_visible      INTEGER NOT NULL DEFAULT 1,  -- 0/1 boolean
  natural_width     INTEGER,
  natural_height    INTEGER
);

-- Players who joined via link. Persistent identity per room.
CREATE TABLE IF NOT EXISTS game_players (
  id            TEXT PRIMARY KEY,
  game_id       TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  display_name  TEXT NOT NULL,
  session_id    TEXT NOT NULL,                -- stable identity; survives refresh/reconnect
  joined_at     TEXT NOT NULL
);

-- Token INSTANCES. Either staged in a tray, or placed on a board (scene).
-- Map delete is blocked while a token references the scene (FK RESTRICT — default no-action).
CREATE TABLE IF NOT EXISTS tokens (
  id                TEXT PRIMARY KEY,
  game_id           TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  library_asset_id  TEXT REFERENCES library_assets(id),  -- NULL if ad-hoc
  url               TEXT NOT NULL,
  name              TEXT NOT NULL,
  size_category     TEXT NOT NULL,
  placement         TEXT NOT NULL CHECK (placement IN ('tray', 'board')),
  scene_id          TEXT REFERENCES game_maps(id),       -- required on board, NULL in tray
  grid_x            REAL,                                 -- NULL in tray
  grid_y            REAL,                                 -- NULL in tray
  stack_index       INTEGER NOT NULL DEFAULT 0,
  owner_type        TEXT NOT NULL CHECK (owner_type IN ('dm', 'player')),
  owner_player_id   TEXT REFERENCES game_players(id),     -- required when player, NULL when dm
  uploaded_by       TEXT NOT NULL CHECK (uploaded_by IN ('dm', 'player')),
  updated_at        TEXT NOT NULL,

  -- Red-line: placement and scene_id must agree.
  CHECK (
    (placement = 'board' AND scene_id IS NOT NULL) OR
    (placement = 'tray'  AND scene_id IS NULL AND grid_x IS NULL AND grid_y IS NULL)
  ),
  -- Red-line: ownership and owner_player_id must agree.
  CHECK (
    (owner_type = 'player' AND owner_player_id IS NOT NULL) OR
    (owner_type = 'dm'     AND owner_player_id IS NULL)
  )
);

-- Rectangular Room Reveal regions. Reveal-and-stay for the session.
CREATE TABLE IF NOT EXISTS room_regions (
  id        TEXT PRIMARY KEY,
  game_id   TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  scene_id  TEXT NOT NULL REFERENCES game_maps(id) ON DELETE CASCADE,
  geometry  TEXT NOT NULL,                    -- JSON, validated to {x,y,w,h} only (server-side)
  revealed  INTEGER NOT NULL DEFAULT 0        -- 0/1 boolean
);

-- Active condition markers on a token (many per token).
CREATE TABLE IF NOT EXISTS token_conditions (
  id             TEXT PRIMARY KEY,
  token_id       TEXT NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
  condition_key  TEXT,                        -- soft ref to conditions_reference.key; NULL if pure custom
  custom_label   TEXT                         -- the custom slot
);

-- System-specific condition catalog. Drives quick-buttons + hover refresher.
-- mechanic_text MUST be original short reminders, never copied rulebook text.
CREATE TABLE IF NOT EXISTS conditions_reference (
  id             TEXT PRIMARY KEY,
  system         TEXT NOT NULL CHECK (system IN ('dnd5e', 'coc', 'generic')),
  key            TEXT NOT NULL,
  name           TEXT NOT NULL,
  mechanic_text  TEXT NOT NULL,
  marker_icon    TEXT NOT NULL,               -- primary cue (color-blind safe; not color alone)
  marker_hex     TEXT NOT NULL,               -- secondary cue; hex + luminance note handled in UI
  UNIQUE (system, key)
);
