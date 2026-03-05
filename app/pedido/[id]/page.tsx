"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams } from 'next/navigation';

export default function SeguimientoPedido() {
    const { id } = useParams();
    const [pedido, setPedido] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Cargar el pedido inicial
        const fetchPedido = async () => {
            const { data, error } = await supabase
                .from('pedidos')
                .select('*')
                .eq('id', id)
                .single();

            if (data) setPedido(data);
            setLoading(false);
        };

        fetchPedido();

        // 2. Suscribirse a cambios en tiempo real
        const channel = supabase
            .channel(`pedido-${id}`)
            .on('postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'pedidos', filter: `id=eq.${id}` },
                (payload) => {
                    setPedido(payload.new);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [id]);

    if (loading) return (
        <div className="min-h-screen bg-[#FFCA28] flex items-center justify-center font-black italic uppercase">
            Buscando tu hamburguesa...
        </div>
    );

    if (!pedido) return (
        <div className="min-h-screen bg-white flex items-center justify-center font-black italic uppercase">
            Pedido no encontrado 🤡
        </div>
    );

    // Lógica para la barra de progreso
    const estados = ['pendiente', 'en cocina', 'en camino', 'entregado'];
    const indiceActual = estados.indexOf(pedido.estado);

    return (
        <div>
            <div className="min-h-screen bg-stone-100 p-4 font-sans text-black">
                <div className="max-w-lg mx-auto pt-10">

                    {/* Header con Estética Krusty */}
                    <div className="bg-[#D32F2F] border-[6px] border-black p-6 rounded-[2.5rem] shadow-[8px_8px_0px_0px_black] text-white text-center mb-10">
                        <h1 className="text-4xl font-black italic uppercase tracking-tighter drop-shadow-[2px_2px_0px_black]">
                            Estado de tu Pedido
                        </h1>
                    </div>
                    <p className="font-bold text-xs mt-2 uppercase">Orden: #{pedido.id.toString().slice(-4)}</p>
                </div>

                {/* BARRA DE PROGRESO VISUAL */}
                <div className="relative mb-12 px-4">
                    <div className="absolute top-1/2 left-0 w-full h-2 bg-stone-300 -translate-y-1/2 rounded-full border-2 border-black"></div>
                    <div
                        className="absolute top-1/2 left-0 h-2 bg-green-500 -translate-y-1/2 rounded-full border-2 border-black transition-all duration-1000"
                        style={{ width: `${(indiceActual / (estados.length - 1)) * 100}%` }}
                    ></div>

                    <div className="relative flex justify-between">
                        {estados.map((est, index) => (
                            <div key={est} className="flex flex-col items-center">
                                <div className={`w-8 h-8 rounded-full border-4 border-black flex items-center justify-center transition-colors duration-500 ${index <= indiceActual ? 'bg-[#FFCA28]' : 'bg-white'}`}>
                                    <span className="text-[10px]">{index + 1}</span>
                                </div>
                                <p className={`text-[8px] font-black uppercase mt-2 ${index <= indiceActual ? 'text-black' : 'text-stone-400'}`}>
                                    {est}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* TARJETA DE ESTADO DETALLADA */}
                <div className="bg-white border-[6px] border-black p-8 rounded-[3rem] shadow-[8px_8px_0px_0px_black] text-center">
                    <div className="mb-6">
                        <span className="text-6xl">
                            {pedido.estado === 'pendiente' && '📩'}
                            {pedido.estado === 'en cocina' && '👨‍🍳'}
                            {pedido.estado === 'en camino' && '🛵'}
                            {pedido.estado === 'entregado' && '🍔'}
                        </span>
                    </div>

                    <h2 className="text-3xl font-black uppercase italic leading-none mb-4">
                        {pedido.estado === 'pendiente' && '¡Ya recibimos tu orden!'}
                        {pedido.estado === 'en cocina' && '¡El payaso está cocinando!'}
                        {pedido.estado === 'en camino' && '¡El repartidor va volando!'}
                        {pedido.estado === 'entregado' && '¡Tu pedido fue entregado!'}
                    </h2>

                    <p className="font-bold text-stone-500 text-sm uppercase">
                        {pedido.estado === 'pendiente' && 'Estamos revisando que todo esté en orden.'}
                        {pedido.estado === 'en cocina' && 'Tu burger está en la parrilla ahora mismo.'}
                        {pedido.estado === 'en camino' && 'Tené el celular cerca, estamos llegando.'}
                        {pedido.estado === 'entregado' && '¡Gracias por elegir Krusty Burger!'}
                    </p>
                </div>

                {/* RESUMEN BREVE */}
                <div className="mt-8 bg-black text-white p-6 rounded-2xl border-4 border-black">
                    <p className="text-[10px] font-black uppercase text-[#FFCA28] mb-2">Resumen para:</p>
                    <p className="font-black italic text-xl uppercase leading-none">{pedido.cliente_nombre}</p>
                    <div className="mt-4 pt-4 border-t border-white/20 text-xs font-bold space-y-1">
                        <p>📍 {pedido.direccion}</p>
                        <p>💳 {pedido.metodo_pago}</p>
                        <p className="text-[#FFCA28] text-lg font-black mt-2">TOTAL: ${pedido.total}</p>
                    </div>
                </div>

            </div>
        </div >
    );
}