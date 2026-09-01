// components/VersionUpdater.tsx
"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function VersionUpdater() {
    const [showUpdate, setShowUpdate] = useState(false);
    const [updating, setUpdating] = useState(false);

    // ✅ Detectar mensajes del Service Worker
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'NEW_VERSION_AVAILABLE') {
                console.log('🔄 Nueva versión disponible!');
                setShowUpdate(true);
            }
        };

        if (typeof navigator !== 'undefined' && navigator.serviceWorker) {
            navigator.serviceWorker.addEventListener('message', handleMessage);
        }

        // ✅ Verificar periódicamente si hay nueva versión
        const interval = setInterval(() => {
            if (navigator.serviceWorker) {
                navigator.serviceWorker.ready.then(registration => {
                    if (registration.waiting) {
                        console.log('🔄 Nueva versión detectada (waiting)');
                        setShowUpdate(true);
                    }
                });
            }
        }, 30000);

        return () => {
            if (typeof navigator !== 'undefined' && navigator.serviceWorker) {
                navigator.serviceWorker.removeEventListener('message', handleMessage);
            }
            clearInterval(interval);
        };
    }, []);

    const handleUpdate = async () => {
        setUpdating(true);

        try {
            const registration = await navigator.serviceWorker.ready;

            if (registration.waiting) {
                registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            }

            if ('caches' in window) {
                const cacheKeys = await caches.keys();
                await Promise.all(
                    cacheKeys.map(key => caches.delete(key))
                );
                console.log('🧹 Caché limpiado');
            }

            setTimeout(() => {
                window.location.reload();
            }, 500);

        } catch (error) {
            console.error('❌ Error actualizando:', error);
            window.location.reload();
        }
    };

    const handleLater = () => {
        setShowUpdate(false);
        setTimeout(() => {
            setShowUpdate(true);
        }, 60 * 60 * 1000);
    };

    return (
        <AnimatePresence>
            {showUpdate && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-20 left-4 right-4 z-9999 max-w-md mx-auto pointer-events-none"
                >
                    <div className="bg-[#1a1a1a] border-4 border-[#FAD02C] rounded-2xl shadow-[10px_10px_0px_0px_black] p-4 pointer-events-auto">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#FAD02C]/20 flex items-center justify-center shrink-0 border-2 border-[#FAD02C]">
                                <span className="text-xl">🔄</span>
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="font-black text-white text-sm uppercase tracking-tighter">
                                    ¡Nueva versión disponible!
                                </p>
                                <p className="text-stone-400 text-xs font-bold mt-0.5">
                                    Actualizá la app para disfrutar de las últimas mejoras.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2 mt-3">
                            <button
                                onClick={handleLater}
                                disabled={updating}
                                className="flex-1 bg-stone-800 text-white font-black py-2 rounded-xl border-2 border-stone-700 hover:bg-stone-700 transition-colors text-xs disabled:opacity-50"
                            >
                                ⏰ Después
                            </button>
                            <button
                                onClick={handleUpdate}
                                disabled={updating}
                                className="flex-1 bg-[#FAD02C] text-black font-black py-2 rounded-xl border-2 border-black hover:bg-[#e6b800] transition-colors text-xs disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {updating ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                        Actualizando...
                                    </>
                                ) : (
                                    '🔄 Actualizar ahora'
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}