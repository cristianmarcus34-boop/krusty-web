// lib/mercadopago-config.ts

/**
 * Detectar si estamos en entorno de desarrollo
 * 🔧 FORZADO: Siempre retorna false para usar producción en todo momento
 */
export const isDevelopment = (): boolean => {
    // 🔧 FORZAR SIEMPRE PRODUCCIÓN
    // Esto hace que siempre use las credenciales de producción
    return false;
};

/**
 * Obtener el Access Token correcto según el entorno
 * 🔧 FORZADO: Siempre usa el token de producción
 */
export const getMercadoPagoAccessToken = (): string => {
    const token = process.env.MP_ACCESS_TOKEN_PROD;

    if (!token) {
        throw new Error('❌ Falta el Access Token de Mercado Pago para producción');
    }

    return token;
};

/**
 * Obtener la Public Key correcta según el entorno
 * 🔧 FORZADO: Siempre usa la Public Key de producción
 */
export const getMercadoPagoPublicKey = (): string => {
    const key = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY_PROD;

    if (!key) {
        throw new Error('❌ Falta la Public Key de Mercado Pago para producción');
    }

    return key;
};

/**
 * Obtener la URL base según el entorno
 */
export const getBaseUrl = (): string => {
    // En desarrollo local, usar localhost para pruebas
    if (process.env.NODE_ENV === 'development') {
        return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    }
    // En producción, usar la URL real
    return process.env.NEXT_PUBLIC_BASE_URL || 'https://www.krustyburger.com.ar';
};

/**
 * Configuración completa de Mercado Pago
 */
export const mercadopagoConfig = {
    isDevelopment: false, // Siempre producción
    accessToken: getMercadoPagoAccessToken(),
    publicKey: getMercadoPagoPublicKey(),
    baseUrl: getBaseUrl(),
    environment: '🚀 Producción',
};