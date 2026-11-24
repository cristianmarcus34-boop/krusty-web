"use client";
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Adicional } from '@/types';
import ModalNuevoExtra from './ModalNuevoExtra';
import ModalBorrarKrusty from './ModalBorrarKrusty';

export default function TabAdicionales() {
  const [adicionales, setAdicionales] = useState<Adicional[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [extraAEditar, setExtraAEditar] = useState<Adicional | null>(null);
  const [extraParaBorrar, setExtraParaBorrar] = useState<Adicional | null>(null);

  const fetchAdicionales = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('adicionales')
        .select('*')
        .order('nombre');

      if (error) {
        console.error('Error fetching adicionales:', error);
        return;
      }

      if (data) setAdicionales(data);
    } catch (err) {
      console.error('Error inesperado:', err);
    }
  }, []);

  useEffect(() => { fetchAdicionales(); }, [fetchAdicionales]);

  const ejecutarEliminacion = async () => {
    if (!extraParaBorrar) return;
    const idABorrar = extraParaBorrar.id;

    try {
      setAdicionales((prev) => prev.filter(a => a.id !== idABorrar));
      setExtraParaBorrar(null);

      const { error } = await supabase
        .from('adicionales')
        .delete()
        .eq('id', idABorrar);

      if (error) {
        console.error("Error al borrar adicional:", error.message);
        alert("No se pudo eliminar el adicional.");
        fetchAdicionales();
      }
    } catch (err) {
      console.error("Error inesperado:", err);
      fetchAdicionales();
    }
  };

  return (
    <div className="space-y-5 sm:space-y-8 animate-in fade-in duration-500">
      <button
        onClick={() => {
          setExtraAEditar(null);
          setShowModal(true);
        }}
        className="w-full bg-[#FFCA28] text-black border-4 sm:border-8 border-black p-4 sm:p-8 rounded-2xl sm:rounded-[3rem] font-black uppercase text-lg sm:text-2xl italic leading-tight shadow-[6px_6px_0px_0px_black] sm:shadow-[10px_10px_0px_0px_black] hover:-translate-y-1 active:translate-y-0 active:shadow-none transition-all"
      >
        + AGREGAR EXTRA (TOPPINGS) 🥓
      </button>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
        {adicionales.map((add) => (
          <div key={add.id} className="relative min-w-0 bg-white border-4 border-black p-4 sm:p-6 rounded-[1.75rem] sm:rounded-[2.5rem] shadow-[4px_4px_0px_0px_black] sm:shadow-[6px_6px_0px_0px_black] flex flex-col justify-center hover:rotate-1 transition-transform">

            <button
              onClick={() => setExtraParaBorrar(add)}
              aria-label={`Eliminar ${add.nombre}`}
              className="absolute -top-2 -right-2 bg-black text-white w-11 h-11 rounded-full border-4 border-white flex items-center justify-center font-black text-xs hover:scale-110 active:scale-90 transition-transform z-10"
            >
              ✕
            </button>

            <p className="font-black uppercase italic text-lg leading-tight text-black break-words">{add.nombre}</p>
            <p className="font-black text-xl text-[#D32F2F]">${add.precio || 0}</p>
            {add.descripcion && (
              <p className="text-xs text-stone-500 mt-1 break-words">{add.descripcion}</p>
            )}
            <button
              onClick={() => {
                setExtraAEditar(add);
                setShowModal(true);
              }}
              className="mt-4 min-h-11 w-full rounded-xl border-2 border-black bg-[#FFCA28] px-3 py-2 font-black uppercase text-sm italic shadow-[3px_3px_0px_0px_black] active:translate-y-0.5 active:shadow-none"
            >
              EDITAR ✏️
            </button>
          </div>
        ))}
      </div>

      {showModal && (
        <ModalNuevoExtra
          adicional={extraAEditar}
          onClose={() => {
            setShowModal(false);
            setExtraAEditar(null);
          }}
          onSuccess={fetchAdicionales}
        />
      )}

      <ModalBorrarKrusty
        isOpen={extraParaBorrar !== null}
        mensaje="¿BORRAR ESTE ADICIONAL?"
        itemNombre={extraParaBorrar?.nombre}
        onConfirm={ejecutarEliminacion}
        onCancel={() => setExtraParaBorrar(null)}
      />
    </div>
  );
}