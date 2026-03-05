"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams } from 'next/navigation';

export default function SeguimientoPedido() {
    const { id } = useParams();
    const [pedido, setPedido] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;

        // 1. Función para cargar el pedido inicial
        const fetchPedido = async () => {
            const { data, error } = await supabase
                .from('pedidos')
                .select('*')
                .eq('id', id)
                .single();

            if (data) {
                setPedido(data);
            }
            setLoading(false);
        };

        fetchPedido();

        // 2. SUSCRIPCIÓN EN TIEMPO REAL (El corazón del seguimiento)
        const channel = supabase
            .channel(`pedido-seguimiento-${id}`) // Nombre de canal único
            .on(
                'postgres_changes',
                { 
                    event: 'UPDATE', 
                    schema: 'public', 
                    table: 'pedidos', 
                    filter: `id=eq.${id}` // Escuchamos solo ESTE pedido
                },
                (payload) => {
                    console.log("🔔 Cambio detectado en tiempo real:", payload.new);
                    setPedido(payload.new); // Actualizamos el estado visual al instante
                }
            )
            .subscribe((status) => {
                console.log("Estado de la conexión Realtime:", status);
            });

        // Limpieza al desmontar el componente
        return () => {
            supabase.removeChannel(channel);
        };
    }, [id]);

    if (loading) return (
        <div className="min-h-screen bg-[#FFCA28] flex flex-col items-center justify-center font-black italic uppercase p-4 text-center">
            <div className="w-12 h-12 border-4 border-black border-t-white rounded-full animate-spin mb-4"></div>
            Buscando tu hamburguesa en la cocina...
        </div>
    );

    if (!pedido) return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center font-black italic uppercase p-4 text-center">
            <span className="text-6xl mb-4">🤡</span>
            Pedido no encontrado
        </div>
    );

    // Lógica para la barra de progreso
    const estados = ['pendiente', 'en cocina', 'en camino', 'entregado'];
    const indiceActual = estados.indexOf(pedido.estado);

    return (
        <div className="min-h-screen bg-stone-100 p-4 font-sans text-black">
            <div className="max-w-lg mx-auto pt-6">

                {/* Header con Estética Krusty */}
                <div className="bg-[#D32F2F] border-[6px] border-black p-6 rounded-[2.5rem] shadow-[8px_8px_0px_0px_black] text-white text-center mb-8">
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter drop-shadow-[2px_2px_0px_black]">
                        Tu Pedido
                    </h1>
                </div>

                <div className="flex justify-between items-end mb-4 px-2">
                    <p className="font-black text-[10px] uppercase bg-black text-white px-3 py-1 rounded-full">
                        Orden: #{pedido.id.toString().slice(-4)}
                    </p>
                    <p className="text-[10px] font-bold text-stone-400 uppercase italic">Actualización automática activa</p>
                </div>

                {/* BARRA DE PROGRESO VISUAL */}
                <div className="relative mb-12 px-4 mt-8">
                    {/* Línea de fondo */}
                    <div className="absolute top-4 left-0 w-full h-2 bg-stone-300 -translate-y-1/2 rounded-full border-2 border-black"></div>
                    
                    {/* Línea de progreso (Verde Krusty) */}
                    <div
                        className="absolute top-4 left-0 h-2 bg-green-500 -translate-y-1/2 rounded-full border-2 border-black transition-all duration-1000 ease-out"
                        style={{ width: `${(indiceActual / (estados.length - 1)) * 100}%` }}
                    ></div>

                    {/* Círculos de estado */}
                    <div className="relative flex justify-between">
                        {estados.map((est, index) => (
                            <div key={est} className="flex flex-col items-center">
                                <div className={`w-8 h-8 rounded-full border-4 border-black flex items-center justify-center transition-all duration-500 z-10 ${
                                    index <= indiceActual ? 'bg-[#FFCA28] scale-110 shadow-[2px_2px_0px_black]' : 'bg-white scale-90'
                                }`}>
                                    <span className="text-[10px] font-black">{index + 1}</span>
                                </div>
                                <p className={`text-[8px] font-black uppercase mt-3 transition-colors ${index <= indiceActual ? 'text-black' : 'text-stone-400'}`}>
                                    {est}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* TARJETA DE ESTADO DETALLADA */}
                <div className="bg-white border-[6px] border-black p-8 rounded-[3rem] shadow-[10px_10px_0px_0px_black] text-center mb-8 relative overflow-hidden">
                    <div className="mb-4">
                        <span className="text-7xl animate-bounce inline-block">
                            {pedido.estado === 'pendiente' && '📩'}
                            {pedido.estado === 'en cocina' && '👨‍🍳'}
                            {pedido.estado === 'en camino' && '🛵'}
                            {pedido.estado === 'entregado' && '🍔'}
                        </span>
                    </div>

                    <h2 className="text-3xl font-black uppercase italic leading-tight mb-4 tracking-tighter">
                        {pedido.estado === 'pendiente' && '¡Ya recibimos tu orden!'}
                        {pedido.estado === 'en cocina' && '¡El payaso está cocinando!'}
                        {pedido.estado === 'en camino' && '¡El repartidor va volando!'}
                        {pedido.estado === 'entregado' && '¡Tu pedido fue entregado!'}
                    </h2>

                    <p className="font-bold text-stone-500 text-sm uppercase italic">
                        {pedido.estado === 'pendiente' && 'Estamos revisando que todo esté en orden.'}
                        {pedido.estado === 'en cocina' && 'Tu burger está en la parrilla ahora mismo.'}
                        {pedido.estado === 'en camino' && 'Tené el celular cerca, estamos llegando.'}
                        {pedido.estado === 'entregado' && '¡Gracias por elegir Krusty Burger!'}
                    </p>
                </div>

                {/* RESUMEN BREVE */}
                <div className="bg-black text-white p-6 rounded-[2rem] border-4 border-black shadow-[6px_6px_0px_0px_#D32F2F]">
                    <p className="text-[10px] font-black uppercase text-[#FFCA28] mb-2 tracking-widest">Resumen para:</p>
                    <p className="font-black italic text-2xl uppercase leading-none mb-4">{pedido.cliente_nombre}</p>
                    <div className="pt-4 border-t border-white/20 text-xs font-bold space-y-2">
                        <p className="flex justify-between"><span>UBICACIÓN:</span> <span className="text-[#FFCA28]">{pedido.direccion}</span></p>
                        <p className="flex justify-between"><span>PAGO:</span> <span className="text-[#FFCA28]">{pedido.metodo_pago}</span></p>
                        <p className="text-[#FFCA28] text-2xl font-black mt-4 text-right italic leading-none pt-2">TOTAL: ${pedido.total}</p>
                    </div>
                </div>
                
                <p className="text-center mt-8 text-[10px] font-black uppercase text-stone-400">
                    Krusty Burger Corp. © 2024
                </p>

            </div>
        </div>
    );
}