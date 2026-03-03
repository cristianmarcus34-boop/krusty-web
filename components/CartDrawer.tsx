"use client";
import { useEffect, useState, useRef } from 'react';
import { useCartStore } from '@/store/cartStore';

export default function CartDrawer({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { items, removeItem, total, addItem, decreaseQuantity } = useCartStore();
  const [isJumping, setIsJumping] = useState(false);
  
  // Referencia para el audio
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Inicializamos el audio (puedes usar un link directo o local)
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3'); 
    audioRef.current.volume = 0.4;
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setIsJumping(true);
      
      // DISPARAR SONIDO AL ABRIR
      audioRef.current?.play().catch(e => console.log("Interacción necesaria para audio"));

      const timer = setTimeout(() => setIsJumping(false), 500);
      return () => clearTimeout(timer);
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  const handleCheckout = () => {
    const numeroTelefono = "5491138305837";
    const listaProductos = items
      .map((item) => `🍔 *${item.quantity}x* ${item.nombre.toUpperCase()}\n   _Subtotal: $${(item.precio * item.quantity).toLocaleString('es-AR')}_`)
      .join("\n\n");

    const mensaje = encodeURIComponent(
      `🤡 *ORDEN DE COMPRA - KRUSTY BURGER*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `${listaProductos}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `💰 *TOTAL: $${total().toLocaleString('es-AR')}*\n\n` +
      `📍 _Confirmar si es Envío o Retiro_`
    );

    window.open(`https://wa.me/${numeroTelefono}?text=${mensaje}`, "_blank");
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm transition-all duration-500 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        onClick={onClose}
      />

      <div className={`fixed right-0 top-0 h-full w-full sm:w-[450px] bg-white z-[70] border-l-[6px] border-black shadow-[-25px_0px_50px_-15px_rgba(0,0,0,0.5)] transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        <div className="flex flex-col h-full bg-[#FBFBFB]">
          {/* Header con animación */}
          <div className="relative p-6 border-b-[6px] border-black bg-[#D32F2F] text-white overflow-hidden">
            <div className="relative z-10 flex justify-between items-center">
              <div className={isJumping ? 'animate-bounce' : ''}>
                <h2 className="text-3xl font-black italic tracking-tighter drop-shadow-[3px_3px_0px_rgba(0,0,0,1)] uppercase">
                  Mi Pedido
                </h2>
                <span className="text-[10px] font-bold bg-[#FFCA28] text-black px-2 py-0.5 rounded-md border-2 border-black uppercase">
                   {items.reduce((acc, item) => acc + item.quantity, 0)} Items Seleccionados
                </span>
              </div>
              <button 
                onClick={onClose} 
                className="bg-black text-white w-10 h-10 rounded-xl border-4 border-white font-black text-xl hover:bg-[#FFCA28] hover:text-black transition-all hover:rotate-12 active:scale-90"
              >
                &times;
              </button>
            </div>
          </div>

          {/* Lista de Items */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-40">
                <span className="text-8xl mb-4 grayscale">🍔</span>
                <p className="font-black uppercase text-xl text-stone-400">¿Tienes hambre?</p>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 bg-white p-3 rounded-[1.5rem] border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform active:scale-95">
                  <div className="w-16 h-16 bg-stone-50 rounded-xl border-2 border-black p-1 flex-shrink-0">
                    <img src={item.imagen} alt={item.nombre} className="w-full h-full object-contain" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-[11px] uppercase italic truncate text-black">{item.nombre}</h4>
                    <p className="text-[#D32F2F] font-black text-lg tracking-tighter">
                      ${(item.precio * item.quantity).toLocaleString('es-AR')}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center bg-stone-100 rounded-lg border-2 border-black p-0.5 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                        <button 
                          onClick={() => item.quantity > 1 ? decreaseQuantity(item.id) : removeItem(item.id)} 
                          className={`w-8 h-8 flex items-center justify-center font-black rounded-md transition-all ${item.quantity === 1 ? 'hover:bg-red-500 hover:text-white' : 'hover:bg-stone-300 text-stone-600'}`}
                        >
                          {item.quantity > 1 ? '−' : '✕'}
                        </button>

                        <span key={item.quantity} className="w-8 text-center font-black text-sm animate-in zoom-in duration-200">
                          {item.quantity}
                        </span>

                        <button 
                          onClick={() => addItem(item)} 
                          className="w-8 h-8 flex items-center justify-center font-black hover:bg-green-500 hover:text-white rounded-md transition-all text-stone-600"
                        >+</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Profesional */}
          <div className="p-6 border-t-[6px] border-black bg-white">
            <div className="flex justify-between items-end mb-4">
              <span className="text-stone-400 font-black uppercase text-[10px] tracking-widest">Total Estimado:</span>
              <div className="text-right">
                <p className="text-[10px] text-green-600 font-black uppercase tracking-tighter animate-pulse">Envío Bonificado</p>
                <span className="text-4xl font-black italic tracking-tighter text-black">
                  ${total().toLocaleString('es-AR')}
                </span>
              </div>
            </div>
            
            <button 
              disabled={items.length === 0}
              onClick={handleCheckout}
              className="group relative w-full bg-[#FFCA28] disabled:bg-stone-100 disabled:text-stone-300 text-black text-xl font-black py-5 rounded-[1.5rem] border-[4px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 transition-all uppercase italic flex items-center justify-center gap-3 overflow-hidden"
            >
              <span className="relative z-10">Enviar Pedido</span>
              <span className="text-2xl group-hover:rotate-12 transition-transform">🍟</span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </button>
            <p className="text-[8px] text-center mt-3 font-bold text-stone-400 uppercase tracking-widest">
              Springfield Food Co. &copy; 2026
            </p>
          </div>
        </div>
      </div>
    </>
  );
}