# Chess Project Architecture

## Overview
The project is a real-time multiplayer chess application structured as a monorepo with distinct `client` and `server` environments. It enables users to pair up and play chess against each other over a WebSocket connection.

## Tech Stack

### Client (Frontend)
- **Framework:** Next.js 15 (App Router)
- **UI & Styling:** React 19, Tailwind CSS, and Framer Motion (for dynamic UI animations). Components are modularized inside `components/ui` and `components/landingComponents`.
- **State & Logic:** `chess.js` is leveraged to validate rule-sets and render chess logic locally on the frontend.
- **Real-time Communication:** A custom hook `useSocket.ts` manages the raw WebSocket connection to the backend server.
- **Authentication & Database Access:** `next-auth` is installed for user sessions, alongside a Prisma client (`@prisma/client`) setup to interact with the database.

### Server (Backend)
- **Runtime & Framework:** Node.js with Express and TypeScript.
- **Real-time Engine:** The `ws` library is used to handle raw web sockets, heavily optimizing for low latency gameplay. It runs on port `8080`.
- **Game Session Management:** 
  - A singleton `GameManager` class orchestrates matchmaking and active games.
  - When a user sends an `INIT_GAME` event, the server either places them as a `pendingUser` or pairs them with an existing waiting player to create a new `Game` instance.
  - The `Game` class instance holds the connection state of both users (white/black), handles the `MOVE` events, routing coordinate payloads between the two players.
- **Chess Logic Validation:** `chess.js` is also used on the server to prevent illegal moves and determine special cases like checkmates, stalemates, or insufficient material.

## Current State & Data Flow
1. **Connection**: The client establishes a WebSocket connection to the backend.
2. **Matchmaking**: The Client issues an `{ type: "init_game" }` message. The server adds the client to a waiting queue. Once another client queues up, the server pairs them and starts the game.
3. **Gameplay**: A player makes a move via the UI. The client fires a `{ type: "move", payload: { move: {...} } }` event directly to the server. The `GameManager` isolates the correct `Game` session, validates the move, executes it internally, and broadcasts it to the opposing player.
