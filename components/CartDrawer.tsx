// components/CartDrawer.tsx - VERSIÓN COMPLETA CON SINCRONIZACIÓN DE CARRITO
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

declare global {
  interface Window {
    __whatsappInterval?: NodeJS.Timeout;
  }
}

// ============================================================
// 📌 CONSTANTES
// ============================================================

const ALIAS_TRANSFERENCIA = "krustyburger2025";
const DIRECCION_LOCAL = "CALLE 853 N° 1149, VILLA LA FLORIDA";
const MINIMO_ENVIO_GRATIS = 19000;

// ============================================================
// 📌 INTERFACES
// ============================================================

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

// ============================================================
// 📌 COMPONENTE PRINCIPAL
// ============================================================

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const router = useRouter();
  const { isLoaded, loadError } = useGoogleMaps();
  const [mounted, setMounted] = useState(false);

  // ============================================================
  // 🛒 STORE DEL CARRITO
  // ============================================================

  const { items, total, clearCart, addItem, decreaseQuantity, setItems, mergeItems } = useCartStore();
  const [forceUpdate, setForceUpdate] = useState(0);

  // ============================================================
  // 🔐 AUTH STORE
  // ============================================================

  const {
    user,
    perfil,
    actualizarPerfil,
    isAuthenticated,
    isLoading,
    forzarActualizacion,
  } = useAuthStore();

  // ============================================================
  // 🎯 REFs PARA CONTROLAR EJECUCIÓN
  // ============================================================

  const yaInicializado = useRef(false);
  const yaCargadoPuntos = useRef(false);
  const ultimoUserId = useRef<string | null>(null);
  const yaSincronizadoCarrito = useRef(false);

  // ============================================================
  // 💰 ESTADO DE PUNTOS
  // ============================================================

  const [puntosAUsar, setPuntosAUsar] = useState(0);
  const [descuentoPorPuntos, setDescuentoPorPuntos] = useState(0);
  const [mostrarSelectorPuntos, setMostrarSelectorPuntos] = useState(false);
  const [puntosDisponibles, setPuntosDisponibles] = useState(0);
  const [cargandoPuntos, setCargandoPuntos] = useState(false);
  const [errorPuntos, setErrorPuntos] = useState<string | null>(null);

  // ============================================================
  // 📦 ESTADO PARA MODAL DE WHATSAPP
  // ============================================================

  const [mostrarModalWhatsApp, setMostrarModalWhatsApp] = useState(false);
  const [mpUrl, setMpUrl] = useState('');
  const [mensajeWhatsApp, setMensajeWhatsApp] = useState('');
  const [numeroTelefonoWhatsApp, setNumeroTelefonoWhatsApp] = useState('');

  // ============================================================
  // 📦 FUNCIÓN: CARGAR PUNTOS
  // ============================================================

  const cargarPuntosDelUsuario = useCallback(
    async (forzarRecarga = false) => {
      const userId = user?.id;

      if (!userId) {
        return;
      }

      if (!forzarRecarga && yaCargadoPuntos.current && ultimoUserId.current === userId) {
        return;
      }

      setCargandoPuntos(true);
      setErrorPuntos(null);

      try {
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
          setPuntosDisponibles(data.puntos_disponibles || 0);
          yaCargadoPuntos.current = true;
          ultimoUserId.current = userId;

          if (perfil && perfil.puntos_disponibles !== data.puntos_disponibles) {
            const perfilActualizado = { ...perfil, ...data };
            await actualizarPerfil(perfilActualizado);
          }
        }
      } catch (error) {
        console.error('❌ [CARRITO] Error inesperado:', error);
        setErrorPuntos('Error inesperado al cargar puntos');
        setPuntosDisponibles(0);
      } finally {
        setCargandoPuntos(false);
      }
    },
    [user?.id, perfil, actualizarPerfil]
  );

  // ============================================================
  // 📦 FUNCIÓN: GUARDAR CARRITO EN DB
  // ============================================================

  const guardarCarritoEnDB = useCallback(async (userId: string, itemsCarrito: any[]) => {
    try {
      if (!userId || itemsCarrito.length === 0) {
        return;
      }

      const { error } = await supabase
        .from('carritos')
        .upsert({
          usuario_id: userId,
          items: itemsCarrito,
          updated_at: new Date().toISOString()
        }, { onConflict: 'usuario_id' });

      if (error) {
        console.error('❌ [CARRITO] Error guardando carrito:', error);
      }
    } catch (error) {
      console.error('❌ [CARRITO] Error en guardarCarritoEnDB:', error);
    }
  }, []);

  // ============================================================
  // 📦 FUNCIÓN: CARGAR CARRITO DESDE DB
  // ============================================================

  const cargarCarritoDesdeDB = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('carritos')
        .select('items')
        .eq('usuario_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('❌ [CARRITO] Error cargando carrito:', error);
        return null;
      }

      if (data?.items && data.items.length > 0) {
        return data.items;
      }

      return null;
    } catch (error) {
      console.error('❌ [CARRITO] Error en cargarCarritoDesdeDB:', error);
      return null;
    }
  }, []);

  // ============================================================
  // 📦 FUNCIÓN: SINCRONIZAR CARRITO AL INICIAR SESIÓN
  // ============================================================

  const sincronizarCarritoConDB = useCallback(async (userId: string) => {
    try {
      if (!userId) {
        return;
      }

      if (yaSincronizadoCarrito.current && ultimoUserId.current === userId) {
        return;
      }

      const carritoLocal = items;
      const tieneItemsLocales = carritoLocal.length > 0;

      const carritoDB = await cargarCarritoDesdeDB(userId);

      if (carritoDB && carritoDB.length > 0 && tieneItemsLocales) {
        mergeItems(carritoDB);
        yaSincronizadoCarrito.current = true;
        ultimoUserId.current = userId;

        const itemsFusionados = useCartStore.getState().items;
        await guardarCarritoEnDB(userId, itemsFusionados);

      } else if (carritoDB && carritoDB.length > 0) {
        setItems(carritoDB);
        yaSincronizadoCarrito.current = true;
        ultimoUserId.current = userId;

      } else if (tieneItemsLocales) {
        await guardarCarritoEnDB(userId, carritoLocal);
        yaSincronizadoCarrito.current = true;
        ultimoUserId.current = userId;

      } else {
        yaSincronizadoCarrito.current = true;
        ultimoUserId.current = userId;
      }

      setForceUpdate(prev => prev + 1);

    } catch (error) {
      console.error('❌ [CARRITO] Error en sincronizarCarritoConDB:', error);
    }
  }, [items, cargarCarritoDesdeDB, guardarCarritoEnDB, setItems, mergeItems]);

  // ============================================================
  // 🔄 EFFECT: INICIALIZAR AUTENTICACIÓN Y SINCRONIZAR CARRITO
  // ============================================================

  useEffect(() => {
    if (yaInicializado.current) return;
    yaInicializado.current = true;

    const verificarYForzarAuth = async () => {
      try {
        const { data: { session: supabaseSession } } = await supabase.auth.getSession();

        if (supabaseSession?.user) {
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

          if (perfilData && forzarActualizacion) {
            forzarActualizacion({
              user: supabaseSession.user,
              perfil: perfilData,
              session: supabaseSession,
            });
            setPuntosDisponibles(perfilData.puntos_disponibles || 0);
            yaCargadoPuntos.current = true;
            ultimoUserId.current = supabaseSession.user.id;

            await sincronizarCarritoConDB(supabaseSession.user.id);
          }
        }
      } catch (error) {
        console.error('❌ [FIX] Error:', error);
        setErrorPuntos('Error al verificar autenticación');
      }
    };

    verificarYForzarAuth();
  }, [forzarActualizacion, sincronizarCarritoConDB]);

  // ============================================================
  // 🔄 EFFECT: GUARDAR CARRITO EN DB CUANDO CAMBIA
  // ============================================================

  useEffect(() => {
    if (isAuthenticated && user?.id && items.length > 0) {
      const timeoutId = setTimeout(() => {
        guardarCarritoEnDB(user.id, items);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [items, isAuthenticated, user?.id, guardarCarritoEnDB]);

  // ============================================================
  // 🔄 EFFECT: RECARGAR PUNTOS AL ABRIR CARRITO
  // ============================================================

  useEffect(() => {
    if (isOpen && isAuthenticated && user?.id) {
      if (ultimoUserId.current !== user.id || !yaCargadoPuntos.current) {
        yaCargadoPuntos.current = false;
        cargarPuntosDelUsuario(true);
      }
    }
  }, [isOpen, isAuthenticated, user?.id, cargarPuntosDelUsuario]);

  // ============================================================
  // 🔄 EFFECT: LIMPIAR INTERVAL DE WHATSAPP
  // ============================================================

  useEffect(() => {
    return () => {
      if (window.__whatsappInterval) {
        clearInterval(window.__whatsappInterval);
      }
    };
  }, []);

  // ============================================================
  // 🎯 HOOK: BENEFICIOS
  // ============================================================

  const {
    nivel,
    beneficios,
    calcularDescuento,
    tieneEnvioGratis: tieneEnvioGratisBeneficio,
    descripcionBeneficios,
  } = useBeneficios(perfil?.puntos_acumulados || 0, user?.id);

  // ============================================================
  // 📦 ESTADO LOCAL DEL FORMULARIO
  // ============================================================

  const [isSending, setIsSending] = useState(false);
  const [montoEfectivo, setMontoEfectivo] = useState('');
  const [copied, setCopied] = useState(false);
  const [procesandoPagoMP, setProcesandoPagoMP] = useState(false);

  // ============================================================
  // 📍 ENVÍO Y UBICACIÓN
  // ============================================================

  const [calculandoEnvio, setCalculandoEnvio] = useState(false);
  const [resultadoEnvio, setResultadoEnvio] = useState<ResultadoEnvio | null>(null);
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState<{
    direccion: string;
    lat: number;
    lng: number;
  } | null>(null);

  // ============================================================
  // 👤 DATOS DEL CLIENTE
  // ============================================================

  const [customer, setCustomer] = useState({
    nombre: '',
    calleAltura: '',
    telefono: '',
    metodoPago: 'Efectivo',
    tipoEntrega: 'Delivery',
    notes: '',
  });

  // ============================================================
  // 🔄 EFFECT: CARGAR DATOS GUARDADOS
  // ============================================================

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('krusty-customer-v5');

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCustomer((prev) => ({
          ...prev,
          ...parsed,
          nombre: parsed.nombre || prev.nombre,
          telefono: parsed.telefono || prev.telefono,
        }));

        if (parsed.calleAltura) {
          setUbicacionSeleccionada({
            direccion: parsed.calleAltura,
            lat: 0,
            lng: 0,
          });
        }
      } catch (e) {
        console.error('Error al cargar datos guardados:', e);
      }
    }

    if (perfil) {
      setCustomer((prev) => ({
        ...prev,
        nombre: perfil.nombre_cliente || prev.nombre,
        telefono: perfil.telefono || prev.telefono,
      }));
    }
  }, [perfil]);

  // ============================================================
  // 🔄 EFFECT: SCROLL BODY
  // ============================================================

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // ============================================================
  // 📡 CÁLCULO DE ENVÍO
  // ============================================================

  useEffect(() => {
    const calcular = async () => {
      if (!ubicacionSeleccionada || customer.tipoEntrega !== 'Delivery') {
        setResultadoEnvio(null);
        return;
      }

      if (ubicacionSeleccionada.direccion.trim().length < 5) {
        setResultadoEnvio(null);
        return;
      }

      setCalculandoEnvio(true);

      try {
        const resultado = await calcularEnvio(ubicacionSeleccionada);
        setResultadoEnvio(resultado);
      } catch (error) {
        console.error('Error calculando envío:', error);
        setResultadoEnvio({
          disponible: false,
          precio: 0,
          distancia_km: 0,
          tiempo_minutos: 0,
          mensaje: 'Error al calcular la distancia del envío.',
        });
      } finally {
        setCalculandoEnvio(false);
      }
    };

    const timer = setTimeout(calcular, 600);
    return () => clearTimeout(timer);
  }, [ubicacionSeleccionada, customer.tipoEntrega]);

  // ============================================================
  // 🧮 CÁLCULOS PRINCIPALES
  // ============================================================

  const subtotal = total();

  const descuentoNivelAplicado = useMemo(() => {
    if (items.length === 0) return 0;
    if (!beneficios || beneficios.descuento === 0) return 0;
    return subtotal * (beneficios.descuento / 100);
  }, [subtotal, beneficios, items.length]);

  const envioGratisAplicado = useMemo(() => {
    return subtotal >= MINIMO_ENVIO_GRATIS;
  }, [subtotal]);

  const faltaParaEnvioGratis = useMemo(() => {
    if (subtotal >= MINIMO_ENVIO_GRATIS) return 0;
    return MINIMO_ENVIO_GRATIS - subtotal;
  }, [subtotal]);

  const progresoEnvioGratis = useMemo(() => {
    if (subtotal >= MINIMO_ENVIO_GRATIS) return 100;
    const porcentaje = (subtotal / MINIMO_ENVIO_GRATIS) * 100;
    return Math.min(porcentaje, 99);
  }, [subtotal]);

  const costoEnvio = useMemo(() => {
    if (customer.tipoEntrega === 'Retiro') return 0;
    if (subtotal >= MINIMO_ENVIO_GRATIS) return 0;
    if (resultadoEnvio?.disponible) return resultadoEnvio.precio;
    return null;
  }, [customer.tipoEntrega, resultadoEnvio, subtotal]);

  const totalConDescuentoNivel = useMemo(() => {
    const envio = costoEnvio === null ? 0 : costoEnvio;
    return Math.max(0, subtotal - descuentoNivelAplicado + envio);
  }, [subtotal, descuentoNivelAplicado, costoEnvio]);

  // ============================================================
  // 💰 FUNCIONES DE PUNTOS
  // ============================================================

  const calcularDescuentoPorPuntos = useCallback(
    (puntos: number) => {
      const descuento = puntos;
      const maxDescuento = totalConDescuentoNivel * 0.5;
      return Math.min(descuento, maxDescuento);
    },
    [totalConDescuentoNivel]
  );

  const handlePuntosChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const valor = parseInt(e.target.value) || 0;
      const maxPuntos = Math.min(valor, puntosDisponibles);
      setPuntosAUsar(maxPuntos);
      setDescuentoPorPuntos(calcularDescuentoPorPuntos(maxPuntos));
    },
    [puntosDisponibles, calcularDescuentoPorPuntos]
  );

  const usarTodosLosPuntos = useCallback(() => {
    const maxPuntos = Math.min(
      puntosDisponibles,
      Math.floor(totalConDescuentoNivel * 0.5)
    );
    setPuntosAUsar(maxPuntos);
    setDescuentoPorPuntos(calcularDescuentoPorPuntos(maxPuntos));
  }, [puntosDisponibles, totalConDescuentoNivel, calcularDescuentoPorPuntos]);

  const resetearPuntos = useCallback(() => {
    setPuntosAUsar(0);
    setDescuentoPorPuntos(0);
  }, []);

  // ============================================================
  // 🧮 MONTOS Y VALIDACIONES
  // ============================================================

  const montoTotalFinal = useMemo(() => {
    return Math.max(0, totalConDescuentoNivel - descuentoPorPuntos);
  }, [totalConDescuentoNivel, descuentoPorPuntos]);

  const vuelto = useMemo(() => {
    const paga = parseFloat(montoEfectivo);
    return !isNaN(paga) && paga > montoTotalFinal ? paga - montoTotalFinal : 0;
  }, [montoEfectivo, montoTotalFinal]);

  const isFormValid = useMemo(() => {
    const hasName = customer.nombre.trim().length >= 2;
    const hasValidPhone = /^[0-9]{8,16}$/.test(
      customer.telefono.replace(/\s/g, '')
    );

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
    resultadoEnvio,
  ]);

  // ============================================================
  // 📋 FUNCIONES DE INTERACCIÓN
  // ============================================================

  const handleCopyAlias = () => {
    navigator.clipboard.writeText(ALIAS_TRANSFERENCIA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLocationSelect = useCallback(
    (direccion: string, lat: number, lng: number) => {
      setUbicacionSeleccionada({ direccion, lat, lng });
      setCustomer((prev) => ({ ...prev, calleAltura: direccion }));
    },
    []
  );

  // ============================================================
  // 💳 FUNCIONES DE PAGO
  // ============================================================

  const handlePagarConMP = async () => {
    if (!isFormValid) {
      alert('🤡 ¡Completá tus datos y verificá la ubicación de entrega!');
      return;
    }

    setProcesandoPagoMP(true);

    try {
      localStorage.setItem('krusty-customer-v5', JSON.stringify(customer));
      localStorage.setItem('krusty_user_telefono', customer.telefono);

      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || null;

      const direccionCompleta =
        customer.tipoEntrega === 'Delivery'
          ? customer.calleAltura.toUpperCase()
          : `🏠 RETIRO POR LOCAL (${DIRECCION_LOCAL})`;

      const itemsResumenDB = items.map((i) => `${i.quantity}x ${i.nombre}`).join(', ');

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

      // ============================================================
      // ✅ GENERAR MENSAJE DE WHATSAPP
      // ============================================================

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
        `💳 *PAGO:* Mercado Pago\n` +
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
        `🟡 *ESTADO:* ⏳ Pago pendiente (Mercado Pago)\n` +
        `🔔 *El pedido se confirmará automáticamente al pagar*\n\n` +
        `🤡 _¡Gracias por elegir al payaso!_`
      );

      // ============================================================
      // ✅ CREAR PREFERENCIA DE MERCADO PAGO
      // ============================================================

      const response = await fetch('/api/mercadopago/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: pedidoGuardado.id,
          items: items.map((item) => ({
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

      // ============================================================
      // ✅ MOSTRAR MODAL DE WHATSAPP
      // ============================================================

      if (typeof window !== 'undefined' && data.init_point) {
        setMpUrl(data.init_point);
        setMensajeWhatsApp(mensaje);
        setNumeroTelefonoWhatsApp(numeroTelefono);
        setMostrarModalWhatsApp(true);
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
      alert('🤡 ¡Krusty dice que faltan datos o tu ubicación no tiene cobertura!');
      return;
    }

    setIsSending(true);

    try {
      localStorage.setItem('krusty-customer-v5', JSON.stringify(customer));
      localStorage.setItem('krusty_user_telefono', customer.telefono);

      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || null;

      const direccionCompleta =
        customer.tipoEntrega === 'Delivery'
          ? customer.calleAltura.toUpperCase()
          : `🏠 RETIRO POR LOCAL (${DIRECCION_LOCAL})`;

      let detallePago = customer.metodoPago;

      if (customer.metodoPago === 'Efectivo') {
        detallePago = `Efectivo (Paga con: $${montoEfectivo || montoTotalFinal}${vuelto > 0 ? ` | Vuelto: $${vuelto}` : ' - Justo'
          })`;
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
        (descuentoNivelAplicado > 0
          ? `🎯 *DESCUENTO ${nivel?.nombre?.toUpperCase()}:* ${descuentoNivelAplicado}% (${nivel?.icono || '⭐'})\n`
          : '') +
        (envioGratisAplicado
          ? `🆓 *ENVÍO GRATIS* (${subtotal >= MINIMO_ENVIO_GRATIS
            ? 'por superar $19.000'
            : `Beneficio ${nivel?.nombre || ''}`
          })\n`
          : '') +
        (puntosAUsar > 0
          ? `⭐ *PUNTOS USADOS:* ${puntosAUsar} pts (-$${descuentoPorPuntos.toLocaleString(
            'es-AR'
          )})\n`
          : '') +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        items
          .map((item) => {
            const extrasMsj = item.extrasElegidos?.length
              ? item.extrasElegidos.map((e) => `\n   └ + ${e.nombre}`).join('')
              : '';
            return (
              `🍔 *${item.quantity}x* ${item.nombre.toUpperCase()}${extrasMsj}\n` +
              `💰 Subtotal: $${(item.precioUnitarioTotal * item.quantity).toLocaleString(
                'es-AR'
              )}`
            );
          })
          .join('\n\n') +
        `\n\n━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `💵 *SUBTOTAL:* $${subtotal.toLocaleString('es-AR')}\n` +
        (descuentoNivelAplicado > 0
          ? `🎯 *DESCUENTO:* -$${descuentoNivelAplicado.toLocaleString('es-AR')}\n`
          : '') +
        (puntosAUsar > 0
          ? `⭐ *PUNTOS:* -$${descuentoPorPuntos.toLocaleString('es-AR')}\n`
          : '') +
        `🛵 *ENVÍO:* ${customer.tipoEntrega === 'Retiro'
          ? 'N/A'
          : envioGratisAplicado
            ? 'GRATIS 🎁'
            : costoEnvio === null
              ? '📍 Seleccioná ubicación'
              : costoEnvio === 0
                ? 'GRATIS'
                : `$${costoEnvio.toLocaleString('es-AR')}`
        }\n` +
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

  // ============================================================
  // 🎨 RENDER
  // ============================================================

  if (!mounted) return null;

  const isAuthLoading = isLoading && !isAuthenticated;

  return (
    <>
      {/* OVERLAY */}
      <div
        className={`fixed inset-0 bg-stone-900/40 dark:bg-black/70 z-60 backdrop-blur-md transition-all duration-500 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
          }`}
        onClick={onClose}
      />

      {/* DRAWER */}
      <div
        className={`fixed inset-y-0 right-0 z-70 bg-white dark:bg-[#1a1a1a] shadow-2xl transform transition-transform duration-500 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
          } w-full sm:max-w-105 lg:max-w-100 xl:max-w-100`}
      >
        <div className="flex flex-col h-dvh max-h-dvh bg-white dark:bg-[#1a1a1a] overflow-hidden">
          {/* HEADER */}
          <div className="shrink-0 bg-white dark:bg-[#1a1a1a] border-b border-stone-100 dark:border-stone-800 px-4 sm:px-5 pt-4 pb-4">
            <div className="flex justify-between items-start gap-2">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-stone-900 dark:text-[#FAD02C] tracking-tighter uppercase leading-none">
                  🛒 Tu Pedido
                </h2>
                <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mt-1">
                  {isAuthLoading
                    ? 'Cargando...'
                    : `${items.length} ${items.length === 1 ? 'producto' : 'productos'}`}
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
                  <div className="w-8 h-8 border-2 border-[#FAD02C] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="mt-3 text-stone-400 font-bold text-[10px]">
                    Cargando tu información...
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* BENEFICIOS */}
                {perfil && beneficios && nivel && (
                  <div className="bg-[#FAD02C]/10 border border-[#FAD02C]/20 rounded-xl p-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#FAD02C]/20 flex items-center justify-center text-xl shrink-0">
                        {nivel.icono || '⭐'}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-black uppercase text-stone-700 dark:text-stone-300">
                            {nivel.nombre}
                          </p>
                          {beneficios.descuento > 0 && (
                            <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-500/20 px-2 py-0.5 rounded-full">
                              {beneficios.descuento}% OFF
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-stone-500 dark:text-stone-400 leading-tight">
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

                    {(descuentoNivelAplicado > 0 ||
                      envioGratisAplicado ||
                      puntosAUsar > 0) && (
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

                {/* LISTA DE PRODUCTOS */}
                <div className="space-y-3">
                  {items.length === 0 ? (
                    <button
                      onClick={() => {
                        onClose();
                        setTimeout(() => router.push('/'), 300);
                      }}
                      className="w-full text-center py-12 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border-2 border-dashed border-stone-200 dark:border-stone-700 hover:border-[#FAD02C] hover:bg-stone-100 dark:hover:bg-stone-800 transition-all duration-300 cursor-pointer group"
                    >
                      <span className="text-4xl block mb-3 group-hover:scale-110 transition-transform duration-300">
                        🍔
                      </span>
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
                            (e.target as HTMLImageElement).src =
                              '/images/placeholder-burger.jpg';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-[11px] uppercase truncate text-stone-900 dark:text-white">
                            {item.nombre}
                          </h4>
                          {item.extrasElegidos?.length > 0 && (
                            <p className="text-[9px] text-stone-400 truncate">
                              +{item.extrasElegidos.map((e) => e.nombre).join(', ')}
                            </p>
                          )}
                          <p className="font-black text-[#D32F2F] text-[11px] mt-0.5">
                            ${(item.precioUnitarioTotal * item.quantity).toLocaleString('es-AR')}
                          </p>
                        </div>
                        <div className="flex items-center bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              decreaseQuantity(item.cartId);
                              setForceUpdate(prev => prev + 1);
                            }}
                            className="w-6 h-6 flex items-center justify-center font-bold text-stone-500 hover:text-red-500 transition-colors text-xs"
                          >
                            –
                          </button>
                          <span className="px-1.5 font-black text-xs dark:text-white min-w-4.5 text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              addItem(item, item.extrasElegidos);
                              setForceUpdate(prev => prev + 1);
                            }}
                            className="w-6 h-6 flex items-center justify-center font-bold text-stone-500 hover:text-emerald-500 transition-colors text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* PROGRESO ENVÍO GRATIS */}
                {items.length > 0 &&
                  customer.tipoEntrega === 'Delivery' &&
                  !envioGratisAplicado && (
                    <div className="bg-linear-to-r from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🚚</span>
                          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                            Agregá{' '}
                            <span className="text-[#FAD02C] dark:text-[#FAD02C]">
                              ${faltaParaEnvioGratis.toLocaleString('es-AR')}
                            </span>{' '}
                            más
                          </span>
                        </div>
                        <span className="text-[10px] font-black text-blue-600 dark:text-blue-400">
                          {Math.round(progresoEnvioGratis)}%
                        </span>
                      </div>

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

                {/* MENSAJE DE ÉXITO - ENVÍO GRATIS */}
                {items.length > 0 &&
                  customer.tipoEntrega === 'Delivery' &&
                  envioGratisAplicado && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-300 dark:border-emerald-700 rounded-xl p-3 text-center">
                      <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        🎉 ¡ENVÍO GRATIS! Superaste los $
                        {MINIMO_ENVIO_GRATIS.toLocaleString('es-AR')}
                      </p>
                    </div>
                  )}

                {/* FORMULARIO */}
                {items.length > 0 && (
                  <div className="space-y-4 border-t border-stone-100 dark:border-stone-800 pt-4">
                    {/* TIPO DE ENTREGA */}
                    <div className="flex p-0.5 bg-stone-100 dark:bg-stone-800 rounded-xl">
                      {['Delivery', 'Retiro'].map((tipo) => (
                        <button
                          type="button"
                          key={tipo}
                          onClick={() =>
                            setCustomer({
                              ...customer,
                              tipoEntrega: tipo as 'Delivery' | 'Retiro',
                            })
                          }
                          className={`flex-1 py-2 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all ${customer.tipoEntrega === tipo
                            ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-sm'
                            : 'text-stone-400'
                            }`}
                        >
                          {tipo === 'Delivery' ? '🛵' : '🏠'}
                          <span className="ml-1">{tipo}</span>
                        </button>
                      ))}
                    </div>

                    {/* DATOS DEL CLIENTE */}
                    <div className="space-y-2.5">
                      <input
                        type="text"
                        placeholder="NOMBRE"
                        className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 p-3 rounded-xl font-bold uppercase text-[11px] outline-none dark:text-white focus:ring-2 focus:ring-[#D32F2F]/30"
                        value={customer.nombre}
                        onChange={(e) =>
                          setCustomer({ ...customer, nombre: e.target.value })
                        }
                      />

                      <input
                        type="tel"
                        placeholder="TELÉFONO"
                        className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700 p-3 rounded-xl font-bold text-[11px] outline-none dark:text-white focus:ring-2 focus:ring-[#D32F2F]/30"
                        value={customer.telefono}
                        onChange={(e) =>
                          setCustomer({
                            ...customer,
                            telefono: e.target.value.replace(/\D/g, ''),
                          })
                        }
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

                          {ubicacionSeleccionada && (
                            <div className="bg-stone-50 dark:bg-stone-800 p-3 rounded-xl border border-stone-100 dark:border-stone-700">
                              {calculandoEnvio ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-3.5 h-3.5 border-2 border-[#D32F2F] border-t-transparent rounded-full animate-spin" />
                                  <span className="text-[10px] font-bold text-stone-400">
                                    Calculando...
                                  </span>
                                </div>
                              ) : resultadoEnvio?.disponible ? (
                                <div className="space-y-0.5">
                                  <div className="flex justify-between text-[10px] font-bold text-stone-500">
                                    <span>{resultadoEnvio.distancia_km} km</span>
                                    <span>~{resultadoEnvio.tiempo_minutos} min</span>
                                  </div>
                                  <div className="flex justify-between text-[11px] font-black text-emerald-600 dark:text-emerald-400 pt-1 border-t border-stone-200 dark:border-stone-700">
                                    <span>Envío:</span>
                                    <span>
                                      {envioGratisAplicado
                                        ? 'GRATIS 🎁'
                                        : resultadoEnvio.precio === 0
                                          ? 'GRATIS'
                                          : `$${resultadoEnvio.precio.toLocaleString('es-AR')}`}
                                    </span>
                                  </div>
                                </div>
                              ) : resultadoEnvio?.disponible === false ? (
                                <p className="text-[10px] font-bold text-red-500">
                                  {resultadoEnvio.mensaje}
                                </p>
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
                              <p className="text-[10px] font-bold text-blue-600">
                                ⏳ Cargando tus puntos...
                              </p>
                            </div>
                          )}

                          {!cargandoPuntos && errorPuntos && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                              <p className="text-[10px] font-bold text-red-600">
                                ❌ {errorPuntos}
                              </p>
                            </div>
                          )}

                          {!cargandoPuntos &&
                            !errorPuntos &&
                            isAuthenticated &&
                            puntosDisponibles > 0 && (
                              <div className="bg-[#FAD02C]/5 border-2 border-[#FAD02C]/30 rounded-xl p-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">⭐</span>
                                    <span className="text-xs font-black uppercase text-stone-500">
                                      Puntos disponibles:{' '}
                                      <span className="text-[#FAD02C] text-sm">
                                        {puntosDisponibles}
                                      </span>
                                    </span>
                                  </div>
                                  <button
                                    onClick={() =>
                                      setMostrarSelectorPuntos(
                                        !mostrarSelectorPuntos
                                      )
                                    }
                                    className="text-xs font-black text-[#D32F2F] hover:text-black transition-colors px-3 py-1 rounded-full bg-[#D32F2F]/10 hover:bg-[#D32F2F]/20"
                                  >
                                    {mostrarSelectorPuntos
                                      ? '✕ Ocultar'
                                      : '🎯 Usar puntos'}
                                  </button>
                                </div>

                                {mostrarSelectorPuntos && (
                                  <div className="mt-3 space-y-2 bg-white dark:bg-stone-800 p-3 rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-stone-400">
                                        ⭐
                                      </span>
                                      <input
                                        type="number"
                                        min="0"
                                        max={Math.min(
                                          puntosDisponibles,
                                          Math.floor(totalConDescuentoNivel * 0.5)
                                        )}
                                        value={puntosAUsar || ''}
                                        onChange={handlePuntosChange}
                                        placeholder="0"
                                        className="w-24 bg-stone-50 dark:bg-stone-700 border-2 border-stone-200 dark:border-stone-600 p-2 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-[#FAD02C]/30 dark:text-white"
                                      />
                                      <span className="text-xs font-bold text-stone-400">
                                        pts
                                      </span>
                                      <span className="text-xs font-bold text-[#FAD02C] ml-1">
                                        = -$
                                        {descuentoPorPuntos.toLocaleString('es-AR')}
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
                                      💡 Máximo 50% del total (
                                      {Math.floor(totalConDescuentoNivel * 0.5).toLocaleString(
                                        'es-AR'
                                      )}{' '}
                                      pts = -$
                                      {(totalConDescuentoNivel * 0.5).toLocaleString(
                                        'es-AR'
                                      )}
                                      )
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}

                          {!cargandoPuntos &&
                            !errorPuntos &&
                            isAuthenticated &&
                            puntosDisponibles === 0 && (
                              <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-2 text-center">
                                <p className="text-[10px] font-bold text-yellow-700">
                                  ⚠️ No tienes puntos disponibles para canjear
                                  {perfil?.puntos_acumulados &&
                                    perfil.puntos_acumulados > 0 &&
                                    ` (acumulados: ${perfil.puntos_acumulados})`}
                                </p>
                              </div>
                            )}

                          {!cargandoPuntos &&
                            !errorPuntos &&
                            !isAuthenticated && (
                              <button
                                onClick={() => {
                                  // ✅ Guardar en localStorage que el carrito estaba abierto
                                  localStorage.setItem('krusty-carrito-abierto', 'true');

                                  // Cerrar el carrito y redirigir al login
                                  onClose();
                                  setTimeout(() => {
                                    router.push('/login');
                                  }, 300);
                                }}
                                className="w-full bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-950/50 border-2 border-blue-400 hover:border-blue-500 rounded-xl p-2 text-center transition-all duration-300 cursor-pointer group"
                              >
                                <p className="text-[10px] font-bold text-blue-700 dark:text-blue-400 group-hover:text-blue-800 dark:group-hover:text-blue-300">
                                  🔑 Iniciá sesión para acumular y canjear puntos
                                </p>
                                <p className="text-[8px] font-bold text-blue-400/70 dark:text-blue-500/70 mt-0.5 group-hover:text-blue-500 transition-colors">
                                  👆 Tocá para iniciar sesión
                                </p>
                              </button>
                            )}
                        </>
                      )}

                      {/* MÉTODOS DE PAGO */}
                      <div className="space-y-2 pt-1">
                        <p className="text-[12px] font-black uppercase text-stone-400 tracking-wider">
                          Metodo de Pago
                        </p>

                        <div className="grid grid-cols-3 gap-1.5">
                          {['Efectivo', 'Transferencia', 'Mercado Pago'].map(
                            (pago) => (
                              <button
                                type="button"
                                key={pago}
                                onClick={() =>
                                  setCustomer({ ...customer, metodoPago: pago })
                                }
                                className={`py-2 rounded-xl border font-black text-[8px] uppercase transition-all ${customer.metodoPago === pago
                                  ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 border-stone-900 dark:border-white shadow-sm'
                                  : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-400 hover:border-stone-300'
                                  }`}
                              >
                                {pago}
                              </button>
                            )
                          )}
                        </div>

                        {/* EFECTIVO */}
                        {customer.metodoPago === 'Efectivo' && (
                          <div className="pt-1">
                            <label className="text-[12px] font-black uppercase text-stone-400 dark:text-stone-500 tracking-wider block mb-1.5">
                              💵 ¿Con cuánto pagás?
                            </label>
                            <input
                              type="number"
                              placeholder={`Mínimo: $${montoTotalFinal.toLocaleString(
                                'es-AR'
                              )}`}
                              className={`w-full bg-stone-50 dark:bg-stone-800 border p-2.5 rounded-xl font-bold text-[12px] outline-none dark:text-white transition-all ${montoEfectivo &&
                                parseFloat(montoEfectivo) < montoTotalFinal
                                ? 'border-red-500 focus:ring-2 focus:ring-red-500/30'
                                : 'border-stone-100 dark:border-stone-700 focus:ring-2 focus:ring-[#D32F2F]/30'
                                }`}
                              value={montoEfectivo}
                              onChange={(e) => setMontoEfectivo(e.target.value)}
                            />
                            {montoEfectivo &&
                              parseFloat(montoEfectivo) < montoTotalFinal && (
                                <p className="text-[12px] font-black text-red-500 mt-0.5 px-2">
                                  ⚠️ Monto insuficiente
                                </p>
                              )}
                            {vuelto > 0 && (
                              <p className="text-[12px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 px-1">
                                💵 Vuelto: ${vuelto.toLocaleString('es-AR')}
                              </p>
                            )}
                          </div>
                        )}

                        {/* TRANSFERENCIA */}
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
                        onChange={(e) =>
                          setCustomer({ ...customer, notes: e.target.value })
                        }
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* FOOTER */}
          {!isAuthLoading && items.length > 0 && (
            <div className="shrink-0 bg-white dark:bg-[#1a1a1a] border-t border-stone-100 dark:border-stone-800 px-4 sm:px-5 pt-3 pb-[max(env(safe-area-inset-bottom),12px)] shadow-[0_-10px_20px_rgba(0,0,0,0.02)] dark:shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
              <div className="space-y-1.5 mb-3">
                <div className="flex justify-between items-center text-stone-400 dark:text-stone-500 font-bold text-[12px] uppercase tracking-tighter">
                  <span>Subtotal</span>
                  <span>${subtotal.toLocaleString('es-AR')}</span>
                </div>

                {descuentoNivelAplicado > 0 && (
                  <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-bold text-[12px] uppercase tracking-tighter">
                    <span>🎯 Descuento {nivel?.nombre}</span>
                    <span>-${descuentoNivelAplicado.toLocaleString('es-AR')}</span>
                  </div>
                )}

                {puntosAUsar > 0 && (
                  <div className="flex justify-between items-center text-[#FAD02C] font-bold text-[12px] uppercase tracking-tighter">
                    <span>⭐ Puntos</span>
                    <span>-${descuentoPorPuntos.toLocaleString('es-AR')}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-stone-400 dark:text-stone-500 font-bold text-[12px] uppercase tracking-tighter">
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

                <div className="flex justify-between items-end pt-1.5 gap-2 border-t border-stone-100 dark:border-stone-700">
                  <span className="font-black text-stone-900 dark:text-white uppercase tracking-tighter text-xs">
                    Total
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-stone-950 dark:text-[#f6fa2c] tracking-tighter text-right wrap-break-words">
                    ${montoTotalFinal.toLocaleString('es-AR')}
                  </span>
                </div>

                {perfil && (
                  <div className="flex justify-end items-center gap-1.5 mt-0.5">
                    <span className="text-[12px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                      ⭐ Sumás con esta compra
                    </span>
                    <span className="text-[14px] font-black text-[#b7c404]">
                      +{Math.floor(montoTotalFinal / 100)} pts
                    </span>
                  </div>
                )}

                {puntosAUsar > 0 && perfil && (
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
                disabled={
                  items.length === 0 || isSending || procesandoPagoMP || !isFormValid
                }
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
                    ? customer.metodoPago === 'Efectivo' &&
                      (!montoEfectivo || parseFloat(montoEfectivo) < montoTotalFinal)
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

      {/* MODAL DE WHATSAPP */}
      {mostrarModalWhatsApp && (
        <div className="fixed inset-0 bg-black/70 z-9999 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 max-w-md w-full shadow-2xl border-2 border-[#25D366] max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-4">
              <div className="text-5xl mb-3">📱</div>
              <h3 className="text-xl font-black text-stone-900 dark:text-white">
                ¡Pedido guardado!
              </h3>
              <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                Tu pedido está pendiente de pago.
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4">
              <p className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-2">
                📋 Pasos para completar tu pedido:
              </p>
              <ol className="text-xs text-blue-700 dark:text-blue-400 space-y-2 list-decimal list-inside">
                <li>
                  <span className="font-bold">Paso 1:</span> Tocá el botón{' '}
                  <span className="font-bold text-[#25D366]">📲 WhatsApp</span> y enviá el mensaje
                </li>
                <li>
                  <span className="font-bold">Paso 2:</span> Volvé a esta pantalla y tocá{' '}
                  <span className="font-bold text-[#009EE3]">💳 Mercado Pago</span>
                </li>
                <li>
                  <span className="font-bold">Paso 3:</span> Realizá el pago en Mercado Pago
                </li>
              </ol>
            </div>

            <button
              onClick={() => {
                window.open(
                  `https://wa.me/${numeroTelefonoWhatsApp}?text=${mensajeWhatsApp}`,
                  '_blank'
                );
              }}
              className="w-full bg-[#25D366] text-white py-3.5 rounded-xl font-black text-sm hover:bg-[#1da851] transition-colors mb-2 flex items-center justify-center gap-2"
            >
              <span className="text-xl">📲</span>
              Abrir WhatsApp (enviar mensaje)
            </button>

            <button
              onClick={() => {
                setMostrarModalWhatsApp(false);
                clearCart();
                onClose();
                window.location.href = mpUrl;
              }}
              className="w-full bg-[#009EE3] text-white py-3.5 rounded-xl font-black text-sm hover:bg-[#0083c4] transition-colors mb-2 flex items-center justify-center gap-2"
            >
              <span className="text-xl">💳</span>
              Ir a Mercado Pago (pagar)
            </button>

            <button
              onClick={() => {
                setMostrarModalWhatsApp(false);
              }}
              className="w-full bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-400 py-3 rounded-xl font-black text-sm hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors"
            >
              ✕ Cerrar
            </button>

            <p className="text-[9px] text-stone-400 dark:text-stone-500 text-center mt-3">
              💡 Recordá enviar el mensaje por WhatsApp antes de pagar
            </p>
          </div>
        </div>
      )}

      {/* ESTILOS GLOBALES */}
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
            
            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: scale(0.95);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }
            .animate-fadeIn {
              animation: fadeIn 0.3s ease-out;
            }
          `,
        }}
      />
    </>
  );
}