// app/hooks/useNotificaciones.ts
"use client";

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

interface UseNotificacionesReturn {
    notificacionesPermitidas: boolean;
    mostrarBanner: boolean;
    solicitarPermiso: () => Promise<boolean>;
    enviarNotificacion: (titulo: string, mensaje: string, icono?: string) => void;
    reactivarNotificaciones: () => Promise<void>;
    cerrarBanner: () => void;
}

export function useNotificaciones(): UseNotificacionesReturn {
    const [notificacionesPermitidas, setNotificacionesPermitidas] = useState(false);
    const [mostrarBanner, setMostrarBanner] = useState(true);

    useEffect(() => {
        const verificarPermiso = () => {
            if (!('Notification' in window)) {
                console.log('🔔 Este navegador no soporta notificaciones');
                setMostrarBanner(false);
                return;
            }

            const permiso = Notification.permission;

            if (permiso === 'granted') {
                setNotificacionesPermitidas(true);
                setMostrarBanner(false);
                console.log('🔔 Notificaciones: GRANTED ✅');
                return;
            }

            if (permiso === 'denied') {
                setNotificacionesPermitidas(false);
                setMostrarBanner(true);
                console.log('🔔 Notificaciones: DENIED ❌');
                return;
            }

            if (permiso === 'default') {
                setMostrarBanner(true);
                console.log('🔔 Notificaciones: DEFAULT ⏳');
                setTimeout(() => {
                    solicitarPermiso();
                }, 1500);
            }
        };

        verificarPermiso();
    }, []);

    const solicitarPermiso = useCallback(async (): Promise<boolean> => {
        if (!('Notification' in window)) {
            toast.error('❌ Tu navegador no soporta notificaciones');
            return false;
        }

        try {
            const resultado = await Notification.requestPermission();

            if (resultado === 'granted') {
                setNotificacionesPermitidas(true);
                setMostrarBanner(false);
                console.log('✅ Notificaciones activadas');

                toast.success('🔔 ¡Notificaciones activadas!', {
                    duration: 3000,
                    icon: '✅',
                });

                try {
                    new Notification('🔔 ¡Notificaciones activadas!', {
                        body: 'Te avisaremos cuando tu pedido cambie de estado.',
                        icon: '/images/krusty-icon.webp',
                        badge: '/android-icon-72x72.png',
                    });
                } catch (e) {
                    console.log('Error en notificación de bienvenida:', e);
                }

                return true;
            } else {
                setNotificacionesPermitidas(false);
                setMostrarBanner(true);
                console.log('❌ Notificaciones rechazadas');
                toast.error('❌ Notificaciones rechazadas', {
                    duration: 3000,
                    icon: '🔕',
                });
                return false;
            }
        } catch (error) {
            console.error('🔔 Error:', error);
            setMostrarBanner(true);
            toast.error('❌ Error al solicitar permiso');
            return false;
        }
    }, []);

    const enviarNotificacion = useCallback((titulo: string, mensaje: string, icono?: string) => {
        try {
            if (notificacionesPermitidas && 'Notification' in window) {
                const notification = new Notification(titulo, {
                    body: mensaje,
                    icon: icono || '/images/krusty-icon.webp',
                    badge: '/android-icon-72x72.png',
                    requireInteraction: true,
                    silent: false,
                });
                setTimeout(() => notification.close(), 8000);
            }
        } catch (error) {
            console.error('🔔 Error:', error);
        }
    }, [notificacionesPermitidas]);

    const detectarNavegador = useCallback((): string => {
        const ua = navigator.userAgent.toLowerCase();
        if (ua.includes('chrome')) return 'Chrome';
        if (ua.includes('firefox')) return 'Firefox';
        if (ua.includes('safari')) return 'Safari';
        if (ua.includes('edge')) return 'Edge';
        return 'tu navegador';
    }, []);

    const obtenerInstrucciones = useCallback((navegador: string): string => {
        const instrucciones: Record<string, string> = {
            Chrome:
                '1️⃣ Click en los 3 puntos ⋮ (arriba a la derecha)\n' +
                '2️⃣ Configuración\n' +
                '3️⃣ Privacidad y seguridad\n' +
                '4️⃣ Configuración del sitio\n' +
                '5️⃣ Buscar "krustyburger.com.ar"\n' +
                '6️⃣ Notificaciones → Permitir\n' +
                '7️⃣ Volver al sitio y recargar (F5)',
            Firefox: '🔒 Candado → Permisos → Notificaciones → Permitir',
            Safari: 'Safari → Preferencias → Sitios web → Notificaciones → Permitir',
            Edge: '🔒 Candado → Permisos → Notificaciones → Permitir',
        };
        return instrucciones[navegador] || 'Configuración del navegador → Notificaciones → Permitir este sitio';
    }, []);

    const reactivarNotificaciones = useCallback(async () => {
        console.log('🔔 Botón Activar presionado');
        console.log('📊 Estado actual:', Notification.permission);

        if (!('Notification' in window)) {
            toast.error('❌ Tu navegador no soporta notificaciones');
            return;
        }

        const permiso = Notification.permission;

        if (permiso === 'granted') {
            setNotificacionesPermitidas(true);
            setMostrarBanner(false);
            toast.success('✅ ¡Las notificaciones ya están activas!');
            return;
        }

        if (permiso === 'denied') {
            const navegador = detectarNavegador();
            const instrucciones = obtenerInstrucciones(navegador);

            const mensaje =
                `🔔 Notificaciones bloqueadas en ${navegador}\n\n` +
                `Para activarlas:\n${instrucciones}\n\n` +
                `⚠️ Luego recargá la página (F5) y activá nuevamente.`;

            toast.error(mensaje, {
                duration: 12000,
                icon: '🔕',
            });
            return;
        }

        if (permiso === 'default') {
            try {
                const resultado = await Notification.requestPermission();
                if (resultado === 'granted') {
                    setNotificacionesPermitidas(true);
                    setMostrarBanner(false);
                    toast.success('✅ ¡Notificaciones activadas!');
                } else {
                    setMostrarBanner(true);
                    toast.error('❌ No se pudo activar');
                }
            } catch (error) {
                console.error('Error:', error);
                toast.error('❌ Error al activar');
            }
        }
    }, [detectarNavegador, obtenerInstrucciones]);

    const cerrarBanner = useCallback(() => {
        setMostrarBanner(false);
    }, []);

    return {
        notificacionesPermitidas,
        mostrarBanner,
        solicitarPermiso,
        enviarNotificacion,
        reactivarNotificaciones,
        cerrarBanner,
    };
}