// lib/tipos.ts
// ============================================================
// 📋 TIPOS BÁSICOS
// ============================================================

export type EstadoPedido = 'pendiente' | 'confirmado' | 'preparando' | 'listo' | 'en_camino' | 'entregado' | 'cancelado';
export type RolUsuario = 'cliente' | 'admin' | 'repartidor';

// ============================================================
// 📋 PRODUCTOS
// ============================================================

export interface Producto {
    id: number;
    nombre: string;
    descripcion: string | null;
    precio: number;
    imagen: string | null;
    categoria: string;
    disponible?: boolean;
    stock?: number;
    es_vegetariano?: boolean;
    es_vegano?: boolean;
    sin_gluten?: boolean;
    popular?: boolean;
    destacado?: boolean;
    created_at?: string;
    updated_at?: string;
}

// ============================================================
// 📋 PEDIDOS
// ============================================================

export interface ElementoPedido {
    producto_id: number;
    nombre: string;
    cantidad: number;
    precio_unitario: number;
    total: number;
}

export interface Pedido {
    id: number;
    creado_en: string;
    ruta_puntos?: { latitude: number; longitude: number }[];
    cliente_nombre: string | null;
    estado: EstadoPedido;
    total: number | null;
    direccion: string | null;
    telefono: string | null;
    metodo_pago: string | null;
    tipo_entrega: string | null;
    notas: string | null;
    resumenes_de_elementos: string | null;
    lat_repartidor: number | null;
    repartidor_de_lng: number | null;
    repartidor_id: string | null;
    token_fcm: string | null;
    id_de_usuario: string | null;
    lat_cliente: number | null;
    lng_cliente: number | null;
    items_json: ElementoPedido[] | null;
    puntos_usados: number | null;
    notas_cliente: string | null;
    total_parcial: number | null;
    costo_envio: number | null;
    volver: number | null;
    encabezado_repartidor: string | null;
    distancia_km?: number | null;
    tiempo_estimado?: number | null;
    monto_pago?: number | null;
    vuelto?: number | null;
}

// ============================================================
// 📋 PERFIL
// ============================================================

export interface Perfil {
    id: string;
    nombre_cliente: string;
    email: string;
    puntos_acumulados: number;
    puntos_disponibles: number;
    ultimo_acceso: string;
    rol: 'cliente' | 'admin' | 'repartidor';
    telefono?: string | null;
    direccion_calle?: string | null;
    direccion_numero?: string | null;
    direccion_piso?: string | null;
    direccion_departamento?: string | null;
    direccion_barrio?: string | null;
    direccion_ciudad?: string | null;
    direccion_codigo_postal?: string | null;
    preferencias_comida?: string | null;
    metodo_pago?: string | null;
    avatar_url?: string | null;
    fcm_token?: string | null;
    lat_cliente?: number | null;
    lng_cliente?: number | null;
    direccion_manual?: string | null;
    created_at?: string;
    nivel?: 'bronce' | 'plata' | 'oro' | 'platino';
    mes_actual_beneficios?: string;
}

// ============================================================
// 📋 CARRITO
// ============================================================

export interface ElementoCarrito {
    producto: Producto;
    cantidad: number;
}

// ============================================================
// 📋 CONFIGURACIÓN DE ENVÍOS
// ============================================================

