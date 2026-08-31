// app/components/BannerNotificaciones.tsx
"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BannerNotificacionesProps {
    mostrar: boolean;
    onActivar: () => void;
    onCerrar?: () => void;
}

export default function BannerNotificaciones({
    mostrar,
    onActivar,
    onCerrar
}: BannerNotificacionesProps) {
    if (!mostrar) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ duration: 0.5, type: "spring" }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-md"
            >
                <div className="bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-4 relative overflow-hidden">
                    {/* Fondo decorativo */}
                    <div className="absolute -right-8 -top-8 w-24 h-24 bg-[#FFCA28] rounded-full opacity-10" />
                    <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-[#D32F2F] rounded-full opacity-10" />

                    <div className="relative flex items-start gap-3">
                        <div className="shrink-0 w-12 h-12 bg-[#FFCA28] rounded-full flex items-center justify-center border-2 border-black">
                            <span className="text-2xl">🔔</span>
                        </div>

                        <div className="flex-1 min-w-0">
                            <h4 className="font-black text-sm uppercase text-black">
                                ¡No te pierdas nada!
                            </h4>
                            <p className="text-xs font-bold text-stone-500 leading-tight">
                                Recibí notificaciones cuando tu pedido esté en camino o entregado.
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                                <button
                                    onClick={onActivar}
                                    className="bg-[#D32F2F] hover:bg-black text-white font-black text-xs px-4 py-2 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all"
                                >
                                    Activar 🔔
                                </button>
                                <button
                                    onClick={onCerrar}
                                    className="text-stone-400 hover:text-stone-600 font-black text-xs px-3 py-2"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>

                        {onCerrar && (
                            <button
                                onClick={onCerrar}
                                className="shrink-0 text-stone-400 hover:text-stone-600 text-lg font-black"
                                aria-label="Cerrar banner"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}