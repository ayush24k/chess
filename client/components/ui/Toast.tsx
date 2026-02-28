'use client'

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { IconCheck, IconX, IconAlertTriangle, IconInfoCircle } from '@tabler/icons-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
    id: string
    message: string
    type: ToastType
}

interface ToastContextType {
    toast: {
        success: (message: string) => void
        error: (message: string) => void
        warning: (message: string) => void
        info: (message: string) => void
    }
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
    const ctx = useContext(ToastContext)
    if (!ctx) throw new Error('useToast must be used within ToastProvider')
    return ctx.toast
}

const ICONS: Record<ToastType, React.ReactNode> = {
    success: <IconCheck className="w-5 h-5 text-green-400" />,
    error: <IconX className="w-5 h-5 text-red-400" />,
    warning: <IconAlertTriangle className="w-5 h-5 text-yellow-400" />,
    info: <IconInfoCircle className="w-5 h-5 text-blue-400" />,
}

const COLORS: Record<ToastType, string> = {
    success: 'border-green-500/40 bg-green-950/60',
    error: 'border-red-500/40 bg-red-950/60',
    warning: 'border-yellow-500/40 bg-yellow-950/60',
    info: 'border-blue-500/40 bg-blue-950/60',
}

const LIGHT_COLORS: Record<ToastType, string> = {
    success: 'border-green-300 bg-green-50',
    error: 'border-red-300 bg-red-50',
    warning: 'border-yellow-300 bg-yellow-50',
    info: 'border-blue-300 bg-blue-50',
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])
    const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id))
        const timer = timersRef.current.get(id)
        if (timer) {
            clearTimeout(timer)
            timersRef.current.delete(id)
        }
    }, [])

    const addToast = useCallback((message: string, type: ToastType) => {
        const id = crypto.randomUUID()
        setToasts(prev => [...prev, { id, message, type }])
        const timer = setTimeout(() => removeToast(id), 4000)
        timersRef.current.set(id, timer)
    }, [removeToast])

    useEffect(() => {
        return () => {
            timersRef.current.forEach(timer => clearTimeout(timer))
        }
    }, [])

    const toast = {
        success: (msg: string) => addToast(msg, 'success'),
        error: (msg: string) => addToast(msg, 'error'),
        warning: (msg: string) => addToast(msg, 'warning'),
        info: (msg: string) => addToast(msg, 'info'),
    }

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}

            <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
                <AnimatePresence mode="popLayout">
                    {toasts.map(t => (
                        <motion.div
                            key={t.id}
                            layout
                            initial={{ opacity: 0, x: 80, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 80, scale: 0.95 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-lg min-w-[280px] max-w-[380px]
                                dark:${COLORS[t.type]} ${LIGHT_COLORS[t.type]} dark:text-white text-neutral-800`}
                        >
                            <div className="shrink-0">{ICONS[t.type]}</div>
                            <p className="text-sm font-medium flex-1">{t.message}</p>
                            <button
                                onClick={() => removeToast(t.id)}
                                className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                            >
                                <IconX className="w-4 h-4" />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    )
}
