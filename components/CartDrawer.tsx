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
  { nombre: "Otro Barrio", costo: 0 },
];

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

  const barrioFinal =
    customer.barrio === 'Otro Barrio'
      ? customer.otroBarrio
      : customer.barrio;

  const costoEnvio = useMemo(() => {
    if (customer.tipoEntrega === 'Retiro') return 0;

    const zona = ZONAS_REPARTO.find(
      (z) => z.nombre === customer.barrio
    );

    return zona ? zona.costo : 0;
  }, [customer.barrio, customer.tipoEntrega]);

  const subtotal = total();

  const montoTotalFinal = subtotal + costoEnvio;

  const vuelto = useMemo(() => {
    const paga = parseFloat(montoEfectivo);

    return paga > montoTotalFinal
      ? paga - montoTotalFinal
      : 0;
  }, [montoEfectivo, montoTotalFinal]);

  const isFormValid = useMemo(() => {
    const hasName =
      customer.nombre.trim().length > 2;

    const hasValidPhone =
      /^[0-9]{8,15}$/.test(
        customer.telefono.replace(/\s/g, '')
      );

    if (customer.tipoEntrega === 'Retiro') {
      return hasName && hasValidPhone;
    }

    const hasBarrio =
      customer.barrio !== '';

    const hasOtroBarrio =
      customer.barrio !== 'Otro Barrio' ||
      customer.otroBarrio.trim().length > 2;

    const hasDireccion =
      customer.calleAltura.trim().length > 4;

    return (
      hasName &&
      hasValidPhone &&
      hasBarrio &&
      hasOtroBarrio &&
      hasDireccion
    );
  }, [customer]);

  const handleCopyAlias = () => {
    navigator.clipboard.writeText(
      ALIAS_TRANSFERENCIA
    );

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  if (!mounted) return null;

  const handleCheckout = async () => {
    if (!isFormValid) {
      alert("🤡 ¡Krusty dice que faltan datos!");
      return;
    }

    setIsSending(true);

    try {
      localStorage.setItem(
        'krusty-customer-v5',
        JSON.stringify(customer)
      );

      const direccionCompleta =
        customer.tipoEntrega === 'Delivery'
          ? `${customer.calleAltura.toUpperCase()} (${barrioFinal})`
          : `🏠 RETIRO POR LOCAL (${DIRECCION_LOCAL})`;

      let detallePago = customer.metodoPago;

      if (customer.metodoPago === 'Efectivo') {
        detallePago = `Efectivo (Paga con: $${
          montoEfectivo || montoTotalFinal
        }${
          vuelto > 0
            ? ` | Vuelto: $${vuelto}`
            : ' - Justo'
        })`;
      } else if (
        customer.metodoPago === 'Transferencia'
      ) {
        detallePago = `Transferencia (Alias: ${ALIAS_TRANSFERENCIA})`;
      }

      const itemsResumenDB = items
        .map((i) => {
          const extras =
            i.extrasElegidos?.length
              ? ` (+${i.extrasElegidos
                  .map((e) => e.nombre)
                  .join(', ')})`
              : '';

          return `${i.quantity}x ${i.nombre}${extras}`;
        })
        .join(', ');

      const {
        data: pedidoGuardado,
        error
      } = await supabase
        .from('pedidos')
        .insert([
          {
            cliente_nombre: customer.nombre,
            direccion: direccionCompleta,
            telefono: customer.telefono,
            metodo_pago: detallePago,
            tipo_entrega: customer.tipoEntrega,
            total: montoTotalFinal,
            estado: 'pendiente',
            items_resumen: itemsResumenDB
          }
        ])
        .select()
        .single();

      if (error) throw error;

      const infoPedido = {
        id: pedidoGuardado.id,
        fecha: new Date().getTime()
      };

      localStorage.setItem(
        'ultimo_pedido_krusty',
        JSON.stringify(infoPedido)
      );

      const numeroTelefono = "5491127344686";

      const baseUrl = window.location.origin;

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
          (customer.notes
            ? `📝 *NOTAS:* ${customer.notes}\n`
            : '') +
          `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          items
            .map((item) => {
              const extrasMsj =
                item.extrasElegidos?.length
                  ? item.extrasElegidos
                      .map(
                        (e) =>
                          `\n   └ + ${e.nombre}`
                      )
                      .join('')
                  : '';

              return (
                `🍔 *${item.quantity}x* ${item.nombre.toUpperCase()}${extrasMsj}\n` +
                `💰 Subtotal: $${(
                  item.precioUnitarioTotal *
                  item.quantity
                ).toLocaleString('es-AR')}`
              );
            })
            .join("\n\n") +
          `\n\n━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `💵 *SUBTOTAL:* $${subtotal.toLocaleString('es-AR')}\n` +
          `🛵 *ENVÍO:* ${
            customer.tipoEntrega === 'Retiro'
              ? 'N/A'
              : costoEnvio === 0
              ? 'GRATIS'
              : `$${costoEnvio.toLocaleString('es-AR')}`
          }\n` +
          `💰 *TOTAL: $${montoTotalFinal.toLocaleString('es-AR')}*\n\n` +
          (customer.metodoPago ===
          'Transferencia'
            ? `🏦 *ALIAS:* ${ALIAS_TRANSFERENCIA}\n`
            : '') +
          `🤡 _¡Gracias por elegir al payaso!_`
      );

      clearCart();

      onClose();

      window.open(
        `https://wa.me/${numeroTelefono}?text=${mensaje}`,
        "_blank"
      );

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
      {/* OVERLAY */}
      <div
        className={`fixed inset-0 bg-stone-900/40 z-[60] backdrop-blur-md transition-all duration-500 ${
          isOpen
            ? 'opacity-100 visible'
            : 'opacity-0 invisible'
        }`}
        onClick={onClose}
      />

      {/* DRAWER */}
      <div
        className={`fixed inset-y-0 right-0 z-[70] w-full sm:max-w-[450px] bg-white shadow-2xl transform transition-transform duration-500 ease-in-out ${
          isOpen
            ? 'translate-x-0'
            : 'translate-x-full'
        }`}
      >
        <div
          className="
            flex flex-col
            h-[100dvh]
            max-h-[100dvh]
            bg-white
            overflow-hidden
          "
        >

          {/* HEADER */}
          <div
            className="
              shrink-0
              bg-white
              border-b
              border-stone-100
              px-4
              sm:px-6
              pt-[max(env(safe-area-inset-top),16px)]
              pb-4
              sticky
              top-0
              z-20
            "
          >
            <div className="flex justify-between items-start gap-3">

              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tighter uppercase leading-none">
                  Tu Pedido
                </h2>

                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-2">
                  {items.length}{' '}
                  {items.length === 1
                    ? 'producto'
                    : 'productos'}{' '}
                  en el carrito
                </p>
              </div>

              <button
                onClick={onClose}
                className="
                  bg-stone-100
                  text-stone-500
                  min-w-10
                  w-10
                  h-10
                  rounded-full
                  flex
                  items-center
                  justify-center
                  hover:bg-stone-200
                  transition-all
                  active:scale-90
                "
              >
                ✕
              </button>

            </div>

            {/* BOTON VOLVER */}
            {items.length > 0 && (
              <button
                onClick={onClose}
                className="
                  group
                  mt-4
                  w-full
                  relative
                  overflow-hidden
                  rounded-[1.7rem]
                  border
                  border-stone-200
                  bg-gradient-to-r
                  from-stone-950
                  via-stone-900
                  to-stone-800
                  px-4
                  py-4
                  transition-all
                  duration-300
                  active:scale-[0.98]
                "
              >

                <div className="absolute inset-0 bg-gradient-to-r from-[#FFCA28]/0 via-[#FFCA28]/10 to-[#FFCA28]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative flex items-center justify-between gap-3">

                  <div className="flex items-center gap-3 min-w-0">

                    <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-xl shrink-0">
                      🍔
                    </div>

                    <div className="text-left min-w-0">

                      <p className="text-white font-black uppercase tracking-wide text-[11px] sm:text-xs truncate">
                        Seguir comprando
                      </p>

                      <p className="text-stone-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mt-1 leading-tight">
                        Volver al menú sin perder tu carrito
                      </p>

                    </div>
                  </div>

                  <div className="w-9 h-9 rounded-full bg-[#FFCA28] text-stone-950 flex items-center justify-center font-black text-lg shrink-0">
                    →
                  </div>

                </div>
              </button>
            )}
          </div>

          {/* CONTENIDO */}
          <div
            className="
              flex-1
              overflow-y-auto
              overflow-x-hidden
              px-4
              sm:px-6
              py-5
              space-y-8
              no-scrollbar
              overscroll-contain
            "
          >

            {/* ITEMS */}
            <div className="space-y-4">

              {items.length === 0 ? (
                <div className="text-center py-20 bg-stone-50 rounded-[2.5rem] border border-dashed border-stone-200">

                  <span className="text-6xl block mb-4">
                    🍔
                  </span>

                  <p className="font-bold text-stone-400 uppercase text-xs tracking-widest">
                    ¿Hambre? Agregá algo rico
                  </p>

                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={`cart-item-${item.cartId}`}
                    className="flex flex-col gap-2 p-3 bg-stone-50/50 rounded-2xl border border-stone-100"
                  >

                    <div className="flex items-center gap-3">

                      <div className="relative w-16 h-16 shrink-0 rounded-2xl overflow-hidden border border-white shadow-sm">
                        <img
                          src={item.imagen}
                          className="w-full h-full object-cover"
                          alt={item.nombre}
                        />
                      </div>

                      <div className="flex-1 min-w-0">

                        <h4 className="font-bold text-sm text-stone-900 truncate uppercase tracking-tight">
                          {item.nombre}
                        </h4>

                        <p className="font-black text-[#D32F2F] text-xs mt-1">
                          $
                          {(
                            item.precioUnitarioTotal *
                            item.quantity
                          ).toLocaleString('es-AR')}
                        </p>

                      </div>

                      <div className="flex items-center bg-white border border-stone-200 rounded-xl p-1 shrink-0">

                        <button
                          onClick={() =>
                            decreaseQuantity(item.cartId)
                          }
                          className="w-8 h-8 flex items-center justify-center font-bold text-stone-500 active:scale-90"
                        >
                          –
                        </button>

                        <span className="px-2 font-black text-xs text-stone-900">
                          {item.quantity}
                        </span>

                        <button
                          onClick={() =>
                            addItem(
                              item,
                              item.extrasElegidos
                            )
                          }
                          className="w-8 h-8 flex items-center justify-center font-bold text-stone-500 active:scale-90"
                        >
                          +
                        </button>

                      </div>
                    </div>

                    {item.extrasElegidos &&
                      item.extrasElegidos.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 ml-[76px] mt-1">

                          {item.extrasElegidos.map((extra, idx) => (
                            <span
                              key={`extra-${item.cartId}-${extra.id}-${idx}`}
                              className="text-[8px] font-black uppercase bg-[#FFCA28]/10 text-[#c79d1a] border border-[#FFCA28]/20 px-2 py-1 rounded-md"
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
                <div className="flex p-1 bg-stone-100 rounded-2xl">

                  {['Delivery', 'Retiro'].map((tipo) => (
                    <button
                      key={tipo}
                      onClick={() =>
                        setCustomer({
                          ...customer,
                          tipoEntrega:
                            tipo as
                              | 'Delivery'
                              | 'Retiro'
                        })
                      }
                      className={`flex-1 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${
                        customer.tipoEntrega === tipo
                          ? 'bg-white text-stone-900 shadow-sm'
                          : 'text-stone-400'
                      }`}
                    >
                      {tipo === 'Delivery'
                        ? '🛵 Delivery'
                        : '🏠 Retiro'}
                    </button>
                  ))}

                </div>

                {/* DATOS */}
                <div className="space-y-3">

                  <input
                    type="text"
                    placeholder="TU NOMBRE"
                    className="w-full bg-stone-50 border border-stone-100 p-4 rounded-2xl font-bold uppercase text-xs outline-none focus:ring-2 focus:ring-[#FFCA28]/30"
                    value={customer.nombre}
                    onChange={(e) =>
                      setCustomer({
                        ...customer,
                        nombre: e.target.value
                      })
                    }
                  />

                  <input
                    type="tel"
                    placeholder="TELÉFONO"
                    className="w-full bg-stone-50 border border-stone-100 p-4 rounded-2xl font-bold text-xs outline-none focus:ring-2 focus:ring-[#FFCA28]/30"
                    value={customer.telefono}
                    onChange={(e) =>
                      setCustomer({
                        ...customer,
                        telefono:
                          e.target.value.replace(
                            /\D/g,
                            ''
                          )
                      })
                    }
                  />

                  {customer.tipoEntrega ===
                    'Delivery' && (
                    <div className="space-y-3">

                      {/* REFERENCIA */}
                      <div className="relative overflow-hidden rounded-[1.8rem] border border-[#FFCA28]/20 bg-gradient-to-br from-[#FFCA28]/10 via-orange-50 to-white p-4">

                        <div className="flex items-start gap-4">

                          <div className="w-12 h-12 rounded-2xl bg-[#FFCA28] flex items-center justify-center shrink-0">
                            <span className="text-xl">
                              📍
                            </span>
                          </div>

                          <div className="min-w-0">

                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#c79d1a] mb-1">
                              Referencia del Local
                            </p>

                            <p className="font-black text-stone-900 text-sm uppercase leading-tight">
                              Calle 853 N° 1149
                            </p>

                            <p className="text-[11px] text-stone-500 font-bold mt-1 leading-relaxed">
                              Elegí tu barrio según
                              qué tan lejos estés del local.
                            </p>

                          </div>
                        </div>
                      </div>

                      {/* SELECT */}
                      <select
                        className="w-full bg-stone-50 border border-stone-100 p-4 rounded-2xl font-bold text-xs uppercase outline-none"
                        value={customer.barrio}
                        onChange={(e) =>
                          setCustomer({
                            ...customer,
                            barrio: e.target.value
                          })
                        }
                      >

                        <option value="">
                          📍 SELECCIONÁ TU BARRIO
                        </option>

                        {ZONAS_REPARTO.map((zona) => (
                          <option
                            key={zona.nombre}
                            value={zona.nombre}
                          >
                            {zona.nombre}
                            {zona.nombre !==
                            'Otro Barrio'
                              ? ` (+$${zona.costo})`
                              : ''}
                          </option>
                        ))}

                      </select>

                      {/* OTRO */}
                      {customer.barrio ===
                        'Otro Barrio' && (
                        <input
                          type="text"
                          placeholder="ESCRIBÍ TU BARRIO"
                          className="w-full bg-stone-50 border border-orange-200 p-4 rounded-2xl font-bold text-xs uppercase outline-none"
                          value={customer.otroBarrio}
                          onChange={(e) =>
                            setCustomer({
                              ...customer,
                              otroBarrio:
                                e.target.value
                            })
                          }
                        />
                      )}

                      {/* DIRECCIÓN */}
                      <input
                        type="text"
                        placeholder="CALLE Y ALTURA"
                        className="w-full bg-stone-50 border border-stone-100 p-4 rounded-2xl font-bold text-xs uppercase outline-none"
                        value={customer.calleAltura}
                        onChange={(e) =>
                          setCustomer({
                            ...customer,
                            calleAltura:
                              e.target.value
                          })
                        }
                      />

                      {/* ALERTA */}
                      {customer.barrio ===
                        'Otro Barrio' && (
                        <div className="bg-orange-50 border border-orange-200 p-4 rounded-2xl">
                          <p className="text-[11px] font-black uppercase text-orange-600 leading-relaxed">
                            ⚠️ Vamos a revisar manualmente el costo de envío para tu zona.
                          </p>
                        </div>
                      )}

                    </div>
                  )}

                  {/* METODO PAGO */}
                  <div className="space-y-4 pt-2">

                    <p className="text-[10px] font-black uppercase text-stone-400 tracking-[0.2em] px-1">
                      Método de Pago
                    </p>

                    <div className="grid grid-cols-3 gap-2">

                      {['Efectivo', 'Transferencia', 'QR'].map((pago) => (
                        <button
                          key={pago}
                          onClick={() =>
                            setCustomer({
                              ...customer,
                              metodoPago: pago
                            })
                          }
                          className={`py-3 rounded-xl border font-black text-[9px] uppercase transition-all ${
                            customer.metodoPago === pago
                              ? 'bg-stone-900 text-white border-stone-900'
                              : 'bg-white border-stone-100 text-stone-400'
                          }`}
                        >
                          {pago}
                        </button>
                      ))}

                    </div>

                    {customer.metodoPago ===
                      'Transferencia' && (
                      <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-[2rem]">

                        <p className="text-[9px] font-black uppercase text-blue-400 mb-3 tracking-wider">
                          Alias de Pago
                        </p>

                        <div
                          onClick={handleCopyAlias}
                          className="flex items-center justify-between gap-3 bg-white p-4 rounded-2xl cursor-pointer border border-blue-100 active:scale-[0.98] transition-all"
                        >

                          <span className="font-black text-blue-900 text-sm truncate">
                            {ALIAS_TRANSFERENCIA}
                          </span>

                          <span
                            className={`text-[9px] font-black uppercase px-2 py-1 rounded-full shrink-0 ${
                              copied
                                ? 'bg-emerald-500 text-white'
                                : 'bg-blue-100 text-blue-600'
                            }`}
                          >
                            {copied ? '¡Copiado!' : 'Copiar'}
                          </span>

                        </div>
                      </div>
                    )}

                    {customer.metodoPago ===
                      'Efectivo' && (
                      <div className="bg-emerald-50/50 border border-emerald-100 p-5 rounded-[2rem]">

                        <p className="text-[9px] font-black uppercase text-emerald-400 mb-3 tracking-wider">
                          ¿Con cuánto pagás?
                        </p>

                        <input
                          type="number"
                          className="w-full bg-white p-4 rounded-2xl font-black text-emerald-900 border border-emerald-100 outline-none"
                          value={montoEfectivo}
                          onChange={(e) =>
                            setMontoEfectivo(
                              e.target.value
                            )
                          }
                          placeholder={`$${montoTotalFinal}`}
                        />

                        {vuelto > 0 && (
                          <div className="mt-4 flex justify-between items-center px-2">

                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                              Tu Vuelto:
                            </span>

                            <span className="text-lg font-black text-emerald-700">
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
                    className="w-full bg-stone-50 border border-stone-100 p-4 rounded-2xl font-bold text-xs h-24 resize-none outline-none"
                    value={customer.notes}
                    onChange={(e) =>
                      setCustomer({
                        ...customer,
                        notes: e.target.value
                      })
                    }
                  />

                </div>
              </div>
            )}

          </div>

          {/* FOOTER */}
          <div
            className="
              shrink-0
              bg-white
              border-t
              border-stone-100
              px-4
              sm:px-6
              pt-4
              pb-[max(env(safe-area-inset-bottom),16px)]
              shadow-[0_-10px_20px_rgba(0,0,0,0.02)]
            "
          >

            <div className="space-y-2 mb-5">

              <div className="flex justify-between items-center text-stone-400 font-bold text-[11px] uppercase tracking-tighter">

                <span>Subtotal</span>

                <span>
                  $
                  {subtotal.toLocaleString(
                    'es-AR'
                  )}
                </span>

              </div>

              <div className="flex justify-between items-center text-stone-400 font-bold text-[11px] uppercase tracking-tighter">

                <span>
                  Costo de Envío
                </span>

                <span>
                  {customer.tipoEntrega ===
                  'Retiro'
                    ? 'N/A'
                    : costoEnvio === 0
                    ? '¡GRATIS!'
                    : `$${costoEnvio.toLocaleString(
                        'es-AR'
                      )}`}
                </span>

              </div>

              <div className="flex justify-between items-end pt-3 gap-3">

                <span className="font-black text-stone-900 uppercase tracking-tighter text-sm">
                  Total Final
                </span>

                <span className="text-3xl sm:text-4xl font-black text-stone-950 tracking-tighter text-right break-words">
                  $
                  {montoTotalFinal.toLocaleString(
                    'es-AR'
                  )}
                </span>

              </div>
            </div>

            <button
              disabled={
                items.length === 0 ||
                isSending
              }
              onClick={handleCheckout}
              className={`w-full py-5 rounded-[2rem] font-black uppercase text-sm tracking-[0.15em] transition-all duration-300 active:scale-[0.98] ${
                !isFormValid ||
                items.length === 0
                  ? 'bg-stone-100 text-stone-300 cursor-not-allowed'
                  : 'bg-[#FFCA28] text-stone-950 hover:bg-[#D32F2F] hover:text-white'
              }`}
            >
              {isSending
                ? 'PROCESANDO...'
                : isFormValid
                ? 'Confirmar Pedido ➔'
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
          `
        }}
      />
    </>
  );
}