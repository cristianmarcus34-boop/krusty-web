// components/ThemeToggle.tsx
'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

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

    if (!mounted) {
        return (
            <button
                type="button"
                className="fixed bottom-6 right-6 z-50 p-3.5 rounded-full border-2 border-black bg-black text-white text-xl opacity-0"
                aria-label="Cargando tema..."
            >
                🌙
            </button>
        );
    }

    return (
        <motion.button
            type="button"
            onClick={toggleTheme}
            whileHover={{ scale: 1.1, rotate: 10 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className={`fixed bottom-6 right-6 z-50 p-3.5 rounded-full border-2 transition-all text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5
                ${theme === 'light'
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-black border-white'
                }
            `}
            aria-label={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
        >
            {theme === 'light' ? '🌙' : '☀️'}
        </motion.button>
    );
}