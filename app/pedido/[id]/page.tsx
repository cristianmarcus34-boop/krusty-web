// app/pedido/[id]/page.tsx - ACTUALIZADO CON VALIDACIÓN POR ID DE USUARIO
"use client";

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useAuth } from '../../hooks/useAuth';
import BannerNotificaciones from '../../../components/BannerNotificaciones';
import { useNotificaciones } from '@/app/hooks/useNotificaciones';

export default function SeguimientoPedido() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    // ✅ OBTENER USUARIO LOGUEADO
    const { perfil, sesion, cargando: authCargando } = useAuth();

    const [pedido, setPedido] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [puntosGanados, setPuntosGanados] = useState<number | null>(null);
    const [bannerCerrado, setBannerCerrado] = useState(false);
    const cargadoInicial = useRef(false);

    const {
        notificacionesPermitidas,
        mostrarBanner,
        enviarNotificacion,
        reactivarNotificaciones,
    } = useNotificaciones();

    const coordenadasMoto: Record<string, { x: string; y: string }> = {
        'pendiente': { x: '41%', y: '36%' },
        'en cocina': { x: '36%', y: '38%' },
        'en camino': { x: '30%', y: '55%' },
        'entregado': { x: '18%', y: '12%' },
    };

    // ============================================================
    // 🎬 EFECTO INICIAL
    // ============================================================
    useEffect(() => {
        if (!id) return;

        const fetchPedido = async () => {
            setLoading(true);
            setErrorMsg(null);
            try {
                const { data, error } = await supabase
                    .from('pedidos')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error || !data) {
                    setErrorMsg('El pedido que buscás no existe, fue eliminado o la URL es incorrecta.');
                    setLoading(false);
                    return;
                }

                // ✅ VALIDACIÓN POR ID DE USUARIO (MÁS SEGURO)
                const userId = sesion?.user?.id || null;

                // Si el pedido tiene id_de_usuario, debe coincidir con el usuario logueado
                if (data.id_de_usuario && userId) {
                    if (data.id_de_usuario !== userId) {
                        setErrorMsg('⚠️ Acceso denegado: Este pedido no pertenece a tu usuario.');
                        setLoading(false);
                        return;
                    }
                }
                // Si el pedido NO tiene id_de_usuario (pedidos viejos), validar por teléfono
                else if (!data.id_de_usuario) {
                    const telefonoLocal = localStorage.getItem('krusty_user_telefono');
                    if (!telefonoLocal || data.telefono !== telefonoLocal) {
                        setErrorMsg('⚠️ Acceso denegado: No tenés permisos para ver este pedido.');
                        setLoading(false);
                        return;
                    }
                }
                // Si el pedido tiene id_de_usuario pero no hay usuario logueado
                else if (data.id_de_usuario && !userId) {
                    setErrorMsg('⚠️ Debes iniciar sesión para ver este pedido.');
                    setLoading(false);
                    return;
                }

                setPedido(data);

                if (data.estado === 'entregado') {
                    const puntos = Math.floor(data.total / 100);
                    setPuntosGanados(puntos);
                }

            } catch (error: any) {
                console.error("❌ Error:", error.message);
                setErrorMsg('Ocurrió un error al conectar con la cocina de Krusty.');
            } finally {
                setLoading(false);
                cargadoInicial.current = true;
            }
        };

        // Esperar a que la autenticación termine
        if (!authCargando) {
            fetchPedido();
        }
    }, [id, sesion, authCargando]);

    // ============================================================
    // 📡 SUPABASE REALTIME
    // ============================================================
    useEffect(() => {
        if (!id || !pedido) return;

        const channel = supabase
            .channel(`seguimiento-${id}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'pedidos', filter: `id=eq.${id}` },
                (payload) => {
                    const nuevoEstado = payload.new.estado;

                    setPedido((estadoAnteriorPedido: any) => {
                        const estadoAnterior = estadoAnteriorPedido?.estado;

                        if (nuevoEstado !== estadoAnterior) {
                            if (nuevoEstado === 'en camino') {
                                try {
                                    const beep = new Audio('/sounds/correcaminos-bip.mp3');
                                    beep.volume = 0.5;
                                    beep.play().catch(() => console.log('🔊 Sonido no disponible'));
                                } catch (e) {
                                    console.log('🔊 Error con sonido:', e);
                                }

                                enviarNotificacion(
                                    '🚀 ¡Tu pedido está en camino!',
                                    'El repartidor de Krusty Burger está llegando.'
                                );
                            }

                            if (nuevoEstado === 'entregado') {
                                try {
                                    const yahoo = new Audio('/sounds/woo-hoo.mp3');
                                    yahoo.volume = 0.5;
                                    yahoo.play().catch(() => console.log('🔊 Sonido no disponible'));
                                } catch (e) {
                                    console.log('🔊 Error con sonido:', e);
                                }

                                lanzarConfetti();

                                const puntos = Math.floor(payload.new.total / 100);
                                setPuntosGanados(puntos);

                                const mensaje = puntos > 0
                                    ? `🎉 ¡Ganaste ${puntos} puntos! Disfruta tu comida.`
                                    : '🎉 ¡Disfruta tu comida! Gracias por elegir Krusty Burger.';

                                enviarNotificacion('🍔 ¡Pedido entregado!', mensaje);
                            }
                        }

                        return payload.new;
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [id, pedido, enviarNotificacion]);

    // ============================================================
    // 🎊 LANZAR CONFETTI
    // ============================================================
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

    // ============================================================
    // 🖥️ RENDERIZADO
    // ============================================================
    if (authCargando || loading) {
        return (
            <div className="min-h-screen bg-[#FFCA28] flex flex-col items-center justify-center p-4 text-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-16 h-16 border-8 border-black border-t-[#D32F2F] rounded-full mb-6"
                />
                <p className="font-black italic uppercase text-black animate-pulse">
                    {authCargando ? 'Verificando autenticación...' : 'Cocinando seguimiento...'}
                </p>
            </div>
        );
    }

    if (errorMsg || !pedido) {
        return (
            <div className="min-h-screen bg-[#FFF9E6] flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-white border-4 border-black p-8 rounded-[2.5rem] shadow-[8px_8px_0px_black] max-w-md w-full">
                    <span className="text-6xl mb-4 block">👮‍♂️</span>
                    <h2 className="text-2xl font-black uppercase italic mb-2 text-black">¡Ay Caramba!</h2>
                    <p className="font-bold text-stone-600 text-sm mb-6">{errorMsg || 'Pedido no encontrado'}</p>
                    <button
                        onClick={() => router.push('/')}
                        className="w-full bg-[#FFCA28] text-black font-black py-4 rounded-2xl border-4 border-black shadow-[4px_4px_0px_black] hover:bg-[#D32F2F] hover:text-white transition-all uppercase cursor-pointer"
                    >
                        VOLVER AL MENÚ
                    </button>
                </div>
            </div>
        );
    }

    const estados = ['pendiente', 'en cocina', 'en camino', 'entregado'];
    const indiceActual = estados.indexOf(pedido.estado);
    const posMoto = coordenadasMoto[pedido.estado] || coordenadasMoto['pendiente'];

    return (
        <div className="min-h-screen bg-stone-100 p-4 font-sans text-black pb-32 overflow-x-hidden">
            <div className="max-w-md mx-auto pt-4">

                {/* NAVEGACIÓN */}
                <div className="flex justify-between items-center mb-6 gap-4">
                    <button onClick={() => router.push('/')} className="flex-1 bg-white border-4 border-black p-3 rounded-2xl font-black italic uppercase text-[10px] shadow-[4px_4px_0px_black] active:scale-95 transition-all cursor-pointer">← Menú</button>
                    <button onClick={handleVerTicket} className="flex-1 bg-[#FFCA28] border-4 border-black p-3 rounded-2xl font-black italic uppercase text-[10px] shadow-[4px_4px_0px_black] active:scale-95 transition-all cursor-pointer">Ver Ticket 🎫</button>
                </div>

                {/* MAPA DE SPRINGFIELD */}
                <div className="relative w-full h-56 bg-stone-300 rounded-[2.5rem] border-4 border-black mb-8 overflow-hidden shadow-[8px_8px_0px_black]">
                    <img
                        src="/images/springfield-map.jpg"
                        alt="Springfield Map"
                        className="w-full h-full object-cover scale-110 opacity-90"
                    />

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
                                <p className={`text-[8px] font-black uppercase mt-3 text-center max-w-15 leading-tight ${index <= indiceActual ? 'text-black' : 'text-stone-300'}`}>{est}</p>
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

                        {/* PUNTOS GANADOS */}
                        {pedido.estado === 'entregado' && puntosGanados !== null && puntosGanados > 0 && (
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.5, duration: 0.5 }}
                                className="mt-6 bg-[#FFCA28]/20 border-2 border-[#FFCA28] rounded-2xl p-4"
                            >
                                <div className="flex items-center justify-center gap-3">
                                    <span className="text-3xl">⭐</span>
                                    <div>
                                        <p className="text-xs font-bold text-stone-500 uppercase">Puntos ganados</p>
                                        <p className="text-3xl font-black text-[#FFCA28]">
                                            +{puntosGanados} pts
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
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
                            <p className="font-mono font-black text-[#4DB6AC]">#{String(id).slice(-6).toUpperCase()}</p>
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
                                ${Number(pedido.total || 0).toLocaleString('es-AR')}
                            </span>
                        </div>
                        {pedido.estado === 'entregado' && puntosGanados !== null && puntosGanados > 0 && (
                            <div className="flex justify-between items-center pt-2 border-t border-white/10">
                                <span className="text-stone-500 font-black text-[10px] uppercase">⭐ Puntos:</span>
                                <span className="text-[#FFCA28] font-black text-lg">
                                    +{puntosGanados} pts
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <p className="text-center font-black italic uppercase text-[10px] text-stone-400 tracking-widest mb-10">
                    Springfield OS v5.2 • Agencia Powa
                </p>
            </div>

            {/* ✅ BANNER DE NOTIFICACIONES */}
            <BannerNotificaciones
                mostrar={mostrarBanner && !bannerCerrado}
                onActivar={reactivarNotificaciones}
                onCerrar={() => setBannerCerrado(true)}
            />
        </div>
    );
}