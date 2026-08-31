// components/PushBanner.tsx
"use client";

import { motion } from 'framer-motion';
import Link from 'next/link';

interface PushBannerProps {
    title: string;
    body: string;
    url?: string;
    onClose: () => void;
}

export default function PushBanner({ title, body, url, onClose }: PushBannerProps) {
    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full"
        >
            <div className="bg-[#1a1a1a] border-4 border-[#FAD02C] rounded-2xl shadow-[10px_10px_0px_0px_black] overflow-hidden">
                {/* Barra superior amarilla */}
                <div className="bg-[#FAD02C] h-1.5" />

                <div className="p-4">
                    <div className="flex items-start gap-3">
                        {/* Icono */}
                        <div className="w-10 h-10 rounded-full bg-[#FAD02C]/20 flex items-center justify-center shrink-0 border-2 border-[#FAD02C]">
                            <span className="text-xl">🔔</span>
                        </div>

                        {/* Contenido */}
                        <div className="flex-1 min-w-0">
                            <p className="font-black text-white text-sm uppercase tracking-tighter">
                                {title}
                            </p>
                            <p className="text-stone-400 text-sm font-bold mt-0.5">
                                {body}
                            </p>
                        </div>

                        {/* Botón cerrar */}
                        <button
                            onClick={onClose}
                            className="text-stone-500 hover:text-white transition-colors shrink-0 text-lg"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Botón de acción */}
                    {url && (
                        <Link
                            href={url}
                            onClick={onClose}
                            className="mt-3 block w-full text-center bg-[#FAD02C] text-black font-black py-2.5 rounded-xl border-2 border-black hover:bg-[#e6b800] transition-colors text-xs uppercase tracking-wider"
                        >
                            👀 Ver pedido
                        </Link>
                    )}
                </div>
            </div>
        </motion.div>
    );
}