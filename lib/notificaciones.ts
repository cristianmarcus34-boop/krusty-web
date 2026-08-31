// lib/notificaciones.ts
import { supabase } from './supabase';

// ============================================================
// 📦 REGISTRAR SERVICE WORKER
// ============================================================

export const registrarServiceWorker = async () => {
    try {
        if (!('serviceWorker' in navigator)) {
            console.log('📱 [SW] Service Worker no soportado');
            return false;
        }

        const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
        });

        console.log('✅ [SW] Service Worker registrado:', registration);
        return true;
    } catch (error) {
        console.error('❌ [SW] Error registrando:', error);
        return false;
    }
};

// ============================================================
// 📦 SUSCRIBIR A NOTIFICACIONES PUSH
// ============================================================

export const suscribirNotificaciones = async (userId: string) => {
    try {
        // 1. Verificar soporte
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.log('📱 [Push] No soportado');
            return false;
        }

        // 2. Solicitar permiso
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.log('❌ [Push] Permiso denegado');
            return false;
        }

        // 3. Obtener Service Worker
        const registration = await navigator.serviceWorker.ready;

        // 4. Suscribirse
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        });

        // 5. Guardar suscripción en Supabase
        const { error } = await supabase
            .from('push_subscriptions')
            .upsert({
                usuario_id: userId,
                subscription: subscription,
                updated_at: new Date().toISOString()
            }, { onConflict: 'usuario_id' });

        if (error) {
            console.error('❌ [Push] Error guardando:', error);
            return false;
        }

        console.log('✅ [Push] Suscripción exitosa');
        return true;

    } catch (error) {
        console.error('❌ [Push] Error:', error);
        return false;
    }
};

// ============================================================
// 📦 FUNCIÓN: ENVIAR NOTIFICACIÓN (desde el cliente)
// ============================================================

export const enviarNotificacionCliente = async (titulo: string, cuerpo: string, url?: string) => {
    try {
        if (!('Notification' in window)) return;

        if (Notification.permission === 'default') {
            await Notification.requestPermission();
        }

        if (Notification.permission !== 'granted') return;

        const notificacion = new Notification(titulo, {
            body: cuerpo,
            icon: '/images/krusty-icon-192x192.png',
            tag: 'pedido-update',
            requireInteraction: true,
            data: { url }
        });

        if (url) {
            notificacion.onclick = () => {
                window.focus();
                window.location.href = url;
            };
        }

        setTimeout(() => notificacion.close(), 8000);

    } catch (error) {
        console.error('❌ [Push] Error:', error);
    }
};