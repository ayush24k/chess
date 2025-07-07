import { WebSocket } from "ws";
import { INIT_GAME, MOVE } from "./messages";
import { Game } from "./Game";

export class GameManager {
    private games: Game[];
    private pendingUser: WebSocket | null;
    private users: WebSocket[];

    constructor() {
        this.games = [];
        this.pendingUser = null;
        this.users = [];
    }

    addUser(socket: WebSocket) {
        this.users.push(socket);
        this.addHandler(socket);
    }

    removeUser(socket: WebSocket) {
        this.users = this.users.filter((user) => {
            return user != socket;
        })

        // stop cuz user has left
    }

    private startGame(socket: WebSocket) {
        // check if there is a pending user
        if (this.pendingUser) {
            // start the game
            const game = new Game(this.pendingUser, socket);
            this.games.push(game);
            this.pendingUser = null;
        } else {
            this.pendingUser = socket;
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
                this.startGame(socket);
            }

            if (message.type === MOVE) {
                console.log(message)
                this.handleMove(socket, message.payload.move)
            }
        })
    }

}