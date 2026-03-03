"use client";
import { useState, useEffect } from 'react';
import { useCartStore } from '@/store/cartStore';
import CartDrawer from './CartDrawer';

export default function Navbar() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const items = useCartStore((state) => state.items);
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    const handleScroll = () => {
      // Se activa después de 120px para que el Hero Header ya se haya lucido
      setIsScrolled(window.scrollY > 120);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav className={`sticky top-0 z-50 transition-all duration-500 px-4 md:px-12 flex justify-between items-center h-20
        ${isScrolled 
          ? 'bg-red-600 border-b-4 border-black shadow-[0_4px_0_0_rgba(0,0,0,1)] py-3' 
          : 'bg-transparent py-6'}`}
      >
        {/* Logo: Solo visible cuando haces scroll para no repetir con el Hero */}
        <div className={`transition-all duration-500 transform ${
          isScrolled ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10 pointer-events-none'
        }`}>
          <h1 className="text-2xl md:text-3xl font-black italic tracking-tighter text-white drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            KRUSTY <span className="text-yellow-400 uppercase">Burger</span>
          </h1>
        </div>
        
        {/* Botón del Carrito: Siempre visible pero cambia de estilo */}
        <button 
          onClick={() => setIsCartOpen(true)}
          className={`relative group flex items-center gap-3 font-black transition-all active:scale-95 border-4 border-black rounded-2xl px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
            ${isScrolled 
              ? 'bg-yellow-400 text-black' 
              : 'bg-white text-black hover:bg-yellow-400'}`}
        >
          <span className={`text-2xl transition-transform ${totalItems > 0 ? 'group-hover:rotate-12' : ''}`}>
            🍔
          </span>

          <div className="flex flex-col items-start leading-tight">
            <span className="text-[10px] uppercase opacity-70">Pedido</span>
            <span className="text-lg -mt-1">{totalItems}</span>
          </div>

          {totalItems > 0 && (
            <span className="absolute -top-3 -right-3 bg-red-600 text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-black animate-bounce shadow-md">
              {totalItems}
            </span>
          )}
        </button>
      </nav>

      {/* El Drawer se mantiene igual */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}