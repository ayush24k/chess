'use client'

import { useState, useEffect, useRef } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
    IconX,
    IconBrandGoogle,
    IconBrandGithub,
    IconLoader2,
    IconChess,
} from "@tabler/icons-react"
import { useToast } from "@/components/ui/Toast"

type Mode = "signin" | "signup"

interface AuthModalProps {
    mode: Mode
    onClose: () => void
    onSwitchMode: (mode: Mode) => void
}

export default function AuthModal({ mode, onClose, onSwitchMode }: AuthModalProps) {
    const router = useRouter()
    const toast = useToast()
    const overlayRef = useRef<HTMLDivElement>(null)

    // Sign-in fields
    const [identifier, setIdentifier] = useState("")
    const [password, setPassword] = useState("")

    // Sign-up fields
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [signupPassword, setSignupPassword] = useState("")

    const [loading, setLoading] = useState(false)

    // Reset fields when mode changes
    useEffect(() => {
        setIdentifier("")
        setPassword("")
        setUsername("")
        setEmail("")
        setSignupPassword("")
        setLoading(false)
    }, [mode])

    // Close on Escape key
    useEffect(() => {
        function handleKey(e: KeyboardEvent) {
            if (e.key === "Escape") onClose()
        }
        document.addEventListener("keydown", handleKey)
        return () => document.removeEventListener("keydown", handleKey)
    }, [onClose])

    function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
        if (e.target === overlayRef.current) onClose()
    }

    async function handleSignIn(e: React.FormEvent) {
        e.preventDefault()
        if (!identifier || !password) {
            toast.error("All fields are required")
            return
        }
        setLoading(true)
        try {
            const res = await signIn("credentials", {
                identifier,
                password,
                redirect: false,
            })
            if (res?.error) {
                toast.error(res.error === "CredentialsSignin" ? "Invalid email/username or password" : res.error)
            } else {
                toast.success("Signed in successfully!")
                onClose()
                router.refresh()
            }
        } catch {
            toast.error("Something went wrong. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    async function handleSignUp(e: React.FormEvent) {
        e.preventDefault()
        if (!username || !email || !signupPassword) {
            toast.error("All fields are required")
            return
        }
        if (signupPassword.length < 6) {
            toast.error("Password must be at least 6 characters")
            return
        }
        setLoading(true)
        try {
            const res = await fetch("/api/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password: signupPassword }),
            })
            const data = await res.json()
            if (!res.ok) {
                toast.error(data.error || "Signup failed")
                setLoading(false)
                return
            }
            toast.success("Account created! Signing you in...")
            const signInRes = await signIn("credentials", {
                identifier: email,
                password: signupPassword,
                redirect: false,
            })
            if (signInRes?.error) {
                toast.warning("Account created but auto-login failed. Please sign in.")
                onSwitchMode("signin")
            } else {
                onClose()
                router.refresh()
            }
        } catch {
            toast.error("Something went wrong. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    async function handleOAuth(provider: string) {
        await signIn(provider, { callbackUrl: "/lobby" })
    }

    return (
        <div
            ref={overlayRef}
            onClick={handleOverlayClick}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
        >
            <div className="relative w-full max-w-md rounded-2xl dark:bg-neutral-900 bg-white border dark:border-white/10 border-black/10 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b dark:border-white/5 border-black/5">
                    <div className="flex items-center gap-2">
                        <IconChess className="w-5 h-5 text-green-500" />
                        <h2 className="text-lg font-bold dark:text-white text-neutral-900">
                            {mode === "signin" ? "Welcome Back" : "Create Account"}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg dark:hover:bg-white/10 hover:bg-black/5 transition-colors"
                    >
                        <IconX className="w-5 h-5 dark:text-neutral-400 text-neutral-500" />
                    </button>
                </div>

                <div className="px-6 py-5">
                    {/* OAuth buttons */}
                    <div className="flex gap-3 mb-5">
                        <button
                            type="button"
                            onClick={() => handleOAuth("google")}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border dark:border-white/10 border-black/10 dark:hover:bg-white/5 hover:bg-black/5 transition-colors text-sm font-medium dark:text-neutral-300 text-neutral-700"
                        >
                            <IconBrandGoogle className="w-4 h-4" />
                            Google
                        </button>
                        <button
                            type="button"
                            onClick={() => handleOAuth("github")}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border dark:border-white/10 border-black/10 dark:hover:bg-white/5 hover:bg-black/5 transition-colors text-sm font-medium dark:text-neutral-300 text-neutral-700"
                        >
                            <IconBrandGithub className="w-4 h-4" />
                            GitHub
                        </button>
                    </div>

                    <div className="flex items-center gap-3 mb-5">
                        <div className="h-px flex-1 dark:bg-neutral-800 bg-neutral-200" />
                        <span className="text-xs dark:text-neutral-500 text-neutral-400 uppercase font-medium">or</span>
                        <div className="h-px flex-1 dark:bg-neutral-800 bg-neutral-200" />
                    </div>

                    {/* Sign In Form */}
                    {mode === "signin" && (
                        <form onSubmit={handleSignIn} className="flex flex-col gap-3">
                            <div>
                                <label className="block text-xs font-medium dark:text-neutral-300 text-neutral-700 mb-1">Email or Username</label>
                                <input
                                    type="text"
                                    placeholder="pawn@example.com or grandmaster99"
                                    value={identifier}
                                    onChange={e => setIdentifier(e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border dark:border-neutral-700 border-neutral-300 dark:bg-neutral-800/50 bg-neutral-50 dark:text-white text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium dark:text-neutral-300 text-neutral-700 mb-1">Password</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border dark:border-neutral-700 border-neutral-300 dark:bg-neutral-800/50 bg-neutral-50 dark:text-white text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-500 hover:bg-green-400 text-neutral-900 font-semibold text-sm transition-colors shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {loading && <IconLoader2 className="w-4 h-4 animate-spin" />}
                                {loading ? "Signing In..." : "Sign In"}
                            </button>
                        </form>
                    )}

                    {/* Sign Up Form */}
                    {mode === "signup" && (
                        <form onSubmit={handleSignUp} className="flex flex-col gap-3">
                            <div>
                                <label className="block text-xs font-medium dark:text-neutral-300 text-neutral-700 mb-1">Username</label>
                                <input
                                    type="text"
                                    placeholder="grandmaster99"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border dark:border-neutral-700 border-neutral-300 dark:bg-neutral-800/50 bg-neutral-50 dark:text-white text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium dark:text-neutral-300 text-neutral-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    placeholder="pawn@example.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border dark:border-neutral-700 border-neutral-300 dark:bg-neutral-800/50 bg-neutral-50 dark:text-white text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium dark:text-neutral-300 text-neutral-700 mb-1">Password</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={signupPassword}
                                    onChange={e => setSignupPassword(e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border dark:border-neutral-700 border-neutral-300 dark:bg-neutral-800/50 bg-neutral-50 dark:text-white text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-500 hover:bg-green-400 text-neutral-900 font-semibold text-sm transition-colors shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {loading && <IconLoader2 className="w-4 h-4 animate-spin" />}
                                {loading ? "Creating Account..." : "Create Account"}
                            </button>
                        </form>
                    )}

                    {/* Switch mode */}
                    <p className="mt-5 text-center text-sm dark:text-neutral-500 text-neutral-400">
                        {mode === "signin" ? (
                            <>
                                Don&apos;t have an account?{" "}
                                <button
                                    onClick={() => onSwitchMode("signup")}
                                    className="text-green-500 hover:text-green-400 font-medium transition-colors"
                                >
                                    Sign up
                                </button>
                            </>
                        ) : (
                            <>
                                Already have an account?{" "}
                                <button
                                    onClick={() => onSwitchMode("signin")}
                                    className="text-green-500 hover:text-green-400 font-medium transition-colors"
                                >
                                    Sign in
                                </button>
                            </>
                        )}
                    </p>
                </div>
            </div>
        </div>
    )
}
