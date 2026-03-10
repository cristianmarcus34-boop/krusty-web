"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function GraciasPage() {
  const [pedido, setPedido] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const savedId = localStorage.getItem('ultimo_pedido_id');
    
    if (savedId) {
      const fetchPedido = async () => {
        const { data, error } = await supabase
          .from('pedidos')
          .select('*')
          .eq('id', savedId)
          .single();
        
        if (data) setPedido(data);
        setLoading(false);
      };
      fetchPedido();
    } else {
      setLoading(false);
    }

    const sound = new Audio('https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3');
    sound.volume = 0.3;
    sound.play().catch(() => {});
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#FFCA28] flex items-center justify-center font-black italic uppercase">
      Imprimiendo Ticket...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFCA28] flex flex-col items-center justify-center p-4 font-mono pb-10">
      
      {/* TICKET CONTENEDOR */}
      <div className="max-w-md w-full relative mb-8 drop-shadow-2xl animate-fade-in">
        
        {/* Borde zigzag arriba */}
        <div className="absolute -top-3 left-0 w-full h-4 bg-white" 
             style={{ clipPath: "polygon(0% 100%, 5% 0%, 10% 100%, 15% 0%, 20% 100%, 25% 0%, 30% 100%, 35% 0%, 40% 100%, 45% 0%, 50% 100%, 55% 0%, 60% 100%, 65% 0%, 70% 100%, 75% 0%, 80% 100%, 85% 0%, 90% 100%, 95% 0%, 100% 100%)" }}>
        </div>

        <div className="bg-white p-6 sm:p-8 pt-10 text-black border-x-2 border-stone-200">
          
          {/* Encabezado */}
          <div className="text-center border-b-2 border-dashed border-stone-300 pb-4 mb-4">
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-[#D32F2F] leading-none mb-2">
              KRUSTY BURGER
            </h1>
            <p className="text-[10px] font-bold text-stone-500 uppercase">Ticket de Confirmación</p>
            <p className="text-[9px] font-bold text-stone-400 mt-1 uppercase">
              {pedido ? new Date(pedido.created_at).toLocaleString() : '---'}
            </p>
          </div>

          {/* Estado y ID */}
          <div className="text-center mb-6">
            <p className="text-[10px] font-bold text-stone-500 uppercase">Orden:</p>
            <p className="bg-black text-white text-2xl font-black py-1 inline-block px-4 mb-2">
              #{pedido?.id.toString().slice(-6) || 'N/A'}
            </p>
            <h2 className="text-xl font-black uppercase italic text-green-600 leading-tight">
              ¡PAGO CONFIRMADO!
            </h2>
          </div>

          {/* DETALLE DE PRODUCTOS */}
          <div className="space-y-2 mb-6 text-xs uppercase font-bold">
            <div className="border-b border-stone-100 pb-1 mb-2 flex justify-between text-stone-400 text-[9px]">
              <span>Descripción</span>
              <span>Total</span>
            </div>
            {pedido?.items_resumen?.split(', ').map((item: string, i: number) => (
              <div key={i} className="flex justify-between items-start gap-4">
                <span className="leading-tight">{item}</span>
                <span className="shrink-0">---</span>
              </div>
            ))}
          </div>

          {/* TOTALES */}
          <div className="border-t-2 border-dashed border-stone-300 pt-4 mb-6 space-y-1">
            <div className="flex justify-between font-bold text-xs uppercase">
              <span>Metodo de Pago:</span>
              <span className="max-w-[150px] text-right">{pedido?.metodo_pago}</span>
            </div>
            <div className="flex justify-between font-bold text-xs uppercase">
              <span>Entrega:</span>
              <span>{pedido?.tipo_entrega}</span>
            </div>
            <div className="flex justify-between items-end pt-4">
              <span className="font-black text-lg italic uppercase">Total:</span>
              <span className="text-3xl font-black italic leading-none">
                ${pedido?.total?.toLocaleString('es-AR')}
              </span>
            </div>
          </div>

          {/* DATOS DE ENTREGA */}
          <div className="bg-stone-50 p-3 rounded-lg border-2 border-black border-dashed mb-6">
            <p className="text-[9px] font-black text-stone-400 uppercase mb-1">Dirección de Envío:</p>
            <p className="text-[11px] font-bold uppercase leading-tight italic">
              {pedido?.direccion}
            </p>
          </div>

          {/* BOTONES DE ACCIÓN */}
          <div className="space-y-3 relative z-10">
            {pedido && (
              <Link 
                href={`/pedido/${pedido.id}`}
                className="flex items-center justify-center gap-3 w-full bg-black text-[#FFCA28] p-4 rounded-xl font-black uppercase italic text-sm shadow-[4px_4px_0px_0px_#D32F2F] active:translate-y-1 active:shadow-none transition-all"
              >
                📍 SEGUIR MI PEDIDO
              </Link>
            )}

            <Link 
              href="/"
              className="flex items-center justify-center w-full bg-stone-100 text-stone-500 border-2 border-dashed border-stone-300 p-3 rounded-xl font-black uppercase italic text-[10px] hover:bg-stone-200 transition-all"
            >
              ← NUEVA COMPRA
            </Link>
          </div>

          {/* Pie del Ticket */}
          <div className="mt-8 text-center">
            <div className="border-t-2 border-dashed border-stone-300 pt-4 mb-4">
              <p className="text-[9px] font-bold text-stone-400 uppercase leading-tight">
                Krusty te lo agradece<br/>
                (pero no te devuelve la plata).
              </p>
            </div>
            {/* Código de barras */}
            <div className="flex justify-center gap-[2px] h-6 opacity-40">
                {[...Array(25)].map((_, i) => (
                    <div key={i} className="bg-black" style={{ width: `${Math.random() * 3 + 1}px` }}></div>
                ))}
            </div>
          </div>

        </div>

        {/* Borde zigzag abajo */}
        <div className="absolute -bottom-3 left-0 w-full h-4 bg-white" 
             style={{ clipPath: "polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)" }}>
        </div>
      </div>
      
      <p className="text-black/40 text-[9px] font-black uppercase tracking-[0.2em]">
        Springfield Digital Systems © 1989
      </p>

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}