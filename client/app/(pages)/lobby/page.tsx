'use client'

import { useState, useRef, useEffect, useCallback } from "react"
import { useSession, signOut, signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
    IconUser,
    IconLogout,
    IconChevronDown,
    IconCamera,
    IconCameraOff,
    IconPlayerPlay,
    IconTrophy,
    IconHistory,
    IconChartBar,
    IconSettings,
    IconChess,
    IconBrandGoogle,
    IconBrandGithub,
    IconMenu2,
    IconX,
    IconHome,
    IconUsers,
} from "@tabler/icons-react"
import { useToast } from "@/components/ui/Toast"
import PlayersOnline from "@/components/landingComponents/PlayersOnline"

const SIDEBAR_ITEMS = [
    { icon: IconHome, label: "Lobby", href: "/lobby", active: true },
    { icon: IconUser, label: "Profile", href: "#" },
    { icon: IconHistory, label: "Game History", href: "#" },
    { icon: IconTrophy, label: "Leaderboard", href: "#" },
    { icon: IconChartBar, label: "Statistics", href: "#" },
    { icon: IconUsers, label: "Friends", href: "#" },
    { icon: IconSettings, label: "Settings", href: "#" },
]

export default function LobbyPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const toast = useToast()
    const isAuthenticated = status === "authenticated"

    // Dropdown / sidebar state
    const [profileOpen, setProfileOpen] = useState(false)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const profileRef = useRef<HTMLDivElement>(null)

    // Webcam state
    const videoRef = useRef<HTMLVideoElement>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const [cameraActive, setCameraActive] = useState(false)
    const [cameraError, setCameraError] = useState<string | null>(null)

    // Close profile dropdown on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setProfileOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClick)
        return () => document.removeEventListener("mousedown", handleClick)
    }, [])

    // Request webcam
    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
            streamRef.current = stream
            setCameraActive(true)
            setCameraError(null)
        } catch {
            setCameraError("Camera permission denied. Please allow access in your browser settings.")
            setCameraActive(false)
        }
    }, [])

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop())
            streamRef.current = null
        }
        if (videoRef.current) videoRef.current.srcObject = null
        setCameraActive(false)
    }, [])

    // Attach stream to video element after render
    useEffect(() => {
        if (cameraActive && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current
        }
    }, [cameraActive])

    // Auto-request camera on mount
    useEffect(() => {
        startCamera()
        return () => stopCamera()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function handlePlay() {
        if (!isAuthenticated) {
            toast.error("Please sign in to play")
            return
        }
        router.push("/game")
    }

    function handleLogout() {
        signOut({ redirect: false })
        router.refresh()
    }

    return (
        <div
            className="relative h-[100dvh] overflow-hidden dark:bg-black bg-neutral-200"
            style={{
                backgroundImage: `radial-gradient(circle at 0.5px 0.5px, rgba(255,255,255,0.1) 0.9px, transparent 0)`,
                backgroundSize: "8px 8px",
                backgroundRepeat: "repeat",
            }}
        >
            {/* ===== Navbar ===== */}
            <nav className="flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3 dark:bg-neutral-900/80 bg-white/80 backdrop-blur-md border-b dark:border-white/10 border-black/10 z-40 relative">
                {/* Left: hamburger + logo */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="lg:hidden p-1.5 rounded-lg dark:hover:bg-white/10 hover:bg-black/5 transition-colors"
                    >
                        <IconMenu2 className="w-5 h-5 dark:text-neutral-300 text-neutral-700" />
                    </button>
                    <div className="flex items-center gap-2">
                        <IconChess className="w-6 h-6 text-green-500" />
                        <span className="font-bold text-base sm:text-lg tracking-tight dark:text-white text-neutral-900">Chess</span>
                    </div>
                </div>

                {/* Right: auth area */}
                <div className="flex items-center gap-3">
                    {isAuthenticated ? (
                        <>
                            {/* Profile dropdown */}
                            <div ref={profileRef} className="relative">
                                <button
                                    onClick={() => setProfileOpen(!profileOpen)}
                                    className="flex items-center gap-2 px-2 py-1.5 rounded-xl dark:hover:bg-white/10 hover:bg-black/5 transition-colors"
                                >
                                    {session?.user?.image ? (
                                        <img src={session.user.image} alt="avatar" className="w-8 h-8 rounded-full border dark:border-white/20 border-black/10 object-cover" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center border dark:border-white/10 border-black/10">
                                            <IconUser className="w-4 h-4 text-green-400" />
                                        </div>
                                    )}
                                    <span className="text-sm font-medium dark:text-neutral-300 text-neutral-700 hidden sm:block max-w-[120px] truncate">
                                        {session?.user?.name ?? "Player"}
                                    </span>
                                    <IconChevronDown className={`w-4 h-4 dark:text-neutral-400 text-neutral-500 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
                                </button>

                                {/* Dropdown menu */}
                                {profileOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-56 rounded-xl dark:bg-neutral-900 bg-white border dark:border-white/10 border-black/10 shadow-2xl backdrop-blur-md overflow-hidden z-50">
                                        <div className="px-4 py-3 border-b dark:border-white/5 border-black/5">
                                            <p className="text-sm font-semibold dark:text-white text-neutral-900 truncate">{session?.user?.name}</p>
                                            <p className="text-xs dark:text-neutral-500 text-neutral-400 truncate">{session?.user?.email}</p>
                                        </div>
                                        <div className="py-1">
                                            {[
                                                { icon: IconUser, label: "Profile", href: "#" },
                                                { icon: IconHistory, label: "Game History", href: "#" },
                                                { icon: IconSettings, label: "Settings", href: "#" },
                                            ].map((item) => (
                                                <Link
                                                    key={item.label}
                                                    href={item.href}
                                                    onClick={() => setProfileOpen(false)}
                                                    className="flex items-center gap-3 px-4 py-2.5 text-sm dark:text-neutral-300 text-neutral-700 dark:hover:bg-white/5 hover:bg-black/5 transition-colors"
                                                >
                                                    <item.icon className="w-4 h-4 dark:text-neutral-500 text-neutral-400" />
                                                    {item.label}
                                                </Link>
                                            ))}
                                        </div>
                                        <div className="border-t dark:border-white/5 border-black/5 py-1">
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                                            >
                                                <IconLogout className="w-4 h-4" />
                                                Sign Out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link
                                href="/signin"
                                className="px-4 py-2 text-sm font-medium rounded-xl dark:text-neutral-300 text-neutral-700 dark:hover:bg-white/10 hover:bg-black/5 transition-colors"
                            >
                                Sign In
                            </Link>
                            <Link
                                href="/signup"
                                className="px-4 py-2 text-sm font-semibold rounded-xl bg-green-500 text-neutral-900 hover:bg-green-400 transition-colors shadow-md"
                            >
                                Sign Up
                            </Link>
                        </div>
                    )}
                </div>
            </nav>

            {/* ===== Main Area ===== */}
            <div className="flex h-[calc(100dvh-53px)]">

                {/* ── Sidebar (desktop: always visible, mobile: overlay) ── */}
                {/* Mobile overlay backdrop */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                <aside className={`
                    fixed lg:static top-0 left-0 z-50 lg:z-auto
                    h-full w-64 lg:w-56 xl:w-64
                    dark:bg-neutral-900/95 bg-white/95 lg:dark:bg-neutral-900/80 lg:bg-neutral-100/80
                    backdrop-blur-md border-r dark:border-white/5 border-black/5
                    flex flex-col
                    transition-transform duration-300 ease-in-out
                    ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
                `}>
                    {/* Mobile close button */}
                    <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b dark:border-white/5 border-black/5">
                        <span className="font-bold dark:text-white text-neutral-900">Menu</span>
                        <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-lg dark:hover:bg-white/10 hover:bg-black/5">
                            <IconX className="w-5 h-5 dark:text-neutral-400 text-neutral-500" />
                        </button>
                    </div>

                    {/* Sidebar items */}
                    <nav className="flex-1 py-4 px-3 flex flex-col gap-1 overflow-y-auto">
                        {SIDEBAR_ITEMS.map((item) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                                    item.active
                                        ? "dark:bg-green-500/10 bg-green-500/10 text-green-500 border border-green-500/20"
                                        : "dark:text-neutral-400 text-neutral-600 dark:hover:bg-white/5 hover:bg-black/5 dark:hover:text-neutral-200 hover:text-neutral-800"
                                }`}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Sidebar bottom: user info or login */}
                    <div className="border-t dark:border-white/5 border-black/5 p-3">
                        {isAuthenticated ? (
                            <div className="flex items-center gap-3 px-2 py-2">
                                {session?.user?.image ? (
                                    <img src={session.user.image} alt="" className="w-8 h-8 rounded-full border dark:border-white/20 border-black/10 object-cover" />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center border dark:border-white/10 border-black/10">
                                        <IconUser className="w-4 h-4 text-green-400" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium dark:text-white text-neutral-900 truncate">{session?.user?.name}</p>
                                    <p className="text-[10px] dark:text-neutral-500 text-neutral-400 truncate">{session?.user?.email}</p>
                                </div>
                            </div>
                        ) : (
                            <Link
                                href="/signin"
                                className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-xl bg-green-500 text-neutral-900 text-sm font-semibold hover:bg-green-400 transition-colors"
                            >
                                Sign In to Play
                            </Link>
                        )}
                    </div>
                </aside>

                {/* ── Main Content ── */}
                <main className="flex-1 overflow-y-auto">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

                        {/* Title */}
                        <div className="text-center mb-8 sm:mb-12">
                            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight dark:text-white text-neutral-900 mb-2">
                                Game Lobby
                            </h1>
                            <p className="text-sm sm:text-base dark:text-neutral-400 text-neutral-600">
                                Set up your camera and find a match
                            </p>
                            <div className="mt-3 flex justify-center">
                                <PlayersOnline />
                            </div>
                        </div>

                        {/* Webcam + Play Section */}
                        <div className={`grid grid-cols-1 gap-6 lg:gap-6 items-start ${isAuthenticated ? "lg:grid-cols-[240px_1fr_280px]" : "lg:grid-cols-[1fr_320px]"}`}>

                            {/* Left: Quick Actions (only when authenticated) */}
                            {isAuthenticated && (
                                <div className="order-2 lg:order-1 rounded-2xl dark:bg-neutral-900/80 bg-white/80 border dark:border-white/10 border-black/10 p-4 backdrop-blur-md shadow-lg self-center">
                                    <h3 className="text-xs font-semibold uppercase tracking-wider dark:text-neutral-500 text-neutral-400 mb-3">Quick Actions</h3>
                                    <div className="flex flex-col gap-1.5">
                                        {[
                                            { icon: IconTrophy, label: "Leaderboard", color: "text-yellow-400" },
                                            { icon: IconHistory, label: "Game History", color: "dark:text-neutral-400 text-neutral-500" },
                                            { icon: IconUsers, label: "Find Friends", color: "text-blue-400" },
                                        ].map((action) => (
                                            <button
                                                key={action.label}
                                                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl dark:hover:bg-white/5 hover:bg-black/5 transition-colors text-left"
                                            >
                                                <action.icon className={`w-4.5 h-4.5 ${action.color}`} />
                                                <span className="text-sm dark:text-neutral-300 text-neutral-700">{action.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Center: Webcam Box */}
                            <div className={`order-1 lg:order-2 flex flex-col items-center ${isAuthenticated ? "self-center" : ""}`}>
                                <div className="relative w-full max-w-xl aspect-video rounded-2xl overflow-hidden dark:bg-neutral-900 bg-neutral-100 border dark:border-white/10 border-black/10 shadow-xl mx-auto">
                                    {/* Glow */}
                                    <div className="absolute -top-20 -left-20 w-60 h-60 bg-green-500 rounded-full blur-[120px] opacity-15 pointer-events-none" />
                                    <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-green-400 rounded-full blur-[120px] opacity-10 pointer-events-none" />

                                    {cameraActive ? (
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            playsInline
                                            muted
                                            className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                            <div className="w-16 h-16 rounded-full dark:bg-neutral-800 bg-neutral-200 flex items-center justify-center">
                                                <IconCameraOff className="w-8 h-8 dark:text-neutral-600 text-neutral-400" />
                                            </div>
                                            {cameraError ? (
                                                <div className="text-center px-6">
                                                    <p className="text-sm dark:text-neutral-400 text-neutral-600 mb-3">{cameraError}</p>
                                                    <button
                                                        onClick={startCamera}
                                                        className="px-4 py-2 text-sm font-medium rounded-xl bg-green-500 text-neutral-900 hover:bg-green-400 transition-colors"
                                                    >
                                                        Try Again
                                                    </button>
                                                </div>
                                            ) : (
                                                <p className="text-sm dark:text-neutral-500 text-neutral-400">Requesting camera access...</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Camera toggle button — always visible at bottom center */}
                                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
                                        {cameraActive ? (
                                            <button
                                                onClick={stopCamera}
                                                className="p-2.5 rounded-full bg-red-500/80 hover:bg-red-500 text-white backdrop-blur-sm transition-colors shadow-lg"
                                                title="Turn off camera"
                                            >
                                                <IconCameraOff className="w-5 h-5" />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={startCamera}
                                                className="p-2.5 rounded-full bg-green-500/80 hover:bg-green-500 text-neutral-900 backdrop-blur-sm transition-colors shadow-lg"
                                                title="Turn on camera"
                                            >
                                                <IconCamera className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Live indicator */}
                                    {cameraActive && (
                                        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-lg dark:bg-black/60 bg-white/70 backdrop-blur-sm z-10">
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                            <span className="text-[10px] font-semibold dark:text-green-400 text-green-600">CAMERA ON</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Side: Account or Auth */}
                            <div className="order-3 w-full flex flex-col gap-4 self-center">
                                {isAuthenticated ? (
                                    /* Player Card */
                                    <div className="rounded-2xl dark:bg-neutral-900/80 bg-white/80 border dark:border-white/10 border-black/10 p-5 backdrop-blur-md shadow-xl">
                                        <div className="flex items-center gap-3 mb-4">
                                            {session?.user?.image ? (
                                                <img src={session.user.image} alt="" className="w-12 h-12 rounded-full border-2 border-green-500/30 object-cover" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center border-2 border-green-500/30">
                                                    <IconUser className="w-6 h-6 text-green-400" />
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-bold dark:text-white text-neutral-900">{session?.user?.name ?? "Player"}</p>
                                                <p className="text-xs dark:text-neutral-500 text-neutral-400">Ready to play</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 mb-4">
                                            {[
                                                { label: "Rating", value: "500" },
                                                { label: "Wins", value: "0" },
                                                { label: "Games", value: "0" },
                                            ].map((stat) => (
                                                <div key={stat.label} className="text-center rounded-xl dark:bg-neutral-800/60 bg-neutral-100 p-2 border dark:border-white/5 border-black/5">
                                                    <p className="text-base font-bold dark:text-white text-neutral-900">{stat.value}</p>
                                                    <p className="text-[9px] dark:text-neutral-500 text-neutral-400 uppercase tracking-wider">{stat.label}</p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Play Button */}
                                        <button
                                            onClick={handlePlay}
                                            className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl bg-green-500 hover:bg-green-400 text-neutral-900 font-bold text-base tracking-wide transition-all shadow-xl hover:shadow-green-500/20 active:scale-[0.98]"
                                        >
                                            <IconPlayerPlay className="w-5 h-5" />
                                            Play Now
                                        </button>
                                    </div>
                                ) : (
                                    /* Not signed in: show auth options */
                                    <div className="rounded-2xl dark:bg-neutral-900/80 bg-white/80 border dark:border-white/10 border-black/10 p-6 backdrop-blur-md shadow-xl">
                                        <div className="text-center mb-6">
                                            <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
                                                <IconChess className="w-8 h-8 text-green-500" />
                                            </div>
                                            <h2 className="text-xl font-bold dark:text-white text-neutral-900 mb-1">Sign In to Play</h2>
                                            <p className="text-sm dark:text-neutral-400 text-neutral-600">Create an account or sign in to start playing</p>
                                        </div>

                                        <div className="flex flex-col gap-3">
                                            <Link
                                                href="/signin"
                                                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-500 hover:bg-green-400 text-neutral-900 font-semibold text-sm transition-colors shadow-md"
                                            >
                                                Sign In
                                            </Link>
                                            <Link
                                                href="/signup"
                                                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border dark:border-white/10 border-black/10 dark:text-white text-neutral-900 font-semibold text-sm dark:hover:bg-white/5 hover:bg-black/5 transition-colors"
                                            >
                                                Create Account
                                            </Link>

                                            <div className="flex items-center gap-3 my-2">
                                                <div className="h-[1px] flex-1 dark:bg-neutral-700 bg-neutral-300" />
                                                <span className="text-[10px] dark:text-neutral-500 text-neutral-400 uppercase font-medium">or</span>
                                                <div className="h-[1px] flex-1 dark:bg-neutral-700 bg-neutral-300" />
                                            </div>

                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => signIn("google", { callbackUrl: "/lobby" })}
                                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border dark:border-white/10 border-black/10 dark:hover:bg-white/5 hover:bg-black/5 transition-colors text-sm font-medium dark:text-neutral-300 text-neutral-700"
                                                >
                                                    <IconBrandGoogle className="w-5 h-5" />
                                                    Google
                                                </button>
                                                <button
                                                    onClick={() => signIn("github", { callbackUrl: "/lobby" })}
                                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border dark:border-white/10 border-black/10 dark:hover:bg-white/5 hover:bg-black/5 transition-colors text-sm font-medium dark:text-neutral-300 text-neutral-700"
                                                >
                                                    <IconBrandGithub className="w-5 h-5" />
                                                    GitHub
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>


                    </div>
                </main>
            </div>
        </div>
    )
}
