"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import BurgerCard from '@/components/BurgerCard';
import { Burger } from '@/types';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function Home() {
  const [items, setItems] = useState<Burger[]>([]);
  const [categoriaActual, setCategoriaActual] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(true); // Estado para el aviso de scroll
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const categorias = ['todos', 'burgers', 'bebidas', 'postres', 'combos'];

  const fetchProductos = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;
      if (data) setItems(data as Burger[]);
    } catch (error) {
      console.error('Error cargando el menú:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkAdminSession = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) setIsAdmin(true);
  }, []);

  // Función para detectar si el usuario ya scrolleó las categorías
  const handleScroll = () => {
    if (scrollRef.current && scrollRef.current.scrollLeft > 20) {
      setShowScrollHint(false);
    }
  };

  useEffect(() => {
    fetchProductos();
    checkAdminSession();

    const channel = supabase
      .channel('menu-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'productos' }, () => fetchProductos())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchProductos, checkAdminSession]);

  const filtrados = categoriaActual === 'todos'
    ? items
    : items.filter(item => item.categoria.toLowerCase() === categoriaActual.toLowerCase());

  return (
    <main
      className="min-h-screen pb-20 bg-[#F5F5F4]"
      style={{
        backgroundImage: 'radial-gradient(#d1d5db 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }}
    >
      {/* BOTÓN FLOTANTE ADMIN */}
      {isAdmin && (
        <div className="fixed bottom-6 left-6 z-[100]">
          <Link href="/admin">
            <button className="bg-black text-[#FFCA28] border-4 border-[#FFCA28] px-5 py-3 rounded-2xl font-black uppercase italic text-xs shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:scale-110 active:scale-95 transition-all flex items-center gap-2">
              <span className="text-lg">⚙️</span> VOLVER AL PANEL
            </button>
          </Link>
        </div>
      )}

      {/* 1. HERO HEADER */}
      <header className="bg-[#FFCA28] py-12 md:py-20 px-4 border-b-[8px] border-black mb-8 relative overflow-hidden">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-[#D32F2F] rounded-full opacity-10" />
        <div className="absolute -bottom-10 -right-10 w-60 h-60 bg-white rounded-full opacity-10" />

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <h1
            className="text-6xl md:text-9xl font-black text-[#D32F2F] italic tracking-tighter mb-4"
            style={{ filter: 'drop-shadow(5px 5px 0px black)' }}
          >
            KRUSTY BURGER
          </h1>
          <div className="inline-block bg-white border-[4px] border-black px-4 md:px-8 py-2 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] -rotate-1">
            <p className="text-sm md:text-2xl font-black text-black uppercase italic tracking-tighter text-center">
              "Donde el colesterol es el ingrediente secreto"
            </p>
          </div>
        </div>
      </header>

      {/* 2. CATEGORÍAS CON AVISO DE SCROLL */}
      <div className="sticky top-0 z-40 bg-[#F5F5F4]/90 backdrop-blur-md pt-4 pb-2 mb-8 border-b-2 border-dashed border-black/10">
        <div className="relative max-w-7xl mx-auto">
          
          {/* Contenedor con scroll y máscara de desvanecimiento a la derecha */}
          <div className="relative group">
            <div 
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex justify-start md:justify-center gap-3 px-4 overflow-x-auto no-scrollbar pb-4 snap-x mask-fade-right"
            >
              {categorias.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoriaActual(cat)}
                  className={`
                    flex-shrink-0 snap-start px-6 py-2 rounded-xl font-black uppercase text-[10px] md:text-xs transition-all border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] 
                    active:shadow-none active:translate-x-1 active:translate-y-1
                    ${categoriaActual === cat
                      ? 'bg-[#D32F2F] text-white scale-105'
                      : 'bg-white text-black hover:bg-[#FFCA28]'
                    }
                  `}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Aviso visual solo para celulares (hidden en md) */}
            {showScrollHint && (
              <div className="md:hidden absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none animate-pulse">
                <div className="bg-black text-white text-[10px] font-black px-2 py-1 rounded-lg border-2 border-white shadow-lg flex items-center gap-1">
                  DESLIZA <span className="text-sm">→</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Pequeña línea indicadora estética */}
          <div className="flex justify-center mt-1 md:hidden">
             <div className="w-12 h-1 bg-black/10 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* 3. GRID DE PRODUCTOS */}
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-[8px] border-black border-t-[#D32F2F] rounded-full animate-spin mb-4"></div>
            <p className="font-black text-black italic animate-pulse tracking-widest text-center uppercase">Preparando el pedido...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            {filtrados.length > 0 ? (
              filtrados.map((item, index) => (
                <div
                  key={item.id}
                  className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-forwards"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <BurgerCard burger={item} />
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-20 bg-white border-4 border-dashed border-black rounded-3xl">
                <p className="text-2xl font-black text-black italic uppercase tracking-tighter px-4">
                  ¡Ay caramba! No hay {categoriaActual} disponibles
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        /* Efecto de desvanecimiento a la derecha para indicar más contenido */
        @media (max-width: 768px) {
          .mask-fade-right {
            mask-image: linear-gradient(to right, black 85%, transparent 100%);
            -webkit-mask-image: linear-gradient(to right, black 85%, transparent 100%);
          }
        }
      `}} />
    </main>
  );
}