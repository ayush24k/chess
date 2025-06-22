import { WebSocket } from "ws";
import { Chess } from 'chess.js';
import { GAME_OVER, INIT_GAME, MOVE } from "./messages";

export class Game {
    public player1: WebSocket;
    public player2: WebSocket;
    private board: Chess;
    private moves: string[];
    private startTime: Date;

    constructor(player1: WebSocket, player2: WebSocket) {
        this.player1 = player1;
        this.player2 = player2;
        this.moves = [];
        this.board = new Chess;
        this.startTime = new Date();

        // sending start messages
        this.player1.send(JSON.stringify({
            type: INIT_GAME,
            payload: {
                color: "white"
            }
        }))

        this.player2.send(JSON.stringify({
            type: INIT_GAME,
            payload: {
                color: "black"
            }
        }))
    }

    public makeMove(socket: WebSocket, move: {
        from: string,
        to: string
    }) {
        // validate the move using zod

        // here moves lenght is even and player 2 is trying to make the move
        if (this.board.moves.length % 2 === 0 && socket !== this.player1) {
            return;
        }

        if (this.board.moves.length % 2 !== 0 && socket !== this.player2) {
            return;
        }

        try {
            this.board.move(move);
        } catch (err) {
            console.log("not your turn", err);
        }


        if (this.board.isGameOver()) {
            // message to both users
            this.player1.emit(JSON.stringify({
                type: GAME_OVER,
                payload: {
                    winner: this.board.turn() === 'w' ? "black" : "white" 
                }
            }))

            this.player2.emit(JSON.stringify({
                type: GAME_OVER,
                payload: {
                    winner: this.board.turn() === 'w' ? "black" : "white" 
                }
            }))
            return;
        }

        if (this.board.moves.length % 2 === 0) {
            this.player1.emit(JSON.stringify({
                type: MOVE,
                payload: move
            }))
        } else {
            this.player2.emit(JSON.stringify({
                type: MOVE,
                payload: move
            }))
        }

    }
}