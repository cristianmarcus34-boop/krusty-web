"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ModalNuevoProducto({ onClose, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const [todosLosExtras, setTodosLosExtras] = useState<any[]>([]);
  const [extrasSeleccionados, setExtrasSeleccionados] = useState<number[]>([]);
  const [nuevo, setNuevo] = useState({ 
    nombre: '', 
    precio: 0, 
    categoria: 'burgers', 
    descripcion: '', 
    imagen: '' 
  });

  // 1. Cargar la lista de extras disponibles al abrir el modal
  useEffect(() => {
    const fetchExtras = async () => {
      const { data } = await supabase.from('adicionales').select('*').order('nombre');
      if (data) setTodosLosExtras(data);
    };
    fetchExtras();
  }, []);

  const handleUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    const fileName = `${Date.now()}.${file.name.split('.').pop()}`;
    
    const { error } = await supabase.storage
      .from('krusty_imagenes')
      .upload(`productos/${fileName}`, file);

    if (error) {
      alert("Error al subir imagen");
      setLoading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('krusty_imagenes')
      .getPublicUrl(`productos/${fileName}`);
    
    setNuevo({ ...nuevo, imagen: publicUrl });
    setLoading(false);
  };

  const toggleExtra = (id: number) => {
    setExtrasSeleccionados(prev => 
      prev.includes(id) ? prev.filter(eId => eId !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!nuevo.imagen) return alert("¡Subí la foto, muchacho!");
    setLoading(true);

    try {
      // 1. Insertar el producto
      const { data: productoInsertado, error: errorProd } = await supabase
        .from('productos')
        .insert([nuevo])
        .select()
        .single();

      if (errorProd) throw errorProd;

      // 2. Si hay extras seleccionados, insertar relaciones en la tabla intermedia
      if (extrasSeleccionados.length > 0 && productoInsertado) {
        const relaciones = extrasSeleccionados.map(extraId => ({
          producto_id: productoInsertado.id,
          adicional_id: extraId
        }));

        const { error: errorRel } = await supabase
          .from('producto_adicionales')
          .insert(relaciones);

        if (errorRel) console.error("Error guardando extras:", errorRel.message);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      alert("Error al crear: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#FFCA28] border-[10px] border-black p-8 rounded-[4rem] w-full max-w-lg my-auto shadow-[20px_20px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-4xl font-black uppercase italic mb-6 text-center tracking-tighter">NUEVO ITEM 🔥</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre y Categoria */}
          <div className="space-y-1">
            <input required placeholder="NOMBRE DEL PRODUCTO" className="w-full border-4 border-black p-4 rounded-2xl font-black italic outline-none focus:bg-white" onChange={e => setNuevo({...nuevo, nombre: e.target.value.toUpperCase()})} />
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <input required type="number" placeholder="PRECIO" className="w-full border-4 border-black p-4 rounded-2xl font-black shadow-[4px_4px_0px_0px_black] outline-none" onChange={e => setNuevo({...nuevo, precio: Number(e.target.value)})} />
            </div>
            <select className="flex-1 border-4 border-black p-4 rounded-2xl font-black outline-none" onChange={e => setNuevo({...nuevo, categoria: e.target.value})}>
              <option value="burgers">BURGERS 🍔</option>
              <option value="bebidas">BEBIDAS 🥤</option>
              <option value="postres">POSTRES 🍦</option>
              <option value="combos">COMBOS 🍟</option>
            </select>
          </div>

          {/* Selector de Extras */}
          <div className="space-y-2">
            <p className="font-black text-xs uppercase italic ml-2">Seleccionar Extras Permitidos:</p>
            <div className="grid grid-cols-2 gap-2 bg-white/50 border-4 border-black border-dashed p-3 rounded-2xl max-h-32 overflow-y-auto no-scrollbar">
              {todosLosExtras.length > 0 ? (
                todosLosExtras.map((extra) => (
                  <button
                    key={extra.id}
                    type="button"
                    onClick={() => toggleExtra(extra.id)}
                    className={`text-[10px] font-black p-2 rounded-xl border-2 border-black transition-all uppercase ${
                      extrasSeleccionados.includes(extra.id) 
                      ? 'bg-green-500 text-white translate-y-1 shadow-none' 
                      : 'bg-white text-black shadow-[2px_2px_0px_0px_black]'
                    }`}
                  >
                    {extra.nombre} {extrasSeleccionados.includes(extra.id) ? '✅' : '+'}
                  </button>
                ))
              ) : (
                <p className="text-[10px] font-bold text-center col-span-2">No hay extras creados...</p>
              )}
            </div>
          </div>

          {/* Imagen */}
          <div className="bg-white border-4 border-black p-4 rounded-2xl text-center relative">
            <input type="file" accept="image/*" onChange={handleUpload} className="w-full text-xs font-black cursor-pointer opacity-0 absolute inset-0 z-10" />
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs font-black uppercase">
                {loading ? 'Subiendo...' : nuevo.imagen ? '✅ FOTO CARGADA' : '📷 SUBIR FOTO'}
              </span>
            </div>
          </div>

          <textarea placeholder="DESCRIPCIÓN BREVE..." className="w-full border-4 border-black p-4 rounded-2xl font-black h-20 resize-none outline-none focus:bg-white text-sm" onChange={e => setNuevo({...nuevo, descripcion: e.target.value})} />

          <div className="pt-2">
            <button type="submit" disabled={loading} className="w-full bg-[#D32F2F] text-white border-4 border-black py-5 rounded-[2.5rem] font-black text-2xl italic shadow-[8px_8px_0px_0px_black] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50">
              {loading ? 'PROCESANDO...' : '¡CREAR ITEM! 🚀'}
            </button>
            <button type="button" onClick={onClose} className="w-full font-black uppercase text-xs mt-4 hover:underline transition-all">
              MEJOR NO... (CERRAR)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}