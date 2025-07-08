import { useEffect, useState } from "react"

export const useSocket = () => {
    const [socket, setSocket] = useState<WebSocket | null>(null);

    useEffect(() => {
        console.log(process.env.WS_BACKEND_URL)
        const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_BACKEND_URL}` || "")

        ws.onopen = () => {
            setSocket(ws)
        }

        ws.onclose = () => {
            setSocket(null)
        }

        return () => {
            ws.close();
        }

    }, [])
    

    return socket;
}