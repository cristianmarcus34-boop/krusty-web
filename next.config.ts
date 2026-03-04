import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  logging: {
    fetches: {
      fullUrl: true, // Esto te ayudará a ver en la consola si los datos vienen de la DB
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Permite imágenes de cualquier URL (útil para pruebas)
      },
    ],
  },
};

export default nextConfig;