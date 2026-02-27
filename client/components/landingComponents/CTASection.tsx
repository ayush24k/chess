'use client'
import Link from "next/link";
import { motion } from "motion/react";
import Button from "../ui/Button";

export default function CTASection() {
    return (
        <section className="relative py-24 md:py-32 dark:bg-neutral-950 bg-neutral-100 overflow-hidden">
            {/* Glow */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[500px] h-[500px] bg-green-500 rounded-full blur-[300px] opacity-10 dark:opacity-15" />
            </div>

            <div className="relative max-w-4xl mx-auto px-5 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <p className="text-sm font-semibold uppercase tracking-widest text-green-500 mb-4">
                        Ready?
                    </p>
                    <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                        Your Next Opponent<br className="hidden md:block" /> Is Waiting
                    </h2>
                    <p className="text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto mb-10 text-lg">
                        Jump in, get matched, and start playing. No downloads, no sign-up walls — just chess, video, and real people.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button className="px-10 py-4 bg-green-500 text-xl font-semibold text-neutral-900 rounded-xl">
                            <Link href="/game">Start Playing Now</Link>
                        </Button>
                        <Link
                            href="https://github.com/ayush24k/chess"
                            target="_blank"
                            className="px-6 py-3 text-sm font-medium dark:text-neutral-400 text-neutral-600 hover:text-green-500 dark:hover:text-green-400 transition-colors underline underline-offset-4"
                        >
                            View on GitHub &rarr;
                        </Link>
                    </div>

                    {/* Trust line */}
                    <p className="mt-10 text-xs text-neutral-400 dark:text-neutral-600">
                        Free to play &bull; No account required &bull; Open source
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
