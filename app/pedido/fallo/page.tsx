"use client";

import Link from 'next/link';

export default function PedidoFalloPage() {
    return (
        <main className="min-h-screen bg-stone-950 text-white flex flex-col items-center justify-center p-4">
            <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 text-center relative overflow-hidden">
                <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto text-4xl">
                    🤡❌
                </div>

                <div className="space-y-2">
                    <span className="text-xs font-black tracking-widest text-red-400 uppercase bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                        Pago Rechazado
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-black text-red-500 uppercase tracking-tight pt-2">
                        No pudimos procesar el pago
                    </h1>
                    <p className="text-stone-400 text-sm font-medium leading-relaxed">
                        La transacción fue denegada o cancelada. No se realizó ningún cargo en tu cuenta.
                    </p>
                </div>

                <div className="bg-red-950/20 border border-red-900/40 p-4 rounded-2xl text-xs text-red-300 font-medium text-left leading-relaxed">
                    • Verificá el saldo o límite de tu tarjeta.<br />
                    • Intentá con otro medio de pago (débito, crédito o transferencia).
                </div>

                <div className="space-y-3 pt-2">
                    <Link
                        href="/"
                        className="block w-full py-3.5 rounded-2xl bg-red-600 text-white font-black uppercase text-xs tracking-wider hover:bg-red-500 transition-all active:scale-95 shadow-lg shadow-red-600/20"
                    >
                        🔄 Reintentar Pedido
                    </Link>
                </div>
            </div>
        </main>
    );
}