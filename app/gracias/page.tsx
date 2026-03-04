"use client";
import Link from 'next/link';
import { useEffect } from 'react';

export default function GraciasPage() {
  
  useEffect(() => {
    // Sonido de Krusty al llegar
    const sound = new Audio('https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3');
    sound.volume = 0.3;
    sound.play().catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#FFCA28] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border-[8px] border-black p-8 shadow-[12px_12px_0px_0px_black] text-center relative overflow-hidden">
        
        {/* GIF de Homero / Krusty */}
        <div className="mb-6 border-4 border-black overflow-hidden rounded-xl shadow-[4px_4px_0px_0px_black]">
          <img 
            src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJndzR6dzRndzR6dzRndzR6dzRndzR6dzRndzR6dzRndzR6dyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKVUn7iM8FMEU24/giphy.gif" 
            alt="Homero comiendo"
            className="w-full object-cover"
          />
        </div>

        <h1 className="text-5xl font-black italic uppercase tracking-tighter text-[#D32F2F] leading-none mb-4">
          ¡PEDIDO <br /> <span className="text-black">ENVIADO!</span>
        </h1>

        <div className="bg-[#E8F5E9] border-4 border-black p-4 rounded-xl mb-6">
          <p className="text-lg font-black uppercase italic tracking-tight text-green-700">
            ¡Ujuuu! Ya estamos cocinando.
          </p>
          <p className="text-[10px] font-bold text-stone-500 mt-2 uppercase">
            Recuerda enviar el mensaje de WhatsApp que se abrió automáticamente.
          </p>
        </div>

        <Link 
          href="/"
          className="inline-block w-full bg-[#D32F2F] text-white border-4 border-black p-4 rounded-xl font-black uppercase italic text-xl shadow-[6px_6px_0px_0px_black] active:shadow-none active:translate-y-1 transition-all"
        >
          PEDIR OTRA MÁS 🍔
        </Link>

        <p className="mt-6 text-[10px] font-black uppercase text-stone-400">
          "Krusty Burger: El sabor que te deja pidiendo más... ¡o pidiendo un médico!"
        </p>
      </div>
    </div>
  );
}