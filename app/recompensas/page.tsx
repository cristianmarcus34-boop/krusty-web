// app/recompensas/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { recompensaService, Recompensa, ResultadoCanje } from '@/services/recompensaService';
import toast from 'react-hot-toast';

export default function RecompensasPage() {
    const router = useRouter();
    const { perfil, sesion, recargarPerfil } = useAuth();
    const [recompensas, setRecompensas] = useState<Recompensa[]>([]);
    const [cargando, setCargando] = useState(true);
    const [canjeando, setCanjeando] = useState(false);
    const [recompensaSeleccionada, setRecompensaSeleccionada] = useState<Recompensa | null>(null);
    const [mostrarModal, setMostrarModal] = useState(false);

    useEffect(() => {
        cargarRecompensas();
    }, []);

    const cargarRecompensas = async () => {
        setCargando(true);
        const data = await recompensaService.obtenerRecompensas();
        setRecompensas(data);
        setCargando(false);
    };

    const handleCanjear = async () => {
        if (!recompensaSeleccionada || !perfil?.id) return;

        setCanjeando(true);
        setMostrarModal(false);

        try {
            const resultado = await recompensaService.canjearRecompensa(
                perfil.id,
                recompensaSeleccionada.id
            );

            if (resultado.exito) {
                toast.success(resultado.mensaje, {
                    duration: 4000,
                    icon: '🎉',
                });
                await recargarPerfil();
                await cargarRecompensas();
            } else {
                toast.error(resultado.mensaje, {
                    duration: 4000,
                    icon: '❌',
                });
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al procesar el canje', {
                duration: 4000,
                icon: '❌',
            });
        } finally {
            setCanjeando(false);
            setRecompensaSeleccionada(null);
        }
    };

    const getIconoPorTipo = (tipo: string): string => {
        switch (tipo) {
            case 'DESCUENTO': return '💰';
            case 'PRODUCTO_GRATIS': return '🍔';
            case 'ENVIO_GRATIS': return '🚚';
            default: return '🎁';
        }
    };

    const getColorPorTipo = (tipo: string): string => {
        switch (tipo) {
            case 'DESCUENTO': return '#E53935';
            case 'PRODUCTO_GRATIS': return '#43A047';
            case 'ENVIO_GRATIS': return '#3949AB';
            default: return '#F5C518';
        }
    };

    const puntosDisponibles = perfil?.puntos_disponibles || 0;

    if (!sesion?.user) {
        return (
            <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-6">
                <div className="bg-white border-4 border-black p-12 rounded-[3rem] shadow-[15px_15px_0px_0px_black] max-w-md w-full text-center">
                    <span className="text-8xl block mb-6">🍔</span>
                    <h1 className="font-krusty text-3xl text-black uppercase mb-4">Inicia sesión</h1>
                    <p className="text-stone-600 font-bold mb-8">Iniciá sesión para ver tus recompensas.</p>
                    <Link href="/login" className="inline-block bg-[#D32F2F] text-white font-black px-8 py-4 rounded-full border-4 border-black shadow-[4px_4px_0px_0px_black] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
                        Iniciar Sesión
                    </Link>
                </div>
            </div>
        );
    }

    if (cargando) {
        return (
            <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-6">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-8 border-[#FFCA28] border-t-[#D32F2F] mx-auto mb-6" />
                    <p className="font-black text-stone-500 uppercase text-sm">Cargando recompensas...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fafafa] pb-24">
            {/* Header */}
            <div className="bg-white border-b-4 border-black pt-8 pb-6 px-6">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="font-black text-3xl text-black uppercase tracking-tighter">
                            🎁 Recompensas
                        </h1>
                        <p className="text-sm font-bold text-stone-400">
                            Canjeá tus puntos por beneficios exclusivos
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="bg-[#FFCA28] border-4 border-black px-4 py-2 rounded-xl flex items-center gap-2 shadow-[4px_4px_0px_0px_black]">
                            <span className="text-lg">⭐</span>
                            <span className="font-black text-lg">{puntosDisponibles}</span>
                            <span className="text-xs font-black uppercase text-stone-600">Pts</span>
                        </div>
                        <Link href="/perfil">
                            <button className="bg-stone-200 border-4 border-black px-4 py-2 rounded-xl font-black text-xs shadow-[4px_4px_0px_0px_black] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
                                ← Perfil
                            </button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Contenido */}
            <div className="max-w-4xl mx-auto px-6 py-6">
                {/* Banner informativo */}
                <div className="bg-[#FAD02C]/10 border-2 border-[#FAD02C]/30 rounded-2xl p-4 mb-6 flex items-start gap-3">
                    <div className="w-10 h-10 bg-[#FAD02C]/20 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-xl">💡</span>
                    </div>
                    <div>
                        <h3 className="font-black text-sm uppercase text-black">Canjeá tus puntos en el carrito</h3>
                        <p className="text-xs font-bold text-stone-500">
                            Tus puntos acumulados se pueden canjear como descuento directo en el total de tu compra.
                            Agregá productos al carrito y aplicá tus puntos al finalizar.
                        </p>
                    </div>
                </div>

                {/* Lista de recompensas */}
                {recompensas.length === 0 ? (
                    <div className="bg-white border-4 border-black p-12 rounded-4xl shadow-[8px_8px_0px_0px_black] text-center">
                        <span className="text-6xl block mb-4">🎁</span>
                        <h3 className="font-black text-2xl uppercase">No hay recompensas</h3>
                        <p className="text-stone-400 font-bold mt-2">Pronto tendremos nuevas recompensas para vos 🎉</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {recompensas.map((recompensa, index) => {
                            const disponible = puntosDisponibles >= recompensa.puntos_necesarios;
                            const color = getColorPorTipo(recompensa.tipo);

                            return (
                                <motion.div
                                    key={recompensa.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`bg-white border-4 rounded-4xl shadow-[6px_6px_0px_0px_black] p-4 md:p-6 transition-all ${disponible
                                        ? 'border-black hover:shadow-[8px_8px_0px_0px_#D32F2F]'
                                        : 'border-stone-200 opacity-60'
                                        }`}
                                >
                                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                                        {/* Icono */}
                                        <div
                                            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 border-2 border-black"
                                            style={{ backgroundColor: `${color}15`, borderColor: color }}
                                        >
                                            {getIconoPorTipo(recompensa.tipo)}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <h3 className="font-black text-lg text-black">
                                                    {recompensa.nombre}
                                                </h3>
                                                <span
                                                    className="text-xs font-bold px-3 py-1 rounded-full border-2"
                                                    style={{ color: color, borderColor: color }}
                                                >
                                                    {recompensa.tipo === 'DESCUENTO' && `${recompensa.valor_descuento}% OFF`}
                                                    {recompensa.tipo === 'PRODUCTO_GRATIS' && 'Producto Gratis'}
                                                    {recompensa.tipo === 'ENVIO_GRATIS' && 'Envío Gratis'}
                                                </span>
                                            </div>
                                            <p className="text-sm font-bold text-stone-500 mt-1">
                                                {recompensa.descripcion}
                                            </p>
                                        </div>

                                        {/* Acción */}
                                        <div className="flex flex-col items-end gap-2 min-w-35">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-stone-400">⭐</span>
                                                <span className={`font-black text-lg ${disponible ? 'text-[#FAD02C]' : 'text-stone-400'}`}>
                                                    {recompensa.puntos_necesarios} pts
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    if (disponible) {
                                                        setRecompensaSeleccionada(recompensa);
                                                        setMostrarModal(true);
                                                    } else {
                                                        toast.error('❌ Puntos insuficientes', {
                                                            duration: 3000,
                                                            icon: '🔒',
                                                        });
                                                    }
                                                }}
                                                disabled={!disponible || canjeando}
                                                className={`w-full font-black py-2 px-4 rounded-xl border-2 border-black text-sm transition-all shadow-[3px_3px_0px_0px_black] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 ${disponible
                                                    ? 'bg-[#FFCA28] hover:bg-black hover:text-white'
                                                    : 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none'
                                                    }`}
                                            >
                                                {canjeando ? '⏳ Canjeando...' : disponible ? '🔓 Canjear' : '🔒 Bloqueado'}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {/* Botón volver */}
                <div className="mt-8 text-center">
                    <Link href="/">
                        <button className="bg-white border-4 border-black px-6 py-3 rounded-2xl font-black text-sm shadow-[4px_4px_0px_0px_black] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
                            🏠 Volver al Menú
                        </button>
                    </Link>
                </div>
            </div>

            {/* Modal de confirmación */}
            <AnimatePresence>
                {mostrarModal && recompensaSeleccionada && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white border-4 border-black rounded-4xl max-w-md w-full p-6 shadow-[12px_12px_0px_0px_black]"
                        >
                            <div className="text-center mb-6">
                                <span className="text-6xl block mb-4">🎁</span>
                                <h2 className="font-black text-2xl uppercase text-black">Confirmar Canje</h2>
                                <p className="font-bold text-stone-600 mt-2">
                                    Usar <span className="text-[#FAD02C]">{recompensaSeleccionada.puntos_necesarios} pts</span> por:
                                </p>
                                <p className="font-black text-lg text-black mt-1">
                                    "{recompensaSeleccionada.nombre}"
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setMostrarModal(false)}
                                    className="flex-1 bg-stone-100 border-2 border-black rounded-xl py-3 font-black text-sm hover:bg-stone-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleCanjear}
                                    disabled={canjeando}
                                    className="flex-1 bg-[#FFCA28] border-2 border-black rounded-xl py-3 font-black text-sm hover:bg-black hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {canjeando ? (
                                        <>
                                            <span className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent"></span>
                                            Procesando...
                                        </>
                                    ) : (
                                        '✅ Canjear'
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}