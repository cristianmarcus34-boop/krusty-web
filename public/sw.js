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
});

// ============================================================
// 📌 VARIABLES Y CONSTANTES
// ============================================================

const CACHE_NAME = 'krusty-cache-v1';
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
        // ✅ Obtener todos los clientes (ventanas/pestañas)
        const clients = await self.clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        });

        // ✅ Si no hay clientes, salir silenciosamente
        if (!clients || clients.length === 0) {
            return;
        }

        // ✅ Enviar mensaje a CADA cliente individualmente
        await Promise.allSettled(
            clients.map(async (client) => {
                try {
                    // ✅ Verificar que el cliente sigue activo
                    if (!client || client.closed) {
                        return;
                    }

                    // ✅ Intentar enviar el mensaje
                    client.postMessage({
                        type: 'PUSH_NOTIFICATION',
                        payload: {
                            title: title || '📢 Krusty Burger',
                            body: body || 'Actualización de tu pedido',
                            url: url || '/'
                        }
                    });
                } catch (error) {
                    // ✅ Cliente cerrado, ignorar silenciosamente
                }
            })
        );

    } catch (error) {
        // ✅ Error general, pero NO romper
        console.warn('[SW] Error enviando mensajes:', error.message);
    }
};

// ============================================================
// 📌 REPRODUCIR WOO-HOO (ROBUSTO)
// ============================================================

const playWooHoo = async () => {
    try {
        // ✅ Obtener todos los clientes
        const clients = await self.clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        });

        // ✅ Si no hay clientes, salir silenciosamente
        if (!clients || clients.length === 0) {
            return;
        }

        // ✅ Enviar mensaje a CADA cliente individualmente
        clients.forEach((client) => {
            try {
                // ✅ Verificar que el cliente sigue activo
                if (!client || client.closed) {
                    return;
                }

                // ✅ Intentar enviar el mensaje
                client.postMessage({ type: 'PLAY_WOO_HOO' });

            } catch (error) {
                // ✅ Silenciosamente ignorar clientes que no responden
            }
        });

    } catch (error) {
        // ✅ Error general, pero NO romper
        console.warn('[SW] Error reproduciendo woo-hoo:', error.message);
    }
};

// ============================================================
// 📌 RECIBIR NOTIFICACIONES PUSH (PRINCIPAL)
// ============================================================

self.addEventListener('push', (event) => {
    // ✅ Si no hay evento, salir
    if (!event) return;

    console.log('[SW] 📨 Push recibido');

    // ✅ Parsear datos
    let data = {};
    try {
        data = event.data ? event.data.json() : {};
    } catch (error) {
        console.warn('[SW] Error parseando datos:', error.message);
        data = {};
    }

    // ✅ Valores por defecto
    const title = data.title || '📢 Krusty Burger';
    const body = data.body || 'Actualización de tu pedido';
    const url = data.url || '/';

    // ✅ Opciones de la notificación
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

    // ✅ Ejecutar todo con manejo de errores
    event.waitUntil(
        (async () => {
            try {
                // ✅ 1. Reproducir woo-hoo (si hay clientes)
                await playWooHoo();

                // ✅ 2. Obtener clientes
                const clients = await self.clients.matchAll({
                    type: 'window',
                    includeUncontrolled: true
                });

                // ✅ 3. Enviar mensaje a clientes (si hay)
                if (clients && clients.length > 0) {
                    await sendMessageToAllClients(title, body, url);
                }

                // ✅ 4. SIEMPRE mostrar notificación nativa (es el fallback principal)
                return self.registration.showNotification(title, options);

            } catch (error) {
                // ✅ Error crítico: mostrar notificación de todas formas
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
    // ✅ Si no hay evento, salir
    if (!event) return;

    console.log('[SW] 👆 Click en notificación');

    // ✅ Cerrar la notificación
    event.notification.close();

    // ✅ Obtener URL
    const urlToOpen = event.notification?.data?.url || '/';

    // ✅ Ejecutar con manejo de errores
    event.waitUntil(
        (async () => {
            try {
                // ✅ Buscar clientes existentes
                const clientList = await self.clients.matchAll({
                    type: 'window',
                    includeUncontrolled: true
                });

                // ✅ Intentar enfocar un cliente existente
                for (const client of clientList) {
                    try {
                        if (client.url === urlToOpen && client.focus) {
                            await client.focus();
                            return;
                        }
                    } catch (error) {
                        // ✅ Ignorar error y continuar
                    }
                }

                // ✅ Si no hay cliente, abrir una nueva ventana
                if (self.clients.openWindow) {
                    await self.clients.openWindow(urlToOpen);
                }

            } catch (error) {
                // ✅ Error crítico: intentar abrir la página principal
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
    // ✅ Verificar que el mensaje existe
    if (!event || !event.data) return;

    try {
        console.log('[SW] Mensaje del cliente:', event.data.type || 'desconocido');
    } catch (error) {
        // ✅ Ignorar errores en logs
    }
});

// ============================================================
// 📌 MANEJO DE ERRORES GLOBALES
// ============================================================

self.addEventListener('error', (event) => {
    // ✅ Solo loguear, no romper
});

self.addEventListener('unhandledrejection', (event) => {
    // ✅ Solo loguear, no romper
});

// ============================================================
// 📌 LIMPIEZA DE CACHÉ (OPCIONAL)
// ============================================================

// Mantener solo el caché más reciente
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