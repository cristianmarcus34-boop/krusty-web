"use client";

import { useState, useEffect, useRef } from 'react';
import { useCartStore } from '@/store/cartStore';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import CartDrawer from './CartDrawer';
import Link from 'next/link';
import Image from 'next/image';

const ADMIN_EMAILS = ['cristianmarcus34@gmail.com', 'marianajuarez99@gmail.com'];

export default function Navbar() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const items = useCartStore((state) => state.items);
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    const handleHashOpenCart = () => {
      if (window.location.hash === '#carrito') {
        setIsCartOpen(true);
      }
    };

    handleHashOpenCart();
    window.addEventListener('hashchange', handleHashOpenCart);

    audioRef.current = new Audio('/sounds/risa-krusty.mp3');
    audioRef.current.volume = 0.4;

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };

    const handleUserData = (currentUser: User | null) => {
      setUser(currentUser);
      const email = currentUser?.email?.toLowerCase().trim();
      setIsAdmin(!!email && ADMIN_EMAILS.includes(email));
    };

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      handleUserData(session?.user ?? null);
    };

    initAuth();
    window.addEventListener('scroll', handleScroll);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleUserData(session?.user ?? null);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('hashchange', handleHashOpenCart);
      subscription.unsubscribe();
    };
  }, []);

  const playKrustyLaugh = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        console.log("Audio interactivo activado");
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const handleCloseCart = () => {
    setIsCartOpen(false);
  };

  const userDisplayName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Cliente';

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-100 flex flex-col">
        <div className={`bg-[#FFCA28] text-black text-[10px] md:text-xs font-black py-1.5 text-center uppercase tracking-widest border-b border-black/10 transition-all duration-500 transform
          ${isScrolled ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}
        >
          🍟 ¡Todas nuestras hamburguesas incluyen papas fritas! 🍟
        </div>

        <nav className={`transition-all duration-500 px-4 md:px-8 transform
          ${isScrolled
            ? 'h-16 bg-white/90 backdrop-blur-md border-b border-stone-200 shadow-md -translate-y-7 md:-translate-y-8'
            : 'h-24 bg-transparent translate-y-0'}`}
        >
          <div className="max-w-7xl mx-auto h-full flex items-center justify-between">

            {/* LOGO */}
            <div className="flex items-center">
              <Link
                href="/"
                onClick={playKrustyLaugh}
                className={`relative transition-all duration-500 hover:rotate-12 active:scale-95
                  ${isScrolled ? 'w-10 h-10' : 'w-14 h-14'}`}
              >
                <Image
                  src="/images/Krustyburgerheader.webp"
                  alt="Krusty Logo"
                  fill
                  className="object-cover rounded-full"
                  priority
                  sizes="(max-width: 768px) 40px, 56px"
                  unoptimized
                />
              </Link>
            </div>

            {/* LOGO CENTRO */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
              <Link
                href="/"
                onClick={playKrustyLaugh}
                className={`flex items-center group active:scale-95 transition-all duration-700
                  ${isScrolled
                    ? 'opacity-100 translate-y-0 scale-100'
                    : 'opacity-0 -translate-y-4 scale-90 pointer-events-none'}`}
              >
                <div className="relative hidden md:block w-8 h-8 mr-2">
                  <Image
                    src="/images/Krustyburgerheader.webp"
                    alt="Krusty Logo"
                    fill
                    className="object-cover rounded-full"
                    sizes="32px"
                    unoptimized
                  />
                </div>

                <h1 className="text-xl md:text-2xl font-black italic tracking-tighter whitespace-nowrap">
                  <span className="text-[#D32F2F]">KRUSTY</span> <span className="text-black">BURGER</span>
                </h1>
              </Link>
            </div>

            {/* ✅ BOTONES - VERSIÓN SIMPLIFICADA */}
            <div className="flex items-center gap-2 md:gap-3">
              {/* PERFIL / LOGIN */}
              <Link
                href={user ? '/perfil' : '/login'}
                className={`flex items-center gap-1 md:gap-2 h-11 px-3 md:px-4 rounded-2xl font-black text-xs transition-all active:scale-95 border-2 ${isScrolled
                    ? 'bg-[#FFCA28] text-black border-black shadow-md hover:bg-[#f5b800]'
                    : 'bg-[#FFCA28] text-black border-black shadow-[4px_4px_0px_0px_black] hover:translate-x-px hover:translate-y-px hover:shadow-none'
                  }`}
              >
                <span className="text-lg">{user ? '👤' : '🔑'}</span>
                <span className="hidden md:inline font-black uppercase tracking-tighter">
                  {user ? 'Perfil' : 'Ingresar'}
                </span>
              </Link>

              {/* SALIR */}
              {user && (
                <button
                  onClick={handleLogout}
                  className={`flex items-center gap-1 md:gap-2 h-11 px-3 md:px-4 rounded-2xl font-black text-xs transition-all active:scale-95 border-2 ${isScrolled
                      ? 'bg-[#D32F2F] text-white border-[#D32F2F] shadow-md hover:bg-[#b0151a]'
                      : 'bg-[#D32F2F] text-white border-black shadow-[4px_4px_0px_0px_black] hover:bg-[#b0151a] hover:translate-x-px hover:translate-y-px hover:shadow-none'
                    }`}
                >
                  <span className="text-lg">🚪</span>
                  <span className="hidden md:inline font-black uppercase tracking-tighter">Salir</span>
                </button>
              )}

              {/* CARRITO */}
              <button
                onClick={() => setIsCartOpen(true)}
                className={`relative flex items-center gap-1 md:gap-2 h-11 px-3 md:px-4 rounded-2xl font-black text-xs transition-all active:scale-95 border-2 ${isScrolled
                    ? 'bg-[#D32F2F] text-white border-[#D32F2F] shadow-md hover:bg-[#b0151a]'
                    : 'bg-white text-black border-black shadow-[4px_4px_0px_0px_black] hover:translate-x-px hover:translate-y-px hover:shadow-none'
                  }`}
              >
                <span className="text-lg">🛒</span>
                <span className="hidden md:inline font-black uppercase tracking-tighter">
                  {totalItems > 0 ? `${totalItems}` : 'Carrito'}
                </span>

                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1.5 flex items-center justify-center text-[10px] font-black rounded-full border-2 bg-[#D32F2F] text-white border-black">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>

          </div>
        </nav>
      </div>

      <div className="h-24 md:h-32 w-full" />
      <CartDrawer isOpen={isCartOpen} onClose={handleCloseCart} />
    </>
  );
}