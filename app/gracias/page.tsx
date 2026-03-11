"use client";
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { domToPng } from 'modern-screenshot';

export default function GraciasPage() {
  const [pedido, setPedido] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedId = localStorage.getItem('ultimo_pedido_id');
    
    if (savedId) {
      const fetchPedido = async () => {
        const { data } = await supabase
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
    sound.volume = 0.2;
    sound.play().catch(() => {});
  }, []);

  const handleDownloadTicket = async () => {
    if (ticketRef.current) {
      setIsDownloading(true);
      try {
        // Usamos domToPng de modern-screenshot que es compatible con Tailwind moderno
        const dataUrl = await domToPng(ticketRef.current, {
          scale: 2,
          quality: 1,
          backgroundColor: '#ffffff',
        });
        
        const link = document.createElement("a");
        link.download = `Ticket-Krusty-${pedido?.id.toString().slice(-6) || 'pedido'}.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error("Error al descargar:", err);
        alert("No se pudo generar la imagen automáticamente. ¡Sacale una captura a la pantalla!");
      } finally {
        setIsDownloading(false);
      }
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center font-sans">
      <div className="w-12 h-12 border-4 border-stone-200 border-t-[#D32F2F] rounded-full animate-spin mb-4" />
      <p className="font-black text-[10px] uppercase tracking-[0.3em] text-stone-400">Imprimiendo Ticket...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 pb-20 overflow-hidden relative font-sans">
      
      {/* CÍRCULOS DE FONDO (Solo visuales, no se descargan) */}
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
              ${isDownloading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-stone-900 hover:text-white shadow-sm active:scale-95'}
            `}
          >
            {isDownloading ? (
              <>
                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Procesando...
              </>
            ) : (
              <>📥 Guardar Comprobante</>
            )}
          </button>
        </div>

        {/* --- TICKET (Área de Captura) --- */}
        <div ref={ticketRef} className="bg-white relative shadow-2xl mb-8 border border-stone-100">
          
          {/* Zigzag Superior con SVG (Más compatible que clip-path) */}
          <div className="absolute -top-1 left-0 w-full overflow-hidden leading-[0] rotate-180">
            <svg className="relative block w-[calc(100%+1.3px)] h-[10px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M0,0V120H1200V0C1175.33,0,1150.67,20,1126,20S1076.67,0,1052,0,1002.67,20,978,20,928.67,0,904,0,854.67,20,830,20,780.67,0,756,0,706.67,20,682,20,632.67,0,608,0,558.67,20,534,20,484.67,0,460,0,410.67,20,386,20,336.67,0,312,0,262.67,20,238,20,188.67,0,164,0,114.67,20,90,20,40.67,0,16,0,0,0,0,0Z" fill="#f5f5f4"></path>
            </svg>
          </div>

          <div className="px-8 pt-12 pb-8 text-stone-800">
            <div className="text-center border-b border-dashed border-stone-200 pb-6 mb-6">
              <div className="inline-block bg-stone-900 text-white text-[8px] font-black px-3 py-1 rounded-full mb-4 tracking-widest uppercase">
                Confirmación de Orden
              </div>
              <h1 className="text-4xl font-black tracking-tighter text-stone-900 leading-none mb-1">
                Krusty<span className="text-[#D32F2F]">Burger</span>
              </h1>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-2">
                {pedido ? new Date(pedido.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }) : '---'}
              </p>
            </div>

            <div className="text-center mb-8">
              <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest mb-2">ID del Pedido</p>
              <div className="bg-stone-50 border border-stone-100 rounded-2xl py-3 px-6 inline-block">
                <span className="text-2xl font-black text-stone-900 tracking-widest">
                  #{pedido?.id.toString().slice(-6) || '------'}
                </span>
              </div>
            </div>

            <div className="space-y-3 mb-8">
              {pedido?.items_resumen?.split(', ').map((item: string, i: number) => (
                <div key={i} className="flex justify-between items-center text-xs font-bold text-stone-600">
                  <span className="truncate pr-4 uppercase">{item}</span>
                  <span className="text-stone-200 shrink-0">------------</span>
                </div>
              ))}
            </div>

            <div className="bg-stone-50 rounded-[2rem] p-6 mb-8 border border-stone-100">
              <div className="flex justify-between text-[10px] font-bold text-stone-400 uppercase mb-2">
                <span>Metodo:</span>
                <span className="text-stone-800">{pedido?.metodo_pago?.split('(')[0]}</span>
              </div>
              <div className="pt-3 border-t border-stone-200/50 flex justify-between items-end">
                <span className="font-black text-xs text-stone-900 uppercase">Total:</span>
                <span className="text-3xl font-black text-stone-900 tracking-tighter">
                  ${pedido?.total?.toLocaleString('es-AR')}
                </span>
              </div>
            </div>

            <div className="bg-stone-50 p-4 rounded-2xl border border-dashed border-stone-200 text-center">
              <p className="text-[8px] font-black text-stone-300 uppercase mb-1 tracking-widest">Destino</p>
              <p className="text-[11px] font-bold uppercase leading-tight text-stone-600">
                {pedido?.direccion}
              </p>
            </div>

            <div className="mt-10 pt-6 border-t border-dashed border-stone-200 text-center opacity-40">
               <p className="text-[9px] font-bold text-stone-400 uppercase leading-relaxed mb-4">
                "Usted es nuestro cliente preferido,<br/>después del Capitán McAllister."
              </p>
            </div>
          </div>

          {/* Zigzag Inferior con SVG */}
          <div className="absolute -bottom-1 left-0 w-full overflow-hidden leading-[0]">
            <svg className="relative block w-[calc(100%+1.3px)] h-[10px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M0,0V120H1200V0C1175.33,0,1150.67,20,1126,20S1076.67,0,1052,0,1002.67,20,978,20,928.67,0,904,0,854.67,20,830,20,780.67,0,756,0,706.67,20,682,20,632.67,0,608,0,558.67,20,534,20,484.67,0,460,0,410.67,20,386,20,336.67,0,312,0,262.67,20,238,20,188.67,0,164,0,114.67,20,90,20,40.67,0,16,0,0,0,0,0Z" fill="#f5f5f4"></path>
            </svg>
          </div>
        </div>

        {/* NAVEGACIÓN */}
        <div className="space-y-4 px-4">
          <Link 
            href={`/pedido/${pedido?.id}`}
            className="flex items-center justify-center w-full bg-stone-900 text-[#FFCA28] py-5 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
          >
            📍 Seguir Pedido en Vivo
          </Link>
          
          <Link 
            href="/"
            className="flex items-center justify-center w-full bg-white text-stone-400 border border-stone-100 py-4 rounded-[2rem] font-bold uppercase text-[10px] tracking-widest hover:bg-stone-50 transition-all"
          >
            Volver al Menú
          </Link>
        </div>
        
        <p className="mt-12 text-center text-stone-300 text-[8px] font-black uppercase tracking-[0.4em]">
          Springfield Digital Systems · Powered by Powa
        </p>
      </div>
    </div>
  );
}