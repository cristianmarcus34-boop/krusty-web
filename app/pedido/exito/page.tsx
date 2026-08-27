"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function PedidoExitoPage() {
    const [pedidoInfo, setPedidoInfo] = useState<{ id?: string } | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem('ultimo_pedido_krusty');
        if (saved) {
            try {
                setPedidoInfo(JSON.parse(saved));
            } catch (e) {
                console.error(e);
            }
        }
    }, []);

    return (
        <main className="min-h-screen bg-stone-900 text-white flex flex-col items-center justify-center p-4 text-center">
            <div className="bg-stone-800 border border-stone-700 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
                <div className="text-6xl animate-bounce">🎉</div>

                <div className="space-y-2">
                    <h1 className="text-2xl sm:text-3xl font-black text-[#FAD02C] uppercase tracking-tight">
                        ¡Pago Aprobado!
                    </h1>
                    <p className="text-stone-300 text-sm font-medium">
                        ¡Krusty ya está preparando tu pedido! Tu pago se procesó correctamente.
                    </p>
                </div>

                {pedidoInfo?.id && (
                    <div className="bg-stone-900/60 p-3.5 rounded-2xl border border-stone-700 text-xs font-mono text-stone-400">
                        ID de Pedido: <span className="text-white font-bold">{pedidoInfo.id}</span>
                    </div>
                )}

                <div className="space-y-3 pt-2">
                    {pedidoInfo?.id && (
                        <Link
                            href={`/pedido/${pedidoInfo.id}`}
                            className="block w-full py-3.5 rounded-2xl bg-[#FAD02C] text-stone-950 font-black uppercase text-xs tracking-wider hover:bg-yellow-400 transition-all active:scale-95"
                        >
                            📍 Ver Estado del Pedido
                        </Link>
                    )}

                    <Link
                        href="/"
                        className="block w-full py-3 rounded-2xl bg-stone-700 text-stone-300 font-bold uppercase text-xs tracking-wider hover:bg-stone-600 transition-all"
                    >
                        🍔 Volver al Inicio
                    </Link>
                </div>
            </div>
        </main>
    );
}