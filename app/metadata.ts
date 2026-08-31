// app/metadata.ts
import { Metadata, Viewport } from 'next';

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