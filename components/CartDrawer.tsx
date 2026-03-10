"use client";
import { useEffect, useState, useMemo } from 'react';
import { useCartStore } from '@/store/cartStore';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';

const ZONAS_REPARTO = [
  { nombre: "Villa La Florida (Cerca - hasta 10 cuadras)", costo: 0 },
  { nombre: "Villa La Florida (Lejos)", costo: 700 },
  { nombre: "San Francisco Solano", costo: 1500 },
  { nombre: "Quilmes Oeste / Este", costo: 1900 },
  { nombre: "Ezpeleta", costo: 1900 },
  { nombre: "Florencio Varela", costo: 2000 },
];

export default function CartDrawer({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const { items, total, clearCart, addItem, decreaseQuantity } = useCartStore();
  
  const [isSending, setIsSending] = useState(false);
  const [montoEfectivo, setMontoEfectivo] = useState<string>(''); 

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

  const handleContinueShopping = (e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    onClose();
    if (pathname === '/') {
      document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      router.push('/#productos');
    }
  };

  const validatePhone = (phone: string) => /^[0-9]{8,15}$/.test(phone.replace(/\s/g, ''));

  const isFormValid = useMemo(() => {
    const hasName = customer.nombre.trim().length > 2;
    const hasValidPhone = validatePhone(customer.telefono);
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
      // 1. Guardar datos de cliente para el futuro
      localStorage.setItem('krusty-customer-v5', JSON.stringify(customer));
      
      const direccionCompleta = customer.tipoEntrega === 'Delivery' 
        ? `${customer.calleAltura.toUpperCase()} (${customer.barrio})` 
        : 'RETIRA EN LOCAL';

      // Corregido el link de Maps
      const linkMaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(customer.calleAltura + " " + customer.barrio + " Buenos Aires")}`;

      const detallePago = customer.metodoPago === 'Efectivo' 
        ? `${customer.metodoPago} (Paga con: $${montoEfectivo || montoTotalFinal}${vuelto > 0 ? ` | Vuelto: $${vuelto}` : ' - Justo'})`
        : customer.metodoPago;

      // 2. Insertamos en Supabase
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
          items_resumen: items.map(i => `${i.quantity}x ${i.nombre}`).join(', ')
        }])
        .select()
        .single();

      if (error) throw error;

      // 3. CLAVE: Guardamos el ID con el nombre que espera la página de Gracias
      localStorage.setItem('ultimo_pedido_id', pedidoGuardado.id.toString());
      localStorage.setItem('pedido_id', pedidoGuardado.id.toString());

      // 4. Link de seguimiento dinámico
      const baseUrl = window.location.origin;
      const linkSeguimiento = `${baseUrl}/pedido/${pedidoGuardado.id}`;

      const numeroTelefono = "5491138305837";
      const mensaje = encodeURIComponent(
        `🤡 *NUEVO PEDIDO - KRUSTY BURGER*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `📍 *SEGUÍ TU PEDIDO AQUÍ:* \n${linkSeguimiento}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `👤 *CLIENTE:* ${customer.nombre.toUpperCase()}\n` +
        `📞 *TEL:* ${customer.telefono}\n` +
        `🚀 *MODO:* ${customer.tipoEntrega.toUpperCase()}\n` +
        `📍 *DIR:* ${direccionCompleta}\n` +
        `🗺️ *MAPA:* ${linkMaps}\n` +
        `💳 *PAGO:* ${detallePago}\n` +
        (customer.notes ? `📝 *NOTAS:* ${customer.notes}\n` : '') +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        items.map((item) => `🍔 *${item.quantity}x* ${item.nombre.toUpperCase()} - $${(item.precio * item.quantity).toLocaleString('es-AR')}`).join("\n") +
        `\n\n━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `💵 *SUBTOTAL:* $${subtotal.toLocaleString('es-AR')}\n` +
        `🛵 *ENVÍO:* ${costoEnvio === 0 ? 'GRATIS' : `$${costoEnvio.toLocaleString('es-AR')}`}\n` +
        `💰 *TOTAL: $${montoTotalFinal.toLocaleString('es-AR')}*\n\n` +
        `🤡 _¡Gracias por elegir al payaso!_`
      );

      // 5. Finalizar proceso: WhatsApp y Redirección
      clearCart();
      onClose();
      
      // Abrir WhatsApp en pestaña nueva
      window.open(`https://wa.me/${numeroTelefono}?text=${mensaje}`, "_blank");
      
      // Redirigir a la página del Ticket (Gracias)
      router.push('/gracias');

    } catch (e) {
      console.error("Error en checkout:", e);
      alert("❌ Error procesando el pedido.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <div className={`fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm transition-all duration-500 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`} onClick={onClose} />

      <div className={`fixed right-0 top-0 h-full w-full sm:w-[480px] bg-white z-[70] border-l-[6px] border-black transform transition-transform duration-500 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full bg-[#FBFBFB]">
          
          <div className="p-6 border-b-[6px] border-black bg-[#D32F2F] text-white shrink-0">
            <div className="flex justify-between items-start">
              <div className="relative">
                <h2 className="text-3xl font-black italic tracking-tighter drop-shadow-[3px_3px_0px_black] uppercase leading-none">Mi Carrito</h2>
                {items.length > 0 && (
                  <button onClick={handleContinueShopping} className="mt-3 flex items-center gap-1 text-[10px] font-black uppercase bg-black px-3 py-2 rounded-lg border-2 border-white shadow-[2px_2px_0px_black]">
                    ← Agregar más cosas
                  </button>
                )}
              </div>
              <button onClick={onClose} className="bg-black text-white w-10 h-10 rounded-xl border-4 border-white font-black hover:scale-110 transition-transform">✕</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-8 no-scrollbar">
            <div className="space-y-3">
              {items.length === 0 ? (
                <div className="text-center py-20">
                  <span className="text-6xl block mb-4 animate-bounce">🍔</span>
                  <p className="font-black italic text-stone-400 uppercase">Tu carrito está vacío</p>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 bg-white border-[3px] border-black p-3 rounded-2xl shadow-[4px_4px_0px_0px_black]">
                    <img src={item.imagen} className="w-12 h-12 object-cover rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_black]" alt={item.nombre} />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-[10px] uppercase truncate tracking-tight">{item.nombre}</h4>
                      <p className="font-bold text-[#D32F2F] text-xs">${(item.precio * item.quantity).toLocaleString('es-AR')}</p>
                    </div>
                    <div className="flex items-center border-2 border-black rounded-lg bg-stone-50 shrink-0 shadow-[2px_2px_0px_0px_black]">
                      <button onClick={() => decreaseQuantity(item.id)} className="px-2 py-1 font-black border-r-2 border-black hover:bg-red-50">–</button>
                      <span className="px-3 font-black text-xs">{item.quantity}</span>
                      <button onClick={() => addItem(item)} className="px-2 py-1 font-black hover:bg-green-50">+</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="space-y-4 animate-fade-up">
                <div className="flex gap-2">
                  {['Delivery', 'Retiro'].map((tipo) => (
                    <button key={tipo} onClick={() => setCustomer({...customer, tipoEntrega: tipo})} className={`flex-1 py-3 rounded-xl border-[3px] border-black font-black uppercase text-[10px] transition-all ${customer.tipoEntrega === tipo ? 'bg-[#FFCA28] shadow-[3px_3px_0px_black] -translate-y-0.5' : 'bg-white hover:bg-stone-50'}`}>
                      {tipo === 'Delivery' ? '🛵 Envío' : '🏠 Retiro'}
                    </button>
                  ))}
                </div>

                <div className="grid gap-3">
                  <input type="text" placeholder="TU NOMBRE" className="w-full border-[3px] border-black p-3 rounded-xl font-bold uppercase text-xs outline-none focus:bg-yellow-50 focus:border-[#FFCA28] transition-colors" value={customer.nombre} onChange={(e) => setCustomer({...customer, nombre: e.target.value})} />
                  <input type="tel" placeholder="TELÉFONO" className="w-full border-[3px] border-black p-3 rounded-xl font-bold text-xs outline-none focus:bg-yellow-50" value={customer.telefono} onChange={(e) => setCustomer({...customer, telefono: e.target.value.replace(/\D/g, '')})} />

                  {customer.tipoEntrega === 'Delivery' && (
                    <div className="space-y-3">
                      <select 
                        className="w-full border-[3px] border-black p-3 rounded-xl font-bold text-xs uppercase outline-none bg-white cursor-pointer"
                        value={customer.barrio}
                        onChange={(e) => setCustomer({...customer, barrio: e.target.value})}
                      >
                        <option value="">¿EN QUÉ BARRIO ESTÁS? 📍</option>
                        {ZONAS_REPARTO.map(zona => (
                          <option key={zona.nombre} value={zona.nombre}>{zona.nombre} (+${zona.costo})</option>
                        ))}
                      </select>

                      <input 
                        type="text" 
                        placeholder="CALLE Y ALTURA (EJ: RIVADAVIA 1234)" 
                        className="w-full border-[3px] border-black p-3 rounded-xl font-bold text-xs uppercase outline-none focus:bg-yellow-50" 
                        value={customer.calleAltura} 
                        onChange={(e) => setCustomer({...customer, calleAltura: e.target.value})} 
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {['Efectivo', 'Transferencia', 'QR'].map((pago) => (
                      <button key={pago} onClick={() => setCustomer({...customer, metodoPago: pago})} className={`py-2 rounded-lg border-2 border-black font-black text-[9px] uppercase transition-all ${customer.metodoPago === pago ? 'bg-black text-white shadow-[2px_2px_0px_0px_#FFCA28]' : 'bg-white shadow-[2px_2px_0px_0px_black]'}`}>{pago}</button>
                    ))}
                  </div>
                  {customer.metodoPago === 'Efectivo' && (
                    <div className="bg-[#E8F5E9] border-[3px] border-black p-4 rounded-2xl">
                      <p className="text-[10px] font-black uppercase text-green-800 mb-1 italic">¿Con cuánto pagás?</p>
                      <input type="number" className="w-full border-2 border-black p-2 rounded-lg font-black outline-none focus:ring-2 ring-green-500" value={montoEfectivo} onChange={(e) => setMontoEfectivo(e.target.value)} placeholder={montoTotalFinal.toString()} />
                      {vuelto > 0 && (
                        <div className="mt-2 flex justify-between items-center bg-white/50 p-2 rounded-lg border-2 border-dashed border-green-600">
                          <span className="text-[10px] font-black text-green-700 uppercase italic">Tu Vuelto:</span>
                          <span className="text-sm font-black text-green-800 italic">${vuelto.toLocaleString('es-AR')}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <textarea placeholder="¿NOTAS PARA LA COCINA?" className="w-full border-[3px] border-black p-3 rounded-xl font-bold uppercase text-[10px] h-20 resize-none outline-none focus:bg-yellow-50" value={customer.notes} onChange={(e) => setCustomer({...customer, notes: e.target.value})} />
              </div>
            )}
          </div>

          <div className="p-6 border-t-[6px] border-black bg-white shrink-0">
            <div className="space-y-1 mb-4 px-2">
              <div className="flex justify-between items-center text-stone-500 font-bold text-[10px] uppercase">
                <span>Subtotal:</span>
                <span>${subtotal.toLocaleString('es-AR')}</span>
              </div>
              
              {customer.tipoEntrega === 'Delivery' && (
                <div className="flex justify-between items-center text-green-600 font-black text-[10px] uppercase">
                  <span>Costo de Envío:</span>
                  <span>{costoEnvio === 0 ? 'GRATIS' : `+$${costoEnvio.toLocaleString('es-AR')}`}</span>
                </div>
              )}

              <div className="flex justify-between items-end pt-2 border-t border-black/5">
                <span className="font-black italic text-xs text-black uppercase leading-none">Total:</span>
                <span className="text-4xl font-black italic tracking-tighter leading-none">${montoTotalFinal.toLocaleString('es-AR')}</span>
              </div>
            </div>
            
            <button 
              disabled={items.length === 0 || isSending}
              onClick={handleCheckout}
              className={`w-full py-5 rounded-[2rem] border-[4px] border-black font-black uppercase italic text-xl transition-all
                ${!isFormValid || items.length === 0 
                  ? 'bg-stone-100 text-stone-300 border-stone-200 cursor-not-allowed' 
                  : 'bg-[#FFCA28] text-black shadow-[6px_6px_0px_0px_black] active:shadow-none active:translate-y-1 hover:bg-[#FFD54F]'
                }`}
            >
              {isSending ? 'PROCESANDO...' : (isFormValid ? '¡PEDIR AHORA! 🍔' : 'FALTAN DATOS')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}