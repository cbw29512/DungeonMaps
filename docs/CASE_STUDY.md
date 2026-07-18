# DungeonMaps Case Study

## Executive summary

DungeonMaps is a local-first campaign and battle-map workspace for tabletop game masters. The current milestone turns an API foundation into a usable browser product: the game master can create campaign rooms, see authoritative SQLite state, monitor the local WebSocket connection, and copy generated join codes.

The project demonstrates how I reduce a large product vision into staged, testable checkpoints without misrepresenting incomplete features.

## User problem

Running a tabletop session often requires several disconnected tools:

- campaign notes
- battle maps
- tokens
- player access
- shared state
- fog of war
- game-system context

A game master needs one dependable control room that works on the local network, remains responsive during a live session, and does not require every early milestone to solve the entire product.

## Product goal

Create a local server that owns campaign and map state while browsers act as clients. Start with a stable state, API, and synchronization foundation, then layer on visual map tools without rewriting the core architecture.

## Constraints

- The server must remain authoritative.
- The current experience must work without a cloud account.
- SQLite should remain hidden behind a store boundary.
- WebSocket messages need a versioned envelope for future state events.
- Campaign input must be validated by the server.
- The UI must state clearly that the map canvas and token controls are not complete.
- Automated verification must exercise the real HTTP, API, WebSocket, and database path.
- The current service is for a trusted local network, not public internet exposure.

## Solution

### Browser dashboard

The responsive dashboard is served directly by Express and provides:

- API and WebSocket connection indicators
- server and protocol versions
- campaign cards loaded from the API
- validated campaign creation
- D&D 5e and Call of Cthulhu system selection
- generated join-code display and copying
- honest next-milestone messaging
- mobile and desktop layouts

The browser modules are split by responsibility:

- `api.js` handles HTTP requests
- `sync.js` handles WebSocket connection and heartbeat behavior
- `ui.js` renders safe DOM content
- `app.js` coordinates the product workflow

### Authoritative state

The server validates campaign names and game systems before the store writes to SQLite. Clients request actions through the API; they never write database rows directly.

The game store returns a stable campaign-card model containing the campaign ID, name, system, join token, active map, thumbnail, and timestamps.

### Synchronization seam

The `/sync` WebSocket endpoint supports a versioned envelope:

```json
{
  "type": "client/hello",
  "payload": {},
  "requestId": "..."
}
```

The server responds with a welcome message containing the connection ID, server version, and protocol version. The dashboard also sends periodic pings. Future token, map, fog, and condition events can reuse the same client seam.

### Local database

DungeonMaps uses Node's built-in SQLite support with:

- foreign keys enabled
- WAL mode
- idempotent schema application
- a configurable database path for isolated CI runs
- a repository-ignored default local database

## Key decisions

| Decision | Reason | Tradeoff |
|---|---|---|
| Build state before canvas tools | Prevents visual features from owning business logic | The first milestone looked backend-heavy until the dashboard was added |
| Serve static modules from Express | Keeps local setup simple and dependency-light | No bundler optimizations or component framework yet |
| SQLite behind a store | Preserves a clean migration path | Single-node local persistence only |
| Versioned WebSocket envelopes | Allows protocol growth without replacing the client seam | Current message vocabulary is intentionally small |
| Generated join codes now | Establishes the future invite model early | Authentication and token lifecycle are not complete |
| Explicit local-network scope | Avoids unsafe public-deployment claims | Remote access remains a later security milestone |
| Real smoke tests | Proves all layers work together | Tests boot a server and database rather than remaining unit-only |

## Verification evidence

GitHub Actions automatically:

1. installs locked dependencies
2. checks syntax for server, browser, and smoke-test JavaScript
3. starts the server against a temporary SQLite database
4. verifies the dashboard HTML and JavaScript module
5. verifies defensive HTTP headers and API cache controls
6. verifies the WebSocket welcome handshake and protocol version
7. rejects an invalid game system
8. creates a valid campaign and confirms it appears in the list
9. audits production dependencies for high-severity findings
10. shuts down the test server cleanly

The first M2 pull request passed this complete workflow before merge.

## Security posture

Current controls:

- bounded JSON request bodies
- server-side campaign validation
- high-entropy generated join codes
- foreign-key enforcement
- WAL mode
- JSON errors rather than default HTML stack pages
- framing protection
- content-type sniffing protection
- restrictive browser permissions
- no-store API and health responses
- DOM rendering through `textContent`
- isolated CI database

Before public internet deployment, DungeonMaps requires authentication, authorization, TLS, rate limiting, join-code expiration/revocation, session management, origin restrictions, and a formal threat model.

## Business and customer value

DungeonMaps demonstrates the ability to:

- translate a broad user vision into ordered delivery milestones
- establish stable data and synchronization contracts before visual complexity
- turn a backend checkpoint into a clear, modern product experience
- keep technical scope honest while still showing forward direction
- automate evidence across the browser, API, database, and WebSocket layers
- explain architecture and risk in language useful to technical and nontechnical stakeholders

These skills are relevant to Sales Engineer, Solutions Consultant, implementation, technical product, and customer-facing software roles.

## Current status

Complete:

- local dashboard
- campaign API
- SQLite campaign persistence
- WebSocket connection seam
- game creation and listing
- join-code generation
- responsive UI
- automated CI and smoke testing

Next:

- map upload and selection
- canvas rendering
- token placement and movement
- fog of war
- DM/player roles
- synchronized state snapshots and broadcasts
- campaign resume workflow

## Interview walkthrough

1. Open the dashboard and point out the API and Sync indicators.
2. Create a campaign and explain server-side validation.
3. Show the new campaign card and generated join code.
4. Show the store boundary and SQLite configuration.
5. Show the versioned WebSocket protocol.
6. Show the CI workflow that boots and tests the real product path.
7. Explain why map and token logic are explicitly the next milestone.
