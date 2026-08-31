// components/admin/ModalRecompensa.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface Recompensa {
    id: number;
    nombre: string;
    descripcion: string;
    puntos_necesarios: number;
    tipo: 'DESCUENTO' | 'PRODUCTO_GRATIS' | 'ENVIO_GRATIS';
    valor_descuento: number;
    activa: boolean;
}

interface ModalRecompensaProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    recompensa?: Recompensa | null;
    loading?: boolean;
}

const TIPOS_RECOMPENSA = [
    { id: 'DESCUENTO', label: '💰 Descuento', color: '#F5C518' },
    { id: 'PRODUCTO_GRATIS', label: '🍔 Producto Gratis', color: '#43A047' },
    { id: 'ENVIO_GRATIS', label: '🚚 Envío Gratis', color: '#3949AB' },
];

export default function ModalRecompensa({
    isOpen,
    onClose,
    onSave,
    recompensa,
    loading = false,
}: ModalRecompensaProps) {
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [puntosNecesarios, setPuntosNecesarios] = useState('');
    const [tipo, setTipo] = useState<'DESCUENTO' | 'PRODUCTO_GRATIS' | 'ENVIO_GRATIS'>('DESCUENTO');
    const [valorDescuento, setValorDescuento] = useState('');
    const [activa, setActiva] = useState(true);

    useEffect(() => {
        if (recompensa) {
            setNombre(recompensa.nombre);
            setDescripcion(recompensa.descripcion || '');
            setPuntosNecesarios(String(recompensa.puntos_necesarios || 0));
            setTipo(recompensa.tipo || 'DESCUENTO');
            setValorDescuento(String(recompensa.valor_descuento || 0));
            setActiva(recompensa.activa !== undefined ? recompensa.activa : true);
        } else {
            setNombre('');
            setDescripcion('');
            setPuntosNecesarios('');
            setTipo('DESCUENTO');
            setValorDescuento('');
            setActiva(true);
        }
    }, [recompensa]);

    const handleSubmit = () => {
        if (!nombre.trim()) {
            toast.error('El nombre es obligatorio');
            return;
        }

        if (!puntosNecesarios) {
            toast.error('Los puntos necesarios son obligatorios');
            return;
        }

        const puntos = parseInt(puntosNecesarios);
        if (isNaN(puntos) || puntos < 1) {
            toast.error('Los puntos deben ser un número válido mayor a 0');
            return;
        }

        if (tipo === 'DESCUENTO' && !valorDescuento) {
            toast.error('El porcentaje de descuento es obligatorio para este tipo');
            return;
        }

        const datos = {
            nombre: nombre.trim(),
            descripcion: descripcion.trim() || '',
            puntos_necesarios: puntos,
            tipo,
            valor_descuento: parseFloat(valorDescuento) || 0,
            activa,
        };

        onSave(datos);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white border-4 border-black rounded-4xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-[12px_12px_0px_0px_black]"
                >
                    {/* Header */}
                    <div className="bg-[#FAD02C] border-b-4 border-black p-4">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">🎁</span>
                            <h2 className="font-black text-xl uppercase text-black">
                                {recompensa ? '✏️ Editar Recompensa' : '➕ Nueva Recompensa'}
                            </h2>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
                        {/* Nombre */}
                        <div>
                            <label className="block text-xs font-black uppercase text-stone-400 mb-1">
                                📌 Nombre *
                            </label>
                            <input
                                type="text"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                placeholder="Ej: 20% de descuento"
                                className="w-full bg-stone-50 border-4 border-black p-3 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-[#FAD02C]/30"
                            />
                        </div>

                        {/* Descripción */}
                        <div>
                            <label className="block text-xs font-black uppercase text-stone-400 mb-1">
                                📝 Descripción
                            </label>
                            <textarea
                                value={descripcion}
                                onChange={(e) => setDescripcion(e.target.value)}
                                placeholder="Descripción de la recompensa"
                                rows={3}
                                className="w-full bg-stone-50 border-4 border-black p-3 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-[#FAD02C]/30 resize-none"
                            />
                        </div>

                        {/* Puntos */}
                        <div>
                            <label className="block text-xs font-black uppercase text-stone-400 mb-1">
                                ⭐ Puntos necesarios *
                            </label>
                            <input
                                type="number"
                                value={puntosNecesarios}
                                onChange={(e) => setPuntosNecesarios(e.target.value)}
                                placeholder="Ej: 500"
                                className="w-full bg-stone-50 border-4 border-black p-3 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-[#FAD02C]/30"
                                min="1"
                            />
                        </div>

                        {/* Tipo */}
                        <div>
                            <label className="block text-xs font-black uppercase text-stone-400 mb-1">
                                🏷️ Tipo de recompensa *
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {TIPOS_RECOMPENSA.map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => setTipo(t.id as any)}
                                        className={`py-3 rounded-xl border-4 font-black text-xs uppercase transition-all ${tipo === t.id
                                                ? 'bg-black text-white border-black'
                                                : 'bg-stone-50 text-stone-400 border-stone-200 hover:border-stone-300'
                                            }`}
                                        style={tipo === t.id ? { backgroundColor: t.color, color: '#000' } : {}}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Valor descuento (solo para DESCUENTO) */}
                        {tipo === 'DESCUENTO' && (
                            <div>
                                <label className="block text-xs font-black uppercase text-stone-400 mb-1">
                                    💰 Porcentaje de descuento *
                                </label>
                                <input
                                    type="number"
                                    value={valorDescuento}
                                    onChange={(e) => setValorDescuento(e.target.value)}
                                    placeholder="Ej: 20"
                                    className="w-full bg-stone-50 border-4 border-black p-3 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-[#FAD02C]/30"
                                    min="1"
                                    max="100"
                                />
                            </div>
                        )}

                        {/* Activa */}
                        <div className="flex items-center justify-between pt-2 border-t-2 border-stone-100">
                            <label className="block text-xs font-black uppercase text-stone-400">
                                ✅ Activa
                            </label>
                            <button
                                onClick={() => setActiva(!activa)}
                                className={`w-12 h-6 rounded-full border-2 border-black transition-all ${activa ? 'bg-[#43A047]' : 'bg-stone-300'
                                    }`}
                            >
                                <div
                                    className={`w-5 h-5 bg-white rounded-full border-2 border-black transition-all ${activa ? 'translate-x-6' : 'translate-x-0'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t-4 border-black p-4 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 bg-stone-100 border-4 border-black rounded-xl py-3 font-black text-sm hover:bg-stone-200 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex-1 bg-[#FAD02C] border-4 border-black rounded-xl py-3 font-black text-sm hover:bg-black hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent"></span>
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    💾 {recompensa ? 'Actualizar' : 'Crear'}
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}