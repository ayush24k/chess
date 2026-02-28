'use client'

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import SidebarLayout from "@/components/layout/SidebarLayout"
import {
    IconLoader2,
    IconChevronLeft,
    IconChevronRight,
    IconCrown,
    IconX as IconXMark,
    IconMinus,
    IconClock,
    IconUser,
} from "@tabler/icons-react"

interface GameRecord {
    id: string
    opponent: { username: string; rating: number; profilePicture: string | null }
    playedAs: "white" | "black"
    result: string
    gameResult: string
    moves: number
    pgn: string | null
    startedAt: string
    endedAt: string | null
}

export default function HistoryPage() {
    const { status } = useSession()
    const router = useRouter()
    const [games, setGames] = useState<GameRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/signin")
            return
        }
        if (status === "authenticated") {
            setLoading(true)
            fetch(`/api/games/history?page=${page}&limit=15`)
                .then(res => res.ok ? res.json() : null)
                .then(data => {
                    if (data) {
                        setGames(data.games)
                        setTotalPages(data.totalPages)
                        setTotal(data.total)
                    }
                })
                .catch(() => {})
                .finally(() => setLoading(false))
        }
    }, [status, router, page])

    const resultIcon = (result: string) => {
        if (result === "Win") return <IconCrown className="w-4 h-4 text-green-400" />
        if (result === "Loss") return <IconXMark className="w-4 h-4 text-red-400" />
        return <IconMinus className="w-4 h-4 text-yellow-400" />
    }

    const resultColor = (result: string) => {
        if (result === "Win") return "text-green-400"
        if (result === "Loss") return "text-red-400"
        return "text-yellow-400"
    }

    const resultBg = (result: string) => {
        if (result === "Win") return "dark:bg-green-500/5 bg-green-500/5 border-green-500/10"
        if (result === "Loss") return "dark:bg-red-500/5 bg-red-500/5 border-red-500/10"
        return "dark:bg-yellow-500/5 bg-yellow-500/5 border-yellow-500/10"
    }

    return (
        <SidebarLayout>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
                <div className="flex items-center justify-between mb-6 sm:mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold dark:text-white text-neutral-900">Game History</h1>
                        <p className="text-sm dark:text-neutral-400 text-neutral-500 mt-1">{total} games played</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <IconLoader2 className="w-8 h-8 text-green-500 animate-spin" />
                    </div>
                ) : games.length === 0 ? (
                    <div className="rounded-2xl dark:bg-neutral-900/80 bg-white/80 border dark:border-white/10 border-black/10 backdrop-blur-md p-10 text-center shadow-lg">
                        <IconClock className="w-12 h-12 dark:text-neutral-600 text-neutral-400 mx-auto mb-3" />
                        <p className="dark:text-neutral-400 text-neutral-600 text-lg font-medium">No games yet</p>
                        <p className="dark:text-neutral-500 text-neutral-400 text-sm mt-1">Play your first game to see history here</p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-2.5">
                            {games.map((game) => (
                                <div
                                    key={game.id}
                                    className={`rounded-xl border backdrop-blur-md p-3 sm:p-4 shadow-sm transition-colors ${resultBg(game.result)}`}
                                >
                                    <div className="flex items-center gap-3 sm:gap-4">
                                        {/* Result indicator */}
                                        <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                                            game.result === "Win" ? "bg-green-500/20" :
                                            game.result === "Loss" ? "bg-red-500/20" : "bg-yellow-500/20"
                                        }`}>
                                            {resultIcon(game.result)}
                                        </div>

                                        {/* Game info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-semibold ${resultColor(game.result)}`}>
                                                    {game.result}
                                                </span>
                                                <span className="text-xs dark:text-neutral-500 text-neutral-400">vs</span>
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    {game.opponent.profilePicture ? (
                                                        <img src={game.opponent.profilePicture} alt="" className="w-5 h-5 rounded-full object-cover" />
                                                    ) : (
                                                        <div className="w-5 h-5 rounded-full bg-neutral-700 flex items-center justify-center">
                                                            <IconUser className="w-3 h-3 text-neutral-400" />
                                                        </div>
                                                    )}
                                                    <span className="text-sm font-medium dark:text-neutral-200 text-neutral-800 truncate">
                                                        {game.opponent.username}
                                                    </span>
                                                    <span className="text-xs dark:text-neutral-500 text-neutral-400">
                                                        ({game.opponent.rating})
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 text-xs dark:text-neutral-500 text-neutral-400">
                                                <span className="capitalize">Played as {game.playedAs}</span>
                                                <span>·</span>
                                                <span>{game.moves} moves</span>
                                                <span>·</span>
                                                <span>{new Date(game.startedAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-3 mt-6">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="p-2 rounded-xl dark:bg-neutral-900/80 bg-white/80 border dark:border-white/10 border-black/10 dark:text-neutral-300 text-neutral-700 disabled:opacity-30 hover:bg-green-500/10 transition-colors"
                                >
                                    <IconChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="text-sm dark:text-neutral-400 text-neutral-500">
                                    Page {page} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="p-2 rounded-xl dark:bg-neutral-900/80 bg-white/80 border dark:border-white/10 border-black/10 dark:text-neutral-300 text-neutral-700 disabled:opacity-30 hover:bg-green-500/10 transition-colors"
                                >
                                    <IconChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </SidebarLayout>
    )
}
