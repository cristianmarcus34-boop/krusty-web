"use client";
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function StatusBar() {
  const [pedido, setPedido] = useState<any>(null);
  const [visible, setVisible] = useState(false);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    // 1. FUNCIÓN DE VERIFICACIÓN (Polling de seguridad)
    const checkPedido = async () => {
      const id = localStorage.getItem('pedido_id');

      if (!id) {
        if (visible) setVisible(false);
        return;
      }

      // Usamos .maybeSingle() para evitar el error 406 si el pedido no existe
      const { data, error } = await supabase
        .from('pedidos')
        .select('id, estado')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error("❌ Error StatusBar:", error.message);
        return;
      }

      // Lógica de visibilidad
      if (data && data.estado !== 'entregado') {
        setPedido(data);
        setVisible(true);
      } else {
        setVisible(false);
        setPedido(null);
        // Si el pedido no existe en DB o ya se entregó, limpiamos rastro
        if (!data || data.estado === 'entregado') {
          localStorage.removeItem('pedido_id');
        }
      }
    };

    // Ejecución inicial
    checkPedido();

    // 2. INTERVALO (Detecta si el usuario hizo un pedido nuevo en otra pestaña)
    const interval = setInterval(checkPedido, 5000);

    // 3. SUSCRIPCIÓN REALTIME (Actualización instantánea)
    const currentId = localStorage.getItem('pedido_id');

    if (currentId) {
      console.log(`📡 Escuchando cambios para pedido: ${currentId}`);

      channelRef.current = supabase
        .channel(`status-bar-${currentId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'pedidos',
            filter: `id=eq.${currentId}`
          },
          (payload) => {
            console.log("🔔 Cambio de estado detectado:", payload.new.estado);

            if (payload.new.estado === 'entregado') {
              setVisible(false);
              setPedido(null);
              localStorage.removeItem('pedido_id');
            } else {
              setPedido(payload.new);
              setVisible(true);
            }
          }
        )
        .subscribe();
    }

    // LIMPIEZA AL DESMONTAR
    return () => {
      clearInterval(interval);
      if (channelRef.current) {
        console.log("🧹 Limpiando canal StatusBar");
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []); // <--- VACÍO: Evita el bucle infinito de re-suscripciones

  // Si no hay pedido activo, no renderizamos nada
  if (!pedido || !visible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] w-[92%] max-w-[400px]">
      <Link href={`/pedido/${pedido.id}`}>
        <div className="bg-black border-[4px] border-[#FFCA28] p-4 rounded-[2.5rem] shadow-[0_8px_0_0_#D32F2F] flex items-center justify-between group active:scale-95 transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">

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

          <div className="bg-[#FFCA28] text-black px-4 py-2 rounded-2xl font-black text-[10px] uppercase italic border-2 border-black group-hover:bg-white transition-colors shadow-[2px_2px_0_0_#000] shimer-effect">
            VER ➜
          </div>
        </div>
      </Link>
    </div>
  );
}