// lib/notificaciones.ts
import { supabase } from './supabase';

// ============================================================
// 📦 REGISTRAR SERVICE WORKER (MEJORADO)
// ============================================================

export const registrarServiceWorker = async () => {
    try {
        // ✅ Verificar soporte
        if (!('serviceWorker' in navigator)) {
            console.log('📱 [SW] Service Worker no soportado');
            return false;
        }

        // ✅ Verificar si ya está registrado
        const existingRegistration = await navigator.serviceWorker.getRegistration();
        if (existingRegistration) {
            console.log('✅ [SW] Service Worker ya registrado');
            return true;
        }

        // ✅ Registrar con opciones mejoradas
        const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
            updateViaCache: 'none' // ✅ Evita caché vieja
        });

        console.log('✅ [SW] Service Worker registrado:', registration);

        // ✅ Esperar a que esté activo
        await navigator.serviceWorker.ready;
        console.log('✅ [SW] Service Worker listo');

        return true;

    } catch (error) {
        console.error('❌ [SW] Error registrando:', error);
        return false;
    }
};

// ============================================================
// 📦 SUSCRIBIR A NOTIFICACIONES PUSH (MEJORADO)
// ============================================================

export const suscribirNotificaciones = async (userId: string) => {
    try {
        // ✅ 1. Verificar soporte
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.log('📱 [Push] No soportado en este navegador');
            return false;
        }

        // ✅ 2. Verificar que el Service Worker esté listo
        let registration;
        try {
            registration = await navigator.serviceWorker.ready;
        } catch (error) {
            console.error('❌ [Push] Service Worker no listo:', error);
            return false;
        }

        // ✅ 3. Verificar permiso
        let permission = Notification.permission;

        if (permission === 'default') {
            // Solicitar permiso con interacción del usuario
            permission = await Notification.requestPermission();
        }

        if (permission !== 'granted') {
            console.log('❌ [Push] Permiso denegado');
            return false;
        }

        // ✅ 4. Verificar si ya hay una suscripción activa
        let subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            console.log('✅ [Push] Suscripción existente:', subscription.endpoint);

            // ✅ Verificar si la suscripción sigue siendo válida
            try {
                await subscription.getKey('p256dh');
                console.log('✅ [Push] Suscripción válida');
                return true;
            } catch (error) {
                console.log('🔄 [Push] Suscripción inválida, renovando...');
                await subscription.unsubscribe();
                subscription = null;
            }
        }

        // ✅ 5. Crear nueva suscripción
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

        // ✅ 6. Guardar en Supabase
        const { error } = await supabase
            .from('push_subscriptions')
            .upsert({
                usuario_id: userId,
                subscription: subscription,
                updated_at: new Date().toISOString()
            }, { onConflict: 'usuario_id' });

        if (error) {
            console.error('❌ [Push] Error guardando suscripción:', error);
            return false;
        }

        console.log('✅ [Push] Suscripción guardada en DB');
        return true;

    } catch (error) {
        console.error('❌ [Push] Error:', error);
        return false;
    }
};

// ============================================================
// 📦 DESUSCRIBIR NOTIFICACIONES
// ============================================================

export const desuscribirNotificaciones = async (userId: string) => {
    try {
        // ✅ Eliminar de Supabase
        await supabase
            .from('push_subscriptions')
            .delete()
            .eq('usuario_id', userId);

        // ✅ Desuscribir del Service Worker
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