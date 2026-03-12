"use client";
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import ModalNuevoExtra from './ModalNuevoExtra';
import ModalBorrarKrusty from './ModalBorrarKrusty';

export default function TabAdicionales() {
  const [adicionales, setAdicionales] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [extraParaBorrar, setExtraParaBorrar] = useState<any | null>(null);

  const fetchAdicionales = useCallback(async () => {
    const { data } = await supabase.from('adicionales').select('*').order('nombre');
    if (data) setAdicionales(data);
  }, []);

  useEffect(() => { fetchAdicionales(); }, [fetchAdicionales]);

  // FUNCIÓN DE ELIMINACIÓN HÍBRIDA (Instantánea + Base de Datos)
  const ejecutarEliminacion = async () => {
    if (!extraParaBorrar) return;

    const idABorrar = extraParaBorrar.id;

    try {
      // 1. Lo quitamos de la pantalla al instante
      setAdicionales((prev) => prev.filter(a => a.id !== idABorrar));
      
      // 2. Cerramos el modal de borrado
      setExtraParaBorrar(null);

      // 3. Borramos en Supabase
      const { error } = await supabase
        .from('adicionales')
        .delete()
        .eq('id', idABorrar);

      if (error) {
        console.error("Error al borrar adicional:", error.message);
        alert("No se pudo eliminar el adicional.");
        fetchAdicionales(); // Recargamos si falló
      }
    } catch (err) {
      console.error("Error inesperado:", err);
      fetchAdicionales();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Botón para abrir el modal de nuevo extra */}
      <button 
        onClick={() => setShowModal(true)} 
        className="w-full bg-[#FFCA28] text-black border-8 border-black p-8 rounded-[3rem] font-black uppercase text-2xl italic shadow-[10px_10px_0px_0px_black] hover:-translate-y-1 active:translate-y-0 active:shadow-none transition-all"
      >
        + AGREGAR EXTRA (TOPPINGS) 🥓
      </button>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {adicionales.map((add) => (
          <div key={add.id} className="relative bg-white border-4 border-black p-6 rounded-[2.5rem] shadow-[6px_6px_0px_0px_black] flex flex-col justify-center hover:rotate-1 transition-transform">
            
            {/* Botón X para borrar */}
            <button 
              onClick={() => setExtraParaBorrar(add)}
              className="absolute -top-2 -right-2 bg-black text-white w-9 h-9 rounded-full border-4 border-white flex items-center justify-center font-black text-xs hover:scale-110 active:scale-90 transition-transform z-10"
            >
              ✕
            </button>

            <p className="font-black uppercase italic text-lg leading-tight text-black">{add.nombre}</p>
            <p className="font-black text-xl text-[#D32F2F]">${add.precio}</p>
          </div>
        ))}
      </div>

      {/* MODAL NUEVO: Solo se monta si showModal es true */}
      {showModal && (
        <ModalNuevoExtra 
          onClose={() => setShowModal(false)} 
          onSuccess={fetchAdicionales} 
        />
      )}

      {/* MODAL BORRAR: Se controla con el prop isOpen */}
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