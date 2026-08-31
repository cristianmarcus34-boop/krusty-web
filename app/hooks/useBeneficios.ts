// hooks/useBeneficios.ts
'use client';

import { useEffect, useState, useCallback } from 'react';
import { obtenerNivel, obtenerBeneficios, NivelCliente, BeneficiosNivel } from '@/lib/tipos';

// ✅ AGREGAR CONSTANTE PARA ENVÍO GRATIS
const MINIMO_ENVIO_GRATIS = 19000;

interface UseBeneficiosReturn {
    nivel: NivelCliente | null;
    beneficios: BeneficiosNivel | null;
    cargando: boolean;
    actualizarBeneficios: (puntos: number) => void;
    // ✅ Funciones agregadas para compatibilidad con la versión nativa
    calcularDescuento: (total: number) => number;
    tieneEnvioGratis: (subtotal: number) => boolean;
    descripcionBeneficios: string;
    descuento: number;
    envioGratis: boolean;
    prioridadEntrega: number;
}

export function useBeneficios(
    puntos: number = 0,
    usuarioId?: string
): UseBeneficiosReturn {
    const [nivel, setNivel] = useState<NivelCliente | null>(() => obtenerNivel(puntos));
    const [beneficios, setBeneficios] = useState<BeneficiosNivel | null>(null);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        setCargando(true);

        // Calcular nivel y beneficios según puntos
        const nivelActual = obtenerNivel(puntos);
        setNivel(nivelActual);

        // Calcular beneficios según el ID del nivel (1-5)
        const beneficiosCalculados = obtenerBeneficios(nivelActual?.id || 1);
        setBeneficios(beneficiosCalculados);

        setCargando(false);
    }, [puntos]);

    const actualizarBeneficios = (nuevosPuntos: number) => {
        const nuevoNivel = obtenerNivel(nuevosPuntos);
        setNivel(nuevoNivel);
        const nuevosBeneficios = obtenerBeneficios(nuevoNivel?.id || 1);
        setBeneficios(nuevosBeneficios);
    };

    // ✅ Función para calcular descuento (igual que en la nativa)
    const calcularDescuento = useCallback((total: number): number => {
        if (!beneficios) return 0;
        return total * (beneficios.descuento / 100);
    }, [beneficios]);

    // ✅ FUNCIÓN ACTUALIZADA - Envío gratis a partir de $19.000
    const tieneEnvioGratis = useCallback((subtotal: number): boolean => {
        // ✅ PRIMERO: Envío gratis por superar el mínimo de $19.000 (para TODOS)
        if (subtotal >= MINIMO_ENVIO_GRATIS) {
            return true;
        }

        // ✅ SEGUNDO: Si no llega al mínimo, verificar si el nivel lo incluye
        if (!beneficios) return false;

        // Si el beneficio es envío gratis siempre
        if (beneficios.envioGratis) {
            // Si hay un monto mínimo, verificar
            if (beneficios.envioGratisMinimo !== undefined && beneficios.envioGratisMinimo !== null) {
                return subtotal >= beneficios.envioGratisMinimo;
            }
            return true;
        }

        return false;
    }, [beneficios]);

    // ✅ Descripción de beneficios para mostrar
    const descripcionBeneficios = beneficios?.descripcion ||
        `${nivel?.nombre || 'Cliente'} - ${beneficios?.descuento || 0}% descuento`;

    return {
        nivel,
        beneficios,
        cargando,
        actualizarBeneficios,
        // ✅ Funciones exportadas
        calcularDescuento,
        tieneEnvioGratis,
        descripcionBeneficios,
        descuento: beneficios?.descuento || 0,
        envioGratis: beneficios?.envioGratis || false,
        prioridadEntrega: beneficios?.prioridadEntrega || 1,
    };
}