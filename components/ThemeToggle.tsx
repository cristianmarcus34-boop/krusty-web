// components/ThemeToggle.tsx
'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function ThemeToggle() {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('krusty-theme') as 'light' | 'dark' | null;
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const initialTheme = saved || (prefersDark ? 'dark' : 'light');
            setTheme(initialTheme);
            document.documentElement.classList.toggle('dark', initialTheme === 'dark');
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('krusty-theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
    };

    if (!mounted) return null;

    return createPortal(
        <motion.button
            type="button"
            onClick={toggleTheme}
            whileHover={{ scale: 1.1, rotate: 10 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className={`fixed bottom-28 right-4 md:bottom-20 md:right-6 z-[99999] p-3 md:p-3.5 rounded-full border-2 transition-all text-lg md:text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5
                ${theme === 'light'
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-black border-white'
                }
            `}
            aria-label={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
        >
            {theme === 'light' ? '🌙' : '☀️'}
        </motion.button>,
        document.body
    );
}