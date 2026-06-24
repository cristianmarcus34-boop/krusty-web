'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

interface KrustyButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}

export default function KrustyButton({ 
  children, 
  onClick, 
  className = '',
  type = 'button',
  disabled = false,
  variant = 'primary'
}: KrustyButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  const variants = {
    primary: 'bg-[#E21B22] hover:bg-black text-white',
    secondary: 'bg-[#FAD02C] hover:bg-black text-black',
    danger: 'bg-red-600 hover:bg-red-800 text-white',
  };

  const krustyFaces = ['🤡', '😈', '🤪', '😎', '🤮', '👹', '😱'];

  return (
    <motion.button
      type={type}
      disabled={disabled}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onMouseDown={() => setIsClicked(true)}
      onMouseUp={() => setIsClicked(false)}
      onMouseLeave={() => setIsClicked(false)}
      onClick={onClick}
      whileHover={{ 
        scale: disabled ? 1 : 1.03,
        y: disabled ? 0 : -2
      }}
      whileTap={{ 
        scale: disabled ? 1 : 0.97,
        y: disabled ? 0 : 2
      }}
      className={`
        relative overflow-hidden 
        font-black uppercase tracking-wider 
        px-6 py-3 md:px-8 md:py-4 
        border-4 border-black 
        rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] 
        transition-all 
        ${variants[variant]}
        ${disabled ? 'opacity-50 cursor-not-allowed shadow-none' : 'hover:shadow-none hover:translate-x-1 hover:translate-y-1'}
        ${className}
      `}
    >
      <span className="relative z-10 flex items-center justify-center gap-2 text-sm md:text-base">
        {children}
        <motion.span
          animate={{
            rotate: isHovered ? [0, 10, -10, 0] : 0,
            scale: isClicked ? 1.3 : 1,
          }}
          transition={{ duration: 0.5 }}
          className="inline-block"
        >
          {isHovered && !disabled ? krustyFaces[Math.floor(Math.random() * krustyFaces.length)] : '🍔'}
        </motion.span>
      </span>

      <motion.div
        className="absolute inset-0 bg-[#FAD02C]"
        initial={{ y: '100%' }}
        animate={{ y: isHovered && !disabled ? '0%' : '100%' }}
        transition={{ duration: 0.3 }}
        style={{ opacity: 0.2 }}
      />

      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent"
        initial={{ x: '-100%' }}
        animate={{ x: isHovered && !disabled ? '100%' : '-100%' }}
        transition={{ duration: 0.6 }}
        style={{ opacity: 0.1 }}
      />

      {isHovered && !disabled && (
        <motion.div
          className="absolute inset-0 border-2 border-white/30 rounded-lg"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </motion.button>
  );
}