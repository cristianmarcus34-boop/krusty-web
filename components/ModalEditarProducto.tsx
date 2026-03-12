"use client";
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface ModalEditarProps {
  producto: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalEditarProducto({ producto, onClose, onSuccess }: ModalEditarProps) {
  const [loading, setLoading] = useState(false);
  const [todosLosExtras, setTodosLosExtras] = useState<any[]>([]);
  const [extrasSeleccionados, setExtrasSeleccionados] = useState<number[]>([]);
  const [editado, setEditado] = useState({ ...producto });

  // Memorizamos la carga para evitar bucles en el build
  const cargarDatosPrevios = useCallback(async () => {
    if (!producto?.id) return;
    setLoading(true);
    try {
      // Cargar adicionales disponibles
      const { data: extras } = await supabase.from('adicionales').select('*').order('nombre');
      if (extras) setTodosLosExtras(extras);

      // Cargar adicionales ya vinculados
      const { data: actuales } = await supabase
        .from('producto_adicionales')
        .select('adicional_id')
        .eq('producto_id', producto.id);

      if (actuales) {
        setExtrasSeleccionados(actuales.map((a: any) => a.adicional_id));
      }
    } catch (err) {
      console.error("Error cargando datos:", err);
    } finally {
      setLoading(false);
    }
  }, [producto?.id]);

  useEffect(() => {
    cargarDatosPrevios();
  }, [cargarDatosPrevios]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const fileName = `${Date.now()}.${file.name.split('.').pop()}`;
    
    try {
      const { error: uploadError } = await supabase.storage
        .from('krusty_imagenes')
        .upload(`productos/${fileName}`, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('krusty_imagenes')
        .getPublicUrl(`productos/${fileName}`);
      
      setEditado((prev: any) => ({ ...prev, imagen: publicUrl }));
    } catch (err: any) {
      alert("Error al subir imagen: " + err.message);
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
    setLoading(true);
    try {
      const { error: errorProd } = await supabase
        .from('productos')
        .update({
          nombre: editado.nombre,
          precio: Number(editado.precio),
          categoria: editado.categoria,
          descripcion: editado.descripcion,
          imagen: editado.imagen
        })
        .eq('id', producto.id);

      if (errorProd) throw errorProd;

      // Limpieza y re-inserción de extras
      await supabase.from('producto_adicionales').delete().eq('producto_id', producto.id);

      if (extrasSeleccionados.length > 0) {
        const relaciones = extrasSeleccionados.map(extraId => ({
          producto_id: producto.id,
          adicional_id: extraId
        }));
        await supabase.from('producto_adicionales').insert(relaciones);
      }
      
      onSuccess();
      onClose();
    } catch (err: any) {
      alert("Error al actualizar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!producto) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/90 backdrop-blur-sm">
      <div className="bg-[#4CAF50] border-t-8 sm:border-[10px] border-black p-4 sm:p-8 rounded-t-[3rem] sm:rounded-[4rem] w-full max-w-lg h-[92vh] sm:h-auto overflow-y-auto no-scrollbar shadow-[0px_-10px_0px_0px_rgba(0,0,0,1)] sm:shadow-[20px_20px_0px_0px_rgba(0,0,0,1)]">
        
        <h2 className="text-3xl sm:text-4xl font-black uppercase italic mb-6 text-center text-white drop-shadow-[4px_4px_0px_rgba(0,0,0,1)] leading-tight">
          EDITAR ITEM ✏️
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4 pb-10 sm:pb-0">
          <input 
            required 
            value={editado.nombre} 
            className="w-full border-4 border-black p-3 sm:p-4 rounded-2xl font-black italic outline-none uppercase text-sm sm:text-base" 
            onChange={e => setEditado({...editado, nombre: e.target.value.toUpperCase()})} 
          />

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black">$</span>
                <input 
                    required 
                    type="number" 
                    value={editado.precio} 
                    className="w-full border-4 border-black p-3 sm:p-4 pl-8 rounded-2xl font-black shadow-[4px_4px_0px_0px_black] outline-none" 
                    onChange={e => setEditado({...editado, precio: Number(e.target.value)})} 
                />
            </div>
            <select 
                value={editado.categoria} 
                className="flex-1 border-4 border-black p-3 sm:p-4 rounded-2xl font-black outline-none bg-white text-sm" 
                onChange={e => setEditado({...editado, categoria: e.target.value})}
            >
              <option value="burgers">BURGERS</option>
              <option value="bebidas">BEBIDAS</option>
              <option value="postres">POSTRES</option>
              <option value="combos">COMBOS</option>
            </select>
          </div>

          <div className="space-y-2">
            <p className="font-black text-[10px] sm:text-xs uppercase text-white ml-2 italic">Gestionar Extras:</p>
            <div className="grid grid-cols-2 gap-2 bg-white/30 border-4 border-black border-dashed p-3 rounded-2xl max-h-40 overflow-y-auto no-scrollbar">
              {todosLosExtras.map((extra) => (
                <button
                  key={extra.id}
                  type="button"
                  onClick={() => toggleExtra(extra.id)}
                  className={`text-[10px] font-black p-2.5 rounded-xl border-2 border-black transition-all uppercase ${
                    extrasSeleccionados.includes(extra.id) 
                    ? 'bg-yellow-400 text-black translate-y-1 shadow-none' 
                    : 'bg-white text-black opacity-60'
                  }`}
                >
                  {extra.nombre} {extrasSeleccionados.includes(extra.id) ? '✅' : '+'}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border-4 border-black p-3 rounded-2xl text-center relative hover:bg-stone-50 transition-colors">
            <input 
                type="file" 
                accept="image/*" 
                onChange={handleUpload} 
                className="w-full text-xs font-black cursor-pointer opacity-0 absolute inset-0 z-10" 
            />
            <span className="text-[10px] sm:text-xs font-black uppercase">
                {loading ? 'Subiendo...' : '📷 CAMBIAR FOTO'}
            </span>
          </div>

          <textarea 
            value={editado.descripcion || ''} 
            className="w-full border-4 border-black p-3 rounded-2xl font-black h-24 resize-none outline-none text-xs sm:text-sm" 
            placeholder="Descripción..."
            onChange={e => setEditado({...editado, descripcion: e.target.value})} 
          />

          <div className="space-y-3 pt-2">
            <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-black text-white border-4 border-white py-4 sm:py-5 rounded-[2rem] font-black text-xl sm:text-2xl italic shadow-[6px_6px_0px_0px_rgba(0,0,0,0.5)] active:translate-y-1 transition-all"
            >
              {loading ? 'CARGANDO...' : 'GUARDAR ✅'}
            </button>
            <button 
                type="button" 
                onClick={onClose} 
                className="w-full font-black uppercase text-[10px] sm:text-xs text-white underline decoration-2 underline-offset-4"
            >
              VOLVER ATRÁS
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}