"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function StatusBar() {
  const [pedido, setPedido] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const checkPedido = async () => {
      const id = localStorage.getItem('pedido_id');
      
      if (!id) {
        setPedido(null);
        setVisible(false);
        return;
      }

      // Evitamos re-consultas innecesarias si el ID es el mismo
      if (pedido && pedido.id === id) return;

      const { data, error } = await supabase
        .from('pedidos')
        .select('id, estado')
        .eq('id', id)
        .single();

      if (data && data.estado !== 'entregado') {
        setPedido(data);
        setVisible(true);
      } else {
        setVisible(false);
        // Si el estado es entregado, limpiamos localStorage
        if (data?.estado === 'entregado') localStorage.removeItem('pedido_id');
      }
    };

    // Ejecutar al montar
    checkPedido();

    // Listener para detectar cambios en localStorage (cuando el CartDrawer guarda el ID)
    const interval = setInterval(checkPedido, 3000);

    // Suscripción Realtime para cambios de estado (Admin -> Cliente)
    const id = localStorage.getItem('pedido_id');
    let channel: any;
    
    if (id) {
      channel = supabase
        .channel(`status-bar-${id}`)
        .on('postgres_changes', 
          { event: 'UPDATE', schema: 'public', table: 'pedidos', filter: `id=eq.${id}` }, 
          (payload) => {
            if (payload.new.estado === 'entregado') {
              setVisible(false);
              localStorage.removeItem('pedido_id');
            } else {
              setPedido(payload.new);
            }
          }
        ).subscribe();
    }

    return () => {
      clearInterval(interval);
      if (channel) supabase.removeChannel(channel);
    };
  }, [pedido]);

  if (!pedido || !visible) return null;

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] w-[92%] max-w-[400px] transition-all duration-500 transform ${visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
      <Link href={`/pedido/${pedido.id}`}>
        <div className="bg-black border-[4px] border-[#FFCA28] p-4 rounded-[2.5rem] shadow-[0_8px_0_0_#D32F2F] flex items-center justify-between group active:scale-95 transition-transform">
          
          <div className="flex items-center gap-4">
            <div className="text-3xl animate-bounce-short">
              {pedido.estado === 'pendiente' && '📩'}
              {pedido.estado === 'en cocina' && '👨‍🍳'}
              {pedido.estado === 'en camino' && '🛵'}
            </div>
            
            <div>
              <p className="text-[9px] font-black uppercase text-[#FFCA28] tracking-widest leading-none mb-1">
                TU PEDIDO ESTÁ:
              </p>
              <p className="text-white font-black uppercase italic text-sm tracking-tight">
                {pedido.estado === 'pendiente' && 'Recibido'}
                {pedido.estado === 'en cocina' && 'En la parrilla'}
                {pedido.estado === 'en camino' && '¡Yendo a tu casa!'}
              </p>
            </div>
          </div>

          <div className="bg-[#FFCA28] text-black px-4 py-2 rounded-2xl font-black text-[10px] uppercase italic border-2 border-black group-hover:bg-white transition-colors">
            VER ➜
          </div>
        </div>
      </Link>
    </div>
  );
}