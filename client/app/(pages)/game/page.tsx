'use client'
import { useEffect, useState, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useSocket } from "../../hooks/useSocket";
import Button from "./_components/Button";
import ChessBoard from "./_components/ChessBoard";
import { Chess } from 'chess.js'
import { GAME_OVER, INIT_GAME, MOVE, CHAT, TIME_UPDATE, WEBRTC_ICE, WEBRTC_OFFER, WEBRTC_ANSWER } from "../../messages/messages";
import { IconVideo, IconSend, IconUser, IconMessageCircle, IconX, IconHistory, IconSwords, IconLogout } from "@tabler/icons-react";

export default function GamePage() {
    const { data: session } = useSession();
    const router = useRouter();
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
    const [moveHistory, setMoveHistory] = useState<string[]>([]);
    const [whiteTime, setWhiteTime] = useState(10 * 60 * 1000); // ms
    const [blackTime, setBlackTime] = useState(10 * 60 * 1000);
    const [activeColor, setActiveColor] = useState<'white' | 'black'>('white');
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const mobileLocalVideoRef = useRef<HTMLVideoElement>(null);
    const mobileRemoteVideoRef = useRef<HTMLVideoElement>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

    // Sync video streams to both desktop and mobile video elements
    const syncVideoStreams = () => {
        if (localStreamRef.current) {
            if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
            if (mobileLocalVideoRef.current) mobileLocalVideoRef.current.srcObject = localStreamRef.current;
        }
    };

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
                const stream = event.streams[0];
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = stream;
                }
                if (mobileRemoteVideoRef.current) {
                    mobileRemoteVideoRef.current.srcObject = stream;
                }
            };

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                localStreamRef.current = stream;
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
                if (mobileLocalVideoRef.current) {
                    mobileLocalVideoRef.current.srcObject = stream;
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
                    setMoveHistory([]);
                    setWhiteTime(10 * 60 * 1000);
                    setBlackTime(10 * 60 * 1000);
                    setActiveColor('white');
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
                    setMoveHistory(chess.history());
                    // After opponent moves, it's now our turn — active color flips
                    setActiveColor(chess.turn() === 'w' ? 'white' : 'black');
                    console.log("Move made");
                    break;
                }
                case TIME_UPDATE: {
                    setWhiteTime(message.payload.whiteTime);
                    setBlackTime(message.payload.blackTime);
                    break;
                }
                case GAME_OVER: {
                    setStatus(`Game Over! ${message.payload.winner} won${message.payload.reason ? ` (${message.payload.reason})` : ''}.`);
                    setIsPlaying(false);
                    alert(`${message.payload.winner} wins${message.payload.reason ? ` by ${message.payload.reason}` : ''}!`);
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

    // Local countdown interval for smooth timer display
    useEffect(() => {
        if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
        }
        if (!isPlaying) return;

        countdownRef.current = setInterval(() => {
            if (activeColor === 'white') {
                setWhiteTime(prev => Math.max(0, prev - 100));
            } else {
                setBlackTime(prev => Math.max(0, prev - 100));
            }
        }, 100);

        return () => {
            if (countdownRef.current) {
                clearInterval(countdownRef.current);
                countdownRef.current = null;
            }
        };
    }, [isPlaying, activeColor]);

    // Format ms to mm:ss
    function formatTime(ms: number): string {
        const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

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

    // Determine which timer belongs to whom based on player's color
    const opponentTime = playerColor === 'white' ? blackTime : whiteTime;
    const yourTime = playerColor === 'white' ? whiteTime : blackTime;
    const isOpponentActive = (playerColor === 'white' && activeColor === 'black') || (playerColor === 'black' && activeColor === 'white');
    const isYourActive = !isOpponentActive;

    // Pair moves into rows: [["e4","e5"], ["Nf3","Nc6"], ...]
    const movePairs: [string, string | undefined][] = [];
    for (let i = 0; i < moveHistory.length; i += 2) {
        movePairs.push([moveHistory[i], moveHistory[i + 1]]);
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

            {/* Main Layout Container */}
            <div className="flex flex-col h-[100dvh]">

                {/* ===== Navbar ===== */}
                <nav className="flex items-center justify-between px-4 sm:px-6 py-2 sm:py-3 dark:bg-neutral-900/80 bg-white/80 backdrop-blur-md border-b dark:border-white/10 border-black/10 z-30 shrink-0">
                    <span className="font-bold text-base sm:text-lg tracking-tight dark:text-white text-neutral-900">Chess</span>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            {session?.user?.image ? (
                                <img src={session.user.image} alt="avatar" className="w-7 h-7 rounded-full border dark:border-white/20 border-black/10 object-cover" />
                            ) : (
                                <div className="w-7 h-7 rounded-full bg-green-500/20 flex items-center justify-center border dark:border-white/10 border-black/10">
                                    <IconUser className="w-4 h-4 text-green-400" />
                                </div>
                            )}
                            <span className="text-sm font-medium dark:text-neutral-300 text-neutral-700 hidden sm:block">
                                {session?.user?.name ?? 'Guest'}
                            </span>
                        </div>
                        <button
                            onClick={() => { signOut({ redirect: false }); router.push('/'); }}
                            className="p-1.5 rounded-lg dark:hover:bg-white/10 hover:bg-black/5 transition-colors"
                            title="Exit"
                        >
                            <IconLogout className="w-5 h-5 dark:text-neutral-400 text-neutral-500" />
                        </button>
                    </div>
                </nav>

                {/* ===== Unified Card ===== */}
                <div className="flex-1 dark:bg-neutral-900/60 bg-white/60 backdrop-blur-sm overflow-hidden flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_minmax(0,1fr)] relative">

                    {/* ─── Left Panel: Video & Game History (Desktop only) ─── */}
                    <div className="hidden lg:flex flex-col gap-3 p-4 dark:bg-neutral-900/80 bg-neutral-100/80 border-r dark:border-white/5 border-black/5">
                        {/* Opponent video */}
                        <div className="w-full aspect-video rounded-lg dark:bg-neutral-800 bg-neutral-200 relative overflow-hidden">
                            {!isPlaying && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 z-0">
                                    <IconUser className="w-8 h-8 dark:text-neutral-600 text-neutral-400" />
                                    <span className="text-[10px] font-medium dark:text-neutral-500 text-neutral-400">Opponent</span>
                                </div>
                            )}
                            <video ref={remoteVideoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover z-10" />
                            {isPlaying && (
                                <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-md dark:bg-black/60 bg-white/70 text-[9px] font-semibold dark:text-red-400 text-red-500 z-20">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                    LIVE
                                </div>
                            )}
                        </div>
                        {/* Your video */}
                        <div className="w-full aspect-video rounded-lg dark:bg-neutral-800 bg-neutral-200 relative overflow-hidden">
                            {!isPlaying && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 z-0">
                                    <IconVideo className="w-8 h-8 dark:text-neutral-600 text-neutral-400" />
                                    <span className="text-[10px] font-medium dark:text-neutral-500 text-neutral-400">You</span>
                                </div>
                            )}
                            <video ref={localVideoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover z-10 scale-x-[-1]" />
                        </div>
                        {/* Game History */}
                        <div className="flex-1 rounded-lg dark:bg-neutral-800/60 bg-neutral-200/60 flex flex-col overflow-hidden min-h-0">
                            <div className="flex p-2.5 border-b dark:border-white/5 border-black/5 items-center justify-between">
                                <div className="flex items-center gap-1">
                                    <IconHistory className="w-3 h-3 dark:text-neutral-500 text-neutral-400" />
                                    <span className="text-[9px] font-semibold uppercase tracking-wider dark:text-neutral-500 text-neutral-400">Moves</span>
                                </div>
                                <span className="text-[9px] dark:text-neutral-600 text-neutral-400">{moveHistory.length}</span>
                            </div>
                            <div className="flex-1 p-2 overflow-y-auto min-h-0">
                                {movePairs.length === 0 ? (
                                    <div className="px-2 py-1 dark:bg-white/5 bg-black/5 rounded-md dark:text-neutral-500 text-neutral-400 italic text-[10px]">
                                        Waiting for moves...
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-0.5">
                                        {movePairs.map(([white, black], idx) => (
                                            <div
                                                key={idx}
                                                className={`flex items-center gap-1.5 px-1.5 py-1 rounded text-[10px] ${
                                                    idx === movePairs.length - 1 ? 'bg-green-500/10 border border-green-500/20' : idx % 2 === 0 ? 'dark:bg-white/5 bg-black/5' : ''
                                                }`}
                                            >
                                                <span className="w-4 dark:text-neutral-600 text-neutral-400 font-mono text-[9px]">{idx + 1}.</span>
                                                <span className="flex-1 dark:text-white/90 text-neutral-800 font-medium font-mono">{white}</span>
                                                <span className="flex-1 dark:text-white/70 text-neutral-600 font-mono">{black ?? '...'}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ─── Center Panel: Board ─── */}
                    <div className="flex-1 flex flex-col items-center justify-center px-2 py-1 sm:px-4 sm:py-3 lg:p-6 gap-1 sm:gap-2 lg:gap-4 min-h-0 relative overflow-hidden">
                        {/* Glow effects (desktop only) */}
                        <div className="hidden lg:block absolute top-1/4 left-1/4 -translate-x-1/2 w-[300px] h-[300px] bg-green-500 rounded-full blur-[200px] opacity-20 pointer-events-none"></div>
                        <div className="hidden lg:block absolute bottom-1/4 right-1/4 translate-x-1/4 w-[300px] h-[300px] bg-green-400 rounded-full blur-[200px] opacity-10 pointer-events-none"></div>

                        <div className="game-board-inner flex flex-col gap-1 sm:gap-2 lg:gap-4 w-full mx-auto z-10">
                            {/* Mobile: Cameras side by side on top */}
                            <div className="lg:hidden flex gap-2 sm:gap-3 w-full">
                                <div className="flex-1 aspect-video rounded-lg sm:rounded-xl bg-neutral-800/80 border border-white/10 relative overflow-hidden flex items-center justify-center shadow-md">
                                    <div className="absolute top-1 left-1.5 sm:top-1.5 sm:left-2 z-20 bg-black/50 backdrop-blur-sm rounded px-1 py-0.5 sm:px-1.5 sm:py-1">
                                        <span className="text-[8px] sm:text-[10px] text-neutral-300 font-medium">Opponent</span>
                                    </div>
                                    {!isPlaying && (
                                        <IconVideo className="w-5 h-5 text-neutral-500 opacity-40 z-10" />
                                    )}
                                    <video ref={mobileRemoteVideoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 aspect-video rounded-lg sm:rounded-xl bg-neutral-800/80 border border-green-500/20 relative overflow-hidden flex items-center justify-center shadow-md">
                                    <div className="absolute top-1 left-1.5 sm:top-1.5 sm:left-2 z-20 bg-black/50 backdrop-blur-sm rounded px-1 py-0.5 sm:px-1.5 sm:py-1">
                                        <span className="text-[8px] sm:text-[10px] text-green-400 font-medium">You</span>
                                    </div>
                                    {!isPlaying && (
                                        <IconVideo className="w-5 h-5 text-green-400 opacity-40 z-10" />
                                    )}
                                    <video ref={mobileLocalVideoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" />
                                </div>
                            </div>

                            {/* Opponent Info */}
                            <div className="w-full flex items-center justify-between">
                                <div className="flex items-center gap-2 lg:gap-3">
                                    <div className="w-7 h-7 sm:w-9 sm:h-9 lg:w-10 lg:h-10 dark:bg-neutral-800 bg-neutral-200 rounded-lg flex items-center justify-center border dark:border-white/10 border-black/10 shadow-md">
                                        <IconUser className="w-4 h-4 sm:w-5 sm:h-5 lg:w-5 lg:h-5 dark:text-neutral-400 text-neutral-500" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold dark:text-white/90 text-neutral-800 text-xs sm:text-sm lg:text-sm">Opponent</span>
                                        <span className="text-[10px] sm:text-xs dark:text-neutral-500 text-neutral-400">Rating: 1200</span>
                                    </div>
                                </div>
                                <div className={`dark:bg-neutral-800 bg-neutral-200 w-16 h-6 sm:w-24 sm:h-8 lg:w-28 lg:h-9 rounded-md shadow-inner border flex items-center justify-center transition-colors ${isOpponentActive && isPlaying ? 'border-red-500/30 bg-red-500/10' : 'dark:border-white/5 border-black/10'}`}>
                                    <span className={`font-mono text-xs sm:text-sm lg:text-base font-semibold ${opponentTime <= 30000 && isPlaying ? 'text-red-400' : 'dark:text-white/90 text-neutral-800'}`}>{formatTime(opponentTime)}</span>
                                </div>
                            </div>

                            {/* The Board */}
                            <div className="w-full flex items-center justify-center">
                                <ChessBoard chess={chess} setBoard={setBoard} socket={socket} board={board} playerColor={playerColor} onMove={() => { setMoveHistory(chess.history()); setActiveColor(chess.turn() === 'w' ? 'white' : 'black'); }} />
                            </div>

                            {/* Your Info */}
                            <div className="w-full flex items-center justify-between">
                                <div className="flex items-center gap-2 lg:gap-3">
                                    <div className="w-7 h-7 sm:w-9 sm:h-9 lg:w-10 lg:h-10 bg-green-500/20 rounded-lg flex items-center justify-center border border-green-500/30 shadow-md">
                                        <IconUser className="w-4 h-4 sm:w-5 sm:h-5 lg:w-5 lg:h-5 text-green-400" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-green-400 text-xs sm:text-sm lg:text-sm">You</span>
                                        <span className="text-[10px] sm:text-xs dark:text-neutral-500 text-neutral-400">Rating: 1200</span>
                                    </div>
                                </div>
                                <div className={`dark:bg-neutral-800 bg-neutral-200 w-16 h-6 sm:w-24 sm:h-8 lg:w-28 lg:h-9 rounded-md shadow-inner border flex items-center justify-center transition-colors ${isYourActive && isPlaying ? 'border-green-500/30 bg-green-500/10' : 'dark:border-white/5 border-black/10'}`}>
                                    <span className={`font-mono text-xs sm:text-sm lg:text-base font-semibold ${yourTime <= 30000 && isPlaying ? 'text-red-400' : 'text-green-400'}`}>{formatTime(yourTime)}</span>
                                </div>
                            </div>

                            {/* Play Button (desktop) */}
                            <div className="hidden lg:block">
                                <Button
                                    onClick={handlePlay}
                                    disabled={isSearching || isPlaying}
                                    className="w-full bg-green-500 hover:bg-green-400 text-neutral-900 font-bold py-3 rounded-xl transition-all shadow-xl hover:shadow-green-500/20 text-base tracking-wide uppercase"
                                >
                                    {isSearching ? "Searching..." : isPlaying ? "In Progress" : "Find Match"}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* ─── Right Panel: Chat (Desktop only) ─── */}
                    <div className="hidden lg:flex flex-col gap-3 p-4 dark:bg-neutral-900/80 bg-neutral-100/80 border-l dark:border-white/5 border-black/5">
                        {/* Chat area */}
                        <div className="flex-1 rounded-lg dark:bg-neutral-800/60 bg-neutral-200/60 p-2.5 flex flex-col overflow-hidden min-h-0">
                            <div className="flex items-center gap-1 mb-1.5">
                                <IconMessageCircle className="w-3 h-3 dark:text-neutral-500 text-neutral-400" />
                                <span className="text-[9px] font-semibold uppercase tracking-wider dark:text-neutral-500 text-neutral-400">Chat</span>
                            </div>
                            <div className="flex-1 flex flex-col gap-1.5 text-[11px] overflow-y-auto min-h-0">
                                {!isPlaying && chatMessages.length === 0 ? (
                                    <div className="flex-1 flex items-center justify-center">
                                        <p className="dark:text-neutral-500 text-neutral-400 text-[10px]">Waiting for match...</p>
                                    </div>
                                ) : (
                                    chatMessages.map((msg, idx) => (
                                        <div key={idx} className={`max-w-[90%] px-2 py-1.5 rounded-lg text-[11px] ${msg.sender === 'you' ? 'bg-green-600 self-end rounded-tr-sm text-white' : 'dark:bg-neutral-700 bg-neutral-300 self-start rounded-tl-sm border dark:border-white/10 border-black/10'}`}>
                                            <span className="text-[9px] opacity-50 block mb-0.5">{msg.sender === 'you' ? 'You' : 'Opponent'}</span>
                                            <span className="dark:text-white/90 text-neutral-800">{msg.text}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                        {/* Chat input */}
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Type a message..."
                                className="flex-1 dark:bg-neutral-800 bg-neutral-200 border dark:border-white/10 border-black/10 rounded-lg px-3 py-2 text-[11px] dark:text-white text-neutral-800 focus:outline-none focus:border-green-500/50 transition-colors dark:placeholder:text-neutral-600 placeholder:text-neutral-400 disabled:opacity-50"
                                disabled={!isPlaying}
                            />
                            <button
                                onClick={handleSendMessage}
                                className="p-2 bg-green-500 text-black rounded-lg transition-colors disabled:opacity-50 hover:bg-green-400 focus:outline-none"
                                disabled={!isPlaying || !chatInput.trim()}
                            >
                                <IconSend className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                </div>

                {/* Mobile Bottom Toolbar */}
                <div className="lg:hidden bg-neutral-900/90 backdrop-blur-md border-t border-white/10 flex items-center justify-around px-2 sm:px-4 h-12 sm:h-14">
                    <button
                        onClick={() => setMobileChatOpen(true)}
                        className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg hover:bg-white/10 transition-colors relative"
                    >
                        <IconMessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-400" />
                        <span className="text-[9px] sm:text-xs text-neutral-500">Chat</span>
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
                        <IconHistory className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-400" />
                        <span className="text-[9px] sm:text-xs text-neutral-500">History</span>
                    </button>
                    <button
                        onClick={handlePlay}
                        disabled={isSearching || isPlaying}
                        className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-40"
                    >
                        <IconSwords className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
                        <span className="text-[9px] sm:text-xs text-green-400 font-medium">{isSearching ? 'Searching' : isPlaying ? 'Playing' : 'Find Match'}</span>
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
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-neutral-500">{moveHistory.length} moves</span>
                            <button onClick={() => setMobileHistoryOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                                <IconX className="w-5 h-5 text-neutral-400" />
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 p-3 overflow-y-auto min-h-0">
                        {movePairs.length === 0 ? (
                            <div className="flex flex-col gap-2 text-sm text-neutral-400">
                                <div className="px-2 py-1 bg-white/5 rounded-md text-neutral-500 italic text-xs">
                                    <span>Waiting for moves...</span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-1">
                                {movePairs.map(([white, black], idx) => (
                                    <div
                                        key={idx}
                                        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm ${
                                            idx === movePairs.length - 1 ? 'bg-green-500/10 border border-green-500/20' : idx % 2 === 0 ? 'bg-white/5' : ''
                                        }`}
                                    >
                                        <span className="w-6 text-neutral-600 font-mono text-xs">{idx + 1}.</span>
                                        <span className="flex-1 text-white/90 font-medium font-mono">{white}</span>
                                        <span className="flex-1 text-white/70 font-mono">{black ?? '...'}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}