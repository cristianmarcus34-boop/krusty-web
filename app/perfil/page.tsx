// app/perfil/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useBeneficios } from '../hooks/useBeneficios';
import { obtenerNivel, ActividadReciente, Perfil } from '@/lib/tipos';
import { formatearPrecio } from '../../lib/formateador';
import { servicioEliminacionCuenta } from '../../services/servicioEliminacionCuenta';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

// ============================================================
// 🏠 COMPONENTE PRINCIPAL
// ============================================================
export default function PerfilPage() {
    const router = useRouter();
    const { perfil, sesion, cerrarSesion, actualizarPerfil, recargarPerfil } = useAuth();

    // ✅ Estado LOCAL para puntos
    const [puntosActuales, setPuntosActuales] = useState(0);
    const [cargandoPuntos, setCargandoPuntos] = useState(true);

    const { nivel, beneficios } = useBeneficios(
        puntosActuales,
        perfil?.id
    );

    // Estados
    const [totalPedidos, setTotalPedidos] = useState(0);
    const [totalGastado, setTotalGastado] = useState(0);
    const [totalCanjes, setTotalCanjes] = useState(0);
    const [actividadesRecientes, setActividadesRecientes] = useState<ActividadReciente[]>([]);
    const [ultimosCanjes, setUltimosCanjes] = useState<any[]>([]);
    const [cargando, setCargando] = useState(true);
    const [cargandoEstadisticas, setCargandoEstadisticas] = useState(true);
    const [modoEdicion, setModoEdicion] = useState(false);
    const [cargandoActualizacion, setCargandoActualizacion] = useState(false);
    const [imagenPerfil, setImagenPerfil] = useState<string | null>(null);

    // Estados del formulario
    const [telefono, setTelefono] = useState('');
    const [direccionCalle, setDireccionCalle] = useState('');
    const [direccionNumero, setDireccionNumero] = useState('');
    const [direccionPiso, setDireccionPiso] = useState('');
    const [direccionDepartamento, setDireccionDepartamento] = useState('');
    const [direccionBarrio, setDireccionBarrio] = useState('');
    const [direccionCiudad, setDireccionCiudad] = useState('');
    const [direccionCodigoPostal, setDireccionCodigoPostal] = useState('');
    const [preferenciasComida, setPreferenciasComida] = useState('');
    const [metodoPago, setMetodoPago] = useState('');

    // Estados para eliminación de cuenta
    const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false);
    const [passwordConfirmacion, setPasswordConfirmacion] = useState('');
    const [motivoEliminacion, setMotivoEliminacion] = useState('');
    const [cargandoEliminar, setCargandoEliminar] = useState(false);
    const [mostrarPassword, setMostrarPassword] = useState(false);
    const [tieneSolicitudEliminacion, setTieneSolicitudEliminacion] = useState(false);
    const [diasRestantes, setDiasRestantes] = useState(0);

    // ============================================================
    // 🎯 CARGAR PUNTOS DIRECTAMENTE DE LA DB
    // ============================================================
    const cargarPuntosDirectamente = async () => {
        if (!perfil?.id) {
            setCargandoPuntos(false);
            return;
        }

        try {
            console.log('🔄 Cargando puntos directamente de la DB...');
            const { data, error } = await supabase
                .from('perfiles')
                .select('puntos_acumulados')
                .eq('id', perfil.id)
                .single();

            if (error) {
                console.error('❌ Error cargando puntos:', error);
                return;
            }

            if (data) {
                console.log('✅ Puntos cargados:', data.puntos_acumulados);
                setPuntosActuales(data.puntos_acumulados);
            }
        } catch (error) {
            console.error('❌ Error:', error);
        } finally {
            setCargandoPuntos(false);
        }
    };

    // ============================================================
    // 🎬 EFECTOS
    // ============================================================
    useEffect(() => {
        if (perfil?.id) {
            cargarPuntosDirectamente();
            cargarTotalPedidos();
            cargarDatosPerfil();
            cargarEstadisticas();
            verificarEstadoEliminacion();
            if (perfil.avatar_url) {
                setImagenPerfil(perfil.avatar_url);
            }
        }
    }, [perfil]);

    // ✅ RECARGAR PUNTOS CUANDO LA PÁGINA SE VUELVE VISIBLE
    useEffect(() => {
        const recargarPuntos = () => {
            if (document.visibilityState === 'visible' && perfil?.id) {
                console.log('🔄 Página visible, recargando puntos...');
                cargarPuntosDirectamente();
            }
        };

        document.addEventListener('visibilitychange', recargarPuntos);

        return () => {
            document.removeEventListener('visibilitychange', recargarPuntos);
        };
    }, [perfil?.id]);

    // ============================================================
    // 🔄 FUNCIONES DE CARGA
    // ============================================================
    const cargarDatosPerfil = () => {
        if (perfil) {
            setTelefono(perfil.telefono || '');
            setDireccionCalle(perfil.direccion_calle || '');
            setDireccionNumero(perfil.direccion_numero || '');
            setDireccionPiso(perfil.direccion_piso || '');
            setDireccionDepartamento(perfil.direccion_departamento || '');
            setDireccionBarrio(perfil.direccion_barrio || '');
            setDireccionCiudad(perfil.direccion_ciudad || '');
            setDireccionCodigoPostal(perfil.direccion_codigo_postal || '');
            setPreferenciasComida(perfil.preferencias_comida || '');
            setMetodoPago(perfil.metodo_pago || '');
        }
    };

    const cargarTotalPedidos = async () => {
        if (!perfil?.id) return;
        const { count } = await supabase
            .from('pedidos')
            .select('*', { count: 'exact', head: true })
            .eq('id_de_usuario', perfil.id);
        setTotalPedidos(count || 0);
    };

    const cargarEstadisticas = async () => {
        if (!perfil?.id) return;
        setCargandoEstadisticas(true);

        try {
            const { data: pedidos, error: pedidosError } = await supabase
                .from('pedidos')
                .select('total, estado, creado_en, id')
                .eq('id_de_usuario', perfil.id)
                .order('creado_en', { ascending: false });

            if (!pedidosError && pedidos) {
                const total = pedidos
                    .filter(p => p.estado === 'entregado')
                    .reduce((sum, p) => sum + (p.total || 0), 0);
                setTotalGastado(total);
                setTotalPedidos(pedidos.length);

                await cargarActividadReciente(pedidos);
            }

            const { count: canjesCount } = await supabase
                .from('canjes')
                .select('*', { count: 'exact', head: true })
                .eq('usuario_id', perfil.id);
            setTotalCanjes(canjesCount || 0);

            const { data: canjes } = await supabase
                .from('canjes')
                .select(`
                    id,
                    puntos_usados,
                    usado_en_pedido,
                    created_at,
                    recompensas (
                        nombre,
                        tipo,
                        valor_descuento
                    )
                `)
                .eq('usuario_id', perfil.id)
                .order('created_at', { ascending: false })
                .limit(3);

            if (canjes) {
                const canjesMapeados = canjes.map((c: any) => ({
                    id: c.id,
                    puntos_usados: c.puntos_usados,
                    usado_en_pedido: c.usado_en_pedido,
                    created_at: c.created_at,
                    recompensas: c.recompensas && c.recompensas.length > 0 ? c.recompensas[0] : null
                }));
                setUltimosCanjes(canjesMapeados);
            }

        } catch (error) {
            console.error('❌ Error cargando estadísticas:', error);
        } finally {
            setCargandoEstadisticas(false);
            setCargando(false);
        }
    };

    const cargarActividadReciente = async (pedidosDelUsuario?: any[]) => {
        if (!perfil?.id) return;

        try {
            const actividades: ActividadReciente[] = [];

            let pedidos = pedidosDelUsuario;
            if (!pedidos) {
                const { data } = await supabase
                    .from('pedidos')
                    .select('id, estado, total, creado_en')
                    .eq('id_de_usuario', perfil.id)
                    .order('creado_en', { ascending: false })
                    .limit(5);
                pedidos = data || [];
            }

            if (pedidos && pedidos.length > 0) {
                const totalPedidosUsuario = pedidos.length;

                pedidos.forEach((p: any, index: number) => {
                    const numeroSecuencial = totalPedidosUsuario - index;

                    const estadoMap: Record<string, { icono: string; texto: string; color: string }> = {
                        'entregado': { icono: '✅', texto: 'Entregado', color: '#22c55e' },
                        'pendiente': { icono: '⏳', texto: 'Pendiente', color: '#eab308' },
                        'pago_pendiente': { icono: '💳', texto: 'Pago Pendiente', color: '#f97316' },
                        'en cocina': { icono: '👨‍🍳', texto: 'En Cocina', color: '#8b5cf6' },
                        'en camino': { icono: '🛵', texto: 'En Camino', color: '#06b6d4' },
                        'cancelado': { icono: '❌', texto: 'Cancelado', color: '#ef4444' },
                    };
                    const estadoInfo = estadoMap[p.estado] || estadoMap.pendiente;

                    actividades.push({
                        id: `pedido-${p.id}`,
                        tipo: 'pedido',
                        descripcion: `Pedido #${numeroSecuencial} - ${estadoInfo.texto}`,
                        fecha: p.creado_en,
                        icono: estadoInfo.icono,
                        color: estadoInfo.color,
                    });
                });
            }

            const { data: canjesRecientes } = await supabase
                .from('canjes')
                .select('id, puntos_usados, created_at, recompensas(nombre)')
                .eq('usuario_id', perfil.id)
                .order('created_at', { ascending: false })
                .limit(3);

            if (canjesRecientes) {
                canjesRecientes.forEach((c: any) => {
                    const nombreRecompensa = c.recompensas && c.recompensas.length > 0
                        ? c.recompensas[0]?.nombre
                        : 'Recompensa';
                    actividades.push({
                        id: `canje-${c.id}`,
                        tipo: 'canje',
                        descripcion: `🎁 Canjeaste ${c.puntos_usados} pts por "${nombreRecompensa}"`,
                        fecha: c.created_at,
                        icono: '🎁',
                        color: '#ec4899',
                    });
                });
            }

            actividades.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
            setActividadesRecientes(actividades.slice(0, 5));

        } catch (error) {
            console.error('❌ Error cargando actividad reciente:', error);
        }
    };

    const verificarEstadoEliminacion = async () => {
        if (!perfil?.id) return;
        const estado = await servicioEliminacionCuenta.obtenerEstadoEliminacion(perfil.id);
        setTieneSolicitudEliminacion(estado.tieneSolicitud);
        setDiasRestantes(estado.diasRestantes || 0);
    };

    const actualizarDatosPerfil = async () => {
        if (!perfil || !perfil.id) {
            window.alert('❌ Error\n\nNo se pudo identificar tu cuenta.');
            return;
        }

        if ((direccionCalle || direccionNumero) && (!direccionCalle || !direccionNumero)) {
            window.alert('⚠️ Dirección incompleta\n\nSi querés guardar una dirección, completá tanto la calle como el número.');
            return;
        }

        setCargandoActualizacion(true);

        try {
            const datosActualizados: any = {
                telefono: telefono || null,
                direccion_calle: direccionCalle || null,
                direccion_numero: direccionNumero || null,
                direccion_piso: direccionPiso || null,
                direccion_departamento: direccionDepartamento || null,
                direccion_barrio: direccionBarrio || null,
                direccion_ciudad: direccionCiudad || null,
                direccion_codigo_postal: direccionCodigoPostal || null,
                preferencias_comida: preferenciasComida || null,
                metodo_pago: metodoPago || null,
            };

            const { error } = await supabase
                .from('perfiles')
                .update(datosActualizados)
                .eq('id', perfil.id);

            if (error) {
                window.alert(`❌ Error\n\nNo se pudo actualizar el perfil: ${error.message}`);
                return;
            }

            await actualizarPerfil({ ...perfil, ...datosActualizados });
            await recargarPerfil();
            window.alert('✅ Éxito\n\nPerfil actualizado correctamente');
            setModoEdicion(false);
        } catch (error) {
            console.error('❌ Error actualizando perfil:', error);
            window.alert('❌ Error\n\nOcurrió un error al actualizar el perfil');
        } finally {
            setCargandoActualizacion(false);
        }
    };

    const solicitarEliminacionCuenta = async () => {
        if (!perfil || !perfil.id || !perfil.email) {
            window.alert('❌ Error\n\nNo se pudo identificar tu cuenta.');
            return;
        }

        if (!motivoEliminacion || motivoEliminacion.trim().length < 10) {
            window.alert('📝 Motivo requerido\n\nPor favor, contanos con más detalle por qué querés eliminar tu cuenta.');
            return;
        }

        if (!passwordConfirmacion || passwordConfirmacion.length < 6) {
            window.alert('🔒 Contraseña requerida\n\nIngresá tu contraseña para confirmar la eliminación de tu cuenta.');
            return;
        }

        setCargandoEliminar(true);

        try {
            const resultado = await servicioEliminacionCuenta.solicitarEliminacion(
                perfil.id,
                perfil.email,
                motivoEliminacion.trim(),
                passwordConfirmacion
            );

            if (!resultado.success) {
                window.alert(`❌ Error\n\n${resultado.error || 'Ocurrió un error. Intentá nuevamente.'}`);
                setCargandoEliminar(false);
                return;
            }

            const fechaEliminacion = new Date(resultado.solicitud!.fecha_eliminacion);
            const fechaFormateada = fechaEliminacion.toLocaleDateString('es-AR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });

            window.alert(
                `✅ Solicitud enviada\n\n` +
                `Tu solicitud de eliminación fue recibida.\n\n` +
                `📅 Tu cuenta será eliminada el ${fechaFormateada}.\n\n` +
                `Si iniciás sesión antes de esa fecha, la eliminación se cancelará automáticamente.\n\n` +
                `Gracias por habernos elegido 🍔`
            );

            setMostrarModalEliminar(false);
            setPasswordConfirmacion('');
            setMotivoEliminacion('');
            await cerrarSesion();
            router.push('/');

        } catch (error) {
            console.error('Error:', error);
            window.alert('❌ Error\n\nOcurrió un error inesperado. Intentá nuevamente.');
        } finally {
            setCargandoEliminar(false);
        }
    };

    const cancelarEliminacion = async () => {
        if (!perfil || !perfil.id) {
            window.alert('❌ Error\n\nNo se pudo identificar tu cuenta.');
            return;
        }

        if (window.confirm('¿Estás seguro que querés cancelar la eliminación de tu cuenta?')) {
            const resultado = await servicioEliminacionCuenta.cancelarEliminacion(perfil.id);
            if (resultado.success) {
                setTieneSolicitudEliminacion(false);
                setDiasRestantes(0);
                window.alert('✅ Cancelado\n\nTu cuenta ya no será eliminada.');
            } else {
                window.alert(`❌ Error\n\n${resultado.error || 'No se pudo cancelar.'}`);
            }
        }
    };

    const obtenerDireccionCompleta = () => {
        const partes = [];
        if (direccionCalle) partes.push(direccionCalle);
        if (direccionNumero) partes.push(direccionNumero);
        if (direccionPiso) partes.push(`Piso ${direccionPiso}`);
        if (direccionDepartamento) partes.push(`Depto ${direccionDepartamento}`);
        if (direccionBarrio) partes.push(direccionBarrio);
        if (direccionCiudad) partes.push(direccionCiudad);
        if (direccionCodigoPostal) partes.push(`CP ${direccionCodigoPostal}`);
        return partes.length > 0 ? partes.join(', ') : 'No especificada';
    };

    // ✅ OBTENER NIVEL CON PUNTOS ACTUALES
    const nivelFallback = obtenerNivel(puntosActuales || 0);
    const nivelActual = nivel || nivelFallback;

    // ✅ En el perfil, asegúrate de que maneje `siguiente: null`

    const calcularProgreso = () => {
        const niveles = [
            { nombre: 'Bronce', puntos: 0, icono: '🥉', color: '#CD7F32' },
            { nombre: 'Plata', puntos: 1000, icono: '🥈', color: '#C0C0C0' },
            { nombre: 'Oro', puntos: 2500, icono: '🥇', color: '#FFD700' },
            { nombre: 'Platino', puntos: 5000, icono: '💎', color: '#E5E4E2' },
            // ✅ NO INCLUIR "Krusty" como nivel - Platino es el máximo
        ];

        const puntos = puntosActuales || 0;

        let nivelEncontrado = niveles[niveles.length - 1]; // Por defecto Platino
        let nivelIndex = 0;
        for (let i = niveles.length - 1; i >= 0; i--) {
            if (puntos >= niveles[i].puntos) {
                nivelEncontrado = niveles[i];
                nivelIndex = i;
                break;
            }
        }

        // ✅ Si es Platino (último nivel), mostrar "Nivel máximo"
        if (nivelEncontrado.nombre === 'Platino') {
            return {
                progreso: 100,
                texto: '🏆 ¡Nivel máximo alcanzado!'
            };
        }

        const siguiente = niveles[nivelIndex + 1];
        if (!siguiente) {
            return {
                progreso: 100,
                texto: '🏆 ¡Nivel máximo alcanzado!'
            };
        }

        const puntosSiguiente = siguiente.puntos - nivelEncontrado.puntos;
        const puntosProgreso = puntos - nivelEncontrado.puntos;
        const progreso = Math.min(100, Math.round((puntosProgreso / puntosSiguiente) * 100));

        return {
            progreso,
            texto: `${progreso}% para ${siguiente.nombre}`
        };
    };

    const progresoInfo = calcularProgreso();

    // Si no hay sesión, mostrar mensaje
    if (!perfil) {
        return (
            <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-6">
                <div className="bg-white border-4 border-black p-12 rounded-[3rem] shadow-[15px_15px_0px_0px_black] max-w-md w-full text-center">
                    <span className="text-8xl block mb-6">🍔</span>
                    <h1 className="font-krusty text-3xl text-black uppercase mb-4">Inicia sesión</h1>
                    <p className="text-stone-600 font-bold mb-8">Iniciá sesión para ver tu perfil, pedidos y recompensas.</p>
                    <Link href="/login" className="inline-block bg-[#D32F2F] text-white font-black px-8 py-4 rounded-full border-4 border-black shadow-[4px_4px_0px_0px_black] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
                        Iniciar Sesión
                    </Link>
                </div>
            </div>
        );
    }

    const puntosMostrar = puntosActuales || perfil?.puntos_acumulados || 0;

    return (
        <div className="min-h-screen bg-[#fafafa] pb-32 selection:bg-[#FFCA28]/30 text-[#292929]">
            {/* Header */}
            <div className="relative bg-white border-b-4 border-black pt-8 pb-6 px-6">
                <div className="max-w-4xl mx-auto flex items-center gap-6">
                    <div className="relative w-24 h-24 rounded-full border-4 border-black overflow-hidden shadow-[4px_4px_0px_0px_black] shrink-0 bg-white">
                        {imagenPerfil ? (
                            <img
                                src={imagenPerfil}
                                alt="Avatar"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl font-krusty">
                                {perfil.nombre_cliente?.charAt(0)?.toUpperCase() || '🍔'}
                            </div>
                        )}
                    </div>

                    <div className="flex-1">
                        <h1 className="font-krusty text-3xl text-black uppercase">
                            {perfil.nombre_cliente || 'Invitado'}
                        </h1>
                        <p className="text-sm font-bold text-stone-500">{perfil.email}</p>
                        {cargandoPuntos && (
                            <p className="text-xs text-stone-400 animate-pulse">Cargando puntos...</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Contenido */}
            <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
                {/* Puntos y Nivel - MEJORADO */}
                <div className="bg-white border-4 border-black p-6 rounded-4xl shadow-[6px_6px_0px_0px_black]">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl">⭐</span>
                            <div>
                                <p className="text-xs font-black uppercase text-stone-400">Krusty Points</p>
                                <p className="font-krusty text-3xl text-[#D32F2F]">{puntosMostrar.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-[#FFCA28] px-4 py-2 rounded-full border-2 border-black">
                            <span className="text-xl">{nivelActual.icono}</span>
                            <span className="font-black text-sm uppercase">Nivel {nivelActual.nombre}</span>
                        </div>
                    </div>

                    {/* ✅ BARRA DE PROGRESO MEJORADA */}
                    <div className="mt-4">
                        <div className="w-full h-4 bg-stone-200 rounded-full border-2 border-black overflow-hidden">
                            <motion.div
                                className="h-full rounded-full transition-all duration-700"
                                style={{
                                    width: `${progresoInfo.progreso}%`,
                                    backgroundColor: nivelActual.color || '#FFCA28',
                                    backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)',
                                    backgroundSize: '1rem 1rem',
                                }}
                                initial={{ width: 0 }}
                                animate={{ width: `${progresoInfo.progreso}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                            />
                        </div>
                        <div className="flex justify-between items-center mt-2">
                            <p className="text-xs font-bold text-stone-400">
                                {nivelActual.nombre} ({puntosMostrar} pts)
                            </p>
                            <p className="text-xs font-bold text-[#D32F2F]">
                                {progresoInfo.texto}
                            </p>
                        </div>
                    </div>

                    {/* ✅ Botón actualizar */}
                    <button
                        onClick={() => cargarPuntosDirectamente()}
                        className="mt-4 text-xs font-bold text-[#D32F2F] hover:text-black transition-colors flex items-center gap-1"
                    >
                        🔄 Actualizar puntos
                    </button>
                </div>

                {/* Beneficios */}
                {beneficios && (
                    <div className="bg-white border-4 border-black p-6 rounded-4xl shadow-[6px_6px_0px_0px_black]">
                        <h2 className="font-krusty text-xl text-black uppercase mb-4">🎁 Beneficios</h2>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border-2 border-black/20">
                                <span className="text-2xl">💰</span>
                                <span className="font-bold text-sm">
                                    {beneficios.descuento > 0
                                        ? `${beneficios.descuento}% de descuento en todos tus pedidos`
                                        : 'Acumulá puntos para obtener descuentos'}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border-2 border-black/20">
                                <span className="text-2xl">🚴</span>
                                <span className="font-bold text-sm">
                                    {beneficios.envioGratis
                                        ? (beneficios.envioGratisMinimo
                                            ? `Envío gratis en pedidos > $${formatearPrecio(beneficios.envioGratisMinimo)}`
                                            : 'Envío gratis en todos tus pedidos')
                                        : 'Envío con costo estándar'}
                                </span>
                            </div>
                            {beneficios.accesoAnticipadoOfertas && (
                                <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border-2 border-black/20">
                                    <span className="text-2xl">🚀</span>
                                    <span className="font-bold text-sm">Acceso anticipado a ofertas exclusivas</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Estadísticas - MEJORADO */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white border-4 border-black p-4 rounded-4xl shadow-[6px_6px_0px_0px_black] text-center hover:shadow-[8px_8px_0px_0px_#D32F2F] transition-shadow">
                        <p className="font-krusty text-3xl text-[#D32F2F]">{totalPedidos}</p>
                        <p className="text-xs font-black uppercase text-stone-400">Pedidos</p>
                    </div>
                    <div className="bg-white border-4 border-black p-4 rounded-4xl shadow-[6px_6px_0px_0px_black] text-center hover:shadow-[8px_8px_0px_0px_#FAD02C] transition-shadow">
                        <p className="font-krusty text-3xl text-[#D32F2F]">{formatearPrecio(totalGastado)}</p>
                        <p className="text-xs font-black uppercase text-stone-400">Gastado</p>
                    </div>
                    <div className="bg-white border-4 border-black p-4 rounded-4xl shadow-[6px_6px_0px_0px_black] text-center hover:shadow-[8px_8px_0px_0px_#22c55e] transition-shadow">
                        <p className="font-krusty text-3xl text-[#D32F2F]">{totalCanjes}</p>
                        <p className="text-xs font-black uppercase text-stone-400">Canjes</p>
                    </div>
                </div>

                {/* Actividad Reciente */}
                {actividadesRecientes.length > 0 && (
                    <div className="bg-white border-4 border-black p-6 rounded-4xl shadow-[6px_6px_0px_0px_black]">
                        <h2 className="font-krusty text-xl text-black uppercase mb-4">📈 Actividad Reciente</h2>
                        <div className="space-y-3">
                            {actividadesRecientes.slice(0, 5).map((actividad) => (
                                <div
                                    key={actividad.id}
                                    className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border-2 border-black/20 hover:bg-stone-100 transition-colors"
                                >
                                    <span className="text-2xl">{actividad.icono}</span>
                                    <div className="flex-1">
                                        <p className="font-bold text-sm">{actividad.descripcion}</p>
                                        <p className="text-xs font-bold text-stone-400">
                                            {new Date(actividad.fecha).toLocaleDateString('es-AR', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Últimos Canjes */}
                {ultimosCanjes.length > 0 && (
                    <div className="bg-white border-4 border-black p-6 rounded-4xl shadow-[6px_6px_0px_0px_black]">
                        <h2 className="font-krusty text-xl text-black uppercase mb-4">🎁 Últimos Canjes</h2>
                        <div className="space-y-3">
                            {ultimosCanjes.map((canje) => (
                                <div
                                    key={canje.id}
                                    className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border-2 border-black/20 hover:bg-stone-100 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">🎯</span>
                                        <div>
                                            <p className="font-bold text-sm">{canje.recompensas?.nombre || 'Recompensa'}</p>
                                            <p className="text-xs font-bold text-stone-400">
                                                {canje.puntos_usados} pts • {canje.recompensas?.tipo === 'descuento'
                                                    ? `${canje.recompensas?.valor_descuento}% OFF`
                                                    : 'Producto gratis'}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-stone-400">
                                        {new Date(canje.created_at).toLocaleDateString('es-AR', {
                                            day: '2-digit',
                                            month: '2-digit',
                                        })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Información de contacto */}
                <div className="bg-white border-4 border-black p-6 rounded-4xl shadow-[6px_6px_0px_0px_black]">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-krusty text-xl text-black uppercase">📋 Información de contacto</h2>
                        <button
                            onClick={() => setModoEdicion(!modoEdicion)}
                            className="bg-[#FFCA28] px-4 py-2 rounded-full border-2 border-black font-black text-xs shadow-[3px_3px_0px_0px_black] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                        >
                            {modoEdicion ? 'Cancelar' : '✏️ Editar'}
                        </button>
                    </div>

                    {modoEdicion ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-black uppercase text-stone-400 mb-1">📱 Teléfono</label>
                                <input
                                    type="tel"
                                    value={telefono}
                                    onChange={(e) => setTelefono(e.target.value)}
                                    placeholder="Ej: 11 1234 5678"
                                    className="w-full bg-stone-50 border-4 border-black p-3 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-[#FFCA28]/30"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase text-stone-400 mb-1">📍 Dirección</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <input
                                        type="text"
                                        value={direccionCalle}
                                        onChange={(e) => setDireccionCalle(e.target.value)}
                                        placeholder="Calle"
                                        className="col-span-2 bg-stone-50 border-4 border-black p-3 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-[#FFCA28]/30"
                                    />
                                    <input
                                        type="text"
                                        value={direccionNumero}
                                        onChange={(e) => setDireccionNumero(e.target.value)}
                                        placeholder="N°"
                                        className="bg-stone-50 border-4 border-black p-3 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-[#FFCA28]/30"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <input
                                        type="text"
                                        value={direccionPiso}
                                        onChange={(e) => setDireccionPiso(e.target.value)}
                                        placeholder="Piso"
                                        className="bg-stone-50 border-4 border-black p-3 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-[#FFCA28]/30"
                                    />
                                    <input
                                        type="text"
                                        value={direccionDepartamento}
                                        onChange={(e) => setDireccionDepartamento(e.target.value)}
                                        placeholder="Depto"
                                        className="bg-stone-50 border-4 border-black p-3 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-[#FFCA28]/30"
                                    />
                                </div>
                                <input
                                    type="text"
                                    value={direccionBarrio}
                                    onChange={(e) => setDireccionBarrio(e.target.value)}
                                    placeholder="Barrio"
                                    className="w-full mt-2 bg-stone-50 border-4 border-black p-3 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-[#FFCA28]/30"
                                />
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <input
                                        type="text"
                                        value={direccionCiudad}
                                        onChange={(e) => setDireccionCiudad(e.target.value)}
                                        placeholder="Ciudad"
                                        className="bg-stone-50 border-4 border-black p-3 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-[#FFCA28]/30"
                                    />
                                    <input
                                        type="text"
                                        value={direccionCodigoPostal}
                                        onChange={(e) => setDireccionCodigoPostal(e.target.value)}
                                        placeholder="CP"
                                        className="bg-stone-50 border-4 border-black p-3 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-[#FFCA28]/30"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase text-stone-400 mb-1">🍽️ Preferencias de comida</label>
                                <textarea
                                    value={preferenciasComida}
                                    onChange={(e) => setPreferenciasComida(e.target.value)}
                                    placeholder="Ej: Sin TACC, vegetariano, etc."
                                    rows={3}
                                    className="w-full bg-stone-50 border-4 border-black p-3 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-[#FFCA28]/30 resize-none"
                                />
                            </div>
                            <button
                                onClick={actualizarDatosPerfil}
                                disabled={cargandoActualizacion}
                                className="w-full bg-[#D32F2F] text-white font-black py-4 rounded-2xl border-4 border-black shadow-[6px_6px_0px_0px_black] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {cargandoActualizacion ? 'Guardando...' : '✅ Guardar cambios'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border-2 border-black/20">
                                <span className="text-xl">📱</span>
                                <span className="font-bold text-sm">{telefono || 'No especificado'}</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border-2 border-black/20">
                                <span className="text-xl">📍</span>
                                <span className="font-bold text-sm">{obtenerDireccionCompleta()}</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border-2 border-black/20">
                                <span className="text-xl">🍽️</span>
                                <span className="font-bold text-sm">{preferenciasComida || 'Sin preferencias'}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Menú de navegación */}
                <div className="grid grid-cols-2 gap-4">
                    <Link href="/pedidos" className="bg-white border-4 border-black p-6 rounded-4x1 shadow-[6px_6px_0px_0px_black] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all text-center">
                        <span className="text-3xl block mb-2">📦</span>
                        <span className="font-black text-sm uppercase">Mis Pedidos</span>
                    </Link>
                    <Link href="/recompensas" className="bg-white border-4 border-black p-6 rounded-4xl shadow-[6px_6px_0px_0px_black] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all text-center">
                        <span className="text-3xl block mb-2">⭐</span>
                        <span className="font-black text-sm uppercase">Recompensas</span>
                    </Link>
                    <Link href="/privacidad" className="bg-white border-4 border-black p-6 rounded-4xl shadow-[6px_6px_0px_0px_black] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all text-center">
                        <span className="text-3xl block mb-2">🔒</span>
                        <span className="font-black text-sm uppercase">Privacidad</span>
                    </Link>
                    <Link href="/terminos" className="bg-white border-4 border-black p-6 rounded-4xl shadow-[6px_6px_0px_0px_black] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all text-center">
                        <span className="text-3xl block mb-2">📋</span>
                        <span className="font-black text-sm uppercase">Términos</span>
                    </Link>
                </div>

                {/* Eliminar cuenta */}
                <button
                    onClick={() => {
                        if (tieneSolicitudEliminacion) {
                            if (window.confirm(`Tu cuenta está programada para eliminarse en ${diasRestantes} días. ¿Querés cancelar la eliminación?`)) {
                                cancelarEliminacion();
                            }
                        } else {
                            setMostrarModalEliminar(true);
                        }
                    }}
                    className="w-full bg-white border-4 border-red-500 p-6 rounded-4xl shadow-[6px_6px_0px_0px_black] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all text-center"
                >
                    <div className="flex items-center justify-center gap-3">
                        <span className="text-2xl">{tieneSolicitudEliminacion ? '⏳' : '🗑️'}</span>
                        <span className={`font-black text-sm uppercase ${tieneSolicitudEliminacion ? 'text-[#FFCA28]' : 'text-red-500'}`}>
                            {tieneSolicitudEliminacion
                                ? `Eliminación en ${diasRestantes} días`
                                : 'Eliminar cuenta'}
                        </span>
                    </div>
                    <p className="text-xs font-bold text-stone-400 mt-1">
                        {tieneSolicitudEliminacion
                            ? 'Tu cuenta será eliminada automáticamente'
                            : 'Eliminá permanentemente tu cuenta y datos'}
                    </p>
                </button>

                {/* Cerrar sesión */}
                <button
                    onClick={async () => {
                        if (window.confirm('¿Estás seguro que querés cerrar sesión?')) {
                            await cerrarSesion();
                            router.push('/');
                        }
                    }}
                    className="w-full bg-white border-4 border-black p-6 rounded-4xl shadow-[6px_6px_0px_0px_black] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all text-center"
                >
                    <div className="flex items-center justify-center gap-3">
                        <span className="text-2xl">🚪</span>
                        <span className="font-black text-sm uppercase text-[#D32F2F]">Cerrar sesión</span>
                    </div>
                </button>
            </div>

            {/* Modal de eliminación de cuenta */}
            {mostrarModalEliminar && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1a1a1a] border-4 border-black rounded-4xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 shadow-[15px_15px_0px_0px_black]">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center">
                                    <span className="text-2xl">🗑️</span>
                                </div>
                                <h2 className="font-krusty text-xl text-white uppercase">Eliminar cuenta</h2>
                            </div>
                            <button
                                onClick={() => {
                                    setMostrarModalEliminar(false);
                                    setPasswordConfirmacion('');
                                    setMotivoEliminacion('');
                                }}
                                className="text-white/60 hover:text-white text-2xl"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 mb-6 flex items-start gap-3">
                            <span className="text-2xl">⚠️</span>
                            <p className="text-sm text-white/80">
                                Esta acción es <span className="text-red-500 font-bold">permanente e irreversible</span>
                            </p>
                        </div>

                        <p className="text-sm text-white/60 mb-6 leading-relaxed">
                            Tu cuenta será eliminada en <span className="text-[#FFCA28] font-bold">30 días</span>.
                            Si iniciás sesión durante este período, la eliminación se cancelará automáticamente.
                            <br /><br />
                            Perderás acceso a:
                            <br />• Todos tus pedidos e historial
                            <br />• Tus puntos y recompensas acumulados
                            <br />• Tus datos personales guardados
                        </p>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-xs font-black uppercase text-white/60 mb-1">
                                    🔒 Confirmá tu contraseña <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={mostrarPassword ? 'text' : 'password'}
                                        value={passwordConfirmacion}
                                        onChange={(e) => setPasswordConfirmacion(e.target.value)}
                                        placeholder="Ingresá tu contraseña"
                                        className="w-full bg-white/5 border-2 border-white/10 rounded-xl p-3 text-white font-bold text-sm outline-none focus:border-[#FFCA28]"
                                    />
                                    <button
                                        onClick={() => setMostrarPassword(!mostrarPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80"
                                    >
                                        {mostrarPassword ? '👁️' : '👁️‍🗨️'}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase text-white/60 mb-1">
                                    📝 ¿Por qué te vas? <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={motivoEliminacion}
                                    onChange={(e) => setMotivoEliminacion(e.target.value)}
                                    placeholder="Ayudanos a mejorar contándonos tu experiencia..."
                                    rows={4}
                                    className="w-full bg-white/5 border-2 border-white/10 rounded-xl p-3 text-white font-bold text-sm outline-none focus:border-[#FFCA28] resize-none"
                                />
                                <p className={`text-xs font-bold mt-1 text-right ${motivoEliminacion.length >= 10 ? 'text-green-400' : 'text-red-400'}`}>
                                    {motivoEliminacion.length}/500 caracteres
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setMostrarModalEliminar(false);
                                    setPasswordConfirmacion('');
                                    setMotivoEliminacion('');
                                }}
                                className="flex-1 bg-white/5 border-2 border-white/10 rounded-xl py-3 text-white/60 font-black text-sm hover:bg-white/10 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={solicitarEliminacionCuenta}
                                disabled={cargandoEliminar || !passwordConfirmacion || motivoEliminacion.length < 10}
                                className="flex-1 bg-red-600 rounded-xl py-3 text-white font-black text-sm hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {cargandoEliminar ? (
                                    '⏳ Procesando...'
                                ) : (
                                    <>
                                        <span>🗑️</span>
                                        Solicitar eliminación
                                    </>
                                )}
                            </button>
                        </div>

                        <p className="text-xs text-center text-white/40 mt-4">
                            🔒 Tendrás 30 días para cancelar la eliminación si cambias de opinión
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}