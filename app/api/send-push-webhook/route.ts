// app/api/send-push-webhook/route.ts
import { NextResponse } from 'next/server';
import webpush from 'web-push';

// Configurar VAPID
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';

if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(
        'mailto:krustyburger@gmail.com',
        vapidPublicKey,
        vapidPrivateKey
    );
} else {
    console.warn('⚠️ [Webhook] Claves VAPID no configuradas');
}

export async function POST(req: Request) {
    try {
        const { subscription, notification } = await req.json();

        if (!subscription || !notification) {
            return NextResponse.json(
                { error: 'Faltan datos requeridos' },
                { status: 400 }
            );
        }

        const payload = JSON.stringify({
            title: notification.title,
            body: notification.body,
            url: notification.url || '/'
        });

        await webpush.sendNotification(subscription, payload);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('❌ [Webhook] Error:', error);

        // ✅ Si la suscripción expiró
        if (error instanceof Error && error.message.includes('expired')) {
            return NextResponse.json(
                { error: 'Suscripción expirada' },
                { status: 410 }
            );
        }

        return NextResponse.json(
            { error: 'Error enviando notificación' },
            { status: 500 }
        );
    }
}

// ✅ CORS
export async function OPTIONS() {
    return new NextResponse(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}