'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import Button from "@/components/ui/Button";
import Navbar from "@/components/landingComponents/Navbar";
import { IconBrandGithub, IconBrandGoogle, IconLoader2 } from "@tabler/icons-react";
import { useToast } from "@/components/ui/Toast";

export default function SignIn() {
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const toast = useToast();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!identifier || !password) {
            toast.error("All fields are required");
            return;
        }

        setLoading(true);

        try {
            const res = await signIn("credentials", {
                identifier,
                password,
                redirect: false,
            });

            if (res?.error) {
                toast.error(res.error === "CredentialsSignin" ? "Invalid email/username or password" : res.error);
            } else {
                toast.success("Signed in successfully!");
                router.push("/game");
            }
        } catch {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    async function handleOAuth(provider: string) {
        await signIn(provider, { callbackUrl: "/game" });
    }

    return (
        <section
            className="relative flex flex-col min-h-screen overflow-hidden dark:bg-black bg-neutral-200"
            style={{
                backgroundImage: `radial-gradient(circle at 0.5px 0.5px, rgba(255,255,255,0.1) 0.9px, transparent 0)`,
                backgroundSize: "8px 8px",
                backgroundRepeat: 'repeat',
            }}
        >
            <Navbar />

            <div className="relative z-10 flex flex-1 items-center justify-center pt-20 py-10 px-4">
                <div className="w-full max-w-md p-8 rounded-2xl md:rounded-3xl backdrop-blur-md dark:bg-black/60 bg-white/60 shadow-2xl border-[1px] dark:border-white/20 border-black/20 text-center">
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome Back</h1>
                    <p className="text-sm dark:text-neutral-400 text-neutral-600 mb-8">
                        Enter your credentials to access your account
                    </p>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
                        <div>
                            <label className="block text-sm font-medium mb-1">Email or Username</label>
                            <input
                                type="text"
                                placeholder="pawn@example.com or grandmaster99"
                                value={identifier}
                                onChange={e => setIdentifier(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Password</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                            />
                        </div>

                        <div className="flex justify-end text-sm">
                            <Link href="#" className="text-green-600 hover:text-green-500 dark:text-green-400 transition-colors">
                                Forgot password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2"
                        >
                            <Button className="w-full py-3 rounded-xl text-center flex justify-center items-center gap-2 text-lg font-semibold">
                                {loading && <IconLoader2 className="w-5 h-5 animate-spin" />}
                                {loading ? "Signing In..." : "Sign In"}
                            </Button>
                        </button>

                        <div className="flex items-center gap-4 mt-2">
                            <div className="h-[1px] flex-1 bg-neutral-300 dark:bg-neutral-700"></div>
                            <span className="text-xs text-neutral-500 uppercase font-medium">Or continue with</span>
                            <div className="h-[1px] flex-1 bg-neutral-300 dark:bg-neutral-700"></div>
                        </div>

                        <div className="flex gap-4">
                            <button type="button" onClick={() => handleOAuth("google")} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-white/50 dark:hover:bg-black/50 transition-all text-sm font-medium">
                                <IconBrandGoogle className="w-5 h-5" />
                                Google
                            </button>
                            <button type="button" onClick={() => handleOAuth("github")} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-white/50 dark:hover:bg-black/50 transition-all text-sm font-medium">
                                <IconBrandGithub className="w-5 h-5" />
                                GitHub
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 text-sm dark:text-neutral-400 text-neutral-600">
                        Don&apos;t have an account?{" "}
                        <Link href="/signup" className="text-green-600 hover:text-green-500 dark:text-green-400 font-medium transition-colors">
                            Sign up here
                        </Link>
                    </div>
                </div>
            </div>

            {/* Background glowing orbs */}
            <div className="dark:block hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 -translate-x-1/2 w-[400px] h-[400px] bg-green-500 rounded-full blur-[200px] opacity-30"></div>
                <div className="absolute bottom-1/4 right-1/4 translate-x-1/4 w-[500px] h-[500px] bg-green-400 rounded-full blur-[250px] opacity-20"></div>
            </div>
        </section>
    );
}