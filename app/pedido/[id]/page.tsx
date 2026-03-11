"use client";
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti'; // Necesitás: npm install canvas-confetti

export default function SeguimientoPedido() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;
    const [pedido, setPedido] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const cargadoInicial = useRef(false);

    // Coordenadas actualizadas según el mapa:
    // 1. Pendiente: Casa de los Simpson (arriba a la izquierda)
    // 2. En Cocina: Krusty Burger (edificio rojo central con el logo)
    // 3. En Camino: Zona de tiendas y avenidas (derecha central)
    // 4. Entregado: Zona residencial sur (abajo a la derecha)
    const coordenadasMoto: Record<string, { x: string; y: string }> = {
        'pendiente': { x: '41%', y: '36%' },
        'en cocina': { x: '36%', y: '38%' },
        'en camino': { x: '30%', y: '55%' },
        'entregado': { x: '18%', y: '12%' },
    };

    useEffect(() => {
        if (!id) return;

        const fetchPedido = async () => {
            try {
                const { data, error } = await supabase
                    .from('pedidos')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;
                if (data) setPedido(data);
            } catch (error: any) {
                console.error("❌ Error:", error.message);
            } finally {
                setLoading(false);
                cargadoInicial.current = true;
            }
        };

        if (!cargadoInicial.current) fetchPedido();

        const channel = supabase
            .channel(`seguimiento-${id}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'pedidos', filter: `id=eq.${id}` },
                (payload) => {
                    // 1. Feedback auditivo
                    if (payload.new.estado !== pedido?.estado) {
                        const beep = new Audio('https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3');
                        beep.volume = 0.2;
                        beep.play().catch(() => {});
                    }

                    // 2. Disparar CONFETTI si el estado cambia a "entregado"
                    if (payload.new.estado === 'entregado' && pedido?.estado !== 'entregado') {
                        lanzarConfetti();
                    }

                    setPedido(payload.new);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [id, pedido?.estado]);

    const lanzarConfetti = () => {
        const duration = 4 * 1000;
        const end = Date.now() + duration;

        const frame = () => {
            confetti({
                particleCount: 3,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#FFCA28', '#D32F2F', '#000000']
            });
            confetti({
                particleCount: 3,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#FFCA28', '#D32F2F', '#000000']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };
        frame();
    };

    const handleVerTicket = () => {
        localStorage.setItem('ultimo_pedido_krusty', JSON.stringify({ id, fecha: new Date().getTime() }));
        router.push('/gracias');
    };

    if (loading) return (
        <div className="min-h-screen bg-[#FFCA28] flex flex-col items-center justify-center p-4 text-center">
            <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-16 h-16 border-8 border-black border-t-[#D32F2F] rounded-full mb-6"
            />
            <p className="font-black italic uppercase text-black animate-pulse">Cocinando seguimiento...</p>
        </div>
    );

    if (!pedido) return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
            <span className="text-8xl mb-6">🤡</span>
            <h2 className="text-3xl font-black uppercase italic mb-8">¡Ay Caramba! Pedido no encontrado</h2>
            <button onClick={() => router.push('/')} className="bg-[#D32F2F] text-white font-black px-8 py-4 rounded-2xl border-4 border-black shadow-[6px_6px_0px_black]">VOLVER AL HOME</button>
        </div>
    );

    const estados = ['pendiente', 'en cocina', 'en camino', 'entregado'];
    const indiceActual = estados.indexOf(pedido.estado);
    const posMoto = coordenadasMoto[pedido.estado] || coordenadasMoto['pendiente'];

    return (
        <div className="min-h-screen bg-stone-100 p-4 font-sans text-black pb-24 overflow-x-hidden">
            <div className="max-w-md mx-auto pt-4">
                
                {/* NAVEGACIÓN */}
                <div className="flex justify-between items-center mb-6 gap-4">
                    <button onClick={() => router.push('/')} className="flex-1 bg-white border-4 border-black p-3 rounded-2xl font-black italic uppercase text-[10px] shadow-[4px_4px_0px_black] active:scale-95 transition-all">← Menú</button>
                    <button onClick={handleVerTicket} className="flex-1 bg-[#FFCA28] border-4 border-black p-3 rounded-2xl font-black italic uppercase text-[10px] shadow-[4px_4px_0px_black] active:scale-95 transition-all">Ver Ticket 🎫</button>
                </div>

                {/* MAPA DE SPRINGFIELD */}
                <div className="relative w-full h-56 bg-stone-300 rounded-[2.5rem] border-4 border-black mb-8 overflow-hidden shadow-[8px_8px_0px_black]">
                    <img 
                        src="/images/springfield-map.jpg" 
                        alt="Springfield Map" 
                        className="w-full h-full object-cover scale-110 opacity-90"
                    />
                    
                    {/* ICONO DE LA MOTO / GPS */}
                    <motion.div 
                        className="absolute z-20"
                        animate={{ left: posMoto.x, top: posMoto.y }}
                        transition={{ duration: 2.5, ease: "easeInOut" }}
                    >
                        <div className="relative -translate-x-1/2 -translate-y-1/2">
                            <span className="text-4xl drop-shadow-[2px_2px_0px_rgba(255,255,255,1)]">
                                {pedido.estado === 'en camino' ? '🛵' : '📍'}
                            </span>
                            {pedido.estado === 'en camino' && (
                                <motion.div 
                                    animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                    className="absolute -inset-2 bg-yellow-400 rounded-full -z-10 blur-sm"
                                />
                            )}
                        </div>
                    </motion.div>

                    <div className="absolute top-3 right-4 bg-black/80 text-[7px] text-white px-2 py-1 rounded-full font-black uppercase tracking-widest border border-white/20">
                        Live Tracking Springfield
                    </div>
                </div>

                {/* BARRA DE PROGRESO */}
                <div className="relative mb-14 px-2">
                    <div className="absolute top-4 left-0 w-full h-3 bg-stone-200 -translate-y-1/2 rounded-full border-[3px] border-black shadow-inner" />
                    <motion.div
                        className="absolute top-4 left-0 h-3 bg-[#4DB6AC] -translate-y-1/2 rounded-full border-[3px] border-black z-10"
                        initial={{ width: 0 }}
                        animate={{ width: `${(indiceActual / (estados.length - 1)) * 100}%` }}
                        transition={{ duration: 1, ease: "backOut" }}
                    />
                    <div className="relative flex justify-between z-20">
                        {estados.map((est, index) => (
                            <div key={est} className="flex flex-col items-center">
                                <div className={`w-9 h-9 rounded-full border-4 border-black flex items-center justify-center transition-all duration-500 ${index <= indiceActual ? 'bg-[#FFCA28] scale-110 shadow-[3px_3px_0px_black]' : 'bg-white text-stone-300'}`}>
                                    <span className="text-[11px] font-black">{index + 1}</span>
                                </div>
                                <p className={`text-[8px] font-black uppercase mt-3 text-center max-w-[60px] leading-tight ${index <= indiceActual ? 'text-black' : 'text-stone-300'}`}>{est}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* TARJETA DE ESTADO */}
                <AnimatePresence mode="wait">
                    <motion.div 
                        key={pedido.estado}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 1.1, opacity: 0 }}
                        className="bg-white border-4 border-black p-10 rounded-[3rem] shadow-[12px_12px_0px_black] text-center mb-10"
                    >
                        <div className="mb-6 text-8xl drop-shadow-lg">
                            {pedido.estado === 'pendiente' && '📩'}
                            {pedido.estado === 'en cocina' && '👨‍🍳'}
                            {pedido.estado === 'en camino' && '🛵'}
                            {pedido.estado === 'entregado' && '🍔'}
                        </div>
                        <h2 className="text-3xl font-black uppercase italic leading-none mb-4 tracking-tighter transform -skew-x-2">
                            {pedido.estado === 'pendiente' && '¡Orden Recibida!'}
                            {pedido.estado === 'en cocina' && '¡Al Fuego!'}
                            {pedido.estado === 'en camino' && '¡A Toda Marcha!'}
                            {pedido.estado === 'entregado' && '¡Buen Provecho!'}
                        </h2>
                        <p className="font-bold text-stone-500 text-sm uppercase italic px-4">
                            {pedido.estado === 'pendiente' && 'Estamos preparando todo para empezar.'}
                            {pedido.estado === 'en cocina' && 'Tu burger está en la parrilla ahora mismo.'}
                            {pedido.estado === 'en camino' && 'El repartidor está volando para llegar.'}
                            {pedido.estado === 'entregado' && '¡Gracias por elegir Krusty Burger!'}
                        </p>
                    </motion.div>
                </AnimatePresence>

                {/* RESUMEN */}
                <div className="bg-stone-900 text-white p-8 rounded-[2.5rem] border-4 border-black shadow-[8px_8px_0px_#D32F2F] mb-6">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <p className="text-[10px] font-black uppercase text-[#FFCA28] mb-1">Entregar a:</p>
                            <p className="font-black italic text-2xl uppercase tracking-tighter">{pedido.cliente_nombre}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase text-stone-500 mb-1">Orden:</p>
                            <p className="font-mono font-black text-[#4DB6AC]">#{id.slice(-6).toUpperCase()}</p>
                        </div>
                    </div>
                    <div className="space-y-4 pt-4 border-t border-white/10">
                        <div className="flex gap-4">
                            <span className="text-stone-500 font-black text-[10px] uppercase shrink-0 pt-1">📍 Destino:</span>
                            <span className="text-white font-bold text-sm uppercase italic">{pedido.direccion}</span>
                        </div>
                        <div className="flex justify-between items-end">
                            <span className="text-stone-500 font-black text-[10px] uppercase">💰 Total:</span>
                            <span className="text-[#FFCA28] text-4xl font-black italic tracking-tighter">
                                ${Number(pedido.total).toLocaleString('es-AR')}
                            </span>
                        </div>
                    </div>
                </div>

                <p className="text-center font-black italic uppercase text-[10px] text-stone-400 tracking-widest mb-10">
                    Springfield OS v5.2 • Agencia Digital Powa
                </p>
            </div>
        </div>
    );
}