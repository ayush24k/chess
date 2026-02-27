'use client'
import { useEffect, useState, useRef } from "react";
import { useSocket } from "../../hooks/useSocket";
import Button from "./_components/Button";
import ChessBoard from "./_components/ChessBoard";
import { Chess } from 'chess.js'
import { GAME_OVER, INIT_GAME, MOVE, CHAT, WEBRTC_ICE, WEBRTC_OFFER, WEBRTC_ANSWER } from "../../messages/messages";
import { IconVideo, IconSend, IconUser, IconMessageCircle, IconX, IconHistory, IconSwords } from "@tabler/icons-react";

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
    const [mobileChatOpen, setMobileChatOpen] = useState(false);
    const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);

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
            className="relative h-[100dvh] overflow-hidden dark:bg-black bg-neutral-200"
            style={{
                backgroundImage: `radial-gradient(circle at 0.5px 0.5px, rgba(255,255,255,0.1) 0.9px, transparent 0)`,
                backgroundSize: "8px 8px",
                backgroundRepeat: 'repeat',
            }}
        >
            {/* Floating Status Toast */}
            <div className={`fixed top-3 left-1/2 -translate-x-1/2 z-50 bg-black/60 backdrop-blur-md rounded-xl border border-white/20 px-4 py-2 text-center shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all duration-500 ease-in-out transform ${showStatus ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8 pointer-events-none'}`}>
                <span className="font-bold text-sm tracking-wide text-green-400 drop-shadow-md">{status}</span>
            </div>

            <div className="game-grid max-w-[1400px] mx-auto relative z-10">

                {/* Opponent Camera — desktop only grid item */}
                <div className="game-cam-opp bg-neutral-900/80 backdrop-blur-md rounded-2xl border border-white/10 flex items-center justify-center relative shadow-xl overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-50 group-hover:opacity-80 transition-opacity z-0"></div>
                    {!isPlaying && (
                        <div className="text-neutral-500 font-medium z-10 flex flex-col items-center gap-2">
                            <IconVideo className="w-8 h-8 opacity-50" />
                            <span>Opponent</span>
                        </div>
                    )}
                    <video ref={remoteVideoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover z-10 lg:block hidden" />
                </div>

                {/* Your Camera — desktop only grid item */}
                <div className="game-cam-you bg-neutral-900/80 backdrop-blur-md rounded-2xl border border-white/10 flex items-center justify-center relative shadow-xl overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-50 group-hover:opacity-80 transition-opacity z-0"></div>
                    {!isPlaying && (
                        <div className="text-neutral-500 font-medium z-10 flex flex-col items-center gap-2">
                            <IconVideo className="w-8 h-8 opacity-50" />
                            <span>You</span>
                        </div>
                    )}
                    <video ref={localVideoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover z-10 scale-x-[-1] lg:block hidden" />
                </div>

                {/* Game History — desktop only grid item */}
                <div className="game-history bg-neutral-900/80 backdrop-blur-md rounded-2xl border border-white/10 flex-col shadow-xl overflow-hidden">
                    <div className="flex p-4 border-b border-white/10 font-medium text-white/90 bg-white/5 justify-between items-center">
                        <span>Game History</span>
                    </div>
                    <div className="flex-1 p-4 overflow-y-auto">
                        <div className="flex flex-col gap-2 text-sm text-neutral-400">
                            <div className="px-2 py-1 bg-white/5 rounded-md text-neutral-500 italic text-sm">
                                <span>Waiting for moves...</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chess Board Area */}
                <div className="game-board bg-neutral-900/60 backdrop-blur-md rounded-xl lg:rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center justify-center px-2 py-1 lg:p-4 relative overflow-hidden">
                    {/* Glow effects (desktop only) */}
                    <div className="hidden lg:block absolute top-1/4 left-1/4 -translate-x-1/2 w-[300px] h-[300px] bg-green-500 rounded-full blur-[200px] opacity-20 pointer-events-none"></div>
                    <div className="hidden lg:block absolute bottom-1/4 right-1/4 translate-x-1/4 w-[300px] h-[300px] bg-green-400 rounded-full blur-[200px] opacity-10 pointer-events-none"></div>

                    <div className="flex flex-col gap-1 lg:gap-4 w-full max-w-[600px] z-10">
                        {/* Opponent Info */}
                        <div className="w-full flex items-center justify-between">
                            <div className="flex items-center gap-2 lg:gap-3">
                                <div className="w-7 h-7 lg:w-12 lg:h-12 bg-neutral-800 rounded-lg flex items-center justify-center border border-white/10 shadow-md">
                                    <IconUser className="w-4 h-4 lg:w-6 lg:h-6 text-neutral-400" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-white/90 text-xs lg:text-base">Opponent</span>
                                    <span className="text-[10px] lg:text-xs text-neutral-500">Rating: 1200</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="bg-neutral-800 w-16 h-6 lg:w-32 lg:h-10 rounded-md shadow-inner border border-white/5 flex items-center justify-center">
                                    <span className="font-mono text-xs lg:text-lg font-semibold text-white/90">10:00</span>
                                </div>
                                {/* Mobile: Opponent camera */}
                                <div className="lg:hidden w-8 h-8 rounded-md bg-neutral-800 border border-white/10 relative overflow-hidden flex items-center justify-center">
                                    {!isPlaying && <IconVideo className="w-4 h-4 text-neutral-500 opacity-50" />}
                                    <video ref={remoteVideoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
                                </div>
                            </div>
                        </div>

                        {/* The Board */}
                        <div className="w-full flex items-center justify-center">
                            <ChessBoard chess={chess} setBoard={setBoard} socket={socket} board={board} playerColor={playerColor} />
                        </div>

                        {/* Your Info */}
                        <div className="w-full flex items-center justify-between">
                            <div className="flex items-center gap-2 lg:gap-3">
                                <div className="w-7 h-7 lg:w-12 lg:h-12 bg-green-500/20 rounded-lg flex items-center justify-center border border-green-500/30 shadow-md">
                                    <IconUser className="w-4 h-4 lg:w-6 lg:h-6 text-green-400" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-green-400 text-xs lg:text-base">You</span>
                                    <span className="text-[10px] lg:text-xs text-neutral-500">Rating: 1200</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="bg-neutral-800 w-16 h-6 lg:w-32 lg:h-10 rounded-md shadow-inner border border-white/5 flex items-center justify-center">
                                    <span className="font-mono text-xs lg:text-lg font-semibold text-green-400">10:00</span>
                                </div>
                                {/* Mobile: Your camera */}
                                <div className="lg:hidden w-8 h-8 rounded-md bg-neutral-800 border border-green-500/30 relative overflow-hidden flex items-center justify-center">
                                    {!isPlaying && <IconVideo className="w-4 h-4 text-green-400 opacity-50" />}
                                    <video ref={localVideoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chat — Desktop: inline in grid / Mobile: hidden (use floating button) */}
                <div className="game-chat hidden lg:flex bg-neutral-900/80 backdrop-blur-md rounded-2xl border border-white/10 flex-col shadow-xl overflow-hidden">
                    <div className="p-4 border-b border-white/10 font-medium text-white/90 bg-white/5">
                        Live Match Chat
                    </div>
                    <div className="flex-1 p-4 flex flex-col gap-2 text-sm overflow-y-auto min-h-0">
                        {!isPlaying && chatMessages.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center text-neutral-500">
                                <p className="bg-black/40 px-4 py-2 rounded-full border border-white/5 text-sm">Waiting for match...</p>
                            </div>
                        ) : (
                            chatMessages.map((msg, idx) => (
                                <div key={idx} className={`max-w-[85%] px-3 py-2 rounded-xl text-white/90 text-sm ${msg.sender === 'you' ? 'bg-green-600 self-end rounded-tr-sm' : 'bg-neutral-800 self-start rounded-tl-sm border border-white/10'}`}>
                                    <span className="text-xs opacity-50 block mb-0.5">{msg.sender === 'you' ? 'You' : 'Opponent'}</span>
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
                            placeholder="Message..."
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

                {/* Controls / Play Button — desktop only */}
                <div className="game-controls items-end">
                    <Button
                        onClick={handlePlay}
                        disabled={isSearching || isPlaying}
                        className="w-full bg-green-500 hover:bg-green-400 text-neutral-900 font-bold py-4 rounded-2xl transition-all shadow-xl hover:shadow-green-500/20 text-lg tracking-wide uppercase"
                    >
                        {isSearching ? "Searching..." : isPlaying ? "In Progress" : "Find Match"}
                    </Button>
                </div>

                {/* Mobile Bottom Toolbar */}
                <div className="game-toolbar lg:hidden bg-neutral-900/90 backdrop-blur-md rounded-xl border border-white/10 flex items-center justify-around px-2">
                    <button
                        onClick={() => setMobileChatOpen(true)}
                        className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg hover:bg-white/10 transition-colors relative"
                    >
                        <IconMessageCircle className="w-5 h-5 text-neutral-400" />
                        <span className="text-[9px] text-neutral-500">Chat</span>
                        {chatMessages.length > 0 && (
                            <span className="absolute -top-0.5 right-0 w-4 h-4 bg-red-500 rounded-full text-[8px] font-bold text-white flex items-center justify-center">
                                {chatMessages.length > 99 ? '99' : chatMessages.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setMobileHistoryOpen(true)}
                        className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <IconHistory className="w-5 h-5 text-neutral-400" />
                        <span className="text-[9px] text-neutral-500">History</span>
                    </button>
                    <button
                        onClick={handlePlay}
                        disabled={isSearching || isPlaying}
                        className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-40"
                    >
                        <IconSwords className="w-5 h-5 text-green-400" />
                        <span className="text-[9px] text-green-400 font-medium">{isSearching ? 'Searching' : isPlaying ? 'Playing' : 'Find Match'}</span>
                    </button>
                </div>

            </div>

            {/* Mobile Chat Sheet */}
            <div className={`bottom-sheet ${mobileChatOpen ? 'open' : 'closed'}`}>
                <div className="flex-1" onClick={() => setMobileChatOpen(false)} />
                <div className="bottom-sheet-panel h-[55dvh] bg-neutral-900 border-t border-white/10 rounded-t-2xl flex flex-col">
                    <div className="p-3 border-b border-white/10 flex items-center justify-between bg-white/5 rounded-t-2xl">
                        <span className="font-medium text-white/90 text-sm">Live Chat</span>
                        <button onClick={() => setMobileChatOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                            <IconX className="w-5 h-5 text-neutral-400" />
                        </button>
                    </div>
                    <div className="flex-1 p-3 flex flex-col gap-2 text-sm overflow-y-auto min-h-0">
                        {!isPlaying && chatMessages.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center text-neutral-500">
                                <p className="bg-black/40 px-3 py-1.5 rounded-full border border-white/5 text-xs">Waiting for match...</p>
                            </div>
                        ) : (
                            chatMessages.map((msg, idx) => (
                                <div key={idx} className={`max-w-[85%] px-3 py-2 rounded-xl text-white/90 text-sm ${msg.sender === 'you' ? 'bg-green-600 self-end rounded-tr-sm' : 'bg-neutral-800 self-start rounded-tl-sm border border-white/10'}`}>
                                    <span className="text-xs opacity-50 block mb-0.5">{msg.sender === 'you' ? 'You' : 'Opponent'}</span>
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
                            placeholder="Message..."
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
            </div>

            {/* Mobile History Sheet */}
            <div className={`bottom-sheet ${mobileHistoryOpen ? 'open' : 'closed'}`}>
                <div className="flex-1" onClick={() => setMobileHistoryOpen(false)} />
                <div className="bottom-sheet-panel h-[45dvh] bg-neutral-900 border-t border-white/10 rounded-t-2xl flex flex-col">
                    <div className="p-3 border-b border-white/10 flex items-center justify-between bg-white/5 rounded-t-2xl">
                        <span className="font-medium text-white/90 text-sm">Game History</span>
                        <button onClick={() => setMobileHistoryOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                            <IconX className="w-5 h-5 text-neutral-400" />
                        </button>
                    </div>
                    <div className="flex-1 p-3 overflow-y-auto">
                        <div className="flex flex-col gap-2 text-sm text-neutral-400">
                            <div className="px-2 py-1 bg-white/5 rounded-md text-neutral-500 italic text-xs">
                                <span>Waiting for moves...</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}