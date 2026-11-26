// app/producto/[id]/page.tsx
"use client";

import { useEffect, useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Burger, Adicional } from '@/types';
import { useCartStore } from '@/store/cartStore';

// FIX #6: helper de imagen reutilizable (mismo criterio que BurgerCard)
function getImageUrl(imagen?: string | null): string {
    if (!imagen) return '/images/placeholder-krusty.webp';
    if (imagen.startsWith('file://')) return '/images/placeholder-krusty.webp';
    if (imagen.includes('supabase.co')) return imagen.split('?')[0];
    return imagen;
}

export default function ProductoDetalle() {
    const params = useParams();
    const id = params?.id ? String(params.id) : undefined;
    const router = useRouter();
    const addItem = useCartStore((state) => state.addItem);

    const [producto, setProducto] = useState<Burger | null>(null);
    const [adicionalesDisponibles, setAdicionalesDisponibles] = useState<Adicional[]>([]);
    const [extrasSeleccionados, setExtrasSeleccionados] = useState<Adicional[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [imageError, setImageError] = useState(false);

    const cashAudioRef = useRef<HTMLAudioElement | null>(null);
    const addingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const audio = new Audio('/sounds/cash-register.mp3');
        audio.volume = 0.4;
        audio.preload = 'auto';
        cashAudioRef.current = audio;

        return () => {
            audio.pause();
            cashAudioRef.current = null;
        };
    }, []);

    useEffect(() => {
        return () => {
            if (addingTimeoutRef.current) clearTimeout(addingTimeoutRef.current);
        };
    }, []);

    useEffect(() => {
        if (!showModal) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [showModal]);

    useEffect(() => {
        if (!id) {
            setLoading(false);
            setError('Producto no encontrado');
            return;
        }

        const controller = new AbortController();

        (async () => {
            try {
                setLoading(true);
                setError(null);

                const resProducto = await supabase
                    .from('productos')
                    .select(`
                        *,
                        producto_adicionales(
                            adicionales(id, nombre, precio, descripcion)
                        )
                    `)
                    .eq('id', id)
                    .single();

                if (controller.signal.aborted) return;
                if (resProducto.error) throw resProducto.error;
                if (!resProducto.data) throw new Error('Producto no encontrado');

                const adicionales = resProducto.data.producto_adicionales
                    ?.map((relacion: { adicionales: Adicional | null }) => relacion.adicionales)
                    .filter((extra: Adicional | null): extra is Adicional => extra !== null)
                    .sort((a: Adicional, b: Adicional) => a.nombre.localeCompare(b.nombre, 'es')) || [];

                setProducto(resProducto.data);
                setAdicionalesDisponibles(adicionales);
            } catch (err: any) {
                if (controller.signal.aborted) return;
                console.error('Error cargando datos:', err);
                setError(err?.message || 'No pudimos cargar el producto');
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        })();

        return () => controller.abort();
    }, [id]);

    const precioTotal = useMemo(() => {
        const base = Number(producto?.precio) || 0;
        const extras = extrasSeleccionados.reduce(
            (acc, cur) => acc + (Number(cur.precio) || 0),
            0
        );
        return base + extras;
    }, [producto, extrasSeleccionados]);

    const precioTotalFormateado = useMemo(
        () => precioTotal.toLocaleString('es-AR'),
        [precioTotal]
    );

    const toggleExtra = (extra: Adicional) => {
        setExtrasSeleccionados((prev) =>
            prev.some((e) => e.id === extra.id)
                ? prev.filter((e) => e.id !== extra.id)
                : [...prev, extra]
        );
    };

    const handleAdd = () => {
        if (!producto) return;

        if (cashAudioRef.current) {
            cashAudioRef.current.currentTime = 0;
            cashAudioRef.current.play().catch(() => { });
        }

        setIsAdding(true);
        addItem(producto, extrasSeleccionados);

        if (addingTimeoutRef.current) clearTimeout(addingTimeoutRef.current);
        addingTimeoutRef.current = setTimeout(() => setIsAdding(false), 800);
    };

    const closeModal = () => setShowModal(false);

    const imageUrl = getImageUrl(producto?.imagen);

    if (error) {
        return (
            <main className="min-h-dvh flex flex-col items-center justify-center bg-white px-6 text-center">
                <div className="text-6xl mb-4">🍔</div>
                <h1 className="text-2xl font-black uppercase italic mb-2">Ups...</h1>
                <p className="text-sm font-bold text-stone-500 mb-6 max-w-xs">{error}</p>
                <button
                    onClick={() => router.back()}
                    className="px-6 py-3 bg-[#FFCA28] border-4 border-black rounded-2xl font-black uppercase text-xs shadow-[4px_4px_0px_0px_black] active:translate-y-1 active:shadow-none transition-all"
                >
                    Volver
                </button>
            </main>
        );
    }

    if (loading) {
        return (
            <div className="min-h-dvh flex flex-col items-center justify-center bg-white">
                <div className="w-12 h-12 border-4 border-stone-100 border-t-[#FFCA28] rounded-full animate-spin" />
                <p className="mt-4 font-black italic uppercase text-xs tracking-widest text-black animate-pulse">
                    Cocinando...
                </p>
            </div>
        );
    }

    if (!producto) return null;

    return (
        <main className="min-h-dvh bg-white font-sans relative pb-8">
            {/* MODAL PANTALLA COMPLETA */}
            {showModal && createPortal(
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Imagen del producto"
                    className="fixed inset-0 z-[100000] bg-black flex items-center justify-center animate-in fade-in duration-300"
                    onClick={closeModal}
                >
                    <div
                        className="absolute right-6 z-[110]"
                        style={{ top: 'max(1.5rem, env(safe-area-inset-top))' }}
                    >
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                closeModal();
                            }}
                            aria-label="Cerrar"
                            className="bg-white/10 backdrop-blur-md text-white w-10 h-10 rounded-full flex items-center justify-center text-2xl border border-white/20 active:scale-95 transition-transform"
                        >
                            ×
                        </button>
                    </div>

                    <div
                        className="w-full h-full flex items-center justify-center p-4 overflow-auto"
                        style={{ touchAction: 'pinch-zoom' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={imageUrl}
                            alt={producto.nombre}
                            className="max-w-full max-h-full w-auto h-auto object-contain drop-shadow-2xl animate-in zoom-in duration-300"
                        />
                    </div>

                    <p className="absolute bottom-10 text-white/50 text-[10px] font-bold uppercase tracking-widest pointer-events-none">
                        Toca para cerrar
                    </p>
                </div>,
                document.body
            )}

            {/* ✅ BOTÓN VOLVER — z-[200] por encima del navbar (z-100), top-[92px] debajo de barrita+nav */}
            <div className="fixed z-[200] top-[92px] left-4 md:top-1/2 md:-translate-y-1/2 md:left-0 md:-ml-1">
                <div className="relative">
                    <div className="absolute inset-0 bg-[#FFCA28] rounded-full animate-ping opacity-25" />
                    <button
                        onClick={() => router.back()}
                        aria-label="Volver"
                        className="relative w-10 h-10 md:w-9 md:h-9 bg-white border-2 border-black rounded-full shadow-[2px_2px_0px_0px_black] active:translate-x-0.5 active:shadow-none transition-all flex items-center justify-center"
                    >
                        <span className="text-sm">⬅️</span>
                    </button>
                </div>
            </div>

            <div className="max-w-5xl mx-auto pt-16 md:pt-24 px-6 grid grid-cols-1 md:grid-cols-2 gap-8 md:items-center">

                {/* IMAGEN PRINCIPAL */}
                <div className="relative flex justify-center items-center h-fit pt-4">
                    <div className="absolute inset-0 bg-red-50 blur-[50px] rounded-full scale-110 opacity-60" />
                    <div
                        className="relative group cursor-pointer"
                        onClick={() => {
                            setImageError(false);
                            setShowModal(true);
                        }}
                    >
                        <img
                            src={imageError ? '/images/placeholder-krusty.webp' : imageUrl}
                            alt={producto.nombre}
                            onError={() => setImageError(true)}
                            className="w-full max-w-70 md:max-w-100 object-contain drop-shadow-2xl rounded-full active:scale-95 transition-transform duration-300"
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

                    <h1 className="text-2xl sm:text-3xl md:text-5xl font-black uppercase italic leading-[0.95] tracking-tight mb-4 text-black wrap-break-word">
                        {producto.nombre}
                    </h1>

                    <p className="text-xs font-bold text-stone-500 italic mb-6 leading-relaxed">
                        "{producto.descripcion}"
                    </p>

                    <div className="bg-stone-50 p-4 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_black] w-fit mb-8 flex items-center gap-4 self-center md:self-start">
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-stone-400 uppercase leading-none mb-1">
                                Total aproximado
                            </span>
                            <span className="text-2xl font-black italic tracking-tighter">
                                ${precioTotalFormateado}
                            </span>
                        </div>
                        <div className="w-8 h-8 bg-[#FFCA28] rounded-full border-2 border-black flex items-center justify-center text-sm">
                            🍔
                        </div>
                    </div>

                    {/* SECCIÓN ADICIONALES */}
                    {adicionalesDisponibles.length > 0 && (
                        <div className="bg-white border-2 border-black rounded-2xl p-4 mb-8">
                            <h3 className="font-black italic uppercase text-[10px] mb-4 flex items-center gap-2 text-stone-400">
                                ¿Lo tuneamos? <span className="text-base">🥓</span>
                            </h3>

                            <div className="flex flex-wrap gap-2">
                                {adicionalesDisponibles.map((extra, i) => {
                                    const isSelected = extrasSeleccionados.some((e) => e.id === extra.id);
                                    const precioExtra = (Number(extra.precio) || 0).toLocaleString('es-AR');
                                    return (
                                        <button
                                            key={extra.id ?? `extra-${i}`}
                                            onClick={() => toggleExtra(extra)}
                                            className={`min-h-11 px-4 py-2 rounded-xl border-2 text-xs font-black transition-all flex items-center gap-2 uppercase active:scale-95
                      ${isSelected
                                                    ? 'bg-black text-[#FFCA28] border-black shadow-[2px_2px_0px_0px_#FFCA28]'
                                                    : 'bg-white text-black border-stone-200'}`}
                                        >
                                            <span>{extra.nombre}</span>
                                            <span className={isSelected ? 'text-white' : 'text-stone-400'}>
                                                +${precioExtra}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* BOTÓN "AÑADIR" */}
                    <div className="w-full">
                        <button
                            onClick={handleAdd}
                            disabled={isAdding}
                            className={`group relative w-full py-4 rounded-2xl font-black uppercase transition-all border-4 border-black active:translate-y-1 shadow-[6px_6px_0px_0px_black]
                ${isAdding
                                    ? 'bg-green-500 text-white shadow-none'
                                    : 'bg-[#FFCA28] text-black'}`}
                        >
                            <span className="text-base md:text-lg tracking-tighter">
                                {isAdding ? '¡LISTO!' : `AGREGAR — $${precioTotalFormateado}`}
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}