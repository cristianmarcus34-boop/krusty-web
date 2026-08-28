"use client";

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useCartStore } from '../store/cartStore';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import LocationPicker from '@/components/LocationPicker';
import { calcularEnvio, ResultadoEnvio } from '@/services/deliveryService';
import { useGoogleMaps } from '@/lib/googleMapsLoader';

const ALIAS_TRANSFERENCIA = "krustyburger2025";
const DIRECCION_LOCAL = "CALLE 853 N° 1149, VILLA LA FLORIDA";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const router = useRouter();
  const { isLoaded, loadError } = useGoogleMaps();
  const [mounted, setMounted] = useState(false);

  const {
    items,
    total,
    clearCart,
    addItem,
    decreaseQuantity
  } = useCartStore();

  const [isSending, setIsSending] = useState(false);
  const [montoEfectivo, setMontoEfectivo] = useState('');
  const [copied, setCopied] = useState(false);
  const [procesandoPagoMP, setProcesandoPagoMP] = useState(false);

  // Estados Cálculo de envío
  const [calculandoEnvio, setCalculandoEnvio] = useState(false);
  const [resultadoEnvio, setResultadoEnvio] = useState<ResultadoEnvio | null>(null);
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState<{
    direccion: string;
    lat: number;
    lng: number;
  } | null>(null);

  const [customer, setCustomer] = useState({
    nombre: '',
    calleAltura: '',
    telefono: '',
    metodoPago: 'Efectivo',
    tipoEntrega: 'Delivery',
    notes: ''
  });

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('krusty-customer-v5');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCustomer(parsed);
        if (parsed.calleAltura) {
          setUbicacionSeleccionada({
            direccion: parsed.calleAltura,
            lat: 0,
            lng: 0
          });
        }
      } catch (e) {
        console.error("Error al cargar datos guardados:", e);
      }
    }
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Cálculo de envío con Debounce
  useEffect(() => {
    const calcular = async () => {
      if (!ubicacionSeleccionada || customer.tipoEntrega !== 'Delivery') {
        setResultadoEnvio(null);
        return;
      }

      if (!ubicacionSeleccionada.direccion || ubicacionSeleccionada.direccion.trim().length < 5) {
        setResultadoEnvio(null);
        return;
      }

      setCalculandoEnvio(true);

      try {
        const resultado = await calcularEnvio(ubicacionSeleccionada);
        setResultadoEnvio(resultado);
      } catch (error) {
        console.error("Error calculando envío:", error);
        setResultadoEnvio({
          disponible: false,
          precio: 0,
          distancia_km: 0,
          tiempo_minutos: 0,
          mensaje: 'Error al calcular la distancia del envío.'
        });
      } finally {
        setCalculandoEnvio(false);
      }
    };

    const timer = setTimeout(calcular, 600);
    return () => clearTimeout(timer);
  }, [ubicacionSeleccionada, customer.tipoEntrega]);

  const costoEnvio = useMemo(() => {
    if (customer.tipoEntrega === 'Retiro') return 0;
    if (resultadoEnvio?.disponible) return resultadoEnvio.precio;
    return 0;
  }, [customer.tipoEntrega, resultadoEnvio]);

  const subtotal = total();
  const montoTotalFinal = subtotal + costoEnvio;

  const vuelto = useMemo(() => {
    const paga = parseFloat(montoEfectivo);
    return !isNaN(paga) && paga > montoTotalFinal ? paga - montoTotalFinal : 0;
  }, [montoEfectivo, montoTotalFinal]);

  const isFormValid = useMemo(() => {
    const hasName = customer.nombre.trim().length >= 2;
    const hasValidPhone = /^[0-9]{8,16}$/.test(customer.telefono.replace(/\s/g, ''));

    if (customer.tipoEntrega === 'Delivery') {
      const hasDireccion = customer.calleAltura.trim().length > 5;
      const isDeliveryAvailable = resultadoEnvio?.disponible ?? false;
      if (!hasDireccion || !isDeliveryAvailable) return false;
    }

    if (customer.metodoPago === 'Efectivo') {
      const pagaCon = parseFloat(montoEfectivo);
      const montoValido = !isNaN(pagaCon) && pagaCon >= montoTotalFinal;
      if (!montoValido) return false;
    }

    return hasName && hasValidPhone;
  }, [
    customer.nombre,
    customer.telefono,
    customer.tipoEntrega,
    customer.calleAltura,
    customer.metodoPago,
    montoEfectivo,
    montoTotalFinal,
    resultadoEnvio
  ]);

  const handleCopyAlias = () => {
    navigator.clipboard.writeText(ALIAS_TRANSFERENCIA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLocationSelect = useCallback((direccion: string, lat: number, lng: number) => {
    setUbicacionSeleccionada({ direccion, lat, lng });
    setCustomer(prev => ({ ...prev, calleAltura: direccion }));
  }, []);

  const handlePagarConMP = async () => {
    if (!isFormValid) {
      alert("🤡 ¡Completá tus datos y verificá la ubicación de entrega!");
      return;
    }

    setProcesandoPagoMP(true);

    try {
      localStorage.setItem('krusty-customer-v5', JSON.stringify(customer));

      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || null;

      const direccionCompleta = customer.tipoEntrega === 'Delivery'
        ? customer.calleAltura.toUpperCase()
        : `🏠 RETIRO POR LOCAL (${DIRECCION_LOCAL})`;

      const itemsResumenDB = items
        .map((i) => `${i.quantity}x ${i.nombre}`)
        .join(', ');

      const { data: pedidoGuardado, error } = await supabase
        .from('pedidos')
        .insert([
          {
            cliente_nombre: customer.nombre,
            direccion: direccionCompleta,
            telefono: customer.telefono,
            metodo_pago: 'Mercado Pago (Pendiente)',
            tipo_entrega: customer.tipoEntrega,
            total: montoTotalFinal,
            estado: 'pago_pendiente',
            resumenes_de_elementos: itemsResumenDB,
            notas: customer.notes || null,
            id_de_usuario: userId,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      const response = await fetch('/api/mercadopago/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: pedidoGuardado.id,
          items: items.map(item => ({
            title: item.nombre,
            quantity: item.quantity,
            unit_price: item.precioUnitarioTotal,
            currency_id: 'ARS',
          })),
          shippingCost: costoEnvio,
          customer: {
            nombre: customer.nombre,
            telefono: customer.telefono,
            direccion: customer.calleAltura,
          },
        }),
      });

      const data = await response.json();

      if (data.init_point) {
        clearCart();
        onClose();
        window.location.href = data.init_point;
      } else {
        alert('❌ Error al generar el checkout de Mercado Pago.');
      }
    } catch (error) {
      console.error('Error con Mercado Pago:', error);
      alert('❌ Error al procesar el pago. Intentá de nuevo.');
    } finally {
      setProcesandoPagoMP(false);
    }
  };

  const handleCheckout = async () => {
    if (customer.metodoPago === 'Mercado Pago') {
      return handlePagarConMP();
    }

    if (!isFormValid) {
      alert("🤡 ¡Krusty dice que faltan datos o tu ubicación no tiene cobertura!");
      return;
    }

    setIsSending(true);

    try {
      localStorage.setItem('krusty-customer-v5', JSON.stringify(customer));

      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || null;

      const direccionCompleta = customer.tipoEntrega === 'Delivery'
        ? customer.calleAltura.toUpperCase()
        : `🏠 RETIRO POR LOCAL (${DIRECCION_LOCAL})`;

      let detallePago = customer.metodoPago;
      if (customer.metodoPago === 'Efectivo') {
        detallePago = `Efectivo (Paga con: $${montoEfectivo || montoTotalFinal}${vuelto > 0 ? ` | Vuelto: $${vuelto}` : ' - Justo'})`;
      } else if (customer.metodoPago === 'Transferencia') {
        detallePago = `Transferencia Manual (Alias: ${ALIAS_TRANSFERENCIA})`;
      }

      const itemsResumenDB = items
        .map((i) => {
          const extras = i.extrasElegidos?.length
            ? ` (+${i.extrasElegidos.map((e) => e.nombre).join(', ')})`
            : '';
          return `${i.quantity}x ${i.nombre}${extras}`;
        })
        .join(', ');

      const { data: pedidoGuardado, error } = await supabase
        .from('pedidos')
        .insert([
          {
            cliente_nombre: customer.nombre,
            direccion: direccionCompleta,
            telefono: customer.telefono,
            metodo_pago: detallePago,
            tipo_entrega: customer.tipoEntrega,
            total: montoTotalFinal,
            estado: customer.metodoPago === 'Transferencia' ? 'pago_pendiente' : 'pendiente',
            resumenes_de_elementos: itemsResumenDB,
            notas: customer.notes || null,
            id_de_usuario: userId,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      const infoPedido = {
        id: pedidoGuardado.id,
        fecha: new Date().getTime(),
      };

      localStorage.setItem('ultimo_pedido_krusty', JSON.stringify(infoPedido));

      const numeroTelefono = '5491127344686';
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const linkSeguimiento = `${baseUrl}/pedido/${pedidoGuardado.id}`;

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
        items
          .map((item) => {
            const extrasMsj = item.extrasElegidos?.length
              ? item.extrasElegidos.map((e) => `\n   └ + ${e.nombre}`).join('')
              : '';
            return (
              `🍔 *${item.quantity}x* ${item.nombre.toUpperCase()}${extrasMsj}\n` +
              `💰 Subtotal: $${(item.precioUnitarioTotal * item.quantity).toLocaleString('es-AR')}`
            );
          })
          .join('\n\n') +
        `\n\n━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `💵 *SUBTOTAL:* $${subtotal.toLocaleString('es-AR')}\n` +
        `🛵 *ENVÍO:* ${customer.tipoEntrega === 'Retiro'
          ? 'N/A'
          : costoEnvio === 0
            ? 'GRATIS'
            : `$${costoEnvio.toLocaleString('es-AR')}`}\n` +
        `💰 *TOTAL: $${montoTotalFinal.toLocaleString('es-AR')}*\n\n` +
        (customer.metodoPago === 'Transferencia'
          ? `🏦 *ALIAS:* ${ALIAS_TRANSFERENCIA}\n`
          : '') +
        `🤡 _¡Gracias por elegir al payaso!_`
      );

      clearCart();
      onClose();

      if (typeof window !== 'undefined') {
        window.open(`https://wa.me/${numeroTelefono}?text=${mensaje}`, '_blank');
      }

      router.push('/gracias');
    } catch (e) {
      console.error(e);
      alert('❌ Error procesando el pedido.');
    } finally {
      setIsSending(false);
    }
  };

  if (!mounted) return null;

  return (
    <>
      {/* OVERLAY */}
      <div
        className={`fixed inset-0 bg-stone-900/40 dark:bg-black/70 z-60 backdrop-blur-md transition-all duration-500 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
          }`}
        onClick={onClose}
      />

      {/* DRAWER - ✅ VERSIÓN ANGOSTA EN ESCRITORIO */}
      <div
        className={`fixed inset-y-0 right-0 z-70 bg-white dark:bg-[#1a1a1a] shadow-2xl transform transition-transform duration-500 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
          }
        /* ✅ Móvil: 100% | Tablet: 420px | Escritorio: 400px (más angosto) */
        w-full sm:max-w-105 lg:max-w-100 xl:max-w-100`}
      >
        <div className="flex flex-col h-dvh max-h-dvh bg-white dark:bg-[#1a1a1a] overflow-hidden">

          {/* HEADER */}
          <div className="shrink-0 bg-white dark:bg-[#1a1a1a] border-b border-stone-100 dark:border-stone-800 px-4 sm:px-5 pt-4 pb-4 top-0 z-30 relative">
            <div className="flex justify-between items-start gap-2 relative z-40">
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-black text-stone-900 dark:text-[#FAD02C] tracking-tighter uppercase leading-none">
                  🛒 Tu Pedido
                </h2>
                <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mt-1">
                  {items.length} {items.length === 1 ? 'producto' : 'productos'}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-[#D32F2F] text-white border-2 border-black flex items-center justify-center font-black cursor-pointer hover:bg-black transition-colors hover:scale-105 active:scale-90 shrink-0"
                aria-label="Cerrar carrito"
              >
                ✕
              </button>
            </div>
          </div>

          {/* CONTENIDO - Scrollable */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-5 dark:bg-[#1a1a1a] no-scrollbar">

            {/* ITEMS */}
            <div className="space-y-3">
              {items.length === 0 ? (
                <div className="text-center py-12 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-dashed border-stone-200 dark:border-stone-700">
                  <span className="text-4xl block mb-2">🍔</span>
                  <p className="font-bold text-stone-400 uppercase text-[10px] tracking-widest">
                    ¿Hambre? Agregá algo rico
                  </p>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={`cart-item-${item.cartId}`}
                    className="flex items-center gap-2.5 p-2.5 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-100 dark:border-stone-700"
                  >
                    <img
                      src={item.imagen}
                      className="w-12 h-12 rounded-lg object-cover shrink-0"
                      alt={item.nombre}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/placeholder-burger.jpg';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-[11px] uppercase truncate text-stone-900 dark:text-white">
                        {item.nombre}
                      </h4>
                      {item.extrasElegidos && item.extrasElegidos.length > 0 && (
                        <p className="text-[9px] text-stone-400 truncate">
                          +{item.extrasElegidos.map(e => e.nombre).join(', ')}
                        </p>
                      )}
                      <p className="font-black text-[#D32F2F] text-[11px] mt-0.5">
                        ${(item.precioUnitarioTotal * item.quantity).toLocaleString('es-AR')}
                      </p>
                    </div>
                    <div className="flex items-center bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => decreaseQuantity(item.cartId)}
                        className="w-6 h-6 flex items-center justify-center font-bold text-stone-500 hover:text-red-500 transition-colors text-xs"
                      >
                        –
                      </button>
                      <span className="px-1.5 font-black text-xs dark:text-white min-w-4.5 text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => addItem(item, item.extrasElegidos)}
                        className="w-6 h-6 flex items-center justify-center font-bold text-stone-500 hover:text-emerald-500 transition-colors text-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* FORMULARIO - Solo si hay items */}
            {items.length > 0 && (
              <div className="space-y-4 border-t border-stone-100 dark:border-stone-800 pt-4">

                {/* TIPO DE ENTREGA */}
                <div className="flex p-0.5 bg-stone-100 dark:bg-stone-800 rounded-xl">
                  {['Delivery', 'Retiro'].map((tipo) => (
                    <button
                      type="button"
                      key={tipo}
                      onClick={() => setCustomer({ ...customer, tipoEntrega: tipo as 'Delivery' | 'Retiro' })}
                      className={`flex-1 py-2 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all ${customer.tipoEntrega === tipo
                        ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-sm'
                        : 'text-stone-400'
                        }`}
                    >
                      {tipo === 'Delivery' ? '🛵' : '🏠'}
                      <span className="ml-1">{tipo === 'Delivery' ? 'Delivery' : 'Retiro'}</span>
                    </button>
                  ))}
                </div>

                {/* DATOS */}
                <div className="space-y-2.5">
                  <input
                    type="text"
                    placeholder="NOMBRE"
                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 p-3 rounded-xl font-bold uppercase text-[11px] outline-none dark:text-white focus:ring-2 focus:ring-[#D32F2F]/30"
                    value={customer.nombre}
                    onChange={(e) => setCustomer({ ...customer, nombre: e.target.value })}
                  />

                  <input
                    type="tel"
                    placeholder="TELÉFONO"
                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 p-3 rounded-xl font-bold text-[11px] outline-none dark:text-white focus:ring-2 focus:ring-[#D32F2F]/30"
                    value={customer.telefono}
                    onChange={(e) => setCustomer({ ...customer, telefono: e.target.value.replace(/\D/g, '') })}
                  />

                  {/* MAPA */}
                  {customer.tipoEntrega === 'Delivery' && (
                    <div className="space-y-2 pt-1">
                      <p className="text-[9px] font-black uppercase text-stone-400 tracking-wider">
                        📍 Ubicación
                      </p>

                      {!isLoaded ? (
                        <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded-xl text-center text-[10px] font-bold text-stone-400 animate-pulse">
                          ⌛ Cargando mapa...
                        </div>
                      ) : loadError ? (
                        <div className="p-2.5 bg-red-50 text-red-600 rounded-xl text-[10px] font-bold border border-red-100">
                          ❌ No se pudo cargar el mapa.
                        </div>
                      ) : (
                        <LocationPicker
                          onLocationSelect={handleLocationSelect}
                          initialDireccion={customer.calleAltura}
                        />
                      )}

                      {/* Costo envío */}
                      {ubicacionSeleccionada && (
                        <div className="bg-stone-50 dark:bg-stone-800 p-3 rounded-xl border border-stone-100 dark:border-stone-700">
                          {calculandoEnvio ? (
                            <div className="flex items-center gap-2">
                              <div className="w-3.5 h-3.5 border-2 border-[#D32F2F] border-t-transparent rounded-full animate-spin" />
                              <span className="text-[10px] font-bold text-stone-400">Calculando...</span>
                            </div>
                          ) : resultadoEnvio ? (
                            resultadoEnvio.disponible ? (
                              <div className="space-y-0.5">
                                <div className="flex justify-between text-[10px] font-bold text-stone-500">
                                  <span>{resultadoEnvio.distancia_km} km</span>
                                  <span>~{resultadoEnvio.tiempo_minutos} min</span>
                                </div>
                                <div className="flex justify-between text-[11px] font-black text-emerald-600 dark:text-emerald-400 pt-1 border-t border-stone-200 dark:border-stone-700">
                                  <span>Envío:</span>
                                  <span>${resultadoEnvio.precio.toLocaleString('es-AR')}</span>
                                </div>
                              </div>
                            ) : (
                              <p className="text-[10px] font-bold text-red-500">{resultadoEnvio.mensaje}</p>
                            )
                          ) : null}
                        </div>
                      )}
                    </div>
                  )}

                  {/* MÉTODOS DE PAGO */}
                  <div className="space-y-2 pt-1">
                    <p className="text-[9px] font-black uppercase text-stone-400 tracking-wider">
                      Pago
                    </p>

                    <div className="grid grid-cols-3 gap-1.5">
                      {['Efectivo', 'Transferencia', 'Mercado Pago'].map((pago) => (
                        <button
                          type="button"
                          key={pago}
                          onClick={() => setCustomer({ ...customer, metodoPago: pago })}
                          className={`py-2 rounded-xl border font-black text-[8px] uppercase transition-all ${customer.metodoPago === pago
                            ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 border-stone-900 dark:border-white shadow-sm'
                            : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-400 hover:border-stone-300'
                            }`}
                        >
                          {pago}
                        </button>
                      ))}
                    </div>

                    {/* Efectivo */}
                    {customer.metodoPago === 'Efectivo' && (
                      <div className="pt-1">
                        <input
                          type="number"
                          placeholder={`Mínimo: $${montoTotalFinal.toLocaleString('es-AR')}`}
                          className={`w-full bg-stone-50 dark:bg-stone-800 border p-2.5 rounded-xl font-bold text-[11px] outline-none dark:text-white transition-all ${montoEfectivo && parseFloat(montoEfectivo) < montoTotalFinal
                            ? 'border-red-500 focus:ring-2 focus:ring-red-500/30'
                            : 'border-stone-100 dark:border-stone-700 focus:ring-2 focus:ring-[#D32F2F]/30'
                            }`}
                          value={montoEfectivo}
                          onChange={(e) => setMontoEfectivo(e.target.value)}
                        />
                        {montoEfectivo && parseFloat(montoEfectivo) < montoTotalFinal && (
                          <p className="text-[9px] font-black text-red-500 mt-0.5 px-1">
                            ⚠️ Monto insuficiente
                          </p>
                        )}
                        {vuelto > 0 && (
                          <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 px-1">
                            💵 Vuelto: ${vuelto.toLocaleString('es-AR')}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Transferencia */}
                    {customer.metodoPago === 'Transferencia' && (
                      <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-800 p-3 rounded-xl mt-1">
                        <p className="text-[8px] font-black uppercase text-blue-500 mb-1.5">
                          Alias
                        </p>
                        <div
                          onClick={handleCopyAlias}
                          className="flex items-center justify-between bg-white dark:bg-stone-800 p-2 rounded-lg cursor-pointer border border-blue-100 dark:border-blue-800 hover:border-blue-300 transition-colors"
                        >
                          <span className="font-black text-blue-900 dark:text-blue-300 text-[11px]">
                            {ALIAS_TRANSFERENCIA}
                          </span>
                          <span className="text-[8px] font-black uppercase bg-blue-100 text-blue-600 px-2 py-0.5 rounded">
                            {copied ? '✓' : 'Copiar'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* NOTAS */}
                  <textarea
                    placeholder="Aclaraciones..."
                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 p-3 rounded-xl font-bold text-[11px] h-16 resize-none outline-none focus:ring-2 focus:ring-[#FFCA28]/30 dark:focus:ring-[#FAD02C]/30 dark:text-white"
                    value={customer.notes}
                    onChange={(e) => setCustomer({ ...customer, notes: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* FOOTER - Siempre visible */}
          <div className="shrink-0 bg-white dark:bg-[#1a1a1a] border-t border-stone-100 dark:border-stone-800 px-4 sm:px-5 pt-3 pb-[max(env(safe-area-inset-bottom),12px)] shadow-[0_-10px_20px_rgba(0,0,0,0.02)] dark:shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
            <div className="space-y-1.5 mb-3">
              <div className="flex justify-between items-center text-stone-400 dark:text-stone-500 font-bold text-[10px] uppercase tracking-tighter">
                <span>Subtotal</span>
                <span>${subtotal.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between items-center text-stone-400 dark:text-stone-500 font-bold text-[10px] uppercase tracking-tighter">
                <span>Envío</span>
                <span>
                  {customer.tipoEntrega === 'Retiro'
                    ? 'N/A'
                    : costoEnvio === 0
                      ? '¡GRATIS!'
                      : `$${costoEnvio.toLocaleString('es-AR')}`}
                </span>
              </div>
              <div className="flex justify-between items-end pt-1.5 gap-2 border-t border-stone-100 dark:border-stone-700">
                <span className="font-black text-stone-900 dark:text-white uppercase tracking-tighter text-xs">
                  Total
                </span>
                <span className="text-2xl sm:text-3xl font-black text-stone-950 dark:text-[#FAD02C] tracking-tighter text-right wrap-break-words">
                  ${montoTotalFinal.toLocaleString('es-AR')}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={items.length === 0 || isSending || procesandoPagoMP || !isFormValid}
              onClick={handleCheckout}
              className={`w-full py-3.5 rounded-2xl font-black uppercase text-[11px] tracking-[0.15em] transition-all duration-300 active:scale-[0.98] cursor-pointer shadow-lg ${!isFormValid || items.length === 0
                ? 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-600 cursor-not-allowed shadow-none'
                : customer.metodoPago === 'Mercado Pago'
                  ? 'bg-[#009EE3] text-white hover:bg-[#0083c4]'
                  : customer.metodoPago === 'Transferencia'
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-[#FFCA28] dark:bg-[#FAD02C] text-stone-950 hover:bg-[#D32F2F] dark:hover:bg-[#D32F2F] hover:text-white dark:hover:text-white'
                }`}
            >
              {isSending || procesandoPagoMP
                ? 'PROCESANDO...'
                : !isFormValid
                  ? customer.metodoPago === 'Efectivo' && (!montoEfectivo || parseFloat(montoEfectivo) < montoTotalFinal)
                    ? '💰 Monto insuficiente'
                    : 'Completá tus datos'
                  : customer.metodoPago === 'Mercado Pago'
                    ? 'Pagar con MP ➔'
                    : 'Confirmar ➔'}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full mt-2 py-2 rounded-xl bg-stone-100 dark:bg-stone-900/80 text-stone-600 dark:text-stone-400 font-black uppercase text-[10px] tracking-wider transition-all hover:bg-stone-200 dark:hover:bg-stone-700 hover:text-stone-700 dark:hover:text-white active:scale-95 cursor-pointer border border-stone-200/60 dark:border-stone-700/60"
            >
              ✕ Cerrar
            </button>
          </div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .no-scrollbar::-webkit-scrollbar {
              display: none;
            }
            .no-scrollbar {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
            html, body {
              overscroll-behavior: none;
            }
          `,
        }}
      />
    </>
  );
}