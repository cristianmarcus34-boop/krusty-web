// ============================================================
// 📦 SERVICE WORKER - KRUSTY BURGER
// VERSIÓN ROBUSTA - Maneja todos los casos de error
// ============================================================

// ============================================================
// 📌 INSTALACIÓN Y ACTIVACIÓN
// ============================================================

self.addEventListener('install', (event) => {
    console.log('[SW] Instalando...');
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    console.log('[SW] Activando...');
    event.waitUntil(self.clients.claim());

    // ✅ Notificar a todos los clientes que hay nueva versión
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(clients => {
            clients.forEach(client => {
                client.postMessage({
                    type: 'NEW_VERSION_AVAILABLE',
                    message: '¡Nueva versión disponible! Recargando...'
                });
            });
        });
});

// ============================================================
// 📌 VARIABLES Y CONSTANTES
// ============================================================

const CACHE_NAME = 'krusty-cache-v2'; // ✅ Cambiar versión para forzar actualización
const STATIC_ASSETS = [
    '/images/krusty-icon-192x192.png',
    '/images/krusty-icon-72x72.png',
    '/sounds/woo-hoo.mp3'
];

// ============================================================
// 📌 CACHÉ DE RECURSOS ESTÁTICOS (OPCIONAL)
// ============================================================

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(STATIC_ASSETS))
            .catch((error) => console.error('[SW] Error cacheando recursos:', error))
    );
});

// ============================================================
// 📌 ENVIAR MENSAJE A TODOS LOS CLIENTES (ROBUSTO)
// ============================================================

const sendMessageToAllClients = async (title, body, url) => {
    try {
        const clients = await self.clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        });

        if (!clients || clients.length === 0) {
            return;
        }

        await Promise.allSettled(
            clients.map(async (client) => {
                try {
                    if (!client || client.closed) {
                        return;
                    }

                    client.postMessage({
                        type: 'PUSH_NOTIFICATION',
                        payload: {
                            title: title || '📢 Krusty Burger',
                            body: body || 'Actualización de tu pedido',
                            url: url || '/'
                        }
                    });
                } catch (error) {
                    // Cliente cerrado, ignorar silenciosamente
                }
            })
        );

    } catch (error) {
        console.warn('[SW] Error enviando mensajes:', error.message);
    }
};

// ============================================================
// 📌 REPRODUCIR WOO-HOO (ROBUSTO)
// ============================================================

const playWooHoo = async () => {
    try {
        const clients = await self.clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        });

        if (!clients || clients.length === 0) {
            return;
        }

        clients.forEach((client) => {
            try {
                if (!client || client.closed) {
                    return;
                }
                client.postMessage({ type: 'PLAY_WOO_HOO' });
            } catch (error) {
                // Silenciosamente ignorar clientes que no responden
            }
        });

    } catch (error) {
        console.warn('[SW] Error reproduciendo woo-hoo:', error.message);
    }
};

// ============================================================
// 📌 RECIBIR NOTIFICACIONES PUSH (PRINCIPAL)
// ============================================================

self.addEventListener('push', (event) => {
    if (!event) return;

    console.log('[SW] 📨 Push recibido');

    let data = {};
    try {
        data = event.data ? event.data.json() : {};
    } catch (error) {
        console.warn('[SW] Error parseando datos:', error.message);
        data = {};
    }

    const title = data.title || '📢 Krusty Burger';
    const body = data.body || 'Actualización de tu pedido';
    const url = data.url || '/';

    const options = {
        body: body,
        icon: '/images/krusty-icon-192x192.png',
        badge: '/images/krusty-icon-72x72.png',
        vibrate: [200, 100, 200],
        data: {
            url: url,
            timestamp: Date.now()
        },
        actions: [
            { action: 'ver', title: '👀 Ver pedido' }
        ],
        requireInteraction: true,
        tag: 'pedido-update',
        renotify: true,
        silent: false
    };

    event.waitUntil(
        (async () => {
            try {
                await playWooHoo();

                const clients = await self.clients.matchAll({
                    type: 'window',
                    includeUncontrolled: true
                });

                if (clients && clients.length > 0) {
                    await sendMessageToAllClients(title, body, url);
                }

                return self.registration.showNotification(title, options);

            } catch (error) {
                console.error('[SW] Error en push:', error.message);
                return self.registration.showNotification(title, options);
            }
        })()
    );
});

// ============================================================
// 📌 CLICK EN NOTIFICACIÓN NATIVA
// ============================================================

self.addEventListener('notificationclick', (event) => {
    if (!event) return;

    console.log('[SW] 👆 Click en notificación');

    event.notification.close();

    const urlToOpen = event.notification?.data?.url || '/';

    event.waitUntil(
        (async () => {
            try {
                const clientList = await self.clients.matchAll({
                    type: 'window',
                    includeUncontrolled: true
                });

                for (const client of clientList) {
                    try {
                        if (client.url === urlToOpen && client.focus) {
                            await client.focus();
                            return;
                        }
                    } catch (error) {
                        // Ignorar error y continuar
                    }
                }

                if (self.clients.openWindow) {
                    await self.clients.openWindow(urlToOpen);
                }

            } catch (error) {
                console.error('[SW] Error abriendo ventana:', error.message);
                try {
                    if (self.clients.openWindow) {
                        await self.clients.openWindow('/');
                    }
                } catch (fallbackError) {
                    console.error('[SW] Error en fallback:', fallbackError.message);
                }
            }
        })()
    );
});

// ============================================================
// 📌 MENSAJES DESDE EL CLIENTE
// ============================================================

self.addEventListener('message', (event) => {
    if (!event || !event.data) return;

    // ✅ SI EL CLIENTE PIDE ACTUALIZAR
    if (event.data?.type === 'SKIP_WAITING') {
        console.log('[SW] ⏭️ Saltando waiting para actualizar...');
        self.skipWaiting();

        self.clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(clients => {
                clients.forEach(client => {
                    client.postMessage({
                        type: 'NEW_VERSION_AVAILABLE',
                        message: '¡Nueva versión disponible! Recargando...'
                    });
                });
            });
        return;
    }

    try {
        console.log('[SW] Mensaje del cliente:', event.data.type || 'desconocido');
    } catch (error) {
        // Ignorar errores en logs
    }
});

// ============================================================
// 📌 MANEJO DE ERRORES GLOBALES
// ============================================================

self.addEventListener('error', (event) => {
    // Solo loguear, no romper
});

self.addEventListener('unhandledrejection', (event) => {
    // Solo loguear, no romper
});

// ============================================================
// 📌 LIMPIEZA DE CACHÉ (OPCIONAL)
// ============================================================

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
});

// ============================================================
// 📌 FIN DEL SERVICE WORKER
// ============================================================

console.log('[SW] ✅ Service Worker Krusty Burger cargado correctamente');