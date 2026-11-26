// components/BurgerCard.tsx
"use client";

import { Burger } from '../types';
import { useCartStore } from '@/store/cartStore';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Adicional {
  id: string;
  nombre: string;
  precio: number;
}

export default function BurgerCard({
  burger,
  isFirst = false
}: {
  burger: any;
  isFirst?: boolean;
}) {
  const addItem = useCartStore((state) => state.addItem);
  const [isAdding, setIsAdding] = useState(false);
  const [imageError, setImageError] = useState(false);

  const cashAudioRef = useRef<HTMLAudioElement | null>(null);

  // ✅ Estado de disponibilidad
  const disponible = burger?.disponible !== false;

  const getImageUrl = () => {
    if (imageError || !burger?.imagen) {
      return '/images/placeholder-krusty.webp';
    }
    if (burger.imagen.includes('supabase.co')) {
      return burger.imagen.split('?')[0];
    }
    if (burger.imagen.startsWith('file://')) {
      return '/images/placeholder-krusty.webp';
    }
    return burger.imagen;
  };

  const imageUrl = getImageUrl();

  const adicionales: Adicional[] = burger.producto_adicionales?.map((rel: any) => ({
    id: rel.adicionales?.id,
    nombre: rel.adicionales?.nombre,
    precio: rel.adicionales?.precio
  })).filter((a: any) => a.id) || [];

  useEffect(() => {
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

    if (!disponible) return;

    if (cashAudioRef.current) {
      cashAudioRef.current.currentTime = 0;
      cashAudioRef.current.play().catch(() => { });
    }

    setIsAdding(true);
    addItem(burger);

    setTimeout(() => setIsAdding(false), 800);
  };

  const precioFormateado = (Number(burger?.precio) || 0).toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const precioSinImpuestos = burger?.precio_sin_impuestos
    ? Number(burger.precio_sin_impuestos)
    : Math.round((Number(burger?.precio) || 0) / 1.21);

  const precioSinImpuestosFormateado = precioSinImpuestos.toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return (
    <Link
      href={disponible ? `/producto/${burger.id}` : '#'}
      onClick={(e) => {
        if (!disponible) e.preventDefault();
      }}
      aria-disabled={!disponible}
      className={`group relative flex flex-col h-full w-full bg-white rounded-[1.25rem] overflow-hidden transition-all duration-300 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
        ${disponible
          ? 'hover:shadow-none hover:translate-x-1 hover:translate-y-1 hover:border-[#D32F2F] cursor-pointer'
          : 'opacity-60 grayscale cursor-not-allowed'
        }`}
    >
      {/* Etiqueta de Categoría */}
      <div className="absolute top-3 left-3 z-20 max-w-[60%]">
        <span className="inline-block bg-[#FFCA28] text-black text-[10px] font-black uppercase px-3 py-1.5 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_black] tracking-wide truncate">
          {burger?.categoria || 'General'}
        </span>
      </div>

      {/* ✅ Badge SIN STOCK o botón Agregar */}
      {!disponible ? (
        <div className="absolute top-3 right-3 z-20">
          <span className="inline-block bg-red-600 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_black] tracking-wide">
            🚫 Sin stock
          </span>
        </div>
      ) : (
        <button
          onClick={handleAdd}
          disabled={isAdding}
          className={`
            absolute top-3 right-3 z-20 w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all duration-200 border-2 border-black shadow-[3px_3px_0px_0px_black]
            ${isAdding
              ? 'bg-green-500 text-white shadow-none translate-y-0.5'
              : 'bg-[#FFCA28] text-black hover:bg-[#D32F2F] hover:text-white hover:scale-110'
            }
          `}
          title="Agregar al carrito"
        >
          {isAdding ? '✓' : '+'}
        </button>
      )}

      {/* CONTENEDOR DE IMAGEN */}
      <div className="relative aspect-[3/2] w-full bg-stone-100 overflow-hidden border-b-4 border-black">
        <Image
          src={imageUrl}
          alt={burger?.nombre || 'Producto Krusty'}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className={`object-cover transition-all duration-500 will-change-transform
            ${isAdding ? 'scale-110 blur-sm' : disponible ? 'group-hover:scale-105' : ''}
          `}
          priority={isFirst}
          loading={isFirst ? 'eager' : 'lazy'}
          onError={() => setImageError(true)}
        />

        {/* ✅ Overlay SIN STOCK */}
        {!disponible && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
            <div className="flex flex-col items-center">
              <span className="text-4xl mb-1">🚫</span>
              <span className="bg-red-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full border-2 border-white">
                Sin stock
              </span>
            </div>
          </div>
        )}

        {/* Overlay "¡D'OH!" (solo si disponible) */}
        {disponible && (
          <div
            className={`absolute inset-0 z-10 flex items-center justify-center bg-[#FFCA28]/90 transition-all duration-300 pointer-events-none
              ${isAdding ? 'opacity-100' : 'opacity-0'}
            `}
          >
            <div className="flex flex-col items-center animate-bounce">
              <span className="font-krusty text-3xl text-black">¡D'OH!</span>
              <span className="text-xs font-black text-black/70">Agregado con éxito</span>
            </div>
          </div>
        )}

        {/* Badge "Ver Detalle" (solo desktop y disponible) */}
        {disponible && (
          <div className="hidden md:flex absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center">
            <span className="bg-white/95 text-black font-black text-[11px] px-4 py-2 rounded-full border-2 border-black shadow-[3px_3px_0px_0px_black] transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
              VER DETALLES 🔍
            </span>
          </div>
        )}
      </div>

      {/* CONTENIDO */}
      <div className="p-1 flex flex-col grow bg-white text-center items-center">
        <div className="mb-2 w-full">
          <h3 className="font-krusty font-black text-[18px] leading-[20px] text-[#181818] line-clamp-2 min-h-[2.5rem] flex items-center justify-center transition-colors group-hover:text-[#D32F2F] break-words [-webkit-text-stroke:0.6px_#181818] md:[-webkit-text-stroke:0.9px_#181818]">
            {burger?.nombre || 'Sin Nombre'}
          </h3>
        </div>

        <div className="mb-2">
          <span className="font-krusty text-[15px] leading-[20px] text-[#D32F2F] tracking-normal">
            ${precioFormateado}
          </span>
          <span className="block text-[12px] leading-[16px] text-stone-500 font-bold mt-0.5">
            ${precioSinImpuestosFormateado} sin impuestos
          </span>
        </div>

        <p className="text-[12px] leading-[16px] text-[#71717a] font-bold line-clamp-2 mb-2 min-h-[2rem]">
          {burger?.descripcion || 'Una delicia de Springfield directamente a tu mesa.'}
        </p>

        {/* EXTRAS (solo si disponible) */}
        {disponible && adicionales.length > 0 && (
          <div className="w-full mb-2 pt-2 border-t-2 border-dashed border-stone-200">
            <p className="text-[8px] font-black uppercase text-stone-400 mb-2 tracking-[0.15em]">
              Extras Disponibles
            </p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {adicionales.slice(0, 3).map((extra) => (
                <span
                  key={extra.id}
                  className="text-[9px] font-bold bg-[#FFCA28]/20 border border-[#FFCA28]/50 px-2.5 py-1 rounded-full text-stone-700 uppercase max-w-[110px] truncate"
                  title={extra.nombre}
                >
                  +{extra.nombre}
                </span>
              ))}
              {adicionales.length > 3 && (
                <span className="text-[9px] font-black text-stone-400 self-center">
                  +{adicionales.length - 3} más
                </span>
              )}
            </div>
          </div>
        )}

        {/* Botón móvil o aviso sin stock */}
        {disponible ? (
          <button
            onClick={handleAdd}
            disabled={isAdding}
            className={`
              w-full mt-auto py-3 rounded-xl flex items-center justify-center font-black uppercase text-xs transition-all duration-200 border-2 border-black active:translate-y-1 active:shadow-none
              md:hidden
              ${isAdding
                ? 'bg-green-500 text-white shadow-none translate-y-1'
                : 'bg-[#FFCA28] text-black shadow-[4px_4px_0px_0px_black] hover:bg-[#D32F2F] hover:text-white'
              }
            `}
          >
            {isAdding ? "¡AGREGADO!" : "AGREGAR AL CARRITO"}
          </button>
        ) : (
          <div className="w-full mt-auto py-3 rounded-xl flex items-center justify-center font-black uppercase text-xs border-2 border-stone-300 bg-stone-100 text-stone-400 md:hidden">
            🚫 Sin stock
          </div>
        )}
      </div>
    </Link>
  );
}