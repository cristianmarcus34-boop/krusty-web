// components/SuggestionForm.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

const TIPOS = [
    { value: 'mejora', label: '✨ Mejora', desc: 'Algo que se podría hacer mejor' },
    { value: 'bug', label: '🐛 Bug', desc: 'Algo que no funciona' },
    { value: 'sugerencia', label: '💡 Sugerencia', desc: 'Una idea nueva' },
    { value: 'otro', label: '📝 Otro', desc: 'Cualquier otra cosa' },
] as const;

type TipoSugerencia = typeof TIPOS[number]['value'];

export default function SuggestionForm() {
    const { user } = useAuthStore();
    const [tipo, setTipo] = useState<TipoSugerencia>('mejora');
    const [titulo, setTitulo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [email, setEmail] = useState(user?.email || '');
    const [enviando, setEnviando] = useState(false);
    const [enviado, setEnviado] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (titulo.trim().length < 3) {
            toast.error('El título es muy corto (mínimo 3 caracteres)');
            return;
        }
        if (descripcion.trim().length < 10) {
            toast.error('Contanos un poco más (mínimo 10 caracteres)');
            return;
        }

        setEnviando(true);
        try {
            const { error } = await supabase.from('sugerencias').insert({
                tipo,
                titulo: titulo.trim(),
                descripcion: descripcion.trim(),
                email: email.trim() || null,
                usuario_id: user?.id || null,
                pagina: typeof window !== 'undefined' ? window.location.pathname : null,
            });

            if (error) throw error;

            setEnviado(true);
            toast.success('¡Gracias! Tu sugerencia fue enviada 🍔');
        } catch (err) {
            console.error('Error enviando sugerencia:', err);
            toast.error('No pudimos enviar tu sugerencia. Probá de nuevo.');
        } finally {
            setEnviando(false);
        }
    };

    const resetForm = () => {
        setTipo('mejora');
        setTitulo('');
        setDescripcion('');
        setEmail(user?.email || '');
        setEnviado(false);
    };

    // ✅ Pantalla de éxito
    if (enviado) {
        return (
            <div className="bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_black] p-8 text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="font-krusty text-3xl uppercase mb-2">¡Recibido!</h2>
                <p className="text-sm font-bold text-stone-600 mb-6 max-w-sm mx-auto">
                    Gracias por tomarte el tiempo de escribirnos. Vamos a revisarlo y, si
                    hace falta, te respondemos por email.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={resetForm}
                        className="px-6 py-3 bg-[#FFCA28] border-2 border-black rounded-xl font-black uppercase text-sm shadow-[4px_4px_0px_0px_black] hover:translate-x-px hover:translate-y-px hover:shadow-none transition-all"
                    >
                        Enviar otra
                    </button>
                    <a
                        href="/"
                        className="px-6 py-3 bg-white border-2 border-black rounded-xl font-black uppercase text-sm shadow-[4px_4px_0px_0px_black] hover:translate-x-px hover:translate-y-px hover:shadow-none transition-all"
                    >
                        Volver al menú
                    </a>
                </div>
            </div>
        );
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="bg-white border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_black] p-6 sm:p-8"
        >
            {/* TIPO */}
            <div className="mb-6">
                <label className="block text-[10px] font-black uppercase text-stone-400 mb-2 tracking-wider">
                    ¿Qué tipo de mensaje es?
                </label>
                <div className="grid grid-cols-2 gap-2">
                    {TIPOS.map((t) => (
                        <button
                            key={t.value}
                            type="button"
                            onClick={() => setTipo(t.value)}
                            className={`p-3 rounded-xl border-2 text-left transition-all ${tipo === t.value
                                    ? 'bg-[#FFCA28] border-black shadow-[3px_3px_0px_0px_black]'
                                    : 'bg-white border-stone-200 hover:border-stone-400'
                                }`}
                        >
                            <div className="font-black text-xs uppercase">{t.label}</div>
                            <div className="text-[10px] text-stone-500 mt-0.5 leading-tight">
                                {t.desc}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* TÍTULO */}
            <div className="mb-4">
                <label htmlFor="titulo" className="block text-[10px] font-black uppercase text-stone-400 mb-1 tracking-wider">
                    Título <span className="text-red-500">*</span>
                </label>
                <input
                    id="titulo"
                    type="text"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Ej: El botón de volver no se ve en mobile"
                    maxLength={100}
                    required
                    className="w-full bg-stone-50 border-2 border-black p-3 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-[#FFCA28]/50"
                />
                <p className="text-[10px] text-stone-400 text-right mt-1">
                    {titulo.length}/100
                </p>
            </div>

            {/* DESCRIPCIÓN */}
            <div className="mb-4">
                <label htmlFor="descripcion" className="block text-[10px] font-black uppercase text-stone-400 mb-1 tracking-wider">
                    Descripción <span className="text-red-500">*</span>
                </label>
                <textarea
                    id="descripcion"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Contanos con detalle qué pasó o qué te gustaría. Si es un bug, contanos qué estabas haciendo cuando pasó."
                    rows={6}
                    maxLength={1000}
                    required
                    className="w-full bg-stone-50 border-2 border-black p-3 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-[#FFCA28]/50 resize-none"
                />
                <p className="text-[10px] text-stone-400 text-right mt-1">
                    {descripcion.length}/1000
                </p>
            </div>

            {/* EMAIL */}
            <div className="mb-6">
                <label htmlFor="email" className="block text-[10px] font-black uppercase text-stone-400 mb-1 tracking-wider">
                    Email <span className="text-stone-400 font-normal">(opcional, para responderte)</span>
                </label>
                <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="w-full bg-stone-50 border-2 border-black p-3 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-[#FFCA28]/50"
                />
            </div>

            {/* SUBMIT */}
            <button
                type="submit"
                disabled={enviando}
                className="w-full py-4 bg-[#FFCA28] border-2 border-black rounded-xl font-black uppercase text-sm shadow-[4px_4px_0px_0px_black] hover:translate-x-px hover:translate-y-px hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {enviando ? 'Enviando...' : '🚀 Enviar sugerencia'}
            </button>

            <p className="text-[10px] text-stone-400 text-center mt-3">
                No compartimos tus datos con terceros. Leé nuestra{' '}
                <a href="/privacidad" className="underline hover:text-black">
                    política de privacidad
                </a>
                .
            </p>
        </form>
    );
}