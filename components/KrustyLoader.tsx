'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const krustyFacts = [
  "🍔 La salsa secreta tiene 54 ingredientes... y 3 son ilegales",
  "🤡 Krusty ha perdido 47 demandas por intoxicación masiva",
  "🧬 El 80% de los clientes mutan en su primera visita",
  "📏 La hamburguesa más grande pesaba 50kg (y sobrevivió 2 personas)",
  "💎 Krusty vendió una hamburguesa con sabor a diamante",
  "🧪 La receta original incluía polvo de estrella de mar",
  "⚡ El récord de mutaciones en una visita es de 7",
  "🎪 Krustyland fue construido sobre un cementerio indio",
  "🦷 La hamburguesa más cara costaba un riñón (literal)",
  "🌊 La salsa secreta se hace con agua del mar de Springfield"
];

interface KrustyLoaderProps {
  onComplete?: () => void;
  duracion?: number; // Nueva prop para controlar duración
}

export default function KrustyLoader({ 
  onComplete, 
  duracion = 10000 // 10 segundos por defecto
}: KrustyLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [factIndex, setFactIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  // ============================================
  // SOLUCIÓN DE HIDRATACIÓN
  // ============================================
  useEffect(() => {
    setIsMounted(true);
    setStartTime(Date.now());
  }, []);

  useEffect(() => {
    if (!isMounted || !startTime) return;

    // ============================================
    // CONFIGURACIÓN ULTRA LENTA
    // ============================================
    // El progreso se calcula en base al tiempo transcurrido
    // ============================================
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progressPercent = Math.min((elapsed / duracion) * 100, 100);
      
      setProgress(progressPercent);
      
      if (progressPercent >= 100) {
        clearInterval(interval);
        setIsComplete(true);
        if (onComplete) {
          setTimeout(onComplete, 1500);
        }
      }
    }, 100); // Actualizar cada 100ms para animación suave

    // Datos curiosos cambian cada 2.5 segundos
    const factInterval = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % krustyFacts.length);
    }, 2500);

    return () => {
      clearInterval(interval);
      clearInterval(factInterval);
    };
  }, [isMounted, startTime, duracion, onComplete]);

  // ============================================
  // SOLUCIÓN: Valores fijos para SSR
  // ============================================
  const getWindowWidth = () => {
    if (typeof globalThis !== 'undefined' && globalThis.innerWidth) {
      return globalThis.innerWidth;
    }
    return 1024;
  };

  const getWindowHeight = () => {
    if (typeof globalThis !== 'undefined' && globalThis.innerHeight) {
      return globalThis.innerHeight;
    }
    return 800;
  };

  // Si no está montado en el cliente, mostrar un loader estático
  if (!isMounted) {
    return (
      <div className="fixed inset-0 bg-[#FAD02C] flex flex-col items-center justify-center z-50">
        <div className="text-8xl mb-8 animate-bounce">🍔</div>
        <h2 className="text-2xl font-black text-black mb-2">
          Cocinando tu experiencia...
        </h2>
        <div className="w-64 md:w-80 h-4 bg-black/20 rounded-full overflow-hidden border-2 border-black relative">
          <div className="h-full bg-[#E21B22] w-0" />
        </div>
        <p className="text-xs font-bold text-black/40 mt-2">0% 🍟</p>
      </div>
    );
  }

  return (
    <AnimatePresence>
      {!isComplete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed inset-0 bg-[#FAD02C] flex flex-col items-center justify-center z-50"
        >
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1],
            }}
            transition={{ 
              rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
              scale: { duration: 1, repeat: Infinity, ease: 'easeInOut' }
            }}
            className="text-8xl mb-8"
          >
            🍔
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-black text-black mb-2"
          >
            Cocinando tu experiencia...
          </motion.h2>

          <motion.p
            key={factIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-sm text-black/60 mb-6 max-w-md text-center px-4"
          >
            {krustyFacts[factIndex]}
          </motion.p>

          <div className="w-64 md:w-80 h-4 bg-black/20 rounded-full overflow-hidden border-2 border-black relative">
            <motion.div
              className="h-full bg-[#E21B22]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_1s_infinite]" />
          </div>

          <p className="text-xs font-bold text-black/40 mt-2">
            {Math.round(progress)}% 🍟
          </p>

          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(10)].map((_, i) => {
              const seed = (i * 137.508 + 42.3) % 100;
              return (
                <motion.div
                  key={i}
                  className="absolute text-2xl"
                  initial={{
                    x: (seed * 10) % getWindowWidth(),
                    y: getWindowHeight() + 50 + (i * 30),
                    rotate: 0,
                  }}
                  animate={{
                    y: -50,
                    rotate: 360,
                  }}
                  transition={{
                    duration: 5 + (i % 5),
                    repeat: Infinity,
                    delay: (i % 3),
                    ease: 'linear',
                  }}
                  style={{
                    left: `${(seed * 3.7) % 95 + 2.5}%`,
                  }}
                >
                  {['🍔', '🧀', '🥬', '🍅', '🧅', '⭐'][i % 6]}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}