'use client';

import { useLoader } from '@/app/providers/LoaderProvider';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';

export default function BotonMusica() {
    const { musicaIniciada, estaReproduciendo, alternarMusica } = useLoader();
    const [montado, setMontado] = useState(false);

    useEffect(() => {
        setMontado(true);
    }, []);

    if (!musicaIniciada || !montado) return null;

    return createPortal(
        <button
            onClick={alternarMusica}
            aria-label={estaReproduciendo ? 'Pausar música' : 'Reanudar música'}
            className="fixed bottom-44 right-4 md:bottom-36 md:right-4 z-[99999] w-12 h-12 md:w-14 md:h-14 rounded-full bg-black text-[#FFCA28] border-2 border-[#FFCA28] shadow-[4px_4px_0px_0px_rgba(255,202,40,0.4)] flex items-center justify-center text-xl md:text-2xl transition-transform active:scale-90 hover:scale-105"
        >
            {estaReproduciendo ? '⏸️' : '▶️'}
        </button>,
        document.body
    );
}