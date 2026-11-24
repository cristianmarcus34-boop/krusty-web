# Arquitectura

## Panorama

La aplicación está construida con Next.js App Router. Las páginas viven en `app/`, los componentes reutilizables en `components/` y las integraciones con servicios externos en `lib/`. La interfaz está en español y comparte proveedores globales desde `app/layout.tsx`.

El navegador usa Supabase para las operaciones de la aplicación que requieren sesión de usuario. Algunos endpoints de Next.js también ejecutan lógica del lado del servidor, por ejemplo para crear preferencias de pago o comunicarse con Google Maps.

## Recorridos principales

### Compra

1. El cliente explora el menú en `/`.
2. Abre un producto en `/producto/[id]`, elige los adicionales disponibles y lo agrega al carrito.
3. Completa entrega o retiro y los datos del pedido en el carrito.
4. Si elige Mercado Pago, la aplicación solicita una preferencia a `POST /api/mercadopago/create-preference`.
5. El webhook de Mercado Pago notifica cambios de pago en `POST /api/mercadopago/webhook`.
6. El cliente consulta el resultado o el estado del pedido desde las rutas de pedido y confirmación.

### Administración

`/admin` valida la sesión y el rol del perfil antes de mostrar las pestañas de pedidos, menú, adicionales y recompensas. La edición de productos y adicionales se refleja en Supabase.

### Direcciones y notificaciones

- `POST /api/delivery` permite geocodificar una dirección y calcular distancia/duración con Google Maps.
- `POST /api/send-push` envía notificaciones web a una suscripción guardada.
- `POST /api/send-push-webhook` envía una notificación a partir de una suscripción recibida en la solicitud.
- El service worker se registra desde el cliente para habilitar Web Push cuando el navegador lo soporta.

## Rutas destacadas

| Ruta | Uso |
| --- | --- |
| `/` | Menú público. |
| `/producto/[id]` | Detalle de producto y selección de adicionales. |
| `/pedidos` y `/pedido/[id]` | Pedidos del cliente y seguimiento. |
| `/perfil` | Datos y actividad de la cuenta. |
| `/recompensas` y `/canjear` | Programa de recompensas y canjes. |
| `/admin` | Administración de pedidos, menú, adicionales y recompensas. |
| `/api/mercadopago/create-preference` | Creación de preferencias de pago. |
| `/api/mercadopago/webhook` | Notificaciones de pagos de Mercado Pago. |
| `/api/delivery` | Geocodificación y cálculo de distancias. |

El endpoint `GET /api/burgers` hoy devuelve dos productos de ejemplo definidos en el propio código; no es la fuente de datos del menú principal.

## Carpetas relevantes

- `app/`: páginas, layouts y route handlers.
- `components/`: menú, carrito, formularios, panel de administración y elementos compartidos.
- `lib/`: clientes y funciones de Supabase, Mercado Pago, mapas y notificaciones.
- `store/`: estado compartido del cliente, incluido el carrito.
- `types/`: contratos de TypeScript.
- `public/`: recursos estáticos y archivos necesarios para la experiencia web.

## Servicios externos

- **Supabase:** autenticación, base de datos y bucket de imágenes.
- **Mercado Pago:** checkout y actualización del estado de pago.
- **Google Maps Platform:** mapa, geocodificación y distancia.
- **Web Push:** suscripciones y notificaciones del navegador.
- **Vercel:** despliegue, analítica y métricas de rendimiento.

## Límites conocidos

- El esquema de base de datos y las políticas RLS no están versionados junto al código. Ver [Base de datos](./base-de-datos.md).
- El módulo de Mercado Pago fuerza credenciales de producción; no usarlo para pruebas locales con pagos reales.
- Los permisos del panel deben estar protegidos tanto en la interfaz como mediante políticas de base de datos. Ocultar una pestaña no reemplaza una política RLS.
