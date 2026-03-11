"use client";

import { Burger } from '@/types';
import { useCartStore } from '@/store/cartStore';
import { useState, useRef, useEffect } from 'react';

export default function BurgerCard({ burger }: { burger: Burger }) {
  const addItem = useCartStore((state) => state.addItem);
  const [isAdding, setIsAdding] = useState(false);
  
  const cashAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio('/sounds/cash-register.mp3');
    audio.volume = 0.4;
    audio.preload = 'auto';
    cashAudioRef.current = audio;

    return () => {
      if (cashAudioRef.current) {
        cashAudioRef.current.pause();
        cashAudioRef.current = null;
      }
    };
  }, []);

  const handleAdd = () => {
    if (cashAudioRef.current) {
      cashAudioRef.current.currentTime = 0;
      cashAudioRef.current.play().catch(() => {});
    }

    setIsAdding(true);
    addItem(burger);
    
    setTimeout(() => setIsAdding(false), 800);
  };

  const precioFormateado = (Number(burger?.precio) || 0).toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return (
    <div className="group relative flex flex-col h-full w-full bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-stone-100">
      
      {/* Etiqueta de Categoría - Más elegante */}
      <div className="absolute top-4 left-4 z-20">
        <span className="bg-white/90 backdrop-blur-md text-stone-800 text-[9px] font-bold uppercase px-3 py-1.5 rounded-full shadow-sm border border-stone-100">
          {burger?.categoria || 'General'}
        </span>
      </div>

      {/* CONTENEDOR DE IMAGEN */}
      <div className="relative aspect-square w-full bg-stone-50 overflow-hidden flex items-center justify-center">
        <img 
          src={burger?.imagen || 'https://via.placeholder.com/300'} 
          alt={burger?.nombre} 
          className={`w-full h-full object-cover transition-transform duration-700 
            ${isAdding ? 'scale-110 blur-[2px]' : 'group-hover:scale-110'}
          `}
          loading="lazy"
        />
        
        {/* Overlay de "Añadido" - Moderno con Blur */}
        <div className={`absolute inset-0 z-10 flex items-center justify-center bg-[#FFCA28]/80 backdrop-blur-md transition-all duration-300 ${isAdding ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="flex flex-col items-center animate-bounce">
            <span className="text-4xl">🍟</span>
            <span className="text-stone-950 font-black text-lg uppercase">¡Agregado!</span>
          </div>
        </div>
      </div>

      {/* CONTENIDO DE TEXTO */}
      <div className="p-5 flex flex-col flex-grow bg-white">
        <div className="mb-2">
          <h3 className="text-lg font-bold text-stone-900 leading-tight line-clamp-2 tracking-tight">
            {burger?.nombre || 'Sin Nombre'}
          </h3>
          {/* Línea decorativa sutil */}
          <div className="w-6 h-1 bg-[#FFCA28] rounded-full mt-2 group-hover:w-12 transition-all duration-300" />
        </div>
        
        <p className="text-xs text-stone-500 font-medium leading-relaxed line-clamp-2 mb-5">
          {burger?.descripcion || 'Deliciosa hamburguesa de la cocina de Krusty.'}
        </p>

        {/* PRECIO Y BOTÓN - Sin bordes negros */}
        <div className="mt-auto flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-xl font-black text-stone-950 tracking-tighter">
              ${precioFormateado}
            </span>
          </div>

          <button 
            onClick={handleAdd}
            disabled={isAdding}
            className={`
              relative h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-300 active:scale-90
              ${isAdding 
                ? 'bg-emerald-500 text-white rotate-[360deg]' 
                : 'bg-[#FFCA28] text-stone-950 shadow-md shadow-[#FFCA28]/20 hover:bg-[#D32F2F] hover:text-white'
              }
            `}
          >
            {isAdding ? (
               <span className="text-lg">✔</span>
            ) : (
               <span className="text-xl font-bold">+</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}