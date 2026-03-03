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
    <main className="min-h-screen bg-stone-50 pb-20">
      {/* Hero Header */}
      <header className="bg-yellow-400 py-16 px-4 border-b-8 border-red-600 mb-12">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-7xl md:text-9xl font-black text-red-600 italic drop-shadow-[0_5px_0_rgba(255,255,255,1)] tracking-tighter mb-4">
            KRUSTY BURGER
          </h1>
          <p className="text-xl md:text-2xl font-bold text-red-800 uppercase tracking-widest">
            "El sabor que te dejará sin aliento"
          </p>
        </div>
      </header>

      {/* Selector de Categorías */}
      <div className="sticky top-20 z-40 bg-stone-50/80 backdrop-blur-md py-4 mb-8">
        <div className="flex justify-center gap-2 md:gap-4 px-4 overflow-x-auto no-scrollbar">
          {categorias.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoriaActual(cat)}
              className={`px-8 py-3 rounded-full font-black uppercase text-sm transition-all shadow-md ${
                categoriaActual === cat 
                ? 'bg-red-600 text-white scale-110' 
                : 'bg-white text-red-600 border-2 border-red-600 hover:bg-red-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Productos */}
      <div className="max-w-7xl mx-auto px-4">
        {loading ? (
          <div className="text-center font-bold text-2xl animate-pulse text-stone-400">
            CALENTANDO LA PARRILLA...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filtradas.map((b) => (
              <BurgerCard key={b.id} burger={b} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}