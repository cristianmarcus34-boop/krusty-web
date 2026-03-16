/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. COMPRESIÓN: Mejora el TTFB (Time to First Byte) comprimiendo assets en el servidor.
  compress: true,

  logging: {
    fetches: {
      fullUrl: true,
    },
  },

  images: {
    // 2. CACHÉ EFICIENTE: Mantiene las imágenes en caché del navegador por 1 año.
    // Esto liquida la advertencia "Serve static assets with an efficient cache policy".
    minimumCacheTTL: 31536000,

    // 3. CUALIDADES PERMITIDAS: IMPORTANTE para corregir tu error de consola.
    // Next.js por defecto solo permite ciertas cualidades. Agregamos 70 y 75.
    qualities: [25, 50, 70, 75, 80, 90],

    // 4. FORMATOS MODERNOS: Forzamos el uso de AVIF y WebP para reducir el peso hasta un 30% más.
    formats: ['image/avif', 'image/webp'],

    // 5. SEGURIDAD Y OPTIMIZACIÓN DE DOMINIO:
    // Apuntamos directo a tu bucket de Supabase para que el optimizador de Next lo reconozca.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'rrgufgycwhsdnvhpmnzt.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // 6. OPTIMIZACIÓN DE PAQUETES: Evita que librerías pesadas dupliquen código.
  bundlePagesRouterDependencies: true,
  
  // Opcional: Si usas componentes de servidor pesados, esto ayuda a la velocidad de respuesta.
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
};

export default nextConfig;