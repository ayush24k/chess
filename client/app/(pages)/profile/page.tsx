'use client'

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import SidebarLayout from "@/components/layout/SidebarLayout"
import {
    IconUser,
    IconTrophy,
    IconSword,
    IconCalendar,
    IconMail,
    IconChessKnight,
    IconLoader2,
} from "@tabler/icons-react"

interface UserProfile {
    id: string
    username: string
    email: string
    rating: number
    profilePicture: string | null
    totalGames: number
    wins: number
}

export default function ProfilePage() {
    const { status } = useSession()
    const router = useRouter()
    const [user, setUser] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/signin")
            return
        }
        if (status === "authenticated") {
            fetch("/api/user/me")
                .then(res => res.ok ? res.json() : null)
                .then(data => {
                    if (data?.user) setUser(data.user)
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

    if (!user) {
        return (
            <SidebarLayout>
                <div className="flex items-center justify-center h-full">
                    <p className="dark:text-neutral-400 text-neutral-600">Failed to load profile</p>
                </div>
            </SidebarLayout>
        )
    }

    const losses = user.totalGames - user.wins
    const winRate = user.totalGames > 0 ? Math.round((user.wins / user.totalGames) * 100) : 0

    return (
        <SidebarLayout>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
                <h1 className="text-2xl sm:text-3xl font-bold dark:text-white text-neutral-900 mb-6 sm:mb-8">Profile</h1>

                {/* Profile Card */}
                <div className="rounded-2xl dark:bg-neutral-900/80 bg-white/80 border dark:border-white/10 border-black/10 backdrop-blur-md shadow-xl overflow-hidden mb-6">
                    {/* Banner */}
                    <div className="h-24 sm:h-32 bg-gradient-to-r from-green-500/20 via-green-400/10 to-transparent relative">
                        <div className="absolute -bottom-10 left-6">
                            {user.profilePicture ? (
                                <img src={user.profilePicture} alt="" className="w-20 h-20 rounded-full border-4 dark:border-neutral-900 border-white object-cover shadow-lg" />
                            ) : (
                                <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center border-4 dark:border-neutral-900 border-white shadow-lg">
                                    <IconUser className="w-10 h-10 text-green-400" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-14 px-6 pb-6">
                        <h2 className="text-xl font-bold dark:text-white text-neutral-900">{user.username}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <IconMail className="w-4 h-4 dark:text-neutral-500 text-neutral-400" />
                            <p className="text-sm dark:text-neutral-400 text-neutral-500">{user.email}</p>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                    {[
                        { icon: IconTrophy, label: "Rating", value: user.rating.toString(), color: "text-yellow-400", bg: "bg-yellow-500/10" },
                        { icon: IconSword, label: "Games", value: user.totalGames.toString(), color: "text-blue-400", bg: "bg-blue-500/10" },
                        { icon: IconChessKnight, label: "Wins", value: user.wins.toString(), color: "text-green-400", bg: "bg-green-500/10" },
                        { icon: IconCalendar, label: "Win Rate", value: `${winRate}%`, color: "text-purple-400", bg: "bg-purple-500/10" },
                    ].map((stat) => (
                        <div key={stat.label} className="rounded-2xl dark:bg-neutral-900/80 bg-white/80 border dark:border-white/10 border-black/10 backdrop-blur-md p-4 sm:p-5 shadow-lg">
                            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                            <p className="text-xl sm:text-2xl font-bold dark:text-white text-neutral-900">{stat.value}</p>
                            <p className="text-xs dark:text-neutral-500 text-neutral-400 uppercase tracking-wider mt-0.5">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Win/Loss Breakdown */}
                <div className="rounded-2xl dark:bg-neutral-900/80 bg-white/80 border dark:border-white/10 border-black/10 backdrop-blur-md p-5 sm:p-6 shadow-lg">
                    <h3 className="text-lg font-semibold dark:text-white text-neutral-900 mb-4">Performance</h3>
                    <div className="space-y-4">
                        {/* Win/loss bar */}
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-green-400 font-medium">{user.wins} Wins</span>
                                <span className="text-red-400 font-medium">{losses} Losses</span>
                            </div>
                            <div className="h-3 rounded-full dark:bg-neutral-800 bg-neutral-200 overflow-hidden flex">
                                {user.totalGames > 0 && (
                                    <>
                                        <div className="bg-green-500 h-full transition-all" style={{ width: `${winRate}%` }} />
                                        <div className="bg-red-500 h-full transition-all" style={{ width: `${100 - winRate}%` }} />
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 pt-2">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-green-400">{user.wins}</p>
                                <p className="text-xs dark:text-neutral-500 text-neutral-400">Wins</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-red-400">{losses}</p>
                                <p className="text-xs dark:text-neutral-500 text-neutral-400">Losses</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-yellow-400">{winRate}%</p>
                                <p className="text-xs dark:text-neutral-500 text-neutral-400">Win Rate</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </SidebarLayout>
    )
}
