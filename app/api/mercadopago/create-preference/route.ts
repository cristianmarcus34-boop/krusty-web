// app/api/mercadopago/create-preference/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    console.log('🔵 1. Recibida solicitud de pago');

    try {
        const body = await request.json();
        console.log('🔵 2. Body recibido:', JSON.stringify(body, null, 2));

        const { items, customer } = body;

        // Validar que lleguen los datos
        if (!items || items.length === 0) {
            console.error('❌ No hay items en el pedido');
            return NextResponse.json(
                { error: 'No hay items en el pedido' },
                { status: 400 }
            );
        }

        if (!customer || !customer.nombre || !customer.telefono) {
            console.error('❌ Datos del cliente incompletos');
            return NextResponse.json(
                { error: 'Datos del cliente incompletos' },
                { status: 400 }
            );
        }

        const accessToken = process.env.MP_ACCESS_TOKEN_PROD;

        if (!accessToken) {
            console.error('❌ Falta MP_ACCESS_TOKEN_PROD en .env.local');
            return NextResponse.json(
                { error: 'Error de configuración del servidor' },
                { status: 500 }
            );
        }

        console.log('🔵 3. Access Token encontrado');

        // Verificar que los items tengan precio válido
        const mpItems = items.map((item: any) => ({
            title: item.title || 'Producto',
            quantity: Number(item.quantity) || 1,
            unit_price: Number(item.unit_price) || 0,
            currency_id: 'ARS',
        }));

        console.log('🔵 4. Items preparados:', JSON.stringify(mpItems, null, 2));

        // ✅ URL BASE CON VERIFICACIÓN
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        console.log('🔵 5. URL base:', baseUrl);

        // ✅ CONSTRUIR URLS COMPLETAS Y VÁLIDAS
        const successUrl = `${baseUrl}/pedido/exito`;
        const failureUrl = `${baseUrl}/pedido/fallo`;
        const pendingUrl = `${baseUrl}/pedido/pendiente`;

        console.log('🔵 6. URLs de retorno:', {
            success: successUrl,
            failure: failureUrl,
            pending: pendingUrl,
        });

        // ✅ CREAR PREFERENCIA CON AUTO_RETURN CORRECTO
        const payload = {
            items: mpItems,
            payer: {
                name: customer.nombre,
                phone: {
                    number: customer.telefono,
                },
            },
            back_urls: {
                success: successUrl,
                failure: failureUrl,
                pending: pendingUrl,
            },
            auto_return: 'approved', // ✅ Debe ser 'approved' o 'all'
            statement_descriptor: 'Krusty Burger',
            external_reference: customer.telefono,
            // ✅ Agregar notification_url para webhooks (opcional)
            notification_url: `${baseUrl}/api/mercadopago/webhook`,
        };

        console.log('🔵 7. Payload enviado a MP:', JSON.stringify(payload, null, 2));

        // Crear la preferencia de pago
        const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify(payload),
        });

        console.log('🔵 8. Respuesta de MP - Status:', mpResponse.status);

        const mpData = await mpResponse.json();

        if (mpResponse.ok && mpData.id) {
            console.log('✅ Preferencia creada con éxito:', mpData.id);
            console.log('🔗 init_point:', mpData.init_point);

            return NextResponse.json({
                init_point: mpData.init_point,
                preference_id: mpData.id,
            });
        } else {
            console.error('❌ Error de Mercado Pago:', mpData);
            return NextResponse.json(
                { error: mpData.message || 'Error al crear la preferencia de pago' },
                { status: mpResponse.status || 500 }
            );
        }
    } catch (error) {
        console.error('❌ Error inesperado:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}