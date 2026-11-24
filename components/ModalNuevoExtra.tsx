"use client";
import { useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase';
import type { Adicional } from '@/types';

interface Props {
  adicional: Adicional | null;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

export default function ModalNuevoExtra({ adicional, onClose, onSuccess }: Props) {
  const [nuevo, setNuevo] = useState(() => ({
    nombre: adicional?.nombre ?? '',
    precio: adicional?.precio ?? 0,
    descripcion: adicional?.descripcion ?? ''
  }));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGuardando(true);
    setError('');

    try {
      const valores = {
        nombre: nuevo.nombre.trim(),
        precio: Number(nuevo.precio),
        descripcion: nuevo.descripcion.trim()
      };
      const resultado = adicional
        ? await supabase.from('adicionales').update(valores).eq('id', adicional.id)
        : await supabase.from('adicionales').insert([valores]);

      if (resultado.error) throw resultado.error;

      await onSuccess();
      onClose();
    } catch (err) {
      console.error('Error guardando adicional:', err);
      setError('No se pudo guardar el adicional. Revisá los datos e intentá nuevamente.');
    } finally {
      setGuardando(false);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[100000] flex items-center justify-center overflow-y-auto p-3 sm:p-6 bg-black/90">
      <div className="w-full max-w-md max-h-[calc(100vh-1.5rem)] overflow-y-auto bg-white border-4 sm:border-10 border-black p-5 sm:p-10 rounded-[2rem] sm:rounded-[4rem] shadow-[8px_8px_0px_0px_#FFCA28] sm:shadow-[20px_20px_0px_0px_#FFCA28]">
        <h2 className="text-2xl sm:text-4xl font-black uppercase italic mb-5 sm:mb-8 text-center">
          {adicional ? 'EDITAR ADICIONAL' : 'AGREGAR EXTRA'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <input
            required
            value={nuevo.nombre}
            placeholder="NOMBRE"
            className="w-full border-4 border-black p-4 sm:p-5 rounded-2xl font-black uppercase italic outline-none focus:bg-[#FFCA28]"
            onChange={e => setNuevo(prev => ({ ...prev, nombre: e.target.value }))}
          />
          <div className="flex items-center gap-3 sm:gap-4 bg-stone-100 border-4 border-black p-4 sm:p-5 rounded-2xl">
            <span className="font-black text-xl sm:text-2xl">$</span>
            <input
              required
              min="0"
              step="0.01"
              type="number"
              value={nuevo.precio}
              placeholder="PRECIO"
              className="w-full min-w-0 bg-transparent font-black text-xl sm:text-2xl outline-none"
              onChange={e => setNuevo(prev => ({ ...prev, precio: Number(e.target.value) }))}
            />
          </div>
          <textarea
            value={nuevo.descripcion}
            placeholder="DESCRIPCIÓN (OPCIONAL)"
            className="w-full resize-y border-4 border-black p-4 rounded-2xl font-bold outline-none focus:bg-stone-50"
            rows={3}
            onChange={e => setNuevo(prev => ({ ...prev, descripcion: e.target.value }))}
          />
          {error && <p role="alert" className="text-sm font-bold text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={guardando}
            className="w-full bg-black text-white border-4 border-black py-4 sm:py-6 rounded-2xl sm:rounded-[2.5rem] font-black text-xl sm:text-2xl italic shadow-[6px_6px_0px_0px_black] active:translate-y-1 transition-all disabled:opacity-60"
          >
            {guardando ? 'GUARDANDO...' : adicional ? 'GUARDAR CAMBIOS ✅' : 'CARGAR 🔥'}
          </button>
          <button type="button" onClick={onClose} className="w-full text-center font-black uppercase text-sm underline">
            SALIR
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}