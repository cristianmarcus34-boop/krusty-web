"use client";
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const ADMIN_EMAILS = ['cristianmarcus34@gmail.com', 'marianajuarez99@gmail.com'];
const BUCKET_NAME = 'krusty_imagenes';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'pedidos' | 'productos'>('pedidos');
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const isSaving = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const router = useRouter();

  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: '', precio: 0, categoria: 'burgers', descripcion: '', imagen: ''
  });

  const listaCategorias = ['burgers', 'bebidas', 'postres', 'combos'];

  // --- FUNCIONES DE CARGA ---
  const fetchPedidos = useCallback(async () => {
    const { data } = await supabase
      .from('pedidos')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setPedidos(data);
  }, []);

  const fetchProductos = useCallback(async () => {
    if (isSaving.current) return;
    const { data } = await supabase.from('productos').select('*').order('categoria', { ascending: true });
    if (data) setProductos(data);
  }, []);

  const playNotification = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => console.warn("Audio bloqueado. Interactúa con la página primero."));
    }
  }, []);

  // --- 1. CARGA INICIAL Y CONFIGURACIÓN DE AUDIO ---
  useEffect(() => {
    audioRef.current = new Audio('/sounds/nuevopedido_finmario.mp3');
    audioRef.current.volume = 0.6;

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !ADMIN_EMAILS.includes(session.user.email || '')) {
        await supabase.auth.signOut();
        router.push('/admin/login');
        return;
      }
      await Promise.all([fetchPedidos(), fetchProductos()]);
      setLoading(false);
    };

    checkAuth();
  }, [router, fetchPedidos, fetchProductos]);

  // --- 2. REALTIME (Sincronización en tiempo real) ---
  useEffect(() => {
    if (loading) return;

    const channel = supabase
      .channel('admin-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'pedidos' },
        (payload) => {
          playNotification();
          setPedidos((current) => [payload.new, ...current]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'pedidos' },
        (payload) => {
          setPedidos((current) =>
            current.map((p) => String(p.id) === String(payload.new.id) ? payload.new : p)
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'pedidos' },
        (payload) => {
          setPedidos((current) => current.filter((p) => String(p.id) !== String(payload.old.id)));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loading, playNotification]);

  // --- ACCIONES DE DB ---
  const cambiarEstadoPedido = async (id: any, nuevoEstado: string) => {
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ estado: nuevoEstado })
        .eq('id', id);
      if (error) throw error;
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const eliminarPedido = async (id: any) => {
    if (confirm("¿Eliminar comanda?")) {
      const { error } = await supabase.from('pedidos').delete().eq('id', id);
      if (error) alert("Error al eliminar");
    }
  };

  // Función genérica para subir archivos al Storage
  const uploadToStorage = async (file: File) => {
    const fileName = `${Date.now()}.${file.name.split('.').pop()}`;
    const filePath = `productos/${fileName}`;
    const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(filePath, file);
    if (uploadError) throw uploadError;
    const { data: { publicUrl } } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
    return publicUrl;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      const url = await uploadToStorage(file);
      setNuevoProducto(prev => ({ ...prev, imagen: url }));
    } catch (error: any) {
      alert("Error carga imagen: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  // NUEVA FUNCIÓN: Editar imagen de producto existente
  const handleEditImage = async (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      const url = await uploadToStorage(file);
      handleLocalChange(id, 'imagen', url);
    } catch (error: any) {
      alert("Error al cambiar imagen: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleLocalChange = (id: number, campo: string, valor: any) => {
    setEditandoId(id);
    setProductos(prev => prev.map(p => p.id === id ? { ...p, [campo]: valor } : p));
  };

  const guardarCambiosEnDB = async (producto: any) => {
    try {
      isSaving.current = true;
      const { error } = await supabase.from('productos').update({
        nombre: producto.nombre,
        precio: Number(producto.precio),
        categoria: producto.categoria,
        descripcion: producto.descripcion,
        imagen: producto.imagen
      }).eq('id', producto.id);
      if (error) throw error;
      setEditandoId(null);
      alert("✅ Menú actualizado");
    } catch (error: any) {
      alert("❌ Error: " + error.message);
    } finally {
      isSaving.current = false;
    }
  };

  const handleAddProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoProducto.imagen) return alert("Sube una imagen primero.");
    const { error } = await supabase.from('productos').insert([nuevoProducto]);
    if (error) alert(error.message);
    else {
      setShowModal(false);
      setNuevoProducto({ nombre: '', precio: 0, categoria: 'burgers', descripcion: '', imagen: '' });
      fetchProductos();
    }
  };

  const getEstadoEstilo = (estado: string) => {
    switch (estado) {
      case 'pendiente': return 'bg-[#D32F2F] text-white animate-pulse';
      case 'en cocina': return 'bg-orange-500 text-white';
      case 'en camino': return 'bg-blue-500 text-white';
      case 'entregado': return 'bg-green-600 text-white opacity-50';
      default: return 'bg-stone-200 text-black';
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#FFCA28] flex flex-col items-center justify-center p-4">
      <div className="w-16 h-16 border-8 border-black border-t-white rounded-full animate-spin mb-4"></div>
      <p className="font-black italic text-2xl uppercase text-black tracking-tighter">Cargando Sistema Krusty...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-200 font-sans text-black pb-20">
      <header className="sticky top-0 z-50 bg-white border-b-8 border-black p-4 md:p-6 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center justify-between w-full md:w-auto gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#D32F2F] rounded-full border-4 border-black flex items-center justify-center text-white font-black italic">K</div>
              <h1 className="text-3xl font-black text-[#D32F2F] italic uppercase tracking-tighter transform -skew-x-6">ADMIN PANEL</h1>
            </div>
            <button onClick={() => { supabase.auth.signOut(); router.push('/admin/login'); }} className="md:hidden bg-black text-white px-4 py-2 rounded-xl font-black text-[10px]">SALIR</button>
          </div>
          <nav className="flex gap-2 w-full md:w-auto">
            <button onClick={() => setActiveTab('pedidos')} className={`flex-1 md:flex-none px-8 py-3 rounded-2xl font-black uppercase italic border-4 border-black transition-all ${activeTab === 'pedidos' ? 'bg-[#FFCA28] shadow-[4px_4px_0px_0px_black] -translate-y-1' : 'bg-white'}`}>
              Comandas {pedidos.filter(p => p.estado !== 'entregado').length > 0 && `(${pedidos.filter(p => p.estado !== 'entregado').length})`}
            </button>
            <button onClick={() => setActiveTab('productos')} className={`flex-1 md:flex-none px-8 py-3 rounded-2xl font-black uppercase italic border-4 border-black transition-all ${activeTab === 'productos' ? 'bg-[#FFCA28] shadow-[4px_4px_0px_0px_black] -translate-y-1' : 'bg-white'}`}>
              Editar Menú
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {activeTab === 'pedidos' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {pedidos.map((pedido) => (
              <div key={pedido.id} className={`group relative border-4 border-black p-6 rounded-[2.5rem] bg-white transition-all 
                ${pedido.estado === 'entregado' ? 'grayscale opacity-60 shadow-[4px_4px_0px_0px_black]' : 'shadow-[10px_10px_0px_0px_black]'} 
                ${pedido.estado === 'pendiente' ? 'border-[#D32F2F] ring-4 ring-[#FFCA28] ring-inset' : 'border-black'}`}>

                <div className={`absolute -top-4 right-6 px-4 py-1 rounded-xl border-4 border-black font-black text-xs uppercase z-10 shadow-[4px_4px_0px_0px_black] ${getEstadoEstilo(pedido.estado)}`}>
                  {pedido.estado}
                </div>
                <button onClick={() => eliminarPedido(pedido.id)} className="absolute -top-4 -left-2 bg-white text-[#D32F2F] border-4 border-black w-10 h-10 rounded-full font-black shadow-[4px_4px_0px_0px_black] hover:bg-red-50">✕</button>

                <div className="mb-4">
                  <p className="text-[10px] font-black text-stone-400 uppercase">Cliente:</p>
                  <h2 className="text-2xl font-black uppercase italic leading-tight">{pedido.cliente_nombre}</h2>
                  <p className="text-xs font-bold text-stone-500 italic">📍 {pedido.direccion}</p>
                </div>

                <div className="bg-stone-100 p-4 rounded-2xl border-4 border-black border-dashed mb-4 max-h-40 overflow-y-auto no-scrollbar">
                  <p className="font-bold text-sm text-stone-800 whitespace-pre-line leading-relaxed">{pedido.items_resumen}</p>
                </div>

                <div className="flex justify-between items-end mb-6">
                  <div>
                    <p className="text-[10px] font-black text-stone-400 uppercase">Pago:</p>
                    <p className="font-black text-xs italic text-[#D32F2F] uppercase">{pedido.metodo_pago}</p>
                  </div>
                  <p className="text-4xl font-black italic tracking-tighter">${pedido.total}</p>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => cambiarEstadoPedido(pedido.id, 'en cocina')} className="font-black py-3 rounded-xl border-[3px] border-black text-[10px] uppercase bg-white hover:bg-orange-400 shadow-[4px_4px_0px_0px_black] active:translate-y-1 transition-all">👨‍🍳 COCINA</button>
                    <button onClick={() => cambiarEstadoPedido(pedido.id, 'en camino')} className="font-black py-3 rounded-xl border-[3px] border-black text-[10px] uppercase bg-white hover:bg-blue-500 shadow-[4px_4px_0px_0px_black] active:translate-y-1 transition-all">🛵 ENVÍO</button>
                  </div>
                  <button
                    onClick={() => cambiarEstadoPedido(pedido.id, pedido.estado === 'entregado' ? 'pendiente' : 'entregado')}
                    className={`font-black py-4 rounded-2xl border-4 border-black shadow-[6px_6px_0px_0px_black] transition-all uppercase text-xs active:translate-y-1 ${pedido.estado === 'entregado' ? 'bg-stone-300' : 'bg-green-500 text-white'}`}
                  >
                    {pedido.estado === 'entregado' ? 'REABRIR COMANDA' : 'MARCAR ENTREGADO ✅'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            <button onClick={() => setShowModal(true)} className="w-full bg-[#D32F2F] text-white border-8 border-black p-8 rounded-[3rem] font-black uppercase text-2xl italic shadow-[10px_10px_0px_0px_black] hover:-translate-y-2 transition-transform active:translate-y-0">
              + AGREGAR NUEVO ITEM 🔥
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {productos.map((prod) => (
                <div key={prod.id} className="bg-white border-4 border-black p-6 rounded-[3rem] shadow-[8px_8px_0px_0px_black] flex flex-col sm:flex-row gap-6">
                  {/* SECCIÓN IMAGEN EDITABLE */}
                  <div className="relative group shrink-0 mx-auto sm:mx-0">
                    <div className="w-32 h-32 relative">
                      <img 
                        src={prod.imagen} 
                        className={`w-full h-full object-cover rounded-2xl border-4 border-black bg-stone-100 ${isUploading ? 'opacity-30' : ''}`} 
                        alt={prod.nombre} 
                      />
                      {/* Overlay al pasar el mouse */}
                      <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                        <span className="text-[10px] text-white font-black uppercase text-center px-2">Cambiar Foto</span>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => handleEditImage(prod.id, e)} 
                        />
                      </label>
                      {isUploading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-8 border-4 border-black border-t-[#D32F2F] rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                    <p className="text-[8px] font-black text-center mt-2 text-stone-400 uppercase tracking-widest">Click para editar</p>
                  </div>

                  <div className="flex-1 space-y-3">
                    <input 
                      value={prod.nombre} 
                      onChange={(e) => handleLocalChange(prod.id, 'nombre', e.target.value)} 
                      className="w-full font-black text-xl uppercase italic bg-transparent border-b-2 border-black focus:border-[#D32F2F] outline-none" 
                    />
                    
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xl">$</span>
                      <input 
                        type="number" 
                        value={prod.precio} 
                        onChange={(e) => handleLocalChange(prod.id, 'precio', e.target.value)} 
                        className="w-full font-black text-xl outline-none bg-transparent" 
                      />
                    </div>

                    <select 
                      value={prod.categoria} 
                      onChange={(e) => handleLocalChange(prod.id, 'categoria', e.target.value)}
                      className="w-full text-[10px] font-black uppercase italic bg-stone-100 p-2 rounded-lg border-2 border-black"
                    >
                      {listaCategorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>

                    <div className="flex gap-2 pt-2">
                      <button 
                        onClick={() => guardarCambiosEnDB(prod)} 
                        disabled={editandoId !== prod.id || isUploading} 
                        className={`flex-1 py-3 rounded-xl border-4 border-black font-black uppercase text-[10px] transition-all ${editandoId === prod.id ? 'bg-green-500 text-white shadow-[3px_3px_0px_0px_black] active:translate-y-1 active:shadow-none' : 'bg-stone-100 opacity-40 cursor-not-allowed'}`}
                      >
                        {editandoId === prod.id ? 'GUARDAR CAMBIOS' : 'SIN CAMBIOS'}
                      </button>
                      <button 
                        onClick={async () => { if (confirm("¿Borrar definitivamente?")) { const { error } = await supabase.from('productos').delete().eq('id', prod.id); if (!error) setProductos(prev => prev.filter(p => p.id !== prod.id)); } }} 
                        className="px-4 border-4 border-black rounded-xl text-red-600 font-black text-[10px] hover:bg-red-50"
                      >
                        BORRAR
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* MODAL NUEVO PRODUCTO (Sigue igual, funcional) */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="bg-[#FFCA28] border-[10px] border-black p-8 rounded-[4rem] w-full max-w-lg">
            <h2 className="text-4xl font-black uppercase italic mb-8 text-center tracking-tighter">NUEVO ITEM</h2>
            <form onSubmit={handleAddProducto} className="space-y-5">
              <input required placeholder="NOMBRE DEL PRODUCTO" className="w-full border-4 border-black p-4 rounded-2xl font-black uppercase italic outline-none focus:bg-white" value={nuevoProducto.nombre} onChange={(e) => setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })} />
              <div className="flex gap-3">
                <input required type="number" placeholder="PRECIO" className="flex-1 border-4 border-black p-4 rounded-2xl font-black outline-none" value={nuevoProducto.precio || ''} onChange={(e) => setNuevoProducto({ ...nuevoProducto, precio: Number(e.target.value) })} />
                <select className="flex-1 border-4 border-black p-4 rounded-2xl font-black bg-white outline-none" value={nuevoProducto.categoria} onChange={(e) => setNuevoProducto({ ...nuevoProducto, categoria: e.target.value })}>
                  {listaCategorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="bg-white border-4 border-black p-4 rounded-2xl text-center">
                <p className="text-[10px] font-black mb-2 uppercase italic">Imagen del producto:</p>
                <input type="file" onChange={handleFileUpload} className="w-full text-xs font-black cursor-pointer" />
                {isUploading && <p className="text-[10px] font-bold text-red-600 animate-pulse mt-2 uppercase">Subiendo...</p>}
                {nuevoProducto.imagen && <p className="text-[10px] font-bold text-green-600 mt-2 uppercase">✅ Imagen cargada</p>}
              </div>
              <textarea placeholder="DESCRIPCIÓN BREVE" className="w-full border-4 border-black p-4 rounded-2xl font-black h-24 resize-none outline-none focus:bg-white" value={nuevoProducto.descripcion} onChange={(e) => setNuevoProducto({ ...nuevoProducto, descripcion: e.target.value })} />
              <div className="pt-4 space-y-3">
                <button type="submit" disabled={isUploading} className="w-full bg-[#D32F2F] text-white border-4 border-black py-5 rounded-[2rem] font-black text-xl italic shadow-[6px_6px_0px_0px_black] active:translate-y-1 active:shadow-none transition-all">CREAR EN MENÚ 🔥</button>
                <button type="button" onClick={() => setShowModal(false)} className="w-full text-center font-black uppercase text-xs underline">CANCELAR</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}