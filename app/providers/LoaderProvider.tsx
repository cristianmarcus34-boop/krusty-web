// app/providers/LoaderProvider.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
    // ✅ Estado inicial: true para mostrar el loader inmediatamente
    const [isLoading, setIsLoading] = useState(true);
    const [isClient, setIsClient] = useState(false);
    const [isFirstVisit, setIsFirstVisit] = useState(true);

    useEffect(() => {
        setIsClient(true);

        try {
            const hasVisited = sessionStorage.getItem(LOADER_KEY) === 'true' ||
                localStorage.getItem(LOADER_KEY) === 'true';

            console.log('🔍 Loader check:', hasVisited);

            if (!hasVisited) {
                console.log('🔄 Primer visita - 15 segundos');
                sessionStorage.setItem(LOADER_KEY, 'true');
                localStorage.setItem(LOADER_KEY, 'true');
                setIsFirstVisit(true);
                // ✅ isLoading se mantiene true
            } else {
                console.log('✅ Loader ya mostrado - 3 segundos');
                setIsFirstVisit(false);
                // ✅ isLoading se mantiene true
                // ✅ Se cerrará solo cuando el loader termine
            }
        } catch (error) {
            console.warn('Error:', error);
            setIsLoading(false);
        }
    }, []);

    const handleLoaderComplete = () => {
        console.log('✅ Loader completado, ocultando...');
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

    // ✅ Si isLoading es true, mostrar el loader
    if (isLoading) {
        const duracion = isFirstVisit ? 45000 : 25000;
        return <KrustyLoader onComplete={handleLoaderComplete} duracion={duracion} />;
    }

    return <>{children}</>;
}