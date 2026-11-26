// app/admin/sugerencias/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Sugerencia {
    id: string;
    tipo: 'mejora' | 'bug' | 'sugerencia' | 'otro';
    titulo: string;
    descripcion: string;
    email: string | null;
    usuario_id: string | null;
    pagina: string | null;
    estado: 'pendiente' | 'en_revision' | 'resuelto' | 'rechazado';
    created_at: string;
    updated_at: string;
}

const ESTADOS = [
    { value: 'pendiente', label: '⏳ Pendiente', color: 'bg-yellow-100 border-yellow-400 text-yellow-800' },
    { value: 'en_revision', label: '🔍 En revisión', color: 'bg-blue-100 border-blue-400 text-blue-800' },
    { value: 'resuelto', label: '✅ Resuelto', color: 'bg-green-100 border-green-400 text-green-800' },
    { value: 'rechazado', label: '❌ Rechazado', color: 'bg-red-100 border-red-400 text-red-800' },
] as const;

const TIPOS_LABEL: Record<Sugerencia['tipo'], string> = {
    mejora: '✨ Mejora',
    bug: '🐛 Bug',
    sugerencia: '💡 Sugerencia',
    otro: '📝 Otro',
};

export default function AdminSugerenciasPage() {
    const router = useRouter();
    const { perfil, isAuthenticated, cargando } = useAuthStore();

    const [sugerencias, setSugerencias] = useState<Sugerencia[]>([]);
    const [loading, setLoading] = useState(false);  // ✅ false, no true
    const [filtroEstado, setFiltroEstado] = useState<string>('todos');
    const [filtroTipo, setFiltroTipo] = useState<string>('todos');
    const [busqueda, setBusqueda] = useState('');
    const [expandida, setExpandida] = useState<string | null>(null);
    const [actualizando, setActualizando] = useState<string | null>(null);

    // ============================================================
    // 🔐 GUARD: solo admin
    // ============================================================
    useEffect(() => {
        if (cargando) return;

        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        if (perfil?.rol !== 'admin') {
            toast.error('No tenés permisos para ver esta página');
            router.push('/');
        }
    }, [cargando, isAuthenticated, perfil, router]);

    // ============================================================
    // 📥 CARGAR SUGERENCIAS
    // ============================================================
    const cargarSugerencias = useCallback(async () => {
        try {
            setLoading(true);

            const { data, error } = await supabase
                .from('sugerencias')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            setSugerencias(data || []);
        } catch (err: any) {
            console.error('Error cargando sugerencias:', err);
            toast.error('No pudimos cargar las sugerencias');
        } finally {
            setLoading(false);
        }
    }, []);

    // ✅ Ahora el fetch depende de que el auth esté listo
    useEffect(() => {
        if (cargando) return;
        if (!isAuthenticated || perfil?.rol !== 'admin') return;

        cargarSugerencias();
    }, [cargando, isAuthenticated, perfil?.rol, cargarSugerencias]);

    // ============================================================
    // 🔄 CAMBIAR ESTADO (mejorado)
    // ============================================================
    const cambiarEstado = async (id: string, nuevoEstado: Sugerencia['estado']) => {
        // Optimistic update
        const estadoAnterior = sugerencias.find((s) => s.id === id)?.estado;

        setSugerencias((prev) =>
            prev.map((s) => (s.id === id ? { ...s, estado: nuevoEstado } : s))
        );
        setActualizando(id);

        try {
            const { data, error } = await supabase
                .from('sugerencias')
                .update({ estado: nuevoEstado })
                .eq('id', id)
                .select();

            if (error) throw error;

            if (!data || data.length === 0) {
                throw new Error('No se pudo actualizar. Verificá permisos.');
            }

            // Actualizar con datos reales de la DB
            setSugerencias((prev) =>
                prev.map((s) => (s.id === id ? { ...s, ...data[0] } : s))
            );
            toast.success('Estado actualizado');
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || 'No pudimos actualizar el estado');

            // Rollback
            if (estadoAnterior) {
                setSugerencias((prev) =>
                    prev.map((s) => (s.id === id ? { ...s, estado: estadoAnterior } : s))
                );
            }
        } finally {
            setActualizando(null);
        }
    };

    // ============================================================
    // 📊 MÉTRICAS
    // ============================================================
    const metricas = {
        total: sugerencias.length,
        pendientes: sugerencias.filter((s) => s.estado === 'pendiente').length,
        enRevision: sugerencias.filter((s) => s.estado === 'en_revision').length,
        resueltos: sugerencias.filter((s) => s.estado === 'resuelto').length,
        bugs: sugerencias.filter((s) => s.tipo === 'bug').length,
    };

    // ============================================================
    // 🔍 FILTROS
    // ============================================================
    const filtradas = sugerencias.filter((s) => {
        if (filtroEstado !== 'todos' && s.estado !== filtroEstado) return false;
        if (filtroTipo !== 'todos' && s.tipo !== filtroTipo) return false;
        if (busqueda) {
            const q = busqueda.toLowerCase();
            return (
                s.titulo.toLowerCase().includes(q) ||
                s.descripcion.toLowerCase().includes(q) ||
                s.email?.toLowerCase().includes(q)
            );
        }
        return true;
    });

    // ============================================================
    // 🎨 RENDER
    // ============================================================
    // ✅ Spinner solo si el auth está cargando O la data está cargando
    if (cargando || loading) {
        return (
            <div className="min-h-dvh bg-white flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#FFCA28] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (perfil?.rol !== 'admin') return null;

    return (
        <main className="min-h-dvh bg-[#fafafa] pb-32">
            {/* HEADER */}
            <header className="bg-white border-b-4 border-black py-6 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <div className="inline-block bg-[#FFCA28] text-black text-[10px] font-black uppercase px-3 py-1 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_black] mb-2">
                                🔐 Panel Admin
                            </div>
                            <h1 className="font-krusty text-3xl sm:text-4xl text-black uppercase">
                                Sugerencias
                            </h1>
                            <p className="text-xs font-bold text-stone-500 mt-1">
                                Reportes de bugs, mejoras y sugerencias de los clientes
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={cargarSugerencias}
                                disabled={loading}
                                className="px-4 py-2 bg-white border-2 border-black rounded-xl font-black text-xs uppercase shadow-[3px_3px_0px_0px_black] hover:translate-x-px hover:translate-y-px hover:shadow-none transition-all disabled:opacity-50"
                            >
                                🔄 Recargar
                            </button>
                            <Link
                                href="/admin"
                                className="px-4 py-2 bg-white border-2 border-black rounded-xl font-black text-xs uppercase shadow-[3px_3px_0px_0px_black] hover:translate-x-px hover:translate-y-px hover:shadow-none transition-all"
                            >
                                ← Admin
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-6 mt-6">
                {/* MÉTRICAS */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
                    <div className="bg-white border-2 border-black rounded-2xl p-4 text-center">
                        <p className="text-2xl font-black">{metricas.total}</p>
                        <p className="text-[10px] font-black uppercase text-stone-500">Total</p>
                    </div>
                    <div className="bg-yellow-50 border-2 border-yellow-400 rounded-2xl p-4 text-center">
                        <p className="text-2xl font-black text-yellow-800">{metricas.pendientes}</p>
                        <p className="text-[10px] font-black uppercase text-yellow-700">Pendientes</p>
                    </div>
                    <div className="bg-blue-50 border-2 border-blue-400 rounded-2xl p-4 text-center">
                        <p className="text-2xl font-black text-blue-800">{metricas.enRevision}</p>
                        <p className="text-[10px] font-black uppercase text-blue-700">En revisión</p>
                    </div>
                    <div className="bg-green-50 border-2 border-green-400 rounded-2xl p-4 text-center">
                        <p className="text-2xl font-black text-green-800">{metricas.resueltos}</p>
                        <p className="text-[10px] font-black uppercase text-green-700">Resueltos</p>
                    </div>
                    <div className="bg-red-50 border-2 border-red-400 rounded-2xl p-4 text-center">
                        <p className="text-2xl font-black text-red-800">{metricas.bugs}</p>
                        <p className="text-[10px] font-black uppercase text-red-700">Bugs</p>
                    </div>
                </div>

                {/* FILTROS */}
                <div className="bg-white border-2 border-black rounded-2xl p-4 mb-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                            <label className="block text-[10px] font-black uppercase text-stone-400 mb-1">
                                Buscar
                            </label>
                            <input
                                type="text"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                placeholder="Título, descripción o email..."
                                className="w-full bg-stone-50 border-2 border-black p-2 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-[#FFCA28]/50"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-stone-400 mb-1">
                                Estado
                            </label>
                            <select
                                value={filtroEstado}
                                onChange={(e) => setFiltroEstado(e.target.value)}
                                className="bg-stone-50 border-2 border-black p-2 rounded-xl font-bold text-sm outline-none"
                            >
                                <option value="todos">Todos</option>
                                {ESTADOS.map((e) => (
                                    <option key={e.value} value={e.value}>{e.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-stone-400 mb-1">
                                Tipo
                            </label>
                            <select
                                value={filtroTipo}
                                onChange={(e) => setFiltroTipo(e.target.value)}
                                className="bg-stone-50 border-2 border-black p-2 rounded-xl font-bold text-sm outline-none"
                            >
                                <option value="todos">Todos</option>
                                {Object.entries(TIPOS_LABEL).map(([value, label]) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* LISTA */}
                {filtradas.length === 0 ? (
                    <div className="bg-white border-2 border-black rounded-2xl p-12 text-center">
                        <span className="text-6xl block mb-4">🍔</span>
                        <p className="font-krusty text-2xl uppercase text-black">
                            No hay sugerencias
                        </p>
                        <p className="text-sm text-stone-500 mt-2">
                            {busqueda || filtroEstado !== 'todos' || filtroTipo !== 'todos'
                                ? 'Probá con otros filtros'
                                : 'Cuando llegue la primera, la vas a ver acá'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtradas.map((sugerencia) => {
                            const estadoConfig = ESTADOS.find((e) => e.value === sugerencia.estado);
                            const estaExpandida = expandida === sugerencia.id;

                            return (
                                <div
                                    key={sugerencia.id}
                                    className="bg-white border-2 border-black rounded-2xl overflow-hidden shadow-[3px_3px_0px_0px_black]"
                                >
                                    <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <span className="text-[10px] font-black uppercase bg-stone-100 border border-stone-300 px-2 py-0.5 rounded-full">
                                                    {TIPOS_LABEL[sugerencia.tipo]}
                                                </span>
                                                <span className={`text-[10px] font-black uppercase border-2 px-2 py-0.5 rounded-full ${estadoConfig?.color}`}>
                                                    {estadoConfig?.label}
                                                </span>
                                                <span className="text-[10px] text-stone-400 font-bold">
                                                    {new Date(sugerencia.created_at).toLocaleDateString('es-AR', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </span>
                                            </div>
                                            <h3 className="font-black text-sm sm:text-base break-words">
                                                {sugerencia.titulo}
                                            </h3>
                                            <p className={`text-xs text-stone-500 mt-1 ${estaExpandida ? '' : 'line-clamp-1'}`}>
                                                {sugerencia.descripcion}
                                            </p>
                                            {sugerencia.email && (
                                                <p className="text-[10px] text-stone-400 mt-1">
                                                    📧 {sugerencia.email}
                                                </p>
                                            )}
                                            {sugerencia.pagina && (
                                                <p className="text-[10px] text-stone-400">
                                                    📍 {sugerencia.pagina}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={() => setExpandida(estaExpandida ? null : sugerencia.id)}
                                                className="px-3 py-2 bg-stone-100 border-2 border-black rounded-xl font-black text-[10px] uppercase hover:bg-stone-200 transition-all"
                                            >
                                                {estaExpandida ? '▲ Menos' : '▼ Ver todo'}
                                            </button>
                                            <select
                                                value={sugerencia.estado}
                                                onChange={(e) => cambiarEstado(sugerencia.id, e.target.value as Sugerencia['estado'])}
                                                disabled={actualizando === sugerencia.id}
                                                className="bg-white border-2 border-black rounded-xl px-2 py-2 font-black text-[10px] uppercase cursor-pointer disabled:opacity-50"
                                            >
                                                {ESTADOS.map((e) => (
                                                    <option key={e.value} value={e.value}>{e.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {estaExpandida && (
                                        <div className="border-t-2 border-stone-200 bg-stone-50 p-4">
                                            <p className="text-[10px] font-black uppercase text-stone-400 mb-1">
                                                Descripción completa
                                            </p>
                                            <p className="text-sm text-stone-700 whitespace-pre-wrap break-words">
                                                {sugerencia.descripcion}
                                            </p>
                                            <div className="flex flex-wrap gap-3 mt-3 text-[10px] text-stone-400 font-bold">
                                                <span>ID: {sugerencia.id.slice(0, 8)}...</span>
                                                {sugerencia.usuario_id && (
                                                    <span>Usuario: {sugerencia.usuario_id.slice(0, 8)}...</span>
                                                )}
                                                {sugerencia.updated_at !== sugerencia.created_at && (
                                                    <span>
                                                        Actualizado: {new Date(sugerencia.updated_at).toLocaleDateString('es-AR')}
                                                    </span>
                                                )}
                                            </div>
                                            {sugerencia.email && (
                                                <a
                                                    href={`mailto:${sugerencia.email}?subject=Re: ${encodeURIComponent(sugerencia.titulo)}`}
                                                    className="inline-block mt-3 px-3 py-2 bg-[#FFCA28] border-2 border-black rounded-xl font-black text-[10px] uppercase shadow-[2px_2px_0px_0px_black] hover:translate-x-px hover:translate-y-px hover:shadow-none transition-all"
                                                >
                                                    ✉️ Responder por email
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}