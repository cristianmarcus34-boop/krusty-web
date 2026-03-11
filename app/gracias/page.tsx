"use client";
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import html2canvas from 'html2canvas';

export default function GraciasPage() {
  const [pedido, setPedido] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedId = localStorage.getItem('ultimo_pedido_id');
    if (savedId) {
      const fetchPedido = async () => {
        const { data } = await supabase.from('pedidos').select('*').eq('id', savedId).single();
        if (data) setPedido(data);
        setLoading(false);
      };
      fetchPedido();
    } else {
      setLoading(false);
    }
    const sound = new Audio('https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3');
    sound.volume = 0.2;
    sound.play().catch(() => {});
  }, []);

  const handleDownloadTicket = async () => {
    if (ticketRef.current) {
      setIsDownloading(true);
      try {
        // SOLUCIÓN DEFINITIVA: Forzamos el renderizado a ignorar colores complejos
        const canvas = await html2canvas(ticketRef.current, {
          scale: 2,
          backgroundColor: "#ffffff",
          useCORS: true,
          logging: false,
          allowTaint: true,
          // Eliminamos sombras y efectos que suelen usar funciones 'lab' u 'oklch'
          onclone: (clonedDoc) => {
            const ticket = clonedDoc.getElementById('ticket-download-area');
            if (ticket) {
              ticket.style.boxShadow = 'none';
              ticket.style.transform = 'none';
              // Limpieza recursiva de colores para html2canvas
              const allElements = ticket.getElementsByTagName("*");
              for (let i = 0; i < allElements.length; i++) {
                const el = allElements[i] as HTMLElement;
                el.style.color = "#1c1917"; // Forzado a stone-800 sólido
                el.style.borderColor = "#e7e5e4"; // Forzado a stone-200 sólido
              }
            }
          }
        });
        
        const image = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = image;
        link.download = `Ticket-Krusty-${pedido?.id.toString().slice(-6) || 'pedido'}.png`;
        link.click();
      } catch (err) {
        console.error("Error al descargar:", err);
        alert("Hubo un error al generar la imagen. ¡Intenta de nuevo!");
      } finally {
        setIsDownloading(false);
      }
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-stone-200 border-t-[#D32F2F] rounded-full animate-spin mb-4" />
      <p className="font-black text-[10px] uppercase tracking-[0.3em] text-stone-400">Imprimiendo Ticket...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 pb-20 overflow-hidden relative">
      
      {/* FONDO DECORATIVO */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] aspect-square bg-[#FFCA28]/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] aspect-square bg-[#D32F2F]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-md w-full relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* BOTÓN DESCARGAR */}
        <div className="flex justify-center mb-6">
          <button 
            onClick={handleDownloadTicket}
            disabled={isDownloading}
            className={`
              flex items-center gap-2 px-6 py-2 rounded-full border border-stone-200 bg-white text-[10px] font-black uppercase tracking-widest transition-all
              ${isDownloading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-stone-900 hover:text-white shadow-sm'}
            `}
          >
            {isDownloading ? 'Generando...' : '📥 Guardar Comprobante'}
          </button>
        </div>

        {/* CONTENEDOR TICKET (Lo que se descarga) */}
        <div ref={ticketRef} id="ticket-download-area" className="relative shadow-2xl mb-8 bg-white">
          
          {/* Zigzag Superior */}
          <div className="absolute -top-3 left-0 w-full h-4 bg-white" 
               style={{ clipPath: "polygon(0% 100%, 5% 0%, 10% 100%, 15% 0%, 20% 100%, 25% 0%, 30% 100%, 35% 0%, 40% 100%, 45% 0%, 50% 100%, 55% 0%, 60% 100%, 65% 0%, 70% 100%, 75% 0%, 80% 100%, 85% 0%, 90% 100%, 95% 0%, 100% 100%)" }}>
          </div>

          <div className="px-8 pt-12 pb-8 bg-white">
            <div className="text-center border-b border-dashed border-stone-200 pb-6 mb-6">
              <h1 className="text-4xl font-black tracking-tighter text-stone-900 leading-none">
                Krusty<span className="text-[#D32F2F]">Burger</span>
              </h1>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-2">
                {pedido ? new Date(pedido.created_at).toLocaleDateString('es-AR') : '---'}
              </p>
            </div>

            <div className="text-center mb-8">
              <div className="bg-stone-50 border border-stone-100 rounded-2xl py-3 px-6 inline-block text-stone-900 font-black text-2xl tracking-widest">
                #{pedido?.id.toString().slice(-6) || '------'}
              </div>
            </div>

            <div className="space-y-3 mb-8">
              {pedido?.items_resumen?.split(', ').map((item: string, i: number) => (
                <div key={i} className="flex justify-between text-xs font-bold text-stone-600 uppercase">
                  <span>{item}</span>
                  <span className="text-stone-200">------</span>
                </div>
              ))}
            </div>

            <div className="bg-stone-50 rounded-[2rem] p-6 mb-8 border border-stone-100">
              <div className="flex justify-between text-[10px] font-bold text-stone-400 uppercase mb-2">
                <span>Metodo:</span>
                <span className="text-stone-800">{pedido?.metodo_pago}</span>
              </div>
              <div className="pt-3 border-t border-stone-200/50 flex justify-between items-end">
                <span className="font-black text-xs text-stone-900 uppercase tracking-widest">Total:</span>
                <span className="text-3xl font-black text-stone-900 tracking-tighter">
                  ${pedido?.total?.toLocaleString('es-AR')}
                </span>
              </div>
            </div>

            <div className="mt-6 text-center opacity-30">
               <div className="flex justify-center items-end gap-[1.5px] h-10 overflow-hidden">
                {[...Array(30)].map((_, i) => (
                  <div key={i} className="bg-black" style={{ width: `${(i % 3 === 0) ? '3px' : '1px'}`, height: `${60 + Math.random() * 40}%` }}></div>
                ))}
              </div>
            </div>
          </div>

          {/* Zigzag Inferior */}
          <div className="absolute -bottom-3 left-0 w-full h-4 bg-white" 
               style={{ clipPath: "polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)" }}>
          </div>
        </div>

        {/* BOTONES DE NAVEGACIÓN */}
        <div className="space-y-4 px-4">
          <Link href={`/pedido/${pedido?.id}`} className="flex items-center justify-center w-full bg-stone-900 text-[#FFCA28] py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl">
            📍 Seguir Pedido
          </Link>
          <Link href="/" className="flex items-center justify-center w-full bg-white text-stone-400 border border-stone-100 py-4 rounded-[2rem] font-bold uppercase text-[10px] tracking-widest">
            Volver al Menú
          </Link>
        </div>
      </div>
    </div>
  );
}