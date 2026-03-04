"use client";
import { useEffect, useState, useRef } from 'react';
import { useCartStore } from '@/store/cartStore';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation'; // <-- Importado para la redirección

export default function CartDrawer({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const router = useRouter(); // <-- Inicializado
  const { items, total, clearCart } = useCartStore();
  const [isSending, setIsSending] = useState(false);
  const [montoEfectivo, setMontoEfectivo] = useState<string>(''); 
  
  const ALIAS_MP = "krustyburger2025"; 

  const [customer, setCustomer] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    metodoPago: 'Efectivo',
    tipoEntrega: 'Delivery',
    notas: ''
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Configuración de audio de apertura
    audioRef.current = new Audio('/sounds/dragon_ball_z_notification.mp3');
    audioRef.current.volume = 0.7;

    const saved = localStorage.getItem('krusty-customer-v2');
    if (saved) setCustomer(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      audioRef.current?.play().catch(() => {});
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  // LÓGICA DE VUELTO
  const montoTotal = total();
  const pagaCon = parseFloat(montoEfectivo);
  const vuelto = pagaCon > montoTotal ? pagaCon - montoTotal : 0;

  const handleCheckout = async () => {
    // 1. VALIDACIONES
    if (!customer.nombre || !customer.telefono || (customer.tipoEntrega === 'Delivery' && !customer.direccion)) {
      alert("🤡 ¡Hey! ¡Krusty dice que no podemos enviarte nada si no nos dices quién eres y dónde vives!");
      return;
    }

    if (customer.metodoPago === 'Efectivo' && pagaCon < montoTotal && montoEfectivo !== '') {
      alert("🤡 ¡Oye! Intenta pagarme menos de nuevo y llamaré a mis abogados. ¡Monto insuficiente!");
      return;
    }

    setIsSending(true);

    try {
      localStorage.setItem('krusty-customer-v2', JSON.stringify(customer));

      // Detalle de pago para la base de datos
      const detalleEfectivoDB = customer.metodoPago === 'Efectivo' && pagaCon > 0 
        ? ` (Paga con: $${pagaCon} | Vuelto: $${vuelto})` 
        : (customer.metodoPago === 'Efectivo' ? ' (Paga justo)' : '');

      // 2. GUARDAR EN SUPABASE
      const { error } = await supabase
        .from('pedidos')
        .insert([{
          cliente_nombre: customer.nombre,
          direccion: customer.tipoEntrega === 'Delivery' ? customer.direccion : 'RETIRA EN LOCAL',
          telefono: customer.telefono,
          metodo_pago: customer.metodoPago + detalleEfectivoDB,
          tipo_entrega: customer.tipoEntrega,
          notas: customer.notas,
          total: montoTotal,
          estado: 'pendiente',
          items_resumen: items.map(i => `${i.quantity}x ${i.nombre}`).join(', ')
        }]);

      if (error) throw error;

      // 3. PREPARAR WHATSAPP CON KRUSTEADAS
      const numeroTelefono = "5491138305837";
      const listaProductos = items
        .map((item) => `🍔 *${item.quantity}x* ${item.nombre.toUpperCase()}\n   _$${(item.precio * item.quantity).toLocaleString('es-AR')}_`)
        .join("\n\n");

      let infoPagoWA = `💳 *PAGO:* ${customer.metodoPago}\n`;
      if (customer.metodoPago === 'Efectivo') {
        infoPagoWA += pagaCon > montoTotal 
          ? `💵 *PAGA CON:* $${pagaCon.toLocaleString('es-AR')}\n💰 *VUELTO:* $${vuelto.toLocaleString('es-AR')}\n` 
          : `💵 *PAGA JUSTO*\n`;
      } else {
        infoPagoWA += `💰 *ALIAS MP:* ${ALIAS_MP}\n`;
      }

      const mensaje = encodeURIComponent(
        `🤡 *NUEVO PEDIDO - KRUSTY BURGER*\n` +
        `"¡Si no es Krusty, no es Burger!"\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `👤 *CLIENTE:* ${customer.nombre.toUpperCase()}\n` +
        `📞 *TEL:* ${customer.telefono}\n` +
        `🚀 *MODO:* ${customer.tipoEntrega.toUpperCase()}\n` +
        `📍 *DIR:* ${customer.tipoEntrega === 'Delivery' ? customer.direccion : 'Retira en local'}\n` +
        infoPagoWA +
        (customer.notas ? `📝 *NOTAS:* ${customer.notas}\n` : '') +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `${listaProductos}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `💰 *TOTAL: $${montoTotal.toLocaleString('es-AR')}*\n\n` +
        `🤡 _¡Gracias por elegir al payaso!_`
      );

      // 4. LIMPIEZA Y REDIRECCIÓN FINAL
      clearCart();
      onClose();
      
      // Abre WhatsApp en pestaña nueva
      window.open(`https://wa.me/${numeroTelefono}?text=${mensaje}`, "_blank");
      
      // Redirige a la página de gracias con GIF
      router.push('/gracias');

    } catch (error) {
      console.error(error);
      alert("❌ ¡Rayos! Hubo un error. ¡Seguro es culpa de Bob Patiño!");
    } finally {
      setIsSending(false);
    }
  };

  const isFormComplete = customer.nombre && customer.telefono && (customer.tipoEntrega === 'Retiro' || customer.direccion);

  return (
    <>
      <div className={`fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm transition-all duration-500 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`} onClick={onClose} />

      <div className={`fixed right-0 top-0 h-full w-full sm:w-[480px] bg-white z-[70] border-l-[6px] border-black transform transition-transform duration-500 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full bg-[#FBFBFB]">
          
          {/* Header */}
          <div className="p-6 border-b-[6px] border-black bg-[#D32F2F] text-white">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-black italic tracking-tighter drop-shadow-[3px_3px_0px_black] uppercase leading-none">Checkout</h2>
                <p className="text-[10px] font-bold uppercase mt-1 text-[#FFCA28]">Krusty Burger Springfield</p>
              </div>
              <button onClick={onClose} className="bg-black text-white w-10 h-10 rounded-xl border-4 border-white font-black hover:bg-[#FFCA28] transition-colors"> &times; </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar">
            
            {/* Tipo Entrega */}
            <div className="flex gap-2">
              {['Delivery', 'Retiro'].map((tipo) => (
                <button
                  key={tipo}
                  onClick={() => setCustomer({...customer, tipoEntrega: tipo})}
                  className={`flex-1 py-3 rounded-xl border-4 border-black font-black uppercase text-xs transition-all ${customer.tipoEntrega === tipo ? 'bg-[#FFCA28] shadow-[4px_4px_0px_0px_black] -translate-y-1' : 'bg-white text-stone-400'}`}
                >
                  {tipo === 'Delivery' ? '🛵 Envío' : '🏠 Retiro'}
                </button>
              ))}
            </div>

            {/* Inputs de Datos */}
            <div className="space-y-3">
              <input type="text" placeholder="¿TU NOMBRE?" className="w-full border-4 border-black p-3 rounded-xl font-bold uppercase text-xs focus:bg-[#FFCA28] outline-none transition-colors" value={customer.nombre} onChange={(e) => setCustomer({...customer, nombre: e.target.value})} />
              <input type="tel" placeholder="WHATSAPP" className="w-full border-4 border-black p-3 rounded-xl font-bold uppercase text-xs focus:bg-[#FFCA28] outline-none transition-colors" value={customer.telefono} onChange={(e) => setCustomer({...customer, telefono: e.target.value})} />
              {customer.tipoEntrega === 'Delivery' && (
                <input type="text" placeholder="DIRECCIÓN DE ENTREGA" className="w-full border-4 border-black p-3 rounded-xl font-bold uppercase text-xs focus:bg-[#FFCA28] outline-none" value={customer.direccion} onChange={(e) => setCustomer({...customer, direccion: e.target.value})} />
              )}
            </div>

            {/* Forma de Pago */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-stone-400 ml-1 tracking-widest">Forma de Pago</label>
              <div className="grid grid-cols-3 gap-2">
                {['Efectivo', 'Transferencia', 'QR'].map((pago) => (
                  <button
                    key={pago}
                    onClick={() => {
                        setCustomer({...customer, metodoPago: pago});
                        if (pago !== 'Efectivo') setMontoEfectivo('');
                    }}
                    className={`py-2 rounded-lg border-2 border-black font-black text-[10px] uppercase transition-all ${customer.metodoPago === pago ? 'bg-black text-white shadow-[2px_2px_0px_black]' : 'bg-white text-black'}`}
                  >
                    {pago}
                  </button>
                ))}
              </div>

              {/* KRUSTY CALCULADORA DE VUELTO */}
              {customer.metodoPago === 'Efectivo' && (
                <div className="bg-[#E8F5E9] border-4 border-black p-4 rounded-2xl relative overflow-hidden animate-in fade-in zoom-in-95">
                  <div className="absolute -right-2 -top-2 opacity-10 text-4xl rotate-12">🤡</div>
                  <p className="text-[10px] font-black uppercase text-green-800 mb-2 italic">
                    "¡No aceptamos billetes de $3!" — ¿Con cuánto pagas?
                  </p>
                  <div className="flex gap-3 items-center">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-green-700">$</span>
                      <input 
                        type="number" 
                        placeholder="Ej: 5000" 
                        className="w-full border-2 border-black p-2 pl-7 rounded-lg font-black bg-white outline-none focus:ring-2 ring-green-400 transition-all"
                        value={montoEfectivo}
                        onChange={(e) => setMontoEfectivo(e.target.value)}
                      />
                    </div>
                    {vuelto > 0 && (
                      <div className="bg-white border-2 border-black px-3 py-1 rounded-lg shadow-[3px_3px_0px_0px_black]">
                        <p className="text-[8px] font-black text-stone-400 uppercase leading-none">Vuelto:</p>
                        <p className="text-lg font-black text-green-600">${vuelto.toLocaleString('es-AR')}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {customer.metodoPago !== 'Efectivo' && (
                <div className="bg-red-50 border-2 border-dashed border-red-200 p-3 rounded-xl text-center">
                  <p className="text-[10px] font-black text-[#D32F2F] uppercase tracking-tighter">
                    Pagar al Alias: <span className="underline select-all">{ALIAS_MP}</span>
                  </p>
                </div>
              )}
            </div>

            <textarea placeholder="¿NOTAS ADICIONALES? (EJ: SIN CEBOLLA)" className="w-full border-4 border-black p-3 rounded-xl font-bold uppercase text-xs h-20 resize-none focus:bg-[#FFCA28] outline-none transition-colors" value={customer.notas} onChange={(e) => setCustomer({...customer, notas: e.target.value})} />
          </div>

          {/* Footer */}
          <div className="p-6 border-t-[6px] border-black bg-white">
            <div className="flex justify-between items-center mb-4">
              <span className="font-black uppercase italic text-sm text-stone-400">Total:</span>
              <span className="text-4xl font-black italic tracking-tighter text-black">${montoTotal.toLocaleString('es-AR')}</span>
            </div>
            
            <button 
              disabled={items.length === 0 || isSending}
              onClick={handleCheckout}
              className={`w-full py-5 rounded-[2rem] border-[4px] border-black font-black uppercase italic text-xl transition-all
                ${!isFormComplete || items.length === 0 
                  ? 'bg-stone-100 text-stone-300 border-stone-200 cursor-not-allowed' 
                  : 'bg-[#FFCA28] text-black shadow-[6px_6px_0px_0px_black] active:shadow-none active:translate-y-1 hover:bg-[#FFD54F]'
                }`}
            >
              {isSending ? 'PROCESANDO...' : (isFormComplete ? '¡PEDIR AHORA! 🍟' : 'FALTAN DATOS')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}