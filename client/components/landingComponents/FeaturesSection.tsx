'use client'
import { IconChess, IconVideo, IconMessage, IconUsers, IconTrophy, IconRefresh } from "@tabler/icons-react";
import { motion } from "motion/react";

const features = [
    {
        icon: IconChess,
        title: "Live Chess",
        description: "Play real-time chess with full move validation, drag-and-drop pieces, and move highlighting — powered by chess.js.",
        color: "from-green-400 to-emerald-600",
    },
    {
        icon: IconVideo,
        title: "Peer-to-Peer Video",
        description: "See your opponent face-to-face via WebRTC. Watch their reactions to your brilliant moves — or your blunders.",
        color: "from-blue-400 to-cyan-600",
    },
    {
        icon: IconMessage,
        title: "Live Chat",
        description: "Text chat built right into the game. Send messages, trash-talk, or say gg — all without leaving the board.",
        color: "from-purple-400 to-violet-600",
    },
    {
        icon: IconUsers,
        title: "Instant Matchmaking",
        description: "Hit play and get paired with a random opponent in seconds. Every game is a new face and a new challenge.",
        color: "from-orange-400 to-red-500",
    },
    {
        icon: IconTrophy,
        title: "ELO Rating System",
        description: "Your skill, quantified. Win games to climb the ratings, track your progress, and compete on the leaderboard.",
        color: "from-yellow-400 to-amber-600",
    },
    {
        icon: IconRefresh,
        title: "Instant Rematch",
        description: "Good game? Request a rematch instantly — colors swap, the board resets, and you're back in action in seconds.",
        color: "from-pink-400 to-rose-600",
    },
];

export default function FeaturesSection() {
    return (
        <section className="relative py-24 md:py-32 dark:bg-neutral-950 bg-neutral-100">
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
                        Features
                    </motion.p>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-3xl md:text-5xl font-bold tracking-tight"
                    >
                        More Than Just Chess
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="mt-4 text-neutral-500 dark:text-neutral-400 max-w-2xl mx-auto"
                    >
                        Every feature is built to make online chess feel like sitting across the board from a real person.
                    </motion.p>
                </div>

                {/* Feature cards grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, i) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: i * 0.08 }}
                            className="group relative p-6 rounded-2xl dark:bg-neutral-900/60 bg-white/80 backdrop-blur-sm border dark:border-white/5 border-black/5 hover:border-green-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/5"
                        >
                            {/* Icon */}
                            <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} mb-4 shadow-lg`}>
                                <feature.icon className="w-6 h-6 text-white" />
                            </div>

                            <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                {feature.description}
                            </p>

                            {/* Hover glow */}
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-500/0 to-green-500/0 group-hover:from-green-500/[0.02] group-hover:to-emerald-500/[0.05] transition-all duration-300 pointer-events-none" />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
