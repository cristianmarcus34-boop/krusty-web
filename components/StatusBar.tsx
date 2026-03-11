"use client";
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function StatusBar() {
  const [pedido, setPedido] = useState<any>(null);
  const [visible, setVisible] = useState(false);
  const channelRef = useRef<any>(null);
  
  // Ref para el audio y para seguir el último estado conocido (evita sonidos repetidos)
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ultimoEstadoRef = useRef<string | null>(null);

  useEffect(() => {
    // Inicializar el audio (Correcaminos)
    audioRef.current = new Audio('/sounds/correcaminos-bip.mp3');
    audioRef.current.volume = 0.5;

    const checkPedido = async () => {
      const id = localStorage.getItem('pedido_id');
      if (!id) {
        if (visible) setVisible(false);
        return;
      }

      const { data, error } = await supabase
        .from('pedidos')
        .select('id, estado')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error("❌ Error StatusBar:", error.message);
        return;
      }

      if (data && data.estado !== 'entregado') {
        // Si el estado en la DB es distinto al que teníamos guardado, y no es la primera carga...
        if (ultimoEstadoRef.current && data.estado !== ultimoEstadoRef.current) {
          playStatusSound();
        }
        
        setPedido(data);
        setVisible(true);
        ultimoEstadoRef.current = data.estado;
      } else {
        setVisible(false);
        setPedido(null);
        if (!data || data.estado === 'entregado') {
          localStorage.removeItem('pedido_id');
        }
      }
    };

    const playStatusSound = () => {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(e => console.log("Audio bloqueado por el navegador hasta interacción:", e));
      }
    };

    checkPedido();
    const interval = setInterval(checkPedido, 5000);

    const currentId = localStorage.getItem('pedido_id');
    if (currentId) {
      channelRef.current = supabase
        .channel(`status-bar-${currentId}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'pedidos', filter: `id=eq.${currentId}` },
          (payload) => {
            const nuevoEstado = payload.new.estado;
            
            // Si el estado cambió, disparamos sonido
            if (nuevoEstado !== ultimoEstadoRef.current) {
              playStatusSound();
            }

            if (nuevoEstado === 'entregado') {
              setVisible(false);
              setPedido(null);
              localStorage.removeItem('pedido_id');
            } else {
              setPedido(payload.new);
              setVisible(true);
              ultimoEstadoRef.current = nuevoEstado;
            }
          }
        )
        .subscribe();
    }

    return () => {
      clearInterval(interval);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  if (!pedido || !visible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] w-[92%] max-w-[400px]">
      <Link href={`/pedido/${pedido.id}`}>
        <div className="bg-black border-[4px] border-[#FFCA28] p-4 rounded-[2.5rem] shadow-[0_8px_0_0_#D32F2F] flex items-center justify-between group active:scale-95 transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
          
          <div className="flex items-center gap-4">
            <div className={`text-3xl ${pedido.estado === 'en camino' ? 'animate-bounce' : 'animate-pulse'}`}>
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

          <div className="bg-[#FFCA28] text-black px-4 py-2 rounded-2xl font-black text-[10px] uppercase italic border-2 border-black group-hover:bg-white transition-colors shadow-[2px_2px_0_0_#000]">
            VER ➜
          </div>
        </div>
      </Link>
    </div>
  );
}