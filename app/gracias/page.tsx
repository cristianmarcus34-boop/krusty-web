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
    if (!ticketRef.current) return;
    setIsDownloading(true);

    try {
      // OPCIÓN MÁS SEGURA: Forzamos a html2canvas a ignorar el CSS externo problemático
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        // Removemos estilos que causan el error 'lab' antes de renderizar
        ignoreElements: (element) => {
          // Si hay algún elemento externo que sospeches, podes filtrarlo acá
          return false;
        },
        onclone: (clonedDoc) => {
          // 1. Buscamos el ticket clonado
          const ticket = clonedDoc.getElementById('ticket-final');
          if (ticket) {
            // 2. Limpieza total de colores modernos en el clon
            const all = ticket.getElementsByTagName("*");
            for (let i = 0; i < all.length; i++) {
              const el = all[i] as HTMLElement;
              el.style.color = "#1c1917"; // Stone-800
              el.style.borderColor = "#e7e5e4"; // Stone-200
              el.style.boxShadow = "none";
            }
            ticket.style.boxShadow = "none";
          }
        }
      });

      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `Ticket-Krusty-${pedido?.id.toString().slice(-6)}.png`;
      link.click();
    } catch (err) {
      console.error("Error al descargar:", err);
      alert("Error de renderizado. Intentá sacar una captura de pantalla.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center font-sans">
      <div className="w-10 h-10 border-4 border-stone-100 border-t-red-600 rounded-full animate-spin mb-4" />
      <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Cargando Pedido...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 font-sans">
      
      {/* Botón de descarga fuera del ref */}
      <button 
        onClick={handleDownloadTicket}
        disabled={isDownloading}
        className="mb-6 px-8 py-3 bg-white border border-stone-200 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-stone-950 hover:text-white transition-all disabled:opacity-50"
      >
        {isDownloading ? "Procesando..." : "📥 Guardar Ticket"}
      </button>

      {/* TICKET - ID único para la limpieza */}
      <div 
        ref={ticketRef} 
        id="ticket-final"
        className="w-full max-w-[350px] bg-white relative"
        style={{ color: '#1c1917' }} // Forzamos color base inline
      >
        {/* Zigzag manual con CSS para evitar clip-path complejo si falla */}
        <div className="h-2 w-full bg-white mb-2" style={{ backgroundImage: 'linear-gradient(45deg, transparent 33.33%, #fafaf9 33.33%, #fafaf9 66.66%, transparent 66.66%), linear-gradient(-45deg, transparent 33.33%, #fafaf9 33.33%, #fafaf9 66.66%, transparent 66.66%)', backgroundSize: '12px 24px' }} />

        <div className="px-8 py-6 border-x border-stone-100">
          <div className="text-center border-b border-dashed border-stone-200 pb-6 mb-6">
            <h1 className="text-3xl font-black tracking-tighter uppercase">
              Krusty<span className="text-red-600">Burger</span>
            </h1>
            <p className="text-[9px] font-bold text-stone-400 tracking-[0.2em] mt-2">
              {pedido ? new Date(pedido.created_at).toLocaleString('es-AR') : '---'}
            </p>
          </div>

          <div className="text-center mb-8">
            <span className="text-2xl font-black tracking-[0.2em] text-stone-900">
              #{pedido?.id.toString().slice(-6) || '000000'}
            </span>
          </div>

          <div className="space-y-3 mb-8">
            {pedido?.items_resumen?.split(', ').map((item: string, i: number) => (
              <div key={i} className="flex justify-between text-[11px] font-bold uppercase">
                <span className="text-stone-600">{item}</span>
              </div>
            ))}
          </div>

          <div className="bg-stone-50 p-5 rounded-2xl mb-6">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase text-stone-400">Total Pagado</span>
              <span className="text-2xl font-black text-stone-900">
                ${pedido?.total?.toLocaleString('es-AR')}
              </span>
            </div>
          </div>

          <div className="text-[10px] text-center text-stone-400 font-medium italic">
            "Gracias, vuelva prontos"
          </div>
        </div>

        <div className="h-2 w-full bg-white mt-2" style={{ backgroundImage: 'linear-gradient(45deg, #fafaf9 33.33%, transparent 33.33%, transparent 66.66%, #fafaf9 66.66%), linear-gradient(-45deg, #fafaf9 33.33%, transparent 33.33%, transparent 66.66%, #fafaf9 66.66%)', backgroundSize: '12px 24px', transform: 'rotate(180deg)' }} />
      </div>

      {/* Botones de navegación - Claramente fuera del ticket */}
      <div className="mt-8 w-full max-w-[350px] space-y-3">
        <Link href={`/pedido/${pedido?.id}`} className="block w-full bg-stone-950 text-[#FFCA28] text-center py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all">
          📍 Seguir mi pedido
        </Link>
        <Link href="/" className="block w-full bg-white text-stone-400 text-center py-4 rounded-2xl font-bold uppercase text-[10px] tracking-widest border border-stone-100">
          Cerrar
        </Link>
      </div>
    </div>
  );
}