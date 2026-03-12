import { WebSocket } from "ws";
import { INIT_GAME, MOVE, CHAT, WEBRTC_ICE, WEBRTC_OFFER, WEBRTC_ANSWER, PLAYER_COUNT, PLAYER_QUIT, PLAY_AGAIN_REQUEST, PLAY_AGAIN_RESPONSE, PLAY_AGAIN_CANCELLED } from "./messages";
import { Game, PlayerInfo } from "./Game";

export class GameManager {
    private games: Game[];
    private pendingUser: { socket: WebSocket; info: PlayerInfo } | null;
    private users: WebSocket[];
    private rematchRequests: Map<string, WebSocket>; // gameId -> requestor socket

    constructor() {
        this.games = [];
        this.pendingUser = null;
        this.users = [];
        this.rematchRequests = new Map();
    }

    addUser(socket: WebSocket) {
        this.users.push(socket);
        this.addHandler(socket);
        this.broadcastPlayerCount();
    }

    removeUser(socket: WebSocket) {
        this.users = this.users.filter((user) => {
            return user != socket;
        })

        // If the pending user disconnects, clear them
        if (this.pendingUser && this.pendingUser.socket === socket) {
            this.pendingUser = null;
        }

        // End any active game this socket was part of
        this.endGameForSocket(socket);

        this.broadcastPlayerCount();
    }

    private endGameForSocket(socket: WebSocket) {
        const game = this.games.find((g) => g.player1 === socket || g.player2 === socket);
        if (!game) return;

        if (!game.isGameOver()) {
            game.handlePlayerQuit(socket);
            this.games = this.games.filter((g) => g !== game);
            this.rematchRequests.delete(game.gameId);
        } else {
            // Game already finished — only clean up when both sockets are gone
            const other = game.player1 === socket ? game.player2 : game.player1;
            if (other.readyState !== WebSocket.OPEN) {
                this.games = this.games.filter((g) => g !== game);
                this.rematchRequests.delete(game.gameId);
            }
        }
    }

    private broadcastPlayerCount() {
        const message = JSON.stringify({
            type: PLAYER_COUNT,
            payload: { count: this.users.length }
        });
        this.users.forEach((user) => {
            if (user.readyState === WebSocket.OPEN) {
                user.send(message);
            }
        });
    }

    private startGame(socket: WebSocket, playerInfo: PlayerInfo) {
        // check if there is a pending user
        if (this.pendingUser && this.pendingUser.socket !== socket) {
            // start the game
            const game = new Game(this.pendingUser.socket, socket, this.pendingUser.info, playerInfo);
            this.games.push(game);
            this.pendingUser = null;
        } else {
            this.pendingUser = { socket, info: playerInfo };
        }
    }

    private handleMove(socket: WebSocket, move: {
        from: string,
        to: string,
        promotion?: string
    }) {
        // find the running game using player socket
        console.log(move)
        const game = this.games.find((game) => {
            return game.player1 === socket || game.player2 === socket
        })

        if (game) {
            game.makeMove(socket, move)
        }
    }

    private addHandler(socket: WebSocket) {
        socket.on('message', (data) => {

            const message = JSON.parse(data.toString());

            if (message.type === INIT_GAME) {
                const playerInfo: PlayerInfo = {
                    userId: message.payload?.userId || 'anonymous',
                    name: message.payload?.name || 'Guest',
                    rating: message.payload?.rating || 500,
                };
                this.startGame(socket, playerInfo);
            }

            if (message.type === MOVE) {
                console.log(message)
                this.handleMove(socket, message.payload.move)
            }

            if (message.type === CHAT) {
                const game = this.games.find((game) => game.player1 === socket || game.player2 === socket);
                if (game) {
                    game.handleChat(socket, message.payload.message);
                }
            }

            if (message.type === WEBRTC_ICE || message.type === WEBRTC_OFFER || message.type === WEBRTC_ANSWER) {
                const game = this.games.find((game) => game.player1 === socket || game.player2 === socket);
                if (game) {
                    game.handleWebRTC(socket, message.type, message.payload);
                }
            }

            if (message.type === PLAYER_QUIT) {
                this.endGameForSocket(socket);
            }

            if (message.type === PLAY_AGAIN_REQUEST) {
                const game = this.games.find((g) => g.player1 === socket || g.player2 === socket);
                if (!game || !game.isGameOver()) return;
                const opponent = game.player1 === socket ? game.player2 : game.player1;
                this.rematchRequests.set(game.gameId, socket);
                if (opponent.readyState === WebSocket.OPEN) {
                    opponent.send(JSON.stringify({ type: PLAY_AGAIN_REQUEST }));
                } else {
                    this.rematchRequests.delete(game.gameId);
                    socket.send(JSON.stringify({ type: PLAY_AGAIN_CANCELLED, payload: { reason: 'opponent_left' } }));
                }
            }

            if (message.type === PLAY_AGAIN_RESPONSE) {
                const game = this.games.find((g) => g.player1 === socket || g.player2 === socket);
                if (!game) return;
                const requestor = this.rematchRequests.get(game.gameId);
                if (!requestor) return;
                this.rematchRequests.delete(game.gameId);
                if (message.payload?.accepted) {
                    // Responder (socket) becomes white, requestor becomes black — colors swap
                    const responderInfo = game.player1 === socket ? game.player1Info : game.player2Info;
                    const requestorInfo = game.player1 === requestor ? game.player1Info : game.player2Info;
                    this.games = this.games.filter((g) => g !== game);
                    const newGame = new Game(socket, requestor, responderInfo, requestorInfo);
                    this.games.push(newGame);
                } else {
                    if (requestor.readyState === WebSocket.OPEN) {
                        requestor.send(JSON.stringify({ type: PLAY_AGAIN_CANCELLED, payload: { reason: 'declined' } }));
                    }
                }
            }
        })
    }

}