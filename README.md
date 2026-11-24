# Krusty Burger Web

Aplicación web de Krusty Burger, una hamburguesería de Quilmes. El proyecto reúne el menú público, la compra y el seguimiento de pedidos, la cuenta del cliente y un panel interno para administrar la operación.

La idea es que pedir sea simple para el cliente y que el equipo pueda mantener el menú y los pedidos sin renegar.

## Qué incluye

- Menú de productos y adicionales, administrado desde Supabase.
- Detalle de producto y carrito de compras.
- Opciones de entrega o retiro, pagos y seguimiento del pedido.
- Cuenta de cliente, puntos y recompensas.
- Panel de administración para pedidos, productos, adicionales y recompensas.
- Integraciones con Mercado Pago, Google Maps y notificaciones push.

## Tecnologías

- Next.js 16 con App Router y React 19.
- TypeScript y Tailwind CSS 4.
- Supabase para autenticación, datos y almacenamiento de imágenes.
- Mercado Pago para el flujo de pagos.
- Google Maps para direcciones y cálculo de distancias.
- Web Push para notificaciones en navegadores compatibles.
- Vercel Analytics y Speed Insights.

## Empezar en local

### Requisitos

- Node.js 20.9 o posterior.
- npm.
- Acceso a los proyectos de Supabase, Mercado Pago y Google Maps que vaya a usar la instalación.

### Instalación

```bash
npm install
```

Crear un archivo `.env.local` en la raíz y completar las variables descritas en [Configuración local](./docs/configuracion.md). No copiar credenciales reales a este README ni subir `.env.local` al repositorio.

Iniciar el servidor:

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Comandos útiles

| Comando | Para qué sirve |
| --- | --- |
| `npm run dev` | Inicia Next.js en modo desarrollo. |
| `npm run lint` | Ejecuta ESLint. |
| `npx tsc --noEmit` | Comprueba los tipos de TypeScript sin generar archivos. |
| `npm run build` | Genera la versión y compila para producción. |
| `npm start` | Inicia la aplicación ya compilada. |

**Nota para Windows:** el script actual de `npm run build` usa `date +%s`, un comando de shell POSIX. Para una compilación local sin generar la marca de versión, se puede usar `npx next build`. En Vercel, el comando habitual corre en Linux. Conviene hacer portable el script para que funcione igual en todos los entornos.

## Estructura principal

```text
app/          Páginas, endpoints, metadata y manifiesto de Next.js
components/   Componentes de interfaz y panel de administración
lib/          Clientes e integraciones con servicios externos
store/        Estado compartido del cliente
types/        Tipos de TypeScript
public/       Imágenes, fuentes, service worker y recursos estáticos
```

## Documentación del proyecto

- [Arquitectura y recorridos](./docs/arquitectura.md)
- [Configuración y variables de entorno](./docs/configuracion.md)
- [Datos y relaciones con Supabase](./docs/base-de-datos.md)
- [Despliegue y verificación](./docs/despliegue.md)

## Antes de probar pagos

La configuración actual de Mercado Pago fuerza el uso de credenciales de producción, incluso en desarrollo. No iniciar un checkout de prueba con credenciales reales: primero hay que separar los entornos de prueba y producción. Los detalles están en [Configuración](./docs/configuracion.md).

## Estado y mejoras recomendadas

La documentación describe lo que se observa en el código; no reemplaza el esquema real de Supabase ni la configuración de los proveedores. Antes de tomar el proyecto como listo para que otro equipo lo mantenga, conviene priorizar:

1. Versionar el esquema de Supabase y sus políticas con migraciones.
2. Separar credenciales de prueba y producción de Mercado Pago.
3. Agregar pruebas automatizadas para pagos, pedidos, autenticación y permisos del panel.
4. Incorporar un `.env.example` sin secretos y hacer portable el comando de build.

## Licencia y uso

Este repositorio es privado (`private: true`). No se define una licencia de uso o redistribución en el proyecto; consultar al responsable antes de reutilizarlo fuera del equipo.
