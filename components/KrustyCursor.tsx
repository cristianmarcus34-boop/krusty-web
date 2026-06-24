'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function KrustyCursor() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detectar si es mobile usando globalThis
    if (typeof globalThis !== 'undefined') {
      const isMobileDevice = globalThis.innerWidth < 768;
      setIsMobile(isMobileDevice);
      if (isMobileDevice) {
        document.body.style.cursor = 'auto';
      }
    }

    const updateMouse = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const updateHover = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isInteractive = 
        target.tagName === 'BUTTON' || 
        target.closest('button') !== null || 
        target.closest('a') !== null ||
        target.closest('[role="button"]') !== null;
      
      setIsHovering(isInteractive);
    };

    // Usar globalThis en lugar de window
    globalThis.addEventListener('mousemove', updateMouse);
    globalThis.addEventListener('mouseover', updateHover);

    return () => {
      globalThis.removeEventListener('mousemove', updateMouse);
      globalThis.removeEventListener('mouseover', updateHover);
    };
  }, []);

  if (isMobile) return null;

  return (
    <>
      <motion.div
        className="fixed pointer-events-none z-[9999] text-2xl hidden md:block"
        animate={{
          x: mousePosition.x - 15,
          y: mousePosition.y - 15,
          scale: isHovering ? 1.4 : 1,
          rotate: isHovering ? 20 : 0,
        }}
        transition={{ 
          type: 'spring', 
          stiffness: 300, 
          damping: 20,
          mass: 0.8
        }}
      >
        🍔
      </motion.div>

      <motion.div
        className="fixed pointer-events-none z-[9998] hidden md:block"
        animate={{
          x: mousePosition.x - 20,
          y: mousePosition.y - 20,
          opacity: isHovering ? 0.8 : 0.3,
          scale: isHovering ? 1.5 : 1,
        }}
        transition={{ 
          type: 'spring', 
          stiffness: 200, 
          damping: 25 
        }}
      >
        <div className="w-5 h-5 bg-[#E21B22] rounded-full blur-md" />
      </motion.div>

      <motion.div
        className="fixed pointer-events-none z-[9997] hidden md:block"
        animate={{
          x: mousePosition.x - 25,
          y: mousePosition.y - 25,
          scale: isHovering ? 1.2 : 0.8,
          opacity: isHovering ? 0.6 : 0.2,
        }}
        transition={{ type: 'spring', stiffness: 150, damping: 30 }}
      >
        <div className="w-12 h-12 border-2 border-[#FAD02C] rounded-full" />
      </motion.div>
    </>
  );
}