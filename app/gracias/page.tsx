"use client";
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { domToPng } from 'modern-screenshot';
import { useRouter } from 'next/navigation';

export default function GraciasPage() {
  const router = useRouter();
  const [pedido, setPedido] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const data = localStorage.getItem('ultimo_pedido_krusty');
    
    if (data) {
      const { id, fecha } = JSON.parse(data);
      const ahora = new Date().getTime();
      const seisHoras = 6 * 60 * 60 * 1000;

      if (ahora - fecha > seisHoras) {
        localStorage.removeItem('ultimo_pedido_krusty');
        router.push('/');
        return;
      }

      const fetchPedido = async () => {
        const { data: pedidoData } = await supabase
          .from('pedidos')
          .select('*')
          .eq('id', id)
          .single();
        
        if (pedidoData) setPedido(pedidoData);
        else router.push('/');
        setLoading(false);
      };
      fetchPedido();
    } else {
      router.push('/');
      setLoading(false);
    }

    const sound = new Audio('https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3');
    sound.volume = 0.15;
    sound.play().catch(() => {});
  }, [router]);

  const handleDownloadTicket = async () => {
    if (ticketRef.current) {
      setIsDownloading(true);
      try {
        const dataUrl = await domToPng(ticketRef.current, {
          scale: 3,
          quality: 1,
          backgroundColor: '#FFCA28',
        });
        
        const link = document.createElement("a");
        link.download = `Ticket-Krusty-${pedido?.id.toString().slice(-6) || 'pedido'}.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error("Error:", err);
        alert("¡Ay caramba! No se pudo guardar. Sacale captura.");
      } finally {
        setIsDownloading(false);
      }
    }
  };

  const handleVolverAlMenu = () => {
    localStorage.removeItem('ultimo_pedido_krusty');
    router.push('/');
  };

  if (loading) return (
    <div className="min-h-screen bg-[#FFCA28] flex flex-col items-center justify-center font-sans p-6">
      <div className="w-16 h-16 border-8 border-stone-900 border-t-[#D32F2F] rounded-full animate-spin mb-6 shadow-xl" />
      <p className="font-black text-xs uppercase tracking-[0.4em] text-stone-900 animate-pulse text-center">Cocinando tu Ticket...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFCA28] flex flex-col items-center justify-center p-4 pb-24 overflow-x-hidden relative font-sans">
      
      {/* Decoración de Fondo */}
      <div className="absolute top-0 left-0 w-full h-40 bg-[#D32F2F] -skew-y-3 -translate-y-10 shadow-2xl z-0" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#4DB6AC] rounded-full blur-[100px] opacity-30 -mr-32 -mb-32 pointer-events-none" />

      <div className="max-w-md w-full relative z-10 animate-in zoom-in-95 duration-500">
        
        <div className="flex justify-center mb-8 px-2">
          <button 
            onClick={handleDownloadTicket}
            disabled={isDownloading}
            className="flex items-center gap-3 px-6 sm:px-8 py-3 rounded-2xl border-4 border-stone-900 bg-white text-stone-900 text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-[6px_6px_0px_0px_rgba(28,25,23,1)] hover:translate-y-1 hover:translate-x-1 hover:shadow-none transition-all disabled:opacity-50 w-full justify-center sm:w-auto"
          >
            {isDownloading ? 'Generando...' : '📥 ¡Imprimir Cupón!'}
          </button>
        </div>

        {/* --- TICKET (Área de Captura) --- */}
        <div ref={ticketRef} className="bg-white relative shadow-[10px_10px_0px_0px_rgba(211,47,47,1)] border-4 border-stone-900 mx-1 overflow-hidden">
          
          {/* Marca de agua REAL */}
{/* Marca de agua REAL */}
<div className="absolute inset-0 flex items-center justify-center pointer-events-none p-8 z-0">
  <img 
    src="/images/krusty-watermark.png" 
    alt="Krusty Watermark" 
    className="w-full h-auto max-w-[400px] object-contain opacity-[0.20] " 
    // Sacamos el mixBlendMode para que los colores del PNG sean reales
  />
</div>

          {/* Zigzag Superior */}
          <div className="absolute -top-1 left-0 w-full overflow-hidden leading-[0] rotate-180">
            <svg className="relative block w-[calc(100%+1.3px)] h-4" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M0,0V120H1200V0L1150,40L1100,0L1050,40L1000,0L950,40L900,0L850,40L800,0L750,40L700,0L650,40L600,0L550,40L500,0L450,40L400,0L350,40L300,0L250,40L200,0L150,40L100,0L50,40L0,0Z" fill="#D32F2F"></path>
            </svg>
          </div>

          <div className="px-6 sm:px-8 pt-12 pb-8 text-stone-800 relative z-10">
            {/* Header */}
            <div className="text-center border-b-4 border-stone-100 pb-6 mb-8">
              <div className="inline-block bg-[#D32F2F] text-white text-[9px] font-black px-4 py-1.5 rounded-lg mb-4 tracking-[0.2em] uppercase border-2 border-stone-900 rotate-2 shadow-md">
                ¡Gracias por Comprar!
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-stone-900 leading-none mb-1 italic transform -skew-x-6">
                Krusty<span className="text-[#D32F2F]">Burger</span>
              </h1>
              <p className="text-[10px] font-black text-[#4DB6AC] uppercase tracking-[0.3em] mt-2">
                "Usted es mi víctima favorita"
              </p>
            </div>

            {/* Código de Barras */}
            <div className="flex flex-col items-center mb-8 bg-stone-50 p-4 border-2 border-stone-900 rounded-xl shadow-inner w-full overflow-hidden">
              <div className="flex gap-[1px] sm:gap-[1.5px] h-12 mb-2 w-full justify-center">
                {[1,4,2,1,5,2,1,3,1,2,4,2,1,2,5,1,3,1,2,4].map((w, i) => (
                  <div key={i} className="bg-stone-900 h-full flex-shrink" style={{ width: `${w}px` }} />
                ))}
              </div>
              <span className="text-xl sm:text-2xl font-black text-stone-900 tracking-[0.3em] sm:tracking-[0.4em] font-mono leading-none">
                #{pedido?.id.toString().slice(-6).toUpperCase() || 'KRUSTY'}
              </span>
            </div>

            {/* Listado de Productos */}
            <div className="space-y-4 mb-8">
              {pedido?.items_resumen?.split(', ').map((item: string, i: number) => (
                <div key={i} className="flex justify-between items-center text-xs font-black text-stone-900 uppercase italic">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-[#D32F2F] rotate-45 flex-shrink-0" />
                    <span className="bg-white pr-2 truncate">{item}</span>
                  </div>
                  <span className="text-[#4DB6AC] flex-shrink-0">OK</span>
                </div>
              ))}
            </div>

            {/* Caja de Total */}
            <div className="bg-white border-4 border-stone-900 p-5 sm:p-6 mb-8 relative shadow-[6px_6px_0px_0px_rgba(255,202,40,1)]">
              <div className="absolute -top-4 -right-2 bg-[#D32F2F] text-white text-[10px] font-black px-3 py-1 border-2 border-stone-900 uppercase -rotate-6 shadow-md z-20">
                PAGADO
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold text-stone-400 uppercase mb-2">
                <span>Vía: {pedido?.metodo_pago?.split('(')[0]}</span>
                <span>{new Date(pedido?.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between items-end border-t-2 border-stone-100 pt-4 gap-2">
                <span className="font-black text-sm text-stone-900 uppercase tracking-tighter flex-shrink-0">Total:</span>
                <span className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tighter leading-none flex-shrink-0">
                  ${pedido?.total?.toLocaleString('es-AR')}
                </span>
              </div>
            </div>

            {/* Dirección */}
            <div className="bg-[#4DB6AC]/10 p-5 rounded-2xl border-4 border-[#4DB6AC] text-center transform -rotate-1 w-full overflow-hidden">
              <p className="text-[10px] font-black text-[#4DB6AC] uppercase mb-1 tracking-widest">Enviar a Springfield:</p>
              <p className="text-[12px] sm:text-[13px] font-black uppercase leading-tight text-stone-800 italic break-words">
                {pedido?.direccion}
              </p>
            </div>

            {/* ADVERTENCIA MERCADO PAGO */}
            <div className="mt-8 px-4 py-3 bg-stone-900 rounded-lg transform rotate-1 border-2 border-[#D32F2F]">
              <p className="text-[9px] font-black text-white uppercase leading-tight tracking-tighter text-center">
                ⚠️ ATENCIÓN: Este ticket NO es un comprobante de pago legal. 
                Solo es válido si se presenta junto al comprobante oficial de <span className="text-[#00B1EA]">Mercado Pago</span>.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t-4 border-dashed border-stone-100 text-center opacity-60">
               <p className="text-[10px] font-black text-stone-400 uppercase leading-relaxed italic mb-4">
                "Si no ve al payaso al entregar,<br/>¡No es una Krusty Burger oficial!"
              </p>
            </div>
          </div>

          {/* Zigzag Inferior */}
          <div className="absolute -bottom-1 left-0 w-full overflow-hidden leading-[0]">
            <svg className="relative block w-[calc(100%+1.3px)] h-4" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M0,0V120H1200V0L1150,40L1100,0L1050,40L1000,0L950,40L900,0L850,40L800,0L750,40L700,0L650,40L600,0L550,40L500,0L450,40L400,0L350,40L300,0L250,40L200,0L150,40L100,0L50,40L0,0Z" fill="#f5f5f4"></path>
            </svg>
          </div>
        </div>

        {/* NAVEGACIÓN */}
        <div className="space-y-4 px-2 mt-10">
          <Link 
            href={`/pedido/${pedido?.id}`}
            className="flex items-center justify-center w-full bg-[#D32F2F] text-white py-5 rounded-2xl border-4 border-stone-900 font-black uppercase text-sm tracking-[0.2em] shadow-[8px_8px_0px_0px_rgba(28,25,23,1)] hover:scale-[1.02] active:scale-95 transition-all text-center"
          >
            📍 Rastrear mi Hamburguesa
          </Link>
          
          <button 
            onClick={handleVolverAlMenu}
            className="flex items-center justify-center w-full bg-white text-stone-500 border-4 border-stone-900 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-stone-50 transition-all text-center"
          >
            Volver al Menú
          </button>
        </div>
        
        <p className="mt-12 text-center text-stone-900 text-[10px] font-black uppercase tracking-[0.4em] px-2">
          Springfield Digital Systems · Powered by Powa
        </p>
      </div>
    </div>
  );
}