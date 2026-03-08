'use client'
import { motion } from "motion/react";
import { IconBrandNextjs, IconBrandTypescript, IconBrandTailwind, IconDatabase, IconBrandNodejs } from "@tabler/icons-react";

const techStack = [
    { name: "Next.js", icon: IconBrandNextjs, label: "Frontend Framework" },
    { name: "TypeScript", icon: IconBrandTypescript, label: "Type Safety" },
    { name: "WebRTC", icon: null, label: "P2P Video", emoji: "📹" },
    { name: "WebSocket", icon: null, label: "Real-time", emoji: "⚡" },
    { name: "chess.js", icon: null, label: "Game Engine", emoji: "♟️" },
    { name: "Prisma", icon: IconDatabase, label: "ORM + PostgreSQL" },
    { name: "Node.js", icon: IconBrandNodejs, label: "Backend" },
    { name: "Tailwind CSS", icon: IconBrandTailwind, label: "Styling" },
];

// Duplicate for infinite scroll
const doubled = [...techStack, ...techStack];

export default function StatsSection() {
    return (
        <section className="relative py-20 dark:bg-neutral-950 bg-neutral-100 overflow-hidden">
            <div className="max-w-6xl mx-auto px-5 mb-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center"
                >
                    <p className="text-sm font-semibold uppercase tracking-widest text-green-500 mb-3">
                        Built With
                    </p>
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                        Modern Tech, Real-Time Experience
                    </h2>
                    <p className="mt-4 text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto">
                        Powered by the technologies that make real-time gaming and peer-to-peer video possible.
                    </p>
                </motion.div>
            </div>

            {/* Infinite scroll marquee */}
            <div className="relative">
                {/* Fade edges */}
                <div className="absolute left-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-r dark:from-neutral-950 from-neutral-100 to-transparent pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-l dark:from-neutral-950 from-neutral-100 to-transparent pointer-events-none" />

                <div className="flex animate-marquee gap-6 w-max">
                    {doubled.map((tech, i) => (
                        <div
                            key={`${tech.name}-${i}`}
                            className="flex items-center gap-3 px-6 py-4 rounded-2xl dark:bg-neutral-900/60 bg-white/80 backdrop-blur-sm border dark:border-white/5 border-black/5 min-w-[200px] hover:border-green-500/30 transition-colors"
                        >
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg flex-shrink-0">
                                {tech.icon ? (
                                    <tech.icon className="w-5 h-5 text-white" />
                                ) : (
                                    <span className="text-lg">{tech.emoji}</span>
                                )}
                            </div>
                            <div>
                                <p className="text-sm font-bold dark:text-white text-neutral-800">{tech.name}</p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">{tech.label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
