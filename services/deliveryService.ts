// services/deliveryService.ts

// 📍 COORDENADAS EXACTAS DEL LOCAL (Calle 853 N° 1149, San Francisco Solano, Quilmes)
const LOCAL_LAT = -34.776528;
const LOCAL_LNG = -58.292194;

// 💰 Tarifas por kilómetro
export const TARIFAS = {
    base: 1000,           // Costo base de envío (hasta la distancia mínima)
    por_km: 1000,         // Costo adicional por cada km extra
    distancia_minima: 1,  // Distancia en km dentro de la cual se cobra tarifa base
    distancia_maxima: 7,  // Radio máximo de entrega en km
};

export interface Ubicacion {
    lat: number;
    lng: number;
    direccion: string;
}

export interface ResultadoEnvio {
    distancia_km: number;
    precio: number;
    tiempo_minutos: number;
    disponible: boolean;
    mensaje?: string;
    metodo_calculo?: 'GOOGLE_MAPS' | 'HAVERSINE_FALLBACK';
}

/**
 * Función auxiliar para calcular la distancia en línea recta (Fórmula de Haversine).
 * Sirve como fallback en caso de error/caída de la API de Google Maps.
 */
function calcularDistanciaHaversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distancia en km
}

/**
 * Geocodifica una dirección del cliente invocando el endpoint /api/delivery
 */
export async function geocodificarDireccion(direccion: string): Promise<Ubicacion | null> {
    try {
        const direccionLimpia = direccion.trim();
        if (!direccionLimpia) return null;

        console.log('🌐 Geocodificando dirección mediante API Server...');
        const res = await fetch('/api/delivery', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'geocode', direccion: direccionLimpia }),
        });

        const data = await res.json();

        if (res.ok && data.success && data.ubicacion) {
            console.log('✅ Ubicación obtenida:', data.ubicacion);
            return data.ubicacion;
        }

        console.warn('⚠️ No se pudo geocodificar la dirección:', data.error || data.message);
        return null;
    } catch (error) {
        console.error('❌ Error en geocodificarDireccion:', error);
        return null;
    }
}

/**
 * Calcula distancia, precio y factibilidad de entrega invocando /api/delivery
 */
export async function calcularEnvio(
    cliente: string | Ubicacion
): Promise<ResultadoEnvio> {
    const direccionTexto = typeof cliente === 'string' ? cliente : cliente.direccion;

    try {
        console.log('🚗 Calculando costo de envío para:', direccionTexto);

        // Obtener la ubicación (coordenadas) del cliente
        const ubicacionCliente =
            typeof cliente !== 'string' && cliente.lat && cliente.lng
                ? cliente
                : await geocodificarDireccion(direccionTexto);

        if (!ubicacionCliente) {
            return {
                distancia_km: 0,
                precio: 0,
                tiempo_minutos: 0,
                disponible: false,
                mensaje: 'No pudimos geolocalizar tu dirección. Por favor, verificá que la calle y número sean correctos.',
            };
        }

        let distanciaKm = 0;
        let tiempoMinutos = 0;
        let usadoFallback = false;

        // Llama al servidor Next.js para evitar bloqueos de CORS
        try {
            const res = await fetch('/api/delivery', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'calculate',
                    destinationLat: ubicacionCliente.lat,
                    destinationLng: ubicacionCliente.lng,
                }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                distanciaKm = data.distanciaMetros / 1000;
                tiempoMinutos = Math.ceil(data.duracionSegundos / 60);
            } else {
                throw new Error(data.error || 'Falla en la respuesta de la API interna');
            }
        } catch (matrixErr) {
            console.warn('⚠️ Falla en la solicitud del cálculo principal. Usando cálculo de contingencia (Haversine)...', matrixErr);

            // Fallback: cálculo en línea recta + 25% estimado por trazado urbano
            const distanciaDirecta = calcularDistanciaHaversine(
                LOCAL_LAT,
                LOCAL_LNG,
                ubicacionCliente.lat,
                ubicacionCliente.lng
            );
            distanciaKm = distanciaDirecta * 1.25;
            tiempoMinutos = Math.ceil(distanciaKm * 4) + 10;
            usadoFallback = true;
        }

        // Redondear distancia a 1 decimal
        const distanciaFinalKm = Math.round(distanciaKm * 10) / 10;

        // Validar radio de cobertura
        if (distanciaFinalKm > TARIFAS.distancia_maxima) {
            console.warn(`⚠️ Distancia de ${distanciaFinalKm} km excede el límite de ${TARIFAS.distancia_maxima} km`);
            return {
                distancia_km: distanciaFinalKm,
                precio: 0,
                tiempo_minutos: tiempoMinutos,
                disponible: false,
                mensaje: `Tu ubicación está a ${distanciaFinalKm} km. Lo sentimos, nuestro radio máximo de entrega es de ${TARIFAS.distancia_maxima} km.`,
                metodo_calculo: usadoFallback ? 'HAVERSINE_FALLBACK' : 'GOOGLE_MAPS',
            };
        }

        // Calcular tarifa de envío
        let precioBase = TARIFAS.base;
        if (distanciaFinalKm > TARIFAS.distancia_minima) {
            const kmAdicionales = distanciaFinalKm - TARIFAS.distancia_minima;
            precioBase += kmAdicionales * TARIFAS.por_km;
        }

        // Redondeo a múltiplos de $50
        const precioFinal = Math.ceil(precioBase / 50) * 50;

        console.log(`✅ Envío calculado: ${distanciaFinalKm} km | $${precioFinal} | ~${tiempoMinutos} min`);

        return {
            distancia_km: distanciaFinalKm,
            precio: precioFinal,
            tiempo_minutos: tiempoMinutos,
            disponible: true,
            metodo_calculo: usadoFallback ? 'HAVERSINE_FALLBACK' : 'GOOGLE_MAPS',
        };
    } catch (error) {
        console.error('❌ Error crítico en calcularEnvio:', error);
        return {
            distancia_km: 0,
            precio: 0,
            tiempo_minutos: 0,
            disponible: false,
            mensaje: 'Ocurrió un problema inesperado al calcular el envío. Por favor, intentá nuevamente.',
        };
    }
}