// store/authStore.ts (web) - VERSIÓN COMPLETA CON forzarActualizacion
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Perfil, UbicacionGuardada } from '@/lib/tipos';

interface AuthState {
    // Estado existente
    user: any | null;
    perfil: Perfil | null;
    cargando: boolean;
    esAdministrador: boolean;
    esRepartidor: boolean;
    ubicacionSeleccionada: UbicacionGuardada | null;
    error: string | null;

    // ✅ NUEVAS PROPIEDADES PARA COMPATIBILIDAD
    isAuthenticated: boolean;
    isLoading: boolean;
    session: any | null;

    // Acciones existentes
    inicializarSesion: () => Promise<void>;
    iniciarSesion: (correo: string, contrasena: string) => Promise<{ success: boolean; error?: string }>;
    registrarCliente: (datos: { correo: string; contrasena: string; nombre: string; telefono: string }) => Promise<{ success: boolean; error?: string }>;
    cerrarSesion: () => Promise<void>;
    actualizarPerfil: (datos: Partial<Perfil>) => Promise<{ success: boolean; error?: string }>;
    guardarUbicacionTemporal: (ubicacion: UbicacionGuardada) => Promise<void>;
    cargarUbicacionTemporal: () => Promise<UbicacionGuardada | null>;
    limpiarUbicacionTemporal: () => Promise<void>;
    resetearContrasena: (correo: string) => Promise<{ success: boolean; error?: string; errorType?: string }>;
    actualizarContrasena: (nuevaContrasena: string) => Promise<{ success: boolean; error?: string }>;
    limpiarError: () => void;

    // ✅ NUEVOS MÉTODOS
    setAuthenticated: (value: boolean) => void;
    refreshUser: () => Promise<void>;
    getPuntos: () => number;
    getUsuarioId: () => string | null;
    forzarActualizacion: (datos: { user?: any; perfil?: Perfil; session?: any }) => void;
}

// Key para localStorage
const STORAGE_UBICACION_KEY = 'krusty-ubicacion-seleccionada';

