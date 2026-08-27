// hooks/useBeneficios.ts
'use client';

import { useEffect, useState } from 'react';
import { obtenerNivel, obtenerBeneficios, NivelCliente, BeneficiosNivel } from '@/lib/tipos';

interface UseBeneficiosReturn {
    nivel: NivelCliente;
    beneficios: BeneficiosNivel | null;
    cargando: boolean;
    actualizarBeneficios: (puntos: number) => void;
}

export function useBeneficios(
    puntos: number,
    usuarioId?: string
): UseBeneficiosReturn {
    const [nivel, setNivel] = useState<NivelCliente>(() => obtenerNivel(puntos));
    const [beneficios, setBeneficios] = useState<BeneficiosNivel | null>(null);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        setCargando(true);

        // Calcular nivel y beneficios según puntos
        const nivelActual = obtenerNivel(puntos);
        setNivel(nivelActual);

        // Calcular beneficios según el ID del nivel (1-5)
        const beneficiosCalculados = obtenerBeneficios(nivelActual.id || 1);
        setBeneficios(beneficiosCalculados);

        setCargando(false);
    }, [puntos]);

    const actualizarBeneficios = (nuevosPuntos: number) => {
        const nuevoNivel = obtenerNivel(nuevosPuntos);
        setNivel(nuevoNivel);
        const nuevosBeneficios = obtenerBeneficios(nuevoNivel.id || 1);
        setBeneficios(nuevosBeneficios);
    };

    return {
        nivel,
        beneficios,
        cargando,
        actualizarBeneficios,
    };
}