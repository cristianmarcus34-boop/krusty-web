import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Krusty Burger Oficial | Quilmes',
    short_name: 'Krusty Burger',
    description: '¡Si no se atraganta, no es una Krusty! Pedí las mejores hamburguesas de Villa La Florida desde tu celular.',
    start_url: '/',
    display: 'standalone',
    background_color: '#1A1A1A',
    theme_color: '#FFCA28',
    orientation: 'portrait',
    scope: '/',
    lang: 'es-AR',
    categories: ['food', 'shopping'],
    icons: [
      {
        src: '/android-icon-36x36.png',
        sizes: '36x36',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/android-icon-48x48.png',
        sizes: '48x48',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/android-icon-72x72.png',
        sizes: '72x72',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/android-icon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/android-icon-144x144.png',
        sizes: '144x144',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/android-icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/android-icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Abrir Carrito',
        url: '/#carrito',
        description: 'Ver tus hamburguesas seleccionadas',
      },
      {
        name: 'Política de Privacidad',
        url: '/privacidad',
        description: 'Cómo cuidamos tus datos',
      },
      {
        name: 'Términos y Condiciones',
        url: '/terminos',
        description: 'Reglas de la casa',
      },
      {
        name: 'Defensa del Consumidor',
        url: '/defensa',
        description: 'Ayuda y botón de arrepentimiento',
      },
    ],
  }
}