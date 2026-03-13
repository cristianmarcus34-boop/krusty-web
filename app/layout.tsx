"use client";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import StatusBar from '@/components/StatusBar';
import Link from 'next/link'; // Importamos Link para la navegación

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className={`${inter.className} bg-stone-50 text-stone-900 antialiased selection:bg-[#FFCA28] selection:text-black`}>

        {/* Navbar fijo (Acordate de borrar el botón de Staff del componente Navbar.tsx) */}
        <Navbar />

        {/* Contenedor principal */}
        <main className="min-h-[calc(100vh-64px)] pb-32">
          {children}
        </main>

        {/* Footer con Estilo de Gran Cadena */}
        <footer className="bg-[#1A1A1A] text-stone-400 py-16 px-6 border-t-[8px] border-black relative overflow-hidden">
          {/* Decoración de fondo */}
          <div className="absolute inset-0 opacity-5 pointer-events-none"
            style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)', backgroundSize: '10px 10px' }}>
          </div>

          <div className="max-w-5xl mx-auto relative z-10 text-center">

            {/* Logo y Badge */}
            <div className="mb-8">
              <div className="inline-block bg-[#FFCA28] text-black px-4 py-1 rounded-full font-black italic text-[10px] mb-4 border-2 border-black shadow-[3px_3px_0px_0px_black]">
                CALIDAD SPRINGFIELD
              </div>
              <h2 className="text-[#FFCA28] font-black italic text-4xl mb-2 tracking-tighter drop-shadow-[2px_2px_0px_black]">
                KRUSTY BURGER INC.
              </h2>
            </div>

            {/* Links de Navegación Legal/Info */}
            <nav className="flex flex-wrap justify-center gap-x-8 gap-y-4 mb-10 text-[11px] font-black uppercase tracking-tighter">
              <Link href="/" className="hover:text-white transition-colors">Inicio</Link>
              <Link href="/privacidad" className="hover:text-white transition-colors">Política de Privacidad</Link>
              <Link href="/terminos" className="hover:text-white transition-colors">Términos y Condiciones</Link>
              <Link href="/defensa" className="hover:text-white transition-colors underline decoration-[#D32F2F] underline-offset-4">Defensa del Consumidor</Link>
            </nav>

            {/* Separador visual de colores McDonald's */}
            <div className="flex justify-center gap-2 mb-8">
              <div className="h-1.5 w-8 bg-[#D32F2F]"></div>
              <div className="h-1.5 w-8 bg-[#FFCA28]"></div>
              <div className="h-1.5 w-8 bg-[#D32F2F]"></div>
            </div>

            {/* Info de Empresa */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                © 2026 Springfield Food Group / Agencia Powa.
              </p>
              <p className="text-[10px] text-stone-600 max-w-xs mx-auto italic">
                Arcos de Springfield S.A. - CUIT: 30-12345678-9. <br />
                Desarrollado con humor por Agencia Powa.
              </p>
            </div>

            <p className="text-xs mt-8 text-[#D32F2F] font-black uppercase italic">
              "Si no se atraganta, no es una Krusty"
            </p>

            {/* BOTÓN DE ACCESO STAFF */}
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

        {/* BARRA DE ESTADO FLOTANTE */}
        <StatusBar />

        {/* Decoración visual de fondo */}
        <div className="fixed bottom-0 right-0 w-[40vw] h-[40vw] bg-[#FFCA28]/10 -z-10 rounded-full blur-[100px] pointer-events-none" />
        <div className="fixed top-20 left-0 w-[30vw] h-[30vw] bg-[#D32F2F]/5 -z-10 rounded-full blur-[80px] pointer-events-none" />

      </body>
    </html>
  );
}