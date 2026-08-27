"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface PedidoCache {
    id?: string;
    cliente?: string;
    total?: number;
}

export default function PedidoExitoPage() {
    const [pedido, setPedido] = useState<PedidoCache | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem('ultimo_pedido_krusty');
        if (saved) {
            try {
                setPedido(JSON.parse(saved));
            } catch (e) {
                console.error('Error leyendo caché de pedido:', e);
            }
        }
    }, []);

    return (
        <main className="min-h-screen bg-stone-950 text-white flex flex-col items-center justify-center p-4">
            <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 text-center relative overflow-hidden">
                {/* Glow decorativo */}
                <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-4xl animate-bounce">
                    🎉
                </div>

                <div className="space-y-2">
                    <span className="text-xs font-black tracking-widest text-emerald-400 uppercase bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                        ¡Pago Aprobado!
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-black text-[#FAD02C] uppercase tracking-tight pt-2">
                        ¡Marchando tu pedido!
                    </h1>
                    <p className="text-stone-400 text-sm font-medium leading-relaxed">
                        Tu pago fue procesado correctamente y la cocina ya tiene la comanda lista.
                    </p>
                </div>

                {pedido && (
                    <div className="bg-stone-950/80 p-4 rounded-2xl border border-stone-800 text-left space-y-2 text-xs font-mono">
                        {pedido.id && (
                            <div className="flex justify-between border-b border-stone-800/80 pb-2">
                                <span className="text-stone-500">ID Pedido:</span>
                                <span className="text-stone-200 font-bold">{pedido.id}</span>
                            </div>
                        )}
                        {pedido.cliente && (
                            <div className="flex justify-between border-b border-stone-800/80 pb-2">
                                <span className="text-stone-500">Cliente:</span>
                                <span className="text-stone-200 font-bold">{pedido.cliente}</span>
                            </div>
                        )}
                        {pedido.total && (
                            <div className="flex justify-between pt-1">
                                <span className="text-stone-500">Total Abonado:</span>
                                <span className="text-[#FAD02C] font-bold">${pedido.total.toLocaleString('es-AR')}</span>
                            </div>
                        )}
                    </div>
                )}

                <div className="space-y-3 pt-2">
                    {pedido?.id && (
                        <Link
                            href={`/pedido/${pedido.id}`}
                            className="block w-full py-3.5 rounded-2xl bg-[#FAD02C] text-stone-950 font-black uppercase text-xs tracking-wider hover:bg-yellow-400 transition-all active:scale-95 shadow-lg shadow-amber-500/10"
                        >
                            📍 Seguir Estado del Pedido
                        </Link>
                    )}

                    <Link
                        href="/"
                        className="block w-full py-3 rounded-2xl bg-stone-800 text-stone-300 font-bold uppercase text-xs tracking-wider hover:bg-stone-700 transition-all border border-stone-700/50"
                    >
                        🍔 Volver al Inicio
                    </Link>
                </div>
            </div>
        </main>
    );
}