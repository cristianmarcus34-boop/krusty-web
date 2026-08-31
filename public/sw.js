// public/sw.js

self.addEventListener('install', (event) => {
    console.log('[SW] Instalando...');
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    console.log('[SW] Activando...');
    event.waitUntil(self.clients.claim());
});

// ✅ Enviar mensaje al cliente
const sendMessageToClient = async (title, body, url) => {
    const clients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true
    });

    clients.forEach(client => {
        client.postMessage({
            type: 'PUSH_NOTIFICATION',
            payload: {
                title: title,
                body: body,
                url: url
            }
        });
    });
};

self.addEventListener('push', (event) => {
    console.log('[SW] Push recibido:', event);

    let data = {};
    try {
        data = event.data ? event.data.json() : {};
    } catch (error) {
        console.error('[SW] Error parseando push data:', error);
    }

    const title = data.title || '📢 Krusty Burger';
    const body = data.body || 'Actualización de tu pedido';
    const url = data.url || '/';

    const options = {
        body: body,
        icon: '/images/krusty-icon-192x192.png',
        badge: '/images/krusty-icon-72x72.png',
        vibrate: [200, 100, 200],
        data: { url },
        actions: [
            { action: 'ver', title: '👀 Ver pedido' }
        ],
        requireInteraction: true,
        tag: 'pedido-update',
        renotify: true,
        silent: true // ✅ No mostrar notificación nativa si la app está abierta
    };

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(clients => {
                const hasFocusedClient = clients.some(client => client.focused);

                if (hasFocusedClient) {
                    // ✅ App en primer plano → enviar mensaje para banner
                    return sendMessageToClient(title, body, url);
                } else {
                    // ✅ App en segundo plano → mostrar notificación nativa
                    return self.registration.showNotification(title, options);
                }
            })
    );
});

// ✅ Click en notificación nativa
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Click en notificación:', event);
    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                for (const client of clientList) {
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus();
                    }
                }
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