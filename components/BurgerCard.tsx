"use client";

import { Burger } from '@/types';
import { useCartStore } from '@/store/cartStore';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image'; // Importamos Image para optimización real

// Interfaz para el mapeo interno de adicionales
interface Adicional {
  id: string;
  nombre: string;
  precio: number;
}

export default function BurgerCard({ burger }: { burger: any }) {
  const addItem = useCartStore((state) => state.addItem);
  const [isAdding, setIsAdding] = useState(false);
  
  const cashAudioRef = useRef<HTMLAudioElement | null>(null);

  // --- OPTIMIZACIÓN DE IMAGEN DE SUPABASE ---
  // Forzamos a Supabase a redimensionar la imagen a un tamaño lógico (400px) 
  // Esto reduce el peso de 2MB a ~50KB por imagen.
  const optimizedImageUrl = burger?.imagen 
    ? `${burger.imagen}?width=400&height=400&resize=contain&quality=75`
    : 'https://via.placeholder.com/400';

  const adicionales: Adicional[] = burger.producto_adicionales?.map((rel: any) => ({
    id: rel.adicionales?.id,
    nombre: rel.adicionales?.nombre,
    precio: rel.adicionales?.precio
  })).filter((a: any) => a.id) || [];

  useEffect(() => {
    // Usamos el constructor de Audio solo si el componente está montado
    const audio = new Audio('/sounds/cash-register.mp3');
    audio.volume = 0.3;
    audio.preload = 'auto';
    cashAudioRef.current = audio;

    return () => {
      if (cashAudioRef.current) {
        cashAudioRef.current.pause();
        cashAudioRef.current = null;
      }
    };
  }, []);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

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
    <Link 
      href={`/producto/${burger.id}`}
      className="group relative flex flex-col h-full w-full bg-white rounded-[1.5rem] overflow-hidden transition-all duration-300 border-[4px] border-black cursor-pointer shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
    >
      
      {/* Etiqueta de Categoría */}
      <div className="absolute top-3 left-3 z-20">
        <span className="bg-[#FFCA28] text-black text-[11px] font-black uppercase px-3 py-1 rounded-md border-2 border-black shadow-[2px_2px_0px_0px_black]">
          {burger?.categoria || 'General'}
        </span>
      </div>

      {/* CONTENEDOR DE IMAGEN OPTIMIZADO */}
      <div className="relative aspect-square md:aspect-[4/3] w-full bg-stone-100 overflow-hidden flex items-center justify-center border-b-[4px] border-black">
        <Image 
          src={optimizedImageUrl} 
          alt={burger?.nombre || 'Producto Krusty'} 
          fill
          sizes="(max-width: 768px) 50vw, 33vw" // Informa al navegador el tamaño real en el grid
          className={`object-cover transition-all duration-500 will-change-transform
            ${isAdding ? 'scale-110 blur-sm' : 'group-hover:scale-110'}
          `}
          loading="lazy"
        />
        
        {/* Overlay "¡D'OH!" */}
        <div className={`absolute inset-0 z-10 flex items-center justify-center bg-[#FFCA28]/90 transition-all duration-300 ${isAdding ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="flex flex-col items-center animate-bounce">
            <span className="font-krusty text-3xl text-black">¡D'OH!</span>
          </div>
        </div>

        {/* Indicador visual de "Ver Detalle" */}
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
             <span className="bg-white/90 text-black font-black text-[10px] px-3 py-1 rounded-full border-2 border-black transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
               VER DETALLES 🔍
             </span>
        </div>
      </div>

      {/* CONTENIDO */}
      <div className="p-4 md:p-5 flex flex-col flex-grow bg-white text-center items-center">
        
        <div className="mb-2 w-full">
          <h3 className="font-krusty text-xl md:text-2xl text-[#292929] leading-[1.1] line-clamp-2 min-h-[2.5rem] flex items-center justify-center transition-colors group-hover:text-[#D32F2F]">
            {burger?.nombre || 'Sin Nombre'}
          </h3>
        </div>
        
        <p className="text-[11px] text-[#71717a] font-bold leading-[1.4] line-clamp-2 mb-3 h-[2.2rem]">
          {burger?.descripcion || 'Una delicia de Springfield directamente a tu mesa.'}
        </p>

        {/* --- SECCIÓN DE EXTRAS --- */}
        {adicionales.length > 0 && (
          <div className="w-full mb-4 pt-3 border-t-2 border-dashed border-stone-200">
            <p className="text-[9px] font-black uppercase text-stone-400 mb-2 tracking-widest">Extras Disponibles</p>
            <div className="flex flex-wrap justify-center gap-1">
              {adicionales.slice(0, 3).map((extra) => (
                <span key={extra.id} className="text-[9px] font-black bg-stone-100 border border-black/10 px-2 py-0.5 rounded text-stone-600 uppercase">
                  {extra.nombre}
                </span>
              ))}
              {adicionales.length > 3 && (
                <span className="text-[10px] font-black text-stone-400 self-center">
                  +{adicionales.length - 3} más
                </span>
              )}
            </div>
          </div>
        )}

        <div className="mt-auto w-full flex flex-col items-center gap-3">
          <span className="font-krusty text-3xl text-black tracking-normal">
            ${precioFormateado}
          </span>

          <button 
            onClick={handleAdd}
            disabled={isAdding}
            className={`
              w-full py-3.5 rounded-xl flex items-center justify-center font-black uppercase text-sm transition-all duration-200 border-[3px] border-black active:translate-y-1 active:shadow-none
              ${isAdding 
                ? 'bg-green-500 text-white shadow-none translate-y-1' 
                : 'bg-[#FFCA28] text-black shadow-[4px_4px_0px_0px_black] hover:bg-[#D32F2F] hover:text-white hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_black]'
              }
            `}
          >
            {isAdding ? "¡LISTO!" : "AGREGAR"}
          </button>
        </div>
      </div>
    </Link>
  );
}