/** @type {import('next').NextConfig} */
const nextConfig = {
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  images: {
    // 1. CACHÉ EFICIENTE: Esto elimina la advertencia de Lighthouse sobre 
    // "servir recursos estáticos con una política de caché eficiente".
    // Mantiene las imágenes en el navegador por 1 año, evitando recargas innecesarias.
    minimumCacheTTL: 31536000, 

    // 2. SEGURIDAD: Reemplazamos el '**' por el dominio específico de Supabase.
    // Lighthouse y Next.js penalizan el uso de comodines totales por seguridad.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'rrgufgycwhsdnvhpmnzt.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // 3. COMPRESIÓN: Forzamos la compresión de texto para mejorar el Time to First Byte (TTFB)
  compress: true,
};

export default nextConfig;