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
  duracion = 8000
}: KrustyLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [currentPhrase, setCurrentPhrase] = useState(0);
  const [showSkip, setShowSkip] = useState(false);

  const phrases = [
    "Preparando la salsa secreta... 🧪",
    "Afilando los cuchillos... 🔪",
    "Llamando a Krusty... 📞",
    "Cocinando con amor (y explosivos) 💥",
    "Springfield nos espera... 🏠",
    "¿Ya probaste la Krusty Burger? 🍔",
    "El payaso está en la cocina... 🤡",
    "Mmmm... hamburguesas... 🤤",
    "¡Ay caramba! 🍩",
    "La mejor hamburguesa de Quilmes... 🏆",
    "Krusty dice: ¡Cómprala! 💰",
    "Con cebolla caramelizada... 🧅",
    "Queso que se estira hasta Springfield... 🧀",
    "El toque secreto del payaso... 🎪",
    "¡Si no te atragantas, no es una Krusty! 💪",
    "Directo de Villa La Florida... 🏠",
  ];

  useEffect(() => {
    setIsMounted(true);
    console.log(`⏱️ Loader iniciado con duración: ${duracion}ms`);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    // ✅ Mostrar botón "Saltar" después de 2 segundos
    const skipTimer = setTimeout(() => {
      setShowSkip(true);
    }, 2000);

    const startTime = Date.now();
    console.log(`🔄 Loader comenzó a las ${startTime}`);

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progressPercent = Math.min((elapsed / duracion) * 100, 100);
      setProgress(progressPercent);

      console.log(`📊 Progreso: ${Math.round(progressPercent)}% - ${elapsed}ms / ${duracion}ms`);

      if (progressPercent >= 100) {
        console.log(`✅ Loader completado!`);
        clearInterval(interval);
        setIsComplete(true);
        if (onComplete) {
          setTimeout(onComplete, 500);
        }
      }
    }, 50);

    const phraseInterval = setInterval(() => {
      setCurrentPhrase((prev) => (prev + 1) % phrases.length);
    }, 1500);

    return () => {
      clearTimeout(skipTimer);
      clearInterval(interval);
      clearInterval(phraseInterval);
    };
  }, [isMounted, duracion, onComplete]);

  // ✅ Función para saltar el loader
  const handleSkip = () => {
    console.log('⏭️ Usuario saltó el loader');
    setIsComplete(true);
    if (onComplete) {
      onComplete();
    }
  };

  if (!isMounted) {
    return (
      <div className="fixed inset-0 bg-[#1A1A1A] flex items-center justify-center z-50">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-[#FFCA28] border-t-transparent rounded-full animate-spin" />
          <div className="absolute inset-2 border-4 border-[#D32F2F] border-r-transparent rounded-full animate-spin-reverse" />
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      {!isComplete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 bg-linear-to-br from-[#1A1A1A] via-[#2A2A2A] to-[#1A1A1A] flex flex-col items-center justify-center z-50"
        >
          {/* Fondo con partículas sutiles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#FFCA28]/5 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#D32F2F]/5 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[#FFCA28]/3 rounded-full blur-2xl" />
          </div>

          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="relative z-10"
          >
            <div className="relative w-32 h-32 md:w-40 md:h-40">
              <div className="absolute inset-0 bg-[#FFCA28]/20 rounded-full blur-2xl animate-pulse" />
              <div className="absolute inset-0 bg-linear-to-tr from-[#FFCA28]/10 to-[#D32F2F]/10 rounded-full blur-xl" />
              <Image
                src="/images/Krustyburgerheader.webp"
                alt="Krusty Burger"
                fill
                className="object-cover rounded-full border-4 border-[#FFCA28] shadow-2xl shadow-[#FFCA28]/20 relative z-10"
                priority
              />
            </div>
          </motion.div>

          {/* Barra de progreso */}
          <div className="relative z-10 w-64 md:w-80 mt-10">
            <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-linear-to-r from-[#FFCA28] via-[#FAD02C] to-[#FFCA28]"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
              <div
                className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"
                style={{ width: '50%' }}
              />
            </div>

            <motion.div
              key={Math.round(progress)}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-between mt-3"
            >
              <span className="text-white/30 text-[10px] font-mono tracking-widest">
                CARGANDO
              </span>
              <span className="text-[#FFCA28] text-sm font-mono font-bold">
                {Math.round(progress)}%
              </span>
            </motion.div>
          </div>

          {/* Frase */}
          <motion.div
            key={currentPhrase}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="relative z-10 mt-6"
          >
            <p className="text-white/40 text-sm font-medium tracking-wide text-center px-4 min-h-6">
              {phrases[currentPhrase]}
            </p>
          </motion.div>

          {/* ✅ BOTÓN SALTAR (aparece después de 2 segundos) */}
          {showSkip && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
              onClick={handleSkip}
              className="relative z-10 mt-4 px-6 py-2 rounded-full border border-white/20 text-white/50 text-xs font-black uppercase tracking-widest hover:bg-white/10 hover:text-white/80 hover:border-white/40 transition-all duration-300 cursor-pointer"
            >
              Saltar ⏭️
            </motion.button>
          )}

          {/* Marca */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute bottom-10 left-0 right-0 text-center z-10"
          >
            <p className="text-white/10 text-[10px] font-black uppercase tracking-[0.3em]">
              Krusty Burger © 2026
            </p>
            <div className="flex justify-center gap-2 mt-3">
              <span className="w-8 h-px bg-white/5" />
              <span className="w-8 h-px bg-white/10" />
              <span className="w-8 h-px bg-white/5" />
            </div>
          </motion.div>

          {/* Puntos de carga */}
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 1.2,
                  delay: i * 0.3,
                  repeat: Infinity,
                }}
                className="w-1.5 h-1.5 rounded-full bg-[#FFCA28]/40"
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}