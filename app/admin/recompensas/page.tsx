// app/admin/recompensas/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import ModalRecompensa from '../ModalRecompensa';

interface Recompensa {
    id: number;
    nombre: string;
    descripcion: string;
    puntos_necesarios: number;
    tipo: 'DESCUENTO' | 'PRODUCTO_GRATIS' | 'ENVIO_GRATIS';
    valor_descuento: number;
    activa: boolean;
    created_at?: string;
}

export default function AdminRecompensas() {
    const router = useRouter();
    const { perfil, user } = useAuthStore();
    const [recompensas, setRecompensas] = useState<Recompensa[]>([]);
    const [cargando, setCargando] = useState(true);
    const [modalAbierto, setModalAbierto] = useState(false);
    const [recompensaEditando, setRecompensaEditando] = useState<Recompensa | null>(null);
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        // Verificar que sea admin
        if (perfil?.rol !== 'admin') {
            router.push('/admin/login');
            return;
        }
        cargarRecompensas();
    }, [perfil]);

    const cargarRecompensas = async () => {
        setCargando(true);
        try {
            const { data, error } = await supabase
                .from('recompensas')
                .select('*')
                .order('id', { ascending: false });

            if (error) throw error;
            setRecompensas(data || []);
        } catch (error) {
            console.error('Error cargando recompensas:', error);
            toast.error('Error al cargar las recompensas');
        } finally {
            setCargando(false);
        }
    };

    const handleGuardar = async (datos: any) => {
        setGuardando(true);
        try {
            let error = null;

            if (recompensaEditando) {
                const { error: updateError } = await supabase
                    .from('recompensas')
                    .update({
                        ...datos,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', recompensaEditando.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('recompensas')
                    .insert([{
                        ...datos,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    }]);
                error = insertError;
            }

            if (error) throw error;

            toast.success(`Recompensa ${recompensaEditando ? 'actualizada' : 'creada'} correctamente`);
            setModalAbierto(false);
            setRecompensaEditando(null);
            await cargarRecompensas();
        } catch (error: any) {
            console.error('Error guardando recompensa:', error);
            toast.error(error.message || 'Error al guardar la recompensa');
        } finally {
            setGuardando(false);
        }
    };

    const handleToggleActiva = async (id: number, estadoActual: boolean) => {
        try {
            const { error } = await supabase
                .from('recompensas')
                .update({
                    activa: !estadoActual,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id);

            if (error) throw error;
            await cargarRecompensas();
            toast.success(`Recompensa ${!estadoActual ? 'activada' : 'desactivada'}`);
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al cambiar el estado');
        }
    };

    const handleEliminar = async (id: number, nombre: string) => {
        if (!confirm(`¿Eliminar "${nombre}"?`)) return;

        try {
            // Verificar si tiene canjes asociados
            const { count, error: countError } = await supabase
                .from('canjes')
                .select('*', { count: 'exact', head: true })
                .eq('recompensa_id', id);

            if (countError) throw countError;

            if (count && count > 0) {
                toast.error(
                    `❌ No se puede eliminar "${nombre}" porque tiene ${count} canje${count > 1 ? 's' : ''} asociado${count > 1 ? 's' : ''}. Desactivá la recompensa en su lugar.`,
                    { duration: 5000 }
                );
                return;
            }

            const { error } = await supabase
                .from('recompensas')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast.success('Recompensa eliminada correctamente');
            await cargarRecompensas();
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al eliminar la recompensa');
        }
    };

    const getTipoLabel = (tipo: string) => {
        const tipos: Record<string, string> = {
            DESCUENTO: '💰 Descuento',
            PRODUCTO_GRATIS: '🍔 Producto Gratis',
            ENVIO_GRATIS: '🚚 Envío Gratis',
        };
        return tipos[tipo] || tipo;
    };

    const getTipoColor = (tipo: string) => {
        const colores: Record<string, string> = {
            DESCUENTO: 'text-[#F5C518]',
            PRODUCTO_GRATIS: 'text-[#43A047]',
            ENVIO_GRATIS: 'text-[#3949AB]',
        };
        return colores[tipo] || 'text-stone-400';
    };

    if (cargando) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FAD02C] border-t-transparent mx-auto mb-4" />
                    <p className="text-stone-500 font-bold">Cargando recompensas...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-black text-stone-900">🎁 Gestionar Recompensas</h1>
                    <p className="text-stone-500 text-sm">
                        {recompensas.length} {recompensas.length === 1 ? 'recompensa' : 'recompensas'}
                        {recompensas.filter(r => r.activa).length > 0 &&
                            ` · ${recompensas.filter(r => r.activa).length} activas`
                        }
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link href="/admin">
                        <button className="bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold py-2 px-4 rounded-xl transition-colors">
                            ← Panel
                        </button>
                    </Link>
                    <button
                        onClick={() => {
                            setRecompensaEditando(null);
                            setModalAbierto(true);
                        }}
                        className="bg-[#FAD02C] hover:bg-black hover:text-white font-black py-2 px-4 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_black] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all"
                    >
                        + Nueva Recompensa
                    </button>
                </div>
            </div>

            {/* Lista de recompensas */}
            <div className="grid gap-4">
                {recompensas.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-stone-200">
                        <p className="text-4xl mb-2">🎁</p>
                        <p className="text-stone-400 font-bold">No hay recompensas</p>
                        <p className="text-stone-400 text-sm">Crea tu primera recompensa</p>
                    </div>
                ) : (
                    recompensas.map((recompensa) => (
                        <motion.div
                            key={recompensa.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`bg-white border-4 rounded-2xl p-4 md:p-6 shadow-md transition-all ${recompensa.activa ? 'border-black' : 'border-stone-200 opacity-60'
                                }`}
                        >
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <h3 className="text-lg font-black text-stone-900">
                                            {recompensa.nombre}
                                        </h3>
                                        <span className={`text-xs font-bold px-3 py-1 rounded-full border-2 ${getTipoColor(recompensa.tipo)} border-current`}>
                                            {getTipoLabel(recompensa.tipo)}
                                        </span>
                                        {!recompensa.activa && (
                                            <span className="text-xs font-bold text-red-500 px-3 py-1 rounded-full border-2 border-red-500">
                                                ❌ Inactiva
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm font-bold text-stone-500 mt-1">
                                        {recompensa.descripcion || 'Sin descripción'}
                                    </p>
                                    <div className="flex items-center gap-4 mt-2">
                                        <span className="text-sm font-black text-[#FAD02C]">
                                            ⭐ {recompensa.puntos_necesarios} pts
                                        </span>
                                        {recompensa.valor_descuento > 0 && (
                                            <span className="text-sm font-bold text-[#43A047]">
                                                {recompensa.tipo === 'DESCUENTO' ? `-${recompensa.valor_descuento}%` : `$${recompensa.valor_descuento}`}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Toggle Activa/Inactiva */}
                                    <button
                                        onClick={() => handleToggleActiva(recompensa.id, recompensa.activa)}
                                        className={`w-12 h-7 rounded-full border-2 border-black transition-all ${recompensa.activa ? 'bg-[#43A047]' : 'bg-stone-300'
                                            }`}
                                    >
                                        <div
                                            className={`w-5 h-5 bg-white rounded-full border-2 border-black transition-all ${recompensa.activa ? 'translate-x-6' : 'translate-x-0'
                                                }`}
                                        />
                                    </button>

                                    {/* Editar */}
                                    <button
                                        onClick={() => {
                                            setRecompensaEditando(recompensa);
                                            setModalAbierto(true);
                                        }}
                                        className="bg-[#FAD02C]/20 hover:bg-[#FAD02C]/40 p-2 rounded-xl border-2 border-[#FAD02C]/30 transition-colors"
                                    >
                                        <span className="text-lg">✏️</span>
                                    </button>

                                    {/* Eliminar */}
                                    <button
                                        onClick={() => handleEliminar(recompensa.id, recompensa.nombre)}
                                        className="bg-red-500/20 hover:bg-red-500/40 p-2 rounded-xl border-2 border-red-500/30 transition-colors"
                                    >
                                        <span className="text-lg">🗑️</span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Modal */}
            <ModalRecompensa
                isOpen={modalAbierto}
                onClose={() => {
                    setModalAbierto(false);
                    setRecompensaEditando(null);
                }}
                onSave={handleGuardar}
                recompensa={recompensaEditando}
                loading={guardando}
            />
        </div>
    );
}