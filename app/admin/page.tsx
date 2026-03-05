"use client";
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

// 1. CONFIGURACIÓN Y LISTA BLANCA
const ADMIN_EMAILS = ['cristianmarcus34@gmail.com', 'marianajuarez99@gmail.com'];
const BUCKET_NAME = 'krusty_imagenes';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'pedidos' | 'productos'>('pedidos');
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  
  // Estados de carga
  const [isUploading, setIsUploading] = useState(false);
  const isSaving = useRef(false);

  // Referencias y Router
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const router = useRouter();

  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: '', precio: 0, categoria: 'burgers', descripcion: '', imagen: ''
  });

  const listaCategorias = ['burgers', 'bebidas', 'postres', 'combos'];

  // --- SUBIDA DE IMÁGENES (STORAGE) ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEditing: boolean = false, prodId?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `productos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      if (isEditing && prodId) {
        handleLocalChange(prodId, 'imagen', publicUrl);
      } else {
        setNuevoProducto(prev => ({ ...prev, imagen: publicUrl }));
      }
    } catch (error: any) {
      alert("❌ Error al subir imagen: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  // --- SONIDO DE NOTIFICACIÓN ---
  const playNotification = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0; 
      audioRef.current.play().catch(() => console.warn("Audio bloqueado"));
    }
  }, []);

  // --- FETCH DE DATOS ---
  const fetchPedidos = useCallback(async () => {
    const { data } = await supabase
      .from('pedidos')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setPedidos(data);
  }, []);

  const fetchProductos = useCallback(async () => {
    if (isSaving.current || editandoId !== null) return;
    const { data } = await supabase.from('productos').select('*').order('categoria', { ascending: true });
    if (data) setProductos(data);
  }, [editandoId]);

  // --- EFECTO INICIAL Y REALTIME ---
  useEffect(() => {
    audioRef.current = new Audio('/sounds/nuevopedido_finmario.mp3');
    audioRef.current.volume = 0.6;

    const initPanel = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session || !ADMIN_EMAILS.includes(session.user.email || '')) {
        await supabase.auth.signOut();
        router.push('/admin/login');
        return;
      }

      await Promise.all([fetchPedidos(), fetchProductos()]);
      
      const channel = supabase.channel('admin_realtime')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pedidos' }, (payload) => {
          playNotification();
          setPedidos(current => [payload.new, ...current]);
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pedidos' }, fetchPedidos)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'productos' }, () => {
            if (editandoId === null && !isSaving.current) fetchProductos();
        })
        .subscribe();
        
      setLoading(false);
      return () => { supabase.removeChannel(channel); };
    };
    
    initPanel();
  }, [router, fetchPedidos, fetchProductos, editandoId, playNotification]);

  // --- MANEJADORES DE PRODUCTOS ---
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
      alert("✅ ¡Cambios guardados!");
      setEditandoId(null);
    } catch (error: any) {
      alert("❌ Error: " + error.message);
      fetchProductos();
    } finally { isSaving.current = false; }
  };

  const handleAddProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoProducto.imagen) return alert("Sube una imagen primero.");

    const { error } = await supabase.from('productos').insert([nuevoProducto]);
    if (error) alert("Error: " + error.message);
    else {
      setShowModal(false);
      setNuevoProducto({ nombre: '', precio: 0, categoria: 'burgers', descripcion: '', imagen: '' });
      fetchProductos();
    }
  };

  const eliminarProducto = async (id: number) => {
    if (confirm("¿Eliminar del menú?")) {
      const { error } = await supabase.from('productos').delete().eq('id', id);
      if (!error) setProductos(prev => prev.filter(p => p.id !== id));
    }
  };

  // --- MANEJADORES DE PEDIDOS (ACTUALIZADO) ---
  const cambiarEstadoPedido = async (id: number, nuevoEstado: string) => {
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ estado: nuevoEstado })
        .eq('id', id);
      
      if (error) throw error;
      
      // Actualización optimista para feedback instantáneo
      setPedidos(prev => prev.map(p => p.id === id ? { ...p, estado: nuevoEstado } : p));
    } catch (err: any) {
      alert("Error al actualizar estado: " + err.message);
    }
  };

  const eliminarPedido = async (id: number) => {
    if (confirm("¿Estás seguro de eliminar este pedido del historial?")) {
      const { error } = await supabase.from('pedidos').delete().eq('id', id);
      if (!error) setPedidos(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  // Helper para colores de estado
  const getEstadoEstilo = (estado: string) => {
    switch (estado) {
      case 'pendiente': return 'bg-[#D32F2F] text-white';
      case 'en cocina': return 'bg-orange-500 text-white';
      case 'en camino': return 'bg-blue-500 text-white';
      case 'entregado': return 'bg-green-600 text-white opacity-50';
      default: return 'bg-stone-200 text-black';
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#FFCA28] flex flex-col items-center justify-center p-4">
      <div className="w-12 h-12 border-4 border-black border-t-white rounded-full animate-spin mb-4"></div>
      <p className="font-black italic text-xl uppercase text-center tracking-tighter">Sincronizando Krusty Cloud...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-100 pb-10 font-sans text-black">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-stone-100 border-b-4 md:border-b-8 border-black p-3 md:p-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex items-center justify-between w-full md:w-auto gap-4">
            <button onClick={() => router.push('/')} className="bg-white border-4 border-black p-2 rounded-xl shadow-[3px_3px_0px_0px_black] hover:bg-[#FFCA28] transition-all">
              <span className="text-xl md:text-2xl font-black">←</span>
            </button>
            <h1 className="text-2xl md:text-4xl font-black text-[#D32F2F] italic uppercase drop-shadow-[2px_2px_0px_black]">KRUSTY ADMIN</h1>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
            <button onClick={() => setActiveTab('pedidos')} className={`flex-1 md:flex-none px-6 py-2 rounded-xl font-black uppercase italic border-4 border-black transition-all ${activeTab === 'pedidos' ? 'bg-[#FFCA28] shadow-[4px_4px_0px_0px_black] -translate-y-1' : 'bg-white'}`}>
              🍔 Comandas
            </button>
            <button onClick={() => setActiveTab('productos')} className={`flex-1 md:flex-none px-6 py-2 rounded-xl font-black uppercase italic border-4 border-black transition-all ${activeTab === 'productos' ? 'bg-[#FFCA28] shadow-[4px_4px_0px_0px_black] -translate-y-1' : 'bg-white'}`}>
              📋 Inventario
            </button>
            <button onClick={handleLogout} className="bg-black text-white px-3 py-2 rounded-xl font-black text-[10px] hover:bg-[#D32F2F]">SALIR</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-3 md:p-8">
        {/* Radar animado */}
        <div className="mb-6 flex justify-center">
            <div className="bg-black text-white text-[10px] font-black px-6 py-2 rounded-full uppercase tracking-widest animate-pulse border-2 border-[#FFCA28] flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
                Radar de Pedidos DBZ Activo
            </div>
        </div>

        {activeTab === 'pedidos' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pedidos.length === 0 ? (
              <p className="col-span-full text-center font-black italic text-stone-400 py-20 text-2xl uppercase">No hay pedidos pendientes...</p>
            ) : (
              pedidos.map((pedido) => (
                <div key={pedido.id} className={`relative border-4 border-black p-5 rounded-[2rem] shadow-[8px_8px_0px_0px_black] bg-white transition-all ${pedido.estado === 'entregado' ? 'grayscale opacity-60' : ''}`}>
                  
                  {/* Badge de Estado Dinámico */}
                  <div className={`absolute -top-3 -right-2 px-4 py-1 rounded-xl border-2 border-black font-black text-[10px] uppercase shadow-md z-10 ${getEstadoEstilo(pedido.estado)}`}>
                    {pedido.estado}
                  </div>

                  {/* Borrar Pedido */}
                  <button onClick={() => eliminarPedido(pedido.id)} className="absolute -top-3 -left-2 bg-white text-black border-2 border-black w-8 h-8 rounded-full font-black text-xs hover:bg-red-500 hover:text-white transition-colors shadow-md z-10">✕</button>

                  <div className="mb-4 mt-2">
                    <p className="text-[10px] font-black uppercase text-stone-400">Cliente</p>
                    <h2 className="text-2xl font-black uppercase italic leading-none">{pedido.cliente_nombre}</h2>
                    <p className="text-xs font-bold text-stone-500 mt-1 uppercase">📍 {pedido.direccion}</p>
                    <p className="text-xs font-bold text-blue-600 mt-1">📞 {pedido.telefono}</p>
                  </div>

                  <div className="bg-stone-50 p-3 rounded-xl border-2 border-dashed border-stone-300 mb-4">
                    <p className="font-bold text-sm leading-tight text-stone-700">{pedido.items_resumen}</p>
                    {pedido.notas && (
                      <div className="mt-2 pt-2 border-t border-stone-200">
                        <p className="text-[9px] font-black uppercase text-red-500">Notas:</p>
                        <p className="text-xs italic font-bold">"{pedido.notas}"</p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center mb-6">
                    <div>
                        <p className="text-[9px] font-black uppercase text-stone-400">Pago: {pedido.metodo_pago}</p>
                        <p className="text-3xl font-black italic tracking-tighter">${pedido.total}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full border-2 border-black font-black text-[10px] uppercase ${pedido.tipo_entrega === 'Delivery' ? 'bg-purple-100' : 'bg-orange-100'}`}>
                        {pedido.tipo_entrega}
                    </div>
                  </div>

                  {/* CONTROL DE FLUJO */}
                  <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => cambiarEstadoPedido(pedido.id, 'en cocina')} 
                        className={`font-black py-2 rounded-xl border-2 border-black text-[10px] uppercase transition-all ${pedido.estado === 'en cocina' ? 'bg-orange-500 text-white shadow-[2px_2px_0px_black]' : 'bg-white hover:bg-orange-100'}`}
                      >
                        👨‍🍳 Cocina
                      </button>
                      <button 
                        onClick={() => cambiarEstadoPedido(pedido.id, 'en camino')} 
                        className={`font-black py-2 rounded-xl border-2 border-black text-[10px] uppercase transition-all ${pedido.estado === 'en camino' ? 'bg-blue-500 text-white shadow-[2px_2px_0px_black]' : 'bg-white hover:bg-blue-100'}`}
                      >
                        🛵 En Camino
                      </button>
                    </div>
                    <button 
                      onClick={() => cambiarEstadoPedido(pedido.id, pedido.estado === 'entregado' ? 'pendiente' : 'entregado')} 
                      className={`font-black py-3 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_black] active:shadow-none transition-all uppercase text-xs ${pedido.estado === 'entregado' ? 'bg-stone-200 text-stone-500' : 'bg-green-500 text-white hover:bg-green-600'}`}
                    >
                      {pedido.estado === 'entregado' ? 'Reabrir Pedido' : 'Marcar Entregado ✅'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* INVENTARIO */
          <div className="space-y-6">
            <div className="bg-black text-white p-6 rounded-[2rem] border-4 border-black flex flex-col md:flex-row justify-between items-center gap-4 shadow-[6px_6px_0px_0px_black]">
              <div>
                <h2 className="text-2xl font-black uppercase italic text-[#FFCA28]">Menú del Día</h2>
                <p className="text-xs font-bold text-stone-400">Edita fotos, precios y stock en tiempo real</p>
              </div>
              <button onClick={() => setShowModal(true)} className="bg-[#D32F2F] text-white border-4 border-white px-8 py-3 rounded-2xl font-black uppercase italic hover:scale-105 transition-transform shadow-lg">
                + AGREGAR ITEM
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {productos.map((prod) => (
                <div key={prod.id} className={`flex flex-col md:flex-row gap-6 bg-white border-4 p-5 rounded-[2.5rem] shadow-[4px_4px_0px_0px_black] transition-all ${editandoId === prod.id ? 'border-[#D32F2F] ring-4 ring-red-100' : 'border-black'}`}>
                  <div className="w-full md:w-40 relative group overflow-hidden rounded-3xl border-4 border-black aspect-square">
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    <img src={prod.imagen} className="w-full h-full object-cover bg-stone-100" alt="" />
                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                      <span className="text-white font-black text-[10px] uppercase text-center px-2">Cambiar Foto</span>
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, true, prod.id)} disabled={isUploading} />
                    </label>
                  </div>

                  <div className="flex-1 space-y-3">
                    <input 
                      type="text" value={prod.nombre}
                      onChange={(e) => handleLocalChange(prod.id, 'nombre', e.target.value)}
                      className="w-full font-black uppercase italic text-3xl border-b-4 border-transparent focus:border-black outline-none bg-transparent"
                    />
                    <textarea 
                      value={prod.descripcion}
                      onChange={(e) => handleLocalChange(prod.id, 'descripcion', e.target.value)}
                      className="w-full text-sm font-bold bg-stone-50 p-3 rounded-xl h-20 resize-none border-2 border-stone-200 focus:border-black outline-none"
                    />
                  </div>

                  <div className="w-full md:w-56 flex flex-col justify-between gap-3">
                    <div className="flex items-center bg-white p-3 rounded-xl border-4 border-black">
                      <span className="font-black text-2xl">$</span>
                      <input 
                        type="number" value={prod.precio}
                        onChange={(e) => handleLocalChange(prod.id, 'precio', e.target.value)}
                        className="w-full bg-transparent font-black text-3xl text-right outline-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => guardarCambiosEnDB(prod)}
                        disabled={editandoId !== prod.id || isSaving.current}
                        className={`flex-1 py-4 rounded-2xl border-4 border-black font-black uppercase italic text-xs transition-all ${editandoId === prod.id ? 'bg-green-500 text-white shadow-[3px_3px_0px_0px_black]' : 'bg-stone-100 text-stone-300 border-stone-200 opacity-50'}`}
                      >
                        {isSaving.current ? '...' : 'GUARDAR'}
                      </button>
                      <button onClick={() => eliminarProducto(prod.id)} className="p-4 bg-white border-4 border-black text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all">
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* MODAL NUEVO PRODUCTO */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="bg-[#FFCA28] border-[10px] border-black p-8 rounded-[3.5rem] w-full max-w-lg shadow-[10px_10px_0px_0px_black]">
            <h2 className="text-4xl font-black text-[#D32F2F] italic uppercase mb-8 text-center drop-shadow-[1px_1px_0px_black]">NUEVO ITEM</h2>
            <form onSubmit={handleAddProducto} className="space-y-4">
              <input required placeholder="NOMBRE DEL PRODUCTO" className="w-full border-4 border-black p-4 rounded-2xl font-black uppercase outline-none" value={nuevoProducto.nombre} onChange={(e) => setNuevoProducto({...nuevoProducto, nombre: e.target.value})} />
              
              <div className="flex gap-4">
                <input required type="number" placeholder="PRECIO" className="w-1/2 border-4 border-black p-4 rounded-2xl font-black outline-none" value={nuevoProducto.precio} onChange={(e) => setNuevoProducto({...nuevoProducto, precio: Number(e.target.value)})} />
                <select className="w-1/2 border-4 border-black p-4 rounded-2xl font-black uppercase outline-none" value={nuevoProducto.categoria} onChange={(e) => setNuevoProducto({...nuevoProducto, categoria: e.target.value})}>
                  {listaCategorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div className={`relative border-4 border-black p-4 rounded-2xl bg-white flex flex-col items-center justify-center transition-all min-h-[120px] ${!nuevoProducto.imagen ? 'border-dashed border-stone-400' : ''}`}>
                {isUploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                    <p className="font-black text-[10px]">SUBIENDO...</p>
                  </div>
                ) : nuevoProducto.imagen ? (
                  <div className="relative w-full">
                    <img src={nuevoProducto.imagen} alt="Preview" className="w-full h-32 object-cover rounded-xl border-2 border-black" />
                    <button type="button" onClick={() => setNuevoProducto({...nuevoProducto, imagen: ''})} className="absolute -top-2 -right-2 bg-red-600 text-white w-6 h-6 rounded-full border-2 border-black font-black text-xs">X</button>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="font-black uppercase text-[10px] mb-2">FOTO DEL PRODUCTO</p>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="text-xs font-bold" />
                  </div>
                )}
              </div>

              <textarea placeholder="DESCRIPCIÓN BREVE" className="w-full border-4 border-black p-4 rounded-2xl font-black h-28 resize-none outline-none" value={nuevoProducto.descripcion} onChange={(e) => setNuevoProducto({...nuevoProducto, descripcion: e.target.value})} />
              
              <div className="flex flex-col gap-3 pt-4">
                <button 
                  type="submit" 
                  disabled={isUploading || !nuevoProducto.imagen}
                  className={`w-full bg-green-500 text-white border-4 border-black py-5 rounded-[2rem] font-black uppercase italic shadow-[4px_4px_0px_0px_black] text-lg hover:bg-green-600 transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isUploading ? 'ESPERA...' : 'SUBIR AL MENÚ 🔥'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="font-black uppercase text-xs underline">CANCELAR</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}