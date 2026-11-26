"use client";

import { useState, useEffect } from 'react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import CartDrawer from './CartDrawer';
import Link from 'next/link';
import Image from 'next/image';

// ✅ Audio singleton para el sonido de risa (solo se crea al primer click)
let krustyLaughAudio: HTMLAudioElement | null = null;

function playKrustyLaugh() {
  if (typeof window === 'undefined') return;
  if (!krustyLaughAudio) {
    krustyLaughAudio = new Audio('/sounds/risa-krusty.mp3');
    krustyLaughAudio.volume = 0.4;
    krustyLaughAudio.preload = 'auto';
  }
  krustyLaughAudio.currentTime = 0;
  krustyLaughAudio.play().catch(() => { });
}

export default function Navbar() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const { isAuthenticated, cerrarSesion } = useAuthStore();

  const items = useCartStore((state) => state.items);
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  // ============================================================
  // 🛒 ABRIR CARRITO AUTOMÁTICAMENTE DESPUÉS DEL LOGIN
  // ============================================================
  useEffect(() => {
    const carritoEstabaAbierto = localStorage.getItem('krusty-carrito-abierto') === 'true';

    if (carritoEstabaAbierto && isAuthenticated) {
      localStorage.removeItem('krusty-carrito-abierto');
      setIsCartOpen(true);
    }
  }, [isAuthenticated]);

  // ============================================================
  // 🔄 INICIALIZACIÓN: hash, scroll
  // ============================================================
  useEffect(() => {
    const handleHashOpenCart = () => {
      if (window.location.hash === '#carrito') {
        setIsCartOpen(true);
      }
    };

    handleHashOpenCart();
    window.addEventListener('hashchange', handleHashOpenCart);

    let lastScrolled = false;
    const handleScroll = () => {
      const next = window.scrollY > 10;
      if (next !== lastScrolled) {
        lastScrolled = next;
        setIsScrolled(next);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('hashchange', handleHashOpenCart);
    };
  }, []);

  const handleLogout = async () => {
    await cerrarSesion();
    window.location.href = '/';
  };

  const handleCloseCart = () => {
    setIsCartOpen(false);
  };

  const isNavbarActive = isScrolled;

  return (
    <>
      <div
        className={`fixed top-0 left-0 right-0 z-[100] flex flex-col transition-all duration-500 transform
          ${isCartOpen ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}
      >
        {/* BARRITA SUPERIOR - ✅ más fina */}
        <div
          className={`
            bg-[#FFCA28] text-black text-[10px] md:text-xs font-black text-center uppercase tracking-widest border-b border-black/10
            transition-all duration-500 overflow-hidden
            ${isScrolled
              ? 'h-0 opacity-0 py-0 border-0 -translate-y-full'
              : 'h-auto opacity-100 py-0.5 translate-y-0'
            }
          `}
        >
          🍟 ¡Todas nuestras hamburguesas incluyen papas fritas! 🍟
        </div>

        {/* NAVBAR - ✅ h-16 / h-12 */}
        <nav
          className={`transition-all duration-700 px-4 md:px-8 transform
            ${isNavbarActive
              ? 'h-12 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-md'
              : 'h-16 bg-white border-b border-transparent'}`}
        >
          <div className="max-w-7xl mx-auto h-full flex items-center justify-between">

            {/* LOGO */}
            <div className="flex items-center transition-all duration-700">
              <Link
                href="/"
                onClick={playKrustyLaugh}
                aria-label="Ir al inicio"
                className={`relative transition-all duration-700 hover:rotate-12 active:scale-95
                  ${isNavbarActive
                    ? 'w-7 h-7 opacity-100 scale-100'
                    : 'w-0 h-0 opacity-0 scale-50 pointer-events-none'}`}
              >
                <Image
                  src="/images/Krustyburgerheader.webp"
                  alt="Krusty Logo"
                  width={28}
                  height={28}
                  className="object-cover rounded-full"
                  priority
                />
              </Link>
            </div>

            {/* TÍTULO CENTRAL */}
            <div
              className={`absolute left-1/2 -translate-x-1/2 flex items-center transition-all duration-700
                ${isNavbarActive
                  ? 'opacity-100 translate-y-0 scale-100'
                  : 'opacity-0 translate-y-4 scale-95 pointer-events-none'}`}
            >
              <h1 className="text-sm sm:text-base md:text-lg lg:text-xl font-black italic tracking-tighter whitespace-nowrap">
                <span className="text-[#D32F2F] font-extrabold">KRUSTY</span>
                <span className="text-black font-extrabold"> BURGER</span>
              </h1>
            </div>

            {/* ACCIONES - ✅ botones más bajos */}
            <div className="flex items-center gap-1.5 md:gap-3">

              {/* PERFIL / LOGIN */}
              <Link
                href={isAuthenticated ? '/perfil' : '/login'}
                className={`flex items-center gap-1 md:gap-2 h-8 md:h-9 px-2 md:px-3 rounded-2xl font-black text-xs transition-all active:scale-95 border-2 ${isNavbarActive
                    ? 'bg-[#FFCA28] text-black border-black shadow-md hover:bg-[#f5b800]'
                    : 'bg-[#FFCA28] text-black border-black shadow-[4px_4px_0px_0px_black] hover:translate-x-px hover:translate-y-px hover:shadow-none'
                  }`}
              >
                <span className="text-sm md:text-lg">{isAuthenticated ? '👤' : '🔑'}</span>
                <span className="hidden md:inline font-black uppercase tracking-tighter">
                  {isAuthenticated ? 'Perfil' : 'Ingresar'}
                </span>
              </Link>

              {/* LOGOUT */}
              {isAuthenticated && (
                <button
                  onClick={handleLogout}
                  aria-label="Cerrar sesión"
                  className={`flex items-center gap-1 md:gap-2 h-8 md:h-9 px-2 md:px-3 rounded-2xl font-black text-xs transition-all active:scale-95 border-2 ${isNavbarActive
                      ? 'bg-[#D32F2F] text-white border-[#D32F2F] shadow-md hover:bg-[#b0151a]'
                      : 'bg-[#D32F2F] text-white border-black shadow-[4px_4px_0px_0px_black] hover:bg-[#b0151a] hover:translate-x-px hover:translate-y-px hover:shadow-none'
                    }`}
                >
                  <span className="text-sm md:text-lg">🚪</span>
                  <span className="hidden md:inline font-black uppercase tracking-tighter">Salir</span>
                </button>
              )}

              {/* CARRITO */}
              <button
                onClick={() => setIsCartOpen(true)}
                aria-label={`Abrir carrito${totalItems > 0 ? `, ${totalItems} items` : ''}`}
                className={`relative flex items-center gap-1 md:gap-2 h-8 md:h-9 px-2 md:px-3 rounded-2xl font-black text-xs transition-all active:scale-95 border-2 ${isNavbarActive
                    ? 'bg-[#D32F2F] text-white border-[#D32F2F] shadow-md hover:bg-[#b0151a]'
                    : 'bg-white text-black border-black shadow-[4px_4px_0px_0px_black] hover:translate-x-px hover:translate-y-px hover:shadow-none'
                  }`}
              >
                <span className="text-sm md:text-lg">🛒</span>
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

      {/* Espaciador - ✅ h-16 / h-12 para coincidir con el navbar */}
      <div className={`transition-all duration-700 ${isNavbarActive ? 'h-12' : 'h-16'} w-full`} />

      <CartDrawer isOpen={isCartOpen} onClose={handleCloseCart} />
    </>
  );
}