"use client";
import { useState } from 'react'; // Para manejar si está abierto o cerrado
import { useCartStore } from '@/store/cartStore';
import CartDrawer from './CartDrawer';

export default function Navbar() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const items = useCartStore((state) => state.items);
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <>
      <nav className="sticky top-0 z-50 bg-red-600 text-white p-4 shadow-xl flex justify-between items-center px-6 md:px-12">
        <h1 className="text-3xl font-black italic tracking-tighter drop-shadow-md">
          KRUSTY <span className="text-yellow-400">BURGER</span>
        </h1>
        
        {/* Botón del Carrito */}
        <button 
          onClick={() => setIsCartOpen(true)}
          className="bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-2 rounded-full font-black flex items-center gap-3 shadow-lg transition-all active:scale-90"
        >
          <span className="text-xl">🍔</span>
          <span className="bg-red-600 text-white px-2 py-0.5 rounded-md text-sm">
            {totalItems}
          </span>
        </button>
      </nav>

      {/* Inyectamos el Drawer aquí */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}