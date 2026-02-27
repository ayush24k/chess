'use client'
import { useEffect, useState } from "react";
import { PLAYER_COUNT } from "@/app/messages/messages";

export default function PlayersOnline() {
    const [count, setCount] = useState<number | null>(null);

    useEffect(() => {
        // Convert http(s) to ws(s) if needed
        const rawUrl = process.env.NEXT_PUBLIC_WS_BACKEND_URL || "ws://localhost:8080";
        const wsUrl = rawUrl
            .replace(/^http:/, "ws:")
            .replace(/^https:/, "wss:");

        const ws = new WebSocket(wsUrl);

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === PLAYER_COUNT) {
                    setCount(data.payload.count);
                }
            } catch {
                // ignore non-JSON messages
            }
        };

        ws.onclose = () => {
            setCount(null);
        };

        return () => {
            ws.close();
        };
    }, []);

    return (
        <div className="flex items-center gap-2 text-sm dark:text-neutral-400 text-neutral-500">
            <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
            </span>
            {count !== null ? (
                <span>
                    <span className="font-semibold dark:text-white text-neutral-800">{count}</span>
                    {" "}{count === 1 ? "player" : "players"} online now
                </span>
            ) : (
                <span>Connecting...</span>
            )}
        </div>
    );
}
