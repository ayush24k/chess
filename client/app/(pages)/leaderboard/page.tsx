'use client'

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import SidebarLayout from "@/components/layout/SidebarLayout"
import {
    IconLoader2,
    IconTrophy,
    IconUser,
    IconFlame,
    IconMedal,
    IconMedal2,
} from "@tabler/icons-react"

interface LeaderboardPlayer {
    rank: number
    username: string
    rating: number
    profilePicture: string | null
    totalGames: number
    wins: number
    winRate: number
}

export default function LeaderboardPage() {
    const { data: session } = useSession()
    const [players, setPlayers] = useState<LeaderboardPlayer[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch("/api/leaderboard?limit=50")
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data?.players) setPlayers(data.players)
            })
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [])

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <IconTrophy className="w-5 h-5 text-yellow-400" />
        if (rank === 2) return <IconMedal className="w-5 h-5 text-neutral-400" />
        if (rank === 3) return <IconMedal2 className="w-5 h-5 text-amber-600" />
        return <span className="text-sm font-bold dark:text-neutral-500 text-neutral-400 w-5 text-center">{rank}</span>
    }

    const getRankBg = (rank: number) => {
        if (rank === 1) return "dark:bg-yellow-500/5 bg-yellow-500/5 border-yellow-500/20"
        if (rank === 2) return "dark:bg-neutral-500/5 bg-neutral-500/5 border-neutral-500/20"
        if (rank === 3) return "dark:bg-amber-500/5 bg-amber-500/5 border-amber-500/20"
        return "dark:bg-neutral-900/60 bg-white/60 dark:border-white/5 border-black/5"
    }

    const currentUsername = session?.user?.name

    return (
        <SidebarLayout>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
                <div className="flex items-center gap-3 mb-6 sm:mb-8">
                    <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                        <IconTrophy className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold dark:text-white text-neutral-900">Leaderboard</h1>
                        <p className="text-sm dark:text-neutral-400 text-neutral-500">Top players ranked by rating</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <IconLoader2 className="w-8 h-8 text-green-500 animate-spin" />
                    </div>
                ) : players.length === 0 ? (
                    <div className="rounded-2xl dark:bg-neutral-900/80 bg-white/80 border dark:border-white/10 border-black/10 backdrop-blur-md p-10 text-center shadow-lg">
                        <IconTrophy className="w-12 h-12 dark:text-neutral-600 text-neutral-400 mx-auto mb-3" />
                        <p className="dark:text-neutral-400 text-neutral-600 text-lg font-medium">No players yet</p>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="hidden sm:grid grid-cols-[3rem_1fr_5rem_5rem_5rem_4rem] gap-3 px-4 py-2 text-xs dark:text-neutral-500 text-neutral-400 uppercase tracking-wider font-medium">
                            <span>Rank</span>
                            <span>Player</span>
                            <span className="text-right">Rating</span>
                            <span className="text-right">Games</span>
                            <span className="text-right">Wins</span>
                            <span className="text-right">Win%</span>
                        </div>

                        <div className="space-y-1.5">
                            {players.map((player) => {
                                const isYou = player.username === currentUsername
                                return (
                                    <div
                                        key={player.rank}
                                        className={`rounded-xl border backdrop-blur-md p-3 sm:px-4 sm:py-3 transition-colors ${getRankBg(player.rank)} ${
                                            isYou ? "ring-1 ring-green-500/30" : ""
                                        }`}
                                    >
                                        {/* Desktop */}
                                        <div className="hidden sm:grid grid-cols-[3rem_1fr_5rem_5rem_5rem_4rem] gap-3 items-center">
                                            <div className="flex items-center justify-center">
                                                {getRankIcon(player.rank)}
                                            </div>
                                            <div className="flex items-center gap-3 min-w-0">
                                                {player.profilePicture ? (
                                                    <img src={player.profilePicture} alt="" className="w-8 h-8 rounded-full object-cover border dark:border-white/10 border-black/10" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center border dark:border-white/10 border-black/10">
                                                        <IconUser className="w-4 h-4 text-green-400" />
                                                    </div>
                                                )}
                                                <span className={`text-sm font-medium truncate ${isYou ? "text-green-400" : "dark:text-neutral-200 text-neutral-800"}`}>
                                                    {player.username} {isYou && <span className="text-xs opacity-60">(You)</span>}
                                                </span>
                                            </div>
                                            <span className="text-sm font-bold dark:text-white text-neutral-900 text-right">{player.rating}</span>
                                            <span className="text-sm dark:text-neutral-400 text-neutral-500 text-right">{player.totalGames}</span>
                                            <span className="text-sm dark:text-neutral-400 text-neutral-500 text-right">{player.wins}</span>
                                            <div className="flex items-center justify-end gap-1">
                                                <IconFlame className={`w-3.5 h-3.5 ${player.winRate >= 60 ? "text-orange-400" : "dark:text-neutral-600 text-neutral-400"}`} />
                                                <span className="text-sm dark:text-neutral-400 text-neutral-500">{player.winRate}%</span>
                                            </div>
                                        </div>

                                        {/* Mobile */}
                                        <div className="sm:hidden flex items-center gap-3">
                                            <div className="flex-shrink-0 w-8 flex items-center justify-center">
                                                {getRankIcon(player.rank)}
                                            </div>
                                            {player.profilePicture ? (
                                                <img src={player.profilePicture} alt="" className="w-9 h-9 rounded-full object-cover border dark:border-white/10 border-black/10" />
                                            ) : (
                                                <div className="w-9 h-9 rounded-full bg-green-500/20 flex items-center justify-center border dark:border-white/10 border-black/10">
                                                    <IconUser className="w-4 h-4 text-green-400" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium truncate ${isYou ? "text-green-400" : "dark:text-neutral-200 text-neutral-800"}`}>
                                                    {player.username} {isYou && <span className="text-xs opacity-60">(You)</span>}
                                                </p>
                                                <p className="text-xs dark:text-neutral-500 text-neutral-400">
                                                    {player.totalGames} games · {player.winRate}% win rate
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-bold dark:text-white text-neutral-900">{player.rating}</p>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </>
                )}
            </div>
        </SidebarLayout>
    )
}
