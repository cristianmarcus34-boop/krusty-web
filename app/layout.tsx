import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import StatusBar from '@/components/StatusBar';
import Link from 'next/link';
import Image from 'next/image';
import { Metadata, Viewport } from 'next';
import GestorDeActualizaciones from '@/components/GestorDeActualizaciones';

// 1. Optimizamos Inter con swap para evitar el "Flash of Unstyled Text"
const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap', 
});

export const viewport: Viewport = {
  themeColor: "#FFCA28",
};

export const metadata: Metadata = {
  title: "Krusty Burger ® | Las mejores hamburguesas de Quilmes",
  description: "¡Si no se atraganta, no es una Krusty! Vení a probar la verdadera experiencia de Springfield en Villa La Florida, Quilmes.",
  keywords: ["Hamburguesas Quilmes", "Krusty Burger", "Villa La Florida", "Delivery Quilmes", "Bernal"],
  authors: [{ name: "Krusty Burger Oficial" }],
  metadataBase: new URL('https://krustyburger.com.ar'),
  openGraph: {
    title: "Krusty Burger ® | Springfield en Quilmes",
    description: "Las mejores hamburguesas de Villa La Florida. ¡Si no se atraganta, no es una Krusty!",
    url: 'https://krustyburger.com.ar',
    siteName: 'Krusty Burger Oficial',
    images: [
      {
        url: '/images/Krustyburgerheader.webp',
        width: 1200,
        height: 630,
        alt: 'Krusty Burger Quilmes Header',
      },
    ],
    locale: 'es_AR',
    type: 'website',
  },
  verification: {
    google: "BhY0Fwmdey1BKMH-f-PoWy_1hQhV1SRxziMpF7V71q4",
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon-180x180.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="scroll-smooth">
      <head>
        {/* 2. SOLUCIÓN LCP: Preload de la fuente principal */}
        <link
          rel="preload"
          href="/fonts/Simpsonfont.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`${inter.className} bg-stone-50 text-stone-900 antialiased selection:bg-[#FFCA28] selection:text-black`}>
        
        <GestorDeActualizaciones />
        <Navbar />

        <main className="min-h-[calc(100vh-64px)] pb-32">
          {children}
        </main>

        <footer className="bg-[#1A1A1A] text-stone-300 py-16 px-6 border-t-[8px] border-black relative overflow-hidden">
          {/* Trama de fondo - Optimizada con opacidad fija */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
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

            {/* Enlace a Reseñas */}
            <div className="mb-10">
              <Link
                href="https://g.page/r/CTEcMZ1GEz0LEBI/review"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/20 px-6 py-3 rounded-xl transition-all active:scale-95 group"
              >
                <span className="text-yellow-400 text-lg group-hover:animate-pulse">⭐⭐⭐⭐⭐</span>
                <span className="text-stone-100 font-black text-xs tracking-widest group-hover:text-[#FFCA28] transition-colors uppercase">
                  Dejanos tu reseña en Google
                </span>
              </Link>
            </div>

            <nav className="flex flex-wrap justify-center gap-x-8 gap-y-4 mb-10 text-[11px] font-black uppercase tracking-tighter">
              <Link href="/" className="hover:text-[#FFCA28] transition-colors">Inicio</Link>
              <Link href="/privacidad" className="hover:text-[#FFCA28] transition-colors">Privacidad</Link>
              <Link href="/terminos" className="hover:text-[#FFCA28] transition-colors">Términos</Link>
              <Link href="/defensa" className="hover:text-white transition-colors underline decoration-[#D32F2F] underline-offset-4">Defensa Consumidor</Link>
            </nav>

            <div className="flex justify-center gap-2 mb-10">
              <div className="h-1.5 w-8 bg-[#D32F2F]/40"></div>
              <div className="h-1.5 w-8 bg-[#FFCA28]/40"></div>
              <div className="h-1.5 w-8 bg-[#D32F2F]/40"></div>
            </div>

            <div className="space-y-8">
              {/* ACCESIBILIDAD: Subimos contraste a stone-400 para fondo oscuro #1A1A1A */}
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                © 2026 Springfield Food Group / Quilmes, Buenos Aires.
              </p>

              <div className="flex flex-col items-center gap-4">
                <Link
                  href="https://agencia-powa.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center gap-2 transition-transform active:scale-95"
                >
                  <div className="relative w-10 h-10 opacity-80 group-hover:opacity-100 transition-opacity duration-500 scale-90 group-hover:scale-110">
                    <Image
                      src="/images/logo-powa.png"
                      alt="Agencia Powa"
                      fill
                      sizes="40px"
                      className="object-contain"
                    />
                  </div>

                  <div className="text-center">
                    <p className="text-[9px] text-stone-400 uppercase tracking-[0.2em] mb-1">
                      Desarrollado con humor por
                    </p>
                    <p className="text-xs font-black italic text-[#FFCA28]">
                      AGENCIA POWA
                    </p>
                  </div>
                </Link>

                {/* ACCESIBILIDAD: El CUIT y dirección ahora son legibles */}
                <p className="text-[10px] text-stone-400 max-w-xs mx-auto italic leading-relaxed">
                  Arcos de Springfield S.A. - CUIT: 30-12345678-9 <br />
                  Villa La Florida, Quilmes (CP 1881).
                </p>
              </div>
            </div>

            <p className="text-[10px] mt-12 text-[#D32F2F] font-black uppercase italic tracking-[0.3em] opacity-80">
              "Si no se atraganta, no es una Krusty"
            </p>

            <div className="mt-12 pt-6 border-t border-stone-800/40">
              <Link
                href="/admin"
                className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-500 hover:text-[#FFCA28] transition-colors duration-300"
              >
                🔐 Acceso Staff
              </Link>
            </div>
          </div>
        </footer>

        <StatusBar />

        {/* Luces de ambiente - Reducido el blur y opacidad para mejorar Performance */}
        <div className="fixed bottom-0 right-0 w-[40vw] h-[40vw] bg-[#FFCA28]/5 -z-10 rounded-full blur-[80px] pointer-events-none" />
        <div className="fixed top-20 left-0 w-[30vw] h-[30vw] bg-[#D32F2F]/5 -z-10 rounded-full blur-[60px] pointer-events-none" />

      </body>
    </html>
  );
}