"use client";

import Link from 'next/link';

export default function PedidoFalloPage() {
    return (
        <main className="min-h-screen bg-stone-900 text-white flex flex-col items-center justify-center p-4 text-center">
            <div className="bg-stone-800 border border-stone-700 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
                <div className="text-6xl">🤡❌</div>

                <div className="space-y-2">
                    <h1 className="text-2xl sm:text-3xl font-black text-[#D32F2F] uppercase tracking-tight">
                        Pago No Completado
                    </h1>
                    <p className="text-stone-300 text-sm font-medium">
                        Hubo un problema con la transacción o el pago fue rechazado por el banco.
                    </p>
                </div>

                <div className="bg-red-950/40 border border-red-800/60 p-4 rounded-2xl text-xs text-red-300 font-medium">
                    No te preocupes, no se realizó ningún cargo en tu cuenta. Podés reintentar el pago o elegir otro medio como efectivo o transferencia.
                </div>

                <div className="space-y-3 pt-2">
                    <Link
                        href="/"
                        className="block w-full py-3.5 rounded-2xl bg-[#D32F2F] text-white font-black uppercase text-xs tracking-wider hover:bg-red-700 transition-all active:scale-95"
                    >
                        🔄 Intentar de Nuevo
                    </Link>
                </div>
            </div>
        </main>
    );
}