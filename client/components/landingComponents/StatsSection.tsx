'use client'
import { motion, useInView } from "motion/react";
import { useRef, useEffect, useState } from "react";

function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true });
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!isInView) return;
        let start = 0;
        const duration = 1500;
        const step = target / (duration / 16);
        const timer = setInterval(() => {
            start += step;
            if (start >= target) {
                setCount(target);
                clearInterval(timer);
            } else {
                setCount(Math.floor(start));
            }
        }, 16);
        return () => clearInterval(timer);
    }, [isInView, target]);

    return (
        <span ref={ref}>
            {count.toLocaleString()}{suffix}
        </span>
    );
}

const stats = [
    { value: 12400, suffix: "+", label: "Games Played" },
    { value: 3200, suffix: "+", label: "Players Worldwide" },
    { value: 890, suffix: "+", label: "Friendships Made" },
    { value: 47, suffix: "", label: "Countries" },
];

export default function StatsSection() {
    return (
        <section className="relative py-20 dark:bg-neutral-950 bg-neutral-100">
            <div className="max-w-6xl mx-auto px-5">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="rounded-2xl dark:bg-gradient-to-r dark:from-green-950/40 dark:to-emerald-950/40 bg-gradient-to-r from-green-50 to-emerald-50 border dark:border-green-500/10 border-green-500/20 p-8 md:p-12"
                >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
                        {stats.map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: i * 0.1 }}
                                className="text-center"
                            >
                                <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-green-500">
                                    <AnimatedNumber target={stat.value} suffix={stat.suffix} />
                                </div>
                                <p className="mt-2 text-sm md:text-base text-neutral-500 dark:text-neutral-400 font-medium">
                                    {stat.label}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
