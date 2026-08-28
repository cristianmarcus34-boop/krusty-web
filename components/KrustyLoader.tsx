'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import Image from 'next/image';

interface KrustyLoaderProps {
  onComplete?: () => void;
  duracion?: number;
}

export default function KrustyLoader({
  onComplete,
  duracion = 6000
}: KrustyLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progressPercent = Math.min((elapsed / duracion) * 100, 100);
      setProgress(progressPercent);

      if (progressPercent >= 100) {
        clearInterval(interval);
        setIsComplete(true);
        if (onComplete) {
          setTimeout(onComplete, 500);
        }
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isMounted, duracion, onComplete]);

  if (!isMounted) {
    return (
      <div className="fixed inset-0 bg-[#1A1A1A] flex items-center justify-center z-50">
        <div className="w-16 h-16 border-4 border-[#FFCA28] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AnimatePresence>
      {!isComplete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-[#1A1A1A] flex flex-col items-center justify-center z-50"
        >
          {/* Logo de Krusty centrado */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="relative w-28 h-28 md:w-36 md:h-36 mb-10"
          >
            <Image
              src="/images/Krustyburgerheader.webp"
              alt="Krusty Burger"
              fill
              className="object-cover rounded-full border-4 border-[#FFCA28] shadow-lg shadow-[#FFCA28]/20"
              priority
            />
          </motion.div>

          {/* Barra de progreso */}
          <div className="w-56 md:w-72 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#FFCA28]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Porcentaje */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-white/40 text-xs font-mono mt-4"
          >
            {Math.round(progress)}%
          </motion.p>

          {/* Frase de carga */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-white/20 text-[10px] font-black uppercase tracking-[0.2em] mt-6"
          >
            Preparando tu experiencia...
          </motion.p>

          {/* Marca */}
          <p className="absolute bottom-8 text-white/10 text-[10px] font-black uppercase tracking-[0.3em]">
            Krusty Burger © 2026
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}