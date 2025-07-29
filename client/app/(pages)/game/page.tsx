'use client'
import { useEffect, useState } from "react";
import { useSocket } from "../../hooks/useSocket";
import Button from "./_components/Button";
import ChessBoard from "./_components/ChessBoard";
import { Chess } from 'chess.js'
import { GAME_OVER, INIT_GAME, MOVE } from "../../messages/messages";


export default function GamePage() {
    const socket = useSocket();
    const [chess, setChess] = useState(new Chess());
    const [board, setBoard] = useState(chess.board());

    useEffect(() => {
        if (!socket) {
            return;
        }

        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            console.log(message);

            switch (message.type) {
                case INIT_GAME: {
                    setBoard(chess.board());
                    console.log("Game initialised");
                    break;
                }
                case MOVE: {
                    const move = message.payload;
                    chess.move(move);
                    setBoard(chess.board());
                    console.log("Move made");
                    break;
                }
                case GAME_OVER: {
                    alert(message.payload.winner)
                    console.log("Game Over");
                    break;
                }
            }
        }
    }, [socket, chess])

    if (!socket) {
        return (
            <div className="h-screen w-screen flex justify-center items-center">
                connecting...
            </div>
        )
    }

    function handlePlay() {
        if (!socket) return
        socket.send(JSON.stringify({
            type: INIT_GAME
        }))
    }

    return (
        <section className="flex justify-center  items-center py-24 bg-neutral-900 min-h-screen ">
            <div className="container realtive max-w-5xl">
                <div className="grid grid-cols-6 gap-5">
                    <div className="col-span-4 bg-neutral-800 flex justify-center items-center">
                        <ChessBoard chess={chess} setBoard={setBoard} socket={socket} board={board} />
                    </div>
                    <div className="col-span-2 bg-neutral-800 p-2 rounded-sm">
                        <div className="text-center">
                            <p className="">Chat Area</p>
                            <Button onClick={handlePlay}>Play</Button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}