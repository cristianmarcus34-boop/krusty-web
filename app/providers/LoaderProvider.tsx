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
    const [isLoading, setIsLoading] = useState(true);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);

        try {
            const hasVisited = sessionStorage.getItem(LOADER_KEY) === 'true' ||
                localStorage.getItem(LOADER_KEY) === 'true';

            console.log('🔍 Loader check:', hasVisited);

            if (!hasVisited) {
                console.log('🔄 Mostrando loader por primera vez...');
                sessionStorage.setItem(LOADER_KEY, 'true');
                localStorage.setItem(LOADER_KEY, 'true');
                // ✅ Mostrar loader por 4 segundos
                setIsLoading(true);
            } else {
                console.log('✅ Loader ya mostrado, omitiendo...');
                // ✅ Aún así, mostrar loader por 2 segundos para que se vea el logo
                setIsLoading(true);
                // ✅ Ocultar después de 2 segundos
                setTimeout(() => {
                    setIsLoading(false);
                }, 4000);
            }
        } catch (error) {
            console.warn('Error:', error);
            setIsLoading(false);
        }
    }, []);

    const handleLoaderComplete = () => {
        console.log('✅ Loader completado');
        setIsLoading(false);
    };

    if (!isClient) {
        return (
            <div className="fixed inset-0 bg-[#1A1A1A] flex items-center justify-center z-50">
                <div className="w-16 h-16 border-4 border-[#FFCA28] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (isLoading) {
        return <KrustyLoader onComplete={handleLoaderComplete} duracion={4000} />;
    }

    return <>{children}</>;
}