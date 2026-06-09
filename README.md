# DungeonMaps

Local LAN battle map + token tool for D&D and Call of Cthulhu.

## Current checkpoint

Phase 1 server/state foundation:

- Local Node HTTP server
- SQLite database bootstrapped from `server/schema.sql`
- WebSocket `/sync` seam for the future SyncAdapter
- Game-card state API for the future DM dashboard
- Health, WebSocket, and API smoke tests
- No UI yet
- No Konva yet
- No map/token game logic yet

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

List dashboard games:

```text
http://localhost:5174/api/games
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
- `[smoke:api] PASS`

## Runtime data

The local SQLite database is created at:

```text
data/dungeonmaps.db
```

The `data/` folder is intentionally ignored by Git.

## API checkpoint

Create a game:

```powershell
Invoke-RestMethod http://localhost:5174/api/games `
  -Method Post `
  -ContentType 'application/json' `
  -Body '{"name":"Saturday D&D","system":"dnd5e"}'
```

List games:

```powershell
Invoke-RestMethod http://localhost:5174/api/games
```
