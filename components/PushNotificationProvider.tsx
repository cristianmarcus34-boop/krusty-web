// components/PushNotificationProvider.tsx
"use client";

import { useEffect, useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import PushBanner from './PushBanner';

interface NotificationData {
    id: string;
    title: string;
    body: string;
    url?: string;
}

export default function PushNotificationProvider({
    children
}: {
    children: React.ReactNode;
}) {
    const [notifications, setNotifications] = useState<NotificationData[]>([]);

    // ✅ Escuchar mensajes del Service Worker
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            // Verificar que el mensaje viene del Service Worker
            if (event.data?.type === 'PUSH_NOTIFICATION') {
                const { title, body, url } = event.data.payload;

                // Agregar notificación con ID único
                const newNotification = {
                    id: Date.now().toString(),
                    title,
                    body,
                    url
                };

                setNotifications(prev => [newNotification, ...prev].slice(0, 5));
            }
        };

        // Escuchar mensajes del Service Worker
        if (typeof navigator !== 'undefined' && navigator.serviceWorker) {
            navigator.serviceWorker.addEventListener('message', handleMessage);
        }

        return () => {
            if (typeof navigator !== 'undefined' && navigator.serviceWorker) {
                navigator.serviceWorker.removeEventListener('message', handleMessage);
            }
        };
    }, []);

    // ✅ Eliminar notificación
    const handleClose = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    return (
        <>
            {children}

            {/* Mostrar banners */}
            <div className="fixed bottom-4 left-4 right-4 z-9999 pointer-events-none">
                <div className="flex flex-col items-center gap-2 max-w-md mx-auto">
                    <AnimatePresence>
                        {notifications.map((notif) => (
                            <div key={notif.id} className="w-full pointer-events-auto">
                                <PushBanner
                                    title={notif.title}
                                    body={notif.body}
                                    url={notif.url}
                                    onClose={() => handleClose(notif.id)}
                                />
                            </div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </>
    );
}