"use client";
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase';

const BUCKET_IMAGENES = 'productos_imagenes';

export default function ModalNuevoProducto({ onClose, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const [todosLosExtras, setTodosLosExtras] = useState<any[]>([]);
  const [extrasSeleccionados, setExtrasSeleccionados] = useState<number[]>([]);
  const [nuevo, setNuevo] = useState({
    nombre: '',
    precio: 0,
    categoria: 'hamburguesas',
    descripcion: '',
    imagen: '',
    disponible: true,
  });

  useEffect(() => {
    const fetchExtras = async () => {
      const { data } = await supabase.from('adicionales').select('*').order('nombre');
      if (data) setTodosLosExtras(data);
    };
    fetchExtras();
  }, []);

  useEffect(() => {
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflowAnterior;
    };
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}.${ext}`;

    try {
      const { error } = await supabase.storage
        .from(BUCKET_IMAGENES)
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_IMAGENES)
        .getPublicUrl(fileName);

      setNuevo(prev => ({ ...prev, imagen: publicUrl }));
    } catch (err: any) {
      alert("Error al subir imagen: " + (err?.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const toggleExtra = (id: number) => {
    setExtrasSeleccionados(prev =>
      prev.includes(id) ? prev.filter(eId => eId !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevo.imagen && nuevo.disponible) {
      return alert("¡Subí la foto, muchacho!");
    }
    setLoading(true);

    try {
      const { data: productoInsertado, error: errorProd } = await supabase
        .from('productos')
        .insert([{
          ...nuevo,
          precio: Number(nuevo.precio),
          disponible: Boolean(nuevo.disponible),
        }])
        .select()
        .single();

      if (errorProd) throw errorProd;

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

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#FFCA28] border-[10px] border-black p-6 sm:p-8 rounded-[3rem] sm:rounded-[4rem] w-full max-w-lg my-auto max-h-[92dvh] overflow-y-auto no-scrollbar shadow-[20px_20px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-3xl sm:text-4xl font-black uppercase italic mb-6 text-center tracking-tighter">NUEVO ITEM 🔥</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <input
              required
              placeholder="NOMBRE DEL PRODUCTO"
              className="w-full border-4 border-black p-4 rounded-2xl font-black italic outline-none focus:bg-white"
              onChange={e => setNuevo({ ...nuevo, nombre: e.target.value.toUpperCase() })}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <input
                required
                type="number"
                placeholder="PRECIO"
                className="w-full border-4 border-black p-4 rounded-2xl font-black shadow-[4px_4px_0px_0px_black] outline-none bg-white"
                onChange={e => setNuevo({ ...nuevo, precio: Number(e.target.value) })}
              />
            </div>
            <select
              value={nuevo.categoria}
              className="flex-1 border-4 border-black p-4 rounded-2xl font-black outline-none bg-white"
              onChange={e => setNuevo({ ...nuevo, categoria: e.target.value })}
            >
              <option value="hamburguesas">BURGERS 🍔</option>
              <option value="acompañamientos">ACOMPAÑAMIENTOS 🍟</option>
              <option value="bebidas">BEBIDAS 🥤</option>
              <option value="postres">POSTRES 🍦</option>
            </select>
          </div>

          <label className="flex items-center gap-3 bg-white border-4 border-black p-3 rounded-2xl cursor-pointer select-none">
            <input
              type="checkbox"
              checked={Boolean(nuevo.disponible)}
              onChange={e => setNuevo({ ...nuevo, disponible: e.target.checked })}
              className="w-5 h-5 accent-[#D32F2F] cursor-pointer"
            />
            <span className="font-black text-xs uppercase">
              {nuevo.disponible ? '✅ Disponible ahora' : '⛔ Cargar como Sin stock'}
            </span>
          </label>

          <div className="space-y-2">
            <p className="font-black text-xs uppercase italic ml-2">Seleccionar Extras Permitidos:</p>
            <div className="grid grid-cols-2 gap-2 bg-white/50 border-4 border-black border-dashed p-3 rounded-2xl max-h-32 overflow-y-auto no-scrollbar">
              {todosLosExtras.length > 0 ? (
                todosLosExtras.map((extra) => (
                  <button
                    key={extra.id}
                    type="button"
                    onClick={() => toggleExtra(extra.id)}
                    className={`text-[10px] font-black p-2 rounded-xl border-2 border-black transition-all uppercase ${extrasSeleccionados.includes(extra.id)
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

          <div className="bg-white border-4 border-black p-4 rounded-2xl text-center relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="w-full text-xs font-black cursor-pointer opacity-0 absolute inset-0 z-10"
            />
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs font-black uppercase">
                {loading ? 'Subiendo...' : nuevo.imagen ? '✅ FOTO CARGADA' : '📷 SUBIR FOTO (OPCIONAL SI ES SIN STOCK)'}
              </span>
            </div>
          </div>

          <textarea
            placeholder="DESCRIPCIÓN BREVE..."
            className="w-full border-4 border-black p-4 rounded-2xl font-black h-20 resize-none outline-none focus:bg-white text-sm"
            onChange={e => setNuevo({ ...nuevo, descripcion: e.target.value })}
          />

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#D32F2F] text-white border-4 border-black py-5 rounded-[2.5rem] font-black text-2xl italic shadow-[8px_8px_0px_0px_black] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50"
            >
              {loading ? 'PROCESANDO...' : '¡CREAR ITEM! 🚀'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full font-black uppercase text-xs mt-4 hover:underline transition-all"
            >
              MEJOR NO... (CERRAR)
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}