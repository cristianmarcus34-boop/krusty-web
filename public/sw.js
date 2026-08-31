// public/sw.js

// ✅ Reproducir sonido woo-hoo
const playWooHoo = async () => {
    try {
        const clients = await self.clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        });

        clients.forEach(client => {
            client.postMessage({
                type: 'PLAY_WOO_HOO'
            });
        });
    } catch (error) {
        console.error('[SW] Error reproduciendo woo-hoo:', error);
    }
};

// ✅ Enviar mensaje a TODOS los clientes
const sendMessageToAllClients = async (title, body, url) => {
    const clients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true
    });

    console.log(`[SW] Enviando mensaje a ${clients.length} clientes`);

    clients.forEach((client, index) => {
        try {
            client.postMessage({
                type: 'PUSH_NOTIFICATION',
                payload: {
                    title: title,
                    body: body,
                    url: url
                }
            });
            console.log(`[SW] Mensaje enviado al cliente ${index + 1}`);
        } catch (error) {
            console.error(`[SW] Error enviando mensaje al cliente ${index + 1}:`, error);
        }
    });

    return clients.length > 0;
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
        silent: false
    };

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(async (clients) => {
                const hasClients = clients.length > 0;

                // ✅ Reproducir woo-hoo SIEMPRE
                await playWooHoo();

                // ✅ SIEMPRE intentar enviar mensaje a todos los clientes
                if (hasClients) {
                    console.log('[SW] Clientes encontrados, enviando mensaje para banner...');
                    await sendMessageToAllClients(title, body, url);
                } else {
                    console.log('[SW] No hay clientes abiertos');
                }

                // ✅ SIEMPRE mostrar notificación nativa
                console.log('[SW] Mostrando notificación nativa...');
                return self.registration.showNotification(title, options);
            })
    );
});

// ✅ Click en notificación nativa
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Click en notificación:', event);
    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                for (const client of clientList) {
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus();
                    }
                }
                if (self.clients.openWindow) {
                    return self.clients.openWindow(urlToOpen);
                }
            })
    );
});

// ✅ Mensajes desde el cliente
self.addEventListener('message', (event) => {
    console.log('[SW] Mensaje recibido del cliente:', event.data);
});