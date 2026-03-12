"use client";
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import ModalBorrarKrusty from './ModalBorrarKrusty';

export default function TabPedidos() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [pedidoParaBorrar, setPedidoParaBorrar] = useState<any | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchPedidos = useCallback(async () => {
    const { data } = await supabase.from('pedidos').select('*').order('created_at', { ascending: false });
    if (data) setPedidos(data);
  }, []);

  useEffect(() => {
    audioRef.current = new Audio('/sounds/nuevopedido_finmario.mp3');
    audioRef.current.volume = 0.6;
    fetchPedidos();

    const channel = supabase.channel('admin-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pedidos' }, (payload) => {
        audioRef.current?.play().catch(() => {});
        setPedidos((current) => [payload.new, ...current]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pedidos' }, (payload) => {
        setPedidos((current) => current.map((p) => String(p.id) === String(payload.new.id) ? payload.new : p));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'pedidos' }, (payload) => {
        // Sincronización Realtime por si se borra desde otro dispositivo
        setPedidos((current) => current.filter((p) => String(p.id) !== String(payload.old.id)));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchPedidos]);

  const cambiarEstado = async (id: any, nuevoEstado: string) => {
    await supabase.from('pedidos').update({ estado: nuevoEstado }).eq('id', id);
  };

  // FUNCIÓN DE ELIMINACIÓN CORREGIDA (HÍBRIDA)
  const ejecutarEliminacion = async () => {
    if (!pedidoParaBorrar) return;

    const idABorrar = pedidoParaBorrar.id;

    try {
      // 1. Lo quitamos de la vista INMEDIATAMENTE (Optimistic UI)
      setPedidos((prev) => prev.filter(p => p.id !== idABorrar));
      
      // 2. Cerramos el modal
      setPedidoParaBorrar(null);

      // 3. Lo borramos de la base de datos
      const { error } = await supabase
        .from('pedidos')
        .delete()
        .eq('id', idABorrar);

      if (error) {
        console.error("Error al borrar:", error.message);
        // Si hubo error, recargamos para que el pedido vuelva a aparecer (porque no se borró)
        fetchPedidos();
        alert("No se pudo eliminar de la base de datos");
      }
    } catch (err) {
      console.error("Error inesperado:", err);
      fetchPedidos();
    }
  };

  const getEstadoEstilo = (estado: string) => {
    switch (estado) {
      case 'pendiente': return 'bg-[#D32F2F] text-white animate-pulse';
      case 'en cocina': return 'bg-orange-500 text-white';
      case 'en camino': return 'bg-blue-500 text-white';
      case 'entregado': return 'bg-green-600 text-white opacity-50';
      default: return 'bg-stone-200 text-black';
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {pedidos.map((pedido) => (
        <div key={pedido.id} className={`relative border-4 border-black p-6 rounded-[2.5rem] bg-white transition-all shadow-[10px_10px_0px_0px_black] ${pedido.estado === 'entregado' && 'grayscale opacity-60'}`}>
          
          <button 
            onClick={() => setPedidoParaBorrar(pedido)}
            className="absolute -top-4 -left-2 bg-white text-[#D32F2F] border-4 border-black w-10 h-10 rounded-full font-black shadow-[4px_4px_0px_0px_black] hover:scale-110 transition-transform z-20 flex items-center justify-center"
          >
            ✕
          </button>

          <div className={`absolute -top-4 right-6 px-4 py-1 rounded-xl border-4 border-black font-black text-xs uppercase z-10 ${getEstadoEstilo(pedido.estado)}`}>
            {pedido.estado}
          </div>
          
          <h2 className="text-2xl font-black uppercase italic leading-tight">{pedido.cliente_nombre}</h2>
          <p className="text-xs font-bold text-stone-500 italic mb-4">📍 {pedido.direccion}</p>
          
          <div className="bg-stone-100 p-4 rounded-2xl border-4 border-black border-dashed mb-4 max-h-40 overflow-y-auto no-scrollbar font-bold text-sm">
            {pedido.items_resumen}
          </div>
          
          <p className="text-4xl font-black italic tracking-tighter mb-6 text-right">${pedido.total}</p>
          
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => cambiarEstado(pedido.id, 'en cocina')} className="font-black py-3 rounded-xl border-[3px] border-black text-[10px] uppercase bg-white hover:bg-orange-400">👨‍🍳 COCINA</button>
            <button onClick={() => cambiarEstado(pedido.id, 'en camino')} className="font-black py-3 rounded-xl border-[3px] border-black text-[10px] uppercase bg-white hover:bg-blue-500">🛵 ENVÍO</button>
            <button onClick={() => cambiarEstado(pedido.id, 'entregado')} className="col-span-2 font-black py-4 rounded-2xl border-4 border-black bg-green-500 text-white text-xs hover:bg-green-600">ENTREGAR ✅</button>
          </div>
        </div>
      ))}

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