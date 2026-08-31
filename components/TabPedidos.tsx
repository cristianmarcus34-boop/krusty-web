"use client";
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import ModalBorrarKrusty from './ModalBorrarKrusty';

interface Pedido {
  id: string;
  cliente_nombre: string;
  direccion: string;
  telefono: string;
  metodo_pago: string;
  tipo_entrega: string;
  total: number;
  total_parcial?: number;
  costo_envio?: number;
  estado: string;
  resumenes_de_elementos?: string;
  items_resumen?: string;
  items_json?: any;
  notas?: string;
  creado_en: string;
  puntos_usados?: number;
  descuento_puntos?: number;
  id_de_usuario?: string;
  lat_cliente?: number;
  lng_cliente?: number;
  distancia_km?: number;
  tiempo_estimado?: number;
}

// ============================================================
// 📦 FUNCIÓN: ENVIAR NOTIFICACIÓN PUSH (SOLO PARA NUEVOS PEDIDOS)
// ============================================================

const enviarNotificacion = async (titulo: string, cuerpo: string, url?: string) => {
  try {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    if (Notification.permission !== 'granted') return;

    const notificacion = new Notification(titulo, {
      body: cuerpo,
      icon: '/favicon-32x32.png',
      tag: 'pedido-update',
      requireInteraction: true,
      data: { url }
    });

    if (url) {
      notificacion.onclick = () => {
        window.focus();
        window.location.href = url;
      };
    }

    setTimeout(() => notificacion.close(), 8000);

  } catch (error) {
    console.error('Error enviando notificación:', error);
  }
};

