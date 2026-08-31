// app/page.tsx
// deno-lint-ignore-file no-sloppy-imports
'use client';
import { useState, useEffect, useCallback } from 'react';
import BurgerCard from '../components/BurgerCard';
import { Burger } from '../types/index';
import { supabase } from '../lib/supabase';
import Link from 'next/link';
import { useAspectRatio } from './hooks/useAspectRatio';

export default function Home() {
  const screen = useAspectRatio();
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
  ];

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

      const { data, error } = await supabase
        .from('productos')
        .select(`
          *,
          producto_adicionales(
            adicionales(
              id,
              nombre,
              precio,
              descripcion
            )
          )
        `)
        .eq('disponible', true)
        .order('nombre', { ascending: true });

      if (error) {
        console.error('Error fetching productos:', error);
        return;
      }

      if (data) {
        const processedData = data.map((item: any) => {
          const adicionales = item.producto_adicionales
            ?.map((pa: any) => pa.adicionales)
            .filter((add: any) => add !== null) || [];

          return {
            ...item,
            producto_adicionales: item.producto_adicionales || [],
            adicionales: adicionales,
            imagen: item.imagen || '/images/placeholder-krusty.webp',
            categoria: item.categoria?.toLowerCase() || 'burgers'
          };
        });
        setItems(processedData as Burger[]);
      }
    } catch (error) {
      console.error('Error cargando el menú:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkAdminSession = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setIsAdmin(true);
    } catch (error) {
      console.error('Error checking admin session:', error);
    }
  }, []);

  useEffect(() => {
    fetchData();
    checkAdminSession();

    const handleScroll = () => {
      if (typeof window !== 'undefined') {
        const scrollY = window.scrollY;
        setIsScrolled(scrollY > 50);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [fetchData, checkAdminSession]);

  const filtrados = categoriaActual === 'todos'
    ? items
    : items.filter(item => {
      const cat = item.categoria?.toLowerCase() || '';
      return cat === categoriaActual.toLowerCase();
    });

  const handleVerMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setCategoriaActual('todos');
    const menuSection = document.getElementById('menu-section');
    if (menuSection) {
      menuSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#D32F2F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen pb-32 bg-[#fafafa] selection:bg-[#FFCA28]/30 text-[#292929]">

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {isAdmin && (
        <Link href="/admin" className="fixed bottom-28 left-4 z-110 active:scale-90 transition-transform">
          <div className="bg-black text-[#FFCA28] p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-[#FFCA28]">
            <span className="text-xl">⚙️</span>
          </div>
        </Link>
      )}

      {/* ============================================
          HERO SECTION - ANCHO COMPLETO EN 5:4
          ============================================ */}
      <header className={`relative z-30 overflow-hidden bg-white border-b-4 border-black transition-all duration-700 w-full
        ${isScrolled
          ? `pt-0 ${screen.paddingBottom} px-4 sm:px-6`
          : `${screen.paddingTop} ${screen.paddingBottom} px-4 sm:px-6`
        }`}
      >
        <div className={`w-full px-4 sm:px-6 lg:px-8 mx-auto relative z-10 flex flex-col items-center text-center
          ${screen.isSquare ? 'max-w-full' : 'max-w-7xl'}`}
        >
          <div className={`inline-block bg-[#D32F2F] text-white font-black ${screen.badgeSize} rounded-full ${screen.spacing} uppercase tracking-tighter border-2 border-black shadow-[3px_3px_0px_0px_black]`}>
            Directo de Springfield
          </div>

          <div className={`relative flex justify-center items-center w-full ${screen.spacing}`}>
            <div className="absolute inset-0 bg-[#FFCA28]/20 blur-[80px] rounded-full scale-[2] pointer-events-none" aria-hidden="true" />
            <div className={`relative ${screen.isSquare ? 'w-48 h-48 md:w-56 md:h-56' : screen.logoSize} animate-float`}>
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_20px_20px_rgba(0,0,0,0.2)]">
                <defs>
                  <clipPath id="heroLogoClip">
                    <circle cx="50" cy="50" r="50" />
                  </clipPath>
                </defs>
                <image
                  href="/images/Krustyburgerheader.webp"
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

          <h1 className={`font-krusty ${screen.titleSize} text-black mb-2 sm:mb-3 leading-none uppercase px-2 text-center w-full`}>
            El sabor que te <span className="text-[#D32F2F]">hace reír</span>
          </h1>

          <p className={`text-xs sm:text-sm md:text-base font-bold text-[#52525b] w-full max-w-2xl mx-auto leading-relaxed italic px-2 text-center`}>
            <span className="block">Ingredientes de primera calidad,</span>
            <span className="block">procesados por el mismísimo Krusty en Quilmes.</span>
          </p>
        </div>
      </header>

      {/* ============================================
          SECCIÓN ESPECIAL - ESTILO KRUSTY
          ============================================ */}
      <section className="relative z-20 overflow-hidden bg-white border-y-4 border-black py-16 md:py-20 px-6">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-1/2 bg-linear-to-b from-[#FF6B00]/20 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-linear-to-t from-[#FF6B00]/10 to-transparent" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-1/2 border-2 border-[#FF6B00]/10 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/3 border-2 border-[#FF6B00]/10 rounded-full" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-[#FF6B00] text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_0px_black]">
              <span className="w-2 h-2 bg-[#FFCA28] rounded-full animate-pulse" />
              ¡LA FÁBRICA DE LA RISA!
              <span className="w-2 h-2 bg-[#FFCA28] rounded-full animate-pulse delay-150" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            <div className="text-center lg:text-left flex flex-col justify-center">
              <h2 className="font-krusty text-4xl md:text-5xl lg:text-6xl text-black uppercase drop-shadow-[2px_2px_0px_#FF6B00] leading-none mb-4">
                Hechas con <span className="text-[#FF6B00]">amor</span>
                <br />
                y <span className="text-[#FF6B00]">explosivos</span>
              </h2>

              <p className="text-stone-700 text-sm md:text-base font-bold leading-relaxed max-w-lg mx-auto lg:mx-0">
                Carne 100% premium, queso que se estira hasta Springfield y
                el toque secreto del payaso más famoso del mundo.
                <span className="block mt-2 text-[#FF6B00]">
                  ¡Si no te atraganta, no es una Krusty!
                </span>
              </p>

              <div className="bg-[#FFF3E6] p-6 rounded-2xl border-2 border-[#FF6B00]/40 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-[#FF6B00] text-xs font-black uppercase tracking-wider">
                    ¡Ingrediente Secreto Revelado!
                  </span>
                </div>
                <h3 className="text-black text-2xl font-krusty">
                  ¿El secreto? <span className="text-[#FF6B00]">¡Risa!</span>
                </h3>
                <p className="text-stone-700 text-sm mt-2">
                  Y un toque de <span className="text-[#FF6B00] font-bold">explosivos</span>
                  {" "}que hacen cada bocado una <span className="text-[#FF6B00] font-bold">fiesta</span>.
                  <br />
                  <span className="text-xs opacity-60">(No te preocupes, son seguros. Casi siempre.)</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          NAV DE CATEGORÍAS
          ============================================ */}
      <nav
        className={`sticky z-40 transition-all duration-300 bg-white/95 backdrop-blur-md border-b-2 border-stone-200
          ${isScrolled ? 'top-14 shadow-md' : 'top-20 md:top-24'}`}
        style={{
          transform: 'translateZ(0)',
          willChange: 'transform'
        }}
      >
        <div className="max-w-7xl mx-auto overflow-x-auto no-scrollbar">
          <div className="flex gap-2 md:gap-4 px-4 sm:px-6 py-3 md:py-4 md:justify-center min-w-max">
            {categorias.map((cat) => (
              <button
                type="button"
                key={cat.id}
                onClick={() => setCategoriaActual(cat.id)}
                className={`
                  flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 rounded-full font-black uppercase text-[9px] sm:text-[10px] md:text-[11px] transition-all border-2 whitespace-nowrap
                  ${categoriaActual === cat.id
                    ? 'bg-[#FFCA28] text-black border-black shadow-[3px_3px_0px_0px_black] -translate-y-0.5'
                    : 'bg-white text-stone-500 border-transparent hover:bg-stone-100'
                  }
                `}
              >
                <span className="text-sm sm:text-base md:text-lg">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ============================================
          SECCIÓN DE PRODUCTOS
          ============================================ */}
      <section id="menu-section" className={`${screen.isSquare ? 'w-full max-w-full' : 'max-w-7xl'} mx-auto px-4 sm:px-6 lg:px-8 mt-10 md:mt-20`}>
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12 gap-4">
          <div>
            <h2 className="font-krusty text-3xl sm:text-4xl md:text-5xl text-black tracking-normal uppercase text-center md:text-left">
              <span className="text-[#D32F2F]">El</span> Menú
            </h2>
            <div className="w-16 sm:w-20 h-2 bg-[#FFCA28] border border-black mt-2 mx-auto md:mx-0" />
          </div>
          <p className="text-[10px] font-black text-[#52525b] uppercase tracking-[0.2em] bg-stone-100 px-3 py-1 rounded-full text-center md:text-right">
            {filtrados.length} OPCIONES DISPONIBLES
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-x-8 md:gap-y-12 justify-items-center">
          {filtrados.length > 0 ? (
            filtrados.map((item, index) => (
              <div key={item.id} className="transition-opacity duration-500 w-full max-w-sm">
                <BurgerCard
                  burger={item}
                  isFirst={index === 0}
                />
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 sm:py-32 text-center bg-white rounded-[3rem] border-4 border-black shadow-[8px_8px_0px_0px_black]">
              <span className="text-6xl sm:text-8xl block mb-6">🤡</span>
              <p className="font-krusty text-2xl sm:text-3xl text-black px-6 uppercase">
                ¡Ay caramba! No hay nada disponible.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ESTILOS GLOBALES */}
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