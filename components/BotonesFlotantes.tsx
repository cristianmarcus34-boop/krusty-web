'use client';

import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import ThemeToggle from './ThemeToggle';
import BotonMusica from './BotonMusica';

export default function BotonesFlotantes() {
    const [montado, setMontado] = useState(false);

    useEffect(() => {
        setMontado(true);
    }, []);

    if (!montado) return null;

    return createPortal(
        // ✅ inset-x-0 ocupa todo el ancho del viewport.
        // justify-end alinea los botones a la derecha.
        // El padding-right simula el "right-4" que tenías antes.
        <div className="fixed bottom-28 inset-x-0 z-[99999] flex justify-end pr-4 pointer-events-none">
            <div className="flex flex-col gap-3 pointer-events-auto">
                <ThemeToggle />
                <BotonMusica />
            </div>
        </div>,
        document.body
    );
}