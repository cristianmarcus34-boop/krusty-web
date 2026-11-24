# Despliegue y operación

## Plataforma

El proyecto está configurado como una aplicación Next.js y tiene `vercel.json`; Vercel es el destino de despliegue previsto. Conectar el repositorio, conservar la detección automática de Next.js y cargar las variables de entorno de [Configuración](./configuracion.md).

## Checklist antes de publicar

- Configurar las variables de producción y verificar que las claves secretas no tengan prefijo `NEXT_PUBLIC_`.
- Definir `NEXT_PUBLIC_BASE_URL` con el dominio HTTPS real.
- Restringir la clave de Google Maps por dominio y habilitar las APIs de mapas, geocodificación y distancia necesarias.
- Configurar en Mercado Pago la URL de notificaciones:
  `https://<dominio>/api/mercadopago/webhook`
- Comprobar que los tokens usados por creación de preferencias y webhook pertenecen a la misma cuenta y entorno.
- Confirmar las políticas RLS, roles de administración y permisos del bucket `krusty_imagenes`.
- Verificar que el dominio y HTTPS permitan instalar el service worker y registrar notificaciones push.

## Build y ejecución

El script `npm run build` genera `public/version.txt` con `date +%s` y después ejecuta `next build`. Funciona en el entorno Linux habitual de Vercel, pero el comando `date +%s` no es portable al shell nativo de Windows. Para evitar diferencias entre desarrollo y CI, conviene reemplazarlo por un paso Node.js multiplataforma.

En Vercel, revisar que la compilación termine correctamente y que las variables estén disponibles durante build y runtime según corresponda. Para iniciar una build local ya compilada:


npm start


## Verificación posterior al despliegue

Hacer un recorrido corto con datos de prueba:

1. Abrir el menú y el detalle de un producto.
2. Agregar al carrito, probar entrega y retiro, y revisar totales.
3. Probar pago en el entorno de prueba antes de habilitar credenciales productivas.
4. Confirmar la recepción del webhook y los estados finales del pedido.
5. Probar inicio de sesión, acceso administrativo y permisos de cada rol.
6. Revisar mapas, imágenes y notificaciones en un navegador móvil y de escritorio.
7. Consultar logs de Vercel y Supabase ante cualquier error; no registrar tokens ni datos sensibles.

## Recuperación y cambios de base

Antes de cambios en producción, contar con un respaldo reciente de Supabase y un plan de reversión. Cuando se incorporen migraciones, aplicarlas primero en un entorno de prueba y dejar registrado qué versión llegó a producción.
