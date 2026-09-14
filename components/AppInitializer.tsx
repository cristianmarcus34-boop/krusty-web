// components/AppInitializer.tsx
"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import {
    registrarServiceWorker,
    suscribirNotificaciones,
    limpiarSuscripcionesViejas,
} from '@/lib/notificaciones';

export default function AppInitializer() {
    const [mounted, setMounted] = useState(false);
    const { forzarActualizacion, user, isAuthenticated } = useAuthStore();
    const { setItems } = useCartStore();

    // ============================================================
    // 📦 CARGAR CARRITO DESDE DB
    // ============================================================
    const cargarCarritoDesdeDB = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('carritos')
                .select('items')
                .eq('usuario_id', userId)
                .maybeSingle();

            if (!error && data?.items && data.items.length > 0) {
                setItems(data.items);
            }
        } catch {
            // Silencioso
        }
    };

    // ============================================================
    // 🔄 INICIALIZAR SESIÓN
    // ============================================================
    useEffect(() => {
        setMounted(true);

        const iniciarSesion = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user) {
                    const { data: perfilData, error } = await supabase
                        .from('perfiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .maybeSingle();

                    if (!error && perfilData) {
                        forzarActualizacion({
                            user: session.user,
                            perfil: perfilData || undefined,
                            session: session,
                        });
                        await cargarCarritoDesdeDB(session.user.id);
                    }
                }
            } catch {
                // Silencioso
            } finally {
                useAuthStore.setState({ isLoading: false, cargando: false });
            }
        };

        iniciarSesion();
    }, []);

    // ============================================================
    // 🔔 NOTIFICACIONES AL INICIAR
    // ============================================================
    useEffect(() => {
        const initNotifications = async () => {
            try {
                const swRegistered = await registrarServiceWorker();
                if (!swRegistered) return;

                if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
                    await Notification.requestPermission();
                }

                if (user?.id) {
                    await suscribirNotificaciones(user.id);
                }
            } catch {
                // Silencioso
            }
        };

        if (mounted) initNotifications();
    }, [mounted, user?.id]);

    // ============================================================
    // 🔄 ESCUCHAR CAMBIOS DE AUTENTICACIÓN
    // ============================================================
    useEffect(() => {
        if (!mounted) return;

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                useAuthStore.setState({ isLoading: false, cargando: false });

                if (event === 'SIGNED_IN' && session?.user) {
                    const { data: perfilData, error } = await supabase
                        .from('perfiles')
                        .select('*')
                        .eq('id', session.user.id)
                        .maybeSingle();

                    if (!error && perfilData) {
                        forzarActualizacion({
                            user: session.user,
                            perfil: perfilData || undefined,
                            session: session,
                        });
                        await cargarCarritoDesdeDB(session.user.id);

                        try {
                            await suscribirNotificaciones(session.user.id);
                        } catch {
                            // Silencioso
                        }
                    }
                } else if (event === 'SIGNED_OUT') {
                    forzarActualizacion({ user: null, perfil: undefined, session: null });

                    const { clearCart } = useCartStore.getState();
                    clearCart();

                    localStorage.removeItem('krusty-cart-storage-v5');
                    localStorage.removeItem('krusty-auth-storage');
                    localStorage.removeItem('krusty-carrito-abierto');
                    localStorage.removeItem('krusty-customer-v5');
                    localStorage.removeItem('krusty_user_telefono');
                    localStorage.removeItem('ultimo_pedido_krusty');

                    useAuthStore.setState({
                        user: null,
                        perfil: null,
                        session: null,
                        isAuthenticated: false,
                        isLoading: false,
                        cargando: false,
                    });

                    useCartStore.setState({ items: [] });
                }
            }
        );

        return () => subscription.unsubscribe();
    }, [mounted]);

    // ============================================================
    // 🔄 MANEJAR ERRORES DE AUTENTICACIÓN
    // ============================================================
    useEffect(() => {
        const limpiarSesionCorrupta = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error && (
                    error.message?.includes('Invalid Refresh Token') ||
                    error.message?.includes('Refresh Token Not Found') ||
                    error.message?.includes('JWT expired') ||
                    error.message?.includes('session_not_found')
                )) {
                    console.warn('⚠️ [Auth] Token inválido o expirado, limpiando sesión...');

                    await supabase.auth.signOut();

                    localStorage.removeItem('krusty-auth-storage');
                    localStorage.removeItem('krusty-cart-storage-v5');
                    localStorage.removeItem('krusty-carrito-abierto');
                    localStorage.removeItem('krusty-customer-v5');

                    useAuthStore.setState({
                        user: null,
                        perfil: null,
                        session: null,
                        isAuthenticated: false,
                        isLoading: false,
                        cargando: false,
                    });

                    useCartStore.setState({ items: [] });

                    if (typeof window !== 'undefined') window.location.reload();
                }

                useAuthStore.setState({ isLoading: false, cargando: false });
            } catch (error) {
                console.error('❌ [Auth] Error limpiando sesión corrupta:', error);
                useAuthStore.setState({ isLoading: false, cargando: false });
            }
        };

        limpiarSesionCorrupta();

        const handleAuthError = (event: any) => {
            const errorMessage = event?.reason?.message || event?.message || '';
            if (
                errorMessage.includes('Invalid Refresh Token') ||
                errorMessage.includes('Refresh Token Not Found') ||
                errorMessage.includes('JWT expired')
            ) {
                console.warn('⚠️ [Auth] Error de autenticación detectado, limpiando...');
                limpiarSesionCorrupta();
            }
        };

        window.addEventListener('unhandledrejection', handleAuthError);
        window.addEventListener('error', handleAuthError);

        return () => {
            window.removeEventListener('unhandledrejection', handleAuthError);
            window.removeEventListener('error', handleAuthError);
        };
    }, []);

    // ============================================================
    // 🔄 DETECTAR RETORNO DE MERCADO PAGO
    // ============================================================
    useEffect(() => {
        if (!mounted) return;

        const mpRedirect = localStorage.getItem('krusty_mp_redirect');
        const mpTimestamp = localStorage.getItem('krusty_mp_timestamp');

        if (mpRedirect === 'true' && mpTimestamp) {
            const timeElapsed = Date.now() - parseInt(mpTimestamp);

            if (timeElapsed > 3000) {
                console.log('🔙 [APP] Detectado retorno de Mercado Pago');

                localStorage.removeItem('krusty_mp_redirect');
                localStorage.removeItem('krusty_mp_timestamp');
                localStorage.removeItem('krusty-customer-v5');
                localStorage.removeItem('krusty_user_telefono');

                useAuthStore.setState({ isLoading: false, cargando: false });

                if (isAuthenticated && !user) window.location.reload();
            }
        }

        const handlePopState = () => {
            console.log('🔙 [APP] Evento popstate detectado');

            localStorage.removeItem('krusty_mp_redirect');
            localStorage.removeItem('krusty_mp_timestamp');
            localStorage.removeItem('krusty-customer-v5');
            localStorage.removeItem('krusty_user_telefono');

            useAuthStore.setState({ isLoading: false, cargando: false });
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [mounted, isAuthenticated, user]);

    // ============================================================
    // 🔄 LIMPIAR SUSCRIPCIONES VIEJAS
    // ============================================================
    useEffect(() => {
        if (!mounted) return;

        let ejecutado = false;
        let timeoutId: NodeJS.Timeout;

        const limpiar = async () => {
            if (ejecutado) return;
            ejecutado = true;

            timeoutId = setTimeout(async () => {
                try {
                    await limpiarSuscripcionesViejas();
                } catch {
                    // Silencioso
                }
            }, 5000);
        };

        limpiar();

        const intervalo = setInterval(() => {
            if (document.visibilityState === 'visible') {
                limpiarSuscripcionesViejas();
            }
        }, 24 * 60 * 60 * 1000);

        return () => {
            clearTimeout(timeoutId);
            clearInterval(intervalo);
            ejecutado = true;
        };
    }, [mounted]);

    return null; // 👈 No renderiza nada, solo ejecuta lógica
}