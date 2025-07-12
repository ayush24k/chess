'use client'
import { AnimatePresence, easeInOut, motion } from 'motion/react'

export default function StartAnimation({ children }: {
    children: React.ReactNode
}) {
    return (
        <AnimatePresence>
            <motion.div
                initial={{
                    y: 20,
                    opacity: 0,
                    filter: 'blur(8px)'
                }}
                animate={{
                    y: 0,
                    opacity: 100,
                    filter: 'blur(0px)'
                }}
                transition={{
                    duration: 0.5,
                    ease: easeInOut
                }}
                className=''
            >
                {children}
            </motion.div>
        </AnimatePresence>
    )
}