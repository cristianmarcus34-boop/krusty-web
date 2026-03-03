import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Fuente moderna y legible
import "./globals.css";
import Navbar from "@/components/Navbar";

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
      <body className={`${inter.className} bg-stone-50 text-stone-900 antialiased`}>
        {/* El Navbar queda fijo arriba gracias a su clase 'sticky' interna */}
        <Navbar />

        {/* Contenedor principal con padding para que el contenido no pegue al Navbar */}
        <main className="min-h-[calc(100vh-64px)] pb-20">
          {children}
        </main>

        {/* Footer estilo Fast Food */}
        <footer className="bg-stone-900 text-stone-400 py-10 px-6 text-center border-t-4 border-yellow-400">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-yellow-400 font-black italic text-xl mb-2">KRUSTY BURGER INC.</h2>
            <p className="text-sm">© 2026 Springfield Food Group. Todos los derechos reservados.</p>
            <p className="text-xs mt-4 opacity-50 italic">
              "Si no se atraganta, no es una Krusty"
            </p>
          </div>
        </footer>

        {/* Decoración visual lateral (opcional para estilo branding) */}
        <div className="fixed bottom-0 right-0 w-32 h-32 bg-yellow-400/10 -z-10 rounded-full blur-3xl" />
        <div className="fixed top-20 left-0 w-24 h-24 bg-red-600/5 -z-10 rounded-full blur-2xl" />
      </body>
    </html>
  );
}