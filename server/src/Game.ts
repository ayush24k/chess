import { WebSocket } from "ws";
import { Chess } from 'chess.js';
import { GAME_OVER, INIT_GAME, MOVE, CHAT, TIME_UPDATE, WEBRTC_ICE, WEBRTC_OFFER, WEBRTC_ANSWER } from "./messages";

const INITIAL_TIME = 10 * 60 * 1000; // 10 minutes in ms

export class Game {
    public player1: WebSocket;
    public player2: WebSocket;
    private board: Chess;
    private startTime: Date;
    private moveCount: number;
    private player1Time: number;  // ms remaining
    private player2Time: number;  // ms remaining
    private lastMoveTime: number; // Date.now() of last move / game start
    private timerInterval: ReturnType<typeof setInterval> | null;
    private gameOver: boolean;

    constructor(player1: WebSocket, player2: WebSocket) {
        this.player1 = player1;
        this.player2 = player2;
        this.board = new Chess;
        this.startTime = new Date();
        this.moveCount = 1;
        this.player1Time = INITIAL_TIME;
        this.player2Time = INITIAL_TIME;
        this.lastMoveTime = Date.now();
        this.timerInterval = null;
        this.gameOver = false;

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

        // Send initial time to both players
        this.broadcastTime();

        // Start server-side timer check every second
        this.timerInterval = setInterval(() => {
            this.checkTimeout();
        }, 1000);
    }

    private broadcastTime() {
        const payload = {
            whiteTime: this.player1Time,
            blackTime: this.player2Time,
        };
        this.player1.send(JSON.stringify({ type: TIME_UPDATE, payload }));
        this.player2.send(JSON.stringify({ type: TIME_UPDATE, payload }));
    }

    private checkTimeout() {
        if (this.gameOver) return;

        const now = Date.now();
        const elapsed = now - this.lastMoveTime;

        // White moves on odd moveCount, black on even
        if (this.moveCount % 2 !== 0) {
            // White's turn (player1)
            const remaining = this.player1Time - elapsed;
            if (remaining <= 0) {
                this.player1Time = 0;
                this.endGame("black", "timeout");
                return;
            }
        } else {
            // Black's turn (player2)
            const remaining = this.player2Time - elapsed;
            if (remaining <= 0) {
                this.player2Time = 0;
                this.endGame("white", "timeout");
                return;
            }
        }
    }

    private endGame(winner: string, reason: string) {
        this.gameOver = true;
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.broadcastTime();
        const payload = { winner, reason };
        this.player1.send(JSON.stringify({ type: GAME_OVER, payload }));
        this.player2.send(JSON.stringify({ type: GAME_OVER, payload }));
    }

    public cleanup() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    public makeMove(socket: WebSocket, move: {
        from: string,
        to: string
    }) {
        if (this.gameOver) return;

        // p1 move are odd and p2 moves are even
        if (this.moveCount % 2 === 0 && socket !== this.player2) {
            console.log("here")
            return;
        }

        if (this.moveCount % 2 !== 0 && socket !== this.player1) {
            console.log("control")
            return;
        }

        // Deduct elapsed time from the active player
        const now = Date.now();
        const elapsed = now - this.lastMoveTime;

        if (this.moveCount % 2 !== 0) {
            // White just moved
            this.player1Time -= elapsed;
            if (this.player1Time <= 0) {
                this.player1Time = 0;
                this.endGame("black", "timeout");
                return;
            }
        } else {
            // Black just moved
            this.player2Time -= elapsed;
            if (this.player2Time <= 0) {
                this.player2Time = 0;
                this.endGame("white", "timeout");
                return;
            }
        }

        this.lastMoveTime = now;

        try {
            this.board.move(move);
        } catch (err) {
            console.log("invalid move", err);
            // Refund the time deducted since the move was invalid
            if (this.moveCount % 2 !== 0) {
                this.player1Time += elapsed;
            } else {
                this.player2Time += elapsed;
            }
            this.lastMoveTime = now - elapsed + elapsed; // keep lastMoveTime as before
            return;
        }


        if (this.board.isGameOver()) {
            const winner = this.board.turn() === 'w' ? "black" : "white";
            this.endGame(winner, "checkmate");
            return;
        }

        // Send move to opponent
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

        // Broadcast updated times after every move
        this.broadcastTime();
    }

    public handleChat(socket: WebSocket, message: string) {
        // Relay the chat message to the opponent
        if (socket === this.player1) {
            this.player2.send(JSON.stringify({
                type: CHAT,
                payload: { message }
            }));
        } else if (socket === this.player2) {
            this.player1.send(JSON.stringify({
                type: CHAT,
                payload: { message }
            }));
        }
    }

    public handleWebRTC(socket: WebSocket, type: string, payload: any) {
        if (socket === this.player1) {
            this.player2.send(JSON.stringify({ type, payload }));
        } else if (socket === this.player2) {
            this.player1.send(JSON.stringify({ type, payload }));
        }
    }
}