export interface ConfiguracionEnvio {
    id: number;
    tipo: string;
    precio_base: number;
    precio_por_km: number;
    distancia_minima_km: number;
    distancia_maxima_km: number;
    activo: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface ConfiguracionLocal {
    id: number;
    nombre: string;
    latitud: number;
    longitud: number;
    direccion: string;
    telefono: string;
    created_at?: string;
    updated_at?: string;
}

// ============================================================
// 📋 UBICACIÓN
// ============================================================

export interface UbicacionGuardada {
    latitude: number;
    longitude: number;
    direccion: string;
    seleccionadaPorUsuario?: boolean;
}

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

// ============================================================
// 📋 RECOMPENSAS Y CANJES
// ============================================================

export interface Recompensa {
    id: number;
    nombre: string;
    descripcion: string | null;
    puntos_necesarios: number;
    tipo: 'DESCUENTO' | 'PRODUCTO_GRATIS' | 'ENVIO_GRATIS';
    valor_descuento: number;
    activa: boolean;
    imagen?: string | null;
    created_at?: string;
    actualizado_en?: string;
}

export interface Canje {
    id: number;
    usuario_id: string;
    recompensa_id: number;
    puntos_usados: number;
    fecha: string;
    usado_en_pedido: boolean;
    pedido_id?: number | null;
    created_at?: string;
    recompensa?: Recompensa;
}

export interface CanjeConRecompensa {
    id: number;
    usuario_id: string;
    recompensa_id: number;
    puntos_usados: number;
    fecha: string;
    usado_en_pedido: boolean;
    pedido_id?: number | null;
    created_at: string;
    recompensas: {
        nombre: string;
        tipo: string;
        valor_descuento: number;
    } | null;
}

export interface ResultadoCanje {
    exito: boolean;
    mensaje: string;
    canje_id: number;
    puntos_restantes: number;
}

export interface CanjeCompleto extends Canje {
    usuario_nombre: string;
    usuario_email: string;
    puntos_actuales: number;
    recompensa_nombre: string;
    recompensa_tipo: string;
    puntos_necesarios: number;
    estado: 'Usado en pedido' | 'Usado (pendiente de pedido)' | 'Disponible';
}

// ============================================================
// 📋 NOTIFICACIONES
// ============================================================

export interface Notificacion {
    id: number;
    usuario_id: string;
    titulo: string;
    mensaje: string;
    tipo: 'pedido' | 'promocion' | 'recompensa' | 'sistema';
    leida: boolean;
    created_at: string;
    data?: any;
}

// ============================================================
// 📋 ESTADÍSTICAS DE ADMIN
// ============================================================

export interface EstadisticasAdmin {
    total_pedidos: number;
    pedidos_hoy: number;
    pedidos_pendientes: number;
    ingresos_totales: number;
    ingresos_hoy: number;
    total_usuarios: number;
    total_recompensas_canjeadas: number;
    puntos_totales_canjeados: number;
    pedidos_por_estado: {
        estado: EstadoPedido;
        cantidad: number;
    }[];
}

// ============================================================
// 📋 REPARTIDOR
// ============================================================

export interface RepartidorInfo {
    id: string;
    nombre_cliente: string;
    email: string;
    telefono?: string | null;
    latitud: number | null;
    longitud: number | null;
    ultimo_acceso: string;
    pedidos_activos: number;
}

// ============================================================
// 📋 MERCADO PAGO
// ============================================================

export type EstadoTransaccion = 'pendiente' | 'aprobado' | 'rechazado' | 'cancelado' | 'expirado';

export interface Transaccion {
    id: string;
    usuario_id: string;
    pedido_id: number;
    mp_preference_id: string;
    mp_payment_id: string | null;
    mp_estado: string | null;
    mp_detalle_estado: string | null;
    monto_total: number;
    metodo_pago: string;
    estado: EstadoTransaccion;
    email_pagador: string | null;
    nombre_pagador: string | null;
    telefono_pagador: string | null;
    creado_en: string;
    actualizado_en: string;
    fecha_pago: string | null;
    fecha_expiracion: string | null;
    metadata: any;
    webhook_recibido: boolean;
}

export interface CrearTransaccionDTO {
    usuario_id: string;
    pedido_id: number;
    mp_preference_id: string;
    monto_total: number;
    metodo_pago: string;
    email_pagador?: string;
    nombre_pagador?: string;
    telefono_pagador?: string;
    metadata?: any;
}

export interface RespuestaMercadoPago {
    exito: boolean;
    id_preferencia?: string;
    url_pago?: string;
    url_pruebas?: string;
    error?: string;
}

export interface RespuestaEstadoPago {
    exito: boolean;
    datos?: {
        estado: EstadoTransaccion;
        mp_estado: string | null;
        mp_detalle_estado: string | null;
        mp_preference_id: string;
    };
    error?: string;
}

export interface WebhookMercadoPago {
    id: string;
    tema: 'payment' | 'merchant_order';
    accion?: string;
    fecha_creacion?: string;
    usuario_id?: string;
    version_api?: string;
}

export interface PagoMP {
    id: string;
    referencia_externa: string;
    id_preferencia: string;
    estado: string;
    detalle_estado: string;
    fecha_aprobacion: string | null;
    pagador: {
        email: string;
        nombre: string;
        telefono: {
            numero: string;
        };
    };
    monto: number;
}

export interface ItemPago {
    producto_id: number;
    nombre: string;
    cantidad: number;
    precio_unitario: number;
    total: number;
    descripcion?: string;
    imagen?: string;
}

export interface DatosPago {
    items: ItemPago[];
    pedidoId: number;
    usuarioId: string;
    total: number;
    correo: string;
    nombre?: string;
    telefono?: string;
}

// ============================================================
// 📋 ACTIVIDAD RECIENTE
// ============================================================

export interface ActividadReciente {
    id: string;
    tipo: 'pedido' | 'canje' | 'favorito';
    descripcion: string;
    fecha: string;
    icono: string;
    color: string;
}

// ============================================================
// 📋 NIVELES Y PROGRESO - CORREGIDO
// ============================================================

export interface NivelCliente {
    id: number;
    icono: string;
    nombre: 'Bronce' | 'Plata' | 'Oro' | 'Platino';
    color: string;
    siguiente: string | null;
    progreso: number;
    puntos_requeridos: number;
}

export const NIVELES = {
    BRONCE: { puntos: 0, icono: '🥉', nombre: 'Bronce', color: '#A1887F' },
    PLATA: { puntos: 500, icono: '🥈', nombre: 'Plata', color: '#BDBDBD' },
    ORO: { puntos: 1500, icono: '👑', nombre: 'Oro', color: '#F9A825' },
    PLATINO: { puntos: 5000, icono: '💎', nombre: 'Platino', color: '#78909C' },
} as const;

export function obtenerNivel(puntos: number): NivelCliente {
    // ✅ Nivel 1: Sin nivel (puntos < 0, no debería pasar)
    if (puntos < 0) {
        return {
            id: 1,
            icono: '👤',
            nombre: 'Bronce',
            color: '#A1887F',
            siguiente: 'Bronce',
            progreso: 0,
            puntos_requeridos: 0,
        };
    }
    // ✅ Nivel 2: Bronce (0-499 puntos)
    if (puntos < 500) {
        const progreso = (puntos / 500) * 100;
        return {
            id: 2,
            icono: '🥉',
            nombre: 'Bronce',
            color: '#A1887F',
            siguiente: 'Plata',
            progreso: Math.min(progreso, 100),
            puntos_requeridos: 500,
        };
    }
    // ✅ Nivel 3: Plata (500-1499 puntos)
    if (puntos < 1500) {
        const progreso = ((puntos - 500) / (1500 - 500)) * 100;
        return {
            id: 3,
            icono: '🥈',
            nombre: 'Plata',
            color: '#BDBDBD',
            siguiente: 'Oro',
            progreso: Math.min(progreso, 100),
            puntos_requeridos: 1500,
        };
    }
    // ✅ Nivel 4: Oro (1500-4999 puntos)
    if (puntos < 5000) {
        const progreso = ((puntos - 1500) / (5000 - 1500)) * 100;
        return {
            id: 4,
            icono: '👑',
            nombre: 'Oro',
            color: '#F9A825',
            siguiente: 'Platino',
            progreso: Math.min(progreso, 100),
            puntos_requeridos: 5000,
        };
    }
    // ✅ Nivel 5: Platino (5000+ puntos)
    return {
        id: 5,
        icono: '💎',
        nombre: 'Platino',
        color: '#78909C',
        siguiente: null,
        progreso: 100,
        puntos_requeridos: 5000,
    };
}

// ============================================================
// 📋 BENEFICIOS POR NIVEL - CORREGIDO
// ============================================================

export interface BeneficiosNivel {
    descuento: number;
    descuentoMinimo: number | null;
    descuentoLimiteDiario: number;
    envioGratis: boolean;
    envioGratisMinimo: number | null;
    productosGratisPorMes: number;
    accesoAnticipadoOfertas: boolean;
    soportePrioritario: boolean;
    prioridadEntrega: number;
    descripcion: string;
}

export function obtenerBeneficios(nivelId: number): BeneficiosNivel {
    const beneficios = {
        descuento: 0,
        descuentoMinimo: null as number | null,
        descuentoLimiteDiario: 0,
        envioGratis: false,
        envioGratisMinimo: null as number | null,
        productosGratisPorMes: 0,
        accesoAnticipadoOfertas: false,
        soportePrioritario: false,
        prioridadEntrega: 0,
        descripcion: '',
    };

    switch (nivelId) {
        case 1: // Cliente sin nivel
            return {
                ...beneficios,
                descripcion: '¡Bienvenido! Hacé tu primer pedido para empezar a acumular puntos.',
            };
        case 2: // Bronce (0-499 puntos)
            return {
                ...beneficios,
                descripcion: '¡Seguí acumulando puntos para desbloquear beneficios!',
            };
        case 3: // Plata (500-1499 puntos)
            return {
                ...beneficios,
                descuento: 5,
                envioGratis: true,
                envioGratisMinimo: 15000,
                prioridadEntrega: 1,
                descripcion: '5% de descuento y envío gratis en pedidos mayores a $15.000',
            };
        case 4: // Oro (1500-4999 puntos)
            return {
                ...beneficios,
                descuento: 10,
                envioGratis: true,
                envioGratisMinimo: 10000,
                accesoAnticipadoOfertas: true,
                prioridadEntrega: 2,
                descripcion: '10% de descuento, envío gratis en pedidos mayores a $10.000 y acceso anticipado a ofertas',
            };
        case 5: // Platino (5000+ puntos)
            return {
                ...beneficios,
                descuento: 20,
                envioGratis: true,
                envioGratisMinimo: 0,
                accesoAnticipadoOfertas: true,
                soportePrioritario: true,
                prioridadEntrega: 3,
                descripcion: "20% de descuento, acceso anticipado a ofertas y soporte prioritario"
            };
        default:
            return {
                ...beneficios,
                descripcion: 'Beneficios no disponibles',
            };
    }
}

// ============================================================
// 📋 ESTADÍSTICAS DEL PERFIL
// ============================================================

export interface EstadisticasPerfil {
    totalPedidos: number;
    totalGastado: number;
    totalCanjes: number;
    puntosActuales: number;
    nivel: NivelCliente;
}

// ============================================================
// 📋 ELIMINACIÓN DE CUENTA
// ============================================================

export type EstadoSolicitudEliminacion = 'pendiente' | 'cancelada' | 'completada';

export interface SolicitudEliminacion {
    id: string;
    usuario_id: string;
    email: string;
    motivo: string;
    fecha_solicitud: string;
    fecha_eliminacion: string;
    estado: EstadoSolicitudEliminacion;
    creado_en: string;
    actualizado_en: string;
}

export interface ResultadoSolicitudEliminacion {
    success: boolean;
    error?: string;
    solicitud?: SolicitudEliminacion;
}

export interface EstadoEliminacion {
    tieneSolicitud: boolean;
    solicitud?: SolicitudEliminacion;
    diasRestantes?: number;
}

// ============================================================
// 📋 ADICIONALES (para el menú)
// ============================================================

export interface Adicional {
    id: number;
    nombre: string;
    precio: number;
    descripcion?: string;
    disponible?: boolean;
}

export interface ProductoConAdicionales extends Producto {
    adicionales?: Adicional[];
}

// ============================================================
// 📋 BURGER (para el menú público)
// ============================================================

export interface Burger extends Producto {
    adicionales?: Adicional[];
}