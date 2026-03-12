"use client";

import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Burger, Adicional } from '@/types';
import { useCartStore } from '@/store/cartStore';

export default function ProductoDetalle() {
    const { id } = useParams();
    const router = useRouter();
    const addItem = useCartStore((state) => state.addItem);

    const [producto, setProducto] = useState<Burger | null>(null);
    const [adicionalesDisponibles, setAdicionalesDisponibles] = useState<Adicional[]>([]);
    const [extrasSeleccionados, setExtrasSeleccionados] = useState<Adicional[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    const cashAudioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const audio = new Audio('/sounds/cash-register.mp3');
            audio.volume = 0.4;
            cashAudioRef.current = audio;
        }

        const fetchData = async () => {
            if (!id) return;
            try {
                setLoading(true);

                // 1. Traemos el producto
                const resProducto = await supabase.from('productos').select('*').eq('id', id).single();

                // 2. Traemos todos los adicionales (Aseguramos que aparezcan)
                const resAdicionales = await supabase.from('adicionales').select('*');

                if (resProducto.data) {
                    setProducto(resProducto.data);
                    if (resAdicionales.data) {
                        setAdicionalesDisponibles(resAdicionales.data as Adicional[]);
                    }
                }
            } catch (err) {
                console.error("Error cargando datos:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const precioTotal = useMemo(() => {
        const base = Number(producto?.precio) || 0;
        const extras = extrasSeleccionados.reduce((acc, cur) => acc + (Number(cur.precio) || 0), 0);
        return base + extras;
    }, [producto, extrasSeleccionados]);

    const toggleExtra = (extra: Adicional) => {
        setExtrasSeleccionados(prev =>
            prev.some(e => e.id === extra.id) ? prev.filter(e => e.id !== extra.id) : [...prev, extra]
        );
    };

    const handleAdd = () => {
        if (!producto) return;
        cashAudioRef.current?.play().catch(() => {});
        setIsAdding(true);
        addItem(producto, extrasSeleccionados);
        setTimeout(() => setIsAdding(false), 800);
    };

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white">
            <div className="w-16 h-16 border-[6px] border-stone-100 border-t-[#FFCA28] rounded-full animate-spin" />
            <p className="mt-6 font-black italic uppercase tracking-widest text-black animate-pulse">Cocinando...</p>
        </div>
    );

    if (!producto) return null;

    return (
        <main className="min-h-screen bg-[#fafafa] pb-20 font-sans">
            {/* Botón Volver - Estilo Flotante */}
            <div className="fixed top-6 left-6 z-[60]">
                <button 
                    onClick={() => router.back()} 
                    className="w-14 h-14 bg-white border-4 border-black rounded-2xl shadow-[4px_4px_0px_0px_black] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center group"
                >
                    <span className="text-2xl group-hover:scale-125 transition-transform">⬅️</span>
                </button>
            </div>

            <div className="max-w-6xl mx-auto pt-20 md:pt-32 px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
                
                {/* LADO IZQUIERDO: Hero Image con Glow */}
                <div className="relative flex justify-center items-center md:sticky md:top-32 h-fit">
                    <div className="absolute inset-0 bg-[#FFCA28]/20 blur-[100px] rounded-full scale-125 animate-pulse" />
                    <img 
                        src={producto.imagen || ''} 
                        alt={producto.nombre} 
                        className="relative w-full max-w-[500px] object-contain drop-shadow-[0_35px_60px_rgba(0,0,0,0.3)] hover:rotate-2 transition-transform duration-700" 
                    />
                </div>

                {/* LADO DERECHO: Info y Configuración */}
                <div className="flex flex-col">
                    <div className="mb-4">
                        <span className="bg-[#D32F2F] text-white text-[10px] font-black px-3 py-1 rounded-md border-2 border-black shadow-[3px_3px_0px_0px_black] uppercase italic">
                            {producto.categoria}
                        </span>
                    </div>

                    <h1 className="text-6xl md:text-8xl font-black uppercase italic leading-[0.8] tracking-tighter mb-4 text-black">
                        {producto.nombre}
                    </h1>
                    
                    <p className="text-xl font-bold text-stone-500 italic mb-10 leading-snug max-w-md">
                        "{producto.descripcion}"
                    </p>

                    {/* Card de Precio */}
                    <div className="bg-white p-6 rounded-[2rem] border-4 border-black shadow-[8px_8px_0px_0px_black] w-fit mb-12 flex items-center gap-6">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-stone-400 uppercase leading-none mb-1">Total aproximado</span>
                            <span className="text-5xl font-black italic tracking-tighter">${precioTotal.toLocaleString('es-AR')}</span>
                        </div>
                        <div className="w-12 h-12 bg-[#FFCA28] rounded-full border-2 border-black flex items-center justify-center text-xl">
                            🍔
                        </div>
                    </div>

                    {/* SECCIÓN ADICIONALES */}
                    <div className="bg-stone-100 border-4 border-black rounded-[2.5rem] p-6 md:p-8 mb-10">
                        <h3 className="font-black italic uppercase text-sm mb-6 flex items-center gap-2">
                            ¿Lo tuneamos? <span className="text-lg">🥓</span>
                        </h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {adicionalesDisponibles.length > 0 ? (
                                adicionalesDisponibles.map(extra => {
                                    const isSelected = extrasSeleccionados.some(e => e.id === extra.id);
                                    return (
                                        <button 
                                            key={extra.id} 
                                            onClick={() => toggleExtra(extra)}
                                            className={`group relative px-5 py-4 border-4 rounded-2xl text-[11px] font-black transition-all flex items-center justify-between uppercase
                                            ${isSelected 
                                                ? 'bg-black text-[#FFCA28] border-black translate-y-1 shadow-none' 
                                                : 'bg-white text-black border-black shadow-[4px_4px_0px_0px_black] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_black] active:translate-y-0.5'}`}
                                        >
                                            <div className="flex flex-col items-start">
                                                <span>{extra.nombre}</span>
                                                <span className={`text-[9px] mt-0.5 ${isSelected ? 'text-stone-400' : 'text-stone-500'}`}>
                                                    +${Number(extra.precio).toLocaleString('es-AR')}
                                                </span>
                                            </div>
                                            <div className={`w-6 h-6 rounded-full border-2 border-black flex items-center justify-center transition-colors
                                                ${isSelected ? 'bg-[#FFCA28]' : 'bg-stone-50'}`}>
                                                {isSelected && <span className="text-black text-[10px]">✔</span>}
                                            </div>
                                        </button>
                                    );
                                })
                            ) : (
                                <p className="text-xs font-bold italic text-stone-400">Cargando extras...</p>
                            )}
                        </div>
                    </div>

                    {/* BOTÓN "AÑADIR" */}
                    <button 
                        onClick={handleAdd} 
                        disabled={isAdding}
                        className={`group relative w-full py-7 rounded-[3rem] font-black uppercase transition-all border-4 border-black active:translate-y-2 overflow-hidden
                        ${isAdding 
                            ? 'bg-green-500 text-white shadow-none' 
                            : 'bg-[#FFCA28] text-black shadow-[12px_12px_0px_0px_black] hover:bg-[#D32F2F] hover:text-white hover:-translate-y-1 hover:shadow-[15px_15px_0px_0px_black]'}`}
                    >
                        <div className="relative z-10 flex flex-col items-center">
                            <span className="text-3xl tracking-tighter">
                                {isAdding ? "¡D'OH! ADENTRO" : "¡MARCHA UNO!"}
                            </span>
                            {!isAdding && <span className="text-[10px] opacity-60 mt-1 italic">Click para agregar al carrito</span>}
                        </div>
                        <div className="absolute top-0 -left-full w-full h-full bg-white/20 skew-x-[-20deg] group-hover:left-[120%] transition-all duration-1000 z-0" />
                    </button>
                </div>
            </div>
        </main>
    );
}