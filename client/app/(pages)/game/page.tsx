'use client'
import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSocketContext } from "@/app/contexts/SocketContext";
import Button from "./_components/Button";
import ChessBoard from "./_components/ChessBoard";
import { Chess } from 'chess.js'
import { GAME_OVER, INIT_GAME, MOVE, CHAT, TIME_UPDATE, WEBRTC_ICE, WEBRTC_OFFER, WEBRTC_ANSWER, PLAYER_QUIT, PLAY_AGAIN_REQUEST, PLAY_AGAIN_RESPONSE, PLAY_AGAIN_CANCELLED } from "../../messages/messages";
import { IconVideo, IconSend, IconUser, IconMessageCircle, IconX, IconHistory, IconSwords, IconArrowLeft, IconAlertTriangle, IconDotsVertical, IconChess } from "@tabler/icons-react";
import Image from "next/image";

type UserProfile = {
    id: string;
    username: string;
    email: string;
    rating: number;
    profilePicture: string | null;
    totalGames: number;
    wins: number;
};

type OpponentInfo = {
    id: string;
    name: string;
    rating: number;
};

export default function GamePage() {
    const { data: session } = useSession();
    const router = useRouter();
    const { socket, isSearching, matchData, findMatch, cancelSearch, clearMatch, disconnectSocket } = useSocketContext();
    const [chess, setChess] = useState(new Chess());
    const [board, setBoard] = useState(chess.board());
    const [status, setStatus] = useState("");
    const [showStatus, setShowStatus] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [chatMessages, setChatMessages] = useState<{ sender: string, text: string }[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [playerColor, setPlayerColor] = useState<string | null>(null);
    const [mobileChatOpen, setMobileChatOpen] = useState(false);
    const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
    const mobileChatOpenRef = useRef(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const mobileMenuRef = useRef<HTMLDivElement>(null);
    const [moveHistory, setMoveHistory] = useState<string[]>([]);
    const [whiteTime, setWhiteTime] = useState(10 * 60 * 1000); // ms
    const [blackTime, setBlackTime] = useState(10 * 60 * 1000);
    const [activeColor, setActiveColor] = useState<'white' | 'black'>('white');
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // DB-related state
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [opponentInfo, setOpponentInfo] = useState<OpponentInfo | null>(null);
    const [currentGameId, setCurrentGameId] = useState<string | null>(null);
    const [ratingChanges, setRatingChanges] = useState<{ white: { old: number; new: number }; black: { old: number; new: number } } | null>(null);
    const [gameOverDetails, setGameOverDetails] = useState<{ winner: string; reason: string } | null>(null);
    const [showQuitConfirm, setShowQuitConfirm] = useState(false);
    const [opponentLeft, setOpponentLeft] = useState(false);
    const [rematchStatus, setRematchStatus] = useState<'idle' | 'requested' | 'declined'>('idle');
    const [rematchCountdown, setRematchCountdown] = useState(15);
    const [showRematchPopup, setShowRematchPopup] = useState(false);
    const [rematchPopupCountdown, setRematchPopupCountdown] = useState(15);

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const mobileLocalVideoRef = useRef<HTMLVideoElement>(null);
    const mobileRemoteVideoRef = useRef<HTMLVideoElement>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const iceCandidateQueueRef = useRef<RTCIceCandidate[]>([]);
    const negotiationChainRef = useRef<Promise<void>>(Promise.resolve());
    // Ref mirror of isPlaying so cleanup effects can read the real current value
    const isPlayingRef = useRef(false);
    // Track which game IDs we've already created in DB to avoid duplicates
    const createdGameIdsRef = useRef<Set<string>>(new Set());
    const rematchTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const rematchPopupTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // --- Sound Effects ---
    const soundCache = useRef<Map<string, HTMLAudioElement>>(new Map());
    const playSound = useCallback((name: string) => {
        try {
            let audio = soundCache.current.get(name);
            if (!audio) {
                audio = new Audio(`/chessSFX/${name}.mp3`);
                soundCache.current.set(name, audio);
            }
            audio.currentTime = 0;
            audio.play().catch(() => { });
        } catch { }
    }, []);

    useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

    // Clean up rematch timers on unmount
    useEffect(() => {
        return () => {
            if (rematchTimerRef.current) clearInterval(rematchTimerRef.current);
            if (rematchPopupTimerRef.current) clearInterval(rematchPopupTimerRef.current);
        };
    }, []);

    useEffect(() => {
        mobileChatOpenRef.current = mobileChatOpen;
        if (mobileChatOpen) {
            setHasUnreadMessages(false);
        }
    }, [mobileChatOpen]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
                setMobileMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Fetch user profile on mount
    useEffect(() => {
        async function fetchProfile() {
            try {
                const res = await fetch("/api/user/me");
                if (res.ok) {
                    const data = await res.json();
                    setUserProfile(data.user);
                }
            } catch (err) {
                console.error("Failed to fetch user profile:", err);
            }
        }
        if (session?.user) {
            fetchProfile();
        }
    }, [session]);

    // Save game to DB when match starts
    const createGameInDB = useCallback(async (gameId: string, whiteId: string, blackId: string) => {
        try {
            await fetch("/api/game/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    gameId,
                    whitePlayerId: whiteId,
                    blackPlayerId: blackId,
                    timeControl: 600000,
                }),
            });
        } catch (err) {
            console.error("Failed to create game in DB:", err);
        }
    }, []);

    // Save move to DB
    const saveMoveInDB = useCallback(async (moveData: {
        gameId: string;
        from: string;
        to: string;
        piece: string;
        moveNumber: number;
        notation: string;
        timeTakenMs: number;
    }) => {
        try {
            await fetch("/api/game/move", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(moveData),
            });
        } catch (err) {
            console.error("Failed to save move in DB:", err);
        }
    }, []);

    // End game in DB
    const endGameInDB = useCallback(async (gameId: string, winner: string, reason: string, pgn: string) => {
        try {
            const res = await fetch("/api/game/end", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    gameId,
                    winner,
                    reason,
                    pgn,
                    whiteTimeLeft: whiteTime,
                    blackTimeLeft: blackTime,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                // Show rating change for both players
                setRatingChanges(data.ratings);
            }
        } catch (err) {
            console.error("Failed to end game in DB:", err);
        }
    }, [whiteTime, blackTime, playerColor]);

    // Sync video streams to both desktop and mobile video elements
    const syncVideoStreams = useCallback(() => {
        if (localStreamRef.current) {
            if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
            if (mobileLocalVideoRef.current) mobileLocalVideoRef.current.srcObject = localStreamRef.current;
        }
    }, []);

    // Stop media tracks and close WebRTC — does NOT touch socket
    const cleanupWebRTCAndMedia = useCallback(() => {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((t) => t.stop());
            localStreamRef.current = null;
        }
        if (localVideoRef.current) localVideoRef.current.srcObject = null;
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        if (mobileLocalVideoRef.current) mobileLocalVideoRef.current.srcObject = null;
        if (mobileRemoteVideoRef.current) mobileRemoteVideoRef.current.srcObject = null;
        negotiationChainRef.current = Promise.resolve();
        iceCandidateQueueRef.current = [];
    }, []);

    // Notify server, close WebRTC + socket — no redirect
    const cleanupConnections = useCallback(() => {
        // Only send PLAYER_QUIT and close socket if a game was actually in progress.
        // This prevents React Strict Mode's double-mount from killing the socket on startup.
        if (isPlayingRef.current) {
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: PLAYER_QUIT }));
            }
            cleanupWebRTCAndMedia();
            disconnectSocket();
        } else {
            // Game not started — only clean up media/WebRTC, leave socket intact
            cleanupWebRTCAndMedia();
        }
    }, [socket, cleanupWebRTCAndMedia, disconnectSocket]);

    // Notify server, close WebRTC + socket, redirect to lobby (explicit user action only)
    const cleanupAndQuit = useCallback(() => {
        cleanupConnections();
        router.push('/lobby');
    }, [cleanupConnections, router]);

    // Keep a stable ref so effects/event-listeners always use the latest version
    const cleanupConnectionsRef = useRef(cleanupConnections);
    useEffect(() => { cleanupConnectionsRef.current = cleanupConnections; }, [cleanupConnections]);

    // Clean up connections when the component unmounts (browser back, route change)
    // Do NOT redirect here — navigation is already happening
    useEffect(() => {
        return () => { cleanupConnectionsRef.current(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Clean up on browser tab / window close
    useEffect(() => {
        const handler = () => cleanupConnectionsRef.current();
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, []);

    // Initialize WebRTC for video chat
    const initializeWebRTC = useCallback(async (color: string, ws: WebSocket) => {
        // Close any existing peer connection cleanly
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        iceCandidateQueueRef.current = [];
        // Reset the negotiation chain so stale operations from a previous game don't interfere
        negotiationChainRef.current = Promise.resolve();

        // Build ICE servers list
        const iceServers: RTCIceServer[] = [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
        ];

        // Fetch TURN servers from Metered API if configured
        const turnApiUrl = process.env.NEXT_PUBLIC_TURN_URL;
        if (turnApiUrl) {
            try {
                const res = await fetch(turnApiUrl);
                const servers: RTCIceServer[] = await res.json();
                iceServers.push(...servers);
                console.log("TURN servers fetched:", servers.length);
            } catch (err) {
                console.error("Failed to fetch TURN credentials:", err);
            }
        }

        const pc = new RTCPeerConnection({ iceServers });
        peerConnectionRef.current = pc;

        pc.onicecandidate = (event) => {
            if (event.candidate && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: WEBRTC_ICE, payload: event.candidate }));
            }
        };

        pc.oniceconnectionstatechange = () => {
            console.log("ICE connection state:", pc.iceConnectionState);
        };

        pc.ontrack = (event) => {
            const stream = event.streams[0];
            console.log("Remote track received:", event.track.kind);
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = stream;
            }
            if (mobileRemoteVideoRef.current) {
                mobileRemoteVideoRef.current.srcObject = stream;
            }
        };

        // Get local media — try video+audio, fall back to video-only, then proceed without media
        let stream: MediaStream | null = null;
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        } catch {
            console.warn("Camera+mic failed, trying video only...");
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            } catch (err) {
                console.error("getUserMedia failed completely:", err);
            }
        }

        // Bail out if a newer initializeWebRTC call has already replaced this peer connection
        if (peerConnectionRef.current !== pc) {
            stream?.getTracks().forEach((t) => t.stop());
            return;
        }

        if (stream) {
            localStreamRef.current = stream;
            if (localVideoRef.current) localVideoRef.current.srcObject = stream;
            if (mobileLocalVideoRef.current) mobileLocalVideoRef.current.srcObject = stream;
            stream.getTracks().forEach((track) => pc.addTrack(track, stream!));
        }

        if (color === 'white') {
            const offer = await pc.createOffer();
            // Final stale check before committing
            if (peerConnectionRef.current !== pc) return;
            await pc.setLocalDescription(offer);
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: WEBRTC_OFFER, payload: offer }));
            }
        }
    }, []);

    // Initialize game from matchData (lobby matchmaking or "Play Again")
    useEffect(() => {
        if (!matchData || !socket) return;

        const newChess = new Chess();
        setChess(newChess);
        setBoard(newChess.board());
        setMoveHistory([]);
        setChatMessages([]);
        setWhiteTime(10 * 60 * 1000);
        setBlackTime(10 * 60 * 1000);
        setActiveColor('white');
        setStatus("Match started! Opponent connected.");
        setIsPlaying(true);
        setPlayerColor(matchData.color);
        setGameOverDetails(null);
        setRatingChanges(null);
        setOpponentLeft(false);
        setRematchStatus('idle');
        setCurrentGameId(matchData.gameId);
        setOpponentInfo(matchData.opponent);

        playSound('game-start');

        console.log("Game initialised:", matchData.gameId, "opponent:", matchData.opponent);
        initializeWebRTC(matchData.color, socket);
        clearMatch();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [matchData, socket]);

    // Create game in DB once we have both the game ID and user profile.
    // On first match, userProfile loads asynchronously AFTER matchData sets currentGameId,
    // so the inline createGameInDB calls in the matchData/INIT_GAME handlers would miss it.
    // This effect retries automatically when userProfile becomes available.
    useEffect(() => {
        if (!currentGameId || !userProfile || playerColor !== 'white' || !opponentInfo) return;
        if (createdGameIdsRef.current.has(currentGameId)) return;
        createdGameIdsRef.current.add(currentGameId);
        createGameInDB(currentGameId, userProfile.id, opponentInfo.id);
    }, [currentGameId, userProfile, playerColor, opponentInfo, createGameInDB]);

    // Socket message handler for gameplay messages
    useEffect(() => {
        if (!socket) {
            return;
        }

        const handleMessage = (event: MessageEvent) => {
            const message = JSON.parse(event.data);
            console.log(message);

            switch (message.type) {
                case INIT_GAME: {
                    // Fallback: handle INIT_GAME directly if matchData flow missed it
                    if (!isPlaying) {
                        const newChess = new Chess();
                        setChess(newChess);
                        setBoard(newChess.board());
                        setMoveHistory([]);
                        setChatMessages([]);
                        setWhiteTime(10 * 60 * 1000);
                        setBlackTime(10 * 60 * 1000);
                        setActiveColor('white');
                        setStatus("Match started! Opponent connected.");
                        setIsPlaying(true);
                        setPlayerColor(message.payload.color);
                        setGameOverDetails(null);
                        setRatingChanges(null);
                        setOpponentLeft(false);
                        setRematchStatus('idle');
                        setShowRematchPopup(false);
                        if (rematchTimerRef.current) { clearInterval(rematchTimerRef.current); rematchTimerRef.current = null; }
                        if (rematchPopupTimerRef.current) { clearInterval(rematchPopupTimerRef.current); rematchPopupTimerRef.current = null; }
                        setCurrentGameId(message.payload.gameId);
                        if (message.payload.opponent) {
                            setOpponentInfo(message.payload.opponent);
                        }
                        console.log("Game initialised (fallback):", message.payload.gameId, "opponent:", message.payload.opponent);
                        initializeWebRTC(message.payload.color, socket);
                        playSound('game-start');
                    }
                    break;
                }
                case MOVE: {
                    const move = message.payload;
                    chess.move({ from: move.from, to: move.to, promotion: move.promotion });
                    setBoard(chess.board());
                    setMoveHistory(chess.history());
                    setActiveColor(chess.turn() === 'w' ? 'white' : 'black');

                    // Play appropriate sound for opponent's move
                    if (chess.isCheck()) {
                        playSound('move-check');
                    } else if (move.notation && move.notation.includes('x')) {
                        playSound('capture');
                    } else if (move.notation && (move.notation === 'O-O' || move.notation === 'O-O-O')) {
                        playSound('castle');
                    } else if (move.notation && move.notation.includes('=')) {
                        playSound('promote');
                    } else {
                        playSound('move-opponent');
                    }

                    // Save opponent's move to DB
                    if (move.gameId && move.notation) {
                        const piece = chess.get(move.to as any)?.type || 'p';
                        saveMoveInDB({
                            gameId: move.gameId,
                            from: move.from,
                            to: move.to,
                            piece,
                            moveNumber: move.moveNumber,
                            notation: move.notation,
                            timeTakenMs: move.timeTakenMs || 0,
                        });
                    }

                    console.log("Move made");
                    break;
                }
                case TIME_UPDATE: {
                    setWhiteTime(message.payload.whiteTime);
                    setBlackTime(message.payload.blackTime);
                    break;
                }
                case GAME_OVER: {
                    const { winner, reason, gameId } = message.payload;
                    setGameOverDetails({ winner, reason });
                    setStatus(`Game Over! ${winner} won${reason ? ` (${reason})` : ''}.`);
                    setIsPlaying(false);
                    if (reason === 'abandonment') setOpponentLeft(true);
                    playSound('game-end');

                    // End game in DB
                    if (gameId) {
                        endGameInDB(gameId, winner, reason, chess.pgn());
                    }

                    console.log("Game Over");
                    break;
                }
                case CHAT: {
                    setChatMessages(prev => [...prev, { sender: "opponent", text: message.payload.message }]);
                    if (!mobileChatOpenRef.current) {
                        setHasUnreadMessages(true);
                        playSound('notify');
                    }
                    break;
                }
                case WEBRTC_OFFER: {
                    negotiationChainRef.current = negotiationChainRef.current.then(async () => {
                        const pc = peerConnectionRef.current;
                        if (!pc) return;
                        try {
                            if (pc.signalingState !== 'stable') {
                                await pc.setLocalDescription({ type: 'rollback' });
                            }
                            await pc.setRemoteDescription(new RTCSessionDescription(message.payload));
                            for (const candidate of iceCandidateQueueRef.current) {
                                await pc.addIceCandidate(candidate).catch(console.error);
                            }
                            iceCandidateQueueRef.current = [];
                            const answer = await pc.createAnswer();
                            await pc.setLocalDescription(answer);
                            socket.send(JSON.stringify({ type: WEBRTC_ANSWER, payload: answer }));
                        } catch (err) {
                            console.error('Error handling WEBRTC_OFFER:', err);
                        }
                    });
                    break;
                }
                case WEBRTC_ANSWER: {
                    negotiationChainRef.current = negotiationChainRef.current.then(async () => {
                        const pc = peerConnectionRef.current;
                        if (!pc) return;
                        if (pc.signalingState !== 'have-local-offer') {
                            console.warn('Ignoring WEBRTC_ANSWER in state:', pc.signalingState);
                            return;
                        }
                        try {
                            await pc.setRemoteDescription(new RTCSessionDescription(message.payload));
                            for (const candidate of iceCandidateQueueRef.current) {
                                await pc.addIceCandidate(candidate).catch(console.error);
                            }
                            iceCandidateQueueRef.current = [];
                        } catch (err) {
                            console.error('Error handling WEBRTC_ANSWER:', err);
                        }
                    });
                    break;
                }
                case WEBRTC_ICE: {
                    const pc = peerConnectionRef.current;
                    if (pc && message.payload) {
                        if (pc.remoteDescription) {
                            // Remote description is ready, add immediately
                            pc.addIceCandidate(new RTCIceCandidate(message.payload)).catch(console.error);
                        } else {
                            // Queue until remote description is set
                            iceCandidateQueueRef.current.push(new RTCIceCandidate(message.payload));
                        }
                    }
                    break;
                }
                case PLAY_AGAIN_REQUEST: {
                    // Opponent wants a rematch — show the accept/decline popup with 15s countdown
                    if (rematchPopupTimerRef.current) clearInterval(rematchPopupTimerRef.current);
                    setShowRematchPopup(true);
                    playSound('notify');
                    let cd = 15;
                    setRematchPopupCountdown(cd);
                    rematchPopupTimerRef.current = setInterval(() => {
                        cd--;
                        setRematchPopupCountdown(cd);
                        if (cd <= 0) {
                            clearInterval(rematchPopupTimerRef.current!);
                            rematchPopupTimerRef.current = null;
                            setShowRematchPopup(false);
                            if (socket.readyState === WebSocket.OPEN) {
                                socket.send(JSON.stringify({ type: PLAY_AGAIN_RESPONSE, payload: { accepted: false } }));
                            }
                        }
                    }, 1000);
                    break;
                }
                case PLAY_AGAIN_CANCELLED: {
                    // Our rematch request was declined or opponent left before we could rematch
                    if (rematchTimerRef.current) { clearInterval(rematchTimerRef.current); rematchTimerRef.current = null; }
                    setRematchStatus('declined');
                    setTimeout(() => setRematchStatus('idle'), 3000);
                    break;
                }
            }
        };

        socket.addEventListener('message', handleMessage);
        return () => socket.removeEventListener('message', handleMessage);
    }, [socket, chess, isPlaying, saveMoveInDB, endGameInDB, initializeWebRTC, playSound])

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

    function handlePlay() {
        if (isSearching || isPlaying) return;
        findMatch({
            userId: userProfile?.id || (session?.user as any)?.id || 'anonymous',
            name: userProfile?.username || session?.user?.name || 'Guest',
            rating: userProfile?.rating || 500,
        });
        setStatus("Searching for an opponent...");
    }

    function handleResign(playNext: boolean) {
        if (!socket || !currentGameId) return;

        const winner = playerColor === 'white' ? 'black' : 'white';
        endGameInDB(currentGameId, winner, 'resignation', chess.pgn());

        // Tell the server this player quit so the opponent gets GAME_OVER
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: PLAYER_QUIT }));
        }

        setIsPlaying(false);
        isPlayingRef.current = false;
        setMenuOpen(false);
        setMobileMenuOpen(false);

        // Close WebRTC and media in all cases
        cleanupWebRTCAndMedia();

        if (playNext) {
            // Skip game-over modal entirely — go straight to matchmaking
            setGameOverDetails(null);
            setRatingChanges(null);
            // Call findMatch directly — handlePlay() guard checks isPlaying which
            // is still true (batched state), so bypass it
            findMatch({
                userId: userProfile?.id || (session?.user as any)?.id || 'anonymous',
                name: userProfile?.username || session?.user?.name || 'Guest',
                rating: userProfile?.rating || 500,
            });
            setStatus("Searching for an opponent...");
        } else {
            setGameOverDetails({ winner, reason: 'resignation' });
            setStatus(`You resigned. ${winner} won.`);
            playSound('game-end');
            disconnectSocket();
            router.push('/lobby');
        }
    }

    // Determine which timer belongs to whom based on player's color
    const opponentTime = playerColor === 'white' ? blackTime : whiteTime;
    const yourTime = playerColor === 'white' ? whiteTime : blackTime;
    const isOpponentActive = (playerColor === 'white' && activeColor === 'black') || (playerColor === 'black' && activeColor === 'white');
    const isYourActive = !isOpponentActive;

    // Real player/opponent display info
    const yourName = userProfile?.username || session?.user?.name || 'You';
    const yourRating = userProfile?.rating ?? 500;
    const opponentName = opponentInfo?.name || 'Opponent';
    const opponentRating = opponentInfo?.rating ?? '—';

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

            {/* Game Over Overlay */}
            {gameOverDetails && !isPlaying && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="dark:bg-neutral-900 bg-white rounded-2xl border dark:border-white/10 border-black/10 p-6 sm:p-8 max-w-sm w-full mx-4 shadow-2xl text-center">
                        <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
                            <IconSwords className="w-8 h-8 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold dark:text-white text-neutral-900 mb-1">Game Over</h2>
                        <p className="text-sm dark:text-neutral-400 text-neutral-600 mb-4">
                            {gameOverDetails.winner === playerColor
                                ? "You won!"
                                : `${gameOverDetails.winner} wins`}
                            {gameOverDetails.reason && ` by ${gameOverDetails.reason}`}
                        </p>

                        {ratingChanges && (
                            <div className="flex flex-col gap-2 mb-5">
                                <p className="text-[11px] sm:text-xs dark:text-neutral-500 text-neutral-400 uppercase tracking-wider mb-1">Rating Changes</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {/* Your Rating */}
                                    <div className="dark:bg-neutral-800/60 bg-neutral-100 rounded-xl p-2.5 sm:p-3 border dark:border-white/5 border-black/5 flex flex-col items-center">
                                        <div className="flex items-center gap-1.5 mb-2 text-[10px] sm:text-xs">
                                            {session?.user?.image ? (
                                                <img src={session.user.image} alt="" className="w-4 h-4 rounded-full object-cover border border-green-500/30" />
                                            ) : (
                                                <IconUser className="w-3.5 h-3.5 text-green-400" />
                                            )}
                                            <span className="dark:text-white/80 text-neutral-700 truncate max-w-[80px]">{yourName}</span>
                                        </div>
                                        <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5">
                                            <div className="flex items-center gap-1">
                                                <span className="text-xs sm:text-sm font-mono dark:text-neutral-400 text-neutral-500">{ratingChanges[playerColor as 'white' | 'black']?.old}</span>
                                                <span className="dark:text-neutral-600 text-neutral-300 text-[10px] sm:text-xs">→</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className={`text-xs sm:text-sm font-mono font-bold ${ratingChanges[playerColor as 'white' | 'black']?.new > ratingChanges[playerColor as 'white' | 'black']?.old ? 'text-green-400' : ratingChanges[playerColor as 'white' | 'black']?.new < ratingChanges[playerColor as 'white' | 'black']?.old ? 'text-red-400' : 'dark:text-white text-neutral-900'}`}>
                                                    {ratingChanges[playerColor as 'white' | 'black']?.new}
                                                </span>
                                                <span className={`text-[9px] sm:text-[10px] font-semibold ${ratingChanges[playerColor as 'white' | 'black']?.new > ratingChanges[playerColor as 'white' | 'black']?.old ? 'text-green-400' : ratingChanges[playerColor as 'white' | 'black']?.new < ratingChanges[playerColor as 'white' | 'black']?.old ? 'text-red-400' : 'dark:text-neutral-400 text-neutral-500'}`}>
                                                    ({ratingChanges[playerColor as 'white' | 'black']?.new > ratingChanges[playerColor as 'white' | 'black']?.old ? '+' : ''}{ratingChanges[playerColor as 'white' | 'black']?.new - ratingChanges[playerColor as 'white' | 'black']?.old})
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Opponent Rating */}
                                    <div className="dark:bg-neutral-800/60 bg-neutral-100 rounded-xl p-2.5 sm:p-3 border dark:border-white/5 border-black/5 flex flex-col items-center">
                                        <div className="flex items-center gap-1.5 mb-2 text-[10px] sm:text-xs">
                                            <IconUser className="w-3.5 h-3.5 dark:text-neutral-400 text-neutral-500" />
                                            <span className="dark:text-white/80 text-neutral-700 truncate max-w-[80px]">{opponentName}</span>
                                        </div>
                                        <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5">
                                            <div className="flex items-center gap-1">
                                                <span className="text-xs sm:text-sm font-mono dark:text-neutral-400 text-neutral-500">{ratingChanges[playerColor === 'white' ? 'black' : 'white']?.old}</span>
                                                <span className="dark:text-neutral-600 text-neutral-300 text-[10px] sm:text-xs">→</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className={`text-xs sm:text-sm font-mono font-bold ${ratingChanges[playerColor === 'white' ? 'black' : 'white']?.new > ratingChanges[playerColor === 'white' ? 'black' : 'white']?.old ? 'text-green-400' : ratingChanges[playerColor === 'white' ? 'black' : 'white']?.new < ratingChanges[playerColor === 'white' ? 'black' : 'white']?.old ? 'text-red-400' : 'dark:text-white text-neutral-900'}`}>
                                                    {ratingChanges[playerColor === 'white' ? 'black' : 'white']?.new}
                                                </span>
                                                <span className={`text-[9px] sm:text-[10px] font-semibold ${ratingChanges[playerColor === 'white' ? 'black' : 'white']?.new > ratingChanges[playerColor === 'white' ? 'black' : 'white']?.old ? 'text-green-400' : ratingChanges[playerColor === 'white' ? 'black' : 'white']?.new < ratingChanges[playerColor === 'white' ? 'black' : 'white']?.old ? 'text-red-400' : 'dark:text-neutral-400 text-neutral-500'}`}>
                                                    ({ratingChanges[playerColor === 'white' ? 'black' : 'white']?.new > ratingChanges[playerColor === 'white' ? 'black' : 'white']?.old ? '+' : ''}{ratingChanges[playerColor === 'white' ? 'black' : 'white']?.new - ratingChanges[playerColor === 'white' ? 'black' : 'white']?.old})
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col gap-2">
                            <div className="flex gap-2 w-full">
                                <button
                                    disabled={opponentLeft || rematchStatus === 'requested'}
                                    onClick={() => {
                                        if (opponentLeft || rematchStatus === 'requested') return;
                                        if (!socket || socket.readyState !== WebSocket.OPEN) return;
                                        socket.send(JSON.stringify({ type: PLAY_AGAIN_REQUEST }));
                                        setRematchStatus('requested');
                                        let cd = 15;
                                        setRematchCountdown(cd);
                                        if (rematchTimerRef.current) clearInterval(rematchTimerRef.current);
                                        rematchTimerRef.current = setInterval(() => {
                                            cd--;
                                            setRematchCountdown(cd);
                                            if (cd <= 0) {
                                                clearInterval(rematchTimerRef.current!);
                                                rematchTimerRef.current = null;
                                                setRematchStatus('idle');
                                            }
                                        }, 1000);
                                    }}
                                    className={`flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-3 rounded-xl border transition-colors font-semibold text-xs sm:text-sm ${opponentLeft
                                        ? 'border-neutral-500/30 text-neutral-500 cursor-not-allowed opacity-60'
                                        : rematchStatus === 'declined'
                                            ? 'border-red-500/30 text-red-400 cursor-not-allowed'
                                            : rematchStatus === 'requested'
                                                ? 'border-yellow-500/30 text-yellow-400 cursor-not-allowed'
                                                : 'dark:border-green-500/30 border-green-400/30 text-green-500 hover:bg-green-500/10'
                                        }`}
                                >
                                    <IconHistory className="w-4 h-4" />
                                    {opponentLeft
                                        ? 'User Left'
                                        : rematchStatus === 'requested'
                                            ? `Waiting... (${rematchCountdown}s)`
                                            : rematchStatus === 'declined'
                                                ? 'Declined'
                                                : 'Play Again'}
                                </button>
                                <button
                                    onClick={() => {
                                        setGameOverDetails(null);
                                        setRatingChanges(null);
                                        handlePlay();
                                    }}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 sm:px-4 py-3 rounded-xl bg-green-500 hover:bg-green-400 text-neutral-900 font-semibold text-xs sm:text-sm transition-colors"
                                >
                                    <IconSwords className="w-4 h-4" />
                                    Play Next
                                </button>
                            </div>
                            <button
                                onClick={() => router.push('/lobby')}
                                className="w-full px-4 py-3 rounded-xl border dark:border-white/10 border-black/10 dark:text-white text-neutral-900 font-semibold text-sm dark:hover:bg-white/5 hover:bg-black/5 transition-colors"
                            >
                                Back to Lobby
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Incoming Rematch Request Popup */}
            {showRematchPopup && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-md">
                    <div className="dark:bg-neutral-900 bg-white rounded-2xl border dark:border-white/10 border-black/10 p-6 sm:p-8 max-w-sm w-full mx-4 shadow-2xl text-center">
                        <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
                            <IconSwords className="w-8 h-8 text-green-500" />
                        </div>
                        <h2 className="text-xl font-bold dark:text-white text-neutral-900 mb-1">Rematch Request</h2>
                        <p className="text-sm dark:text-neutral-400 text-neutral-600 mb-3">
                            <span className="font-semibold dark:text-white text-neutral-800">{opponentName}</span> wants a rematch!
                        </p>
                        <p className="text-3xl font-mono font-bold text-green-400 mb-5">{rematchPopupCountdown}s</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    if (rematchPopupTimerRef.current) { clearInterval(rematchPopupTimerRef.current); rematchPopupTimerRef.current = null; }
                                    setShowRematchPopup(false);
                                    setGameOverDetails(null);
                                    setRatingChanges(null);
                                    if (socket && socket.readyState === WebSocket.OPEN) {
                                        socket.send(JSON.stringify({ type: PLAY_AGAIN_RESPONSE, payload: { accepted: true } }));
                                    }
                                }}
                                className="flex-1 px-4 py-3 rounded-xl bg-green-500 hover:bg-green-400 text-neutral-900 font-semibold text-sm transition-colors"
                            >
                                Accept
                            </button>
                            <button
                                onClick={() => {
                                    if (rematchPopupTimerRef.current) { clearInterval(rematchPopupTimerRef.current); rematchPopupTimerRef.current = null; }
                                    setShowRematchPopup(false);
                                    if (socket && socket.readyState === WebSocket.OPEN) {
                                        socket.send(JSON.stringify({ type: PLAY_AGAIN_RESPONSE, payload: { accepted: false } }));
                                    }
                                }}
                                className="flex-1 px-4 py-3 rounded-xl border dark:border-red-500/30 border-red-400/30 dark:text-red-400 text-red-500 font-semibold text-sm dark:hover:bg-red-500/10 hover:bg-red-50 transition-colors"
                            >
                                Decline
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Matchmaking Overlay — shown while searching for next opponent */}
            {isSearching && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
                    <div className="flex flex-col items-center gap-6 text-center">
                        {/* Spinner */}
                        <div className="relative w-20 h-20">
                            <div className="absolute inset-0 rounded-full border-4 border-green-500/20" />
                            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-green-500 animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Image
                                    src="/chessMedia/checkmateLogo.png"
                                    alt="Checkmate Logo"
                                    width={120}
                                    height={120}
                                    className="w-16 h-16 object-contain"
                                />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">Finding a Match...</h2>
                            <p className="text-sm text-neutral-400">Looking for a worthy opponent</p>
                        </div>
                        {/* Animated dots */}
                        <div className="flex gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-bounce [animation-delay:0ms]" />
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-bounce [animation-delay:150ms]" />
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-bounce [animation-delay:300ms]" />
                        </div>
                        <button
                            onClick={cancelSearch}
                            className="px-6 py-2.5 rounded-xl border border-white/10 text-neutral-400 hover:text-white hover:bg-white/5 transition-colors text-sm font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Quit Match Confirmation */}
            {showQuitConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="dark:bg-neutral-900 bg-white rounded-2xl border dark:border-white/10 border-black/10 p-6 sm:p-8 max-w-sm w-full mx-4 shadow-2xl text-center">
                        <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                            <IconAlertTriangle className="w-7 h-7 text-red-500" />
                        </div>
                        <h2 className="text-xl font-bold dark:text-white text-neutral-900 mb-1">Quit Match?</h2>
                        <p className="text-sm dark:text-neutral-400 text-neutral-600 mb-5">
                            You have a game in progress. Leaving will count as a loss.
                        </p>
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => setShowQuitConfirm(false)}
                                className="w-full px-4 py-3 rounded-xl bg-green-500 hover:bg-green-400 text-neutral-900 font-semibold text-sm transition-colors"
                            >
                                Continue Playing
                            </button>
                            <button
                                onClick={() => {
                                    setShowQuitConfirm(false);
                                    cleanupAndQuit();
                                }}
                                className="w-full px-4 py-3 rounded-xl border dark:border-red-500/30 border-red-400/30 dark:text-red-400 text-red-500 font-semibold text-sm dark:hover:bg-red-500/10 hover:bg-red-50 transition-colors"
                            >
                                Quit Match
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Desktop Game Options/Resign Modal */}
            {/* Game Options/Resign Modal (Desktop & Mobile) */}
            {(menuOpen || mobileMenuOpen) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="dark:bg-neutral-900 bg-white rounded-2xl border dark:border-white/10 border-black/10 p-6 max-w-sm w-full mx-4 shadow-2xl text-center">
                        <h2 className="text-xl font-bold dark:text-white text-neutral-900 mb-4">Game Options</h2>
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => handleResign(false)}
                                className="w-full px-4 py-3 rounded-xl border dark:border-red-500/30 border-red-400/30 dark:text-red-400 text-red-500 font-semibold text-sm dark:hover:bg-red-500/10 hover:bg-red-50 transition-colors"
                            >
                                Resign & Quit
                            </button>
                            <button
                                onClick={() => handleResign(true)}
                                className="w-full px-4 py-3 rounded-xl bg-green-500 hover:bg-green-400 text-neutral-900 font-semibold text-sm transition-colors"
                            >
                                Resign & Play Next
                            </button>
                            <button
                                onClick={() => { setMenuOpen(false); setMobileMenuOpen(false); }}
                                className="w-full px-4 py-3 border dark:border-white/10 border-black/10 rounded-xl text-neutral-400 hover:text-white dark:hover:bg-white/5 hover:bg-black/5 transition-colors text-sm font-medium mt-2"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Layout Container */}
            <div className="flex flex-col h-[100dvh]">

                {/* ===== Navbar ===== */}
                <nav className="flex items-center justify-between px-4 sm:px-6 py-2 sm:py-3 dark:bg-neutral-900/80 bg-white/80 backdrop-blur-md border-b dark:border-white/10 border-black/10 z-30 shrink-0">
                    <Link href="/lobby" className="flex items-center gap-1">
                        <Image
                            src="/chessMedia/checkmateLogo.png"
                            alt="Checkmate Logo"
                            width={120}
                            height={120}
                            className="w-14 h-14 object-contain"
                        />
                        <span className="font-bold text-lg sm:text-2xl tracking-tight dark:text-white text-neutral-900">CheckMate</span>
                    </Link>
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
                            onClick={() => {
                                if (isPlaying) {
                                    setShowQuitConfirm(true);
                                } else {
                                    router.push('/lobby');
                                }
                            }}
                            className="p-1.5 rounded-lg dark:hover:bg-white/10 hover:bg-black/5 transition-colors"
                            title="Back to Lobby"
                        >
                            <IconArrowLeft className="w-5 h-5 dark:text-neutral-400 text-neutral-500" />
                        </button>
                    </div>
                </nav>

                {/* ===== Unified Card ===== */}
                <div className="flex-1 dark:bg-neutral-900/60 bg-white/60 backdrop-blur-sm overflow-hidden flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_minmax(0,1fr)] relative">

                    {/* ─── Left Panel: Video & Game History (Desktop only) ─── */}
                    <div className="hidden lg:flex flex-col gap-3 p-4 dark:bg-neutral-900/80 bg-neutral-100/80 border-r dark:border-white/5 border-black/5 min-h-0">
                        {/* Opponent video */}
                        <div className="w-full aspect-video rounded-lg dark:bg-neutral-800 bg-neutral-200 relative overflow-hidden">
                            {!isPlaying && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 z-0">
                                    <IconUser className="w-8 h-8 dark:text-neutral-600 text-neutral-400" />
                                    <span className="text-[10px] font-medium dark:text-neutral-500 text-neutral-400">{opponentName}</span>
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
                            <div className="flex-1 p-2 overflow-y-auto min-h-0 custom-scrollbar">
                                {movePairs.length === 0 ? (
                                    <div className="px-2 py-1 dark:bg-white/5 bg-black/5 rounded-md dark:text-neutral-500 text-neutral-400 italic text-[10px]">
                                        Waiting for moves...
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-0.5">
                                        {movePairs.map(([white, black], idx) => (
                                            <div
                                                key={idx}
                                                className={`flex items-center gap-1.5 px-1.5 py-1 rounded text-[10px] ${idx === movePairs.length - 1 ? 'bg-green-500/10 border border-green-500/20' : idx % 2 === 0 ? 'dark:bg-white/5 bg-black/5' : ''
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
                                        <span className="text-[8px] sm:text-[10px] text-neutral-300 font-medium">{opponentName}</span>
                                    </div>
                                    {!isPlaying && (
                                        <IconVideo className="w-5 h-5 text-neutral-500 opacity-40 z-10" />
                                    )}
                                    <video ref={mobileRemoteVideoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 aspect-video rounded-lg sm:rounded-xl bg-neutral-800/80 border border-green-500/20 relative overflow-hidden flex items-center justify-center shadow-md">
                                    <div className="absolute top-1 left-1.5 sm:top-1.5 sm:left-2 z-20 bg-black/50 backdrop-blur-sm rounded px-1 py-0.5 sm:px-1.5 sm:py-1">
                                        <span className="text-[8px] sm:text-[10px] text-green-400 font-medium">{yourName}</span>
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
                                        <span className="font-bold dark:text-white/90 text-neutral-800 text-xs sm:text-sm lg:text-sm">{opponentName}</span>
                                        <span className="text-[10px] sm:text-xs dark:text-neutral-500 text-neutral-400">Rating: {opponentRating}</span>
                                    </div>
                                </div>
                                <div className={`dark:bg-neutral-800 bg-neutral-200 w-16 h-6 sm:w-24 sm:h-8 lg:w-28 lg:h-9 rounded-md shadow-inner border flex items-center justify-center transition-colors ${isOpponentActive && isPlaying ? 'border-red-500/30 bg-red-500/10' : 'dark:border-white/5 border-black/10'}`}>
                                    <span className={`font-mono text-xs sm:text-sm lg:text-base font-semibold ${opponentTime <= 30000 && isPlaying ? 'text-red-400' : 'dark:text-white/90 text-neutral-800'}`}>{formatTime(opponentTime)}</span>
                                </div>
                            </div>

                            {/* The Board */}
                            <div className="w-full flex items-center justify-center">
                                <ChessBoard chess={chess} setBoard={setBoard} socket={socket} board={board} playerColor={playerColor} onMove={(moveInfo) => {
                                    setMoveHistory(chess.history());
                                    setActiveColor(chess.turn() === 'w' ? 'white' : 'black');

                                    // Play appropriate sound for self-move
                                    if (chess.isCheck()) {
                                        playSound('move-check');
                                    } else if (moveInfo.notation.includes('x')) {
                                        playSound('capture');
                                    } else if (moveInfo.notation === 'O-O' || moveInfo.notation === 'O-O-O') {
                                        playSound('castle');
                                    } else if (moveInfo.notation.includes('=')) {
                                        playSound('promote');
                                    } else {
                                        playSound('move-self');
                                    }
                                    // Save our own move to DB
                                    if (currentGameId && moveInfo) {
                                        saveMoveInDB({
                                            gameId: currentGameId,
                                            from: moveInfo.from,
                                            to: moveInfo.to,
                                            piece: moveInfo.piece,
                                            moveNumber: chess.history().length,
                                            notation: moveInfo.notation,
                                            timeTakenMs: 0, // Server tracks actual time
                                        });
                                    }
                                }} />
                            </div>

                            {/* Your Info */}
                            <div className="w-full flex items-center justify-between">
                                <div className="flex items-center gap-2 lg:gap-3">
                                    <div className="w-7 h-7 sm:w-9 sm:h-9 lg:w-10 lg:h-10 bg-green-500/20 rounded-lg flex items-center justify-center border border-green-500/30 shadow-md">
                                        {session?.user?.image ? (
                                            <img src={session.user.image} alt="" className="w-full h-full rounded-lg object-cover" />
                                        ) : (
                                            <IconUser className="w-4 h-4 sm:w-5 sm:h-5 lg:w-5 lg:h-5 text-green-400" />
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-green-400 text-xs sm:text-sm lg:text-sm">{yourName}</span>
                                        <span className="text-[10px] sm:text-xs dark:text-neutral-500 text-neutral-400">
                                            Rating: {yourRating}
                                            {ratingChanges && (
                                                <span className={`ml-1 font-semibold ${ratingChanges[playerColor as 'white' | 'black']?.new > ratingChanges[playerColor as 'white' | 'black']?.old ? 'text-green-400' : ratingChanges[playerColor as 'white' | 'black']?.new < ratingChanges[playerColor as 'white' | 'black']?.old ? 'text-red-400' : 'text-neutral-400'}`}>
                                                    ({ratingChanges[playerColor as 'white' | 'black']?.new > ratingChanges[playerColor as 'white' | 'black']?.old ? '+' : ''}{ratingChanges[playerColor as 'white' | 'black']?.new - ratingChanges[playerColor as 'white' | 'black']?.old})
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                    {isPlaying && (
                                        <button
                                            onClick={() => setMenuOpen(true)}
                                            className="hidden lg:flex p-1.5 rounded-lg hover:bg-white/10 transition-colors ml-2"
                                        >
                                            <IconDotsVertical className="w-5 h-5 dark:text-neutral-400 text-neutral-500" />
                                        </button>
                                    )}
                                </div>
                                <div className={`dark:bg-neutral-800 bg-neutral-200 w-16 h-6 sm:w-24 sm:h-8 lg:w-28 lg:h-9 rounded-md shadow-inner border flex items-center justify-center transition-colors ${isYourActive && isPlaying ? 'border-green-500/30 bg-green-500/10' : 'dark:border-white/5 border-black/10'}`}>
                                    <span className={`font-mono text-xs sm:text-sm lg:text-base font-semibold ${yourTime <= 30000 && isPlaying ? 'text-red-400' : 'text-green-400'}`}>{formatTime(yourTime)}</span>
                                </div>
                            </div>

                            {/* Play Button (desktop) */}
                            {!isPlaying && (
                                <div className="hidden lg:block relative" ref={menuRef}>
                                    <Button
                                        onClick={handlePlay}
                                        disabled={isSearching}
                                        className="w-full bg-green-500 hover:bg-green-400 text-neutral-900 font-bold py-3 rounded-xl transition-all shadow-xl hover:shadow-green-500/20 text-base tracking-wide uppercase"
                                    >
                                        {isSearching ? "Searching..." : "Find Match"}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ─── Right Panel: Chat (Desktop only) ─── */}
                    <div className="hidden lg:flex flex-col gap-3 p-4 dark:bg-neutral-900/80 bg-neutral-100/80 border-l dark:border-white/5 border-black/5 min-h-0">
                        {/* Chat area */}
                        <div className="flex-1 rounded-lg dark:bg-neutral-800/60 bg-neutral-200/60 p-2.5 flex flex-col overflow-hidden min-h-0">
                            <div className="flex items-center gap-1 mb-1.5">
                                <IconMessageCircle className="w-3 h-3 dark:text-neutral-500 text-neutral-400" />
                                <span className="text-[9px] font-semibold uppercase tracking-wider dark:text-neutral-500 text-neutral-400">Chat</span>
                            </div>
                            <div className="flex-1 flex flex-col gap-1.5 text-[11px] overflow-y-auto min-h-0 custom-scrollbar">
                                {!isPlaying && chatMessages.length === 0 ? (
                                    <div className="flex-1 flex items-center justify-center">
                                        <p className="dark:text-neutral-500 text-neutral-400 text-[10px]">Waiting for match...</p>
                                    </div>
                                ) : (
                                    chatMessages.map((msg, idx) => (
                                        <div key={idx} className="w-full text-[11px] py-0.5 flex items-start gap-1">
                                            <span className={`font-semibold shrink-0 ${msg.sender === 'you' ? 'text-green-500' : 'text-blue-500'}`}>
                                                {msg.sender === 'you' ? yourName : opponentName}:
                                            </span>
                                            <span className="dark:text-neutral-300 text-neutral-700 break-words">{msg.text}</span>
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
                        {hasUnreadMessages && (
                            <span className="absolute -top-0.5 right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full text-[12px] font-bold text-white flex items-center justify-center pt-[3px]">
                                *
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
                    {!isPlaying ? (
                        <button
                            onClick={handlePlay}
                            disabled={isSearching}
                            className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-40"
                        >
                            <IconSwords className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
                            <span className="text-[9px] sm:text-xs text-green-400 font-medium">{isSearching ? 'Searching' : 'Find Match'}</span>
                        </button>
                    ) : (
                        <div className="relative flex flex-col items-center">
                            <button
                                onClick={() => setMenuOpen(true)}
                                className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                            >
                                <IconDotsVertical className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-400" />
                                <span className="text-[9px] sm:text-xs text-neutral-400 font-medium">Options</span>
                            </button>
                        </div>
                    )}
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
                    <div className="flex-1 p-3 flex flex-col gap-2 text-sm overflow-y-auto min-h-0 custom-scrollbar-dark">
                        {!isPlaying && chatMessages.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center text-neutral-500">
                                <p className="bg-black/40 px-3 py-1.5 rounded-full border border-white/5 text-xs">Waiting for match...</p>
                            </div>
                        ) : (
                            chatMessages.map((msg, idx) => (
                                <div key={idx} className="w-full text-sm py-1 bg-transparent flex items-start gap-1.5">
                                    <span className={`font-semibold shrink-0 ${msg.sender === 'you' ? 'text-green-500' : 'text-blue-500'}`}>
                                        {msg.sender === 'you' ? yourName : opponentName}:
                                    </span>
                                    <span className="text-white/90 break-words">{msg.text}</span>
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
                    <div className="flex-1 p-3 overflow-y-auto min-h-0 custom-scrollbar-dark">
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
                                        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm ${idx === movePairs.length - 1 ? 'bg-green-500/10 border border-green-500/20' : idx % 2 === 0 ? 'bg-white/5' : ''
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