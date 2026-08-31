"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import AdminHeader from '../../components/AdminHeader';
import TabPedidos from '../../components/TabPedidos';
import TabProductos from '../../components/TabProductos';
import TabAdicionales from '../../components/TabAdicionales';
import Link from 'next/link';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'pedidos' | 'productos' | 'adicionales' | 'recompensas'>('pedidos');
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRol, setUserRol] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('🔍 1. Obteniendo sesión...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('❌ Error obteniendo sesión:', sessionError);
        }

        const email = session?.user?.email ?? null;
        setUserEmail(email);
        console.log('🔍 2. Sesión obtenida:', email || 'No hay sesión');

        if (!session || !email) {
          console.log('❌ 3. No hay sesión o email, redirigiendo...');
          router.push('/admin/login');
          return;
        }

        console.log('🔍 4. Verificando permisos para:', email);

        // ✅ VERIFICAR EN LA TABLA perfiles SI EL ROL ES 'admin'
        const { data: perfil, error: perfilError } = await supabase
          .from('perfiles')
          .select('rol')
          .eq('email', email.trim())
          .maybeSingle();

        if (perfilError) {
          console.error('❌ Error consultando perfil:', perfilError);
        }

        console.log('🔍 4a. Resultado de perfiles:', perfil);

        // ✅ Si tiene rol 'admin' en perfiles, es administrador
        if (perfil && perfil.rol === 'admin') {
          setUserRol(perfil.rol);
          console.log('✅ Es administrador (rol en perfiles)');
          setLoading(false);
          return;
        }

        // ❌ Si no es admin, cerrar sesión y redirigir
        console.log('❌ 5. No es administrador, cerrando sesión...');
        await supabase.auth.signOut();
        router.push('/admin/login');

      } catch (error) {
        console.error('❌ Error en verificación:', error);
        router.push('/admin/login');
      }
    };

    checkAuth();
  }, [router]);

  // ✅ Cargar el contenido de la pestaña seleccionada
  const renderContent = () => {
    switch (activeTab) {
      case 'pedidos':
        return (
          <div className="bg-white border-[6px] border-black rounded-[3rem] p-2 md:p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <TabPedidos />
          </div>
        );
      case 'productos':
        return (
          <div className="bg-white border-[6px] border-black rounded-[3rem] p-2 md:p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <TabProductos />
          </div>
        );
      case 'adicionales':
        return (
          <div className="bg-white border-[6px] border-black rounded-[3rem] p-2 md:p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <TabAdicionales />
          </div>
        );
      case 'recompensas':
        return (
          <div className="bg-white border-[6px] border-black rounded-[3rem] p-2 md:p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <AdminRecompensas />
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#FFCA28] flex flex-col items-center justify-center p-6">
      <div className="w-20 h-20 border-10 border-black border-t-red-600 rounded-full animate-spin mb-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]" />
      <p className="font-black italic text-3xl uppercase text-black tracking-tighter transform -skew-x-12">
        VALIDANDO CREDENCIALES... 🍔
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F5F5] font-sans text-black pb-24 selection:bg-red-600 selection:text-white">

      <AdminHeader activeTab={activeTab} setActiveTab={setActiveTab} />

      <button
        onClick={() => router.push('/')}
        className="fixed bottom-6 right-6 z-100 bg-black text-white border-4 border-white flex items-center gap-3 px-6 py-4 rounded-full font-black uppercase text-sm italic shadow-[6px_6px_0px_0px_rgba(211,47,47,1)] hover:scale-105 active:scale-95 transition-all group"
      >
        <span className="text-xl group-hover:rotate-12 transition-transform">🏠</span>
        <span className="hidden md:inline">Ver Menú Público</span>
      </button>

      <main className="max-w-350 mx-auto p-4 md:p-10">
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter text-black drop-shadow-[4px_4px_0px_#FFCA28]">
            PANEL <span className="text-[#D32F2F]">ADMIN</span>
          </h1>
          <div className="h-3 w-32 bg-[#D32F2F] mt-2 border-2 border-black rounded-full mx-auto md:mx-0" />
          <p className="text-sm font-bold text-stone-500 mt-2">
            👤 {userEmail} • {userRol === 'admin' ? '✅ Administrador' : '⚠️ Sin permisos'}
          </p>
        </div>

        <div className="animate-in slide-in-from-bottom-4 duration-500">
          {renderContent()}
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 w-full bg-black text-white/50 py-2 text-center text-[10px] font-bold uppercase tracking-widest z-40 border-t-2 border-white/10">
        Krusty Burger Admin System v3.0 • Conectado a Supabase Realtime
      </footer>
    </div>
  );
}

// ============================================================
// 📋 COMPONENTE ADMIN RECOMPENSAS (integrado)
// ============================================================
function AdminRecompensas() {
  const [recompensas, setRecompensas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [recompensaEditando, setRecompensaEditando] = useState<any>(null);
  const [guardando, setGuardando] = useState(false);

  // Estado del formulario
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [puntosNecesarios, setPuntosNecesarios] = useState('');
  const [tipo, setTipo] = useState<'DESCUENTO' | 'PRODUCTO_GRATIS' | 'ENVIO_GRATIS'>('DESCUENTO');
  const [valorDescuento, setValorDescuento] = useState('');
  const [activa, setActiva] = useState(true);

  useEffect(() => {
    cargarRecompensas();
  }, []);

  const cargarRecompensas = async () => {
    setCargando(true);
    try {
      const { data, error } = await supabase
        .from('recompensas')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;
      setRecompensas(data || []);
    } catch (error) {
      console.error('Error cargando recompensas:', error);
      alert('Error al cargar las recompensas');
    } finally {
      setCargando(false);
    }
  };

  const abrirModal = (recompensa?: any) => {
    if (recompensa) {
      setRecompensaEditando(recompensa);
      setNombre(recompensa.nombre);
      setDescripcion(recompensa.descripcion || '');
      setPuntosNecesarios(String(recompensa.puntos_necesarios || 0));
      setTipo(recompensa.tipo || 'DESCUENTO');
      setValorDescuento(String(recompensa.valor_descuento || 0));
      setActiva(recompensa.activa !== undefined ? recompensa.activa : true);
    } else {
      setRecompensaEditando(null);
      setNombre('');
      setDescripcion('');
      setPuntosNecesarios('');
      setTipo('DESCUENTO');
      setValorDescuento('');
      setActiva(true);
    }
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setRecompensaEditando(null);
  };

  const guardarRecompensa = async () => {
    if (!nombre.trim()) {
      alert('El nombre es obligatorio');
      return;
    }

    if (!puntosNecesarios) {
      alert('Los puntos necesarios son obligatorios');
      return;
    }

    const puntos = parseInt(puntosNecesarios);
    if (isNaN(puntos) || puntos < 1) {
      alert('Los puntos deben ser un número válido mayor a 0');
      return;
    }

    if (tipo === 'DESCUENTO' && !valorDescuento) {
      alert('El porcentaje de descuento es obligatorio para este tipo');
      return;
    }

    const datos = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || '',
      puntos_necesarios: puntos,
      tipo,
      valor_descuento: parseFloat(valorDescuento) || 0,
      activa,
    };

    setGuardando(true);

    try {
      let error = null;

      if (recompensaEditando) {
        const { error: updateError } = await supabase
          .from('recompensas')
          .update({
            ...datos,
            updated_at: new Date().toISOString(),
          })
          .eq('id', recompensaEditando.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('recompensas')
          .insert([{
            ...datos,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }]);
        error = insertError;
      }

      if (error) throw error;

      alert(`✅ Recompensa ${recompensaEditando ? 'actualizada' : 'creada'} correctamente`);
      cerrarModal();
      await cargarRecompensas();
    } catch (error: any) {
      console.error('Error:', error);
      alert(error.message || 'Error al guardar la recompensa');
    } finally {
      setGuardando(false);
    }
  };

  const handleToggleActiva = async (id: number, estadoActual: boolean) => {
    try {
      const { error } = await supabase
        .from('recompensas')
        .update({
          activa: !estadoActual,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      await cargarRecompensas();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al cambiar el estado');
    }
  };

  const handleEliminar = async (id: number, nombre: string) => {
    if (!confirm(`¿Eliminar "${nombre}"?`)) return;

    try {
      // Verificar si tiene canjes asociados
      const { count, error: countError } = await supabase
        .from('canjes')
        .select('*', { count: 'exact', head: true })
        .eq('recompensa_id', id);

      if (countError) throw countError;

      if (count && count > 0) {
        alert(`❌ No se puede eliminar "${nombre}" porque tiene ${count} canje${count > 1 ? 's' : ''} asociado${count > 1 ? 's' : ''}. Desactivá la recompensa en su lugar.`);
        return;
      }

      const { error } = await supabase
        .from('recompensas')
        .delete()
        .eq('id', id);

      if (error) throw error;

      alert('✅ Recompensa eliminada correctamente');
      await cargarRecompensas();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar la recompensa');
    }
  };

  const getTipoLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      DESCUENTO: '💰 Descuento',
      PRODUCTO_GRATIS: '🍔 Producto Gratis',
      ENVIO_GRATIS: '🚚 Envío Gratis',
    };
    return tipos[tipo] || tipo;
  };

  const getTipoColor = (tipo: string) => {
    const colores: Record<string, string> = {
      DESCUENTO: 'text-[#F5C518]',
      PRODUCTO_GRATIS: 'text-[#43A047]',
      ENVIO_GRATIS: 'text-[#3949AB]',
    };
    return colores[tipo] || 'text-stone-400';
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FAD02C] border-t-transparent mx-auto mb-4" />
          <p className="text-stone-500 font-bold">Cargando recompensas...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-stone-900">🎁 Gestionar Recompensas</h2>
          <p className="text-stone-500 text-sm">
            {recompensas.length} {recompensas.length === 1 ? 'recompensa' : 'recompensas'}
            {recompensas.filter(r => r.activa).length > 0 &&
              ` · ${recompensas.filter(r => r.activa).length} activas`
            }
          </p>
        </div>
        <button
          onClick={() => abrirModal()}
          className="bg-[#FAD02C] hover:bg-black hover:text-white font-black py-2 px-4 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_black] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all text-sm"
        >
          + Nueva Recompensa
        </button>
      </div>

      {/* Lista */}
      <div className="grid gap-4">
        {recompensas.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-stone-200">
            <p className="text-4xl mb-2">🎁</p>
            <p className="text-stone-400 font-bold">No hay recompensas</p>
          </div>
        ) : (
          recompensas.map((recompensa) => (
            <div
              key={recompensa.id}
              className={`bg-white border-4 rounded-2xl p-4 md:p-6 shadow-md transition-all ${recompensa.activa ? 'border-black' : 'border-stone-200 opacity-60'
                }`}
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg font-black text-stone-900">
                      {recompensa.nombre}
                    </h3>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border-2 ${getTipoColor(recompensa.tipo)} border-current`}>
                      {getTipoLabel(recompensa.tipo)}
                    </span>
                    {!recompensa.activa && (
                      <span className="text-xs font-bold text-red-500 px-3 py-1 rounded-full border-2 border-red-500">
                        ❌ Inactiva
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-stone-500 mt-1">
                    {recompensa.descripcion || 'Sin descripción'}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-sm font-black text-[#FAD02C]">
                      ⭐ {recompensa.puntos_necesarios} pts
                    </span>
                    {recompensa.valor_descuento > 0 && (
                      <span className="text-sm font-bold text-[#43A047]">
                        {recompensa.tipo === 'DESCUENTO' ? `-${recompensa.valor_descuento}%` : `$${recompensa.valor_descuento}`}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Toggle Activa/Inactiva */}
                  <button
                    onClick={() => handleToggleActiva(recompensa.id, recompensa.activa)}
                    className={`w-12 h-7 rounded-full border-2 border-black transition-all ${recompensa.activa ? 'bg-[#43A047]' : 'bg-stone-300'
                      }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full border-2 border-black transition-all ${recompensa.activa ? 'translate-x-6' : 'translate-x-0'
                        }`}
                    />
                  </button>

                  {/* Editar */}
                  <button
                    onClick={() => abrirModal(recompensa)}
                    className="bg-[#FAD02C]/20 hover:bg-[#FAD02C]/40 p-2 rounded-xl border-2 border-[#FAD02C]/30 transition-colors"
                  >
                    <span className="text-lg">✏️</span>
                  </button>

                  {/* Eliminar */}
                  <button
                    onClick={() => handleEliminar(recompensa.id, recompensa.nombre)}
                    className="bg-red-500/20 hover:bg-red-500/40 p-2 rounded-xl border-2 border-red-500/30 transition-colors"
                  >
                    <span className="text-lg">🗑️</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-white border-4 border-black rounded-4xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-[12px_12px_0px_0px_black]">
            {/* Header */}
            <div className="bg-[#FAD02C] border-b-4 border-black p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎁</span>
                  <h2 className="font-black text-xl uppercase text-black">
                    {recompensaEditando ? '✏️ Editar Recompensa' : '➕ Nueva Recompensa'}
                  </h2>
                </div>
                <button onClick={cerrarModal} className="text-2xl font-black">✕</button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-xs font-black uppercase text-stone-400 mb-1">📌 Nombre *</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: 20% de descuento"
                  className="w-full bg-stone-50 border-4 border-black p-3 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-[#FAD02C]/30"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-xs font-black uppercase text-stone-400 mb-1">📝 Descripción</label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Descripción de la recompensa"
                  rows={3}
                  className="w-full bg-stone-50 border-4 border-black p-3 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-[#FAD02C]/30 resize-none"
                />
              </div>

              {/* Puntos */}
              <div>
                <label className="block text-xs font-black uppercase text-stone-400 mb-1">⭐ Puntos necesarios *</label>
                <input
                  type="number"
                  value={puntosNecesarios}
                  onChange={(e) => setPuntosNecesarios(e.target.value)}
                  placeholder="Ej: 500"
                  className="w-full bg-stone-50 border-4 border-black p-3 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-[#FAD02C]/30"
                  min="1"
                />
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-xs font-black uppercase text-stone-400 mb-1">🏷️ Tipo de recompensa *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'DESCUENTO', label: '💰 Descuento' },
                    { id: 'PRODUCTO_GRATIS', label: '🍔 Producto Gratis' },
                    { id: 'ENVIO_GRATIS', label: '🚚 Envío Gratis' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTipo(t.id as any)}
                      className={`py-3 rounded-xl border-4 font-black text-xs uppercase transition-all ${tipo === t.id
                          ? 'bg-black text-white border-black'
                          : 'bg-stone-50 text-stone-400 border-stone-200 hover:border-stone-300'
                        }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Valor descuento */}
              {tipo === 'DESCUENTO' && (
                <div>
                  <label className="block text-xs font-black uppercase text-stone-400 mb-1">💰 Porcentaje de descuento *</label>
                  <input
                    type="number"
                    value={valorDescuento}
                    onChange={(e) => setValorDescuento(e.target.value)}
                    placeholder="Ej: 20"
                    className="w-full bg-stone-50 border-4 border-black p-3 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-[#FAD02C]/30"
                    min="1"
                    max="100"
                  />
                </div>
              )}

              {/* Activa */}
              <div className="flex items-center justify-between pt-2 border-t-2 border-stone-100">
                <label className="block text-xs font-black uppercase text-stone-400">✅ Activa</label>
                <button
                  onClick={() => setActiva(!activa)}
                  className={`w-12 h-6 rounded-full border-2 border-black transition-all ${activa ? 'bg-[#43A047]' : 'bg-stone-300'
                    }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full border-2 border-black transition-all ${activa ? 'translate-x-6' : 'translate-x-0'
                      }`}
                  />
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t-4 border-black p-4 flex gap-3">
              <button
                onClick={cerrarModal}
                className="flex-1 bg-stone-100 border-4 border-black rounded-xl py-3 font-black text-sm hover:bg-stone-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={guardarRecompensa}
                disabled={guardando}
                className="flex-1 bg-[#FAD02C] border-4 border-black rounded-xl py-3 font-black text-sm hover:bg-black hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {guardando ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent"></span>
                    Guardando...
                  </>
                ) : (
                  <>💾 {recompensaEditando ? 'Actualizar' : 'Crear'}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}