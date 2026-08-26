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
    minimumCacheTTL: 31536000,

    // 3. CUALIDADES PERMITIDAS
    qualities: [25, 50, 70, 75, 80, 90],

    // 4. FORMATOS MODERNOS
    formats: ['image/avif', 'image/webp'],

    // 5. SEGURIDAD Y OPTIMIZACIÓN DE DOMINIO - ACTUALIZADO
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'nurhcmttnwankriplcwv.supabase.co', // ✅ NUEVO DOMINIO
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      // También puedes agregar otros dominios si los necesitas
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],

    // 6. Configuración de deviceSizes para mejor rendimiento
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // 7. OPTIMIZACIÓN DE PAQUETES
  bundlePagesRouterDependencies: true,

  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
};

export default nextConfig;