// hooks/useAuth.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Perfil } from '@/lib/tipos';

interface UseAuthReturn {
    perfil: Perfil | null;
    sesion: any;
    cargando: boolean;
    cerrarSesion: () => Promise<void>;
    actualizarPerfil: (datos: Partial<Perfil>) => Promise<void>;
    recargarPerfil: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
    const [perfil, setPerfil] = useState<Perfil | null>(null);
    const [sesion, setSesion] = useState<any>(null);
    const [cargando, setCargando] = useState(true);

    const cargarPerfil = useCallback(async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('perfiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('❌ Error cargando perfil:', error);
                return;
            }

            if (data) {
                setPerfil(data as Perfil);
            }
        } catch (error) {
            console.error('❌ Error inesperado:', error);
        }
    }, []);

    useEffect(() => {
        // Cargar sesión inicial
        const initAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                setSesion(session);
                if (session?.user) {
                    await cargarPerfil(session.user.id);
                }
            } catch (error) {
                console.error('❌ Error al cargar sesión:', error);
            } finally {
                setCargando(false);
            }
        };

        initAuth();

        // Escuchar cambios de autenticación
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSesion(session);
            if (session?.user) {
                await cargarPerfil(session.user.id);
            } else {
                setPerfil(null);
            }
            setCargando(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [cargarPerfil]);

    const cerrarSesion = async () => {
        try {
            await supabase.auth.signOut();
            setPerfil(null);
            setSesion(null);
        } catch (error) {
            console.error('❌ Error al cerrar sesión:', error);
        }
    };

    const actualizarPerfil = async (datos: Partial<Perfil>) => {
        if (perfil) {
            setPerfil({ ...perfil, ...datos });
        }
    };

    const recargarPerfil = async () => {
        if (sesion?.user?.id) {
            await cargarPerfil(sesion.user.id);
        }
    };

    return {
        perfil,
        sesion,
        cargando,
        cerrarSesion,
        actualizarPerfil,
        recargarPerfil,
    };
}