import Link from "next/link";
import Button from "@/components/ui/Button";
import Navbar from "@/components/landingComponents/Navbar";

export default function SignUp() {
    return (
        <section
            className="relative min-h-screen overflow-hidden dark:bg-black bg-neutral-200"
            style={{
                backgroundImage: `radial-gradient(circle at 0.5px 0.5px, rgba(255,255,255,0.1) 0.9px, transparent 0)`,
                backgroundSize: "8px 8px",
                backgroundRepeat: 'repeat',
            }}
        >
            <Navbar />

            <div className="relative z-10 flex min-h-screen items-center justify-center py-20 px-4">
                <div className="w-full max-w-md p-8 rounded-2xl md:rounded-3xl backdrop-blur-md dark:bg-black/60 bg-white/60 shadow-2xl border-[1px] dark:border-white/20 border-black/20 text-center">
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Create an Account</h1>
                    <p className="text-sm dark:text-neutral-400 text-neutral-600 mb-8">
                        Join to start playing chess with others around the globe
                    </p>

                    <form className="flex flex-col gap-4 text-left">
                        <div>
                            <label className="block text-sm font-medium mb-1">Username</label>
                            <input
                                type="text"
                                placeholder="grandmaster99"
                                className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Email</label>
                            <input
                                type="email"
                                placeholder="pawn@example.com"
                                className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Password</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                            />
                        </div>

                        <Button className="w-full mt-4 py-3 rounded-xl text-center flex justify-center text-lg font-semibold">
                            Create Account
                        </Button>
                    </form>

                    <div className="mt-8 text-sm dark:text-neutral-400 text-neutral-600">
                        Already have an account?{" "}
                        <Link href="/signin" className="text-green-600 hover:text-green-500 dark:text-green-400 font-medium transition-colors">
                            Sign in here
                        </Link>
                    </div>
                </div>
            </div>

            {/* Background glowing orbs */}
            <div className="dark:block hidden pointer-events-none">
                <div className="absolute bottom-1/4 left-1/4 -translate-x-1/2 w-[400px] h-[400px] bg-green-500 rounded-full blur-[200px] opacity-30"></div>
                <div className="absolute top-1/4 right-1/4 translate-x-1/4 w-[500px] h-[500px] bg-green-400 rounded-full blur-[250px] opacity-20"></div>
            </div>
        </section>
    );
}
