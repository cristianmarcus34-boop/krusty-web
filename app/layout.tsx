// app/layout.tsx
"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import StatusBar from '../components/StatusBar';
import Link from 'next/link';
import Image from 'next/image';
import GestorDeActualizaciones from '../components/GestorDeActualizaciones';
import ActiveOrderFloating from '@/components/ActiveOrderFloating';
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from 'react-hot-toast';

// ============================================
// CONTEXTO DE TEMA
// ============================================
import { ThemeProvider } from './context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

// ✅ LOADER PROVIDER
import LoaderProvider from './providers/LoaderProvider';

// ✅ Manejo de sesión
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';

// ✅ IMPORTAR METADATA DESDE ARCHIVO SEPARADO
import { metadata, viewport } from './metadata';

// ✅ Notificaciones
import {
  registrarServiceWorker,
  suscribirNotificaciones,
  limpiarSuscripcionesViejas  // ✅ NUEVO
} from '@/lib/notificaciones';

// ✅ BANNER DE NOTIFICACIONES
import PushNotificationProvider from '@/components/PushNotificationProvider';

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  preload: false,
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const { forzarActualizacion, user, isAuthenticated } = useAuthStore();
  const { setItems } = useCartStore();

  // ============================================================
  // 📦 FUNCIÓN: CARGAR CARRITO DESDE DB
  // ============================================================

  const cargarCarritoDesdeDB = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('carritos')
        .select('items')
        .eq('usuario_id', userId)
        .single();

      if (!error && data?.items && data.items.length > 0) {
        setItems(data.items);
      }
    } catch (error) {
      // Silencioso
    }
  };

  // ============================================================
  // 🔄 EFECTO: INICIALIZAR SESIÓN AL CARGAR LA APP
  // ============================================================

  useEffect(() => {
    setMounted(true);

    const iniciarSesion = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const { data: perfilData, error } = await supabase
            .from('perfiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (!error && perfilData) {
            forzarActualizacion({
              user: session.user,
              perfil: perfilData || undefined,
              session: session,
            });
            await cargarCarritoDesdeDB(session.user.id);
          }
        }
      } catch (error) {
        // Silencioso
      } finally {
        useAuthStore.setState({ isLoading: false, cargando: false });
      }
    };

    iniciarSesion();
  }, []);

  // ============================================================
  // 🔄 EFECTO: REGISTRAR NOTIFICACIONES AL INICIAR
  // ============================================================

  useEffect(() => {
    const initNotifications = async () => {
      try {
        const swRegistered = await registrarServiceWorker();
        if (!swRegistered) {
          return;
        }

        if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
          await Notification.requestPermission();
        }

        if (user?.id) {
          await suscribirNotificaciones(user.id);
        }

      } catch (error) {
        // Silencioso
      }
    };

    if (mounted) {
      initNotifications();
    }
  }, [mounted, user?.id]);

  // ============================================================
  // 🔄 EFECTO: ESCUCHAR CAMBIOS DE AUTENTICACIÓN (LOGIN/LOGOUT)
  // ============================================================

  useEffect(() => {
    if (!mounted) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        useAuthStore.setState({ isLoading: false, cargando: false });

        if (event === 'SIGNED_IN' && session?.user) {
          const { data: perfilData, error } = await supabase
            .from('perfiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (!error && perfilData) {
            forzarActualizacion({
              user: session.user,
              perfil: perfilData || undefined,
              session: session,
            });
            await cargarCarritoDesdeDB(session.user.id);

            try {
              await suscribirNotificaciones(session.user.id);
            } catch (error) {
              // Silencioso
            }
          }

        } else if (event === 'SIGNED_OUT') {
          forzarActualizacion({
            user: null,
            perfil: undefined,
            session: null,
          });

          const { clearCart } = useCartStore.getState();
          clearCart();

          localStorage.removeItem('krusty-cart-storage-v5');
          localStorage.removeItem('krusty-auth-storage');
          localStorage.removeItem('krusty-carrito-abierto');
          localStorage.removeItem('krusty-customer-v5');
          localStorage.removeItem('krusty_user_telefono');
          localStorage.removeItem('ultimo_pedido_krusty');

          useAuthStore.setState({
            user: null,
            perfil: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
            cargando: false,
          });

          useCartStore.setState({ items: [] });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [mounted]);

  // ============================================================
  // 🔄 EFECTO: MANEJAR ERRORES DE AUTENTICACIÓN
  // ============================================================

  useEffect(() => {
    const limpiarSesionCorrupta = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error && (
          error.message?.includes('Invalid Refresh Token') ||
          error.message?.includes('Refresh Token Not Found') ||
          error.message?.includes('JWT expired') ||
          error.message?.includes('session_not_found')
        )) {
          console.warn('⚠️ [Auth] Token inválido o expirado, limpiando sesión...');

          await supabase.auth.signOut();

          localStorage.removeItem('krusty-auth-storage');
          localStorage.removeItem('krusty-cart-storage-v5');
          localStorage.removeItem('krusty-carrito-abierto');
          localStorage.removeItem('krusty-customer-v5');

          useAuthStore.setState({
            user: null,
            perfil: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
            cargando: false,
          });

          useCartStore.setState({ items: [] });

          if (typeof window !== 'undefined') {
            window.location.reload();
          }
        }

        useAuthStore.setState({ isLoading: false, cargando: false });

      } catch (error) {
        console.error('❌ [Auth] Error limpiando sesión corrupta:', error);
        useAuthStore.setState({ isLoading: false, cargando: false });
      }
    };

    limpiarSesionCorrupta();

    const handleAuthError = (event: any) => {
      const errorMessage = event?.reason?.message || event?.message || '';
      if (
        errorMessage.includes('Invalid Refresh Token') ||
        errorMessage.includes('Refresh Token Not Found') ||
        errorMessage.includes('JWT expired')
      ) {
        console.warn('⚠️ [Auth] Error de autenticación detectado, limpiando...');
        limpiarSesionCorrupta();
      }
    };

    window.addEventListener('unhandledrejection', handleAuthError);
    window.addEventListener('error', handleAuthError);

    return () => {
      window.removeEventListener('unhandledrejection', handleAuthError);
      window.removeEventListener('error', handleAuthError);
    };
  }, []);

  // ============================================================
  // 🔄 EFECTO: DETECTAR RETORNO DE MERCADO PAGO
  // ============================================================

  useEffect(() => {
    if (!mounted) return;

    const mpRedirect = localStorage.getItem('krusty_mp_redirect');
    const mpTimestamp = localStorage.getItem('krusty_mp_timestamp');

    if (mpRedirect === 'true' && mpTimestamp) {
      const timeElapsed = Date.now() - parseInt(mpTimestamp);

      if (timeElapsed > 3000) {
        console.log('🔙 [LAYOUT] Detectado retorno de Mercado Pago');

        localStorage.removeItem('krusty_mp_redirect');
        localStorage.removeItem('krusty_mp_timestamp');
        localStorage.removeItem('krusty-customer-v5');
        localStorage.removeItem('krusty_user_telefono');

        useAuthStore.setState({
          isLoading: false,
          cargando: false
        });

        if (isAuthenticated && !user) {
          window.location.reload();
        }
      }
    }

    const handlePopState = () => {
      console.log('🔙 [LAYOUT] Evento popstate detectado');

      localStorage.removeItem('krusty_mp_redirect');
      localStorage.removeItem('krusty_mp_timestamp');
      localStorage.removeItem('krusty-customer-v5');
      localStorage.removeItem('krusty_user_telefono');

      useAuthStore.setState({
        isLoading: false,
        cargando: false
      });
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [mounted, isAuthenticated, user]);

  // ============================================================
  // 🔄 EFECTO: LIMPIAR SUSCRIPCIONES VIEJAS (NUEVO)
  // ============================================================

  useEffect(() => {
    if (!mounted) return;

    const limpiar = async () => {
      try {
        await limpiarSuscripcionesViejas();
      } catch (error) {
        // Silencioso
      }
    };

    limpiar();

    const intervalo = setInterval(() => {
      limpiarSuscripcionesViejas();
    }, 30 * 24 * 60 * 60 * 1000);

    return () => clearInterval(intervalo);
  }, [mounted]);

  // ============================================================
  // 🖥️ RENDER
  // ============================================================

  return (
    <html lang="es" className="scroll-smooth" data-scroll-behavior="smooth">
      <head>
        <link
          rel="preload"
          href="/fonts/Simpsonfont.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`${inter.className} bg-stone-50 text-stone-900 antialiased selection:bg-[#FFCA28] selection:text-black`}>

        <ThemeProvider>
          <LoaderProvider>

            <PushNotificationProvider>

              <ThemeToggle />
              <GestorDeActualizaciones />
              <Navbar />
              <ActiveOrderFloating />

              <main className="min-h-[calc(100vh-64px)] bg-white relative z-10">
                {children}
              </main>

              <footer className="bg-[#1A1A1A] text-stone-900 py-16 px-6 border-t-8 border-black relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                  style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)', backgroundSize: '5px 5px' }}>
                </div>

                <div className="max-w-5xl mx-auto relative z-10 text-center">

                  <div className="mb-8">
                    <div className="inline-block bg-[#FFCA28] text-black px-4 py-1 rounded-full font-black italic text-[10px] mb-4 border-2 border-black shadow-[3px_3px_0px_0px_black]">
                      CALIDAD SPRINGFIELD - VILLA LA FLORIDA
                    </div>
                    <h2 className="text-[#FFCA28] font-black italic text-4xl mb-2 tracking-tighter drop-shadow-[2px_2px_0px_black]">
                      KRUSTY BURGER INC.
                    </h2>
                  </div>

                  <div className="mb-10">
                    <Link
                      href="https://g.page/r/CTEcMZ1GEz0LEBI/review"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/20 px-6 py-3 rounded-xl transition-all active:scale-95 group"
                    >
                      <span className="text-yellow-400 text-lg group-hover:animate-pulse">⭐⭐⭐⭐⭐</span>
                      <span className="text-stone-100 font-black text-xs tracking-widest group-hover:text-[#FFCA28] transition-colors uppercase">
                        Dejanos tu reseña en Google
                      </span>
                    </Link>
                  </div>

                  <nav className="flex flex-wrap justify-center gap-x-8 gap-y-4 mb-10 text-[11px] font-black uppercase tracking-tighter">
                    <Link href="/" className="hover:text-[#FFCA28] transition-colors">Inicio</Link>
                    <Link href="/privacidad" className="hover:text-[#FFCA28] transition-colors">Privacidad</Link>
                    <Link href="/terminos" className="hover:text-[#FFCA28] transition-colors">Términos</Link>
                    <Link href="/defensa" className="hover:text-white transition-colors underline decoration-[#D32F2F] underline-offset-4">Defensa Consumidor</Link>
                    <Link href="/krusty-legal" className="hover:text-[#FFCA28] transition-colors text-[#FFCA28] animate-pulse">
                      ⚖️ Propiedad de Alma
                    </Link>
                    <Link href="/mutaciones" className="hover:text-[#FFCA28] transition-colors">
                      🧬 Mutaciones
                    </Link>
                  </nav>

                  <div className="flex justify-center gap-2 mb-10">
                    <div className="h-1.5 w-8 bg-[#D32F2F]/40"></div>
                    <div className="h-1.5 w-8 bg-[#FFCA28]/40"></div>
                    <div className="h-1.5 w-8 bg-[#D32F2F]/40"></div>
                  </div>

                  <div className="space-y-8">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                      © 2026 Springfield Food Group / Quilmes, Buenos Aires.
                    </p>

                    <div className="flex flex-col items-center gap-4">
                      <Link
                        href="https://agencia-powa.vercel.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex flex-col items-center gap-2 transition-transform active:scale-95"
                      >
                        <div className="relative w-10 h-10 opacity-80 group-hover:opacity-100 transition-opacity duration-500 scale-90 group-hover:scale-110">
                          <Image
                            src="/images/logo-powa.png"
                            alt="Agencia Powa"
                            width={40}
                            height={40}
                            className="object-contain"
                          />
                        </div>

                        <div className="text-center">
                          <p className="text-[9px] text-stone-400 uppercase tracking-[0.2em] mb-1">
                            Desarrollado con humor por
                          </p>
                          <p className="text-xs font-black italic text-[#FFCA28]">
                            AGENCIA POWA
                          </p>
                        </div>
                      </Link>

                      <p className="text-[10px] text-stone-400 max-w-xs mx-auto italic leading-relaxed">
                        Arcos de Springfield S.A. - CUIT: 30-12345678-9 <br />
                        Villa La Florida, Quilmes (CP 1881).
                      </p>
                    </div>
                  </div>

                  <p className="text-[10px] mt-12 text-[#D32F2F] font-black uppercase italic tracking-[0.3em] opacity-80">
                    "Si no se atraganta, no es una Krusty"
                  </p>

                  <div className="mt-12 pt-6 border-t border-stone-800/40 flex justify-center gap-6">
                    <Link
                      href="/admin"
                      className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-500 hover:text-[#FFCA28] transition-colors duration-300"
                    >
                      🔐 Acceso Staff
                    </Link>
                    <Link
                      href="/krusty-legal"
                      className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-500 hover:text-[#FFCA28] transition-colors duration-300"
                    >
                      📜 Contrato Legal
                    </Link>
                  </div>
                </div>
              </footer>

              <StatusBar />

              <div className="fixed bottom-0 right-0 w-[40vw] h-[40vw] bg-[#FFCA28]/5 -z-10 rounded-full blur-[80px] pointer-events-none" />
              <div className="fixed top-20 left-0 w-[30vw] h-[30vw] bg-[#D32F2F]/5 -z-10 rounded-full blur-[60px] pointer-events-none" />

              <Toaster
                position="top-center"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#1a1a1a',
                    color: '#fff',
                    border: '2px solid #FAD02C',
                    borderRadius: '12px',
                    padding: '16px',
                    fontFamily: 'inherit',
                    maxWidth: '400px',
                  },
                  success: {
                    style: {
                      borderColor: '#22c55e',
                    },
                    icon: '✅',
                  },
                  error: {
                    style: {
                      borderColor: '#ef4444',
                    },
                    icon: '❌',
                  },
                }}
              />

              <Analytics debug={false} />
              <SpeedInsights debug={false} />

            </PushNotificationProvider>

          </LoaderProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}