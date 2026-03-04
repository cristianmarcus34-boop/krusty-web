"use client";
import { Burger } from '@/types';
import { useCartStore } from '@/store/cartStore';
import { useState } from 'react';

export default function BurgerCard({ burger }: { burger: Burger }) {
  const addItem = useCartStore((state) => state.addItem);
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    // --- TRUCO KRUSTY PARA DESBLOQUEAR AUDIO ---
    // Creamos una instancia rápida de audio y le damos play en silencio
    // Esto le dice al navegador: "El usuario autorizó sonidos"
   const unlockAudio = new Audio('/sounds/dragon_ball_z_notification.mp3');
    unlockAudio.volume = 0; // Silencio total
    unlockAudio.play()
      .then(() => {
        console.log("Audio desbloqueado para el futuro");
      })
      .catch((err) => console.log("Esperando interacción real...", err));
    // -------------------------------------------

    setIsAdding(true);
    addItem(burger);
    
    // Efecto de feedback visual rápido
    setTimeout(() => setIsAdding(false), 600);
  };

  const precioFormateado = (Number(burger?.precio) || 0).toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return (
    <div className="group relative flex flex-col h-full w-full bg-white border-[3px] border-black rounded-[2rem] overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-200 ease-in-out">
      
      {/* 1. Header de la Card: Badge Flotante */}
      <div className="absolute top-3 left-3 z-10">
        <span className="bg-[#D32F2F] text-white text-[9px] md:text-[10px] font-black uppercase px-2 py-1 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          {burger?.categoria || 'General'}
        </span>
      </div>

      {/* 2. Contenedor de Imagen */}
      <div className="relative aspect-square w-full bg-[#F8F8F8] border-b-[3px] border-black overflow-hidden flex items-center justify-center p-6">
        <img 
          src={burger?.imagen || 'https://via.placeholder.com/300'} 
          alt={burger?.nombre || 'Hamburguesa'} 
          className={`w-full h-full object-contain transition-all duration-500 ease-out 
            ${isAdding ? 'scale-75 rotate-12 opacity-50' : 'group-hover:scale-110 group-hover:-rotate-3'}
          `}
        />
        
        {/* Overlay de "Añadido" */}
        <div className={`absolute inset-0 flex items-center justify-center bg-[#FFCA28]/40 backdrop-blur-[2px] transition-opacity duration-300 ${isAdding ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <span className="text-black font-black text-4xl rotate-12 uppercase">¡Añadido!</span>
        </div>
      </div>

      {/* 3. Cuerpo: Información */}
      <div className="p-3 md:p-4 flex flex-col flex-grow bg-white">
        <div className="mb-2">
          <h3 className="text-sm md:text-lg font-black text-black uppercase leading-tight line-clamp-2 italic tracking-tighter">
            {burger?.nombre || 'Sin Nombre'}
          </h3>
          <div className="w-8 h-1 bg-[#FFCA28] mt-1 group-hover:w-full transition-all duration-500" />
        </div>
        
        <p className="text-[10px] md:text-xs text-stone-500 font-bold leading-tight line-clamp-2 mb-4">
          {burger?.descripcion || 'Deliciosa hamburguesa de la cocina de Krusty.'}
        </p>

        {/* 4. Footer: Precio y Acción */}
        <div className="mt-auto flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-stone-400 uppercase leading-none">Total</span>
            <span className="text-sm md:text-xl font-black text-black tracking-tighter">
              ${precioFormateado}
            </span>
          </div>

          <button 
            onClick={handleAdd}
            disabled={isAdding}
            className={`
              relative overflow-hidden
              flex-shrink-0 px-4 py-2 md:px-6 md:py-3 rounded-xl border-[3px] border-black font-black uppercase text-[10px] md:text-xs italic transition-all
              ${isAdding 
                ? 'bg-green-500 text-white translate-y-1 shadow-none' 
                : 'bg-[#FFCA28] text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px] hover:bg-black hover:text-white'
              }
            `}
          >
            <span className={isAdding ? 'hidden' : 'block'}>Agregar +</span>
            <span className={isAdding ? 'block' : 'hidden'}>✔</span>
          </button>
        </div>
      </div>

      {/* Brillo de hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
    </div>
  );
}