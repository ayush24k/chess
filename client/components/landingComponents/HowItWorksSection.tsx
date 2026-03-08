'use client'
import { motion } from "motion/react";
import { IconUserPlus, IconDeviceGamepad2, IconSparkles } from "@tabler/icons-react";

const steps = [
    {
        icon: IconUserPlus,
        step: "01",
        title: "Sign Up & Jump In",
        description: "Create an account with Google or GitHub in one click. Hit \"Play Now\", allow your camera, and you're in the queue.",
    },
    {
        icon: IconDeviceGamepad2,
        step: "02",
        title: "Get Matched",
        description: "We pair you with a random opponent instantly. Video connects automatically and the board loads — game on.",
    },
    {
        icon: IconSparkles,
        step: "03",
        title: "Play & Rematch",
        description: "Play your game with full move validation and 10-minute timers. After the match, hit rematch or find a new opponent.",
    },
];

export default function HowItWorksSection() {
    return (
        <section className="relative py-24 md:py-32 dark:bg-black bg-neutral-200 overflow-hidden">
            {/* Subtle grid bg */}
            <div
                className="absolute inset-0 opacity-30 dark:opacity-10"
                style={{
                    backgroundImage: `radial-gradient(circle at 0.5px 0.5px, rgba(34,197,94,0.2) 0.5px, transparent 0)`,
                    backgroundSize: "24px 24px",
                }}
            />

            <div className="relative max-w-6xl mx-auto px-5">
                {/* Section header */}
                <div className="text-center mb-16">
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="text-sm font-semibold uppercase tracking-widest text-green-500 mb-3"
                    >
                        How It Works
                    </motion.p>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-3xl md:text-5xl font-bold tracking-tight"
                    >
                        Three Steps to Your First Game
                    </motion.h2>
                </div>

                {/* Steps */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                    {steps.map((step, i) => (
                        <motion.div
                            key={step.step}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.15 }}
                            className="relative flex flex-col items-center text-center"
                        >
                            {/* Connector line (hidden on mobile and last item) */}
                            {i < steps.length - 1 && (
                                <div className="hidden md:block absolute top-10 left-[60%] w-[calc(100%-20%)] h-[2px] bg-gradient-to-r from-green-500/40 to-green-500/0" />
                            )}

                            {/* Step number badge */}
                            <div className="relative mb-6">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20">
                                    <step.icon className="w-9 h-9 text-white" />
                                </div>
                                <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold flex items-center justify-center shadow-md">
                                    {step.step}
                                </span>
                            </div>

                            <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-xs">
                                {step.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
