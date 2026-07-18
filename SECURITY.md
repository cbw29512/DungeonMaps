# Security Policy

DungeonMaps is currently a local-network tabletop showcase. It is not ready for public internet exposure.

## Supported code

Security fixes are applied to the current `main` branch. The project does not maintain parallel supported release branches.

## Reporting a vulnerability

Do not disclose credentials, join codes, database files, private network details, or exploitable findings in a public issue.

Use one of these private channels:

1. Open a private GitHub security advisory when available.
2. Email `divclass01@gmail.com` with the subject `DungeonMaps security report`.

Include the affected commit, safe reproduction steps, expected behavior, observed behavior, impact, and any suggested mitigation.

## Current trust boundary

DungeonMaps assumes:

- the server runs on a game master's trusted device
- clients connect from a trusted local network
- the service is not forwarded directly to the public internet
- join codes are demonstration/future-session credentials, not complete authentication
- the SQLite database remains local and is not committed to Git

## Current controls

- server-side campaign validation
- bounded JSON request bodies
- generated high-entropy join codes
- SQLite foreign keys and WAL mode
- JSON errors instead of default Express error pages
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- restrictive camera, microphone, and geolocation permissions
- no-store caching for health and API responses
- DOM rendering through text nodes rather than injected HTML
- isolated temporary databases in CI
- automated HTTP, API, WebSocket, and dependency checks

## Known limitations before remote deployment

The project still needs:

- user authentication
- DM and player authorization
- TLS termination
- rate limiting
- origin and host restrictions
- session expiration
- join-code expiration, rotation, and revocation
- audit history for game-state actions
- request-size and resource-use review for map uploads
- a formal threat model

## In-scope reports

- bypassing campaign validation
- unintended database access
- arbitrary file reads or writes
- script injection in campaign content
- WebSocket protocol abuse that crashes or corrupts the server
- join-code leakage beyond the intended local dashboard
- unsafe defaults that imply public deployment is supported
- dependency or workflow issues with reproducible impact

## Out of scope

- denial-of-service testing against a live game session
- attacks against GitHub, Node.js, Express, SQLite, or other third-party services themselves
- social engineering or physical access
- findings that require unrelated home, employer, or production infrastructure
- automated scan output without reproducible impact

## Safety rule

Do not expose the current DungeonMaps server directly to the internet. Keep it on a trusted local network until the remote-deployment security requirements are implemented and verified.
