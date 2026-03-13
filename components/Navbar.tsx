"use client";
import { useState, useEffect, useRef } from 'react';
import { useCartStore } from '@/store/cartStore';
import { supabase } from '@/lib/supabase';
import CartDrawer from './CartDrawer';
import Link from 'next/link';
import Image from 'next/image';

const ADMIN_EMAILS = ['cristianmarcus34@gmail.com', 'marianajuarez99@gmail.com'];

export default function Navbar() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const items = useCartStore((state) => state.items);
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    // --- NUEVO: LÓGICA DE DETECCIÓN PARA SHORTCUTS PWA ---
    const handleHashOpenCart = () => {
      if (window.location.hash === '#carrito') {
        setIsCartOpen(true);
      }
    };

    // Ejecutar al cargar
    handleHashOpenCart();
    // Escuchar cambios de hash sin recargar la página
    window.addEventListener('hashchange', handleHashOpenCart);

    // --- TU LÓGICA ORIGINAL ---
    audioRef.current = new Audio('/sounds/risa-krusty.mp3');
    audioRef.current.volume = 0.4;

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
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
      window.removeEventListener('hashchange', handleHashOpenCart); // Limpieza
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

  return (
    <>
      {/* 1. CONTENEDOR FIJO MAESTRO */}
      <div className="fixed top-0 left-0 right-0 z-[100] flex flex-col">
        
        {/* 2. TOP BAR ANIMADA */}
        <div className={`bg-[#FFCA28] text-black text-[10px] md:text-xs font-black py-1.5 text-center uppercase tracking-widest border-b border-black/10 transition-all duration-500 transform
          ${isScrolled ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}
        >
          🍟 ¡Todas nuestras hamburguesas incluyen papas fritas! 🍟
        </div>

        {/* 3. NAV PRINCIPAL con corrección de performance en imágenes */}
        <nav className={`transition-all duration-500 px-4 md:px-8 transform
          ${isScrolled 
            ? 'h-16 bg-white/90 backdrop-blur-md border-b border-stone-200 shadow-md translate-y-[-28px] md:translate-y-[-32px]' 
            : 'h-24 bg-transparent translate-y-0'}`}
        >
          <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
            
            {/* LADO IZQUIERDO: Logo Principal */}
            <div className="flex items-center">
              <Link 
                href="/" 
                onClick={playKrustyLaugh}
                className={`relative transition-all duration-500 ${isScrolled ? 'w-10 h-10' : 'w-14 h-14'} hover:rotate-12 active:scale-95`}
              >
                <Image 
                  src="/images/Krustyburgerheader.webp"
                  alt="Krusty Logo"
                  fill
                  className="object-contain"
                  priority
                  sizes="(max-width: 768px) 40px, 56px"
                />
              </Link>
            </div>

            {/* CENTRO: Identidad que aparece con Scroll */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
              <Link 
                href="/" 
                onClick={playKrustyLaugh} 
                className={`flex items-center group active:scale-95 transition-all duration-700
                  ${isScrolled 
                    ? 'opacity-100 translate-y-0 scale-100' 
                    : 'opacity-0 -translate-y-4 scale-90 pointer-events-none'}`}
              >
                {/* Logo miniatura con sizes prop */}
                <div className="relative hidden md:block w-8 h-8 mr-2">
                  <Image 
                    src="/images/Krustyburgerheader.webp"
                    alt="Krusty Logo"
                    fill
                    className="object-contain"
                    sizes="32px"
                  />
                </div>
                
                <h1 className="text-xl md:text-2xl font-black italic tracking-tighter whitespace-nowrap">
                  <span className="text-[#D32F2F]">KRUSTY</span> <span className="text-black">BURGER</span>
                </h1>
              </Link>
            </div>
            
            {/* LADO DERECHO: Botón de Pedido */}
            <div className="flex items-center">
              <button 
                id="carrito-btn" // Agregado para referencia
                onClick={() => setIsCartOpen(true)}
                className={`relative flex items-center gap-2 h-11 px-4 md:px-6 rounded-2xl font-black transition-all active:scale-95 border-2
                  ${isScrolled 
                    ? 'bg-[#D32F2F] text-white border-transparent shadow-md' 
                    : 'bg-white text-black border-black shadow-[4px_4px_0px_0px_black] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none'}`}
              >
                <span className="text-xl">🛒</span>
                
                <div className="hidden sm:flex flex-col items-start leading-none text-left">
                  <span className="text-[9px] uppercase font-black opacity-80 tracking-tighter">Mi Pedido</span>
                  <span className="text-sm font-black italic uppercase">
                    {totalItems > 0 ? `${totalItems} ítems` : 'Vacío'}
                  </span>
                </div>

                {/* Badge de cantidad */}
                {totalItems > 0 && (
                  <span className={`absolute -top-2 -right-2 min-w-[20px] h-5 px-1.5 flex items-center justify-center text-[11px] font-black rounded-full border-2
                    ${isScrolled 
                      ? 'bg-[#FFCA28] text-black border-white' 
                      : 'bg-[#D32F2F] text-white border-black animate-pulse'}`}>
                    {totalItems}
                  </span>
                )}
              </button>
            </div>

          </div>
        </nav>
      </div>

      {/* Espaciador dinámico para el contenido */}
      <div className="h-24 md:h-32 w-full" />

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}