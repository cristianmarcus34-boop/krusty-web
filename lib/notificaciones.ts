// lib/notificaciones.ts
import { supabase } from './supabase';

// ============================================================
// 📦 VARIABLE DE CONTROL PARA LIMPIEZA
// ============================================================

let limpiezaEnProgreso = false;

// ============================================================
// 📦 REGISTRAR SERVICE WORKER
// ============================================================

export const registrarServiceWorker = async () => {
    try {
        if (!('serviceWorker' in navigator)) {
            console.log('📱 [SW] Service Worker no soportado');
            return false;
        }

        const existingRegistration = await navigator.serviceWorker.getRegistration();
        if (existingRegistration) {
            console.log('✅ [SW] Service Worker ya registrado');
            return true;
        }

        const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
            updateViaCache: 'none'
        });

        console.log('✅ [SW] Service Worker registrado:', registration);
        await navigator.serviceWorker.ready;
        console.log('✅ [SW] Service Worker listo');

        return true;

    } catch (error) {
        console.error('❌ [SW] Error registrando:', error);
        return false;
    }
};

// ============================================================
// 📦 SUSCRIBIR A NOTIFICACIONES PUSH (MULTI-DISPOSITIVO)
// ============================================================

export const suscribirNotificaciones = async (userId: string) => {
    try {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.log('📱 [Push] No soportado en este navegador');
            return false;
        }

        let registration;
        try {
            registration = await navigator.serviceWorker.ready;
        } catch (error) {
            console.error('❌ [Push] Service Worker no listo:', error);
            return false;
        }

        let permission = Notification.permission;

        if (permission === 'default') {
            permission = await Notification.requestPermission();
        }

        if (permission !== 'granted') {
            console.log('❌ [Push] Permiso denegado');
            return false;
        }

        // ✅ Detectar tipo de dispositivo
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
        const deviceName = isMobile ? '📱 Móvil' : '💻 Escritorio';

        let subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            console.log('✅ [Push] Suscripción existente:', subscription.endpoint);

            try {
                await subscription.getKey('p256dh');
                console.log('✅ [Push] Suscripción válida');
                await guardarSuscripcionEnDB(userId, subscription, deviceName);
                return true;
            } catch (error) {
                console.log('🔄 [Push] Suscripción inválida, renovando...');
                await subscription.unsubscribe();
                subscription = null;
            }
        }

        const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!publicKey) {
            console.error('❌ [Push] VAPID Public Key no configurada');
            return false;
        }

        subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: publicKey
        });

        console.log('✅ [Push] Nueva suscripción creada');
        await guardarSuscripcionEnDB(userId, subscription, deviceName);

        console.log('✅ [Push] Suscripción guardada en DB');
        return true;

    } catch (error) {
        console.error('❌ [Push] Error:', error);
        return false;
    }
};

// ============================================================
// 📦 GUARDAR SUSCRIPCIÓN EN DB (MULTI-DISPOSITIVO)
// ============================================================

const guardarSuscripcionEnDB = async (userId: string, subscription: PushSubscription, deviceName: string) => {
    try {
        const endpoint = subscription.endpoint;

        // ✅ Verificar si ya existe esta suscripción
        const { data: existing } = await supabase
            .from('push_subscriptions')
            .select('id')
            .eq('usuario_id', userId)
            .eq('subscription->>endpoint', endpoint)
            .maybeSingle();

        if (existing) {
            // ✅ Actualizar existente
            const { error } = await supabase
                .from('push_subscriptions')
                .update({
                    updated_at: new Date().toISOString(),
                    last_used_at: new Date().toISOString(),
                    is_active: true,
                    device_name: deviceName
                })
                .eq('id', existing.id);

            if (error) {
                console.error('❌ [Push] Error actualizando suscripción:', error);
                throw error;
            }
            console.log('✅ [Push] Suscripción actualizada');
            return;
        }

        // ✅ Insertar nueva suscripción
        const { error } = await supabase
            .from('push_subscriptions')
            .insert({
                usuario_id: userId,
                subscription: subscription,
                device_name: deviceName,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                last_used_at: new Date().toISOString(),
                is_active: true
            });

        if (error) {
            console.error('❌ [Push] Error guardando suscripción:', error);
            throw error;
        }
        console.log('✅ [Push] Nueva suscripción guardada en DB');

    } catch (error) {
        console.error('❌ [Push] Error en guardarSuscripcionEnDB:', error);
        throw error;
    }
};

// ============================================================
// 📦 DESUSCRIBIR NOTIFICACIONES
// ============================================================

export const desuscribirNotificaciones = async (userId: string) => {
    try {
        await supabase
            .from('push_subscriptions')
            .delete()
            .eq('usuario_id', userId);

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            await subscription.unsubscribe();
            console.log('✅ [Push] Desuscripción exitosa');
        }

        return true;
    } catch (error) {
        console.error('❌ [Push] Error desuscribiendo:', error);
        return false;
    }
};

// ============================================================
// 🧹 LIMPIAR SUSCRIPCIONES VIEJAS (CORREGIDO)
// ============================================================

export const limpiarSuscripcionesViejas = async () => {
    // ✅ Si ya está en progreso, no hacer nada
    if (limpiezaEnProgreso) {
        return;
    }

    // ✅ Solo ejecutar si la página está visible
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
    }

    limpiezaEnProgreso = true;

    try {
        const fechaLimite = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        // ✅ Contar cuántas hay - con manejo de null
        const { count, error: countError } = await supabase
            .from('push_subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', false)
            .lt('last_used_at', fechaLimite.toISOString());

        if (countError) {
            console.error('❌ Error contando suscripciones:', countError);
            return;
        }

        // ✅ Si count es null o 0, salir
        if (!count || count === 0) {
            return;
        }

        // ✅ Eliminar en lotes pequeños
        const batchSize = 5;
        let eliminadas = 0;

        while (eliminadas < count) {
            const { error } = await supabase
                .from('push_subscriptions')
                .delete()
                .eq('is_active', false)
                .lt('last_used_at', fechaLimite.toISOString())
                .limit(batchSize);

            if (error) {
                console.error('❌ Error eliminando lote:', error);
                break;
            }

            eliminadas += batchSize;
        }

    } catch (error) {
        // Silencioso
    } finally {
        limpiezaEnProgreso = false;
    }
};

// ============================================================
// 📊 OBTENER ESTADO DE SUSCRIPCIÓN
// ============================================================

export const obtenerEstadoSuscripcion = async () => {
    try {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            return { suscrito: false, razon: 'no_soportado' };
        }

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            return { suscrito: true, endpoint: subscription.endpoint };
        }

        return { suscrito: false, razon: 'no_suscrito' };
    } catch (error) {
        console.error('❌ Error obteniendo estado:', error);
        return { suscrito: false, razon: 'error' };
    }
};