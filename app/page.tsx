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

  const scrollRef = useRef<HTMLDivElement>(null);

  const categorias = [
    { id: 'todos', label: 'Todo', icon: '🍟' },
    { id: 'burgers', label: 'Burgers', icon: '🍔' },
    { id: 'bebidas', label: 'Bebidas', icon: '🥤' },
    { id: 'postres', label: 'Postres', icon: '🍦' },
    { id: 'combos', label: 'Combos', icon: '🎁' }
  ];

  const fetchProductos = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .order('nombre', { ascending: true });
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

  useEffect(() => {
    fetchProductos();
    checkAdminSession();
  }, [fetchProductos, checkAdminSession]);

  const filtrados = categoriaActual === 'todos'
    ? items
    : items.filter(item => item.categoria.toLowerCase() === categoriaActual.toLowerCase());

  return (
    <main className="min-h-screen pb-32 bg-stone-50 selection:bg-[#FFCA28]/30 text-stone-900">

      {/* BOTÓN ADMIN FLOTANTE */}
      {isAdmin && (
        <Link href="/admin" className="fixed bottom-28 left-4 z-[100] active:scale-90 transition-transform">
          <div className="bg-stone-900 text-[#FFCA28] p-4 rounded-full shadow-lg border border-stone-800">
            <span className="text-xl">⚙️</span>
          </div>
        </Link>
      )}

      {/* HERO SECTION - LOGO AJUSTADO */}
      <header className="relative pt-12 pb-16 px-6 overflow-hidden bg-white border-b border-stone-100">
        <div className="max-w-4xl mx-auto relative z-10 flex flex-col items-center text-center">

          {/* Badge Superior */}
          <div className="inline-block bg-emerald-100 text-emerald-700 text-[10px] font-bold px-4 py-1.5 rounded-full mb-8 uppercase tracking-wider border border-emerald-200 shadow-sm">
            Directo de Springfield
          </div>

          {/* Contenedor del Logo - Tamaño aumentado */}
          <div className="mb-10 relative flex justify-center items-center">
            {/* Ajustamos el brillo para que sea más grande (scale-150 o más) */}
            <div className="absolute inset-0 bg-[#FFCA28]/30 blur-[100px] rounded-full scale-[2] opacity-60" />

            <img
              src="/images/Krustyburgerheader.webp"
              alt="Krusty Burger Logo"
              className="relative w-64 h-64 md:w-80 md:h-80 object-contain drop-shadow-2xl transform transition-transform hover:scale-105 duration-300"
            />
          </div>

          <p className="text-base md:text-lg font-medium text-stone-500 max-w-md leading-relaxed">
            El sabor legendario que conquistó Springfield, ahora con ingredientes seleccionados de primera calidad.
          </p>
        </div>

        {/* Gradiente decorativo */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#FFCA28]/15 via-transparent to-white pointer-events-none" />
      </header>

      {/* NAV DE CATEGORÍAS */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b border-stone-100 shadow-sm">
        <div className="relative max-w-7xl mx-auto">
          <div
            ref={scrollRef}
            className="flex gap-3 px-6 py-5 overflow-x-auto no-scrollbar snap-x mask-fade-right"
          >
            {categorias.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoriaActual(cat.id)}
                className={`
                  flex items-center gap-2.5 px-6 py-3 rounded-full font-bold uppercase text-[11px] transition-all snap-start whitespace-nowrap
                  active:scale-95
                  ${categoriaActual === cat.id
                    ? 'bg-[#FFCA28] text-stone-950 shadow-md ring-1 ring-stone-900/5'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }
                `}
              >
                <span className="text-lg">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* SECCIÓN DE PRODUCTOS */}
      <section className="max-w-7xl mx-auto px-5 mt-12">
        <div className="flex items-center justify-between mb-10 px-2">
          <h2 className="text-3xl font-black text-stone-950 tracking-tighter flex items-center gap-3">
            <div className="w-2 h-8 bg-[#D32F2F] rounded-full" />
            {categoriaActual === 'todos' ? 'Nuestro Menú' : categoriaActual}
          </h2>
          <p className="text-sm font-bold text-stone-400 uppercase tracking-widest hidden md:block">
            {filtrados.length} Seleccionados
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-14 h-14 border-4 border-stone-100 border-t-[#D32F2F] rounded-full animate-spin" />
            <p className="mt-5 font-bold text-xs uppercase tracking-widest text-stone-400">Preparando pedido...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-10">
            {filtrados.length > 0 ? (
              filtrados.map((item, index) => (
                <div
                  key={item.id}
                  className="active:scale-[0.98] transition-transform animate-in fade-in slide-in-from-bottom-5 duration-500"
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <BurgerCard burger={item} />
                </div>
              ))
            ) : (
              <div className="col-span-full py-24 text-center bg-white rounded-[3rem] border border-stone-100 shadow-inner">
                <span className="text-7xl block mb-6">🤷‍♂️</span>
                <p className="text-xl font-bold text-stone-800 tracking-tight px-6">
                  ¡Ay caramba! No encontramos lo que buscás.
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      <style dangerouslySetInnerHTML={{
        __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        .mask-fade-right {
          mask-image: linear-gradient(to right, black 88%, transparent 100%);
          -webkit-mask-image: linear-gradient(to right, black 88%, transparent 100%);
        }

        * { -webkit-tap-highlight-color: transparent; }
      `}} />
    </main>
  );
}