// app/api/recompensas/canjear/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { recompensaId } = body;

        if (!recompensaId) {
            return NextResponse.json(
                { error: 'ID de recompensa requerido' },
                { status: 400 }
            );
        }

        // ✅ Obtener el usuario autenticado
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json(
                { error: 'No autorizado' },
                { status: 401 }
            );
        }

        const token = authHeader.replace('Bearer ', '');

        // ✅ Verificar sesión
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        if (userError || !user) {
            return NextResponse.json(
                { error: 'No autorizado' },
                { status: 401 }
            );
        }

        const usuarioId = user.id;

        // ✅ 1. Obtener perfil del usuario
        const { data: perfil, error: perfilError } = await supabase
            .from('perfiles')
            .select('puntos_disponibles')
            .eq('id', usuarioId)
            .single();

        if (perfilError || !perfil) {
            return NextResponse.json(
                { error: 'Usuario no encontrado' },
                { status: 404 }
            );
        }

        // ✅ 2. Obtener recompensa
        const { data: recompensa, error: recompensaError } = await supabase
            .from('recompensas')
            .select('*')
            .eq('id', recompensaId)
            .single();

        if (recompensaError || !recompensa) {
            return NextResponse.json(
                { error: 'Recompensa no encontrada' },
                { status: 404 }
            );
        }

        // ✅ 3. Verificar puntos suficientes
        if ((perfil.puntos_disponibles || 0) < recompensa.puntos_necesarios) {
            return NextResponse.json(
                {
                    error: 'Puntos insuficientes',
                    puntos_disponibles: perfil.puntos_disponibles || 0,
                    puntos_necesarios: recompensa.puntos_necesarios,
                },
                { status: 400 }
            );
        }

        // ✅ 4. Insertar canje
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
            console.error('❌ Error creando canje:', canjeError);
            return NextResponse.json(
                { error: 'Error al procesar el canje' },
                { status: 500 }
            );
        }

        // ✅ 5. Actualizar puntos del usuario
        const nuevosPuntos = (perfil.puntos_disponibles || 0) - recompensa.puntos_necesarios;

        const { error: updateError } = await supabase
            .from('perfiles')
            .update({ puntos_disponibles: nuevosPuntos })
            .eq('id', usuarioId);

        if (updateError) {
            console.error('❌ Error actualizando puntos:', updateError);
            return NextResponse.json(
                { error: 'Error al actualizar puntos' },
                { status: 500 }
            );
        }

        // ✅ 6. Retornar respuesta exitosa
        return NextResponse.json({
            success: true,
            mensaje: `¡${recompensa.nombre} canjeada con éxito!`,
            canje_id: canje.id,
            puntos_restantes: nuevosPuntos,
            recompensa: {
                id: recompensa.id,
                nombre: recompensa.nombre,
                tipo: recompensa.tipo,
                valor_descuento: recompensa.valor_descuento,
            },
        });

    } catch (error) {
        console.error('❌ Error en canje:', error);
        return NextResponse.json(
            { error: 'Error inesperado al procesar el canje' },
            { status: 500 }
        );
    }
}