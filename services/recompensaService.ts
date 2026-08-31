// services/recompensaService.ts
import { supabase } from '@/lib/supabase';

export interface Recompensa {
    id: number;
    nombre: string;
    descripcion: string;
    puntos_necesarios: number;
    tipo: 'DESCUENTO' | 'PRODUCTO_GRATIS' | 'ENVIO_GRATIS';
    valor_descuento: number;
    imagen?: string;
    activa: boolean;
}

export interface ResultadoCanje {
    exito: boolean;
    mensaje: string;
    canje_id?: number;
    puntos_restantes?: number;
}

export const recompensaService = {
    // Obtener recompensas activas
    async obtenerRecompensas(): Promise<Recompensa[]> {
        const { data, error } = await supabase
            .from('recompensas')
            .select('*')
            .eq('activa', true)
            .order('puntos_necesarios', { ascending: true });

        if (error) {
            console.error('Error obteniendo recompensas:', error);
            return [];
        }

        return data || [];
    },

    // Canjear recompensa
    async canjearRecompensa(usuarioId: string, recompensaId: number): Promise<ResultadoCanje> {
        try {
            // 1. Obtener usuario actual
            const { data: perfil, error: perfilError } = await supabase
                .from('perfiles')
                .select('puntos_disponibles')
                .eq('id', usuarioId)
                .single();

            if (perfilError || !perfil) {
                return { exito: false, mensaje: 'Usuario no encontrado' };
            }

            // 2. Obtener recompensa
            const { data: recompensa, error: recompensaError } = await supabase
                .from('recompensas')
                .select('*')
                .eq('id', recompensaId)
                .single();

            if (recompensaError || !recompensa) {
                return { exito: false, mensaje: 'Recompensa no encontrada' };
            }

            // 3. Verificar puntos suficientes
            if ((perfil.puntos_disponibles || 0) < recompensa.puntos_necesarios) {
                return { exito: false, mensaje: 'Puntos insuficientes' };
            }

            // 4. Crear canje
            const { data: canje, error: canjeError } = await supabase
                .from('canjes')
                .insert({
                    usuario_id: usuarioId,
                    recompensa_id: recompensaId,
                    puntos_usados: recompensa.puntos_necesarios,
                    usado_en_pedido: false,
                })
                .select()
                .single();

            if (canjeError) {
                console.error('Error creando canje:', canjeError);
                return { exito: false, mensaje: 'Error al procesar el canje' };
            }

            // 5. Actualizar puntos del usuario
            const nuevosPuntos = (perfil.puntos_disponibles || 0) - recompensa.puntos_necesarios;

            const { error: updateError } = await supabase
                .from('perfiles')
                .update({ puntos_disponibles: nuevosPuntos })
                .eq('id', usuarioId);

            if (updateError) {
                console.error('Error actualizando puntos:', updateError);
                return { exito: false, mensaje: 'Error al actualizar puntos' };
            }

            return {
                exito: true,
                mensaje: `¡${recompensa.nombre} canjeada con éxito!`,
                canje_id: canje.id,
                puntos_restantes: nuevosPuntos,
            };
        } catch (error) {
            console.error('Error en canje:', error);
            return { exito: false, mensaje: 'Error inesperado al canjear' };
        }
    },

    // Obtener canjes del usuario
    async obtenerCanjesUsuario(usuarioId: string) {
        const { data, error } = await supabase
            .from('canjes')
            .select(`
                id,
                puntos_usados,
                usado_en_pedido,
                created_at,
                recompensas (
                    nombre,
                    tipo,
                    valor_descuento,
                    puntos_necesarios
                )
            `)
            .eq('usuario_id', usuarioId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error obteniendo canjes:', error);
            return [];
        }

        return data || [];
    }
};