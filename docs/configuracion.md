# Configuración local

## Requisitos

- Node.js 20.9 o posterior y npm.
- Acceso a Supabase, Mercado Pago y Google Maps Platform.
- Para Web Push: un par de claves VAPID.

Instalar dependencias y arrancar la aplicación:


npm install
npm run dev


Crear `.env.local` en la raíz del proyecto. El archivo está ignorado por Git; mantenerlo así y no copiar sus valores a tickets, capturas o documentación.

## Variables de entorno

Los nombres siguientes se obtuvieron de las referencias del código. El entorno de cada instalación puede necesitar solo algunas funciones, pero las variables obligatorias para una funcionalidad deben estar configuradas antes de probarla.

| Variable | Dónde se usa | Alcance |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Cliente de Supabase | Pública; URL del proyecto. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente de Supabase | Pública; requiere políticas RLS correctas. |
| `SUPABASE_SERVICE_ROLE_KEY` | Webhook de Mercado Pago | **Secreta; solo servidor.** Nunca usar el prefijo `NEXT_PUBLIC_`. |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Mapa en el navegador; también es fallback del endpoint de delivery | Pública; restringir por dominio y APIs habilitadas. |
| `GOOGLE_MAPS_API_KEY` | Endpoint de delivery | Servidor; preferible para las llamadas del backend. |
| `MP_ACCESS_TOKEN_PROD` | Creación de preferencias de Mercado Pago | **Secreta; solo servidor.** |
| `NEXT_PUBLIC_MP_PUBLIC_KEY_PROD` | Configuración pública de Mercado Pago | Pública. |
| `MP_ACCESS_TOKEN` | Consulta de pagos desde el webhook | **Secreta; solo servidor.** Confirmar que corresponde a la misma cuenta y entorno que `MP_ACCESS_TOKEN_PROD`. |
| `NEXT_PUBLIC_BASE_URL` | URLs de retorno y notificación de pagos | URL pública de la aplicación, por ejemplo `http://localhost:3000` en desarrollo. |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Suscripción del navegador a Web Push | Pública. |
| `VAPID_PRIVATE_KEY` | Envío de notificaciones Web Push | **Secreta; solo servidor.** |

No se incluyen valores de ejemplo porque las claves dependen de cada proveedor. En local, cargar los valores desde los paneles oficiales; en Vercel, configurar las variables para cada entorno.

## Importante: Mercado Pago

`lib/mercadopago-config.ts` fuerza el modo de producción: devuelve credenciales `*_PROD` incluso con `NODE_ENV=development`. Antes de probar un checkout, cambiar esa configuración para separar sandbox y producción. De lo contrario, una prueba local podría operar con credenciales reales.

Además, el endpoint de creación usa `MP_ACCESS_TOKEN_PROD`, mientras que el webhook usa `MP_ACCESS_TOKEN`. Revisar ambos nombres y mantenerlos alineados con el entorno que corresponda.

## Claves públicas y privadas

En Next.js, las variables que empiezan con `NEXT_PUBLIC_` pueden llegar al bundle del navegador. Usar ese prefijo solo para claves diseñadas para ser públicas. No publicar tokens de Mercado Pago, la service role key de Supabase ni la clave privada VAPID.

La clave anónima de Supabase tampoco reemplaza las políticas RLS: las tablas y operaciones expuestas al cliente deben limitarse desde la base de datos.

## Comprobaciones


npm run lint
npx tsc --noEmit


El comando `npm run build` incluye `date +%s`, que no es portable al shell nativo de Windows. Para una compilación local en Windows se puede ejecutar `npx next build`; esa alternativa no genera la marca de versión que agrega el script del proyecto.
