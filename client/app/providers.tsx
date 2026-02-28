'use client'

import { SessionProvider } from "next-auth/react"
import { ToastProvider } from "@/components/ui/Toast"
import { SocketProvider } from "./contexts/SocketContext"

export default function Providers ({children}: {
    children: React.ReactNode;
}) {
    return (
        <SessionProvider>
            <ToastProvider>
                <SocketProvider>
                    {children}
                </SocketProvider>
            </ToastProvider>
        </SessionProvider>
    )
}