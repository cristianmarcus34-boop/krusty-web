"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ActiveOrderFloating() {
    const router = useRouter();
    const pathname = usePathname();
    const [pedidoActivo, setPedidoActivo] = useState<{ id: string; estado: string } | null>(null);

    useEffect(() => {
        const rawData =
            localStorage.getItem('ultimo_pedido_krusty') ||
            localStorage.getItem('pedido_activo_id');

        if (!rawData) {
            setPedidoActivo(null);
            return;
        }

        let id = '';
        try {
            const parsed = JSON.parse(rawData);
            id = typeof parsed === 'object' ? parsed.id : parsed;
        } catch {
            id = rawData;
        }

        if (!id) {
            setPedidoActivo(null);
            return;
        }

        const checkPedido = async () => {
            const { data, error } = await supabase
                .from('pedidos')
                .select('id, estado')
                .eq('id', id)
                .single();

            // Si el pedido existe y NO está entregado ni cancelado, lo mostramos sí o sí
            if (data && !['entregado', 'cancelado'].includes(data.estado)) {
                setPedidoActivo({ id: String(data.id), estado: data.estado });
                // Aseguramos que el localStorage se mantenga sincronizado
                localStorage.setItem('pedido_activo_id', String(data.id));
            } else {
                localStorage.removeItem('ultimo_pedido_krusty');
                localStorage.removeItem('pedido_activo_id');
                setPedidoActivo(null);
            }
        };

        checkPedido();

        const channel = supabase
            .channel(`floating-order-${id}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'pedidos', filter: `id=eq.${id}` },
                (payload) => {
                    if (['entregado', 'cancelado'].includes(payload.new.estado)) {
                        localStorage.removeItem('ultimo_pedido_krusty');
                        localStorage.removeItem('pedido_activo_id');
                        setPedidoActivo(null);
                    } else {
                        setPedidoActivo({ id: String(payload.new.id), estado: payload.new.estado });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [pathname]);

    if (!pedidoActivo) return null;

    const idStr = String(pedidoActivo.id || '');
    const shortId = idStr.length >= 4 ? idStr.slice(-4).toUpperCase() : idStr.toUpperCase();

    return (
        <div className="fixed bottom-6 left-4 sm:left-6 z-50 animate-bounce">
            <button
                type="button"
                onClick={() => router.push(`/pedido/${pedidoActivo.id}`)}
                className="flex items-center gap-3 bg-[#FFCA28] text-stone-950 font-black px-5 py-3.5 rounded-2xl shadow-[6px_6px_0px_black] border-4 border-black hover:bg-[#D32F2F] hover:text-white transition-all active:scale-95 cursor-pointer"
            >
                <span className="text-2xl">🛵</span>
                <div className="text-left">
                    <p className="text-[9px] font-black uppercase leading-none opacity-80">
                        Pedido en curso #{shortId}
                    </p>
                    <p className="text-xs font-black uppercase italic tracking-tight leading-tight mt-0.5">
                        Ver Seguimiento ➔
                    </p>
                </div>
            </button>
        </div>
    );
}