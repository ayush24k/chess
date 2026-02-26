'use client'
import { useEffect, useState } from "react";
import { useSocket } from "../../hooks/useSocket";
import Button from "./_components/Button";
import ChessBoard from "./_components/ChessBoard";
import { Chess } from 'chess.js'
import { GAME_OVER, INIT_GAME, MOVE } from "../../messages/messages";
import Navbar from "@/components/landingComponents/Navbar";
import { IconVideo, IconSend } from "@tabler/icons-react";

export default function GamePage() {
    const socket = useSocket();
    const [chess, setChess] = useState(new Chess());
    const [board, setBoard] = useState(chess.board());
    const [status, setStatus] = useState("Waiting to connect...");

    useEffect(() => {
        if (!socket) {
            return;
        }

        setStatus("Connected! Ready to play.");

        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            console.log(message);

            switch (message.type) {
                case INIT_GAME: {
                    setBoard(chess.board());
                    setStatus("Match started! Opponent connected.");
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
                    setStatus(`Game Over! ${message.payload.winner} won.`);
                    alert(message.payload.winner)
                    console.log("Game Over");
                    break;
                }
            }
        }
    }, [socket, chess])

    if (!socket) {
        return (
            <div className="h-screen w-screen flex justify-center items-center dark:bg-black bg-neutral-200">
                <span className="text-xl font-medium dark:text-neutral-300">Connecting to server...</span>
            </div>
        )
    }

    function handlePlay() {
        if (!socket) return
        socket.send(JSON.stringify({
            type: INIT_GAME
        }))
        setStatus("Searching for an opponent...");
    }

    return (
        <div
            className="relative min-h-screen overflow-x-hidden dark:bg-black bg-neutral-200"
            style={{
                backgroundImage: `radial-gradient(circle at 0.5px 0.5px, rgba(255,255,255,0.1) 0.9px, transparent 0)`,
                backgroundSize: "8px 8px",
                backgroundRepeat: 'repeat',
            }}
        >
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 py-28 relative z-10 w-full min-h-screen flex flex-col justify-center">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 w-full">

                    {/* Left Panel: Chess Board */}
                    <div className="lg:col-span-8 bg-neutral-900/60 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center justify-center p-4 lg:p-8 min-h-[500px] relative overflow-hidden">

                        {/* Status Bar */}
                        <div className="w-full bg-black/40 backdrop-blur-sm rounded-xl border border-white/10 p-4 absolute top-4 md:top-8 max-w-xl mx-auto z-20 text-center shadow-lg">
                            <span className="font-medium text-white/90">{status}</span>
                        </div>

                        {/* Glowing backdrop elements inside the board container */}
                        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 w-[300px] h-[300px] bg-green-500 rounded-full blur-[200px] opacity-20 pointer-events-none"></div>
                        <div className="absolute bottom-1/4 right-1/4 translate-x-1/4 w-[300px] h-[300px] bg-green-400 rounded-full blur-[200px] opacity-10 pointer-events-none"></div>

                        <div className="z-10 w-full max-w-[600px] flex items-center justify-center mt-16 md:mt-24">
                            <ChessBoard chess={chess} setBoard={setBoard} socket={socket} board={board} />
                        </div>
                    </div>

                    {/* Right Panel: Webcams & Chat */}
                    <div className="lg:col-span-4 flex flex-col gap-4 h-full">

                        {/* Opponent Webcam */}
                        <div className="w-full aspect-video bg-neutral-900/80 backdrop-blur-md rounded-2xl border border-white/10 flex items-center justify-center relative shadow-xl overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-50 text-white/10 group-hover:opacity-80 transition-opacity"></div>
                            <div className="text-neutral-500 font-medium z-10 flex flex-col items-center gap-2">
                                <IconVideo className="w-8 h-8 opacity-50" />
                                <span>Opponent Camera</span>
                            </div>
                        </div>

                        {/* Chat Area & Controls */}
                        <div className="flex-1 bg-neutral-900/80 backdrop-blur-md rounded-2xl border border-white/10 flex flex-col shadow-xl min-h-[200px] relative overflow-hidden">

                            {/* Header */}
                            <div className="p-4 border-b border-white/10 font-medium text-white/90 bg-white/5">
                                Live Match Chat
                            </div>

                            {/* Chat messages */}
                            <div className="flex-1 p-4 flex flex-col items-center justify-center text-neutral-500 text-sm overflow-y-auto">
                                <p className="bg-black/40 px-4 py-2 rounded-full border border-white/5 mb-auto mt-auto">Waiting for match to begin...</p>
                            </div>

                            {/* Input Area */}
                            <div className="p-3 border-t border-white/10 bg-white/5 flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Send a message..."
                                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-green-500/50 transition-colors placeholder:text-neutral-600"
                                    disabled
                                />
                                <button className="p-2 bg-green-500 text-black rounded-xl transition-colors disabled:opacity-50" disabled>
                                    <IconSend className="w-5 h-5" />
                                </button>
                            </div>

                        </div>

                        {/* Play Button */}
                        <Button
                            onClick={handlePlay}
                            className="w-full bg-green-500 hover:bg-green-400 text-neutral-900 font-bold py-4 rounded-2xl transition-all shadow-xl hover:shadow-green-500/20 text-lg tracking-wide uppercase"
                        >
                            Find Match
                        </Button>

                        {/* User Webcam */}
                        <div className="w-full aspect-video bg-neutral-900/80 backdrop-blur-md rounded-2xl border border-white/10 flex items-center justify-center relative shadow-xl overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-50 group-hover:opacity-80 transition-opacity"></div>
                            <div className="text-neutral-500 font-medium z-10 flex flex-col items-center gap-2">
                                <IconVideo className="w-8 h-8 opacity-50" />
                                <span>Your Camera</span>
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </div>
    )
}