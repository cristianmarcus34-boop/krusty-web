"use client";

import Link from 'next/link';

export default function PedidoPendientePage() {
    return (
        <main className="min-h-screen bg-stone-900 text-white flex flex-col items-center justify-center p-4 text-center">
            <div className="bg-stone-800 border border-stone-700 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
                <div className="text-6xl animate-pulse">⏳</div>

                <div className="space-y-2">
                    <h1 className="text-2xl sm:text-3xl font-black text-amber-400 uppercase tracking-tight">
                        Pago en Proceso
                    </h1>
                    <p className="text-stone-300 text-sm font-medium">
                        Mercado Pago está acreditando tu pago. Te avisaremos en cuanto esté confirmada la operación.
                    </p>
                </div>

                <div className="bg-amber-950/30 border border-amber-800/50 p-4 rounded-2xl text-xs text-amber-200 font-medium">
                    Si pagaste por un medio presencial (Rapipago/Pago Fácil), la acreditación puede demorar unos minutos.
                </div>

                <div className="space-y-3 pt-2">
                    <Link
                        href="/"
                        className="block w-full py-3.5 rounded-2xl bg-amber-400 text-stone-950 font-black uppercase text-xs tracking-wider hover:bg-amber-300 transition-all active:scale-95"
                    >
                        🍔 Volver al Menú
                    </Link>
                </div>
            </div>
        </main>
    );
}