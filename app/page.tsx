"use client";

import { useState, useEffect, useCallback } from 'react';
import BurgerCard from '@/components/BurgerCard';
import { Burger } from '@/types';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  const [items, setItems] = useState<Burger[]>([]);
  const [categoriaActual, setCategoriaActual] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const categorias = [
    { id: 'todos', label: 'Todo', icon: '🍟' },
    { id: 'burgers', label: 'Burgers', icon: '🍔' },
    { id: 'bebidas', label: 'Bebidas', icon: '🥤' },
    { id: 'postres', label: 'Postres', icon: '🍦' },
    { id: 'combos', label: 'Combos', icon: '🎁' }
  ];

  // Schema.org para SEO - Movido a una constante estática fuera del render si fuera posible, 
  // pero aquí lo mantenemos limpio.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "name": "Krusty Burger Oficial | Quilmes",
    "image": "https://krustyburger.com.ar/images/Krustyburgerheader.webp",
    "description": "Las mejores hamburguesas de Villa La Florida. ¡Si no se atraganta, no es una Krusty!",
    "servesCuisine": "Hamburguesas, Americana",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Villa La Florida, Quilmes",
      "addressRegion": "Buenos Aires",
      "addressCountry": "AR"
    },
    "url": "https://krustyburger.com.ar",
    "telephone": "+5491127344686",
    "priceRange": "$$",
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "opens": "19:00",
        "closes": "23:59"
      }
    ]
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Optimizamos la query: solo pedimos lo que necesitamos para la card
      const { data, error } = await supabase
        .from('productos')
        .select('*, adicionales:producto_adicionales(adicionales(*))')
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
    fetchData();
    checkAdminSession();

    const handleScroll = () => {
      // Usamos requestAnimationFrame para que el scroll no bloquee el hilo principal
      window.requestAnimationFrame(() => {
        setIsScrolled(window.scrollY > 50);
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [fetchData, checkAdminSession]);

  // Filtrado optimizado
  const filtrados = categoriaActual === 'todos'
    ? items
    : items.filter(item => item.categoria.toLowerCase() === categoriaActual.toLowerCase());

  return (
    <main className="min-h-screen pb-32 bg-[#fafafa] selection:bg-[#FFCA28]/30 text-[#292929]">
      
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {isAdmin && (
        <Link href="/admin" className="fixed bottom-28 left-4 z-[110] active:scale-90 transition-transform">
          <div className="bg-black text-[#FFCA28] p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-[#FFCA28]">
            <span className="text-xl">⚙️</span>
          </div>
        </Link>
      )}

      {/* HERO SECTION */}
      <header className="relative pt-24 pb-20 px-6 overflow-hidden bg-white border-b-4 border-black">
        <div className="max-w-5xl mx-auto relative z-10 flex flex-col items-center text-center">
          <div className="inline-block bg-[#D32F2F] text-white text-[11px] font-black px-5 py-2 rounded-full mb-8 uppercase tracking-tighter border-2 border-black shadow-[3px_3px_0px_0px_black]">
            Directo de Springfield
          </div>

          <div className="mb-10 relative flex justify-center items-center">
            {/* Brillo optimizado: Usamos opacity fija para evitar recalcular blur en el thread principal */}
            <div className="absolute inset-0 bg-[#FFCA28]/20 blur-[80px] rounded-full scale-[2] pointer-events-none" aria-hidden="true" />

            <div className="relative w-64 h-64 md:w-80 md:h-80 animate-float">
              <Image
                src="/images/Krustyburgerheader.webp"
                alt="Krusty Burger Logo"
                width={320}
                height={320}
                priority
                loading="eager"
                fetchPriority="high"
                decoding="sync"
                className="object-contain drop-shadow-[0_20px_20px_rgba(0,0,0,0.2)]"
              />
            </div>
          </div>

          <h1 className="font-krusty text-3xl md:text-5xl text-black mb-4 leading-none uppercase">
            El sabor que te <span className="text-[#D32F2F]">hace reír</span>
          </h1>
          {/* ACCESIBILIDAD: Oscurecemos el gris del subtítulo */}
          <p className="text-sm md:text-base font-bold text-[#52525b] max-w-lg leading-[1.5] italic">
            Ingredientes de primera calidad, procesados por el mismísimo Krusty en Villa La Florida.
          </p>
        </div>
      </header>

      {/* NAV DE CATEGORÍAS */}
      <nav className={`sticky z-40 transition-all duration-300 bg-white/95 backdrop-blur-md border-b-2 border-stone-200
        ${isScrolled ? 'top-16 shadow-md' : 'top-24'}`}
      >
        <div className="max-w-7xl mx-auto overflow-x-auto no-scrollbar">
          <div className="flex gap-2 md:gap-4 px-6 py-4 md:justify-center min-w-max">
            {categorias.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoriaActual(cat.id)}
                className={`
                  flex items-center gap-2 px-5 py-2.5 rounded-full font-black uppercase text-[11px] transition-all border-2
                  ${categoriaActual === cat.id
                    ? 'bg-[#FFCA28] text-black border-black shadow-[3px_3px_0px_0px_black] -translate-y-0.5'
                    : 'bg-white text-stone-500 border-transparent hover:bg-stone-100'
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
      <section className="max-w-7xl mx-auto px-6 mt-12 md:mt-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <h2 className="font-krusty text-4xl md:text-5xl text-black tracking-normal uppercase">
              <span className="text-[#D32F2F]">El</span> Menú
            </h2>
            <div className="w-20 h-2 bg-[#FFCA28] border border-black mt-2" />
          </div>
          <p className="text-[10px] font-black text-[#52525b] uppercase tracking-[0.2em] bg-stone-100 px-3 py-1 rounded-full">
            {filtrados.length} OPCIONES DISPONIBLES
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-16 h-16 border-[6px] border-stone-200 border-t-[#D32F2F] rounded-full animate-spin" />
            <p className="mt-6 font-krusty text-xl tracking-widest text-black uppercase">Cocinando...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-10 md:gap-y-16">
            {filtrados.length > 0 ? (
              filtrados.map((item) => (
                <div key={item.id} className="transition-opacity duration-500">
                  <BurgerCard burger={item} />
                </div>
              ))
            ) : (
              <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border-4 border-black shadow-[8px_8px_0px_0px_black]">
                <span className="text-8xl block mb-6">🤡</span>
                <p className="font-krusty text-3xl text-black px-6 uppercase">
                  ¡Ay caramba! No hay nada disponible.
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        .animate-float {
          animation: float 4s ease-in-out infinite;
          will-change: transform;
        }
      `}</style>
    </main>
  );
}