// app/api/mercadopago/create-preference/route.ts
import { NextResponse } from 'next/server';
import { getMercadoPagoAccessToken, getBaseUrl } from '@/lib/mercadopago-config';

export async function POST(request: Request) {
    console.log('🚀🚀🚀 [MP] ENDPOINT EJECUTÁNDOSE 🚀🚀🚀');
    const startTime = Date.now();

    try {
        // 1. Obtener y validar el body
        const body = await request.json();
        console.log('📦 [MP] Body recibido:', JSON.stringify(body, null, 2));

        // Se evalúan todas las alternativas posibles de nombre para el costo de envío
        const { items, customer, shippingCost, costoEnvio, shipment_cost } = body;
        const finalShippingCost = Number(shippingCost || costoEnvio || shipment_cost || 0);

        // 2. Validar items
        if (!items || !Array.isArray(items) || items.length === 0) {
            console.error('❌ [MP] No hay items en el pedido');
            return NextResponse.json({ error: 'No hay items en el pedido' }, { status: 400 });
        }

        // 3. Validar cliente
        if (!customer || !customer.nombre || customer.nombre.trim().length < 2) {
            console.error('❌ [MP] Nombre del cliente inválido');
            return NextResponse.json({ error: 'Nombre del cliente es requerido' }, { status: 400 });
        }

        const telefonoLimpio = customer.telefono ? String(customer.telefono).replace(/\D/g, '') : '';
        if (!telefonoLimpio || telefonoLimpio.length < 8) {
            console.error('❌ [MP] Teléfono del cliente inválido');
            return NextResponse.json({ error: 'Teléfono del cliente inválido' }, { status: 400 });
        }

        // 4. Validar Access Token desde lib
        let accessToken = '';
        try {
            accessToken = getMercadoPagoAccessToken();
        } catch (err) {
            console.error('❌ [MP] Error obteniendo Access Token:', err);
            return NextResponse.json({ error: 'Error de configuración en las credenciales de pago' }, { status: 500 });
        }

        // 5. Preparar items para MP
        const mpItems = items.map((item: any, index: number) => {
            const unitPrice = Number(item.unit_price) || 0;
            const quantity = Math.max(1, Number(item.quantity) || 1);

            return {
                id: item.id ? String(item.id) : `item-${index}`,
                title: String(item.title || 'Producto Krusty Burger').slice(0, 256),
                quantity: quantity,
                unit_price: unitPrice,
                currency_id: 'ARS',
            };
        });

        // Validar que no haya items con precio 0 o menor
        const itemInvalido = mpItems.find((i) => i.unit_price <= 0);
        if (itemInvalido) {
            console.error('❌ [MP] Hay items con precio de $0:', itemInvalido);
            return NextResponse.json({ error: 'Los productos deben tener un precio mayor a $0' }, { status: 400 });
        }

        // 6. Configurar URLs dinámicas
        const baseUrl = getBaseUrl();
        const isLocalhost = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');

        const successUrl = `${baseUrl}/pedido/exito`;
        const failureUrl = `${baseUrl}/pedido/fallo`;
        const pendingUrl = `${baseUrl}/pedido/pendiente`;
        const notificationUrl = `${baseUrl}/api/mercadopago/webhook`;

        // 7. Construir payload de preferencia
        const payload: Record<string, any> = {
            items: mpItems,
            shipments: {
                cost: finalShippingCost,
                mode: 'not_specified',
            },
            payer: {
                name: customer.nombre.trim(),
                phone: {
                    number: telefonoLimpio,
                },
            },
            back_urls: {
                success: successUrl,
                failure: failureUrl,
                pending: pendingUrl,
            },
            notification_url: notificationUrl, // 🔔 URL del webhook para actualizaciones en tiempo real
            statement_descriptor: 'Krusty Burger',
            external_reference: `KB-${Date.now()}-${telefonoLimpio.slice(-4)}`,
        };

        // ⚠️ Desactivar auto_return en localhost
        if (!isLocalhost) {
            payload.auto_return = 'approved';
        } else {
            console.warn('⚠️ [MP] En localhost se omite "auto_return" para evitar rechazo de Mercado Pago');
        }

        console.log('📤 [MP] Enviando payload a Mercado Pago...');

        // 8. Petición HTTP a Mercado Pago
        const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken.trim()}`,
            },
            body: JSON.stringify(payload),
        });

        const mpData = await mpResponse.json();

        if (mpResponse.ok && mpData.id) {
            console.log(`✅ [MP] Preferencia creada con éxito (${Date.now() - startTime}ms)`);
            console.log(`🔗 [MP] init_point: ${mpData.init_point}`);

            return NextResponse.json({
                init_point: mpData.init_point,
                preference_id: mpData.id,
            });
        }

        // Diagnóstico de errores provenientes de MP
        console.error('❌ [MP] Error devuelto por la API de Mercado Pago:');
        console.error('Status:', mpResponse.status);
        console.error('Detalle:', JSON.stringify(mpData, null, 2));

        let errorMessage = 'Error al generar la preferencia de pago';
        if (mpData.message) {
            errorMessage = mpData.message;
        } else if (mpData.cause && Array.isArray(mpData.cause) && mpData.cause.length > 0) {
            errorMessage = mpData.cause.map((c: any) => c.description || c.code).join(' | ');
        }

        return NextResponse.json({ error: errorMessage, details: mpData }, { status: mpResponse.status || 400 });
    } catch (error: any) {
        console.error('❌ [MP] Error de servidor inesperado:', error);
        return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
    }
}