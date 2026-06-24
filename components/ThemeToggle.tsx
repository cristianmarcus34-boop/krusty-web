'use client';

import { useTheme } from '../app/context/ThemeContext.tsx';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
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
      className="fixed bottom-6 right-6 z-50 bg-black dark:bg-white text-white dark:text-black p-3.5 rounded-full border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all text-xl"
      aria-label={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
    >
      {theme === 'light' ? (
        <span className="flex items-center gap-1">
          🌙
        </span>
      ) : (
        <span className="flex items-center gap-1">
          ☀️
        </span>
      )}
    </motion.button>
  );
}