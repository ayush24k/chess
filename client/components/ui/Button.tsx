'use client'
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { useRef, useCallback } from 'react';

export default function Button({ children, className }: {
    children: React.ReactNode,
    className?: string
}) {
    const ref = useRef<HTMLDivElement>(null);

    const handleClick = useCallback((e: React.MouseEvent) => {
        const anchor = ref.current?.querySelector('a');
        if (anchor && e.target !== anchor && !anchor.contains(e.target as Node)) {
            anchor.click();
        }
    }, []);

    return (
        <motion.div
            ref={ref}
            onClick={handleClick}
            whileHover={{
                y: -2,
                boxShadow: "0 6px 20px rgba(34,197,94,0.4), 0 2px 4px rgba(0,0,0,0.2), 0px 1px 4px 0px rgba(255,255,255,0.1) inset",
            }}
            whileTap={{
                y: 2,
                boxShadow: "0 1px 3px rgba(0,0,0,0.2), 0px -1px 2px 0px rgba(255,255,255,0.1) inset",
                scale: 0.98,
            }}

            transition={{
                duration: 0.1,
                ease: 'easeInOut'
            }}
            style={{
                boxShadow: "0 4px 12px rgba(34,197,94,0.25), 0 2px 4px rgba(0,0,0,0.15), 0px 1px 4px 0px rgba(255,255,255,0.1) inset, 0px -1px 2px 0px rgba(255,255,255,0.1) inset",
            }}

            className={cn("group relative inline-block bg-green-500 px-4 py-1 rounded-2xl dark:text-neutral-900 text-md cursor-pointer select-none", className)}>
            {children}
            <span className='absolute inset-x-0 bottom-0 bg-gradient-to-r from from-transparent via-green-700 to-transparent h-[2px] w-3/5 mx-auto blur-sm'></span>
        </motion.div>
    )
}