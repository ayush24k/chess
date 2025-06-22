import { WebSocket } from "ws";

export class Game {
    public player1: WebSocket;
    public player2: WebSocket;
    private board: string;
    private moves: string[];
    private startTime: Date;

    constructor(player1: WebSocket, player2: WebSocket) {
        this.player1 = player1;
        this.player2 = player2;
        this.moves = [];
        this.board = "";
        this.startTime = new Date();
    }

    public makeMove (socket: WebSocket, move: string) {
        // check here
        // add validation here (whhic player to move)
        // which user move
        // is the move valid

        //update the nboard
        // push the move

        //check if the game is over

        //send the updated board to both players
    }
}