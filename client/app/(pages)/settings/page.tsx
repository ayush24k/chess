'use client'

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import SidebarLayout from "@/components/layout/SidebarLayout"
import { useToast } from "@/components/ui/Toast"
import {
    IconLoader2,
    IconSettings,
    IconUser,
    IconLock,
    IconDeviceFloppy,
    IconMail,
    IconPalette,
} from "@tabler/icons-react"

export default function SettingsPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const toast = useToast()

    const [user, setUser] = useState<{
        username: string
        email: string
        profilePicture: string | null
        hasPassword: boolean
    } | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Form fields
    const [username, setUsername] = useState("")
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")

    // Theme
    const [theme, setTheme] = useState<"dark" | "light">("dark")

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/signin")
            return
        }
        if (status === "authenticated") {
            fetch("/api/user/me")
                .then(res => res.ok ? res.json() : null)
                .then(data => {
                    if (data?.user) {
                        setUser({
                            username: data.user.username,
                            email: data.user.email,
                            profilePicture: data.user.profilePicture,
                            hasPassword: true, // we can't know for sure from the me endpoint
                        })
                        setUsername(data.user.username)
                    }
                })
                .catch(() => {})
                .finally(() => setLoading(false))

            // Load current theme
            const isDark = document.documentElement.classList.contains("dark")
            setTheme(isDark ? "dark" : "light")
        }
    }, [status, router])

    async function handleSaveProfile(e: React.FormEvent) {
        e.preventDefault()
        if (!username.trim()) {
            toast.error("Username cannot be empty")
            return
        }

        const body: Record<string, string> = {}
        if (username.trim() !== user?.username) body.username = username.trim()

        if (newPassword) {
            if (newPassword !== confirmPassword) {
                toast.error("Passwords don't match")
                return
            }
            if (newPassword.length < 6) {
                toast.error("Password must be at least 6 characters")
                return
            }
            body.currentPassword = currentPassword
            body.newPassword = newPassword
        }

        if (Object.keys(body).length === 0) {
            toast.info("No changes to save")
            return
        }

        setSaving(true)
        try {
            const res = await fetch("/api/user/update", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            })
            const data = await res.json()
            if (res.ok) {
                toast.success(data.message || "Profile updated!")
                if (data.user) {
                    setUser(prev => prev ? { ...prev, username: data.user.username } : prev)
                }
                setCurrentPassword("")
                setNewPassword("")
                setConfirmPassword("")
            } else {
                toast.error(data.error || "Failed to update")
            }
        } catch {
            toast.error("Network error")
        } finally {
            setSaving(false)
        }
    }

    function toggleTheme(newTheme: "dark" | "light") {
        setTheme(newTheme)
        if (newTheme === "dark") {
            document.documentElement.classList.add("dark")
            document.documentElement.classList.remove("light")
            localStorage.setItem("theme", "dark")
        } else {
            document.documentElement.classList.add("light")
            document.documentElement.classList.remove("dark")
            localStorage.setItem("theme", "light")
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
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
                <div className="flex items-center gap-3 mb-6 sm:mb-8">
                    <div className="w-10 h-10 rounded-xl bg-neutral-500/10 flex items-center justify-center">
                        <IconSettings className="w-5 h-5 dark:text-neutral-400 text-neutral-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold dark:text-white text-neutral-900">Settings</h1>
                        <p className="text-sm dark:text-neutral-400 text-neutral-500">Manage your account</p>
                    </div>
                </div>

                {/* Profile Section */}
                <form onSubmit={handleSaveProfile} className="space-y-6">
                    <div className="rounded-2xl dark:bg-neutral-900/80 bg-white/80 border dark:border-white/10 border-black/10 backdrop-blur-md p-5 sm:p-6 shadow-lg">
                        <h3 className="text-base font-semibold dark:text-white text-neutral-900 mb-4 flex items-center gap-2">
                            <IconUser className="w-4.5 h-4.5 dark:text-neutral-400 text-neutral-500" />
                            Profile
                        </h3>

                        <div className="space-y-4">
                            {/* Avatar preview */}
                            <div className="flex items-center gap-4">
                                {user?.profilePicture ? (
                                    <img src={user.profilePicture} alt="" className="w-16 h-16 rounded-full border-2 dark:border-white/10 border-black/10 object-cover" />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center border-2 dark:border-white/10 border-black/10">
                                        <IconUser className="w-8 h-8 text-green-400" />
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm font-medium dark:text-neutral-200 text-neutral-800">{user?.username}</p>
                                    <p className="text-xs dark:text-neutral-500 text-neutral-400">{user?.email}</p>
                                </div>
                            </div>

                            {/* Username */}
                            <div>
                                <label className="text-sm font-medium dark:text-neutral-300 text-neutral-700 mb-1.5 block">Username</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl dark:bg-neutral-800/60 bg-neutral-100 border dark:border-white/10 border-black/10 text-sm dark:text-white text-neutral-900 outline-none focus:ring-1 focus:ring-green-500/30"
                                />
                            </div>

                            {/* Email (read-only) */}
                            <div>
                                <label className="text-sm font-medium dark:text-neutral-300 text-neutral-700 mb-1.5 flex items-center gap-1.5">
                                    <IconMail className="w-3.5 h-3.5" />
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={user?.email || ""}
                                    readOnly
                                    className="w-full px-4 py-2.5 rounded-xl dark:bg-neutral-800/30 bg-neutral-50 border dark:border-white/5 border-black/5 text-sm dark:text-neutral-500 text-neutral-400 cursor-not-allowed"
                                />
                                <p className="text-xs dark:text-neutral-600 text-neutral-400 mt-1">Email cannot be changed</p>
                            </div>
                        </div>
                    </div>

                    {/* Password Section */}
                    <div className="rounded-2xl dark:bg-neutral-900/80 bg-white/80 border dark:border-white/10 border-black/10 backdrop-blur-md p-5 sm:p-6 shadow-lg">
                        <h3 className="text-base font-semibold dark:text-white text-neutral-900 mb-4 flex items-center gap-2">
                            <IconLock className="w-4.5 h-4.5 dark:text-neutral-400 text-neutral-500" />
                            Change Password
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium dark:text-neutral-300 text-neutral-700 mb-1.5 block">Current Password</label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="Enter current password"
                                    className="w-full px-4 py-2.5 rounded-xl dark:bg-neutral-800/60 bg-neutral-100 border dark:border-white/10 border-black/10 text-sm dark:text-white text-neutral-900 placeholder:dark:text-neutral-600 placeholder:text-neutral-400 outline-none focus:ring-1 focus:ring-green-500/30"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium dark:text-neutral-300 text-neutral-700 mb-1.5 block">New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password (min 6 characters)"
                                    className="w-full px-4 py-2.5 rounded-xl dark:bg-neutral-800/60 bg-neutral-100 border dark:border-white/10 border-black/10 text-sm dark:text-white text-neutral-900 placeholder:dark:text-neutral-600 placeholder:text-neutral-400 outline-none focus:ring-1 focus:ring-green-500/30"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium dark:text-neutral-300 text-neutral-700 mb-1.5 block">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    className="w-full px-4 py-2.5 rounded-xl dark:bg-neutral-800/60 bg-neutral-100 border dark:border-white/10 border-black/10 text-sm dark:text-white text-neutral-900 placeholder:dark:text-neutral-600 placeholder:text-neutral-400 outline-none focus:ring-1 focus:ring-green-500/30"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Theme Section */}
                    <div className="rounded-2xl dark:bg-neutral-900/80 bg-white/80 border dark:border-white/10 border-black/10 backdrop-blur-md p-5 sm:p-6 shadow-lg">
                        <h3 className="text-base font-semibold dark:text-white text-neutral-900 mb-4 flex items-center gap-2">
                            <IconPalette className="w-4.5 h-4.5 dark:text-neutral-400 text-neutral-500" />
                            Appearance
                        </h3>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => toggleTheme("dark")}
                                className={`p-4 rounded-xl border text-left transition-colors ${
                                    theme === "dark"
                                        ? "dark:bg-green-500/10 bg-green-500/10 border-green-500/20 ring-1 ring-green-500/30"
                                        : "dark:bg-neutral-800/50 bg-neutral-100 dark:border-white/5 border-black/5 dark:hover:bg-neutral-800 hover:bg-neutral-50"
                                }`}
                            >
                                <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-700 mb-2 flex items-center justify-center">
                                    <div className="w-3 h-3 rounded-full bg-green-500" />
                                </div>
                                <p className="text-sm font-medium dark:text-neutral-200 text-neutral-800">Dark</p>
                                <p className="text-xs dark:text-neutral-500 text-neutral-400">Easy on the eyes</p>
                            </button>
                            <button
                                type="button"
                                onClick={() => toggleTheme("light")}
                                className={`p-4 rounded-xl border text-left transition-colors ${
                                    theme === "light"
                                        ? "dark:bg-green-500/10 bg-green-500/10 border-green-500/20 ring-1 ring-green-500/30"
                                        : "dark:bg-neutral-800/50 bg-neutral-100 dark:border-white/5 border-black/5 dark:hover:bg-neutral-800 hover:bg-neutral-50"
                                }`}
                            >
                                <div className="w-8 h-8 rounded-lg bg-white border border-neutral-300 mb-2 flex items-center justify-center">
                                    <div className="w-3 h-3 rounded-full bg-green-500" />
                                </div>
                                <p className="text-sm font-medium dark:text-neutral-200 text-neutral-800">Light</p>
                                <p className="text-xs dark:text-neutral-500 text-neutral-400">Classic look</p>
                            </button>
                        </div>
                    </div>

                    {/* Save Button */}
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-green-500 text-neutral-900 text-sm font-bold hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                    >
                        {saving ? <IconLoader2 className="w-4 h-4 animate-spin" /> : <IconDeviceFloppy className="w-4 h-4" />}
                        Save Changes
                    </button>
                </form>
            </div>
        </SidebarLayout>
    )
}
