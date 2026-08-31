// app/admin/pedidos/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

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
    id_de_usuario: string | null;
    costo_envio: number;
    resumenes_de_elementos: string;
}

export default function AdminPedidos() {
    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [cargando, setCargando] = useState(true);
    const [procesando, setProcesando] = useState<number | null>(null);
    const [filtro, setFiltro] = useState('todos');
    const [stats, setStats] = useState({
        total: 0,
        pendientes: 0,
        entregados: 0,
        totalRecaudado: 0,
    });

    useEffect(() => {
        cargarPedidos();
    }, [filtro]);

    const cargarPedidos = async () => {
        setCargando(true);
        try {
            let query = supabase
                .from('pedidos')
                .select('*')
                .order('creado_en', { ascending: false });

            if (filtro === 'pendientes') {
                query = query.in('estado', ['pendiente', 'pago_pendiente']);
            } else if (filtro === 'entregados') {
                query = query.eq('estado', 'entregado');
            } else if (filtro === 'en_camino') {
                query = query.eq('estado', 'en camino');
            }

            const { data, error } = await query;

            if (error) throw error;

            const pedidosData = data || [];
            setPedidos(pedidosData);

            const pendientes = pedidosData.filter((p: Pedido) =>
                p.estado === 'pendiente' || p.estado === 'pago_pendiente'
            );
            const entregados = pedidosData.filter((p: Pedido) => p.estado === 'entregado');
            const totalRecaudado = entregados.reduce((sum: number, p: Pedido) => sum + (p.total || 0), 0);

            setStats({
                total: pedidosData.length,
                pendientes: pendientes.length,
                entregados: entregados.length,
                totalRecaudado: totalRecaudado,
            });

        } catch (error) {
            console.error('Error cargando pedidos:', error);
        } finally {
            setCargando(false);
        }
    };

    const handleMarcarEntregado = async (pedido: Pedido) => {
        if (!confirm(`¿Marcar el pedido #${pedido.id} como entregado?`)) return;

        setProcesando(pedido.id);

        try {
            // 1️⃣ Marcar como entregado
            const { error: updateError } = await supabase
                .from('pedidos')
                .update({ estado: 'entregado' })
                .eq('id', pedido.id);

            if (updateError) throw updateError;

            // 2️⃣ Otorgar puntos automáticamente (el trigger lo hace)
            const puntos = Math.floor(pedido.total / 100);

            if (puntos > 0 && pedido.id_de_usuario) {
                alert(`✅ Pedido #${pedido.id} entregado! ${puntos} puntos otorgados.`);
            } else if (puntos === 0) {
                alert(`✅ Pedido #${pedido.id} entregado! (Total menor a $100, sin puntos)`);
            } else {
                alert(`✅ Pedido #${pedido.id} entregado!`);
            }

            // 3️⃣ Recargar lista
            await cargarPedidos();

        } catch (error) {
            console.error('Error al marcar como entregado:', error);
            alert('❌ Error al procesar el pedido');
        } finally {
            setProcesando(null);
        }
    };

    const getEstadoColor = (estado: string) => {
        const colores: Record<string, string> = {
            pendiente: 'bg-yellow-500',
            pago_pendiente: 'bg-orange-400',
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
            'en camino': '🚲 En Camino',
            entregado: '✅ Entregado',
            cancelado: '❌ Cancelado'
        };
        return labels[estado] || estado;
    };

    if (cargando) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#D32F2F] border-t-transparent mx-auto mb-4"></div>
                    <p className="text-stone-500 font-bold">Cargando pedidos...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-black text-stone-900">📋 Gestión de Pedidos</h1>
                    <p className="text-stone-500 text-sm">{stats.total} pedidos totales</p>
                </div>
                <button
                    onClick={cargarPedidos}
                    className="bg-[#D32F2F] hover:bg-stone-900 text-white font-bold py-2 px-4 rounded-xl transition-colors text-sm"
                >
                    🔄 Actualizar
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
                    <p className="text-2xl font-black text-stone-900">{stats.total}</p>
                    <p className="text-xs font-bold text-stone-400 uppercase">Total</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
                    <p className="text-2xl font-black text-yellow-500">{stats.pendientes}</p>
                    <p className="text-xs font-bold text-stone-400 uppercase">Pendientes</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
                    <p className="text-2xl font-black text-green-500">{stats.entregados}</p>
                    <p className="text-xs font-bold text-stone-400 uppercase">Entregados</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-stone-100">
                    <p className="text-2xl font-black text-[#FAD02C]">${stats.totalRecaudado.toFixed(0)}</p>
                    <p className="text-xs font-bold text-stone-400 uppercase">Recaudado</p>
                </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap gap-2 mb-6">
                {[
                    { value: 'todos', label: '📋 Todos' },
                    { value: 'pendientes', label: '⏳ Pendientes' },
                    { value: 'en_camino', label: '🚲 En Camino' },
                    { value: 'entregados', label: '✅ Entregados' },
                ].map((f) => (
                    <button
                        key={f.value}
                        onClick={() => setFiltro(f.value)}
                        className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${filtro === f.value
                                ? 'bg-stone-900 text-white'
                                : 'bg-white text-stone-600 hover:bg-stone-200 border border-stone-200'
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Lista de pedidos */}
            <div className="grid gap-4">
                {pedidos.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-stone-200">
                        <p className="text-4xl mb-2">📭</p>
                        <p className="text-stone-400 font-bold">No hay pedidos para mostrar</p>
                    </div>
                ) : (
                    pedidos.map((pedido) => (
                        <div
                            key={pedido.id}
                            className="bg-white rounded-2xl p-4 md:p-6 shadow-md border border-stone-100 hover:shadow-lg transition-shadow"
                        >
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <h3 className="text-lg font-black text-stone-900">
                                            Pedido #{pedido.id}
                                        </h3>
                                        <span className={`px-3 py-1 rounded-full text-white text-xs font-bold ${getEstadoColor(pedido.estado)}`}>
                                            {getEstadoLabel(pedido.estado)}
                                        </span>
                                    </div>
                                    <p className="font-bold text-stone-700 mt-1">👤 {pedido.cliente_nombre || 'Cliente'}</p>
                                    <p className="text-sm text-stone-500 truncate">📍 {pedido.direccion || 'Sin dirección'}</p>
                                    <p className="text-sm text-stone-500">📱 {pedido.telefono || 'Sin teléfono'}</p>
                                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-stone-400">
                                        <span>💳 {pedido.metodo_pago}</span>
                                        <span>🚚 {pedido.tipo_entrega}</span>
                                        {pedido.costo_envio > 0 && <span>🛵 ${pedido.costo_envio.toFixed(2)}</span>}
                                        <span>🕐 {new Date(pedido.creado_en).toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-2 min-w-30">
                                    <p className="text-2xl font-black text-[#D32F2F]">${pedido.total?.toFixed(2)}</p>

                                    {pedido.estado !== 'entregado' && pedido.estado !== 'cancelado' && (
                                        <button
                                            onClick={() => handleMarcarEntregado(pedido)}
                                            disabled={procesando === pedido.id}
                                            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                        >
                                            {procesando === pedido.id ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                                                    Procesando...
                                                </span>
                                            ) : (
                                                '✅ Marcar Entregado'
                                            )}
                                        </button>
                                    )}

                                    {pedido.estado === 'entregado' && (
                                        <span className="text-sm font-bold text-green-500">✅ Entregado</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}