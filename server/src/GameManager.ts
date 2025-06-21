import { WebSocket } from "ws";
import { INIT_GAME } from "./messages";

export class GameManager {
    private games: Game[];
    private pendingUser: WebSocket;
    private users: WebSocket[];

    constructor () {
        this.games = []
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

    private addHandler(socket: WebSocket) {
        socket.on('message', (data) => {
            const message = JSON.parse(data.toString());
            
            if (message === INIT_GAME) {
                // check if there is a pending user
                if (this.pendingUser) {
                    // start the game
                } else {
                    this.pendingUser = socket;
                }
            } 
        })
    }

}