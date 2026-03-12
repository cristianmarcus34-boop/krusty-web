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
    const [showModal, setShowModal] = useState(false);

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
                const resProducto = await supabase.from('productos').select('*').eq('id', id).single();
                const resAdicionales = await supabase.from('adicionales').select('*').order('nombre');

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
        cashAudioRef.current?.play().catch(() => { });
        setIsAdding(true);
        addItem(producto, extrasSeleccionados);
        setTimeout(() => setIsAdding(false), 800);
    };

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white">
            <div className="w-12 h-12 border-4 border-stone-100 border-t-[#FFCA28] rounded-full animate-spin" />
            <p className="mt-4 font-black italic uppercase text-xs tracking-widest text-black animate-pulse">Cocinando...</p>
        </div>
    );

    if (!producto) return null;

    return (
        <main className="min-h-screen bg-white pb-24 font-sans relative">

            {/* MODAL PANTALLA COMPLETA (Optimizado para Touch) */}
            {showModal && (
                <div 
                    className="fixed inset-0 z-[100] bg-black flex items-center justify-center animate-in fade-in duration-300"
                    onClick={() => setShowModal(false)}
                >
                    <div className="absolute top-safe mt-6 right-6 z-[110]">
                        <button className="bg-white/10 backdrop-blur-md text-white w-10 h-10 rounded-full flex items-center justify-center text-2xl border border-white/20">
                            ×
                        </button>
                    </div>
                    
                    {/* Contenedor de imagen con scroll/zoom táctil nativo */}
                    <div className="w-full h-full overflow-auto flex items-center justify-center p-4">
                        <img
                            src={producto.imagen || ''}
                            alt={producto.nombre}
                            className="max-w-none w-full h-auto object-contain drop-shadow-2xl animate-in zoom-in duration-300"
                            style={{ minHeight: '50vh' }}
                        />
                    </div>
                    
                    <p className="absolute bottom-10 text-white/50 text-[10px] font-bold uppercase tracking-widest">
                        Toca para cerrar
                    </p>
                </div>
            )}

            {/* BOTÓN VOLVER (Mobile Friendly) */}
            <div className="fixed left-0 top-1/2 -translate-y-1/2 z-[60] -ml-1">
                <div className="relative">
                    <div className="absolute inset-0 bg-[#FFCA28] rounded-full animate-ping opacity-25" />
                    <button
                        onClick={() => router.back()}
                        className="relative w-9 h-9 bg-white border-2 border-black rounded-full shadow-[2px_2px_0px_0px_black] active:translate-x-0.5 active:shadow-none transition-all flex items-center justify-center"
                    >
                        <span className="text-sm">⬅️</span>
                    </button>
                </div>
            </div>

            <div className="max-w-5xl mx-auto pt-8 md:pt-24 px-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

                {/* IMAGEN PRINCIPAL (Toque para zoom) */}
                <div className="relative flex justify-center items-center h-fit pt-4">
                    <div className="absolute inset-0 bg-red-50 blur-[50px] rounded-full scale-110 opacity-60" />
                    <div 
                        className="relative group cursor-pointer"
                        onClick={() => setShowModal(true)}
                    >
                        <img
                            src={producto.imagen || ''}
                            alt={producto.nombre}
                            className="w-full max-w-[280px] md:max-w-[400px] object-contain drop-shadow-2xl rounded-full active:scale-95 transition-transform duration-300"
                        />
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black text-white text-[8px] font-black px-3 py-1 rounded-full border-2 border-white shadow-lg uppercase tracking-tighter flex items-center gap-1">
                            <span>🔍</span> Ver detalle
                        </div>
                    </div>
                </div>

                {/* INFO */}
                <div className="flex flex-col">
                    <div className="mb-2">
                        <span className="bg-[#D32F2F] text-white text-[9px] font-black px-2 py-0.5 rounded border-2 border-black uppercase italic tracking-wider">
                            {producto.categoria}
                        </span>
                    </div>

                    <h1 className="text-3xl md:text-5xl font-black uppercase italic leading-none tracking-tight mb-4 text-black">
                        {producto.nombre}
                    </h1>

                    <p className="text-xs font-bold text-stone-500 italic mb-6 leading-relaxed">
                        "{producto.descripcion}"
                    </p>

                    {/* Card de Precio Centrada */}
                    <div className="bg-stone-50 p-4 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_black] w-fit mb-8 flex items-center gap-4 self-center">
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-stone-400 uppercase leading-none mb-1">Total aproximado</span>
                            <span className="text-2xl font-black italic tracking-tighter">${precioTotal.toLocaleString('es-AR')}</span>
                        </div>
                        <div className="w-8 h-8 bg-[#FFCA28] rounded-full border-2 border-black flex items-center justify-center text-sm">
                            🍔
                        </div>
                    </div>

                    {/* SECCIÓN ADICIONALES (Scroll Horizontal en Mobile si son muchos) */}
                    <div className="bg-white border-2 border-black rounded-2xl p-4 mb-8">
                        <h3 className="font-black italic uppercase text-[10px] mb-4 flex items-center gap-2 text-stone-400">
                            ¿Lo tuneamos? <span className="text-base">🥓</span>
                        </h3>

                        <div className="flex flex-wrap gap-2">
                            {adicionalesDisponibles.map(extra => {
                                const isSelected = extrasSeleccionados.some(e => e.id === extra.id);
                                return (
                                    <button
                                        key={extra.id}
                                        onClick={() => toggleExtra(extra)}
                                        className={`px-4 py-2 rounded-xl border-2 text-[10px] font-black transition-all flex items-center gap-2 uppercase active:scale-95
                                        ${isSelected
                                                ? 'bg-black text-[#FFCA28] border-black shadow-[2px_2px_0px_0px_#FFCA28]'
                                                : 'bg-white text-black border-stone-200'}`}
                                    >
                                        <span>{extra.nombre}</span>
                                        <span className={isSelected ? 'text-white' : 'text-stone-400'}>
                                            +${Number(extra.precio)}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* BOTÓN "AÑADIR" (Sticky opcional para Mobile) */}
                    <div className="fixed bottom-6 left-6 right-6 md:relative md:bottom-0 md:left-0 md:right-0 z-50">
                        <button
                            onClick={handleAdd}
                            disabled={isAdding}
                            className={`group relative w-full py-4 rounded-2xl font-black uppercase transition-all border-4 border-black active:translate-y-1 shadow-[6px_6px_0px_0px_black]
                            ${isAdding ? 'bg-green-500 text-white shadow-none' : 'bg-[#FFCA28] text-black'}`}
                        >
                            <span className="text-lg tracking-tighter">
                                {isAdding ? "¡LISTO!" : "AGREGAR AL CARRITO"}
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}