export const useAuthStore = create<AuthState>((set, get) => ({
    // Estado inicial
    user: null,
    perfil: null,
    cargando: true,
    esAdministrador: false,
    esRepartidor: false,
    ubicacionSeleccionada: null,
    error: null,

    // ✅ NUEVAS PROPIEDADES
    isAuthenticated: false,
    isLoading: true,
    session: null,

    // ============================================================
    // 🔄 INICIALIZAR SESIÓN (MODIFICADO)
    // ============================================================
    inicializarSesion: async () => {
        set({ cargando: true, isLoading: true, error: null });

        try {
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) {
                console.error('❌ Error obteniendo sesión:', error);
                set({
                    cargando: false,
                    isLoading: false,
                    error: error.message,
                    isAuthenticated: false
                });
                return;
            }

            if (session) {
                // ✅ Guardar sesión
                set({ session: session });

                // ✅ Cargar perfil del usuario
                const { data: perfil, error: perfilError } = await supabase
                    .from('perfiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (perfilError) {
                    console.error('❌ Error cargando perfil:', perfilError);
                    set({
                        cargando: false,
                        isLoading: false,
                        error: perfilError.message,
                        isAuthenticated: false
                    });
                    return;
                }

                // ✅ Actualizar estado
                set({
                    user: session.user,
                    session: session,
                    perfil: perfil as Perfil,
                    esAdministrador: perfil?.rol === 'admin',
                    esRepartidor: perfil?.rol === 'repartidor',
                    cargando: false,
                    isLoading: false,
                    isAuthenticated: true,
                    error: null
                });

                // ✅ Cargar ubicación guardada
                await get().cargarUbicacionTemporal();
            } else {
                set({
                    cargando: false,
                    isLoading: false,
                    user: null,
                    perfil: null,
                    session: null,
                    isAuthenticated: false
                });
            }
        } catch (error: any) {
            console.error('❌ Error al inicializar sesión:', error);
            set({
                cargando: false,
                isLoading: false,
                error: error.message,
                isAuthenticated: false
            });
        }
    },

    // ============================================================
    // 🔐 INICIAR SESIÓN (MODIFICADO)
    // ============================================================
    iniciarSesion: async (correo: string, contrasena: string) => {
        set({ error: null });

        try {
            // ✅ Validaciones
            if (!correo || !contrasena) {
                return { success: false, error: 'Completa todos los campos' };
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(correo)) {
                return { success: false, error: 'Ingresa un correo electrónico válido' };
            }

            if (contrasena.length < 6) {
                return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' };
            }

            // ✅ Autenticar
            const { data, error } = await supabase.auth.signInWithPassword({
                email: correo,
                password: contrasena,
            });

            if (error) {
                console.error('❌ [Login] Error de autenticación:', error.message);
                return { success: false, error: String(error.message) };
            }

            // ✅ Guardar sesión
            set({ session: data.session });

            // ✅ Cargar perfil
            const { data: perfil, error: perfilError } = await supabase
                .from('perfiles')
                .select('*')
                .eq('id', data.user.id)
                .single();

            if (perfilError) {
                console.error('❌ [Login] Error cargando perfil:', perfilError);
                return { success: false, error: 'Error al cargar el perfil' };
            }

            // ✅ Actualizar estado
            set({
                user: data.user,
                session: data.session,
                perfil: perfil as Perfil,
                esAdministrador: perfil?.rol === 'admin',
                esRepartidor: perfil?.rol === 'repartidor',
                isAuthenticated: true,
                error: null
            });

            // ✅ Actualizar último acceso
            await supabase
                .from('perfiles')
                .update({ ultimo_acceso: new Date().toISOString() })
                .eq('id', data.user.id);

            // ✅ Cargar ubicación guardada
            await get().cargarUbicacionTemporal();

            return { success: true };
        } catch (error: any) {
            console.error('❌ [Login] Error catastrófico:', error);
            set({ error: error.message });
            return { success: false, error: String(error.message || 'Error inesperado') };
        }
    },

    // ============================================================
    // 🧑‍💼 REGISTRAR CLIENTE
    // ============================================================
    registrarCliente: async (datos: { correo: string; contrasena: string; nombre: string; telefono: string }) => {
        set({ error: null });

        try {
            if (!datos.correo || !datos.contrasena || !datos.nombre || !datos.telefono) {
                return { success: false, error: 'Completa todos los campos' };
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(datos.correo)) {
                return { success: false, error: 'Ingresa un correo electrónico válido' };
            }

            if (datos.contrasena.length < 6) {
                return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' };
            }

            const { data, error } = await supabase.auth.signUp({
                email: datos.correo,
                password: datos.contrasena,
                options: {
                    data: {
                        nombre: datos.nombre,
                        telefono: datos.telefono,
                        rol: 'cliente'
                    }
                }
            });

            if (error) {
                console.error('❌ [Register] Error al registrar:', error.message);
                return { success: false, error: String(error.message) };
            }

            const userId = data.user?.id;
            if (!userId) {
                return { success: false, error: 'No se pudo crear la cuenta del cliente' };
            }

            const { error: perfilError } = await supabase
                .from('perfiles')
                .insert({
                    id: userId,
                    email: datos.correo,
                    nombre_cliente: datos.nombre,
                    telefono: datos.telefono,
                    rol: 'cliente',
                    puntos_disponibles: 0,
                    puntos_acumulados: 0,
                    ultimo_acceso: new Date().toISOString(),
                });

            if (perfilError) {
                console.error('❌ [Register] Error creando perfil:', perfilError);
                return { success: false, error: 'Error al crear el perfil del cliente' };
            }

            set({
                user: data.user,
                session: data.session,
                isAuthenticated: !!data.session,
                error: null,
            });

            return { success: true };
        } catch (error: any) {
            console.error('❌ [Register] Error inesperado:', error);
            set({ error: error.message });
            return { success: false, error: String(error.message || 'Error inesperado') };
        }
    },

    // ============================================================
    // 🚪 CERRAR SESIÓN (MODIFICADO)
    // ============================================================
    cerrarSesion: async () => {
        try {
            await supabase.auth.signOut();

            // ✅ Limpiar localStorage
            try {
                localStorage.removeItem(STORAGE_UBICACION_KEY);
                localStorage.removeItem('krusty-customer-v5');
                localStorage.removeItem('ultimo_pedido_krusty');
            } catch (e) {
                // Silencioso
            }

            set({
                user: null,
                perfil: null,
                esAdministrador: false,
                esRepartidor: false,
                cargando: false,
                isLoading: false,
                ubicacionSeleccionada: null,
                error: null,
                isAuthenticated: false,
                session: null,
            });
        } catch (error) {
            console.error('❌ Error al cerrar sesión:', error);
            set({
                user: null,
                perfil: null,
                esAdministrador: false,
                esRepartidor: false,
                cargando: false,
                isLoading: false,
                ubicacionSeleccionada: null,
                error: null,
                isAuthenticated: false,
                session: null,
            });
        }
    },

    // ============================================================
    // 👤 ACTUALIZAR PERFIL (MODIFICADO)
    // ============================================================
    actualizarPerfil: async (datos: Partial<Perfil>) => {
        const { perfil } = get();

        if (!perfil) {
            return { success: false, error: 'No hay sesión activa' };
        }

        try {
            const { error } = await supabase
                .from('perfiles')
                .update(datos)
                .eq('id', perfil.id);

            if (error) {
                console.error('❌ Error actualizando perfil:', error);
                return { success: false, error: String(error.message) };
            }

            const perfilActualizado = { ...perfil, ...datos };
            set({ perfil: perfilActualizado });

            return { success: true };
        } catch (error: any) {
            console.error('❌ Error en actualizarPerfil:', error);
            return { success: false, error: String(error.message || 'Error inesperado') };
        }
    },

    // ============================================================
    // ✅ FORZAR ACTUALIZACIÓN DEL STORE (NUEVO)
    // ============================================================
    forzarActualizacion: (datos: { user?: any; perfil?: Perfil; session?: any }) => {
        set((state) => ({
            ...state,
            user: datos.user || state.user,
            perfil: datos.perfil || state.perfil,
            session: datos.session || state.session,
            isAuthenticated: !!(datos.user || state.user),
            isLoading: false,
            cargando: false,
        }));
    },

    // ============================================================
    // ✅ NUEVO: SET AUTHENTICATED
    // ============================================================
    setAuthenticated: (value: boolean) => {
        set({ isAuthenticated: value });
    },

    // ============================================================
    // ✅ NUEVO: REFRESH USER
    // ============================================================
    refreshUser: async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                const { data: perfil, error } = await supabase
                    .from('perfiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (!error && perfil) {
                    set({
                        user: session.user,
                        session: session,
                        perfil: perfil as Perfil,
                        isAuthenticated: true,
                        esAdministrador: perfil?.rol === 'admin',
                        esRepartidor: perfil?.rol === 'repartidor',
                    });
                }
            } else {
                set({
                    user: null,
                    perfil: null,
                    session: null,
                    isAuthenticated: false,
                });
            }
        } catch (error) {
            console.error('❌ [authStore] Error refrescando:', error);
        }
    },

    // ============================================================
    // ✅ NUEVO: GET PUNTOS
    // ============================================================
    getPuntos: () => {
        const { perfil } = get();
        return perfil?.puntos_disponibles || 0;
    },

    // ============================================================
    // ✅ NUEVO: GET USUARIO ID
    // ============================================================
    getUsuarioId: () => {
        const { user } = get();
        return user?.id || null;
    },

    // ============================================================
    // 📍 UBICACIÓN TEMPORAL (sin cambios)
    // ============================================================
    guardarUbicacionTemporal: async (ubicacion: UbicacionGuardada) => {
        try {
            set({ ubicacionSeleccionada: ubicacion });
            const json = JSON.stringify(ubicacion);
            localStorage.setItem(STORAGE_UBICACION_KEY, json);
        } catch (error) {
            console.error('❌ Error guardando ubicación:', error);
        }
    },

    cargarUbicacionTemporal: async (): Promise<UbicacionGuardada | null> => {
        try {
            const data = localStorage.getItem(STORAGE_UBICACION_KEY);
            if (data) {
                const ubicacion = JSON.parse(data) as UbicacionGuardada;
                set({ ubicacionSeleccionada: ubicacion });
                return ubicacion;
            }
            return null;
        } catch (error) {
            console.error('❌ Error cargando ubicación:', error);
            return null;
        }
    },

    limpiarUbicacionTemporal: async () => {
        try {
            set({ ubicacionSeleccionada: null });
            localStorage.removeItem(STORAGE_UBICACION_KEY);
        } catch (error) {
            console.error('❌ Error limpiando ubicación:', error);
        }
    },

    // ============================================================
    // 🔑 RESETEAR CONTRASEÑA (sin cambios)
    // ============================================================
    resetearContrasena: async (correo: string) => {
        set({ error: null });

        try {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(correo)) {
                return { success: false, error: 'Ingresa un correo electrónico válido' };
            }

            const { data: perfil, error: errorPerfil } = await supabase
                .from('perfiles')
                .select('email')
                .eq('email', correo)
                .single();

            if (errorPerfil || !perfil) {
                return {
                    success: false,
                    errorType: 'not_found',
                    error: 'No existe una cuenta con este correo electrónico'
                };
            }

            const { error } = await supabase.auth.resetPasswordForEmail(correo, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) {
                const mensaje = error.message || '';
                const mensajeLower = mensaje.toLowerCase();

                if (mensajeLower.includes('rate limit') || mensajeLower.includes('too many requests')) {
                    return {
                        success: false,
                        errorType: 'rate_limit',
                        error: '⏳ Has excedido el límite de intentos. Espera 1 hora y vuelve a intentarlo.'
                    };
                }

                return {
                    success: false,
                    errorType: 'unknown',
                    error: '❌ Error al enviar el correo: ' + mensaje
                };
            }

            return { success: true };
        } catch (error: any) {
            console.error('❌ Error en resetearContrasena:', error);
            set({ error: error.message });
            return {
                success: false,
                errorType: 'unknown',
                error: '❌ Ocurrió un error inesperado. Intenta nuevamente.'
            };
        }
    },

    // ============================================================
    // 🔄 ACTUALIZAR CONTRASEÑA (sin cambios)
    // ============================================================
    actualizarContrasena: async (nuevaContrasena: string) => {
        set({ error: null });

        try {
            if (!nuevaContrasena || nuevaContrasena.length < 6) {
                return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' };
            }

            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError) {
                return { success: false, error: 'Error al verificar la sesión: ' + sessionError.message };
            }

            if (!session) {
                return { success: false, error: 'No hay sesión activa. Solicita un nuevo enlace de recuperación.' };
            }

            const { error } = await supabase.auth.updateUser({
                password: nuevaContrasena,
            });

            if (error) {
                return { success: false, error: String(error.message) };
            }

            return { success: true };
        } catch (error: any) {
            console.error('❌ Error en actualizarContrasena:', error);
            set({ error: error.message });
            return { success: false, error: String(error.message || 'Error al actualizar la contraseña') };
        }
    },

    // ============================================================
    // 🧹 LIMPIAR ERROR (sin cambios)
    // ============================================================
    limpiarError: () => {
        set({ error: null });
    },
}));