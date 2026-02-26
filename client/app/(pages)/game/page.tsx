'use client'
import { useEffect, useState, useRef } from "react";
import { useSocket } from "../../hooks/useSocket";
import Button from "./_components/Button";
import ChessBoard from "./_components/ChessBoard";
import { Chess } from 'chess.js'
import { GAME_OVER, INIT_GAME, MOVE, CHAT, WEBRTC_ICE, WEBRTC_OFFER, WEBRTC_ANSWER } from "../../messages/messages";
import { IconVideo, IconSend, IconUser } from "@tabler/icons-react";

export default function GamePage() {
    const socket = useSocket();
    const [chess, setChess] = useState(new Chess());
    const [board, setBoard] = useState(chess.board());
    const [status, setStatus] = useState("");
    const [showStatus, setShowStatus] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [chatMessages, setChatMessages] = useState<{ sender: string, text: string }[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [playerColor, setPlayerColor] = useState<string | null>(null);

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

    useEffect(() => {
        if (!socket) {
            return;
        }

        const initializeWebRTC = async (color: string) => {
            const pc = new RTCPeerConnection({
                iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
            });
            peerConnectionRef.current = pc;

            pc.onicecandidate = (event) => {
                if (event.candidate && socket) {
                    socket.send(JSON.stringify({ type: WEBRTC_ICE, payload: event.candidate }));
                }
            };

            pc.ontrack = (event) => {
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = event.streams[0];
                }
            };

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
                stream.getTracks().forEach((track) => pc.addTrack(track, stream));
            } catch (err) {
                console.error("Error accessing media devices.", err);
            }

            if (color === 'white') {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                if (socket) {
                    socket.send(JSON.stringify({ type: WEBRTC_OFFER, payload: offer }));
                }
            }
        };

        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            console.log(message);

            switch (message.type) {
                case INIT_GAME: {
                    setBoard(chess.board());
                    setStatus("Match started! Opponent connected.");
                    setIsSearching(false);
                    setIsPlaying(true);
                    setPlayerColor(message.payload.color);
                    console.log("Game initialised");
                    initializeWebRTC(message.payload.color);
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
                    setIsPlaying(false);
                    alert(message.payload.winner)
                    console.log("Game Over");
                    break;
                }
                case CHAT: {
                    setChatMessages(prev => [...prev, { sender: "opponent", text: message.payload.message }]);
                    break;
                }
                case WEBRTC_OFFER: {
                    const handleOffer = async () => {
                        const pc = peerConnectionRef.current;
                        if (!pc) return;
                        await pc.setRemoteDescription(new RTCSessionDescription(message.payload));
                        const answer = await pc.createAnswer();
                        await pc.setLocalDescription(answer);
                        socket.send(JSON.stringify({ type: WEBRTC_ANSWER, payload: answer }));
                    };
                    handleOffer();
                    break;
                }
                case WEBRTC_ANSWER: {
                    const pc = peerConnectionRef.current;
                    if (pc) {
                        pc.setRemoteDescription(new RTCSessionDescription(message.payload));
                    }
                    break;
                }
                case WEBRTC_ICE: {
                    const pc = peerConnectionRef.current;
                    if (pc && message.payload) {
                        pc.addIceCandidate(new RTCIceCandidate(message.payload));
                    }
                    break;
                }
            }
        }
    }, [socket, chess])

    useEffect(() => {
        if (status) {
            setShowStatus(true);
            const timer = setTimeout(() => {
                setShowStatus(false);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [status]);

    if (!socket) {
        return (
            <div className="h-screen w-screen flex justify-center items-center dark:bg-black bg-neutral-200">
                <span className="text-xl font-medium dark:text-neutral-300">Connecting to server...</span>
            </div>
        )
    }

    function handlePlay() {
        if (!socket || isSearching || isPlaying) return
        socket.send(JSON.stringify({
            type: INIT_GAME
        }))
        setIsSearching(true);
        setStatus("Searching for an opponent...");
    }

    function handleSendMessage() {
        if (!socket || !chatInput.trim() || !isPlaying) return;

        socket.send(JSON.stringify({
            type: CHAT,
            payload: { message: chatInput }
        }));
        setChatMessages(prev => [...prev, { sender: "you", text: chatInput }]);
        setChatInput("");
    }

    return (
        <div
            className="relative h-screen overflow-hidden dark:bg-black bg-neutral-200 flex flex-col justify-center"
            style={{
                backgroundImage: `radial-gradient(circle at 0.5px 0.5px, rgba(255,255,255,0.1) 0.9px, transparent 0)`,
                backgroundSize: "8px 8px",
                backgroundRepeat: 'repeat',
            }}
        >
            <div className="max-w-[1400px] mx-auto px-4 py-4 relative z-10 w-full h-full flex flex-col justify-center max-h-screen">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 w-full h-[95vh]">

                    {/* Left Panel: Webcams & Game History */}
                    <div className="lg:col-span-3 flex flex-col gap-4 h-full">

                        {/* Opponent Webcam */}
                        <div className="w-full aspect-video bg-neutral-900/80 backdrop-blur-md rounded-2xl border border-white/10 flex items-center justify-center relative shadow-xl overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-50 text-white/10 group-hover:opacity-80 transition-opacity z-0"></div>
                            {!isPlaying && (
                                <div className="text-neutral-500 font-medium z-10 flex flex-col items-center gap-2">
                                    <IconVideo className="w-8 h-8 opacity-50" />
                                    <span>Opponent Camera</span>
                                </div>
                            )}
                            <video ref={remoteVideoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover z-10" />
                        </div>

                        {/* Game History Log */}
                        <div className="flex-1 bg-neutral-900/80 backdrop-blur-md rounded-2xl border border-white/10 flex flex-col shadow-xl min-h-[250px] relative overflow-hidden">
                            <div className="p-4 border-b border-white/10 font-medium text-white/90 bg-white/5 flex justify-between items-center">
                                <span>Game History</span>
                            </div>

                            <div className="flex-1 p-4 overflow-y-auto">
                                <div className="space-y-2 text-sm text-neutral-400">
                                    <div className="flex justify-between items-center px-2 py-1 bg-white/5 rounded-md text-neutral-500 italic">
                                        <span>Waiting for moves...</span>
                                    </div>
                                    {/* Map through history:
                                        <div className="flex justify-between items-center px-2 py-1 hover:bg-white/5 rounded-md transition-colors cursor-pointer">
                                            <span className="text-neutral-500 w-8">1.</span>
                                            <span className="flex-1 font-medium text-white/80">e4</span>
                                            <span className="flex-1 font-medium text-white/80">e5</span>
                                        </div>
                                    */}
                                </div>
                            </div>
                        </div>

                        {/* User Webcam */}
                        <div className="w-full aspect-video bg-neutral-900/80 backdrop-blur-md rounded-2xl border border-white/10 flex items-center justify-center relative shadow-xl overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-50 group-hover:opacity-80 transition-opacity z-0"></div>
                            {!isPlaying && (
                                <div className="text-neutral-500 font-medium z-10 flex flex-col items-center gap-2">
                                    <IconVideo className="w-8 h-8 opacity-50" />
                                    <span>Your Camera</span>
                                </div>
                            )}
                            <video ref={localVideoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover z-10 scale-x-[-1]" />
                        </div>

                    </div>

                    {/* Center Panel: Chess Board (Takes up majority focus) */}
                    <div className="lg:col-span-6 bg-neutral-900/60 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center justify-center p-4 relative overflow-hidden h-full">

                        {/* Status Bar */}
                        <div className={`w-full bg-black/60 backdrop-blur-md rounded-xl border border-white/20 p-2 md:p-3 absolute top-3 md:top-4 max-w-md left-0 right-0 mx-auto z-20 text-center shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all duration-500 ease-in-out transform ${showStatus ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8 pointer-events-none'}`}>
                            <span className="font-bold text-sm tracking-wide text-green-400 drop-shadow-md">{status}</span>
                        </div>

                        {/* Glowing backdrop elements inside the board container */}
                        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 w-[300px] h-[300px] bg-green-500 rounded-full blur-[200px] opacity-20 pointer-events-none"></div>
                        <div className="absolute bottom-1/4 right-1/4 translate-x-1/4 w-[300px] h-[300px] bg-green-400 rounded-full blur-[200px] opacity-10 pointer-events-none"></div>

                        <div className="flex flex-col gap-4 w-full max-w-[600px] z-10 mt-8">
                            {/* Opponent Info (Top) */}
                            <div className="w-full flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 md:w-12 md:h-12 bg-neutral-800 rounded-lg flex items-center justify-center border border-white/10 shadow-md">
                                        <IconUser className="w-6 h-6 text-neutral-400" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-white/90 text-sm md:text-base">Opponent</span>
                                        <span className="text-xs text-neutral-500">Rating: 1200</span>
                                    </div>
                                </div>
                                <div className="bg-neutral-800 w-24 h-8 md:w-32 md:h-10 rounded-md shadow-inner border border-white/5 flex items-center justify-center">
                                    <span className="font-mono text-lg font-semibold text-white/90">10:00</span>
                                </div>
                            </div>

                            {/* The Board */}
                            <div className="w-full flex items-center justify-center">
                                <ChessBoard chess={chess} setBoard={setBoard} socket={socket} board={board} playerColor={playerColor} />
                            </div>

                            {/* Your Info (Bottom) */}
                            <div className="w-full flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 md:w-12 md:h-12 bg-green-500/20 rounded-lg flex items-center justify-center border border-green-500/30 shadow-md">
                                        <IconUser className="w-6 h-6 text-green-400" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-green-400 text-sm md:text-base">You</span>
                                        <span className="text-xs text-neutral-500">Rating: 1200</span>
                                    </div>
                                </div>
                                <div className="bg-neutral-800 w-24 h-8 md:w-32 md:h-10 rounded-md shadow-inner border border-white/5 flex items-center justify-center">
                                    <span className="font-mono text-lg font-semibold text-green-400">10:00</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Chat & Controls */}
                    <div className="lg:col-span-3 flex flex-col gap-4 h-full">

                        {/* Chat Area */}
                        <div className="flex-1 bg-neutral-900/80 backdrop-blur-md rounded-2xl border border-white/10 flex flex-col shadow-xl min-h-[300px] relative overflow-hidden">
                            <div className="p-4 border-b border-white/10 font-medium text-white/90 bg-white/5">
                                Live Match Chat
                            </div>

                            <div className="flex-1 p-4 flex flex-col gap-2 text-sm overflow-y-auto w-full">
                                {!isPlaying && chatMessages.length === 0 ? (
                                    <div className="flex-1 flex items-center justify-center text-neutral-500">
                                        <p className="bg-black/40 px-4 py-2 rounded-full border border-white/5">Waiting for match to begin...</p>
                                    </div>
                                ) : (
                                    chatMessages.map((msg, idx) => (
                                        <div key={idx} className={`max-w-[85%] px-3 py-2 rounded-xl text-white/90 ${msg.sender === 'you' ? 'bg-green-600 self-end rounded-tr-sm' : 'bg-neutral-800 self-start rounded-tl-sm border border-white/10'}`}>
                                            <span className="text-xs opacity-50 block mb-1">{msg.sender === 'you' ? 'You' : 'Opponent'}</span>
                                            {msg.text}
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="p-3 border-t border-white/10 bg-white/5 flex gap-2">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Send a message..."
                                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-green-500/50 transition-colors placeholder:text-neutral-600 disabled:opacity-50"
                                    disabled={!isPlaying}
                                />
                                <button
                                    onClick={handleSendMessage}
                                    className="p-2 bg-green-500 text-black rounded-xl transition-colors disabled:opacity-50 hover:bg-green-400 focus:outline-none"
                                    disabled={!isPlaying || !chatInput.trim()}
                                >
                                    <IconSend className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Play Button */}
                        <Button
                            onClick={handlePlay}
                            disabled={isSearching || isPlaying}
                            className="w-full bg-green-500 hover:bg-green-400 text-neutral-900 font-bold py-4 rounded-2xl transition-all shadow-xl hover:shadow-green-500/20 text-lg tracking-wide uppercase"
                        >
                            {isSearching ? "Searching..." : isPlaying ? "Match In Progress" : "Find Match"}
                        </Button>

                    </div>

                </div>
            </div>
        </div>
    )
}