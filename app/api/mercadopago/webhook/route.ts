import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inicializar cliente de Supabase (con service_role para permisos de escritura)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        // Mercado Pago envía el tipo de evento y el ID del recurso
        const type = searchParams.get('type') || searchParams.get('topic');
        const dataId = searchParams.get('data.id') || searchParams.get('id');

        // Solo procesamos notificaciones de pagos
        if (type === 'payment' && dataId) {
            // 1. Consultar el estado del pago directamente a la API de Mercado Pago
            const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
                headers: {
                    Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN?.trim()}`,
                },
            });

            if (mpResponse.ok) {
                const paymentData = await mpResponse.json();
                const externalReference = paymentData.external_reference; // Ej: KB-1718293-1234
                const paymentStatus = paymentData.status; // approved, pending, rejected, etc.

                console.log(`🔔 [MP Webhook] Pago ${dataId} | Estado: ${paymentStatus} | Ref: ${externalReference}`);

                // 2. Si el pago fue APROBADO, actualizamos el pedido en Supabase
                if (paymentStatus === 'approved' && externalReference) {
                    // Si guardaste el ID de pedido o la external_reference en tu tabla 'pedidos'
                    const { error } = await supabase
                        .from('pedidos')
                        .update({
                            estado_pago: 'aprobado',
                            estado: 'confirmado', // O el estado con el que pasa a cocina
                            mp_payment_id: String(dataId)
                        })
                        .eq('external_reference', externalReference);

                    if (error) {
                        console.error('❌ Error actualizando pedido en Supabase:', error);
                    } else {
                        console.log(`✅ Pedido ${externalReference} actualizado a PAGADO en Supabase`);
                    }
                }
            }
        }

        // Mercado Pago requiere siempre un status 200 OK de respuesta rápida
        return NextResponse.json({ received: true }, { status: 200 });
    } catch (error: any) {
        console.error('❌ Error en el Webhook de MP:', error);
        // Respondemos 200 de todos modos para que MP no reintente indefinidamente si falla el código interno
        return NextResponse.json({ received: true }, { status: 200 });
    }
}