'use client'

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import SidebarLayout from "@/components/layout/SidebarLayout"
import {
    IconLoader2,
    IconChartBar,
    IconTrophy,
    IconSword,
    IconChessKnight,
    IconTarget,
    IconArrowUp,
    IconArrowDown,
    IconMinus,
    IconFlame,
} from "@tabler/icons-react"

interface Stats {
    overview: {
        username: string
        rating: number
        totalGames: number
        wins: number
        losses: number
        draws: number
        winRate: number
        memberSince: string
    }
    colorStats: {
        gamesAsWhite: number
        gamesAsBlack: number
        winsAsWhite: number
        winsAsBlack: number
        whiteWinRate: number
        blackWinRate: number
    }
    gameStats: {
        avgMovesPerGame: number
        longestGame: number
        shortestGame: number
        totalMoves: number
    }
    recentForm: string[]
    ratingHistory: { date: string; rating: number }[]
}

export default function StatisticsPage() {
    const { status } = useSession()
    const router = useRouter()
    const [stats, setStats] = useState<Stats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/signin")
            return
        }
        if (status === "authenticated") {
            fetch("/api/statistics")
                .then(res => res.ok ? res.json() : null)
                .then(data => {
                    if (data) setStats(data)
                })
                .catch(() => {})
                .finally(() => setLoading(false))
        }
    }, [status, router])

    if (loading || status === "loading") {
        return (
            <SidebarLayout>
                <div className="flex items-center justify-center h-full">
                    <IconLoader2 className="w-8 h-8 text-green-500 animate-spin" />
                </div>
            </SidebarLayout>
        )
    }

    if (!stats) {
        return (
            <SidebarLayout>
                <div className="flex items-center justify-center h-full">
                    <p className="dark:text-neutral-400 text-neutral-600">Failed to load statistics</p>
                </div>
            </SidebarLayout>
        )
    }

    const { overview, colorStats, gameStats, recentForm, ratingHistory } = stats

    return (
        <SidebarLayout>
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
                <div className="flex items-center gap-3 mb-6 sm:mb-8">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                        <IconChartBar className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold dark:text-white text-neutral-900">Statistics</h1>
                        <p className="text-sm dark:text-neutral-400 text-neutral-500">
                            Member since {new Date(overview.memberSince).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                {/* Overview Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    {[
                        { icon: IconTrophy, label: "Rating", value: overview.rating, color: "text-yellow-400", bg: "bg-yellow-500/10" },
                        { icon: IconSword, label: "Total Games", value: overview.totalGames, color: "text-blue-400", bg: "bg-blue-500/10" },
                        { icon: IconTarget, label: "Win Rate", value: `${overview.winRate}%`, color: "text-green-400", bg: "bg-green-500/10" },
                        { icon: IconFlame, label: "Total Moves", value: gameStats.totalMoves, color: "text-orange-400", bg: "bg-orange-500/10" },
                    ].map((card) => (
                        <div key={card.label} className="rounded-2xl dark:bg-neutral-900/80 bg-white/80 border dark:border-white/10 border-black/10 backdrop-blur-md p-4 shadow-lg">
                            <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center mb-2.5`}>
                                <card.icon className={`w-4.5 h-4.5 ${card.color}`} />
                            </div>
                            <p className="text-xl font-bold dark:text-white text-neutral-900">{card.value}</p>
                            <p className="text-[10px] dark:text-neutral-500 text-neutral-400 uppercase tracking-wider">{card.label}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {/* Win/Loss/Draw */}
                    <div className="rounded-2xl dark:bg-neutral-900/80 bg-white/80 border dark:border-white/10 border-black/10 backdrop-blur-md p-5 shadow-lg">
                        <h3 className="text-base font-semibold dark:text-white text-neutral-900 mb-4">Results Breakdown</h3>
                        <div className="space-y-3">
                            {[
                                { label: "Wins", value: overview.wins, total: overview.totalGames, color: "bg-green-500" },
                                { label: "Losses", value: overview.losses, total: overview.totalGames, color: "bg-red-500" },
                                { label: "Draws", value: overview.draws, total: overview.totalGames, color: "bg-yellow-500" },
                            ].map((item) => (
                                <div key={item.label}>
                                    <div className="flex justify-between text-sm mb-1.5">
                                        <span className="dark:text-neutral-300 text-neutral-700">{item.label}</span>
                                        <span className="dark:text-neutral-400 text-neutral-500 font-medium">
                                            {item.value} ({item.total > 0 ? Math.round((item.value / item.total) * 100) : 0}%)
                                        </span>
                                    </div>
                                    <div className="h-2 rounded-full dark:bg-neutral-800 bg-neutral-200 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${item.color} transition-all`}
                                            style={{ width: `${item.total > 0 ? (item.value / item.total) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Color Performance */}
                    <div className="rounded-2xl dark:bg-neutral-900/80 bg-white/80 border dark:border-white/10 border-black/10 backdrop-blur-md p-5 shadow-lg">
                        <h3 className="text-base font-semibold dark:text-white text-neutral-900 mb-4">Color Performance</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {/* White */}
                            <div className="rounded-xl dark:bg-neutral-800/50 bg-neutral-100 p-4 border dark:border-white/5 border-black/5">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-6 h-6 rounded-full bg-white border-2 border-neutral-300" />
                                    <span className="text-sm font-medium dark:text-neutral-200 text-neutral-800">White</span>
                                </div>
                                <p className="text-2xl font-bold dark:text-white text-neutral-900">{colorStats.whiteWinRate}%</p>
                                <p className="text-xs dark:text-neutral-500 text-neutral-400 mt-0.5">
                                    {colorStats.winsAsWhite}W / {colorStats.gamesAsWhite}G
                                </p>
                            </div>
                            {/* Black */}
                            <div className="rounded-xl dark:bg-neutral-800/50 bg-neutral-100 p-4 border dark:border-white/5 border-black/5">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-6 h-6 rounded-full bg-neutral-800 border-2 dark:border-neutral-600 border-neutral-700" />
                                    <span className="text-sm font-medium dark:text-neutral-200 text-neutral-800">Black</span>
                                </div>
                                <p className="text-2xl font-bold dark:text-white text-neutral-900">{colorStats.blackWinRate}%</p>
                                <p className="text-xs dark:text-neutral-500 text-neutral-400 mt-0.5">
                                    {colorStats.winsAsBlack}W / {colorStats.gamesAsBlack}G
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Game Stats */}
                    <div className="rounded-2xl dark:bg-neutral-900/80 bg-white/80 border dark:border-white/10 border-black/10 backdrop-blur-md p-5 shadow-lg">
                        <h3 className="text-base font-semibold dark:text-white text-neutral-900 mb-4">Game Stats</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: "Avg Moves", value: gameStats.avgMovesPerGame, icon: IconChessKnight },
                                { label: "Longest Game", value: `${gameStats.longestGame} moves`, icon: IconArrowUp },
                                { label: "Shortest Game", value: `${gameStats.shortestGame} moves`, icon: IconArrowDown },
                                { label: "Total Moves", value: gameStats.totalMoves.toLocaleString(), icon: IconFlame },
                            ].map((item) => (
                                <div key={item.label} className="rounded-xl dark:bg-neutral-800/50 bg-neutral-100 p-3 border dark:border-white/5 border-black/5">
                                    <item.icon className="w-4 h-4 dark:text-neutral-500 text-neutral-400 mb-1.5" />
                                    <p className="text-lg font-bold dark:text-white text-neutral-900">{item.value}</p>
                                    <p className="text-[10px] dark:text-neutral-500 text-neutral-400 uppercase tracking-wider">{item.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Form */}
                    <div className="rounded-2xl dark:bg-neutral-900/80 bg-white/80 border dark:border-white/10 border-black/10 backdrop-blur-md p-5 shadow-lg">
                        <h3 className="text-base font-semibold dark:text-white text-neutral-900 mb-4">Recent Form</h3>
                        {recentForm.length === 0 ? (
                            <p className="text-sm dark:text-neutral-500 text-neutral-400">No recent games</p>
                        ) : (
                            <div className="flex items-center gap-2 flex-wrap">
                                {recentForm.map((result, i) => (
                                    <div
                                        key={i}
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                                            result === "W"
                                                ? "bg-green-500/20 text-green-400 border border-green-500/20"
                                                : result === "L"
                                                ? "bg-red-500/20 text-red-400 border border-red-500/20"
                                                : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/20"
                                        }`}
                                    >
                                        {result}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Rating trend */}
                        {ratingHistory.length > 1 && (
                            <div className="mt-5 pt-4 border-t dark:border-white/5 border-black/5">
                                <h4 className="text-sm font-medium dark:text-neutral-300 text-neutral-700 mb-3">Rating Trend</h4>
                                <div className="flex items-end gap-1 h-16">
                                    {ratingHistory.slice(-20).map((point, i) => {
                                        const min = Math.min(...ratingHistory.slice(-20).map(p => p.rating))
                                        const max = Math.max(...ratingHistory.slice(-20).map(p => p.rating))
                                        const range = max - min || 1
                                        const height = ((point.rating - min) / range) * 100
                                        return (
                                            <div
                                                key={i}
                                                className="flex-1 rounded-t bg-green-500/60 hover:bg-green-500 transition-colors"
                                                style={{ height: `${Math.max(height, 5)}%` }}
                                                title={`${point.date}: ${point.rating}`}
                                            />
                                        )
                                    })}
                                </div>
                                <div className="flex justify-between text-[10px] dark:text-neutral-600 text-neutral-400 mt-1">
                                    <span>{ratingHistory.slice(-20)[0]?.date}</span>
                                    <span>{ratingHistory[ratingHistory.length - 1]?.date}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </SidebarLayout>
    )
}
