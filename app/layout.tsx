"use client";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import StatusBar from '@/components/StatusBar';
import Link from 'next/link';

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="scroll-smooth">
      <head>
        {/* --- SEO BÁSICO Y DINÁMICO --- */}
        <title>Krusty Burger ® | Las mejores hamburguesas de Quilmes</title>
        <meta name="description" content="¡Si no se atraganta, no es una Krusty! Vení a probar la verdadera experiencia de Springfield en Villa La Florida, Quilmes. Delivery de hamburguesas y más." />
        <meta name="keywords" content="Hamburguesas Quilmes, Krusty Burger, Villa La Florida, Delivery Quilmes, Comida Rápida San Francisco Solano, Bernal, Hamburgueserías Quilmes" />
        
        {/* --- SEO LOCAL (GEOTAGGING PARA BUSCADORES) --- */}
        <meta name="geo.region" content="AR-B" />
        <meta name="geo.placename" content="Villa La Florida, Quilmes, Buenos Aires" />
        <meta name="geo.position" content="-34.7878;-58.3006" />
        <meta name="ICBM" content="-34.7878, -58.3006" />

        {/* --- DATOS ESTRUCTURADOS (JSON-LD) - EL CEREBRO DEL SEO --- */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FastFoodRestaurant",
              "name": "Krusty Burger Quilmes",
              "image": "https://krustyburger.com.ar/images/Krustyburgerheader.webp", // Asegurate que esta ruta exista
              "url": "https://krustyburger.com.ar",
              "telephone": "+5411XXXXXXXX", // REEMPLAZAR CON TU WHATSAPP REAL
              "priceRange": "$$",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "Villa La Florida",
                "addressLocality": "Quilmes",
                "addressRegion": "B",
                "postalCode": "1884",
                "addressCountry": "AR"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": -34.7878,
                "longitude": -58.3006
              },
              "servesCuisine": "Hamburguesas",
              "areaServed": "Villa La Florida, Quilmes"
            })
          }}
        />

        {/* --- OPEN GRAPH (RRSS & WHATSAPP) --- */}
        <meta property="og:title" content="Krusty Burger ® | Springfield en Quilmes" />
        <meta property="og:description" content="Las mejores hamburguesas de Villa La Florida. ¡Si no se atraganta, no es una Krusty!" />
        <meta property="og:image" content="/images/Krustyburgerheader.webp" />
        <meta property="og:url" content="https://krustyburger.com.ar" />
        <meta property="og:type" content="website" />
        <meta name="theme-color" content="#FFCA28" />

        {/* --- FAVICONS --- */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon-180x180.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>

      <body className={`${inter.className} bg-stone-50 text-stone-900 antialiased selection:bg-[#FFCA28] selection:text-black`}>

        {/* Componentes de Navegación */}
        <Navbar />

        {/* Contenedor principal con padding para que nada quede oculto tras el footer */}
        <main className="min-h-[calc(100vh-64px)] pb-32">
          {children}
        </main>

        {/* Footer Robusto - Estilo Corporativo / Springfield */}
        <footer className="bg-[#1A1A1A] text-stone-400 py-16 px-6 border-t-[8px] border-black relative overflow-hidden">
          {/* Trama de fondo */}
          <div className="absolute inset-0 opacity-5 pointer-events-none"
            style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)', backgroundSize: '10px 10px' }}>
          </div>

          <div className="max-w-5xl mx-auto relative z-10 text-center">

            <div className="mb-8">
              <div className="inline-block bg-[#FFCA28] text-black px-4 py-1 rounded-full font-black italic text-[10px] mb-4 border-2 border-black shadow-[3px_3px_0px_0px_black]">
                CALIDAD SPRINGFIELD - VILLA LA FLORIDA
              </div>
              <h2 className="text-[#FFCA28] font-black italic text-4xl mb-2 tracking-tighter drop-shadow-[2px_2px_0px_black]">
                KRUSTY BURGER INC.
              </h2>
            </div>

            <nav className="flex flex-wrap justify-center gap-x-8 gap-y-4 mb-10 text-[11px] font-black uppercase tracking-tighter">
              <Link href="/" className="hover:text-white transition-colors">Inicio</Link>
              <Link href="/privacidad" className="hover:text-white transition-colors">Política de Privacidad</Link>
              <Link href="/terminos" className="hover:text-white transition-colors">Términos y Condiciones</Link>
              <Link href="/defensa" className="hover:text-white transition-colors underline decoration-[#D32F2F] underline-offset-4">Defensa del Consumidor</Link>
            </nav>

            <div className="flex justify-center gap-2 mb-8">
              <div className="h-1.5 w-8 bg-[#D32F2F]"></div>
              <div className="h-1.5 w-8 bg-[#FFCA28]"></div>
              <div className="h-1.5 w-8 bg-[#D32F2F]"></div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                © 2026 Springfield Food Group / Quilmes, Buenos Aires.
              </p>
              <p className="text-[10px] text-stone-600 max-w-xs mx-auto italic leading-relaxed">
                Arcos de Springfield S.A. - CUIT: 30-12345678-9 <br />
                Villa La Florida, Quilmes (CP 1884). <br />
                Desarrollado con humor por Agencia Powa.
              </p>
            </div>

            <p className="text-xs mt-8 text-[#D32F2F] font-black uppercase italic">
              "Si no se atraganta, no es una Krusty"
            </p>

            <div className="mt-12 pt-6 border-t border-stone-800/30">
              <Link
                href="/admin"
                className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-700 hover:text-[#FFCA28] transition-colors duration-300"
              >
                🔐 Acceso Staff
              </Link>
            </div>
          </div>
        </footer>

        {/* Barra de estado flotante para feedback de usuario */}
        <StatusBar />

        {/* Luces de ambiente de fondo (Gradientes sutiles) */}
        <div className="fixed bottom-0 right-0 w-[40vw] h-[40vw] bg-[#FFCA28]/10 -z-10 rounded-full blur-[100px] pointer-events-none" />
        <div className="fixed top-20 left-0 w-[30vw] h-[30vw] bg-[#D32F2F]/5 -z-10 rounded-full blur-[80px] pointer-events-none" />

      </body>
    </html>
  );
}