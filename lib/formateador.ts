// lib/formateador.ts

/**
 * Formatear un número como precio en pesos argentinos
 */
export function formatearPrecio(valor: number): string {
    if (valor === undefined || valor === null || isNaN(valor)) {
        return '$0';
    }
    return `$${Math.round(valor).toLocaleString('es-AR')}`;
}

/**
 * Formatear una fecha para mostrar
 */
export function formatearFecha(fecha: string): string {
    if (!fecha) return '';
    try {
        const date = new Date(fecha);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return '';
    }
}

/**
 * Formatear una fecha solo con día y mes
 */
export function formatearFechaCorta(fecha: string): string {
    if (!fecha) return '';
    try {
        const date = new Date(fecha);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
        });
    } catch {
        return '';
    }
}

/**
 * Truncar un texto a una longitud máxima
 */
export function truncarTexto(texto: string, maxLength: number = 100): string {
    if (!texto) return '';
    if (texto.length <= maxLength) return texto;
    return texto.substring(0, maxLength) + '...';
}

/**
 * Capitalizar la primera letra de un texto
 */
export function capitalizar(texto: string): string {
    if (!texto) return '';
    return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}