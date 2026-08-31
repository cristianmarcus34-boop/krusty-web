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
    const [isLoading, setIsLoading] = useState(true);
    const [isClient, setIsClient] = useState(false);
    const [isFirstVisit, setIsFirstVisit] = useState(true);
    const [authCheckDone, setAuthCheckDone] = useState(false);

    // ✅ REF para saber si el loader ya se cerró
    const loaderClosed = useRef(false);

    // ✅ Obtener estado de autenticación
    const { isAuthenticated, isLoading: authLoading, user, inicializarSesion } = useAuthStore();

    // ✅ Inicializar autenticación al montar
    useEffect(() => {
        const initAuth = async () => {
            console.log('🚀 Inicializando autenticación...');
            await inicializarSesion();
            setAuthCheckDone(true);
            console.log('✅ Autenticación inicializada');
        };
        initAuth();
    }, [inicializarSesion]);

    useEffect(() => {
        setIsClient(true);

        try {
            const hasVisited = sessionStorage.getItem(LOADER_KEY) === 'true' ||
                localStorage.getItem(LOADER_KEY) === 'true';

            console.log('🔍 Loader check:', hasVisited);

            if (!hasVisited) {
                console.log('🔄 Primer visita - esperando autenticación');
                sessionStorage.setItem(LOADER_KEY, 'true');
                localStorage.setItem(LOADER_KEY, 'true');
                setIsFirstVisit(true);
            } else {
                console.log('✅ Loader ya mostrado - esperando autenticación');
                setIsFirstVisit(false);
            }
        } catch (error) {
            console.warn('Error:', error);
        }
    }, []);

    // ✅ Cuando la autenticación esté lista, ocultar el loader
    useEffect(() => {
        // Solo proceder si el cliente está listo y la autenticación ya se verificó
        if (!isClient || !authCheckDone) return;

        // Si ya se cerró el loader, no hacer nada
        if (loaderClosed.current) return;

        // Si la autenticación está completa (tiene usuario o sesión)
        if (user || isAuthenticated) {
            console.log('🔐 Usuario autenticado, ocultando loader...');
            loaderClosed.current = true;
            setIsLoading(false);
            return;
        }

        // Si la autenticación falló o no hay sesión, igual cerramos el loader después de un tiempo
        if (authCheckDone && !authLoading) {
            console.log('⏰ Autenticación completada sin sesión, cerrando loader...');
            loaderClosed.current = true;
            setIsLoading(false);
        }
    }, [isClient, authCheckDone, user, isAuthenticated, authLoading]);

    // ✅ Timeout de seguridad (máximo 12 segundos)
    useEffect(() => {
        if (!isClient) return;

        const timeoutId = setTimeout(() => {
            if (isLoading && !loaderClosed.current) {
                console.log('⏰ Timeout de seguridad, forzando cierre del loader...');
                loaderClosed.current = true;
                setIsLoading(false);
            }
        }, 12000);

        return () => clearTimeout(timeoutId);
    }, [isClient, isLoading]);

    // ✅ Función para forzar el cierre del loader (fallback por si el usuario hace clic)
    const handleLoaderComplete = () => {
        if (loaderClosed.current) return;
        console.log('✅ Loader completado manualmente, ocultando...');
        loaderClosed.current = true;
        setIsLoading(false);
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

    // ✅ Mostrar el loader solo si isLoading es true y no se cerró
    if (isLoading && !loaderClosed.current) {
        // ✅ Duración más larga para primera visita, más corta si ya visitó
        const duracion = isFirstVisit ? 12000 : 8000;
        return <KrustyLoader onComplete={handleLoaderComplete} duracion={duracion} />;
    }

    return <>{children}</>;
}