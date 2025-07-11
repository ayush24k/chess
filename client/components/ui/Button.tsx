'use client'
import { motion } from 'motion/react';

export default function Button({ children }: {
    children: React.ReactNode,
}) {
    return (
        <motion.div
            whileHover={{
                scale: 1.05,
                boxShadow: "0px 15px 80px rgba(255,255,255,0.2)",
            }}
            whileTap={{
                scale: 0.9
            }}

            transition={{
                duration: 0.2,
                ease: 'easeInOut'
            }}

            className="group relative inline-block bg-green-500 px-4 py-1 rounded-2xl dark:text-neutral-900 text-md shadow-[0px_1px_4px_0px_rgba(255,255,255,0.1)_inset,0px_-1px_2px_0px_rgba(255,255,255,0.1)_inset]">
            <button className="">
                {children}
            </button>
            <span className='absolute inset-x-0 bottom-0 bg-gradient-to-r from from-transparent via-green-700 to-transparent h-[2px] w-3/5 mx-auto blur-sm'></span>
        </motion.div>
    )
}