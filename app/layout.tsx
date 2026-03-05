import type { Metadata } from "next";
import { Inter } from "next/font/google"; 
import "./globals.css";
import Navbar from "@/components/Navbar";
import StatusBar from '@/components/StatusBar'; 

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Krusty Burger | El sabor de Springfield",
  description: "Pedí las mejores hamburguesas nativas desde nuestra app oficial.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className={`${inter.className} bg-stone-50 text-stone-900 antialiased selection:bg-[#FFCA28] selection:text-black`}>
        
        {/* Navbar fijo */}
        <Navbar />

        {/* Contenedor principal con padding inferior extra para que la StatusBar no tape el contenido */}
        <main className="min-h-[calc(100vh-64px)] pb-32">
          {children}
        </main>

        {/* Footer con Estética Mejorada */}
        <footer className="bg-[#1A1A1A] text-stone-400 py-12 px-6 text-center border-t-[8px] border-black relative overflow-hidden">
          {/* Decoración de fondo del footer (Rayas diagonales sutiles) */}
          <div className="absolute inset-0 opacity-5 pointer-events-none" 
               style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)', backgroundSize: '10px 10px' }}>
          </div>

          <div className="max-w-4xl mx-auto relative z-10">
            <div className="inline-block bg-[#FFCA28] text-black px-4 py-1 rounded-full font-black italic text-xs mb-4 border-2 border-black shadow-[4px_4px_0px_0px_black]">
              EST. 1989
            </div>
            
            <h2 className="text-[#FFCA28] font-black italic text-3xl mb-2 tracking-tighter drop-shadow-[2px_2px_0px_black]">
              KRUSTY BURGER INC.
            </h2>
            
            <div className="flex justify-center gap-4 my-6">
               <div className="h-1 w-12 bg-[#D32F2F] rounded-full"></div>
               <div className="h-1 w-12 bg-[#FFCA28] rounded-full"></div>
               <div className="h-1 w-12 bg-[#D32F2F] rounded-full"></div>
            </div>

            <p className="text-sm font-bold uppercase tracking-widest text-stone-500">
              © 2026 Springfield Food Group.
            </p>
            
            <p className="text-[11px] mt-6 text-[#D32F2F] font-black uppercase italic animate-pulse">
              "Si no se atraganta, no es una Krusty"
            </p>
          </div>
        </footer>

        {/* BARRA DE ESTADO FLOTANTE (CLIENTE) */}
        {/* La colocamos aquí para que persista en todas las páginas */}
        <StatusBar />

        {/* Decoración visual de fondo (Glows de marca) */}
        <div className="fixed bottom-0 right-0 w-[40vw] h-[40vw] bg-[#FFCA28]/10 -z-10 rounded-full blur-[100px] pointer-events-none" />
        <div className="fixed top-20 left-0 w-[30vw] h-[30vw] bg-[#D32F2F]/5 -z-10 rounded-full blur-[80px] pointer-events-none" />
      
      </body>
    </html>
  );
}