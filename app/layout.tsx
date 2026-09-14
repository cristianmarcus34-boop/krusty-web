// app/layout.tsx
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from './context/ThemeContext';
import LoaderProvider from './providers/LoaderProvider';
import PushNotificationProvider from '@/components/PushNotificationProvider';
import VersionUpdater from '@/components/VersionUpdater';
import ThemeToggle from '../components/ThemeToggle';
import GestorDeActualizaciones from '../components/GestorDeActualizaciones';
import Navbar from '../components/Navbar';
import StatusBar from '../components/StatusBar';
import ActiveOrderFloating from '@/components/ActiveOrderFloating';
import Footer from '../components/Footer';
import AppInitializer from '../components/AppInitializer';
import { Toaster } from 'react-hot-toast';
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

// ✅ Metadata y viewport ahora funcionan porque es Server Component
export { metadata, viewport } from './metadata';

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  preload: false,
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="scroll-smooth" data-scroll-behavior="smooth">
      <head>
        <link
          rel="preload"
          href="/fonts/Simpsonfont.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`${inter.className} bg-stone-50 text-stone-900 antialiased selection:bg-[#FFCA28] selection:text-black`}>

        <ThemeProvider>
          <LoaderProvider>

            <PushNotificationProvider>

              {/* ✅ Toda la lógica de cliente aislada acá */}
              <AppInitializer />

              <VersionUpdater />
              <ThemeToggle />
              <GestorDeActualizaciones />
              <Navbar />
              <ActiveOrderFloating />

              <main className="min-h-[calc(100vh-64px)] bg-white relative z-10">
                {children}
              </main>

              <Footer />

              <StatusBar />

              <div className="fixed bottom-0 right-0 w-[40vw] h-[40vw] bg-[#FFCA28]/5 -z-10 rounded-full blur-[80px] pointer-events-none" />
              <div className="fixed top-20 left-0 w-[30vw] h-[30vw] bg-[#D32F2F]/5 -z-10 rounded-full blur-[60px] pointer-events-none" />

              <Toaster
                position="top-center"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#1a1a1a',
                    color: '#fff',
                    border: '2px solid #FAD02C',
                    borderRadius: '12px',
                    padding: '16px',
                    fontFamily: 'inherit',
                    maxWidth: '400px',
                  },
                  success: {
                    style: { borderColor: '#22c55e' },
                    icon: '✅',
                  },
                  error: {
                    style: { borderColor: '#ef4444' },
                    icon: '❌',
                  },
                }}
              />

              <Analytics debug={false} />
              <SpeedInsights debug={false} />

            </PushNotificationProvider>

          </LoaderProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}