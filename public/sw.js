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

const CACHE_NAME = 'krusty-cache-v2';

// ✅ RUTAS CORREGIDAS - Los iconos están en la raíz de public/
const STATIC_ASSETS = [
    '/android-icon-192x192.png',   // ✅ public/krusty-icon-192x192.png
    '/android-icon-72x72.png',     // ✅ public/krusty-icon-72x72.png
    '/sounds/woo-hoo.mp3'         // ✅ public/sounds/woo-hoo.mp3
];

// ============================================================
// 📌 CACHÉ DE RECURSOS ESTÁTICOS (ROBUSTO)
// ============================================================

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                // ✅ Intentar cachear cada recurso individualmente
                const promises = STATIC_ASSETS.map(async (url) => {
                    try {
                        const response = await fetch(url);
                        if (response.ok) {
                            await cache.put(url, response);
                            console.log(`[SW] ✅ Cacheado: ${url}`);
                        } else {
                            console.warn(`[SW] ⚠️ No se pudo cachear: ${url} (${response.status})`);
                        }
                    } catch (error) {
                        console.warn(`[SW] ⚠️ Error cacheando: ${url}`, error.message);
                    }
                });

                return Promise.allSettled(promises);
            })
            .then((results) => {
                const fallidos = results.filter(r => r.status === 'rejected').length;
                if (fallidos > 0) {
                    console.warn(`[SW] ⚠️ ${fallidos} recursos no se cachearon correctamente`);
                } else {
                    console.log('[SW] ✅ Todos los recursos cacheados correctamente');
                }
            })
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
        icon: '/android-icon-192x192.png',  // ✅ Ruta corregida
        badge: '/android-icon-36x36.png',    // ✅ Ruta corregida
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