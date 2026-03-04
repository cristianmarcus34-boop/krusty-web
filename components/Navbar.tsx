"use client";
import { useState, useEffect } from 'react';
import { useCartStore } from '@/store/cartStore';
import { supabase } from '@/lib/supabase';
import CartDrawer from './CartDrawer';
import Link from 'next/link';

// Lista blanca de correos autorizados
const ADMIN_EMAILS = ['cristianmarcus34@gmail.com', 'marianajuarez99@gmail.com'];

export default function Navbar() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const items = useCartStore((state) => state.items);
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    // 1. Manejo de Scroll
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 120);
    };

    // 2. Función unificada para validar si el mail es admin
    const checkAdminStatus = (userEmail: string | undefined) => {
      if (userEmail && ADMIN_EMAILS.includes(userEmail.toLowerCase().trim())) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    };

    // 3. Ejecución inicial al cargar
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      checkAdminStatus(session?.user?.email);
    };

    initAuth();
    window.addEventListener('scroll', handleScroll);

    // 4. Suscripción a cambios de sesión (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      checkAdminStatus(session?.user?.email);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      subscription.unsubscribe();
    };
  }, []);

  return (
    <>
      <nav className={`sticky top-0 z-[100] transition-all duration-500 px-4 md:px-12 flex justify-between items-center h-20
        ${isScrolled 
          ? 'bg-[#D32F2F] border-b-4 border-black shadow-[0_4px_0_0_rgba(0,0,0,1)]' 
          : 'bg-transparent'}`}
      >
        {/* Logo que aparece al scrollear */}
        <div className={`transition-all duration-500 transform ${
          isScrolled ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10 pointer-events-none'
        }`}>
          <h1 className="text-2xl md:text-3xl font-black italic tracking-tighter text-white drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            KRUSTY <span className="text-[#FFCA28] uppercase">Burger</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          {/* BOTÓN STAFF: Solo se muestra si NO eres admin */}
          {!isAdmin && (
            <Link href="/admin/login">
              <button className={`flex items-center gap-2 font-black transition-all active:scale-95 border-[3px] border-black rounded-xl px-3 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                ${isScrolled ? 'bg-white text-black' : 'bg-[#FFCA28] text-black hover:bg-white'}`}>
                <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                <span className="text-[10px] font-black uppercase italic">Staff</span>
              </button>
            </Link>
          )}

          {/* BOTÓN CARRITO */}
          <button 
            onClick={() => setIsCartOpen(true)}
            className={`relative group flex items-center gap-3 font-black transition-all active:scale-95 border-[3px] border-black rounded-xl px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
              ${isScrolled ? 'bg-[#FFCA28] text-black' : 'bg-white text-black hover:bg-[#FFCA28]'}`}
          >
            <span className="text-xl">🍔</span>
            <div className="flex flex-col items-start leading-tight">
              <span className="text-[10px] uppercase opacity-70">Pedido</span>
              <span className="text-lg -mt-1">{totalItems}</span>
            </div>
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-black animate-bounce">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </nav>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}