'use client'
import { useEffect, useState } from "react"
import { motion } from 'motion/react';
import { IconMoonFilled, IconSunFilled } from "@tabler/icons-react";

export default function ThemeToggle() {
    const [theme, setTheme] = useState('dark');

    useEffect(() => {
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(theme);
    }, [theme]);

    function toggleTheme() {
        setTheme(theme === 'light' ? 'dark' : 'light');
    }

    return (
        <div>
            <motion.button
                onClick={toggleTheme}
                className="p-2"
                whileHover={{
                    scale: 1.1
                }}
                whileTap={{
                    scale: 0.8
                }}
                transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 15
                }}
            >
                <motion.div
                    initial={false}
                    animate={{
                        rotate: theme === 'dark' ? 0 : 180
                    }}
                    transition={{
                        duration: 0.3
                    }}
                >
                    {theme === 'dark' 
                    ? <IconMoonFilled className="h-5 w-5"/>
                    : <IconSunFilled className="h-5 w-5"/>}
                </motion.div>
            </motion.button>
        </div>
    )
}