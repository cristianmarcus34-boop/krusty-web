# Datos y Supabase

## Alcance

Esta guía inventaría las tablas y recursos que el código consulta. **No es una migración ni un esquema oficial**: el repositorio no incluye las migraciones de Supabase, el SQL de creación de tablas ni las políticas RLS. Confirmar nombres, tipos y restricciones contra el proyecto de Supabase antes de cambiar la base.

## Tablas detectadas

| Tabla | Uso observado |
| --- | --- |
| `productos` | Menú y datos editables de los productos. |
| `adicionales` | Extras/toppings, con nombre, precio y descripción. |
| `producto_adicionales` | Relación entre productos y adicionales permitidos. El código consulta `producto_id` y `adicional_id`. |
| `pedidos` | Pedidos, seguimiento y estados de pago; también la actualiza el webhook de Mercado Pago. |
| `perfiles` | Perfil, rol y datos del cliente usados por cuenta, recompensas y administración. |
| `carritos` | Persistencia de carritos asociada a la aplicación. |
| `recompensas` | Catálogo de beneficios del programa de puntos. |
| `canjes` | Registro de recompensas canjeadas. |
| `push_subscriptions` | Suscripciones Web Push y metadatos del dispositivo. |

## Relaciones y almacenamiento

- `producto_adicionales.producto_id` relaciona un producto con una entrada de `productos`.
- `producto_adicionales.adicional_id` relaciona esa entrada con `adicionales`.
- Las cuentas, pedidos, perfiles, puntos y canjes se vinculan desde las pantallas y endpoints. La definición de claves foráneas debe confirmarse en Supabase; no se asume aquí una restricción que no esté versionada en el repositorio.
- Las imágenes de productos se suben al bucket `krusty_imagenes`, bajo la ruta `productos/`.

## Recomendaciones para mantener consistencia

1. Agregar migraciones SQL versionadas para las tablas, índices, claves foráneas, funciones y políticas RLS.
2. Definir restricciones únicas para las relaciones que no deberían duplicarse, especialmente el par producto/adicional.
3. Revisar RLS para que cada usuario acceda solo a sus datos y que las operaciones administrativas dependan del rol, no únicamente de la interfaz.
4. Documentar estados permitidos de pedido y pago, así como qué componente los modifica.
5. Preparar datos de prueba separados de la base productiva.

## Seguridad de claves

El cliente web usa la clave anónima de Supabase. Las operaciones privilegiadas deben mantenerse en el servidor y las tablas accesibles desde el navegador deben quedar protegidas por RLS. No subir la service role key ni copias de datos de clientes.
