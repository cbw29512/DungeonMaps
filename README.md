# DungeonMaps

A local-first campaign and battle-map control room for Dungeons & Dragons and Call of Cthulhu.

DungeonMaps keeps authoritative campaign state on a Node server running on the game master's network. The current dashboard creates and lists real SQLite-backed campaign rooms, shows API and WebSocket status, and establishes the product surface for shared maps and tokens.

## Current checkpoint

### Complete

- Modern responsive DM dashboard served directly by Express
- SQLite-backed campaign cards
- Validated campaign creation for D&D 5e and Call of Cthulhu
- High-entropy join codes for the future player flow
- Local WebSocket `/sync` connection, hello handshake, and heartbeat seam
- Health endpoint with schema and protocol information
- Defensive HTTP headers and non-cacheable API responses
- HTTP, WebSocket, API, and dashboard smoke tests
- Automated GitHub Actions CI with an isolated temporary database
- Production dependency audit

### Intentionally next

- Battle-map canvas
- Token placement and movement
- Fog of war and region reveals
- DM and player session roles
- Shared state snapshots and broadcasts
- Map upload and campaign resume workflow

The dashboard labels this boundary directly. It does not pretend map or token logic already exists.

## Product flow

1. The game master opens the local dashboard.
2. The browser verifies the HTTP API and WebSocket sync seam.
3. The game master creates a named campaign and chooses a game system.
4. The server validates the request and writes the campaign to SQLite.
5. The dashboard reloads the authoritative campaign list.
6. A generated join code is available for the future player-session flow.

## Architecture

```mermaid
flowchart LR
    DM[Game master browser] -->|Static dashboard| Express[Node + Express]
    DM -->|HTTP actions| API[/api/games]
    DM -->|WebSocket hello + ping| Sync[/sync]
    Express --> API
    Express --> Sync
    API --> Store[Game store]
    Store --> SQLite[(SQLite)]
    Sync --> Protocol[Versioned message protocol]
```

Design rules:

- The server owns game state.
- Clients request actions rather than writing database rows.
- The browser renders API responses with DOM text nodes rather than HTML injection.
- Local SQLite remains replaceable behind the store boundary.
- The WebSocket envelope stays stable as richer state messages are added.
- No cloud account is required for the current local-network workflow.

## Run locally

Requirements:

- Node.js 22.5 or newer
- Windows, macOS, or Linux

PowerShell:

```powershell
git clone https://github.com/cbw29512/DungeonMaps.git
Set-Location DungeonMaps
npm ci
npm start
```

Open:

```text
http://localhost:5174/
```

The SQLite database is created at:

```text
data/dungeonmaps.db
```

The `data/` folder is intentionally ignored by Git.

## Dashboard workflow

- Create a campaign from the form.
- Choose Dungeons & Dragons 5e or Call of Cthulhu.
- Confirm the campaign appears in the library.
- Copy the generated join code.
- Watch the API and Sync indicators reflect server availability.

## API

### Health

```powershell
Invoke-RestMethod http://localhost:5174/health
```

### List campaigns

```powershell
Invoke-RestMethod http://localhost:5174/api/games
```

### Create a campaign

```powershell
Invoke-RestMethod http://localhost:5174/api/games `
  -Method Post `
  -ContentType 'application/json' `
  -Body '{"name":"Saturday D&D","system":"dnd5e"}'
```

Valid system values:

- `dnd5e`
- `coc`

## Smoke tests

Leave `npm start` running in one PowerShell window.

In a second window:

```powershell
Set-Location DungeonMaps
npm run smoke
```

Expected results:

- `[smoke:http] PASS`
- `[smoke:ws] PASS`
- `[smoke:api] PASS`

The HTTP smoke test verifies the dashboard HTML, browser module, health response, schema tables, cache control, and framing protection. The API smoke test creates and reads a real campaign. The WebSocket smoke test verifies the versioned welcome handshake.

## CI

Pull requests and changes to `main` automatically:

1. install locked dependencies
2. check all server, browser, and smoke-test JavaScript syntax
3. start the server against a temporary SQLite database
4. run HTTP, WebSocket, and API smoke tests
5. audit production dependencies for high-severity findings
6. publish the server log when a step fails

## Security and scope

DungeonMaps is currently designed for a trusted local network, not public internet exposure.

Current controls include:

- bounded JSON request bodies
- server-side campaign validation
- generated join tokens
- SQLite foreign keys and WAL mode
- JSON 404 and error responses
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- restrictive camera, microphone, and geolocation permissions
- no-store caching for health and API responses

Before public or remote deployment, the project will need authentication, authorization, encrypted transport, session expiration, rate limiting, join-code lifecycle controls, and a formal threat model.

## Repository structure

```text
public/                  browser dashboard and modules
scripts/                 HTTP, API, and WebSocket smoke tests
server/                  Express, SQLite, routes, store, and sync protocol
.github/workflows/       automated CI
```

## Why this project matters

DungeonMaps demonstrates how I turn a broad user idea into a staged, testable product:

- establish authoritative state before visual complexity
- create a stable API and synchronization seam
- make an early checkpoint usable instead of leaving only backend code
- automate proof that the real workflow works
- communicate completed and future capabilities honestly
