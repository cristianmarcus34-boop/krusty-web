// app/api/send-push/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import webpush from 'web-push';

// ✅ Configurar VAPID con valores por defecto si no existen (para desarrollo)
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';

// ✅ Solo configurar si hay claves (evita errores en desarrollo)
if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(
        'mailto:krustyburger@gmail.com',
        vapidPublicKey,
        vapidPrivateKey
    );
} else {
    console.warn('⚠️ [Push] Claves VAPID no configuradas. Las notificaciones no funcionarán.');
}

export async function POST(req: Request) {
    try {
        const { userId, titulo, cuerpo, url } = await req.json();

        // ✅ Validar que las claves existan
        if (!vapidPublicKey || !vapidPrivateKey) {
            return NextResponse.json(
                { error: 'Claves VAPID no configuradas' },
                { status: 500 }
            );
        }

        // ✅ Validar datos requeridos
        if (!userId || !titulo || !cuerpo) {
            return NextResponse.json(
                { error: 'Faltan datos requeridos' },
                { status: 400 }
            );
        }

        // ✅ Obtener suscripción del usuario
        const { data: subscriptionData, error } = await supabase
            .from('push_subscriptions')
            .select('subscription')
            .eq('usuario_id', userId)
            .single();

        if (error || !subscriptionData) {
            return NextResponse.json(
                { error: 'Usuario no suscrito a notificaciones' },
                { status: 404 }
            );
        }

        // ✅ Enviar notificación
        const payload = JSON.stringify({
            title: titulo,
            body: cuerpo,
            url: url || '/'
        });

        await webpush.sendNotification(
            subscriptionData.subscription,
            payload
        );

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('❌ [Push] Error enviando notificación:', error);

        // ✅ Manejar errores específicos de web-push
        if (error instanceof Error) {
            if (error.message.includes('expired')) {
                return NextResponse.json(
                    { error: 'La suscripción expiró' },
                    { status: 410 }
                );
            }
        }

        return NextResponse.json(
            { error: 'Error enviando notificación' },
            { status: 500 }
        );
    }
}