"use client";

import Link from 'next/link';

export default function PedidoPendientePage() {
    return (
        <main className="min-h-screen bg-stone-950 text-white flex flex-col items-center justify-center p-4">
            <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 text-center relative overflow-hidden">
                <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto text-4xl animate-pulse">
                    ⏳
                </div>

                <div className="space-y-2">
                    <span className="text-xs font-black tracking-widest text-amber-400 uppercase bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                        Pago Pendiente
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-black text-amber-400 uppercase tracking-tight pt-2">
                        Acreditación en Proceso
                    </h1>
                    <p className="text-stone-400 text-sm font-medium leading-relaxed">
                        Mercado Pago está procesando la transacción. Te informaremos apenas se confirme.
                    </p>
                </div>

                <div className="bg-amber-950/20 border border-amber-900/40 p-4 rounded-2xl text-xs text-amber-200/90 font-medium text-left leading-relaxed">
                    Si elegiste abonar en efectivo (Rapipago / Pago Fácil), la confirmación puede tardar unos minutos en reflejarse.
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