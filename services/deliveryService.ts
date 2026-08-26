// services/deliveryService.ts

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// ✅ COORDENADAS EXACTAS - Calle 853 N° 1149, San Francisco Solano, Quilmes
// 34°46'35.5"S 58°17'31.9"W
const LOCAL_LAT = -34.776528;
const LOCAL_LNG = -58.292194;

// Tarifas por kilómetro (AJUSTABLES)
const TARIFAS = {
    base: 1000,          // Costo base de envío (zona cercana)
    por_km: 1000,        // Costo por kilómetro adicional
    distancia_minima: 1, // Distancia mínima en km (si es menor, tarifa base)
    distancia_maxima: 7,   // Distancia máxima en km (si es mayor, no se puede enviar)
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
}

/**
 * Geocodificar una dirección a coordenadas
 */
export async function geocodificarDireccion(direccion: string): Promise<Ubicacion | null> {
    try {
        // 🔍 LOG 1: Verificar que la API Key existe
        console.log('🔑 API Key configurada:', GOOGLE_MAPS_API_KEY ? '✅ Sí' : '❌ NO');
        if (!GOOGLE_MAPS_API_KEY) {
            console.error('❌ ERROR CRÍTICO: No hay API Key de Google Maps en .env.local');
            return null;
        }

        const direccionCompleta = `${direccion}, San Francisco Solano, Quilmes, Buenos Aires, Argentina`;
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
            direccionCompleta
        )}&key=${GOOGLE_MAPS_API_KEY}`;

        // 🔍 LOG 2: Mostrar la URL completa que se está generando
        console.log('🌐 URL de Geocoding:', url);

        const response = await fetch(url);
        const data = await response.json();

        // 🔍 LOG 3: Mostrar la respuesta completa de Google
        console.log('📦 Respuesta de Geocoding:', JSON.stringify(data, null, 2));

        if (data.status === 'OK' && data.results.length > 0) {
            const location = data.results[0].geometry.location;
            console.log('✅ Ubicación encontrada:', location);
            return {
                lat: location.lat,
                lng: location.lng,
                direccion: data.results[0].formatted_address
            };
        }

        // 🔍 LOG 4: Mostrar el error específico de Google
        console.warn('⚠️ No se encontró la dirección. Status:', data.status);
        if (data.status === 'REQUEST_DENIED') {
            console.error('❌ ERROR: La API Key no tiene permisos. Verificá:');
            console.error('   1. Que la Geocoding API esté habilitada en Google Cloud Console');
            console.error('   2. Que la API Key tenga restricciones correctas');
            console.error('   3. Que la API Key sea válida');
        }
        if (data.status === 'ZERO_RESULTS') {
            console.warn('ℹ️ La dirección no existe o no se encontró');
        }
        return null;
    } catch (error) {
        console.error('❌ Error inesperado en geocodificarDireccion:', error);
        return null;
    }
}

/**
 * Calcular distancia y precio de envío entre dos puntos
 */
export async function calcularEnvio(
    direccionCliente: string
): Promise<ResultadoEnvio> {
    try {
        console.log('🚗 Iniciando cálculo de envío para:', direccionCliente);

        // 1. Geocodificar la dirección del cliente
        const ubicacionCliente = await geocodificarDireccion(direccionCliente);

        if (!ubicacionCliente) {
            console.warn('⚠️ No se pudo geocodificar la dirección');
            return {
                distancia_km: 0,
                precio: 0,
                tiempo_minutos: 0,
                disponible: false,
                mensaje: 'No pudimos encontrar tu dirección. Por favor, verificála.'
            };
        }

        console.log('📍 Ubicación del cliente:', ubicacionCliente);

        // 2. Calcular distancia usando Distance Matrix API
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${LOCAL_LAT},${LOCAL_LNG}&destinations=${ubicacionCliente.lat},${ubicacionCliente.lng}&key=${GOOGLE_MAPS_API_KEY}&units=metric`;

        // 🔍 LOG 5: Mostrar la URL de Distance Matrix
        console.log('🌐 URL de Distance Matrix:', url);

        const response = await fetch(url);
        const data = await response.json();

        // 🔍 LOG 6: Mostrar la respuesta de Distance Matrix
        console.log('📦 Respuesta de Distance Matrix:', JSON.stringify(data, null, 2));

        if (data.status === 'REQUEST_DENIED') {
            console.error('❌ ERROR: Distance Matrix API no habilitada o sin permisos');
            return {
                distancia_km: 0,
                precio: 0,
                tiempo_minutos: 0,
                disponible: false,
                mensaje: 'Error al calcular la distancia. Verificá tu conexión.'
            };
        }

        if (data.status !== 'OK' || !data.rows?.[0]?.elements?.[0]) {
            console.error('❌ Error en Distance Matrix:', data.status);
            return {
                distancia_km: 0,
                precio: 0,
                tiempo_minutos: 0,
                disponible: false,
                mensaje: 'Error al calcular la distancia. Intentá de nuevo.'
            };
        }

        const element = data.rows[0].elements[0];

        if (element.status === 'ZERO_RESULTS') {
            console.warn('⚠️ No se encontró ruta entre los puntos');
            return {
                distancia_km: 0,
                precio: 0,
                tiempo_minutos: 0,
                disponible: false,
                mensaje: 'No se pudo calcular la ruta. Revisá tu dirección.'
            };
        }

        // 3. Obtener distancia y tiempo
        const distanciaMetros = element.distance?.value || 0;
        const distanciaKm = distanciaMetros / 1000;
        const tiempoMinutos = Math.ceil((element.duration?.value || 0) / 60);

        console.log(`📊 Distancia: ${distanciaKm.toFixed(2)} km, Tiempo: ${tiempoMinutos} min`);

        // 4. Verificar si está dentro del radio de entrega
        if (distanciaKm > TARIFAS.distancia_maxima) {
            console.warn(`⚠️ Distancia ${distanciaKm.toFixed(1)} km excede el máximo de ${TARIFAS.distancia_maxima} km`);
            return {
                distancia_km: Math.round(distanciaKm * 10) / 10,
                precio: 0,
                tiempo_minutos: tiempoMinutos,
                disponible: false,
                mensaje: `Lo sentimos, no hacemos envíos a más de ${TARIFAS.distancia_maxima} km. Tu ubicación está a ${distanciaKm.toFixed(1)} km.`
            };
        }

        // 5. Calcular precio
        let precio;
        if (distanciaKm <= TARIFAS.distancia_minima) {
            precio = TARIFAS.base;
            console.log(`✅ Distancia ${distanciaKm.toFixed(2)} km <= ${TARIFAS.distancia_minima} km, precio base: $${precio}`);
        } else {
            precio = TARIFAS.base + (distanciaKm - TARIFAS.distancia_minima) * TARIFAS.por_km;
            console.log(`✅ Distancia ${distanciaKm.toFixed(2)} km > ${TARIFAS.distancia_minima} km, precio calculado: $${precio}`);
        }

        // Redondear a múltiplos de 50
        precio = Math.ceil(precio / 50) * 50;

        console.log(`💰 Precio de envío final: $${precio}`);

        return {
            distancia_km: Math.round(distanciaKm * 10) / 10,
            precio: precio,
            tiempo_minutos: tiempoMinutos,
            disponible: true,
        };

    } catch (error) {
        console.error('❌ Error inesperado en calcularEnvio:', error);
        return {
            distancia_km: 0,
            precio: 0,
            tiempo_minutos: 0,
            disponible: false,
            mensaje: 'Error al calcular el envío. Intentá de nuevo.'
        };
    }
}