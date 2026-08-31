// app/pedidos/page.tsx - CON NUMERACIÓN POR USUARIO
"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';

interface Pedido {
    id: number;
    cliente_nombre: string;
    direccion: string;
    telefono: string;
    total: number;
    estado: string;
    metodo_pago: string;
    tipo_entrega: string;
    creado_en: string;
    resumenes_de_elementos: string;
    costo_envio: number;
    total_parcial: number;
    puntos_usados: number;
    id_de_usuario: string;
}

export default function MisPedidos() {
    const router = useRouter();
    const { perfil, sesion, cargando: authCargando } = useAuth();
    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [cargandoPedidos, setCargandoPedidos] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filtro, setFiltro] = useState('todos');

    useEffect(() => {
        const cargarPedidos = async () => {
            if (authCargando) {
                console.log('⏳ Esperando autenticación...');
                return;
            }

            if (!sesion?.user) {
                setError('⚠️ Debes iniciar sesión para ver tus pedidos.');
                setCargandoPedidos(false);
                return;
            }

            setCargandoPedidos(true);
            setError(null);

            try {
                const userId = sesion.user.id;
                console.log('🔍 Buscando pedidos para el usuario:', userId);

                const { data, error } = await supabase
                    .from('pedidos')
                    .select('*')
                    .eq('id_de_usuario', userId)
                    .order('creado_en', { ascending: false });

                if (error) {
                    console.error('Error cargando pedidos:', error);
                    setError('❌ Error al cargar tus pedidos. Intentá nuevamente.');
                    setCargandoPedidos(false);
                    return;
                }

                console.log('📦 Pedidos encontrados:', data?.length || 0);
                setPedidos(data || []);
            } catch (error) {
                console.error('Error:', error);
                setError('❌ Error al conectar con el servidor.');
            } finally {
                setCargandoPedidos(false);
            }
        };

        cargarPedidos();
    }, [sesion, authCargando]);

    // ✅ Función para obtener el número de pedido por usuario (secuencial)
    // Los pedidos están ordenados del más nuevo al más viejo,
    // así que el número es: (total - índice)
    const getNumeroPedidoUsuario = (index: number, total: number) => {
        return total - index; // El más nuevo es el #total, el más viejo es el #1
    };

    const getEstadoColor = (estado: string) => {
        const colores: Record<string, string> = {
            pendiente: 'bg-yellow-500',
            pago_pendiente: 'bg-orange-400',
            'en cocina': 'bg-purple-500',
            'en camino': 'bg-blue-500',
            entregado: 'bg-green-500',
            cancelado: 'bg-red-500'
        };
        return colores[estado] || 'bg-gray-500';
    };

    const getEstadoLabel = (estado: string) => {
        const labels: Record<string, string> = {
            pendiente: '⏳ Pendiente',
            pago_pendiente: '💳 Pago Pendiente',
            'en cocina': '👨‍🍳 En Cocina',
            'en camino': '🚲 En Camino',
            entregado: '✅ Entregado',
            cancelado: '❌ Cancelado'
        };
        return labels[estado] || estado;
    };

    const getEstadoIcono = (estado: string) => {
        const iconos: Record<string, string> = {
            pendiente: '📩',
            pago_pendiente: '💳',
            'en cocina': '👨‍🍳',
            'en camino': '🛵',
            entregado: '🍔',
            cancelado: '❌'
        };
        return iconos[estado] || '📦';
    };

    const pedidosFiltrados = pedidos.filter(pedido => {
        if (filtro === 'todos') return true;
        if (filtro === 'activos') {
            return ['pendiente', 'pago_pendiente', 'en cocina', 'en camino'].includes(pedido.estado);
        }
        if (filtro === 'entregados') {
            return pedido.estado === 'entregado';
        }
        return true;
    });

    if (authCargando) {
        return (
            <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-6">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-8 border-[#FFCA28] border-t-[#D32F2F] mx-auto mb-6" />
                    <p className="font-black text-stone-500 uppercase text-sm">Verificando sesión...</p>
                </div>
            </div>
        );
    }

    if (cargandoPedidos) {
        return (
            <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-6">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-8 border-[#FFCA28] border-t-[#D32F2F] mx-auto mb-6" />
                    <p className="font-black text-stone-500 uppercase text-sm">Cargando tus pedidos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fafafa] pb-24">
            <div className="bg-white border-b-4 border-black pt-8 pb-6 px-6">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="font-black text-3xl text-black uppercase tracking-tighter">
                            📦 Mis Pedidos
                        </h1>
                        <p className="text-sm font-bold text-stone-400">
                            {pedidos.length} pedidos totales
                        </p>
                    </div>
                    <Link href="/perfil">
                        <button className="bg-[#FFCA28] border-4 border-black px-4 py-2 rounded-xl font-black text-xs shadow-[4px_4px_0px_0px_black] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
                            ← Volver al Perfil
                        </button>
                    </Link>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-6">
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {[
                        { value: 'todos', label: '📋 Todos' },
                        { value: 'activos', label: '🔄 Activos' },
                        { value: 'entregados', label: '✅ Entregados' },
                    ].map((f) => (
                        <button
                            key={f.value}
                            onClick={() => setFiltro(f.value)}
                            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${filtro === f.value
                                    ? 'bg-black text-white border-2 border-black'
                                    : 'bg-white text-stone-600 border-2 border-stone-200 hover:border-stone-400'
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {error ? (
                    <div className="bg-red-50 border-4 border-red-500 p-6 rounded-2xl text-center">
                        <p className="text-red-600 font-bold">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 bg-red-500 text-white font-black px-6 py-2 rounded-xl border-2 border-red-700 hover:bg-red-600 transition-colors"
                        >
                            Reintentar
                        </button>
                        <Link href="/login">
                            <button className="mt-2 ml-2 bg-[#FFCA28] text-black font-black px-6 py-2 rounded-xl border-2 border-black hover:bg-black hover:text-white transition-colors">
                                Iniciar Sesión
                            </button>
                        </Link>
                    </div>
                ) : pedidosFiltrados.length === 0 ? (
                    <div className="bg-white border-4 border-black p-12 rounded-4xl shadow-[8px_8px_0px_0px_black] text-center">
                        <span className="text-6xl block mb-4">📭</span>
                        <h3 className="font-black text-2xl uppercase">No hay pedidos</h3>
                        <p className="text-stone-400 font-bold mt-2">
                            {filtro === 'todos'
                                ? 'Todavía no hiciste ningún pedido.'
                                : filtro === 'activos'
                                    ? 'No tenés pedidos activos.'
                                    : 'No tenés pedidos entregados.'}
                        </p>
                        <Link href="/">
                            <button className="mt-6 bg-[#D32F2F] text-white font-black px-8 py-3 rounded-full border-4 border-black shadow-[6px_6px_0px_0px_black] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
                                🍔 Hacer un pedido
                            </button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {pedidosFiltrados.map((pedido, index) => {
                            // ✅ Calcular el número de pedido para este usuario
                            // Como están ordenados del más nuevo al más viejo,
                            // el más nuevo es el #total, el más viejo es el #1
                            const numeroPedido = pedidosFiltrados.length - index;

                            return (
                                <motion.div
                                    key={pedido.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-white border-4 border-black rounded-4xl shadow-[6px_6px_0px_0px_black] p-4 md:p-6 hover:shadow-[8px_8px_0px_0px_#D32F2F] transition-shadow"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <span className="text-2xl">{getEstadoIcono(pedido.estado)}</span>
                                                <h3 className="font-black text-lg text-black">
                                                    {/* ✅ NÚMERO DE PEDIDO SECUENCIAL POR USUARIO */}
                                                    Pedido #{numeroPedido}
                                                </h3>
                                                <span className={`px-3 py-1 rounded-full text-white text-xs font-bold ${getEstadoColor(pedido.estado)}`}>
                                                    {getEstadoLabel(pedido.estado)}
                                                </span>
                                            </div>

                                            <p className="text-sm text-stone-500 mt-1 truncate">
                                                📍 {pedido.direccion || 'Sin dirección'}
                                            </p>

                                            <div className="flex flex-wrap gap-3 mt-1 text-xs text-stone-400">
                                                <span>💳 {pedido.metodo_pago?.includes('Mercado Pago') ? 'Mercado Pago' : pedido.metodo_pago}</span>
                                                <span>🚚 {pedido.tipo_entrega === 'Delivery' ? 'Delivery' : 'Retiro'}</span>
                                                <span>🕐 {new Date(pedido.creado_en).toLocaleString()}</span>
                                            </div>

                                            {pedido.resumenes_de_elementos && (
                                                <p className="text-xs text-stone-400 mt-1 truncate">
                                                    🍔 {pedido.resumenes_de_elementos}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex flex-col items-end gap-2 min-w-30">
                                            <p className="text-2xl font-black text-[#D32F2F]">
                                                ${pedido.total?.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                            </p>

                                            {pedido.estado === 'entregado' && (
                                                <span className="text-xs font-bold text-green-500">
                                                    ⭐ {Math.floor(pedido.total / 100)} pts ganados
                                                </span>
                                            )}

                                            <Link href={`/pedido/${pedido.id}`}>
                                                <button className="w-full bg-[#FFCA28] hover:bg-black hover:text-white font-black py-2 px-4 rounded-xl border-2 border-black text-xs transition-all shadow-[3px_3px_0px_0px_black] active:shadow-none active:translate-x-0.5 active:translate-y-0.5">
                                                    Ver seguimiento
                                                </button>
                                            </Link>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                <div className="mt-8 text-center">
                    <Link href="/">
                        <button className="bg-white border-4 border-black px-6 py-3 rounded-2xl font-black text-sm shadow-[4px_4px_0px_0px_black] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
                            🏠 Volver al Menú
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}