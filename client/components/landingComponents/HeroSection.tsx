import Link from "next/link";
import Button from "../ui/Button";
import StartAnimation from "../animation/StartAnimation";
import { IconBrandGithub, IconStarFilled, IconChess, IconVideo, IconMessage } from "@tabler/icons-react";
import PlayersOnline from "./PlayersOnline";

export default function HeroSection() {
    return (
        <section
            className="relative min-h-screen overflow-hidden dark:bg-black bg-neutral-200"
            style={{
                backgroundImage: `radial-gradient(circle at 0.5px 0.5px, rgba(255,255,255,0.1) 0.9px, transparent 0)`,
                backgroundSize: "8px 8px",
                backgroundRepeat: 'repeat',
            }}
        >
            <div className="relative max-w-6xl mx-auto py-42 [overflow-anchor:none]">
                <div className="relative flex justify-center items-center gap-5 flex-col z-5">
                    <StartAnimation>
                        <div className="flex items-center flex-col gap-3 text-center px-4">
                            <p className="px-4 md:text-[16px] text-[12px] font-medium py-1 rounded-4xl inline-flex bg-gradient-to-r from-green-400 to-emerald-600 dark:text-neutral-900 text-neutral-900 shadow-2xl">
                                Chess meets video dating ♟️💚
                            </p>
                            <h1 className="font-bold lg:text-7xl md:text-6xl text-4xl max-w-5xl pt-3 tracking-tighter">
                                Play Chess. Meet People.<br className="hidden md:block" /> Make Real Connections.
                            </h1>
                            <p className="mt-4 md:max-w-3xl max-w-[340px] md:text-lg text-[14px] text-neutral-600 dark:text-neutral-400">
                                The only platform where you play live chess over video call with strangers — make friends, find rivals, or maybe even find your match.
                            </p>

                            {/* Mini feature pills */}
                            <div className="flex flex-wrap justify-center gap-3 mt-4">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium dark:bg-white/10 bg-black/5 dark:text-neutral-300 text-neutral-600 border dark:border-white/10 border-black/10">
                                    <IconChess className="w-3.5 h-3.5" /> Live Chess
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium dark:bg-white/10 bg-black/5 dark:text-neutral-300 text-neutral-600 border dark:border-white/10 border-black/10">
                                    <IconVideo className="w-3.5 h-3.5" /> Video Call
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium dark:bg-white/10 bg-black/5 dark:text-neutral-300 text-neutral-600 border dark:border-white/10 border-black/10">
                                    <IconMessage className="w-3.5 h-3.5" /> Live Chat
                                </span>
                            </div>

                            <div className="flex md:gap-8 gap-6">
                                <Button className="my-8 px-8 py-3 bg-green-500 md:text-2xl text-lg font-semibold text-neutral-900 rounded-xl">
                                    <Link href={"/game"}>Play Now — It&apos;s Free</Link>
                                </Button>
                                <Button className="my-8 px-8 py-3 md:text-2xl text-lg text-neutral-900 rounded-xl flex justify-center items-center">
                                    <Link href={"https://github.com/ayush24k/chess"} target="_blank" className="flex items-center justify-center gap-2">
                                        <IconStarFilled className="h-4 w-4" /><IconBrandGithub />
                                    </Link>
                                </Button>
                            </div>

                            {/* Live player count */}
                            <PlayersOnline />
                        </div>
                    </StartAnimation>

                    {/* Hero visual — board mockup */}
                    <div className="relative w-[90%] max-w-4xl">
                        <div className="lg:h-[520px] md:h-[420px] sm:h-[340px] h-[240px] rounded-2xl border dark:border-white/10 border-black/10 dark:bg-neutral-900/60 bg-white/60 backdrop-blur-sm overflow-hidden shadow-2xl grid grid-cols-3 gap-0">
                            {/* Left panel mock */}
                            <div className="hidden md:flex flex-col gap-3 p-4 dark:bg-neutral-900/80 bg-neutral-100/80 border-r dark:border-white/5 border-black/5">
                                <div className="w-full aspect-video rounded-lg dark:bg-neutral-800 bg-neutral-200 animate-pulse" />
                                <div className="w-full aspect-video rounded-lg dark:bg-neutral-800 bg-neutral-200 animate-pulse" />
                                <div className="flex-1 rounded-lg dark:bg-neutral-800 bg-neutral-200 animate-pulse" />
                            </div>
                            {/* Center board mock */}
                            <div className="col-span-3 md:col-span-1 flex items-center justify-center p-4">
                                <div className="w-full aspect-square max-w-[280px] grid grid-cols-8 grid-rows-8 rounded-lg overflow-hidden shadow-lg">
                                    {Array.from({ length: 64 }).map((_, i) => {
                                        const row = Math.floor(i / 8);
                                        const col = i % 8;
                                        const isLight = (row + col) % 2 === 0;
                                        return (
                                            <div
                                                key={i}
                                                className={isLight ? "bg-amber-100 dark:bg-amber-200" : "bg-green-700 dark:bg-green-800"}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                            {/* Right panel mock */}
                            <div className="hidden md:flex flex-col gap-3 p-4 dark:bg-neutral-900/80 bg-neutral-100/80 border-l dark:border-white/5 border-black/5">
                                <div className="h-8 w-24 rounded-md dark:bg-neutral-800 bg-neutral-200 animate-pulse" />
                                <div className="flex-1 rounded-lg dark:bg-neutral-800 bg-neutral-200 animate-pulse" />
                                <div className="h-8 w-full rounded-md dark:bg-neutral-800 bg-neutral-200 animate-pulse" />
                            </div>
                        </div>

                        {/* Floating labels */}
                        <div className="absolute -top-3 -left-2 md:left-4 px-3 py-1 rounded-full bg-green-500 text-neutral-900 text-xs font-bold shadow-lg">
                            LIVE
                        </div>
                    </div>
                </div>
            </div>

            {/* bg gradient */}
            <div className="dark:block hidden">
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-green-400 rounded-full blur-[400px] md:opacity-100 opacity-50"></div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-green-500 rounded-full blur-[100px] md:opacity-60 opacity-20"></div>
            </div>
        </section>
    )
}