// app/providers/LoaderProvider.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import KrustyLoader from '@/components/KrustyLoader';

interface LoaderContextType {
    isLoading: boolean;
    setLoading: (loading: boolean) => void;
    estaReproduciendo: boolean;
    alternarMusica: () => void;
    pausarMusica: () => void;
    reanudarMusica: () => void;
    musicaIniciada: boolean;
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

// ✅ Orden de las pistas y sus archivos
const PISTAS = {
    intro: '/audio/simpsons-intro.mp3',
    final: '/audio/simpsons-final.mp3',
    peliculas: '/audio/musica-peliculas-19.mp3',
    espera: '/audio/musica-espera.mp3',
    cocina: '/audio/musica-cocina.mp3',
} as const;

type Pista = keyof typeof PISTAS;

export default function LoaderProvider({ children }: LoaderProviderProps) {
    const [etapa, setEtapa] = useState<'portada' | 'cargando' | 'app'>('portada');
    const [isClient, setIsClient] = useState(false);
    const [isFirstVisit, setIsFirstVisit] = useState(true);
    const [pistaActual, setPistaActual] = useState<Pista>('intro');

    const [estaReproduciendo, setEstaReproduciendo] = useState(false);
    const [musicaIniciada, setMusicaIniciada] = useState(false);

    const referenciaAudio = useRef<HTMLAudioElement>(null);

    const { inicializarSesion } = useAuthStore();

    useEffect(() => {
        inicializarSesion();
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
        } catch (error) { }
    }, []);

    // ✅ Sincronizar estado con los eventos reales del <audio>
    useEffect(() => {
        const audio = referenciaAudio.current;
        if (!audio) return;

        const alReproducir = () => setEstaReproduciendo(true);
        const alPausar = () => setEstaReproduciendo(false);

        audio.addEventListener('play', alReproducir);
        audio.addEventListener('pause', alPausar);

        return () => {
            audio.removeEventListener('play', alReproducir);
            audio.removeEventListener('pause', alPausar);
        };
    }, [isClient]);

    const manejarIngreso = () => {
        if (referenciaAudio.current) {
            setPistaActual('intro');
            referenciaAudio.current.src = PISTAS.intro;
            referenciaAudio.current.play().catch((error) => {
                console.warn('No se pudo iniciar el audio:', error);
            });
        }
        setMusicaIniciada(true);
        setEtapa('cargando');
    };

    // ✅ Avanza a la siguiente pista según la actual
    const manejarFinDePista = () => {
        const audio = referenciaAudio.current;
        if (!audio) return;

        let siguiente: Pista | null = null;
        if (pistaActual === 'intro') siguiente = 'final';
        else if (pistaActual === 'final') siguiente = 'peliculas';
        else if (pistaActual === 'peliculas') siguiente = 'espera';
        else if (pistaActual === 'espera') siguiente = 'cocina';

        if (siguiente) {
            setPistaActual(siguiente);
            audio.src = PISTAS[siguiente];
            audio.play().catch((error) => {
                console.warn(`No se pudo iniciar la pista ${siguiente}:`, error);
            });
        }
    };

    const alternarMusica = () => {
        const audio = referenciaAudio.current;
        if (!audio) return;
        if (audio.paused) {
            audio.play().catch((error) => console.warn('No se pudo reanudar:', error));
        } else {
            audio.pause();
        }
    };

    const pausarMusica = () => {
        referenciaAudio.current?.pause();
    };

    const reanudarMusica = () => {
        referenciaAudio.current?.play().catch((error) =>
            console.warn('No se pudo reanudar:', error)
        );
    };

    const handleLoaderComplete = () => {
        setEtapa('app');
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

    return (
        <LoaderContext.Provider
            value={{
                isLoading: etapa === 'cargando',
                setLoading: () => { },
                estaReproduciendo,
                alternarMusica,
                pausarMusica,
                reanudarMusica,
                musicaIniciada,
            }}
        >
            {/* ✅ El audio SIEMPRE está montado. El loop solo se activa en la última pista (cocina) */}
            <audio
                ref={referenciaAudio}
                loop={pistaActual === 'cocina'}
                onEnded={manejarFinDePista}
            />

            {etapa === 'portada' && (
                <div className="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-[#FFCA28] text-black p-6 text-center">
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
                        className="bg-[#D32F2F] text-white font-krusty font-krusty-bold text-2xl md:text-3xl px-10 py-4 rounded-full border-4 border-black shadow-[8px_8px_0px_0px_black] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[6px_6px_0px_0px_black] active:shadow-none active:translate-x-2 active:translate-y-2"
                    >
                        🍔 ¡Ingresar! 🍔
                    </button>
                </div>
            )}

            {etapa === 'cargando' && (
                <KrustyLoader
                    onComplete={handleLoaderComplete}
                    duracion={isFirstVisit ? 12000 : 8000}
                />
            )}

            {etapa === 'app' && (
                <div className="animate-fade-up">{children}</div>
            )}
        </LoaderContext.Provider>
    );
}