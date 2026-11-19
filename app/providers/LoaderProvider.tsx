// app/providers/LoaderProvider.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import KrustyLoader from '@/components/KrustyLoader';

interface LoaderContextType {
    isLoading: boolean;
    setLoading: (loading: boolean) => void;
}

const LoaderContext = createContext<LoaderContextType | undefined>(undefined);

export function useLoader() {
    const context = useContext(LoaderContext);
    if (!context) {
        throw new Error('useLoader must be used within LoaderProvider');
    }
    return context;
}

interface LoaderProviderProps {
    children: ReactNode;
}

const LOADER_KEY = 'krusty-loader-shown';

export default function LoaderProvider({ children }: LoaderProviderProps) {
    // ✅ Etapas: 'portada' (botón), 'cargando' (loader), 'app' (contenido)
    const [etapa, setEtapa] = useState<'portada' | 'cargando' | 'app'>('portada');

    const [isLoading, setIsLoading] = useState(true);
    const [isClient, setIsClient] = useState(false);
    const [isFirstVisit, setIsFirstVisit] = useState(true);
    const [authCheckDone, setAuthCheckDone] = useState(false);

    // ✅ REF para saber si el loader ya se cerró
    const loaderClosed = useRef(false);

    // ✅ REF para el audio
    const referenciaAudio = useRef<HTMLAudioElement>(null);

    // ✅ Obtener estado de autenticación
    const { isAuthenticated, isLoading: authLoading, user, inicializarSesion } = useAuthStore();

    // ✅ Inicializar autenticación al montar
    useEffect(() => {
        const initAuth = async () => {
            await inicializarSesion();
            setAuthCheckDone(true);
        };
        initAuth();
    }, [inicializarSesion]);

    useEffect(() => {
        setIsClient(true);

        try {
            const hasVisited = sessionStorage.getItem(LOADER_KEY) === 'true' ||
                localStorage.getItem(LOADER_KEY) === 'true';

            if (!hasVisited) {
                sessionStorage.setItem(LOADER_KEY, 'true');
                localStorage.setItem(LOADER_KEY, 'true');
                setIsFirstVisit(true);
            } else {
                setIsFirstVisit(false);
            }
        } catch (error) {
            // Silencioso
        }
    }, []);

    // ✅ Cuando la autenticación esté lista, ocultar el loader
    useEffect(() => {
        if (!isClient || !authCheckDone) return;
        if (loaderClosed.current) return;

        if (user || isAuthenticated) {
            loaderClosed.current = true;
            setIsLoading(false);
            return;
        }

        if (authCheckDone && !authLoading) {
            loaderClosed.current = true;
            setIsLoading(false);
        }
    }, [isClient, authCheckDone, user, isAuthenticated, authLoading]);

    // ✅ Timeout de seguridad (máximo 12 segundos)
    useEffect(() => {
        if (!isClient) return;

        const timeoutId = setTimeout(() => {
            if (isLoading && !loaderClosed.current) {
                loaderClosed.current = true;
                setIsLoading(false);
            }
        }, 12000);

        return () => clearTimeout(timeoutId);
    }, [isClient, isLoading]);

    // ✅ Función para forzar el cierre del loader
    const handleLoaderComplete = () => {
        if (loaderClosed.current) return;
        loaderClosed.current = true;
        setIsLoading(false);
        setEtapa('app'); // <-- nuevo: pasamos a la app
    };

    // ✅ Función del botón de ingreso
    const manejarIngreso = () => {
        // Intentamos reproducir el audio (el clic lo permite)
        if (referenciaAudio.current) {
            referenciaAudio.current.play().catch((error) => {
                console.warn('No se pudo iniciar el audio:', error);
            });
        }
        // Pasamos a la etapa de carga
        setEtapa('cargando');
    };

    if (!isClient) {
        return (
            <div className="fixed inset-0 bg-[#1A1A1A] flex items-center justify-center z-50">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-[#FFCA28] border-t-transparent rounded-full animate-spin" />
                    <div className="absolute inset-2 border-4 border-[#D32F2F] border-r-transparent rounded-full animate-spin-reverse" />
                </div>
            </div>
        );
    }

    // ✅ ETAPA 1: Portada con botón de ingreso
    if (etapa === 'portada') {
        return (
            <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#FFCA28] text-black p-6 text-center">
                <div className="mb-8 animate-float">
                    <img
                        src="/images/Krustyburgerheader.webp"
                        alt="Krusty Burger"
                        className="w-32 h-32 rounded-full border-4 border-black shadow-[6px_6px_0px_0px_black]"
                    />
                </div>
                <h1 className="font-krusty font-krusty-bold text-4xl md:text-6xl mb-4 text-black drop-shadow-[3px_3px_0px_#D32F2F]">
                    ¡Bienvenido a Krusty Burger!
                </h1>
                <p className="text-lg md:text-xl font-bold mb-10 max-w-md">
                    Para una experiencia completa (y un poco de música de Springfield), presioná el botón.
                </p>
                <button
                    onClick={manejarIngreso}
                    className="bg-[#D32F2F] text-white font-krusty font-krusty-bold text-2xl md:text-3xl px-10 py-4 rounded-full border-4 border-black shadow-[8px_8px_0px_0px_black] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[6px_6px_0px_0px_black] active:shadow-none active:translate-x-[8px] active:translate-y-[8px]"
                >
                    🍔 ¡Ingresar! 🍔
                </button>
            </div>
        );
    }

    // ✅ ETAPA 2: Loader (solo si todavía no se cerró)
    if (etapa === 'cargando' && isLoading && !loaderClosed.current) {
        const duracion = isFirstVisit ? 12000 : 8000;
        return <KrustyLoader onComplete={handleLoaderComplete} duracion={duracion} />;
    }

    // ✅ ETAPA 3: La app real
    return (
        <>
            {/* El audio vive acá, fuera de las condiciones, para que no se corte */}
            <audio ref={referenciaAudio} loop src="/audio/simpsons-intro.mp3" />
            {children}
        </>
    );
}