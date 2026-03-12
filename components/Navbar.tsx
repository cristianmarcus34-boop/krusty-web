"use client";
import { useState, useEffect } from 'react';
import { useCartStore } from '@/store/cartStore';
import { supabase } from '@/lib/supabase';
import CartDrawer from './CartDrawer';
import Link from 'next/link';

const ADMIN_EMAILS = ['cristianmarcus34@gmail.com', 'marianajuarez99@gmail.com'];

export default function Navbar() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const items = useCartStore((state) => state.items);
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    const checkAdminStatus = (userEmail: string | undefined) => {
      if (userEmail && ADMIN_EMAILS.includes(userEmail.toLowerCase().trim())) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    };

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      checkAdminStatus(session?.user?.email);
    };

    initAuth();
    window.addEventListener('scroll', handleScroll);

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
      <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 px-4 md:px-10
        ${isScrolled 
          ? 'h-16 bg-white border-b-2 border-stone-100 shadow-sm' 
          : 'h-24 bg-transparent'}`}
      >
        <div className="max-w-7xl mx-auto h-full grid grid-cols-2 md:grid-cols-3 items-center">
          
          {/* 1. LADO IZQUIERDO: Espaciador en desktop, invisible en móvil si no hay menú */}
          <div className="hidden md:flex items-center">
            <div className={`w-10 h-10 rounded-full bg-[#D32F2F] flex items-center justify-center transition-transform duration-500 ${isScrolled ? 'scale-75' : 'scale-100'}`}>
              <span className="text-white text-xs font-black italic">K</span>
            </div>
          </div>

          {/* 2. LOGO CENTRAL: Con posición relativa para evitar colisiones */}
          <div className="flex justify-start md:justify-center">
            <Link href="/" className="flex flex-col items-center group">
              <h1 className={`text-xl md:text-2xl font-black italic tracking-tighter transition-all duration-500
                ${isScrolled 
                  ? 'text-[#D32F2F] scale-90' 
                  : 'text-[#FFCA28] drop-shadow-[2px_2px_0px_black] scale-110'}`}>
                KRUSTY <span className={isScrolled ? 'text-black' : 'text-white'}>BURGER</span>
              </h1>
              {!isScrolled && (
                <div className="h-1 w-8 bg-[#D32F2F] rounded-full mt-0.5 group-hover:w-16 transition-all duration-500"></div>
              )}
            </Link>
          </div>
          
          {/* 3. LADO DERECHO: Carrito con espaciado garantizado */}
          <div className="flex justify-end items-center">
            <button 
              onClick={() => setIsCartOpen(true)}
              className={`relative flex items-center gap-2 md:gap-3 px-3 md:px-6 py-2 rounded-full font-black transition-all active:scale-90 border-2
                ${isScrolled 
                  ? 'bg-[#D32F2F] text-white border-transparent shadow-md' 
                  : 'bg-white text-black border-black shadow-[3px_3px_0px_0px_black] hover:bg-[#FFCA28]'}`}
            >
              <span className="text-base md:text-xl">🛒</span>
              
              <div className="flex flex-col items-start leading-none text-left">
                <span className="text-[8px] md:text-[9px] uppercase font-black opacity-80 tracking-tighter">Tu Bolsa</span>
                <span className="text-xs md:text-sm font-black italic">
                  {totalItems > 0 ? `${totalItems} ítems` : 'Vacía'}
                </span>
              </div>

              {/* Badge de cantidad */}
              {totalItems > 0 && (
                <span className={`absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-[10px] font-black rounded-full border
                  ${isScrolled ? 'bg-[#FFCA28] text-black border-white' : 'bg-[#D32F2F] text-white border-black'}`}>
                  {totalItems}
                </span>
              )}
            </button>
          </div>

        </div>
      </nav>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}