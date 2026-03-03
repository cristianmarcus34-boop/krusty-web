"use client";
import { useState, useEffect } from 'react';
import BurgerCard from '@/components/BurgerCard';
import { Burger } from '@/types';

export default function Home() {
  const [burgers, setBurgers] = useState<Burger[]>([]);
  const [categoriaActual, setCategoriaActual] = useState('todos');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/burgers')
      .then(res => res.json())
      .then(data => {
        setBurgers(data);
        setLoading(false);
      });
  }, []);

  const categorias = ['todos', 'clasicas', 'especiales', 'combos'];

  const filtradas = categoriaActual === 'todos' 
    ? burgers 
    : burgers.filter(b => b.categoria === categoriaActual);

  return (
    <main 
      className="min-h-screen pb-20 bg-[#F5F5F4]" 
      style={{ 
        backgroundImage: 'radial-gradient(#d1d5db 1px, transparent 1px)', 
        backgroundSize: '20px 20px' 
      }}
    >
      {/* 1. HERO HEADER: Más compacto y profesional */}
      <header className="bg-[#FFCA28] py-12 md:py-20 px-4 border-b-[8px] border-black mb-8 relative overflow-hidden">
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <h1 
            className="text-6xl md:text-9xl font-black text-[#D32F2F] italic tracking-tighter mb-4"
            style={{ filter: 'drop-shadow(5px 5px 0px black)' }}
          >
            KRUSTY BURGER
          </h1>
          <div className="inline-block bg-white border-[4px] border-black px-4 md:px-8 py-2 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] -rotate-1">
            <p className="text-sm md:text-2xl font-black text-black uppercase italic tracking-tighter">
              "El sabor que te dejará sin aliento"
            </p>
          </div>
        </div>
      </header>

      {/* 2. CATEGORÍAS: Estilo App de navegación rápida */}
      <div className="sticky top-0 z-40 bg-[#F5F5F4]/90 backdrop-blur-md py-4 mb-8 border-b-2 border-dashed border-black/10">
        <div className="relative max-w-7xl mx-auto">
          <div className="flex justify-start md:justify-center gap-3 px-4 overflow-x-auto no-scrollbar pb-2 snap-x">
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
            <div className="flex-shrink-0 w-4 md:hidden"></div>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-[#F5F5F4] to-transparent pointer-events-none md:hidden" />
        </div>
      </div>

      {/* 3. GRID PROFESIONAL: 2 columnas en móvil, 4 en desktop */}
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-[6px] border-black border-t-[#D32F2F] rounded-full animate-spin mb-4"></div>
            <p className="font-black text-black italic animate-pulse">CARGANDO...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            {filtradas.map((b, index) => (
              <div 
                key={b.id} 
                className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-forwards"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <BurgerCard burger={b} />
              </div>
            ))}
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </main>
  );
}