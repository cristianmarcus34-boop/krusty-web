"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';

export default function SeguimientoPedido() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id;
    const [pedido, setPedido] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;

        // 1. Carga inicial del pedido
        const fetchPedido = async () => {
            const { data, error } = await supabase
                .from('pedidos')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error("❌ Error cargando pedido:", error.message);
                setLoading(false);
                return;
            }
            if (data) setPedido(data);
            setLoading(false);
        };

        fetchPedido();

        // 2. Suscripción en Tiempo Real específica para ESTE pedido
        const channel = supabase
            .channel(`pedido-${id}`) // Canal único por pedido
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'pedidos',
                    filter: `id=eq.${id}` // 🔥 ESTO ES CLAVE: Filtra en el servidor
                },
                (payload) => {
                    console.log("🔔 Cambio detectado para este pedido:", payload.new.estado);
                    setPedido(payload.new);
                }
            )
            .subscribe((status) => {
                console.log(`📡 Suscripción para pedido ${id}:`, status);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [id]);

    const handleVerTicket = () => {
        localStorage.setItem('ultimo_pedido_id', id as string);
        router.push('/gracias');
    };

    if (loading) return (
        <div className="min-h-screen bg-[#FFCA28] flex flex-col items-center justify-center font-black italic uppercase p-4 text-center">
            <div className="w-12 h-12 border-8 border-black border-t-white rounded-full animate-spin mb-4"></div>
            Cocinando tu seguimiento...
        </div>
    );

    if (!pedido) return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center font-black italic uppercase p-4 text-center">
            <span className="text-6xl mb-4">🤡</span>
            <p className="mb-6 text-2xl">Pedido no encontrado</p>
            <button
                onClick={() => router.push('/')}
                className="bg-black text-white px-8 py-4 rounded-2xl border-4 border-[#D32F2F] shadow-[4px_4px_0px_black]"
            >
                VOLVER AL HOME
            </button>
        </div>
    );

    const estados = ['pendiente', 'en cocina', 'en camino', 'entregado'];
    const indiceActual = estados.indexOf(pedido.estado);

    return (
        <div className="min-h-screen bg-stone-100 p-4 font-sans text-black pb-20">
            <div className="max-w-lg mx-auto pt-6">

                {/* NAVEGACIÓN */}
                <div className="flex justify-between items-center mb-6 gap-2">
                    <button
                        onClick={() => router.push('/')}
                        className="flex-1 flex items-center justify-center gap-2 font-black italic uppercase text-[10px] bg-white border-[3px] border-black px-4 py-2 rounded-xl shadow-[4px_4px_0px_black] active:translate-y-1 active:shadow-none transition-all"
                    >
                        ← Menú
                    </button>
                    <button
                        onClick={handleVerTicket}
                        className="flex-1 flex items-center justify-center gap-2 font-black italic uppercase text-[10px] bg-[#FFCA28] border-[3px] border-black px-4 py-2 rounded-xl shadow-[4px_4px_0px_black] active:translate-y-1 active:shadow-none transition-all"
                    >
                        Ver Ticket 🎫
                    </button>
                </div>

                {/* HEADER KRUSTY */}
                <div className="bg-[#D32F2F] border-[6px] border-black p-6 rounded-[2.5rem] shadow-[8px_8px_0px_0px_black] text-white text-center mb-8">
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter drop-shadow-[2px_2px_0px_black]">
                        Tu Pedido
                    </h1>
                </div>

                {/* INDICADOR EN VIVO */}
                <div className="flex justify-between items-end mb-4 px-2">
                    <p className="font-black text-[10px] uppercase bg-black text-white px-3 py-1 rounded-full">
                        Orden: #{String(pedido.id).slice(-6)}
                    </p>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <p className="text-[10px] font-bold text-stone-400 uppercase italic">En Vivo</p>
                    </div>
                </div>

                {/* BARRA DE PROGRESO DINÁMICA */}
                <div className="relative mb-12 px-2 mt-8">
                    <div className="absolute top-4 left-0 w-full h-2 bg-stone-300 -translate-y-1/2 rounded-full border-2 border-black"></div>
                    <div
                        className="absolute top-4 left-0 h-2 bg-green-500 -translate-y-1/2 rounded-full border-2 border-black transition-all duration-700 ease-out"
                        style={{ width: `${(indiceActual / (estados.length - 1)) * 100}%` }}
                    ></div>

                    <div className="relative flex justify-between">
                        {estados.map((est, index) => (
                            <div key={est} className="flex flex-col items-center">
                                <div className={`w-8 h-8 rounded-full border-4 border-black flex items-center justify-center transition-all duration-500 z-10 ${index <= indiceActual ? 'bg-[#FFCA28] scale-110 shadow-[2px_2px_0px_black]' : 'bg-white'
                                    }`}>
                                    <span className="text-[10px] font-black">{index + 1}</span>
                                </div>
                                <p className={`text-[7px] sm:text-[9px] font-black uppercase mt-3 text-center max-w-[50px] leading-tight ${index <= indiceActual ? 'text-black' : 'text-stone-400'}`}>
                                    {est}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* TARJETA DE ESTADO DINÁMICA */}
                <div className="bg-white border-[6px] border-black p-8 rounded-[3rem] shadow-[10px_10px_0px_0px_black] text-center mb-8">
                    <div className="mb-4">
                        <span className="text-7xl inline-block animate-bounce">
                            {pedido.estado === 'pendiente' && '📩'}
                            {pedido.estado === 'en cocina' && '👨‍🍳'}
                            {pedido.estado === 'en camino' && '🛵'}
                            {pedido.estado === 'entregado' && '🍔'}
                        </span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-black uppercase italic leading-tight mb-4 tracking-tighter">
                        {pedido.estado === 'pendiente' && '¡Ya recibimos tu orden!'}
                        {pedido.estado === 'en cocina' && '¡El payaso está cocinando!'}
                        {pedido.estado === 'en camino' && '¡El repartidor va volando!'}
                        {pedido.estado === 'entregado' && '¡Tu pedido fue entregado!'}
                    </h2>

                    <p className="font-bold text-stone-500 text-xs sm:text-sm uppercase italic">
                        {pedido.estado === 'pendiente' && 'Estamos revisando que todo esté en orden.'}
                        {pedido.estado === 'en cocina' && 'Tu burger está en la parrilla ahora mismo.'}
                        {pedido.estado === 'en camino' && 'Tené el celular cerca, estamos llegando.'}
                        {pedido.estado === 'entregado' && '¡Gracias por elegir Krusty Burger!'}
                    </p>
                </div>

                {/* RESUMEN DE COMPRA */}
                <div className="bg-black text-white p-6 rounded-[2rem] border-4 border-black shadow-[6px_6px_0px_0px_#D32F2F]">
                    <p className="text-[10px] font-black uppercase text-[#FFCA28] mb-1">Resumen para:</p>
                    <p className="font-black italic text-xl uppercase mb-4">{pedido.cliente_nombre}</p>
                    <div className="pt-4 border-t border-white/20 text-xs font-bold space-y-2">
                        <div className="flex justify-between gap-4">
                            <span className="shrink-0 text-stone-400">📍 DIRECCIÓN:</span>
                            <span className="text-[#FFCA28] text-right uppercase">{pedido.direccion}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-stone-400">💳 MÉTODO:</span>
                            <span className="text-[#FFCA28] uppercase">{pedido.metodo_pago}</span>
                        </div>
                        <div className="pt-4 flex justify-between items-end border-t border-white/10">
                            <span className="font-black italic uppercase">Total:</span>
                            <span className="text-[#FFCA28] text-3xl font-black italic">
                                ${Number(pedido.total).toLocaleString('es-AR')}
                            </span>
                        </div>
                    </div>
                </div>

                <p className="mt-8 text-center font-black italic uppercase text-[9px] text-stone-400">
                    Krusty Burger Web v5.0 • Live Tracking Enabled
                </p>
            </div>
        </div>
    );
}