export default function TabPedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [pedidoParaBorrar, setPedidoParaBorrar] = useState<Pedido | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ============================================================
  // 📦 OBTENER PEDIDOS
  // ============================================================

  const fetchPedidos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .order('creado_en', { ascending: false });

      if (error) {
        console.error('Error fetching pedidos:', error);
        setError(`Error al cargar pedidos: ${error.message}`);
        return;
      }

      if (data) setPedidos(data);
    } catch (err) {
      console.error('Error inesperado:', err);
      setError('Error inesperado al cargar pedidos');
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================================
  // 🔊 SONIDO Y REALTIME
  // ============================================================

  useEffect(() => {
    audioRef.current = new Audio('/sounds/nuevopedido_finmario.mp3');
    audioRef.current.volume = 0.6;
    fetchPedidos();

    const channel = supabase.channel('admin-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pedidos' }, (payload) => {
        audioRef.current?.play().catch(() => { });
        setPedidos((current) => [payload.new as Pedido, ...current]);

        enviarNotificacion(
          '🔔 ¡Nuevo pedido!',
          `Pedido de ${payload.new.cliente_nombre} - $${payload.new.total}`,
          `/admin`
        );
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pedidos' }, (payload) => {
        setPedidos((current) => current.map((p) => String(p.id) === String(payload.new.id) ? payload.new as Pedido : p));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'pedidos' }, (payload) => {
        setPedidos((current) => current.filter((p) => String(p.id) !== String(payload.old.id)));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchPedidos]);

  // ============================================================
  // 🔄 CAMBIAR ESTADO (CON MANEJO DE ERRORES MEJORADO)
  // ============================================================

  const cambiarEstado = async (id: string, nuevoEstado: string) => {
    // ✅ Convertir ID a número (bigint)
    const pedidoId = typeof id === 'string' ? parseInt(id, 10) : id;

    if (isNaN(pedidoId)) {
      console.error('❌ ID inválido:', id);
      alert('Error: ID de pedido inválido');
      return;
    }

    try {
      console.log('🔄 [cambiarEstado]', { id: pedidoId, nuevoEstado });

      // ✅ Verificar autenticación primero
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('❌ Usuario no autenticado');
        alert('Debes iniciar sesión para modificar pedidos');
        return;
      }

      // ✅ Actualizar estado
      const { data, error } = await supabase
        .from('pedidos')
        .update({ estado: nuevoEstado })
        .eq('id', pedidoId)
        .select();

      if (error) {
        console.error('❌ Error de Supabase:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        alert(`Error: ${error.message} (Código: ${error.code || 'sin código'})`);
        return;
      }

      console.log('✅ Estado actualizado:', data);

      // ✅ Actualizar estado local (optimista)
      setPedidos((prev) =>
        prev.map((p) =>
          Number(p.id) === pedidoId ? { ...p, estado: nuevoEstado } : p
        )
      );

    } catch (err) {
      console.error('❌ Error inesperado:', err);
      alert(`Error inesperado: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  };

  // ============================================================
  // 🗑️ ELIMINAR PEDIDO
  // ============================================================

  const ejecutarEliminacion = async () => {
    if (!pedidoParaBorrar) return;
    const idABorrar = pedidoParaBorrar.id;

    // ✅ Convertir ID a número
    const pedidoId = typeof idABorrar === 'string' ? parseInt(idABorrar, 10) : idABorrar;

    if (isNaN(pedidoId)) {
      console.error('❌ ID inválido para eliminar:', idABorrar);
      alert('Error: ID de pedido inválido');
      return;
    }

    try {
      setPedidos((prev) => prev.filter(p => Number(p.id) !== pedidoId));
      setPedidoParaBorrar(null);

      const { error } = await supabase
        .from('pedidos')
        .delete()
        .eq('id', pedidoId);

      if (error) {
        console.error("Error al borrar:", error.message);
        alert(`Error al eliminar: ${error.message}`);
        fetchPedidos();
      }
    } catch (err) {
      console.error("Error inesperado:", err);
      alert('Error inesperado al eliminar');
      fetchPedidos();
    }
  };

  // ============================================================
  // 🎨 UTILIDADES DE ESTILOS
  // ============================================================

  const getEstadoEstilo = (estado: string) => {
    switch (estado) {
      case 'pendiente': return 'bg-[#D32F2F] text-white animate-pulse';
      case 'pago_pendiente': return 'bg-amber-500 text-white animate-pulse';
      case 'en cocina': return 'bg-orange-500 text-white';
      case 'en camino': return 'bg-blue-500 text-white';
      case 'entregado': return 'bg-green-600 text-white opacity-50';
      default: return 'bg-stone-200 text-black';
    }
  };

  const getEstadoTexto = (estado: string) => {
    switch (estado) {
      case 'pendiente': return '⏳ Pendiente';
      case 'pago_pendiente': return '💰 Pago pendiente';
      case 'en cocina': return '👨‍🍳 En cocina';
      case 'en camino': return '🛵 En camino';
      case 'entregado': return '✅ Entregado';
      default: return estado || '📌';
    }
  };

  const getMetodoPagoTexto = (metodo: string) => {
    if (!metodo) return '❓ No especificado';
    if (metodo.includes('Efectivo')) return '💵 Efectivo';
    if (metodo.includes('Transferencia')) return '🏦 Transferencia';
    if (metodo.includes('Mercado Pago')) return '💳 Mercado Pago';
    return metodo;
  };

  const getItemsResumen = (pedido: Pedido) => {
    if (pedido.resumenes_de_elementos) return pedido.resumenes_de_elementos;
    if (pedido.items_resumen) return pedido.items_resumen;
    if (pedido.items_json) {
      try {
        const items = typeof pedido.items_json === 'string'
          ? JSON.parse(pedido.items_json)
          : pedido.items_json;
        return items.map((i: any) => `${i.nombre || i.name} x${i.cantidad || 1}`).join(', ');
      } catch {
        return '📦 Ver detalles';
      }
    }
    return '📦 Sin items';
  };

  const getTipoEntregaTexto = (tipo: string) => {
    if (!tipo) return '📍 No especificado';
    return tipo === 'Delivery' ? '🛵 Delivery' : '🏠 Retiro';
  };

  const formatearFecha = (fecha: string) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ============================================================
  // 🔍 FILTRADO DE PEDIDOS
  // ============================================================

  const pedidosFiltrados = pedidos.filter(pedido => {
    if (filtroEstado === 'todos') return true;
    return pedido.estado === filtroEstado;
  });

  const estadosDisponibles = ['todos', 'pendiente', 'pago_pendiente', 'en cocina', 'en camino', 'entregado'];

  // ============================================================
  // 🖥️ RENDER
  // ============================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#FAD02C] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-stone-400 font-bold text-sm">Cargando pedidos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center max-w-md">
          <span className="text-6xl block mb-4">⚠️</span>
          <p className="font-black text-red-500 text-lg">{error}</p>
          <button
            onClick={() => fetchPedidos()}
            className="mt-4 px-6 py-2 bg-[#FAD02C] border-2 border-black rounded-xl font-black text-sm hover:bg-[#e6b800] transition-colors"
          >
            🔄 Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* FILTROS */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs font-black uppercase text-stone-400 tracking-wider mr-2">🔍 Filtrar:</span>
        {estadosDisponibles.map((estado) => (
          <button
            key={estado}
            onClick={() => setFiltroEstado(estado)}
            className={`px-4 py-2 rounded-full border-2 border-black font-black text-[10px] uppercase transition-all ${filtroEstado === estado
              ? 'bg-[#FAD02C] text-black'
              : 'bg-white text-stone-400 hover:bg-stone-100'
              }`}
          >
            {estado === 'todos' ? '📋 Todos' : getEstadoTexto(estado)}
          </button>
        ))}
        <span className="text-xs font-black text-stone-400 ml-auto">
          {pedidosFiltrados.length} {pedidosFiltrados.length === 1 ? 'pedido' : 'pedidos'}
        </span>
      </div>

      {/* LISTA DE PEDIDOS */}
      {pedidosFiltrados.length === 0 ? (
        <div className="text-center py-20 bg-stone-50 rounded-3xl border-4 border-dashed border-stone-200">
          <span className="text-6xl block mb-4">📭</span>
          <p className="font-black text-stone-400 text-lg">No hay pedidos {filtroEstado !== 'todos' ? `con estado "${filtroEstado}"` : ''}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
          {pedidosFiltrados.map((pedido) => (
            <div
              key={pedido.id}
              className={`relative border-4 border-black p-6 rounded-[2.5rem] bg-white transition-all shadow-[8px_8px_0px_0px_black] hover:shadow-[12px_12px_0px_0px_black] hover:-translate-y-1 ${pedido.estado === 'entregado' && 'grayscale opacity-60'
                }`}
            >
              {/* BOTÓN ELIMINAR */}
              <button
                onClick={() => setPedidoParaBorrar(pedido)}
                className="absolute -top-4 -left-2 bg-white text-[#D32F2F] border-4 border-black w-10 h-10 rounded-full font-black shadow-[4px_4px_0px_0px_black] hover:scale-110 transition-transform z-20 flex items-center justify-center"
              >
                ✕
              </button>

              {/* BADGE ESTADO */}
              <div className={`absolute -top-4 right-6 px-4 py-1 rounded-xl border-4 border-black font-black text-[10px] uppercase z-10 ${getEstadoEstilo(pedido.estado)}`}>
                {getEstadoTexto(pedido.estado)}
              </div>

              {/* CLIENTE */}
              <div className="flex items-start justify-between gap-2 mb-1">
                <h2 className="text-2xl font-black uppercase italic leading-tight truncate">
                  {pedido.cliente_nombre || 'Cliente'}
                </h2>
                <span className="text-xs font-black text-stone-400 whitespace-nowrap">
                  #{String(pedido.id).slice(-6).toUpperCase()}
                </span>
              </div>

              {/* DIRECCIÓN Y TIPO DE ENTREGA */}
              <div className="flex items-center gap-2 text-xs font-bold text-stone-500 mb-3">
                <span>{getTipoEntregaTexto(pedido.tipo_entrega)}</span>
                <span className="text-stone-300">|</span>
                <span className="truncate">📍 {pedido.direccion || 'Sin dirección'}</span>
              </div>

              {/* TELÉFONO Y MÉTODO DE PAGO */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-stone-500 mb-3">
                <span>📞 {pedido.telefono || 'Sin teléfono'}</span>
                <span>{getMetodoPagoTexto(pedido.metodo_pago)}</span>
              </div>

              {/* FECHA */}
              <p className="text-[10px] font-bold text-stone-400 mb-3">
                🕐 {formatearFecha(pedido.creado_en)}
              </p>

              {/* ITEMS */}
              <div className="bg-stone-50 p-3 rounded-xl border-2 border-stone-200 mb-3 max-h-20 overflow-y-auto no-scrollbar text-xs font-bold text-stone-700">
                {getItemsResumen(pedido)}
              </div>

              {/* NOTAS (si existen) */}
              {pedido.notas && (
                <div className="bg-amber-50 border-l-4 border-amber-400 p-2 mb-3 rounded-r-lg">
                  <p className="text-[10px] font-bold text-amber-700 italic">
                    📝 {pedido.notas}
                  </p>
                </div>
              )}

              {/* DESCUENTOS Y PUNTOS */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-bold text-stone-500 mb-3">
                {pedido.descuento_puntos && pedido.descuento_puntos > 0 && (
                  <span className="text-[#FAD02C]">⭐ -${pedido.descuento_puntos} (puntos)</span>
                )}
                {pedido.puntos_usados && pedido.puntos_usados > 0 && (
                  <span className="text-[#FAD02C]">🏷️ {pedido.puntos_usados} pts usados</span>
                )}
                {pedido.distancia_km && (
                  <span className="text-blue-500">📏 {pedido.distancia_km} km</span>
                )}
              </div>

              {/* TOTAL */}
              <div className="flex justify-between items-center mb-4">
                <div>
                  {pedido.total_parcial && pedido.total_parcial !== pedido.total && (
                    <p className="text-xs text-stone-400 line-through">
                      ${pedido.total_parcial}
                    </p>
                  )}
                  <p className="text-4xl font-black italic tracking-tighter">
                    ${pedido.total || 0}
                  </p>
                </div>
                {pedido.costo_envio && pedido.costo_envio > 0 && (
                  <span className="text-xs font-bold text-stone-400">
                    🛵 ${pedido.costo_envio}
                  </span>
                )}
              </div>

              {/* BOTONES DE ACCIÓN */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => cambiarEstado(pedido.id, 'en cocina')}
                  disabled={pedido.estado === 'entregado' || pedido.estado === 'pago_pendiente'}
                  className="font-black py-3 rounded-xl border-[3px] border-black text-[10px] uppercase bg-white hover:bg-orange-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  👨‍🍳 COCINA
                </button>
                <button
                  onClick={() => cambiarEstado(pedido.id, 'en camino')}
                  disabled={pedido.estado === 'entregado' || pedido.estado === 'pago_pendiente'}
                  className="font-black py-3 rounded-xl border-[3px] border-black text-[10px] uppercase bg-white hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  🛵 ENVÍO
                </button>
                <button
                  onClick={() => cambiarEstado(pedido.id, 'entregado')}
                  disabled={pedido.estado === 'entregado' || pedido.estado === 'pago_pendiente'}
                  className="col-span-2 font-black py-3 rounded-2xl border-4 border-black bg-green-500 text-white text-xs hover:bg-green-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  ENTREGAR ✅
                </button>
              </div>

              {/* AVISO DE PAGO PENDIENTE */}
              {pedido.estado === 'pago_pendiente' && (
                <div className="mt-3 bg-amber-50 border-2 border-amber-400 rounded-xl p-2 text-center">
                  <p className="text-[10px] font-black text-amber-700">
                    ⚠️ PAGO PENDIENTE - No se puede avanzar hasta confirmar
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MODAL ELIMINAR */}
      <ModalBorrarKrusty
        isOpen={pedidoParaBorrar !== null}
        mensaje="¿ELIMINAR ESTA COMANDA?"
        itemNombre={pedidoParaBorrar ? `Pedido de ${pedidoParaBorrar.cliente_nombre}` : ""}
        onConfirm={ejecutarEliminacion}
        onCancel={() => setPedidoParaBorrar(null)}
      />
    </div>
  );
}