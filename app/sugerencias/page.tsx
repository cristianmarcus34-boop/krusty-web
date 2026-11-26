// app/sugerencias/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import SuggestionForm from '@/components/SuggestionForm';

export const metadata: Metadata = {
    title: 'Sugerencias y reportes | Krusty Burger',
    description: '¿Algo no funciona? ¿Tenés una idea para mejorar? Contanos y lo revisamos.',
    alternates: {
        canonical: 'https://krustyburger.com.ar/sugerencias',
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default function SugerenciasPage() {
    return (
        <main className="min-h-dvh bg-[#fafafa] pb-32">
            {/* HERO */}
            <header className="bg-white border-b-4 border-black py-10 px-6">
                <div className="max-w-2xl mx-auto text-center">
                    <div className="inline-block bg-[#FFCA28] text-black text-[10px] font-black uppercase px-4 py-1.5 rounded-full border-2 border-black shadow-[3px_3px_0px_0px_black] mb-4">
                        💬 Tu opinión nos importa
                    </div>
                    <h1 className="font-krusty text-4xl sm:text-5xl text-black uppercase leading-none mb-3">
                        ¿Algo no <span className="text-[#D32F2F]">funciona</span>?
                    </h1>
                    <p className="text-sm sm:text-base font-bold text-stone-600 max-w-lg mx-auto leading-relaxed">
                        ¿Encontraste un bug? ¿Tenés una idea para mejorar el sitio?
                        Contanos y lo revisamos. Los Krusty Burgers se construyen entre todos.
                    </p>
                </div>
            </header>

            {/* FORMULARIO */}
            <section className="max-w-2xl mx-auto px-6 mt-8">
                <SuggestionForm />
            </section>

            {/* INFO EXTRA */}
            <section className="max-w-2xl mx-auto px-6 mt-10">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-white border-2 border-black rounded-2xl p-4 text-center">
                        <div className="text-3xl mb-2">⏱️</div>
                        <p className="text-xs font-black uppercase text-stone-700">Respuesta</p>
                        <p className="text-[11px] text-stone-500 mt-1">Lo revisamos en 48-72hs</p>
                    </div>
                    <div className="bg-white border-2 border-black rounded-2xl p-4 text-center">
                        <div className="text-3xl mb-2">🔒</div>
                        <p className="text-xs font-black uppercase text-stone-700">Privacidad</p>
                        <p className="text-[11px] text-stone-500 mt-1">Tus datos están seguros</p>
                    </div>
                    <div className="bg-white border-2 border-black rounded-2xl p-4 text-center">
                        <div className="text-3xl mb-2">🍔</div>
                        <p className="text-xs font-black uppercase text-stone-700">Gracias</p>
                        <p className="text-[11px] text-stone-500 mt-1">Cada sugerencia suma</p>
                    </div>
                </div>

                <div className="text-center mt-8">
                    <Link
                        href="/"
                        className="inline-block px-6 py-3 bg-white border-2 border-black rounded-xl font-black uppercase text-sm shadow-[4px_4px_0px_0px_black] hover:translate-x-px hover:translate-y-px hover:shadow-none transition-all"
                    >
                        ← Volver al menú
                    </Link>
                </div>
            </section>
        </main>
    );
}