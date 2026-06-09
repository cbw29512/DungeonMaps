# DungeonMaps

Local LAN battle map + token tool for D&D and Call of Cthulhu.

## Phase 1 scope

This repo is currently at the server-foundation checkpoint only:

- Local Node HTTP server
- SQLite database bootstrapped from `server/schema.sql`
- WebSocket `/sync` seam for the future SyncAdapter
- Health and WebSocket smoke tests
- No UI yet
- No Konva yet
- No game logic yet

## Run locally

```powershell
cd C:\Users\divcl\Desktop\DungeonMaps
npm install
npm start
```

Health check:

```text
http://localhost:5174/health
```

## Smoke tests

Leave `npm start` running in one PowerShell window.

In a second PowerShell window:

```powershell
cd C:\Users\divcl\Desktop\DungeonMaps
npm run smoke
```

Expected result:

- `[smoke:http] PASS`
- `[smoke:ws] PASS`

## Runtime data

The local SQLite database is created at:

```text
data/dungeonmaps.db
```

The `data/` folder is intentionally ignored by Git.
