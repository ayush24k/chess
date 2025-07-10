'use client'
import { useEffect, useState } from "react"

export default function ThemeToggle () {
    const [theme, setTheme] = useState('light');

    useEffect(() => {
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(theme);
    }, [theme]);

    return (
        <button
        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        >
            {theme === 'light' ? <p>dark</p>: <p>light</p>}
        </button>
    )
}