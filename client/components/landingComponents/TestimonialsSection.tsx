'use client'
import { motion } from "motion/react";
import { IconStarFilled } from "@tabler/icons-react";

const testimonials = [
    {
        name: "Alex K.",
        role: "1200 Elo",
        quote: "I came for the chess and stayed for the conversations. Met my best friend here — we play every Thursday now.",
        avatar: "AK",
    },
    {
        name: "Priya M.",
        role: "1450 Elo",
        quote: "Finally a chess app where I can actually see my opponent's face when I fork their queen. The reactions are priceless.",
        avatar: "PM",
    },
    {
        name: "Jordan T.",
        role: "900 Elo",
        quote: "I'm not even that good at chess but the video chat makes every game hilarious. It's like Omegle but way better.",
        avatar: "JT",
    },
    {
        name: "Sakura N.",
        role: "1600 Elo",
        quote: "The dating angle is surprisingly real. Matched with someone over a Sicilian Defense. We've been talking for three months.",
        avatar: "SN",
    },
    {
        name: "Mateo R.",
        role: "1100 Elo",
        quote: "10-minute timers keep things exciting. I've never felt so alive trashtalking someone while down a rook.",
        avatar: "MR",
    },
    {
        name: "Emma L.",
        role: "1350 Elo",
        quote: "Love the clean UI. Drag and drop works perfectly, the move indicators are gorgeous, and video quality is solid.",
        avatar: "EL",
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
                        Community
                    </motion.p>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-3xl md:text-5xl font-bold tracking-tight"
                    >
                        Players Love It
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="mt-4 text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto"
                    >
                        Don&apos;t take our word for it — here&apos;s what our players have to say.
                    </motion.p>
                </div>

                {/* Testimonial cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {testimonials.map((t, i) => (
                        <motion.div
                            key={t.name}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: i * 0.08 }}
                            className="p-6 rounded-2xl dark:bg-neutral-900/60 bg-white/80 backdrop-blur-sm border dark:border-white/5 border-black/5 flex flex-col"
                        >
                            {/* Stars */}
                            <div className="flex gap-0.5 mb-4">
                                {Array.from({ length: 5 }).map((_, j) => (
                                    <IconStarFilled key={j} className="w-4 h-4 text-yellow-500" />
                                ))}
                            </div>

                            {/* Quote */}
                            <p className="text-sm dark:text-neutral-300 text-neutral-600 leading-relaxed flex-1">
                                &ldquo;{t.quote}&rdquo;
                            </p>

                            {/* Author */}
                            <div className="flex items-center gap-3 mt-5 pt-4 border-t dark:border-white/5 border-black/5">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                                    {t.avatar}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">{t.name}</p>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{t.role}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
