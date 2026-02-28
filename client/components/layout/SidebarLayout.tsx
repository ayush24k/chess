'use client'

import { useState, useRef, useEffect } from "react"
import { useSession, signOut, signIn } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import {
    IconUser,
    IconLogout,
    IconChevronDown,
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

const SIDEBAR_ITEMS = [
    { icon: IconHome, label: "Lobby", href: "/lobby" },
    { icon: IconUser, label: "Profile", href: "/profile" },
    { icon: IconHistory, label: "Game History", href: "/history" },
    { icon: IconTrophy, label: "Leaderboard", href: "/leaderboard" },
    { icon: IconChartBar, label: "Statistics", href: "/statistics" },
    { icon: IconUsers, label: "Friends", href: "/friends" },
    { icon: IconSettings, label: "Settings", href: "/settings" },
]

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession()
    const router = useRouter()
    const pathname = usePathname()
    const isAuthenticated = status === "authenticated"

    const [profileOpen, setProfileOpen] = useState(false)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const profileRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setProfileOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClick)
        return () => document.removeEventListener("mousedown", handleClick)
    }, [])

    function handleLogout() {
        signOut({ redirect: false })
        router.push("/")
    }

    return (
        <div className="relative h-[100dvh] overflow-hidden dark:bg-black bg-neutral-200"
            style={{
                backgroundImage: `radial-gradient(circle at 0.5px 0.5px, rgba(255,255,255,0.1) 0.9px, transparent 0)`,
                backgroundSize: "8px 8px",
                backgroundRepeat: "repeat",
            }}
        >
            {/* Navbar */}
            <nav className="flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3 dark:bg-neutral-900/80 bg-white/80 backdrop-blur-md border-b dark:border-white/10 border-black/10 z-40 relative">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="lg:hidden p-1.5 rounded-lg dark:hover:bg-white/10 hover:bg-black/5 transition-colors"
                    >
                        <IconMenu2 className="w-5 h-5 dark:text-neutral-300 text-neutral-700" />
                    </button>
                    <Link href="/lobby" className="flex items-center gap-2">
                        <IconChess className="w-6 h-6 text-green-500" />
                        <span className="font-bold text-base sm:text-lg tracking-tight dark:text-white text-neutral-900">Chess</span>
                    </Link>
                </div>

                <div className="flex items-center gap-3">
                    {isAuthenticated ? (
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

                            {profileOpen && (
                                <div className="absolute right-0 top-full mt-2 w-56 rounded-xl dark:bg-neutral-900 bg-white border dark:border-white/10 border-black/10 shadow-2xl backdrop-blur-md overflow-hidden z-50">
                                    <div className="px-4 py-3 border-b dark:border-white/5 border-black/5">
                                        <p className="text-sm font-semibold dark:text-white text-neutral-900 truncate">{session?.user?.name}</p>
                                        <p className="text-xs dark:text-neutral-500 text-neutral-400 truncate">{session?.user?.email}</p>
                                    </div>
                                    <div className="py-1">
                                        {[
                                            { icon: IconUser, label: "Profile", href: "/profile" },
                                            { icon: IconHistory, label: "Game History", href: "/history" },
                                            { icon: IconSettings, label: "Settings", href: "/settings" },
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
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link href="/signin" className="px-4 py-2 text-sm font-medium rounded-xl dark:text-neutral-300 text-neutral-700 dark:hover:bg-white/10 hover:bg-black/5 transition-colors">
                                Sign In
                            </Link>
                            <Link href="/signup" className="px-4 py-2 text-sm font-semibold rounded-xl bg-green-500 text-neutral-900 hover:bg-green-400 transition-colors shadow-md">
                                Sign Up
                            </Link>
                        </div>
                    )}
                </div>
            </nav>

            {/* Main Area */}
            <div className="flex h-[calc(100dvh-53px)]">
                {/* Mobile overlay */}
                {sidebarOpen && (
                    <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
                )}

                {/* Sidebar */}
                <aside className={`
                    fixed lg:static top-0 left-0 z-50 lg:z-auto
                    h-full w-64 lg:w-56 xl:w-64
                    dark:bg-neutral-900/95 bg-white/95 lg:dark:bg-neutral-900/80 lg:bg-neutral-100/80
                    backdrop-blur-md border-r dark:border-white/5 border-black/5
                    flex flex-col
                    transition-transform duration-300 ease-in-out
                    ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
                `}>
                    <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b dark:border-white/5 border-black/5">
                        <span className="font-bold dark:text-white text-neutral-900">Menu</span>
                        <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-lg dark:hover:bg-white/10 hover:bg-black/5">
                            <IconX className="w-5 h-5 dark:text-neutral-400 text-neutral-500" />
                        </button>
                    </div>

                    <nav className="flex-1 py-4 px-3 flex flex-col gap-1 overflow-y-auto">
                        {SIDEBAR_ITEMS.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                                        isActive
                                            ? "dark:bg-green-500/10 bg-green-500/10 text-green-500 border border-green-500/20"
                                            : "dark:text-neutral-400 text-neutral-600 dark:hover:bg-white/5 hover:bg-black/5 dark:hover:text-neutral-200 hover:text-neutral-800"
                                    }`}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.label}
                                </Link>
                            )
                        })}
                    </nav>

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

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}
