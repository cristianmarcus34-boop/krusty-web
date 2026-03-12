"use client";
import { useEffect, useState, useMemo } from 'react';
import { useCartStore } from '@/store/cartStore';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const ZONAS_REPARTO = [
  { nombre: "Villa La Florida (Cerca - hasta 10 cuadras)", costo: 0 },
  { nombre: "Villa La Florida (Lejos)", costo: 700 },
  { nombre: "San Francisco Solano", costo: 1500 },
  { nombre: "Quilmes Oeste / Este", costo: 1900 },
  { nombre: "Ezpeleta", costo: 1900 },
  { nombre: "Florencio Varela", costo: 2000 },
];

const ALIAS_TRANSFERENCIA = "krustyburger2025";
const DIRECCION_LOCAL = "CALLE 853 1149, VILLA LA FLORIDA"; 

export default function CartDrawer({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { items, total, clearCart, addItem, decreaseQuantity } = useCartStore();
  
  const [isSending, setIsSending] = useState(false);
  const [montoEfectivo, setMontoEfectivo] = useState<string>(''); 
  const [copied, setCopied] = useState(false);

  const [customer, setCustomer] = useState({
    nombre: '',
    barrio: '', 
    calleAltura: '', 
    telefono: '',
    metodoPago: 'Efectivo',
    tipoEntrega: 'Delivery',
    notes: ''
  });

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('krusty-customer-v5');
    if (saved) setCustomer(JSON.parse(saved));
  }, []);

  const costoEnvio = useMemo(() => {
    if (customer.tipoEntrega === 'Retiro') return 0;
    const zona = ZONAS_REPARTO.find(z => z.nombre === customer.barrio);
    return zona ? zona.costo : 0;
  }, [customer.barrio, customer.tipoEntrega]);

  const subtotal = total();
  const montoTotalFinal = subtotal + costoEnvio;

  const handleCopyAlias = () => {
    navigator.clipboard.writeText(ALIAS_TRANSFERENCIA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isFormValid = useMemo(() => {
    const hasName = customer.nombre.trim().length > 2;
    const hasValidPhone = /^[0-9]{8,15}$/.test(customer.telefono.replace(/\s/g, ''));
    if (customer.tipoEntrega === 'Retiro') return hasName && hasValidPhone;
    return hasName && hasValidPhone && customer.barrio !== '' && customer.calleAltura.trim().length > 4;
  }, [customer]);

  const vuelto = useMemo(() => {
    const paga = parseFloat(montoEfectivo);
    return paga > montoTotalFinal ? paga - montoTotalFinal : 0;
  }, [montoEfectivo, montoTotalFinal]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
  }, [isOpen]);

  if (!mounted) return null;

  const handleCheckout = async () => {
    if (!isFormValid) {
      alert("🤡 ¡Krusty dice que faltan datos!");
      return;
    }
    
    setIsSending(true);

    try {
      localStorage.setItem('krusty-customer-v5', JSON.stringify(customer));
      
      const direccionCompleta = customer.tipoEntrega === 'Delivery' 
        ? `${customer.calleAltura.toUpperCase()} (${customer.barrio})` 
        : `🏠 RETIRO POR LOCAL (${DIRECCION_LOCAL})`;

      let detallePago = customer.metodoPago;
      if (customer.metodoPago === 'Efectivo') {
        detallePago = `Efectivo (Paga con: $${montoEfectivo || montoTotalFinal}${vuelto > 0 ? ` | Vuelto: $${vuelto}` : ' - Justo'})`;
      } else if (customer.metodoPago === 'Transferencia') {
        detallePago = `Transferencia (Alias: ${ALIAS_TRANSFERENCIA})`;
      }

      // 1. Mejoramos el resumen para la Base de Datos incluyendo extras
      const itemsResumenDB = items.map(i => {
        const extras = i.extrasElegidos?.length 
          ? ` (+${i.extrasElegidos.map(e => e.nombre).join(', ')})` 
          : '';
        return `${i.quantity}x ${i.nombre}${extras}`;
      }).join(', ');

      const { data: pedidoGuardado, error } = await supabase
        .from('pedidos')
        .insert([{
          cliente_nombre: customer.nombre,
          direccion: direccionCompleta,
          telefono: customer.telefono,
          metodo_pago: detallePago,
          tipo_entrega: customer.tipoEntrega,
          total: montoTotalFinal,
          estado: 'pendiente',
          items_resumen: itemsResumenDB
        }])
        .select()
        .single();

      if (error) throw error;

      const infoPedido = { id: pedidoGuardado.id, fecha: new Date().getTime() };
      localStorage.setItem('ultimo_pedido_krusty', JSON.stringify(infoPedido));

      const numeroTelefono = "5491138305837";
      const baseUrl = window.location.origin;
      const linkSeguimiento = `${baseUrl}/pedido/${pedidoGuardado.id}`;

      // 2. Mensaje de WhatsApp mejorado con estructura de extras
      const mensaje = encodeURIComponent(
        `🤡 *NUEVO PEDIDO - KRUSTY BURGER*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `📍 *SEGUÍ TU PEDIDO AQUÍ:* \n${linkSeguimiento}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `👤 *CLIENTE:* ${customer.nombre.toUpperCase()}\n` +
        `📞 *TEL:* ${customer.telefono}\n` +
        `🚀 *MODO:* ${customer.tipoEntrega.toUpperCase()}\n` +
        `📍 *DIR:* ${direccionCompleta}\n` +
        `💳 *PAGO:* ${detallePago}\n` +
        (customer.notes ? `📝 *NOTAS:* ${customer.notes}\n` : '') +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        items.map((item) => {
          const extrasMsj = item.extrasElegidos?.length 
            ? item.extrasElegidos.map(e => `\n   └ + ${e.nombre}`).join('') 
            : '';
          return `🍔 *${item.quantity}x* ${item.nombre.toUpperCase()}${extrasMsj}\n💰 Subtotal: $${(item.precioUnitarioTotal * item.quantity).toLocaleString('es-AR')}`;
        }).join("\n\n") +
        `\n\n━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `💵 *SUBTOTAL:* $${subtotal.toLocaleString('es-AR')}\n` +
        `🛵 *ENVÍO:* ${customer.tipoEntrega === 'Retiro' ? 'N/A' : (costoEnvio === 0 ? 'GRATIS' : `$${costoEnvio.toLocaleString('es-AR')}`)}\n` +
        `💰 *TOTAL: $${montoTotalFinal.toLocaleString('es-AR')}*\n\n` +
        (customer.metodoPago === 'Transferencia' ? `🏦 *ALIAS:* ${ALIAS_TRANSFERENCIA}\n` : '') +
        `🤡 _¡Gracias por elegir al payaso!_`
      );

      clearCart();
      onClose();
      window.open(`https://wa.me/${numeroTelefono}?text=${mensaje}`, "_blank");
      router.push('/gracias');

    } catch (e) {
      console.error(e);
      alert("❌ Error procesando el pedido.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <div className={`fixed inset-0 bg-stone-900/40 z-[60] backdrop-blur-md transition-all duration-500 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`} onClick={onClose} />

      <div className={`fixed right-0 top-0 h-full w-full sm:w-[450px] bg-white z-[70] shadow-2xl transform transition-transform duration-500 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full bg-white">
          
          <div className="p-6 bg-white border-b border-stone-100 shrink-0">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-stone-900 tracking-tighter uppercase">Tu Pedido</h2>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">
                  {items.length} {items.length === 1 ? 'producto' : 'productos'} en el carrito
                </p>
              </div>
              <button onClick={onClose} className="bg-stone-100 text-stone-400 w-10 h-10 rounded-full flex items-center justify-center hover:bg-stone-200 transition-transform active:scale-90">✕</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar relative">
            <div className="space-y-4">
              {items.length === 0 ? (
                <div className="text-center py-20 bg-stone-50 rounded-[2.5rem] border border-dashed border-stone-200">
                  <span className="text-6xl block mb-4">🍔</span>
                  <p className="font-bold text-stone-400 uppercase text-xs tracking-widest">¿Hambre? Agregá algo rico</p>
                  <button onClick={onClose} className="mt-4 text-[#D32F2F] font-black text-xs uppercase underline underline-offset-4">Ver Menú</button>
                </div>
              ) : (
                items.map((item) => (
                  <div key={`cart-item-${item.cartId}`} className="flex flex-col gap-2 p-3 bg-stone-50/50 rounded-2xl border border-stone-100 group">
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 shrink-0 rounded-2xl overflow-hidden border border-white shadow-sm">
                        <img src={item.imagen} className="w-full h-full object-cover" alt={item.nombre} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-stone-900 truncate uppercase tracking-tight">{item.nombre}</h4>
                        <p className="font-black text-[#D32F2F] text-xs mt-0.5">${(item.precioUnitarioTotal * item.quantity).toLocaleString('es-AR')}</p>
                      </div>
                      <div className="flex items-center bg-white border border-stone-200 rounded-xl p-1 shrink-0">
                        <button onClick={() => decreaseQuantity(item.cartId)} className="w-7 h-7 flex items-center justify-center font-bold text-stone-500 hover:bg-stone-100 hover:rounded-lg transition-all">–</button>
                        <span className="px-2 font-black text-xs text-stone-900">{item.quantity}</span>
                        <button onClick={() => addItem(item, item.extrasElegidos)} className="w-7 h-7 flex items-center justify-center font-bold text-stone-500 hover:bg-stone-100 hover:rounded-lg transition-all">+</button>
                      </div>
                    </div>
                    
                    {/* VISUALIZACIÓN DE EXTRAS SELECCIONADOS */}
                    {item.extrasElegidos && item.extrasElegidos.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 ml-20 mt-1">
                        {item.extrasElegidos.map((extra, idx) => (
                          <span key={`extra-${item.cartId}-${extra.id}-${idx}`} className="text-[8px] font-black uppercase bg-[#FFCA28]/10 text-[#c79d1a] border border-[#FFCA28]/20 px-2 py-0.5 rounded-md">
                            + {extra.nombre}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="space-y-6 pb-10">
                {/* TIPO DE ENTREGA */}
                <div className="flex p-1 bg-stone-100 rounded-2xl">
                  {['Delivery', 'Retiro'].map((tipo) => (
                    <button 
                      key={`delivery-type-${tipo}`} 
                      onClick={() => setCustomer({...customer, tipoEntrega: tipo as 'Delivery' | 'Retiro'})} 
                      className={`flex-1 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${customer.tipoEntrega === tipo ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                    >
                      {tipo === 'Delivery' ? '🛵 Delivery' : '🏠 Retiro'}
                    </button>
                  ))}
                </div>

                {/* DATOS CLIENTE */}
                <div className="space-y-3">
                  <input type="text" placeholder="TU NOMBRE" className="w-full bg-stone-50 border border-stone-100 p-4 rounded-2xl font-bold uppercase text-xs outline-none focus:bg-white focus:ring-2 focus:ring-[#FFCA28]/20 transition-all" value={customer.nombre} onChange={(e) => setCustomer({...customer, nombre: e.target.value})} />
                  <input type="tel" placeholder="TELÉFONO" className="w-full bg-stone-50 border border-stone-100 p-4 rounded-2xl font-bold text-xs outline-none focus:bg-white focus:ring-2 focus:ring-[#FFCA28]/20 transition-all" value={customer.telefono} onChange={(e) => setCustomer({...customer, telefono: e.target.value.replace(/\D/g, '')})} />

                  {customer.tipoEntrega === 'Delivery' ? (
                    <div className="space-y-3">
                      <select className="w-full bg-stone-50 border border-stone-100 p-4 rounded-2xl font-bold text-xs uppercase outline-none cursor-pointer appearance-none" value={customer.barrio} onChange={(e) => setCustomer({...customer, barrio: e.target.value})}>
                        <option value="">📍 SELECCIONÁ TU BARRIO</option>
                        {ZONAS_REPARTO.map(zona => (
                          <option key={`zona-${zona.nombre}`} value={zona.nombre}>{zona.nombre} (+${zona.costo})</option>
                        ))}
                      </select>
                      <input type="text" placeholder="CALLE Y ALTURA" className="w-full bg-stone-50 border border-stone-100 p-4 rounded-2xl font-bold text-xs uppercase outline-none focus:bg-white focus:ring-2 focus:ring-[#FFCA28]/20 transition-all" value={customer.calleAltura} onChange={(e) => setCustomer({...customer, calleAltura: e.target.value})} />
                    </div>
                  ) : (
                    <div className="bg-orange-50 border border-orange-100 p-5 rounded-[2rem] flex items-start gap-4">
                      <span className="text-2xl mt-1">🏠</span>
                      <div>
                        <p className="text-[10px] font-black uppercase text-orange-400 mb-1 tracking-wider">Punto de Retiro</p>
                        <p className="font-black text-stone-900 text-xs uppercase">{DIRECCION_LOCAL}</p>
                        <p className="text-[10px] font-bold text-orange-600 mt-1 uppercase tracking-tighter">🕒 Te avisamos cuando esté listo</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* MÉTODO DE PAGO */}
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase text-stone-400 tracking-[0.2em] px-1">Método de Pago</p>
                  <div className="grid grid-cols-3 gap-2">
                    {['Efectivo', 'Transferencia', 'QR'].map((pago) => (
                      <button key={`payment-method-${pago}`} onClick={() => setCustomer({...customer, metodoPago: pago})} className={`py-3 rounded-xl border font-black text-[9px] uppercase transition-all ${customer.metodoPago === pago ? 'bg-stone-900 text-white border-stone-900 shadow-lg' : 'bg-white border-stone-100 text-stone-400'}`}>{pago}</button>
                    ))}
                  </div>

                  {customer.metodoPago === 'Transferencia' && (
                    <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-[2rem]">
                      <p className="text-[9px] font-black uppercase text-blue-400 mb-3 tracking-wider">Alias de Pago</p>
                      <div onClick={handleCopyAlias} className="flex items-center justify-between bg-white p-4 rounded-2xl cursor-pointer hover:shadow-md transition-all active:scale-95 border border-blue-100">
                        <span className="font-black text-blue-900 text-sm">{ALIAS_TRANSFERENCIA}</span>
                        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${copied ? 'bg-emerald-500 text-white' : 'bg-blue-100 text-blue-600'}`}>
                          {copied ? '¡Copiado!' : 'Copiar'}
                        </span>
                      </div>
                    </div>
                  )}

                  {customer.metodoPago === 'Efectivo' && (
                    <div className="bg-emerald-50/50 border border-emerald-100 p-5 rounded-[2rem]">
                      <p className="text-[9px] font-black uppercase text-emerald-400 mb-3 tracking-wider">¿Con cuánto pagás?</p>
                      <input type="number" className="w-full bg-white p-4 rounded-2xl font-black text-emerald-900 border border-emerald-100 outline-none focus:ring-2 focus:ring-emerald-200" value={montoEfectivo} onChange={(e) => setMontoEfectivo(e.target.value)} placeholder={`$${montoTotalFinal}`} />
                      {vuelto > 0 && (
                        <div className="mt-4 flex justify-between items-center px-2">
                          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Tu Vuelto:</span>
                          <span className="text-lg font-black text-emerald-700">${vuelto.toLocaleString('es-AR')}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <textarea placeholder="¿Alguna aclaración? (Sin cebolla, puerta roja, etc.)" className="w-full bg-stone-50 border border-stone-100 p-4 rounded-2xl font-bold text-xs h-24 resize-none outline-none focus:bg-white transition-all" value={customer.notes} onChange={(e) => setCustomer({...customer, notes: e.target.value})} />
              </div>
            )}
          </div>

          <div className="p-6 bg-white border-t border-stone-100 shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
            <div className="space-y-2 mb-6">
              <div className="flex justify-between items-center text-stone-400 font-bold text-[11px] uppercase tracking-tighter">
                <span>Subtotal</span>
                <span>${subtotal.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between items-center text-stone-400 font-bold text-[11px] uppercase tracking-tighter">
                <span>Costo de Envío</span>
                <span className={costoEnvio === 0 ? 'text-emerald-500' : ''}>
                  {customer.tipoEntrega === 'Retiro' ? 'N/A' : (costoEnvio === 0 ? '¡GRATIS!' : `$${costoEnvio.toLocaleString('es-AR')}`)}
                </span>
              </div>
              <div className="flex justify-between items-end pt-3">
                <span className="font-black text-stone-900 uppercase tracking-tighter">Total Final</span>
                <span className="text-4xl font-black text-stone-950 tracking-tighter">${montoTotalFinal.toLocaleString('es-AR')}</span>
              </div>
            </div>
            
            <button 
              disabled={items.length === 0 || isSending}
              onClick={handleCheckout}
              className={`w-full py-5 rounded-[2rem] font-black uppercase text-sm tracking-[0.2em] transition-all duration-300 shadow-xl active:scale-95
                ${!isFormValid || items.length === 0 
                  ? 'bg-stone-100 text-stone-300 cursor-not-allowed shadow-none' 
                  : 'bg-[#FFCA28] text-stone-950 shadow-[#FFCA28]/20 hover:bg-[#D32F2F] hover:text-white hover:shadow-[#D32F2F]/20'
                }`}
            >
              {isSending ? 'PROCESANDO...' : (isFormValid ? 'Confirmar Pedido ➔' : 'Completá tus datos')}
            </button>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </>
  );
}