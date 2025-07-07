import { WebSocket } from "ws";
import { Chess } from 'chess.js';
import { GAME_OVER, INIT_GAME, MOVE } from "./messages";

export class Game {
    public player1: WebSocket;
    public player2: WebSocket;
    private board: Chess;
    private startTime: Date;
    private moveCount: number;

    constructor(player1: WebSocket, player2: WebSocket) {
        this.player1 = player1;
        this.player2 = player2;
        this.board = new Chess;
        this.startTime = new Date();
        this.moveCount = 1;

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

        // p1 move are odd and p2 moves are even
        if (this.moveCount % 2 === 0 && socket !== this.player2) {
            console.log("here")
            return;
        }

        if (this.moveCount % 2 !== 0 && socket !== this.player1) {
            console.log("control")
            return;
        }

        try {
            this.board.move(move);
        } catch (err) {
            console.log("not your turn", err);
        }


        if (this.board.isGameOver()) {
            // message to both users
            this.player1.send(JSON.stringify({
                type: GAME_OVER,
                payload: {
                    winner: this.board.turn() === 'w' ? "black" : "white"
                }
            }))

            this.player2.send(JSON.stringify({
                type: GAME_OVER,
                payload: {
                    winner: this.board.turn() === 'w' ? "black" : "white"
                }
            }))
            return;
        }


        //if movecount even then message will go to p1 if odd p2 
        if (this.moveCount % 2 !== 0) {
            this.player2.send(JSON.stringify({
                type: MOVE,
                payload: move
            }))
        } else {
            this.player1.send(JSON.stringify({
                type: MOVE,
                payload: move
            }))
        }
        this.moveCount++;
    }
}