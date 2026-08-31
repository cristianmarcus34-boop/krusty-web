// public/sw.js

// ✅ Instalación
self.addEventListener('install', (event) => {
    console.log('[SW] Instalando...');
    event.waitUntil(self.skipWaiting());
});

// ✅ Activación
self.addEventListener('activate', (event) => {
    console.log('[SW] Activando...');
    event.waitUntil(self.clients.claim());
});

// ✅ Notificación Push
self.addEventListener('push', (event) => {
    console.log('[SW] Push recibido:', event);

    let data = {};
    try {
        data = event.data ? event.data.json() : {};
    } catch (error) {
        console.error('[SW] Error parseando push data:', error);
    }

    const title = data.title || '📢 Krusty Burger';
    const options = {
        body: data.body || 'Actualización de tu pedido',
        icon: '/images/krusty-icon-192x192.png',
        badge: '/images/krusty-icon-72x72.png',
        vibrate: [200, 100, 200],
        data: {
            url: data.url || '/'
        },
        actions: [
            { action: 'ver', title: '👀 Ver pedido' }
        ],
        requireInteraction: true,
        tag: 'pedido-update',
        renotify: true
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// ✅ Click en notificación
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Click en notificación:', event);
    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // ✅ Buscar una ventana abierta con la URL
                for (const client of clientList) {
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus();
                    }
                }
                // ✅ Si no hay, abrir una nueva
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

// ✅ Mensajes desde el cliente
self.addEventListener('message', (event) => {
    console.log('[SW] Mensaje recibido:', event.data);
});