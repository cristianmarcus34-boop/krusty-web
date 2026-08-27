// services/servicioEliminacionCuenta.ts
import { supabase } from '@/lib/supabase';
import {
    SolicitudEliminacion,
    ResultadoSolicitudEliminacion,
    EstadoEliminacion,
} from '@/lib/tipos';

export const servicioEliminacionCuenta = {
    /**
     * Solicitar eliminación de cuenta
     */
    async solicitarEliminacion(
        usuarioId: string,
        email: string,
        motivo: string,
        password: string
    ): Promise<ResultadoSolicitudEliminacion> {
        try {
            // 1. Verificar la contraseña del usuario
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError) {
                return {
                    success: false,
                    error: 'Contraseña incorrecta. Por favor, verificá tu contraseña.',
                };
            }

            // 2. Verificar si ya existe una solicitud activa
            const { data: solicitudExistente, error: checkError } = await supabase
                .from('solicitudes_eliminacion')
                .select('*')
                .eq('usuario_id', usuarioId)
                .eq('estado', 'pendiente')
                .maybeSingle();

            if (checkError) {
                console.error('❌ Error verificando solicitud:', checkError);
                return {
                    success: false,
                    error: 'Error al verificar solicitudes existentes.',
                };
            }

            if (solicitudExistente) {
                return {
                    success: false,
                    error: 'Ya tenés una solicitud de eliminación activa. Si querés cancelarla, podés hacerlo desde tu perfil.',
                };
            }

            // 3. Crear la solicitud de eliminación
            const fechaEliminacion = new Date();
            fechaEliminacion.setDate(fechaEliminacion.getDate() + 30); // 30 días

            const { data: nuevaSolicitud, error: insertError } = await supabase
                .from('solicitudes_eliminacion')
                .insert({
                    usuario_id: usuarioId,
                    email: email,
                    motivo: motivo,
                    fecha_eliminacion: fechaEliminacion.toISOString(),
                    estado: 'pendiente',
                })
                .select()
                .single();

            if (insertError) {
                console.error('❌ Error creando solicitud:', insertError);
                return {
                    success: false,
                    error: 'Error al crear la solicitud de eliminación.',
                };
            }

            return {
                success: true,
                solicitud: nuevaSolicitud as SolicitudEliminacion,
            };

        } catch (error) {
            console.error('❌ Error inesperado:', error);
            return {
                success: false,
                error: 'Ocurrió un error inesperado. Intentá nuevamente.',
            };
        }
    },

    /**
     * Cancelar solicitud de eliminación
     */
    async cancelarEliminacion(
        usuarioId: string
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const { error } = await supabase
                .from('solicitudes_eliminacion')
                .update({ estado: 'cancelada' })
                .eq('usuario_id', usuarioId)
                .eq('estado', 'pendiente');

            if (error) {
                console.error('❌ Error cancelando eliminación:', error);
                return {
                    success: false,
                    error: 'Error al cancelar la eliminación.',
                };
            }

            return { success: true };

        } catch (error) {
            console.error('❌ Error inesperado:', error);
            return {
                success: false,
                error: 'Ocurrió un error inesperado.',
            };
        }
    },

    /**
     * Obtener estado de eliminación
     */
    async obtenerEstadoEliminacion(
        usuarioId: string
    ): Promise<EstadoEliminacion> {
        try {
            const { data, error } = await supabase
                .from('solicitudes_eliminacion')
                .select('*')
                .eq('usuario_id', usuarioId)
                .eq('estado', 'pendiente')
                .maybeSingle();

            if (error) {
                console.error('❌ Error obteniendo estado:', error);
                return { tieneSolicitud: false };
            }

            if (!data) {
                return { tieneSolicitud: false };
            }

            // Calcular días restantes
            const fechaEliminacion = new Date(data.fecha_eliminacion);
            const ahora = new Date();
            const diffTime = fechaEliminacion.getTime() - ahora.getTime();
            const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

            return {
                tieneSolicitud: true,
                solicitud: data as SolicitudEliminacion,
                diasRestantes: diffDays,
            };

        } catch (error) {
            console.error('❌ Error inesperado:', error);
            return { tieneSolicitud: false };
        }
    },

    /**
     * Verificar si el usuario tiene una solicitud activa
     */
    async tieneSolicitudActiva(
        usuarioId: string
    ): Promise<boolean> {
        const estado = await this.obtenerEstadoEliminacion(usuarioId);
        return estado.tieneSolicitud;
    },
};