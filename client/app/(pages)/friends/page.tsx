'use client'

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import SidebarLayout from "@/components/layout/SidebarLayout"
import { useToast } from "@/components/ui/Toast"
import {
    IconLoader2,
    IconUsers,
    IconUserPlus,
    IconCheck,
    IconX,
    IconSearch,
    IconSend,
    IconUser,
    IconClock,
    IconTrophy,
} from "@tabler/icons-react"

interface Friend {
    id: string
    username: string
    rating: number
    profilePicture: string | null
    requestId: string
}

interface PendingRequest {
    id: string
    username: string
    rating: number
    profilePicture: string | null
    requestId: string
    createdAt: string
}

export default function FriendsPage() {
    const { status } = useSession()
    const router = useRouter()
    const toast = useToast()

    const [friends, setFriends] = useState<Friend[]>([])
    const [pendingIncoming, setPendingIncoming] = useState<PendingRequest[]>([])
    const [pendingOutgoing, setPendingOutgoing] = useState<PendingRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [searchUsername, setSearchUsername] = useState("")
    const [sending, setSending] = useState(false)
    const [tab, setTab] = useState<"friends" | "incoming" | "outgoing">("friends")

    const fetchFriends = () => {
        fetch("/api/friends")
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data) {
                    setFriends(data.friends)
                    setPendingIncoming(data.pendingIncoming)
                    setPendingOutgoing(data.pendingOutgoing)
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/signin")
            return
        }
        if (status === "authenticated") fetchFriends()
    }, [status, router])

    async function handleSendRequest(e: React.FormEvent) {
        e.preventDefault()
        if (!searchUsername.trim()) return
        setSending(true)
        try {
            const res = await fetch("/api/friends", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: searchUsername.trim() }),
            })
            const data = await res.json()
            if (res.ok) {
                toast.success(data.message || "Friend request sent!")
                setSearchUsername("")
                fetchFriends()
            } else {
                toast.error(data.error || "Failed to send request")
            }
        } catch {
            toast.error("Network error")
        } finally {
            setSending(false)
        }
    }

    async function handleRespond(requestId: string, action: "accept" | "decline") {
        try {
            const res = await fetch("/api/friends/respond", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ requestId, action }),
            })
            const data = await res.json()
            if (res.ok) {
                toast.success(data.message || `Request ${action}ed`)
                fetchFriends()
            } else {
                toast.error(data.error || "Failed")
            }
        } catch {
            toast.error("Network error")
        }
    }

    if (loading || status === "loading") {
        return (
            <SidebarLayout>
                <div className="flex items-center justify-center h-full">
                    <IconLoader2 className="w-8 h-8 text-green-500 animate-spin" />
                </div>
            </SidebarLayout>
        )
    }

    return (
        <SidebarLayout>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
                <div className="flex items-center gap-3 mb-6 sm:mb-8">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <IconUsers className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold dark:text-white text-neutral-900">Friends</h1>
                        <p className="text-sm dark:text-neutral-400 text-neutral-500">{friends.length} friends</p>
                    </div>
                </div>

                {/* Add Friend */}
                <form onSubmit={handleSendRequest} className="mb-6">
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-neutral-500 text-neutral-400" />
                            <input
                                type="text"
                                value={searchUsername}
                                onChange={(e) => setSearchUsername(e.target.value)}
                                placeholder="Enter username to add friend..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl dark:bg-neutral-900/80 bg-white/80 border dark:border-white/10 border-black/10 text-sm dark:text-white text-neutral-900 placeholder:dark:text-neutral-600 placeholder:text-neutral-400 outline-none focus:ring-1 focus:ring-green-500/30 backdrop-blur-md"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={sending || !searchUsername.trim()}
                            className="px-4 py-2.5 rounded-xl bg-green-500 text-neutral-900 text-sm font-semibold hover:bg-green-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {sending ? <IconLoader2 className="w-4 h-4 animate-spin" /> : <IconSend className="w-4 h-4" />}
                            Send
                        </button>
                    </div>
                </form>

                {/* Tabs */}
                <div className="flex gap-1 mb-5 p-1 rounded-xl dark:bg-neutral-900/60 bg-neutral-100 border dark:border-white/5 border-black/5">
                    {[
                        { key: "friends" as const, label: "Friends", count: friends.length },
                        { key: "incoming" as const, label: "Incoming", count: pendingIncoming.length },
                        { key: "outgoing" as const, label: "Sent", count: pendingOutgoing.length },
                    ].map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                                tab === t.key
                                    ? "bg-green-500/10 text-green-500 border border-green-500/20"
                                    : "dark:text-neutral-400 text-neutral-600 dark:hover:text-neutral-200 hover:text-neutral-800"
                            }`}
                        >
                            {t.label}
                            {t.count > 0 && (
                                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                                    tab === t.key ? "bg-green-500/20" : "dark:bg-neutral-800 bg-neutral-200"
                                }`}>
                                    {t.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Friends list */}
                {tab === "friends" && (
                    friends.length === 0 ? (
                        <div className="rounded-2xl dark:bg-neutral-900/80 bg-white/80 border dark:border-white/10 border-black/10 backdrop-blur-md p-10 text-center shadow-lg">
                            <IconUserPlus className="w-12 h-12 dark:text-neutral-600 text-neutral-400 mx-auto mb-3" />
                            <p className="dark:text-neutral-400 text-neutral-600 text-lg font-medium">No friends yet</p>
                            <p className="dark:text-neutral-500 text-neutral-400 text-sm mt-1">Add friends by username above</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {friends.map((friend) => (
                                <div key={friend.requestId} className="rounded-xl dark:bg-neutral-900/60 bg-white/60 border dark:border-white/5 border-black/5 backdrop-blur-md p-3 sm:p-4 flex items-center gap-3">
                                    {friend.profilePicture ? (
                                        <img src={friend.profilePicture} alt="" className="w-10 h-10 rounded-full object-cover border dark:border-white/10 border-black/10" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center border dark:border-white/10 border-black/10">
                                            <IconUser className="w-5 h-5 text-green-400" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium dark:text-neutral-200 text-neutral-800 truncate">{friend.username}</p>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <IconTrophy className="w-3 h-3 text-yellow-400" />
                                            <span className="text-xs dark:text-neutral-500 text-neutral-400">{friend.rating} rating</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}

                {/* Incoming requests */}
                {tab === "incoming" && (
                    pendingIncoming.length === 0 ? (
                        <div className="rounded-2xl dark:bg-neutral-900/80 bg-white/80 border dark:border-white/10 border-black/10 backdrop-blur-md p-10 text-center shadow-lg">
                            <IconClock className="w-12 h-12 dark:text-neutral-600 text-neutral-400 mx-auto mb-3" />
                            <p className="dark:text-neutral-400 text-neutral-600 text-lg font-medium">No pending requests</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {pendingIncoming.map((req) => (
                                <div key={req.requestId} className="rounded-xl dark:bg-neutral-900/60 bg-white/60 border dark:border-white/5 border-black/5 backdrop-blur-md p-3 sm:p-4 flex items-center gap-3">
                                    {req.profilePicture ? (
                                        <img src={req.profilePicture} alt="" className="w-10 h-10 rounded-full object-cover border dark:border-white/10 border-black/10" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border dark:border-white/10 border-black/10">
                                            <IconUser className="w-5 h-5 text-blue-400" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium dark:text-neutral-200 text-neutral-800 truncate">{req.username}</p>
                                        <p className="text-xs dark:text-neutral-500 text-neutral-400">
                                            {req.rating} rating · {new Date(req.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex gap-1.5">
                                        <button
                                            onClick={() => handleRespond(req.requestId, "accept")}
                                            className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                                            title="Accept"
                                        >
                                            <IconCheck className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleRespond(req.requestId, "decline")}
                                            className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                                            title="Decline"
                                        >
                                            <IconX className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}

                {/* Outgoing requests */}
                {tab === "outgoing" && (
                    pendingOutgoing.length === 0 ? (
                        <div className="rounded-2xl dark:bg-neutral-900/80 bg-white/80 border dark:border-white/10 border-black/10 backdrop-blur-md p-10 text-center shadow-lg">
                            <IconSend className="w-12 h-12 dark:text-neutral-600 text-neutral-400 mx-auto mb-3" />
                            <p className="dark:text-neutral-400 text-neutral-600 text-lg font-medium">No sent requests</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {pendingOutgoing.map((req) => (
                                <div key={req.requestId} className="rounded-xl dark:bg-neutral-900/60 bg-white/60 border dark:border-white/5 border-black/5 backdrop-blur-md p-3 sm:p-4 flex items-center gap-3">
                                    {req.profilePicture ? (
                                        <img src={req.profilePicture} alt="" className="w-10 h-10 rounded-full object-cover border dark:border-white/10 border-black/10" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-neutral-500/20 flex items-center justify-center border dark:border-white/10 border-black/10">
                                            <IconUser className="w-5 h-5 text-neutral-400" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium dark:text-neutral-200 text-neutral-800 truncate">{req.username}</p>
                                        <p className="text-xs dark:text-neutral-500 text-neutral-400">
                                            {req.rating} rating · Sent {new Date(req.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <span className="text-xs dark:text-yellow-400/60 text-yellow-600/60 font-medium px-2 py-1 rounded-lg dark:bg-yellow-500/10 bg-yellow-500/10">
                                        Pending
                                    </span>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>
        </SidebarLayout>
    )
}
