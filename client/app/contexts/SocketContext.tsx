'use client'

import { createContext, useContext, useState, useRef, useCallback } from 'react'
import { INIT_GAME } from '@/app/messages/messages'

export type MatchData = {
    color: string;
    opponent: { id: string; name: string; rating: number };
    gameId: string;
};

type SocketContextType = {
    socket: WebSocket | null;
    isConnected: boolean;
    isSearching: boolean;
    matchData: MatchData | null;
    findMatch: (playerInfo: { userId: string; name: string; rating: number }) => void;
    cancelSearch: () => void;
    clearMatch: () => void;
    disconnectSocket: () => void;
};

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
    isSearching: false,
    matchData: null,
    findMatch: () => {},
    cancelSearch: () => {},
    clearMatch: () => {},
    disconnectSocket: () => {},
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [matchData, setMatchData] = useState<MatchData | null>(null);
    const socketRef = useRef<WebSocket | null>(null);
    const searchingRef = useRef(false);

    const findMatch = useCallback((playerInfo: { userId: string; name: string; rating: number }) => {
        const wsUrl = process.env.NEXT_PUBLIC_WS_BACKEND_URL || '';

        const sendInit = (ws: WebSocket) => {
            setIsSearching(true);
            searchingRef.current = true;
            ws.send(JSON.stringify({ type: INIT_GAME, payload: playerInfo }));
        };

        const attachMatchListener = (ws: WebSocket) => {
            const handleMessage = (event: MessageEvent) => {
                const message = JSON.parse(event.data);
                if (message.type === INIT_GAME && searchingRef.current) {
                    setMatchData({
                        color: message.payload.color,
                        opponent: message.payload.opponent,
                        gameId: message.payload.gameId,
                    });
                    setIsSearching(false);
                    searchingRef.current = false;
                    ws.removeEventListener('message', handleMessage);
                }
            };
            ws.addEventListener('message', handleMessage);
        };

        // If already connected, reuse existing socket
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            attachMatchListener(socketRef.current);
            sendInit(socketRef.current);
            return;
        }

        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
            setSocket(ws);
            attachMatchListener(ws);
            sendInit(ws);
        };

        ws.onclose = () => {
            setSocket(null);
            socketRef.current = null;
            setIsSearching(false);
            searchingRef.current = false;
        };
    }, []);

    const cancelSearch = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
        }
        setSocket(null);
        setIsSearching(false);
        searchingRef.current = false;
        setMatchData(null);
    }, []);

    const clearMatch = useCallback(() => {
        setMatchData(null);
    }, []);

    const disconnectSocket = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
        }
        setSocket(null);
        setIsSearching(false);
        searchingRef.current = false;
        setMatchData(null);
    }, []);

    return (
        <SocketContext.Provider value={{ socket, isConnected: !!socket, isSearching, matchData, findMatch, cancelSearch, clearMatch, disconnectSocket }}>
            {children}
        </SocketContext.Provider>
    );
}

export const useSocketContext = () => useContext(SocketContext);
