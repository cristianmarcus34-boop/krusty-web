"use client";

import { useEffect, useState, useMemo } from 'react';
import { useCartStore } from '../store/cartStore';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import LocationPicker from '@/components/LocationPicker';
import { calcularEnvio, ResultadoEnvio } from '@/services/deliveryService';
import { useGoogleMaps } from '@/lib/googleMapsLoader';

const ALIAS_TRANSFERENCIA = "krustyburger2025";
const DIRECCION_LOCAL = "CALLE 853 N° 1149, VILLA LA FLORIDA";

export default function CartDrawer({
  isOpen,
  onClose
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
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

  // Estados para Mercado Pago
  const [mostrarBotonMP, setMostrarBotonMP] = useState(false);
  const [procesandoPagoMP, setProcesandoPagoMP] = useState(false);

  // Estados para el cálculo de envío
  const [calculandoEnvio, setCalculandoEnvio] = useState(false);
  const [resultadoEnvio, setResultadoEnvio] = useState<ResultadoEnvio | null>(null);
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState<{
    direccion: string;
    lat: number;
    lng: number;
  } | null>(null);

  const [customer, setCustomer] = useState({
    nombre: '',
    barrio: '',
    otroBarrio: '',
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
      setCustomer(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Efecto para calcular envío cuando cambia la dirección
  useEffect(() => {
    const calcular = async () => {
      if (!ubicacionSeleccionada) {
        setResultadoEnvio(null);
        return;
      }

      if (!ubicacionSeleccionada.direccion || ubicacionSeleccionada.direccion.trim().length < 5) {
        setResultadoEnvio(null);
        return;
      }

      setCalculandoEnvio(true);
      const resultado = await calcularEnvio(ubicacionSeleccionada.direccion);
      setResultadoEnvio(resultado);
      setCalculandoEnvio(false);
    };

    const timer = setTimeout(calcular, 800);
    return () => clearTimeout(timer);
  }, [ubicacionSeleccionada]);

  const costoEnvio = useMemo(() => {
    if (customer.tipoEntrega === 'Retiro') return 0;
    if (resultadoEnvio?.disponible) return resultadoEnvio.precio;
    return 0;
  }, [customer.tipoEntrega, resultadoEnvio]);

  const subtotal = total();
  const montoTotalFinal = subtotal + costoEnvio;

  const vuelto = useMemo(() => {
    const paga = parseFloat(montoEfectivo);
    return paga > montoTotalFinal ? paga - montoTotalFinal : 0;
  }, [montoEfectivo, montoTotalFinal]);

  // ✅ EFECTO MOVIDO DESPUÉS DE montoTotalFinal
  useEffect(() => {
    if (customer.metodoPago === 'Transferencia' && montoTotalFinal > 0) {
      setMostrarBotonMP(true);
    } else {
      setMostrarBotonMP(false);
    }
  }, [customer.metodoPago, montoTotalFinal]);

  const isFormValid = useMemo(() => {
    const hasName = customer.nombre.trim().length > 2;
    const hasValidPhone = /^[0-9]{8,15}$/.test(customer.telefono.replace(/\s/g, ''));

    if (customer.tipoEntrega === 'Retiro') {
      return hasName && hasValidPhone;
    }

    const hasDireccion = ubicacionSeleccionada !== null &&
      ubicacionSeleccionada.direccion?.trim().length > 5;

    return hasName && hasValidPhone && hasDireccion;
  }, [customer, ubicacionSeleccionada]);

  const handleCopyAlias = () => {
    navigator.clipboard.writeText(ALIAS_TRANSFERENCIA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCloseDrawer = () => {
    console.log('🔴 Cerrando carrito');
    onClose();
  };

  const handleLocationSelect = (direccion: string, lat: number, lng: number) => {
    setUbicacionSeleccionada({ direccion, lat, lng });
    setCustomer({ ...customer, calleAltura: direccion });
  };

  // ✅ FUNCIÓN PARA ABRIR MERCADO PAGO
  const handlePagarConMP = async () => {
    if (!isFormValid) {
      alert("🤡 ¡Completá tus datos primero!");
      return;
    }

    setProcesandoPagoMP(true);

    try {
      // Crear preferencia de pago en tu backend
      const response = await fetch('/api/mercadopago/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({
            title: item.nombre,
            quantity: item.quantity,
            unit_price: item.precioUnitarioTotal,
            currency_id: 'ARS',
          })),
          total: montoTotalFinal,
          customer: {
            nombre: customer.nombre,
            telefono: customer.telefono,
            direccion: customer.calleAltura,
          },
        }),
      });

      const data = await response.json();

      if (data.init_point) {
        window.open(data.init_point, '_blank');
        alert('✅ Redirigiendo a Mercado Pago para completar el pago.');
      } else {
        alert('❌ Error al generar el pago. Intentá de nuevo.');
      }
    } catch (error) {
      console.error('Error con Mercado Pago:', error);
      alert('❌ Error al procesar el pago. Intentá de nuevo.');
    } finally {
      setProcesandoPagoMP(false);
    }
  };

  if (!mounted) return null;

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-8 h-8 border-4 border-[#D32F2F] border-t-transparent rounded-full animate-spin" />
        <span className="ml-3 font-bold text-sm">Cargando mapa...</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="bg-red-50 p-4 rounded-2xl border border-red-200">
        <p className="text-red-600 font-bold text-sm">
          ❌ Error al cargar el mapa. Verificá tu conexión.
        </p>
      </div>
    );
  }

  const handleCheckout = async () => {
    if (!isFormValid) {
      alert("🤡 ¡Krusty dice que faltan datos!");
      return;
    }

    setIsSending(true);

    try {
      localStorage.setItem('krusty-customer-v5', JSON.stringify(customer));

      const direccionCompleta =
        customer.tipoEntrega === 'Delivery'
          ? `${customer.calleAltura.toUpperCase()}`
          : `🏠 RETIRO POR LOCAL (${DIRECCION_LOCAL})`;

      let detallePago = customer.metodoPago;

      if (customer.metodoPago === 'Efectivo') {
        detallePago = `Efectivo (Paga con: $${montoEfectivo || montoTotalFinal
          }${vuelto > 0 ? ` | Vuelto: $${vuelto}` : ' - Justo'})`;
      } else if (customer.metodoPago === 'Transferencia') {
        detallePago = `Transferencia (Alias: ${ALIAS_TRANSFERENCIA}) - Pago con Mercado Pago`;
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
      const baseUrl = typeof globalThis !== 'undefined' && globalThis.location
        ? globalThis.location.origin
        : '';
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

      if (typeof globalThis.window !== 'undefined') {
        globalThis.open(
          `https://wa.me/${numeroTelefono}?text=${encodeURIComponent(mensaje)}`,
          '_blank'
        );
      }

      router.push('/gracias');
    } catch (e) {
      console.error(e);
      alert('❌ Error procesando el pedido.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {/* OVERLAY */}
      <div
        className={`fixed inset-0 bg-stone-900/40 dark:bg-black/70 z-60 backdrop-blur-md transition-all duration-500 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
          }`}
        onClick={handleCloseDrawer}
      />

      {/* DRAWER */}
      <div
        className={`fixed inset-y-0 right-0 z-70 w-full sm:max-w-112.5 bg-white dark:bg-[#1a1a1a] shadow-2xl transform transition-transform duration-500 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <div className="flex flex-col h-dvh max-h-dvh bg-white dark:bg-[#1a1a1a] overflow-hidden">
          {/* HEADER */}
          <div className="shrink-0 bg-white dark:bg-[#1a1a1a] border-b border-stone-100 dark:border-stone-800 px-4 sm:px-6 pt-[max(env(safe-area-inset-top),16px)] pb-4 top-0 z-30 relative">
            <div className="flex justify-between items-start gap-3 relative z-40">
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-[#FAD02C] tracking-tighter uppercase leading-none">
                  🛒 Tu Pedido
                </h2>
                <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mt-2">
                  {items.length} {items.length === 1 ? 'producto' : 'productos'} en el carrito
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  console.log('🔴 Cerrando carrito desde X');
                  onClose();
                }}
                className="relative z-50 w-12 h-12 rounded-full bg-[#D32F2F] text-white border-4 border-black shadow-[4px_4px_0px_0px_black] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all duration-200 active:scale-90 flex items-center justify-center text-2xl font-black cursor-pointer shrink-0 hover:bg-black hover:text-[#D32F2F] hover:border-[#D32F2F] dark:border-white dark:hover:border-[#FAD02C]"
                aria-label="Cerrar carrito"
              >
                ✕
              </button>
            </div>

            {items.length > 0 && (
              <div className="relative z-20 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    console.log('🔵 Cerrando carrito desde Seguir comprando');
                    onClose();
                  }}
                  className="group w-full relative overflow-hidden rounded-[1.7rem] border-2 border-black dark:border-white bg-[#FFCA28] dark:bg-[#FAD02C] px-4 py-4 transition-all duration-300 hover:bg-black dark:hover:bg-black hover:border-[#FFCA28] dark:hover:border-[#FAD02C] active:scale-[0.98] cursor-pointer shadow-[4px_4px_0px_0px_black] dark:shadow-[4px_4px_0px_0px_rgba(250,208,44,0.3)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5"
                >
                  <div className="relative flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-black/10 border-2 border-black dark:border-white flex items-center justify-center text-xl shrink-0 group-hover:bg-[#FFCA28] dark:group-hover:bg-[#FAD02C] group-hover:border-white transition-all">
                        ←
                      </div>
                      <div className="text-left min-w-0">
                        <p className="font-black uppercase tracking-wide text-[11px] sm:text-xs group-hover:text-white transition-colors">
                          Seguir comprando
                        </p>
                        <p className="text-stone-600 dark:text-stone-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mt-1 leading-tight group-hover:text-stone-300 dark:group-hover:text-stone-400 transition-colors">
                          Volver al menú sin perder tu carrito
                        </p>
                      </div>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center font-black text-lg shrink-0 group-hover:bg-[#FFCA28] dark:group-hover:bg-[#FAD02C] group-hover:text-black transition-all">
                      →
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* CONTENIDO */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 py-5 space-y-8 no-scrollbar overscroll-contain dark:bg-[#1a1a1a]">
            {/* ITEMS */}
            <div className="space-y-4">
              {items.length === 0 ? (
                <div className="text-center py-20 bg-stone-50 dark:bg-stone-800/50 rounded-[2.5rem] border border-dashed border-stone-200 dark:border-stone-700">
                  <span className="text-6xl block mb-4">🍔</span>
                  <p className="font-bold text-stone-400 dark:text-stone-500 uppercase text-xs tracking-widest">
                    ¿Hambre? Agregá algo rico
                  </p>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={`cart-item-${item.cartId}`}
                    className="flex flex-col gap-2 p-3 bg-stone-50/50 dark:bg-stone-800/30 rounded-2xl border border-stone-100 dark:border-stone-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative w-16 h-16 shrink-0 rounded-2xl overflow-hidden border border-white dark:border-stone-700 shadow-sm">
                        <img
                          src={item.imagen}
                          className="w-full h-full object-cover"
                          alt={item.nombre}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-stone-900 dark:text-white truncate uppercase tracking-tight">
                          {item.nombre}
                        </h4>
                        <p className="font-black text-[#D32F2F] dark:text-[#ff4444] text-xs mt-1">
                          $
                          {(item.precioUnitarioTotal * item.quantity).toLocaleString(
                            'es-AR'
                          )}
                        </p>
                      </div>
                      <div className="flex items-center bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => decreaseQuantity(item.cartId)}
                          className="w-8 h-8 flex items-center justify-center font-bold text-stone-500 dark:text-stone-400 active:scale-90 cursor-pointer hover:text-[#D32F2F] dark:hover:text-[#ff4444] transition-colors"
                        >
                          –
                        </button>
                        <span className="px-2 font-black text-xs text-stone-900 dark:text-white">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => addItem(item, item.extrasElegidos)}
                          className="w-8 h-8 flex items-center justify-center font-bold text-stone-500 dark:text-stone-400 active:scale-90 cursor-pointer hover:text-[#D32F2F] dark:hover:text-[#ff4444] transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    {item.extrasElegidos && item.extrasElegidos.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 ml-19 mt-1">
                        {item.extrasElegidos.map((extra, idx) => (
                          <span
                            key={`extra-${item.cartId}-${extra.id}-${idx}`}
                            className="text-[8px] font-black uppercase bg-[#FFCA28]/10 dark:bg-[#FAD02C]/10 text-[#c79d1a] dark:text-[#FAD02C] border border-[#FFCA28]/20 dark:border-[#FAD02C]/20 px-2 py-1 rounded-md"
                          >
                            + {extra.nombre}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* FORM */}
            {items.length > 0 && (
              <div className="space-y-6 pb-10">
                {/* ENTREGA */}
                <div className="flex p-1 bg-stone-100 dark:bg-stone-800 rounded-2xl">
                  {['Delivery', 'Retiro'].map((tipo) => (
                    <button
                      type="button"
                      key={tipo}
                      onClick={() =>
                        setCustomer({ ...customer, tipoEntrega: tipo as 'Delivery' | 'Retiro' })
                      }
                      className={`flex-1 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all cursor-pointer ${customer.tipoEntrega === tipo
                          ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-sm'
                          : 'text-stone-400 dark:text-stone-500'
                        }`}
                    >
                      {tipo === 'Delivery' ? '🛵 Delivery' : '🏠 Retiro'}
                    </button>
                  ))}
                </div>

                {/* DATOS */}
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="TU NOMBRE"
                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 p-4 rounded-2xl font-bold uppercase text-xs outline-none focus:ring-2 focus:ring-[#FFCA28]/30 dark:focus:ring-[#FAD02C]/30 dark:text-white"
                    value={customer.nombre}
                    onChange={(e) => setCustomer({ ...customer, nombre: e.target.value })}
                  />

                  <input
                    type="tel"
                    placeholder="TELÉFONO"
                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 p-4 rounded-2xl font-bold text-xs outline-none focus:ring-2 focus:ring-[#FFCA28]/30 dark:focus:ring-[#FAD02C]/30 dark:text-white"
                    value={customer.telefono}
                    onChange={(e) =>
                      setCustomer({
                        ...customer,
                        telefono: e.target.value.replace(/\D/g, ''),
                      })
                    }
                  />

                  {/* Ubicación con mapa */}
                  {customer.tipoEntrega === 'Delivery' && (
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase text-stone-400 dark:text-stone-500 tracking-[0.2em] px-1">
                        📍 Tu ubicación
                      </p>

                      <LocationPicker
                        onLocationSelect={handleLocationSelect}
                        initialDireccion={customer.calleAltura}
                      />

                      {ubicacionSeleccionada && (
                        <div className="bg-stone-50 dark:bg-stone-800 p-4 rounded-2xl border border-stone-100 dark:border-stone-700">
                          {calculandoEnvio ? (
                            <div className="flex items-center gap-3">
                              <div className="w-5 h-5 border-2 border-[#D32F2F] border-t-transparent rounded-full animate-spin" />
                              <span className="text-xs font-black text-stone-400">
                                Calculando distancia...
                              </span>
                            </div>
                          ) : resultadoEnvio ? (
                            <div className="space-y-2">
                              {resultadoEnvio.disponible ? (
                                <>
                                  <div className="flex justify-between text-xs font-bold">
                                    <span className="text-stone-500">Distancia:</span>
                                    <span>{resultadoEnvio.distancia_km} km</span>
                                  </div>
                                  <div className="flex justify-between text-xs font-bold">
                                    <span className="text-stone-500">Tiempo estimado:</span>
                                    <span>{resultadoEnvio.tiempo_minutos} min</span>
                                  </div>
                                  <div className="flex justify-between text-sm font-black pt-2 border-t border-stone-200 dark:border-stone-700">
                                    <span className="text-emerald-600 dark:text-emerald-400">
                                      Costo de envío:
                                    </span>
                                    <span className="text-emerald-600 dark:text-emerald-400">
                                      ${resultadoEnvio.precio.toLocaleString('es-AR')}
                                    </span>
                                  </div>
                                </>
                              ) : (
                                <p className="text-xs font-bold text-red-500">
                                  {resultadoEnvio.mensaje}
                                </p>
                              )}
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  )}

                  {/* METODO PAGO */}
                  <div className="space-y-4 pt-2">
                    <p className="text-[10px] font-black uppercase text-stone-400 dark:text-stone-500 tracking-[0.2em] px-1">
                      Método de Pago
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      {['Efectivo', 'Transferencia'].map((pago) => (
                        <button
                          type="button"
                          key={pago}
                          onClick={() => {
                            setCustomer({ ...customer, metodoPago: pago });
                            if (pago === 'Transferencia') {
                              setMostrarBotonMP(true);
                            } else {
                              setMostrarBotonMP(false);
                            }
                          }}
                          className={`py-3 rounded-xl border font-black text-[9px] uppercase transition-all cursor-pointer ${customer.metodoPago === pago
                              ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 border-stone-900 dark:border-white'
                              : 'bg-white dark:bg-stone-800 border-stone-100 dark:border-stone-700 text-stone-400 dark:text-stone-500'
                            }`}
                        >
                          {pago}
                        </button>
                      ))}
                    </div>

                    {customer.metodoPago === 'Transferencia' && (
                      <>
                        <div className="bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800 p-5 rounded-2xl">
                          <p className="text-[9px] font-black uppercase text-blue-400 dark:text-blue-400 mb-3 tracking-wider">
                            Alias de Pago
                          </p>
                          <div
                            onClick={handleCopyAlias}
                            className="flex items-center justify-between gap-3 bg-white dark:bg-stone-800 p-4 rounded-2xl cursor-pointer border border-blue-100 dark:border-blue-800 active:scale-[0.98] transition-all"
                          >
                            <span className="font-black text-blue-900 dark:text-blue-300 text-sm truncate">
                              {ALIAS_TRANSFERENCIA}
                            </span>
                            <span
                              className={`text-[9px] font-black uppercase px-2 py-1 rounded-full shrink-0 ${copied
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
                                }`}
                            >
                              {copied ? '¡Copiado!' : 'Copiar'}
                            </span>
                          </div>
                        </div>

                        {/* ✅ BOTÓN DE MERCADO PAGO */}
                        {mostrarBotonMP && isFormValid && (
                          <div className="space-y-2">
                            <button
                              type="button"
                              onClick={handlePagarConMP}
                              disabled={procesandoPagoMP}
                              className="w-full py-4 rounded-2xl font-black uppercase text-sm tracking-[0.15em] transition-all duration-300 active:scale-[0.98] cursor-pointer bg-[#009EE3] text-white border-2 border-[#009EE3] hover:bg-[#0083c4] hover:border-[#0083c4] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {procesandoPagoMP ? (
                                <>
                                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  Procesando...
                                </>
                              ) : (
                                <>
                                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor" />
                                    <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" fill="currentColor" />
                                    <circle cx="12" cy="12" r="2" fill="currentColor" />
                                  </svg>
                                  Pagar con Mercado Pago
                                </>
                              )}
                            </button>
                            <p className="text-[9px] text-center text-stone-400 dark:text-stone-500 font-bold uppercase tracking-wider">
                              🔒 Pago 100% seguro a través de Mercado Pago
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    {customer.metodoPago === 'Efectivo' && (
                      <div className="bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800 p-5 rounded-2xl">
                        <p className="text-[9px] font-black uppercase text-emerald-400 dark:text-emerald-400 mb-3 tracking-wider">
                          ¿Con cuánto pagás?
                        </p>
                        <input
                          type="number"
                          className="w-full bg-white dark:bg-stone-800 p-4 rounded-2xl font-black text-emerald-900 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800 outline-none"
                          value={montoEfectivo}
                          onChange={(e) => setMontoEfectivo(e.target.value)}
                          placeholder={`$${montoTotalFinal}`}
                        />
                        {vuelto > 0 && (
                          <div className="mt-4 flex justify-between items-center px-2">
                            <span className="text-[10px] font-black text-emerald-400 dark:text-emerald-400 uppercase tracking-widest">
                              Tu Vuelto:
                            </span>
                            <span className="text-lg font-black text-emerald-700 dark:text-emerald-300">
                              ${vuelto.toLocaleString('es-AR')}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* NOTAS */}
                  <textarea
                    placeholder="¿Alguna aclaración? (Sin cebolla, puerta roja, etc.)"
                    className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 p-4 rounded-2xl font-bold text-xs h-24 resize-none outline-none focus:ring-2 focus:ring-[#FFCA28]/30 dark:focus:ring-[#FAD02C]/30 dark:text-white"
                    value={customer.notes}
                    onChange={(e) => setCustomer({ ...customer, notes: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="shrink-0 bg-white dark:bg-[#1a1a1a] border-t border-stone-100 dark:border-stone-800 px-4 sm:px-6 pt-4 pb-[max(env(safe-area-inset-bottom),16px)] shadow-[0_-10px_20px_rgba(0,0,0,0.02)] dark:shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
            <div className="space-y-2 mb-5">
              <div className="flex justify-between items-center text-stone-400 dark:text-stone-500 font-bold text-[11px] uppercase tracking-tighter">
                <span>Subtotal</span>
                <span>${subtotal.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between items-center text-stone-400 dark:text-stone-500 font-bold text-[11px] uppercase tracking-tighter">
                <span>Costo de Envío</span>
                <span>
                  {customer.tipoEntrega === 'Retiro'
                    ? 'N/A'
                    : costoEnvio === 0
                      ? '¡GRATIS!'
                      : `$${costoEnvio.toLocaleString('es-AR')}`}
                </span>
              </div>
              <div className="flex justify-between items-end pt-3 gap-3">
                <span className="font-black text-stone-900 dark:text-white uppercase tracking-tighter text-sm">
                  Total Final
                </span>
                <span className="text-3xl sm:text-4xl font-black text-stone-950 dark:text-[#FAD02C] tracking-tighter text-right wrap-break-words">
                  ${montoTotalFinal.toLocaleString('es-AR')}
                </span>
              </div>
            </div>

            {/* Botón de cierre adicional en el footer */}
            <button
              type="button"
              onClick={handleCloseDrawer}
              className="w-full mb-3 py-3 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 font-black uppercase text-xs transition-all hover:bg-stone-200 dark:hover:bg-stone-700 hover:text-stone-700 dark:hover:text-white active:scale-95 cursor-pointer border border-stone-200 dark:border-stone-700"
            >
              ✕ Cerrar y seguir comprando
            </button>

            {/* ✅ BOTÓN CONFIRMAR PEDIDO */}
            <button
              type="button"
              disabled={items.length === 0 || isSending}
              onClick={handleCheckout}
              className={`w-full py-5 rounded-2xl font-black uppercase text-sm tracking-[0.15em] transition-all duration-300 active:scale-[0.98] cursor-pointer ${!isFormValid || items.length === 0
                  ? 'bg-stone-100 dark:bg-stone-800 text-stone-300 dark:text-stone-600 cursor-not-allowed'
                  : customer.metodoPago === 'Transferencia'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-[#FFCA28] dark:bg-[#FAD02C] text-stone-950 hover:bg-[#D32F2F] dark:hover:bg-[#D32F2F] hover:text-white dark:hover:text-white'
                }`}
            >
              {isSending
                ? 'PROCESANDO...'
                : isFormValid
                  ? customer.metodoPago === 'Transferencia'
                    ? '✅ Confirmar Pedido (Pago ya realizado)'
                    : 'Confirmar Pedido ➔'
                  : 'Completá tus datos'}
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
            html,
            body {
              overscroll-behavior: none;
            }
          `,
        }}
      />
    </>
  );
}