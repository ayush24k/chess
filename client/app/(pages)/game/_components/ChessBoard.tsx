'use client'
import { MOVE } from "@/app/messages/messages";
import { Chess, Color, PieceSymbol, Square } from "chess.js";
import { useState } from "react";

export default function ChessBoard({ board, socket, setBoard, chess }: {
    chess: Chess;
    setBoard: any;
    board: ({
        square: Square;
        type: PieceSymbol;
        color: Color;
    } | null)[][];
    socket: WebSocket;
}) {

    const [from, setfrom] = useState<null | Square>(null);


    return (
        <div className="text-neutral-900 p-2">
            {board.map((row, i) => {
                return (
                    <div key={i} className="flex cursor-grab">
                        {row.map((square, j) => {
                            const squareRepresentation = String.fromCharCode(97 + (j % 8)) + "" + (8 - i) as Square;
                            return (
                                <div
                                    key={j}
                                    className={`w-14 h-14 flex justify-center items-center ${(i + j) % 2 === 0 ? `bg-green-600` : `bg-green-300`}`}
                                    onClick={() => {
                                        if (!from) {
                                            setfrom(squareRepresentation)
                                        } else {
                                            socket.send(JSON.stringify({
                                                type: MOVE,
                                                payload: {
                                                    move: {
                                                        from,
                                                        to: squareRepresentation
                                                    }
                                                }
                                            }))
                                            setfrom(null);
                                            chess.move({
                                                from,
                                                to: squareRepresentation
                                            });
                                            setBoard(chess.board());


                                            console.log({
                                                from,
                                                to: squareRepresentation
                                            })
                                        }
                                    }}
                                >
                                    {square ? square.type : ""}
                                </div>
                            )
                        })}
                    </div>
                )
            })}
        </div>
    )
}