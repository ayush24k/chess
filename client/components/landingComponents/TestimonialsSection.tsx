'use client'
import { motion } from "motion/react";
import { IconTrophy, IconRefresh, IconVolume, IconHistory, IconChess, IconVideo } from "@tabler/icons-react";

const experiences = [
    {
        icon: IconVideo,
        title: "Face-to-Face Reactions",
        description: "Watch your opponent's face light up — or crumble — as you execute a brilliant fork or sacrifice. WebRTC powers crystal-clear peer-to-peer video with no middleman.",
        visual: (
            <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl dark:bg-neutral-800 bg-neutral-200 flex items-center justify-center relative overflow-hidden">
                    <IconVideo className="w-6 h-6 dark:text-green-400 text-green-600" />
                    <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                </div>
                <div className="flex flex-col gap-1">
                    <div className="h-2 w-20 rounded-full dark:bg-neutral-700 bg-neutral-300 animate-pulse" />
                    <div className="h-2 w-14 rounded-full dark:bg-neutral-700 bg-neutral-300 animate-pulse" style={{ animationDelay: '0.3s' }} />
                </div>
            </div>
        ),
        color: "from-blue-500 to-cyan-500",
    },
    {
        icon: IconTrophy,
        title: "ELO Rating Tracking",
        description: "Every win and loss adjusts your rating using the ELO system (K=32). Climb the leaderboard, track your progress over time, and see exactly how you stack up.",
        visual: (
            <div className="flex items-center gap-2">
                {[1520, 1485, 1550].map((elo, i) => (
                    <div key={i} className="flex flex-col items-center">
                        <div className={`text-lg font-bold font-mono ${i === 2 ? 'text-green-500' : 'dark:text-neutral-400 text-neutral-500'}`}>
                            {elo}
                        </div>
                        <div className="text-[9px] dark:text-neutral-500 text-neutral-400">
                            {i === 0 ? 'Before' : i === 1 ? 'Opp.' : 'After'}
                        </div>
                    </div>
                ))}
                <div className="ml-1 text-green-500 text-sm font-bold">+30 ↑</div>
            </div>
        ),
        color: "from-yellow-500 to-amber-500",
    },
    {
        icon: IconRefresh,
        title: "Instant Rematch",
        description: "Don't let a great match end. Request a rematch with one click — colors swap, the board resets, and you're playing again in seconds. Your opponent has 15 seconds to accept.",
        visual: (
            <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 rounded-lg bg-green-500 text-neutral-900 text-xs font-bold flex items-center gap-1.5 shadow-md">
                    <IconRefresh className="w-3.5 h-3.5" /> Rematch?
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-6 h-6 rounded-full dark:bg-neutral-700 bg-neutral-300 flex items-center justify-center">
                        <span className="text-[10px] font-bold font-mono dark:text-green-400 text-green-600">15</span>
                    </div>
                    <span className="text-[10px] dark:text-neutral-500 text-neutral-400">sec</span>
                </div>
            </div>
        ),
        color: "from-pink-500 to-rose-500",
    },
    {
        icon: IconVolume,
        title: "Immersive Sound Effects",
        description: "Every move has its own sound — captures, castles, checks, promotions, and game start/end. Audio feedback makes the experience feel alive and responsive.",
        visual: (
            <div className="flex items-end gap-1 h-8">
                {[3, 5, 2, 6, 4, 7, 3, 5, 8, 4].map((h, i) => (
                    <motion.div
                        key={i}
                        className="w-1.5 rounded-full bg-green-500"
                        animate={{ height: [h * 3, h * 5, h * 3] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.08, ease: "easeInOut" }}
                    />
                ))}
            </div>
        ),
        color: "from-purple-500 to-violet-500",
    },
    {
        icon: IconHistory,
        title: "Game History & Stats",
        description: "Every game is saved with the full move history. Review your past matches, analyze your wins and losses, and see your rating trend over time.",
        visual: (
            <div className="flex flex-col gap-1 text-[10px] font-mono">
                <div className="flex gap-2">
                    <span className="dark:text-neutral-500 text-neutral-400">1.</span>
                    <span className="dark:text-neutral-300 text-neutral-600">e4 e5</span>
                </div>
                <div className="flex gap-2">
                    <span className="dark:text-neutral-500 text-neutral-400">2.</span>
                    <span className="dark:text-neutral-300 text-neutral-600">Nf3 Nc6</span>
                </div>
                <div className="flex gap-2">
                    <span className="dark:text-neutral-500 text-neutral-400">3.</span>
                    <span className="text-green-500 font-bold">Bb5 ...</span>
                </div>
            </div>
        ),
        color: "from-green-500 to-emerald-500",
    },
    {
        icon: IconChess,
        title: "Timed Competitive Play",
        description: "10-minute games with live countdown timers for both sides. No stalling, no waiting — just fast-paced chess that keeps the adrenaline flowing.",
        visual: (
            <div className="flex items-center gap-3">
                <div className="px-2.5 py-1 rounded-md dark:bg-neutral-800 bg-neutral-200 font-mono text-sm font-bold dark:text-neutral-300 text-neutral-600">
                    09:42
                </div>
                <div className="text-xs dark:text-neutral-500 text-neutral-400">vs</div>
                <div className="px-2.5 py-1 rounded-md dark:bg-neutral-800 bg-neutral-200 font-mono text-sm font-bold text-red-500">
                    02:15
                </div>
            </div>
        ),
        color: "from-orange-500 to-red-500",
    },
];

export default function TestimonialsSection() {
    return (
        <section className="relative py-24 md:py-32 dark:bg-black bg-neutral-200 overflow-hidden">
            <div className="max-w-6xl mx-auto px-5">
                {/* Section header */}
                <div className="text-center mb-16">
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="text-sm font-semibold uppercase tracking-widest text-green-500 mb-3"
                    >
                        Experience
                    </motion.p>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-3xl md:text-5xl font-bold tracking-tight"
                    >
                        What You&apos;ll Get
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="mt-4 text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto"
                    >
                        Every feature is real. Every animation you see below is what you&apos;ll experience in game.
                    </motion.p>
                </div>

                {/* Experience cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {experiences.map((exp, i) => (
                        <motion.div
                            key={exp.title}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: i * 0.08 }}
                            className="group relative p-6 rounded-2xl dark:bg-neutral-900/60 bg-white/80 backdrop-blur-sm border dark:border-white/5 border-black/5 hover:border-green-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/5 flex flex-col"
                        >
                            {/* Icon + Title */}
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`inline-flex p-2.5 rounded-xl bg-gradient-to-br ${exp.color} shadow-lg`}>
                                    <exp.icon className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="text-lg font-bold">{exp.title}</h3>
                            </div>

                            {/* Description */}
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed flex-1 mb-4">
                                {exp.description}
                            </p>

                            {/* Live visual */}
                            <div className="p-3 rounded-xl dark:bg-neutral-800/50 bg-neutral-100/80 border dark:border-white/5 border-black/5">
                                {exp.visual}
                            </div>

                            {/* Hover glow */}
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-500/0 to-green-500/0 group-hover:from-green-500/[0.02] group-hover:to-emerald-500/[0.05] transition-all duration-300 pointer-events-none" />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
