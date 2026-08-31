// components/CartDrawer.tsx - VERSIÓN DEFINITIVA CON ENVÍO GRATIS CORREGIDO
"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import LocationPicker from '@/components/LocationPicker';
import { calcularEnvio, ResultadoEnvio } from '@/services/deliveryService';
import { useGoogleMaps } from '@/lib/googleMapsLoader';
import { useBeneficios } from '../app/hooks/useBeneficios';

const ALIAS_TRANSFERENCIA = "krustyburger2025";
const DIRECCION_LOCAL = "CALLE 853 N° 1149, VILLA LA FLORIDA";

// ✅ Mínimo para envío gratis
const MINIMO_ENVIO_GRATIS = 19000;

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

  // ✅ Obtener usuario y perfil del store
  const { user, perfil, actualizarPerfil, isAuthenticated, isLoading, forzarActualizacion } = useAuthStore();

  // ✅ REFs para controlar ejecuciones
  const yaInicializado = useRef(false);
  const yaCargadoPuntos = useRef(false);
  const ultimoUserId = useRef<string | null>(null);

  // ✅ ESTADO PARA CANJE DE PUNTOS
  const [puntosAUsar, setPuntosAUsar] = useState(0);
  const [descuentoPorPuntos, setDescuentoPorPuntos] = useState(0);
  const [mostrarSelectorPuntos, setMostrarSelectorPuntos] = useState(false);
  const [puntosDisponibles, setPuntosDisponibles] = useState(0);
  const [cargandoPuntos, setCargandoPuntos] = useState(false);
  const [errorPuntos, setErrorPuntos] = useState<string | null>(null);

  // ✅ FUNCIÓN PARA CARGAR PUNTOS DESDE LA DB (CON CONTROL DE EJECUCIÓN)
  const cargarPuntosDelUsuario = useCallback(async (forzarRecarga = false) => {
    const userId = user?.id;

    if (!userId) {
      console.log('❌ [CARRITO] No hay usuario para cargar puntos');
      return;
    }

    // ✅ Si ya cargamos los puntos para este usuario y no forzamos, salir
    if (!forzarRecarga && yaCargadoPuntos.current && ultimoUserId.current === userId) {
      console.log('⏳ [CARRITO] Puntos ya cargados para este usuario, omitiendo...');
      return;
    }

    setCargandoPuntos(true);
    setErrorPuntos(null);

    console.log(`🔄 [CARRITO] Cargando puntos del usuario:`, userId);

    try {
      // Consultar directamente a la DB
      console.log('📡 [CARRITO] Consultando puntos a la DB...');
      const { data, error } = await supabase
        .from('perfiles')
        .select('puntos_disponibles, puntos_acumulados')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ [CARRITO] Error cargando puntos:', error);
        setErrorPuntos(`Error: ${error.message || 'Error desconocido'}`);
        setPuntosDisponibles(0);
        setCargandoPuntos(false);
        return;
      }

      if (data) {
        console.log('✅ [CARRITO] Puntos cargados:', data.puntos_disponibles);
        setPuntosDisponibles(data.puntos_disponibles || 0);
        yaCargadoPuntos.current = true;
        ultimoUserId.current = userId;

        // Actualizar el store SOLO si es necesario
        if (perfil && perfil.puntos_disponibles !== data.puntos_disponibles) {
          const perfilActualizado = { ...perfil, ...data };
          await actualizarPerfil(perfilActualizado);
          console.log('🔄 [CARRITO] Store actualizado con puntos frescos');
        }
      }
    } catch (error) {
      console.error('❌ [CARRITO] Error inesperado:', error);
      setErrorPuntos('Error inesperado al cargar puntos');
      setPuntosDisponibles(0);
    } finally {
      setCargandoPuntos(false);
    }
  }, [user?.id, perfil, actualizarPerfil]);

  // ✅ FORZAR SINCRONIZACIÓN DE AUTENTICACIÓN AL MONTAR (SOLO UNA VEZ)
  useEffect(() => {
    if (yaInicializado.current) {
      return;
    }

    yaInicializado.current = true;

    const verificarYForzarAuth = async () => {
      console.log('🔍 [FIX] Verificando autenticación...');

      try {
        const { data: { session: supabaseSession } } = await supabase.auth.getSession();

        if (supabaseSession?.user) {
          console.log('✅ [FIX] Usuario encontrado:', supabaseSession.user.id);

          const { data: perfilData, error } = await supabase
            .from('perfiles')
            .select('*')
            .eq('id', supabaseSession.user.id)
            .single();

          if (error) {
            console.error('❌ [FIX] Error cargando perfil:', error);
            setErrorPuntos(`Error al cargar perfil: ${error.message}`);
            return;
          }

          if (perfilData) {
            console.log('✅ [FIX] Perfil cargado, puntos:', perfilData.puntos_disponibles);

            // ✅ FORZAR actualización del store
            if (forzarActualizacion) {
              forzarActualizacion({
                user: supabaseSession.user,
                perfil: perfilData,
                session: supabaseSession
              });
            }

            // ✅ Actualizar estado local
            setPuntosDisponibles(perfilData.puntos_disponibles || 0);
            yaCargadoPuntos.current = true;
            ultimoUserId.current = supabaseSession.user.id;
          }
        } else {
          console.log('❌ [FIX] No hay sesión activa');
        }
      } catch (error) {
        console.error('❌ [FIX] Error:', error);
        setErrorPuntos('Error al verificar autenticación');
      }
    };

    verificarYForzarAuth();
  }, [forzarActualizacion]);

  // ✅ RECARGAR PUNTOS SOLO CUANDO EL CARRITO SE ABRE Y HAY USUARIO
  useEffect(() => {
    if (isOpen && isAuthenticated && user?.id) {
      if (ultimoUserId.current !== user.id) {
        console.log('🔄 [CARRITO] Abriendo carrito con nuevo usuario, cargando puntos...');
        yaCargadoPuntos.current = false;
        cargarPuntosDelUsuario(true);
      } else if (!yaCargadoPuntos.current) {
        console.log('🔄 [CARRITO] Abriendo carrito, cargando puntos...');
        cargarPuntosDelUsuario(true);
      }
    }
  }, [isOpen, isAuthenticated, user?.id, cargarPuntosDelUsuario]);

  // ✅ HOOK DE BENEFICIOS (usando el perfil del store)
  const {
    nivel,
    beneficios,
    calcularDescuento,
    tieneEnvioGratis: tieneEnvioGratisBeneficio,
    descripcionBeneficios,
    cargando: cargandoBeneficios,
  } = useBeneficios(perfil?.puntos_acumulados || 0, user?.id);

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

  // ✅ Cargar datos guardados
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('krusty-customer-v5');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCustomer(prev => ({
          ...prev,
          ...parsed,
          nombre: parsed.nombre || prev.nombre,
          telefono: parsed.telefono || prev.telefono,
        }));
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

    if (perfil) {
      setCustomer(prev => ({
        ...prev,
        nombre: perfil.nombre_cliente || prev.nombre,
        telefono: perfil.telefono || prev.telefono,
      }));
    }
  }, [perfil]);

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

  // ✅ CÁLCULOS
  const descuentoNivelAplicado = useMemo(() => {
    if (items.length === 0) return 0;
    const subtotal = total();
    if (!beneficios || beneficios.descuento === 0) return 0;
    return calcularDescuento(subtotal);
  }, [total, beneficios, calcularDescuento, items.length]);

  // ✅ ENVÍO GRATIS - A partir de $19.000 O por beneficio del nivel
  const envioGratisAplicado = useMemo(() => {
    const subtotal = total();

    // ✅ Envío gratis por superar el mínimo de $19.000 (incluye exacto)
    if (subtotal >= MINIMO_ENVIO_GRATIS) {
      return true;
    }

    // ✅ Envío gratis por beneficios del nivel (si existe)
    if (!beneficios) return false;
    return tieneEnvioGratisBeneficio(subtotal);
  }, [total, beneficios, tieneEnvioGratisBeneficio]);

  // ✅ Cuánto falta para el envío gratis
  const faltaParaEnvioGratis = useMemo(() => {
    const subtotal = total();
    if (subtotal >= MINIMO_ENVIO_GRATIS) return 0;
    return MINIMO_ENVIO_GRATIS - subtotal;
  }, [total]);

  // ✅ Porcentaje de progreso para envío gratis (máximo 99% si no ha llegado)
  const progresoEnvioGratis = useMemo(() => {
    const subtotal = total();
    if (subtotal >= MINIMO_ENVIO_GRATIS) return 100;
    const porcentaje = (subtotal / MINIMO_ENVIO_GRATIS) * 100;
    return Math.min(porcentaje, 99);
  }, [total]);

  const subtotal = total();

  // ✅ COSTO DE ENVÍO - CORREGIDO
  const costoEnvio = useMemo(() => {
    // Si es Retiro, no hay envío
    if (customer.tipoEntrega === 'Retiro') return 0;

    // Si tiene envío gratis, es 0
    if (envioGratisAplicado) return 0;

    // Si hay resultado de envío Y está disponible, usar su precio
    if (resultadoEnvio?.disponible) return resultadoEnvio.precio;

    // Si NO hay resultado de envío (no se seleccionó ubicación), retornar null
    return null;
  }, [customer.tipoEntrega, resultadoEnvio, envioGratisAplicado]);

  const totalConDescuentoNivel = useMemo(() => {
    const envio = costoEnvio === null ? 0 : costoEnvio;
    return Math.max(0, subtotal - descuentoNivelAplicado + envio);
  }, [subtotal, descuentoNivelAplicado, costoEnvio]);

  const calcularDescuentoPorPuntos = useCallback((puntos: number) => {
    const descuento = puntos;
    const maxDescuento = totalConDescuentoNivel * 0.5;
    return Math.min(descuento, maxDescuento);
  }, [totalConDescuentoNivel]);

  const handlePuntosChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = parseInt(e.target.value) || 0;
    const maxPuntos = Math.min(valor, puntosDisponibles);
    setPuntosAUsar(maxPuntos);
    const descuento = calcularDescuentoPorPuntos(maxPuntos);
    setDescuentoPorPuntos(descuento);
  }, [puntosDisponibles, calcularDescuentoPorPuntos]);

  const usarTodosLosPuntos = useCallback(() => {
    const maxPuntos = Math.min(puntosDisponibles, Math.floor(totalConDescuentoNivel * 0.5));
    setPuntosAUsar(maxPuntos);
    const descuento = calcularDescuentoPorPuntos(maxPuntos);
    setDescuentoPorPuntos(descuento);
  }, [puntosDisponibles, totalConDescuentoNivel, calcularDescuentoPorPuntos]);

  const resetearPuntos = useCallback(() => {
    setPuntosAUsar(0);
    setDescuentoPorPuntos(0);
  }, []);

  const montoTotalFinal = useMemo(() => {
    return Math.max(0, totalConDescuentoNivel - descuentoPorPuntos);
  }, [totalConDescuentoNivel, descuentoPorPuntos]);

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
      localStorage.setItem('krusty_user_telefono', customer.telefono);

      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || null;

      const direccionCompleta = customer.tipoEntrega === 'Delivery'
        ? customer.calleAltura.toUpperCase()
        : `🏠 RETIRO POR LOCAL (${DIRECCION_LOCAL})`;

      const itemsResumenDB = items
        .map((i) => `${i.quantity}x ${i.nombre}`)
        .join(', ');

      const pedidoData = {
        cliente_nombre: customer.nombre,
        direccion: direccionCompleta,
        telefono: customer.telefono,
        metodo_pago: 'Mercado Pago (Pendiente)',
        tipo_entrega: customer.tipoEntrega,
        total: montoTotalFinal,
        total_parcial: subtotal,
        costo_envio: costoEnvio,
        estado: 'pago_pendiente',
        resumenes_de_elementos: itemsResumenDB,
        notas: customer.notes || null,
        id_de_usuario: userId,
        puntos_usados: puntosAUsar,
        lat_cliente: ubicacionSeleccionada?.lat || null,
        lng_cliente: ubicacionSeleccionada?.lng || null,
        distancia_km: resultadoEnvio?.distancia_km || null,
        tiempo_estimado: resultadoEnvio?.tiempo_minutos || null,
        descuento_puntos: descuentoPorPuntos,
      };

      console.log('📤 Enviando pedido a Supabase:', pedidoData);

      if (puntosAUsar > 0 && userId) {
        const nuevosPuntos = (perfil?.puntos_disponibles || 0) - puntosAUsar;
        await supabase
          .from('perfiles')
          .update({ puntos_disponibles: nuevosPuntos })
          .eq('id', userId);

        if (actualizarPerfil) {
          await actualizarPerfil({ puntos_disponibles: nuevosPuntos });
        }
      }

      const { data: pedidoGuardado, error } = await supabase
        .from('pedidos')
        .insert([pedidoData])
        .select()
        .single();

      if (error) {
        console.error('❌ Error al guardar pedido:', error);
        throw new Error(`Error al guardar pedido: ${error.message}`);
      }

      console.log('✅ Pedido guardado:', pedidoGuardado);

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
      localStorage.setItem('krusty_user_telefono', customer.telefono);

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

      const pedidoData = {
        cliente_nombre: customer.nombre,
        direccion: direccionCompleta,
        telefono: customer.telefono,
        metodo_pago: detallePago,
        tipo_entrega: customer.tipoEntrega,
        total: montoTotalFinal,
        total_parcial: subtotal,
        costo_envio: costoEnvio,
        estado: customer.metodoPago === 'Transferencia' ? 'pago_pendiente' : 'pendiente',
        resumenes_de_elementos: itemsResumenDB,
        notas: customer.notes || null,
        id_de_usuario: userId,
        puntos_usados: puntosAUsar,
        lat_cliente: ubicacionSeleccionada?.lat || null,
        lng_cliente: ubicacionSeleccionada?.lng || null,
        distancia_km: resultadoEnvio?.distancia_km || null,
        tiempo_estimado: resultadoEnvio?.tiempo_minutos || null,
        monto_pago: customer.metodoPago === 'Efectivo' && montoEfectivo ? parseFloat(montoEfectivo) : null,
        vuelto: customer.metodoPago === 'Efectivo' && vuelto > 0 ? vuelto : null,
        descuento_puntos: descuentoPorPuntos,
      };

      console.log('📤 Enviando pedido a Supabase:', pedidoData);

      if (puntosAUsar > 0 && userId) {
        const nuevosPuntos = (perfil?.puntos_disponibles || 0) - puntosAUsar;
        await supabase
          .from('perfiles')
          .update({ puntos_disponibles: nuevosPuntos })
          .eq('id', userId);

        if (actualizarPerfil) {
          await actualizarPerfil({ puntos_disponibles: nuevosPuntos });
        }
      }

      const { data: pedidoGuardado, error } = await supabase
        .from('pedidos')
        .insert([pedidoData])
        .select()
        .single();

      if (error) {
        console.error('❌ Error al guardar pedido:', error);
        throw new Error(`Error al guardar pedido: ${error.message}`);
      }

      console.log('✅ Pedido guardado:', pedidoGuardado);

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
        (descuentoNivelAplicado > 0 ? `🎯 *DESCUENTO ${nivel?.nombre?.toUpperCase()}:* ${descuentoNivelAplicado}% (${nivel?.icono || '⭐'})\n` : '') +
        (envioGratisAplicado ? `🆓 *ENVÍO GRATIS* (${subtotal >= MINIMO_ENVIO_GRATIS ? 'por superar $19.000' : `Beneficio ${nivel?.nombre || ''}`})\n` : '') +
        (puntosAUsar > 0 ? `⭐ *PUNTOS USADOS:* ${puntosAUsar} pts (-$${descuentoPorPuntos.toLocaleString('es-AR')})\n` : '') +
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
        (descuentoNivelAplicado > 0 ? `🎯 *DESCUENTO:* -$${descuentoNivelAplicado.toLocaleString('es-AR')}\n` : '') +
        (puntosAUsar > 0 ? `⭐ *PUNTOS:* -$${descuentoPorPuntos.toLocaleString('es-AR')}\n` : '') +
        `🛵 *ENVÍO:* ${customer.tipoEntrega === 'Retiro'
          ? 'N/A'
          : envioGratisAplicado
            ? 'GRATIS 🎁'
            : costoEnvio === null
              ? '📍 Seleccioná ubicación'
              : costoEnvio === 0
                ? 'GRATIS'
                : `$${costoEnvio.toLocaleString('es-AR')}`}\n` +
        `💰 *TOTAL: $${montoTotalFinal.toLocaleString('es-AR')}*\n\n` +
        (customer.metodoPago === 'Transferencia'
          ? `🏦 *ALIAS:* ${ALIAS_TRANSFERENCIA}\n`
          : '') +
        `🤡 _¡Gracias por elegir al payaso!_`
      );

      console.log('📱 Abriendo WhatsApp...');
      clearCart();
      onClose();

      if (typeof window !== 'undefined') {
        window.open(`https://wa.me/${numeroTelefono}?text=${mensaje}`, '_blank');
      }

      router.push('/gracias');

    } catch (e) {
      console.error('❌ Error en handleCheckout:', e);
      let errorMessage = '❌ Error procesando el pedido.';
      if (e instanceof Error) {
        errorMessage += `\n\n${e.message}`;
      }
      alert(errorMessage);

    } finally {
      setIsSending(false);
    }
  };

  if (!mounted) return null;

  // ✅ DEBUG - Verificar estado de puntos
  console.log('🔴 [CARRITO] DEBUG FINAL:');
  console.log('  - isAuthenticated:', isAuthenticated);
  console.log('  - isLoading:', isLoading);
  console.log('  - user?.id:', user?.id);
  console.log('  - puntosDisponibles:', puntosDisponibles);
  console.log('  - cargandoPuntos:', cargandoPuntos);
  console.log('  - errorPuntos:', errorPuntos);
  console.log('  - items.length:', items.length);
  console.log('  - subtotal:', subtotal);
  console.log('  - envioGratisAplicado:', envioGratisAplicado);
  console.log('  - costoEnvio:', costoEnvio);

  // ✅ ELIMINADO EL SPINNER BLOQUEANTE - El carrito se muestra siempre
  const isAuthLoading = isLoading && !isAuthenticated;

  return (
    <>
      <div
        className={`fixed inset-0 bg-stone-900/40 dark:bg-black/70 z-60 backdrop-blur-md transition-all duration-500 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
          }`}
        onClick={onClose}
      />

      <div
        className={`fixed inset-y-0 right-0 z-70 bg-white dark:bg-[#1a1a1a] shadow-2xl transform transition-transform duration-500 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
          }
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
                  {isAuthLoading ? 'Cargando...' : `${items.length} ${items.length === 1 ? 'producto' : 'productos'}`}
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

          {/* CONTENIDO */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-5 dark:bg-[#1a1a1a] no-scrollbar">

            {isAuthLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-[#FAD02C] border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="mt-3 text-stone-400 font-bold text-[10px]">Cargando tu información...</p>
                </div>
              </div>
            ) : (
              <>
                {/* SECCIÓN DE BENEFICIOS */}
                {perfil && beneficios && nivel && (
                  <div className="bg-[#FAD02C]/10 border border-[#FAD02C]/20 rounded-xl p-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#FAD02C]/20 flex items-center justify-center text-xl shrink-0">
                        {nivel.icono || '⭐'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-black uppercase text-stone-700 dark:text-stone-300">
                            {nivel.nombre}
                          </p>
                          {beneficios.descuento > 0 && (
                            <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-500/20 px-2 py-0.5 rounded-full">
                              {beneficios.descuento}% OFF
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-stone-500 dark:text-stone-400 truncate">
                          {descripcionBeneficios}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[9px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                          Puntos
                        </p>
                        <p className="text-lg font-black text-[#FAD02C]">
                          {cargandoPuntos ? '...' : puntosDisponibles}
                        </p>
                      </div>
                    </div>

                    {(descuentoNivelAplicado > 0 || envioGratisAplicado || puntosAUsar > 0) && (
                      <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2.5 border-t border-[#FAD02C]/20">
                        {descuentoNivelAplicado > 0 && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-stone-800 rounded-full text-[10px] font-bold text-red-500 border border-stone-200 dark:border-stone-700">
                            🎯 -${descuentoNivelAplicado.toLocaleString('es-AR')}
                          </span>
                        )}
                        {envioGratisAplicado && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-stone-800 rounded-full text-[10px] font-bold text-emerald-500 border border-stone-200 dark:border-stone-700">
                            🆓 Envío gratis
                          </span>
                        )}
                        {puntosAUsar > 0 && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-stone-800 rounded-full text-[10px] font-bold text-[#FAD02C] border border-stone-200 dark:border-stone-700">
                            ⭐ -${descuentoPorPuntos.toLocaleString('es-AR')} (puntos)
                          </span>
                        )}
                        {beneficios.prioridadEntrega > 1 && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-stone-800 rounded-full text-[10px] font-bold text-blue-500 border border-stone-200 dark:border-stone-700">
                            ⚡ Prioridad {beneficios.prioridadEntrega}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ITEMS */}
                <div className="space-y-3">
                  {items.length === 0 ? (
                    <button
                      onClick={() => {
                        console.log('🔄 Click detectado!');
                        onClose();
                        setTimeout(() => {
                          router.push('/');
                        }, 300);
                      }}
                      className="w-full text-center py-12 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border-2 border-dashed border-stone-200 dark:border-stone-700 hover:border-[#FAD02C] hover:bg-stone-100 dark:hover:bg-stone-800 transition-all duration-300 cursor-pointer group relative z-50"
                    >
                      <span className="text-4xl block mb-3 group-hover:scale-110 transition-transform duration-300">🍔</span>
                      <p className="font-bold text-stone-400 uppercase text-[10px] tracking-widest group-hover:text-[#FAD02C] transition-colors">
                        ¿Hambre? Agregá algo rico
                      </p>
                      <p className="text-[8px] font-bold text-stone-300 uppercase tracking-widest mt-1 group-hover:text-stone-400 transition-colors">
                        👆 Tocá para ver el menú
                      </p>
                    </button>
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

                {/* ✅ PROGRESO PARA ENVÍO GRATIS - SOLO si NO tiene envío gratis */}
                {items.length > 0 && customer.tipoEntrega === 'Delivery' && !envioGratisAplicado && (
                  <div className="bg-linear-to-r from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🚚</span>
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                          Agregá <span className="text-[#FAD02C] dark:text-[#FAD02C]">${faltaParaEnvioGratis.toLocaleString('es-AR')}</span> más
                        </span>
                      </div>
                      <span className="text-[10px] font-black text-blue-600 dark:text-blue-400">
                        {Math.round(progresoEnvioGratis)}%
                      </span>
                    </div>

                    {/* Barra de progreso */}
                    <div className="w-full h-2 bg-blue-100 dark:bg-blue-900/30 rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-linear-to-r from-[#FAD02C] to-[#FFCA28] rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${Math.min(progresoEnvioGratis, 99)}%` }}
                      />
                    </div>

                    <p className="text-[8px] font-bold text-blue-400 dark:text-blue-500 mt-1.5 text-center">
                      💡 Llegando a ${MINIMO_ENVIO_GRATIS.toLocaleString('es-AR')} el envío es GRATIS
                    </p>
                  </div>
                )}

                {/* ✅ MENSAJE DE ÉXITO - SOLO si TIENE envío gratis */}
                {items.length > 0 && customer.tipoEntrega === 'Delivery' && envioGratisAplicado && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-300 dark:border-emerald-700 rounded-xl p-3 text-center">
                    <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      🎉 ¡ENVÍO GRATIS!
                      {subtotal >= MINIMO_ENVIO_GRATIS
                        ? ` Superaste los $${MINIMO_ENVIO_GRATIS.toLocaleString('es-AR')}`
                        : ` Beneficio ${nivel?.nombre || ''}`}
                    </p>
                  </div>
                )}

                {/* FORMULARIO */}
                {items.length > 0 && (
                  <div className="space-y-4 border-t border-stone-100 dark:border-stone-800 pt-4">

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
                                      <span>
                                        {envioGratisAplicado ? 'GRATIS (Beneficio)' :
                                          resultadoEnvio.precio === 0 ? 'GRATIS' :
                                            `$${resultadoEnvio.precio.toLocaleString('es-AR')}`}
                                      </span>
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

                      {/* SECCIÓN DE CANJE DE PUNTOS */}
                      {items.length > 0 && (
                        <>
                          {cargandoPuntos && (
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                              <p className="text-[10px] font-bold text-blue-600">⏳ Cargando tus puntos...</p>
                            </div>
                          )}

                          {!cargandoPuntos && errorPuntos && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                              <p className="text-[10px] font-bold text-red-600">❌ {errorPuntos}</p>
                            </div>
                          )}

                          {!cargandoPuntos && !errorPuntos && isAuthenticated && puntosDisponibles > 0 && (
                            <div className="bg-[#FAD02C]/5 border-2 border-[#FAD02C]/30 rounded-xl p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">⭐</span>
                                  <span className="text-xs font-black uppercase text-stone-500">
                                    Puntos disponibles: <span className="text-[#FAD02C] text-sm">{puntosDisponibles}</span>
                                  </span>
                                </div>
                                <button
                                  onClick={() => setMostrarSelectorPuntos(!mostrarSelectorPuntos)}
                                  className="text-xs font-black text-[#D32F2F] hover:text-black transition-colors px-3 py-1 rounded-full bg-[#D32F2F]/10 hover:bg-[#D32F2F]/20"
                                >
                                  {mostrarSelectorPuntos ? '✕ Ocultar' : '🎯 Usar puntos'}
                                </button>
                              </div>

                              {mostrarSelectorPuntos && (
                                <div className="mt-3 space-y-2 bg-white dark:bg-stone-800 p-3 rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-stone-400">⭐</span>
                                    <input
                                      type="number"
                                      min="0"
                                      max={Math.min(puntosDisponibles, Math.floor(totalConDescuentoNivel * 0.5))}
                                      value={puntosAUsar || ''}
                                      onChange={handlePuntosChange}
                                      placeholder="0"
                                      className="w-24 bg-stone-50 dark:bg-stone-700 border-2 border-stone-200 dark:border-stone-600 p-2 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-[#FAD02C]/30 dark:text-white"
                                    />
                                    <span className="text-xs font-bold text-stone-400">pts</span>
                                    <span className="text-xs font-bold text-[#FAD02C] ml-1">
                                      = -${descuentoPorPuntos.toLocaleString('es-AR')}
                                    </span>
                                  </div>

                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      onClick={usarTodosLosPuntos}
                                      className="text-[9px] font-black bg-[#FAD02C]/20 hover:bg-[#FAD02C]/40 px-3 py-1 rounded-full transition-colors"
                                    >
                                      ✅ Usar máximos posibles
                                    </button>
                                    {puntosAUsar > 0 && (
                                      <button
                                        onClick={resetearPuntos}
                                        className="text-[9px] font-black text-red-500 hover:text-red-700 px-3 py-1 rounded-full transition-colors"
                                      >
                                        ❌ Quitar puntos
                                      </button>
                                    )}
                                  </div>

                                  <p className="text-[8px] font-bold text-stone-400">
                                    💡 Máximo 50% del total ({Math.floor(totalConDescuentoNivel * 0.5).toLocaleString('es-AR')} pts = -${(totalConDescuentoNivel * 0.5).toLocaleString('es-AR')})
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {!cargandoPuntos && !errorPuntos && isAuthenticated && puntosDisponibles === 0 && (
                            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-2 text-center">
                              <p className="text-[10px] font-bold text-yellow-700">
                                ⚠️ No tienes puntos disponibles para canjear
                                {perfil?.puntos_acumulados && perfil.puntos_acumulados > 0 && ` (acumulados: ${perfil.puntos_acumulados})`}
                              </p>
                            </div>
                          )}

                          {!cargandoPuntos && !errorPuntos && !isAuthenticated && (
                            <div className="bg-blue-50 border-2 border-blue-400 rounded-xl p-2 text-center">
                              <p className="text-[10px] font-bold text-blue-700">
                                🔑 Iniciá sesión para acumular y canjear puntos
                              </p>
                            </div>
                          )}
                        </>
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

                      <textarea
                        placeholder="Aclaraciones..."
                        className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 p-3 rounded-xl font-bold text-[11px] h-16 resize-none outline-none focus:ring-2 focus:ring-[#FFCA28]/30 dark:focus:ring-[#FAD02C]/30 dark:text-white"
                        value={customer.notes}
                        onChange={(e) => setCustomer({ ...customer, notes: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* FOOTER - Solo mostrar si hay items y no está cargando */}
          {!isAuthLoading && items.length > 0 && (
            <div className="shrink-0 bg-white dark:bg-[#1a1a1a] border-t border-stone-100 dark:border-stone-800 px-4 sm:px-5 pt-3 pb-[max(env(safe-area-inset-bottom),12px)] shadow-[0_-10px_20px_rgba(0,0,0,0.02)] dark:shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
              <div className="space-y-1.5 mb-3">
                <div className="flex justify-between items-center text-stone-400 dark:text-stone-500 font-bold text-[10px] uppercase tracking-tighter">
                  <span>Subtotal</span>
                  <span>${subtotal.toLocaleString('es-AR')}</span>
                </div>
                {items.length > 0 && descuentoNivelAplicado > 0 && (
                  <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-bold text-[10px] uppercase tracking-tighter">
                    <span>🎯 Descuento {nivel?.nombre}</span>
                    <span>-${descuentoNivelAplicado.toLocaleString('es-AR')}</span>
                  </div>
                )}
                {items.length > 0 && puntosAUsar > 0 && (
                  <div className="flex justify-between items-center text-[#FAD02C] font-bold text-[10px] uppercase tracking-tighter">
                    <span>⭐ Puntos</span>
                    <span>-${descuentoPorPuntos.toLocaleString('es-AR')}</span>
                  </div>
                )}
                {items.length > 0 && (
                  <div className="flex justify-between items-center text-stone-400 dark:text-stone-500 font-bold text-[10px] uppercase tracking-tighter">
                    <span>Envío</span>
                    <span>
                      {customer.tipoEntrega === 'Retiro'
                        ? 'N/A'
                        : envioGratisAplicado
                          ? '🎁 ¡GRATIS!'
                          : costoEnvio === null
                            ? '📍 Seleccioná ubicación'
                            : costoEnvio === 0
                              ? '¡GRATIS!'
                              : `$${costoEnvio.toLocaleString('es-AR')}`}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-end pt-1.5 gap-2 border-t border-stone-100 dark:border-stone-700">
                  <span className="font-black text-stone-900 dark:text-white uppercase tracking-tighter text-xs">
                    Total
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-stone-950 dark:text-[#FAD02C] tracking-tighter text-right wrap-break-words">
                    ${montoTotalFinal.toLocaleString('es-AR')}
                  </span>
                </div>

                {/* ✅ SECCIÓN ACTUALIZADA - PUNTOS QUE SUMÁS */}
                {items.length > 0 && perfil && (
                  <div className="flex justify-end items-center gap-1.5 mt-0.5">
                    <span className="text-[8px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                      ⭐ Sumás con esta compra
                    </span>
                    <span className="text-[10px] font-black text-[#FAD02C]">
                      +{Math.floor(montoTotalFinal / 100)} pts
                    </span>
                  </div>
                )}

                {items.length > 0 && perfil && puntosAUsar > 0 && (
                  <div className="flex justify-end items-center gap-1.5 mt-0.5">
                    <span className="text-[8px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                      Puntos restantes
                    </span>
                    <span className="text-[10px] font-black text-stone-500">
                      {puntosDisponibles - puntosAUsar}
                    </span>
                  </div>
                )}
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
          )}
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