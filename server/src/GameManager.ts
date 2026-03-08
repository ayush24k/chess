import { WebSocket } from "ws";
import { INIT_GAME, MOVE, CHAT, WEBRTC_ICE, WEBRTC_OFFER, WEBRTC_ANSWER, PLAYER_COUNT, PLAYER_QUIT } from "./messages";
import { Game, PlayerInfo } from "./Game";

export class GameManager {
    private games: Game[];
    private pendingUser: { socket: WebSocket; info: PlayerInfo } | null;
    private users: WebSocket[];

    constructor() {
        this.games = [];
        this.pendingUser = null;
        this.users = [];
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
        if (game && !game.isGameOver()) {
            game.handlePlayerQuit(socket);
            this.games = this.games.filter((g) => g !== game);
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
        to: string
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
        })
    }

}