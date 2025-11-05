# Chess Realtime Server

Express + WebSocket server powering realtime chess matches using `chess.js` for move validation and game state.

- HTTP: Express on port 8080 (health at `/`)
- WS: `ws` on the same port; pairs players and relays moves
- Engine: `chess.js` for rules, turns, and game-over detection

## Requirements
- Node.js 18+
- pnpm (recommended) or npm/yarn

## Install
```bash
pnpm install
# or
npm install
```

## Development
Starts TypeScript watch and runs the compiled server on change.
```bash
pnpm dev
```
This uses `tsc-watch` to rebuild and restarts the Node process running `dist/server.js`.

## Build
```bash
pnpm build
```
Outputs compiled JS to `dist/`.

## Start (production)
```bash
pnpm start
```
Builds then runs `node dist/server.js` on port `8080`.

