"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ModalNuevoExtra({ onClose, onSuccess }: any) {
  const [nuevo, setNuevo] = useState({ nombre: '', precio: 0 });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    await supabase.from('adicionales').insert([nuevo]);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90">
      <div className="bg-white border-[10px] border-black p-10 rounded-[4rem] w-full max-w-md shadow-[20px_20px_0px_0px_#FFCA28]">
        <h2 className="text-4xl font-black uppercase italic mb-8 text-center">AGREGAR EXTRA</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input required placeholder="NOMBRE" className="w-full border-4 border-black p-5 rounded-2xl font-black uppercase italic outline-none focus:bg-[#FFCA28]" onChange={e => setNuevo({...nuevo, nombre: e.target.value})} />
          <div className="flex items-center gap-4 bg-stone-100 border-4 border-black p-5 rounded-2xl">
            <span className="font-black text-2xl">$</span>
            <input required type="number" placeholder="PRECIO" className="w-full bg-transparent font-black text-2xl outline-none" onChange={e => setNuevo({...nuevo, precio: Number(e.target.value)})} />
          </div>
          <button type="submit" className="w-full bg-black text-white border-4 border-black py-6 rounded-[2.5rem] font-black text-2xl italic shadow-[6px_6px_0px_0px_black] active:translate-y-1 transition-all">CARGAR 🔥</button>
          <button type="button" onClick={onClose} className="w-full text-center font-black uppercase text-sm underline">SALIR</button>
        </form>
      </div>
    </div>
  );
}