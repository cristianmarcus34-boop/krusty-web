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
  
  const [isUploading, setIsUploading] = useState(false);
  const isSaving = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const router = useRouter();

  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: '', precio: 0, categoria: 'burgers', descripcion: '', imagen: ''
  });

  const listaCategorias = ['burgers', 'bebidas', 'postres', 'combos'];

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

  // --- EFECTO INICIAL Y REALTIME REFORZADO ---
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
      
      const channel = supabase.channel('admin_realtime_v2')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pedidos' }, (payload) => {
          console.log("🆕 Nuevo pedido recibido:", payload.new);
          playNotification();
          setPedidos(current => [payload.new, ...current]);
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pedidos' }, (payload) => {
          console.log("🔄 Actualización detectada en DB:", payload.new);
          // Sincronizamos la lista local con lo que dice la DB
          setPedidos(current => 
            current.map(p => p.id === payload.new.id ? payload.new : p)
          );
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'productos' }, () => {
            if (editandoId === null && !isSaving.current) fetchProductos();
        })
        .subscribe((status) => console.log("📡 Estado Admin Realtime:", status));
        
      setLoading(false);
      return () => { supabase.removeChannel(channel); };
    };
    
    initPanel();
  }, [router, fetchPedidos, fetchProductos, editandoId, playNotification]);

  // --- MANEJADORES DE PEDIDOS (EL CAMBIO CLAVE) ---
  const cambiarEstadoPedido = async (id: number, nuevoEstado: string) => {
    try {
      console.log(`🚀 Actualizando Pedido #${id} a ${nuevoEstado}...`);
      
      const { data, error } = await supabase
        .from('pedidos')
        .update({ estado: nuevoEstado })
        .eq('id', id)
        .select(); // IMPORTANTE: .select() asegura que el cambio se emita al Realtime

      if (error) throw error;
      
      if (data) {
        console.log("✅ Cambio exitoso en base de datos.");
        // Actualizamos localmente para feedback inmediato
        setPedidos(prev => prev.map(p => p.id === id ? { ...p, estado: nuevoEstado } : p));
      }
    } catch (err: any) {
      console.error("❌ Error al cambiar estado:", err.message);
      alert("Error: " + err.message);
    }
  };

  const eliminarPedido = async (id: number) => {
    if (confirm("¿Estás seguro de eliminar este pedido?")) {
      const { error } = await supabase.from('pedidos').delete().eq('id', id);
      if (!error) setPedidos(prev => prev.filter(p => p.id !== id));
    }
  };

  // --- MANEJADORES DE PRODUCTOS E IMÁGENES ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEditing: boolean = false, prodId?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `productos/${fileName}`;

      const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

      if (isEditing && prodId) {
        handleLocalChange(prodId, 'imagen', publicUrl);
      } else {
        setNuevoProducto(prev => ({ ...prev, imagen: publicUrl }));
      }
    } catch (error: any) {
      alert("❌ Error: " + error.message);
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
      alert("✅ ¡Producto actualizado!");
      setEditandoId(null);
    } catch (error: any) {
      alert("❌ Error: " + error.message);
    } finally { isSaving.current = false; }
  };

  const handleAddProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoProducto.imagen) return alert("Sube una imagen.");
    const { error } = await supabase.from('productos').insert([nuevoProducto]);
    if (error) alert(error.message);
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
      <p className="font-black italic text-xl uppercase text-center tracking-tighter">Conectando con la cocina...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-100 pb-10 font-sans text-black">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-stone-100 border-b-4 border-black p-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/')} className="bg-white border-4 border-black p-2 rounded-xl shadow-[3px_3px_0px_0px_black]">
              <span className="text-xl font-black">←</span>
            </button>
            <h1 className="text-2xl md:text-4xl font-black text-[#D32F2F] italic uppercase drop-shadow-[2px_2px_0px_black]">KRUSTY ADMIN</h1>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <button onClick={() => setActiveTab('pedidos')} className={`flex-1 px-6 py-2 rounded-xl font-black uppercase italic border-4 border-black transition-all ${activeTab === 'pedidos' ? 'bg-[#FFCA28] shadow-[4px_4px_0px_0px_black] -translate-y-1' : 'bg-white'}`}>
              🍔 Comandas
            </button>
            <button onClick={() => setActiveTab('productos')} className={`flex-1 px-6 py-2 rounded-xl font-black uppercase italic border-4 border-black transition-all ${activeTab === 'productos' ? 'bg-[#FFCA28] shadow-[4px_4px_0px_0px_black] -translate-y-1' : 'bg-white'}`}>
              📋 Menú
            </button>
            <button onClick={() => { supabase.auth.signOut(); router.push('/admin/login'); }} className="bg-black text-white px-3 py-2 rounded-xl font-black text-[10px]">SALIR</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {activeTab === 'pedidos' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pedidos.map((pedido) => (
              <div key={pedido.id} className={`relative border-4 border-black p-5 rounded-[2rem] shadow-[8px_8px_0px_0px_black] bg-white ${pedido.estado === 'entregado' ? 'grayscale opacity-60' : ''}`}>
                
                <div className={`absolute -top-3 -right-2 px-4 py-1 rounded-xl border-2 border-black font-black text-[10px] uppercase ${getEstadoEstilo(pedido.estado)}`}>
                  {pedido.estado}
                </div>

                <button onClick={() => eliminarPedido(pedido.id)} className="absolute -top-3 -left-2 bg-white text-black border-2 border-black w-8 h-8 rounded-full font-black text-xs shadow-md">✕</button>

                <div className="mb-4 mt-2">
                  <h2 className="text-2xl font-black uppercase italic leading-none">{pedido.cliente_nombre}</h2>
                  <p className="text-xs font-bold text-stone-500 mt-1">📍 {pedido.direccion}</p>
                </div>

                <div className="bg-stone-50 p-3 rounded-xl border-2 border-dashed border-stone-300 mb-4">
                  <p className="font-bold text-sm text-stone-700">{pedido.items_resumen}</p>
                </div>

                <div className="flex justify-between items-center mb-6">
                  <p className="text-3xl font-black italic tracking-tighter">${pedido.total}</p>
                  <div className="px-3 py-1 rounded-full border-2 border-black font-black text-[10px] uppercase bg-purple-100">
                    {pedido.tipo_entrega}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => cambiarEstadoPedido(pedido.id, 'en cocina')} className="font-black py-2 rounded-xl border-2 border-black text-[10px] uppercase bg-white hover:bg-orange-100">👨‍🍳 Cocina</button>
                    <button onClick={() => cambiarEstadoPedido(pedido.id, 'en camino')} className="font-black py-2 rounded-xl border-2 border-black text-[10px] uppercase bg-white hover:bg-blue-100">🛵 Camino</button>
                  </div>
                  <button 
                    onClick={() => cambiarEstadoPedido(pedido.id, pedido.estado === 'entregado' ? 'pendiente' : 'entregado')} 
                    className={`font-black py-3 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_black] uppercase text-xs ${pedido.estado === 'entregado' ? 'bg-stone-200' : 'bg-green-500 text-white'}`}
                  >
                    {pedido.estado === 'entregado' ? 'Reabrir' : 'Entregado ✅'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Pestaña de Productos (Inventario) */
          <div className="grid grid-cols-1 gap-6">
             <button onClick={() => setShowModal(true)} className="bg-[#D32F2F] text-white border-4 border-black p-6 rounded-3xl font-black uppercase text-xl shadow-[6px_6px_0px_0px_black]">
               + AGREGAR NUEVO PRODUCTO
             </button>
             {productos.map((prod) => (
               <div key={prod.id} className="flex flex-col md:flex-row gap-6 bg-white border-4 border-black p-5 rounded-[2.5rem] shadow-[4px_4px_0px_0px_black]">
                 <img src={prod.imagen} className="w-40 h-40 object-cover rounded-3xl border-4 border-black" alt="" />
                 <div className="flex-1">
                   <input value={prod.nombre} onChange={(e) => handleLocalChange(prod.id, 'nombre', e.target.value)} className="w-full font-black text-2xl uppercase italic bg-transparent outline-none" />
                   <textarea value={prod.descripcion} onChange={(e) => handleLocalChange(prod.id, 'descripcion', e.target.value)} className="w-full text-sm font-bold bg-stone-50 p-2 rounded-xl mt-2 h-20 resize-none border-2 border-stone-200" />
                 </div>
                 <div className="w-40 flex flex-col justify-between gap-2">
                   <div className="bg-white border-4 border-black p-2 rounded-xl flex items-center">
                     <span className="font-black">$</span>
                     <input type="number" value={prod.precio} onChange={(e) => handleLocalChange(prod.id, 'precio', e.target.value)} className="w-full text-right font-black text-xl outline-none" />
                   </div>
                   <button onClick={() => guardarCambiosEnDB(prod)} disabled={editandoId !== prod.id} className={`py-3 rounded-xl border-4 border-black font-black uppercase text-xs ${editandoId === prod.id ? 'bg-green-500 text-white' : 'bg-stone-100 opacity-50'}`}>GUARDAR</button>
                   <button onClick={() => eliminarProducto(prod.id)} className="py-2 border-2 border-black rounded-xl text-red-600 font-bold text-xs">ELIMINAR</button>
                 </div>
               </div>
             ))}
          </div>
        )}
      </main>

      {/* MODAL SIMPLIFICADO */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80">
          <div className="bg-[#FFCA28] border-[8px] border-black p-8 rounded-[3rem] w-full max-w-lg">
            <h2 className="text-3xl font-black uppercase italic mb-6 text-center">NUEVO ITEM</h2>
            <form onSubmit={handleAddProducto} className="space-y-4">
              <input required placeholder="NOMBRE" className="w-full border-4 border-black p-3 rounded-xl font-black" value={nuevoProducto.nombre} onChange={(e) => setNuevoProducto({...nuevoProducto, nombre: e.target.value})} />
              <div className="flex gap-2">
                <input required type="number" placeholder="PRECIO" className="w-1/2 border-4 border-black p-3 rounded-xl font-black" value={nuevoProducto.precio} onChange={(e) => setNuevoProducto({...nuevoProducto, precio: Number(e.target.value)})} />
                <select className="w-1/2 border-4 border-black p-3 rounded-xl font-black" value={nuevoProducto.categoria} onChange={(e) => setNuevoProducto({...nuevoProducto, categoria: e.target.value})}>
                  {listaCategorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <input type="file" onChange={handleFileUpload} className="w-full font-bold text-xs" />
              <textarea placeholder="DESCRIPCIÓN" className="w-full border-4 border-black p-3 rounded-xl font-black h-24" value={nuevoProducto.descripcion} onChange={(e) => setNuevoProducto({...nuevoProducto, descripcion: e.target.value})} />
              <button type="submit" className="w-full bg-green-500 text-white border-4 border-black py-4 rounded-2xl font-black shadow-[4px_4px_0px_0px_black]">CREAR PRODUCTO 🔥</button>
              <button type="button" onClick={() => setShowModal(false)} className="w-full text-center font-black uppercase text-xs underline">Cerrar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}