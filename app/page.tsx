// deno-lint-ignore-file no-sloppy-imports
'use client';
import { useState, useEffect, useCallback } from 'react';
import BurgerCard from '../components/BurgerCard';
import { Burger } from '../types/index';
import { supabase } from '../lib/supabase';
import Link from 'next/link';
import Image from 'next/image';
import KrustyLoader from '@/components/KrustyLoader';

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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "name": "Krusty Burger Oficial | Quilmes",
    "image": "https://krustyburger.com.ar/images/Krustyargentina.jpeg",
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
      globalThis.requestAnimationFrame(() => {
        setIsScrolled(globalThis.scrollY > 50);
      });
    };

    globalThis.addEventListener('scroll', handleScroll, { passive: true });
    return () => globalThis.removeEventListener('scroll', handleScroll);
  }, [fetchData, checkAdminSession]);

  const filtrados = categoriaActual === 'todos'
    ? items
    : items.filter(item => item.categoria.toLowerCase() === categoriaActual.toLowerCase());

  const handleVerCombos = (e: React.MouseEvent) => {
    e.preventDefault();
    setCategoriaActual('combos');
    const menuSection = document.getElementById('menu-section');
    if (menuSection) {
      menuSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading) {
    return <KrustyLoader />;
  }

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

      {/* ============================================
          HERO SECTION - LOGO REDONDEADO CON SVG
          ============================================ */}
      <header className="relative pt-24 pb-20 px-6 overflow-hidden bg-white border-b-4 border-black">
        <div className="max-w-5xl mx-auto relative z-10 flex flex-col items-center text-center">
          <div className="inline-block bg-[#D32F2F] text-white text-[11px] font-black px-5 py-2 rounded-full mb-8 uppercase tracking-tighter border-2 border-black shadow-[3px_3px_0px_0px_black]">
            Directo de Springfield
          </div>

          <div className="mb-10 relative flex justify-center items-center">
            <div className="absolute inset-0 bg-[#FFCA28]/20 blur-[80px] rounded-full scale-[2] pointer-events-none" aria-hidden="true" />

            <div className="relative w-64 h-64 md:w-80 md:h-80 animate-float">
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_20px_20px_rgba(0,0,0,0.2)]">
                <defs>
                  <clipPath id="heroLogoClip">
                    <circle cx="50" cy="50" r="50" />
                  </clipPath>
                </defs>
                <image
                  href="/images/Krustyargentina.jpeg"
                  x="0"
                  y="0"
                  width="100"
                  height="100"
                  clipPath="url(#heroLogoClip)"
                  preserveAspectRatio="xMidYMid slice"
                />
              </svg>
            </div>
          </div>

          <h1 className="font-krusty text-3xl md:text-5xl text-black mb-4 leading-none uppercase">
            El sabor que te <span className="text-[#D32F2F]">hace reír</span>
          </h1>
          <p className="text-sm md:text-base font-bold text-[#52525b] max-w-lg leading-[1.5] italic">
            Ingredientes de primera calidad, procesados por el mismísimo Krusty en Villa La Florida.
          </p>
        </div>
      </header>

      {/* ============================================
          SECCIÓN ESPECIAL - MUNDIAL 2026 🇦🇷
          ============================================ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0a1a3a] via-[#1a3a6a] to-[#2d5a8a] border-y-4 border-black py-20 px-6">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-[#FFCA28]/20 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-[#FFCA28]/10 to-transparent" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-1/2 border-2 border-white/20 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/3 border-2 border-white/20 rounded-full" />
        </div>

        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 text-4xl animate-pulse">⭐</div>
          <div className="absolute top-10 right-10 text-4xl animate-pulse delay-200">⭐</div>
          <div className="absolute bottom-10 left-10 text-4xl animate-pulse delay-300">⭐</div>
          <div className="absolute bottom-10 right-10 text-4xl animate-pulse delay-100">⭐</div>
          <div className="absolute top-1/2 left-5 text-3xl animate-pulse delay-500">⭐</div>
          <div className="absolute top-1/2 right-5 text-3xl animate-pulse delay-400">⭐</div>
          <div className="absolute top-20 left-1/3 text-3xl animate-pulse delay-150">⭐</div>
          <div className="absolute bottom-20 right-1/3 text-3xl animate-pulse delay-250">⭐</div>
          <div className="absolute top-1/3 left-10 text-3xl animate-pulse delay-350">⭐</div>
          <div className="absolute bottom-1/3 right-10 text-3xl animate-pulse delay-450">⭐</div>
        </div>

        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-[#D32F2F] text-white text-[10px] font-black px-4 py-1.5 rounded-full mb-6 uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_0px_black]">
            <span className="w-2 h-2 bg-[#FFCA28] rounded-full animate-pulse" />
            ¡VIVIMOS EL MUNDIAL 2026!
            <span className="w-2 h-2 bg-[#FFCA28] rounded-full animate-pulse delay-150" />
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
            {/* ESCUDO DE ARGENTINA CON ANIMACIÓN BOUNCE */}
            <div className="flex-shrink-0 group animate-bounce">
              <div className="relative">
                <div className="absolute -inset-4 bg-[#FFCA28]/20 rounded-full blur-2xl animate-pulse" />
                <div className="relative w-36 h-36 md:w-44 md:h-44 transform -rotate-6 group-hover:rotate-12 group-hover:scale-105 transition-all duration-500">
                  <Image
                    src="/images/escudoafa.png"
                    alt="Escudo de Argentina"
                    fill
                    className="object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)]"
                    sizes="176px"
                    priority
                  />
                </div>
              </div>
            </div>

            <div className="flex-1">
              <h2 className="font-krusty text-4xl md:text-6xl text-white uppercase drop-shadow-[3px_3px_0px_black] leading-none mb-3">
                ¡Vamos por la <span className="text-[#FFCA28]">4ta</span> Estrella!
              </h2>
              <p className="text-white/90 text-sm md:text-base font-bold max-w-2xl mx-auto leading-relaxed drop-shadow-[1px_1px_0px_rgba(0,0,0,0.5)]">
                Con 3 estrellas en el pecho, la Argentina busca la gloria eterna.
                Sumate a la fiesta con nuestros combos especiales. ¡Dale campeón! ⚽🏆
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                  <span className="text-2xl">⭐</span>
                  <span className="text-white font-black text-sm">3 Estrellas</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                  <span className="text-2xl">🏆</span>
                  <span className="text-white font-black text-sm">¡Vamos por la 4ta!</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                  <span className="text-2xl">⚽</span>
                  <span className="text-white font-black text-sm">Mundial 2026</span>
                </div>
              </div>

              <div className="mt-8 inline-block relative group/btn">
                <div className="absolute -inset-1 bg-[#FFCA28]/30 rounded-full blur-md group-hover/btn:blur-xl transition-all animate-pulse" />
                <button
                  onClick={handleVerCombos}
                  className="relative inline-flex items-center gap-3 bg-[#FFCA28] text-black font-black px-10 py-4 rounded-full border-2 border-black shadow-[4px_4px_0px_0px_black] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all uppercase text-sm tracking-wider cursor-pointer"
                >
                  <span>Ver Combos Especiales</span>
                  <span className="text-xl">🏆</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          NAV DE CATEGORÍAS
          ============================================ */}
      <nav className={`sticky z-40 transition-all duration-300 bg-white/95 backdrop-blur-md border-b-2 border-stone-200
        ${isScrolled ? 'top-16 shadow-md' : 'top-24'}`}
      >
        <div className="max-w-7xl mx-auto overflow-x-auto no-scrollbar">
          <div className="flex gap-2 md:gap-4 px-6 py-4 md:justify-center min-w-max">
            {categorias.map((cat) => (
              <button
                type="button"
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

      {/* ============================================
          SECCIÓN DE PRODUCTOS
          ============================================ */}
      <section id="menu-section" className="max-w-7xl mx-auto px-6 mt-12 md:mt-20">
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
      </section>

      {/* ============================================
          ESTILOS GLOBALES
          ============================================ */}
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