"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [mensaje, setMensaje] = useState<string | null>(null);
    const router = useRouter();

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase.auth.updateUser({ password: newPassword });

        if (error) {
            setMensaje(error.message);
            setLoading(false);
        } else {
            alert('¡Contraseña actualizada con éxito!');
            router.push('/login');
        }
    };

    return (
        <main className="min-h-screen bg-stone-950 text-white flex flex-col items-center justify-center p-4">
            <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
                <h1 className="text-xl font-black text-[#FAD02C] uppercase text-center">Nueva Contraseña</h1>

                {mensaje && <p className="text-xs text-red-400 text-center font-bold">{mensaje}</p>}

                <form onSubmit={handleReset} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-stone-400 mb-1 uppercase">Nueva Contraseña</label>
                        <input
                            type="password"
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-sm text-stone-200 focus:outline-none focus:border-[#FAD02C]"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 rounded-2xl bg-[#FAD02C] text-stone-950 font-black uppercase text-xs tracking-wider hover:bg-yellow-400 transition-all cursor-pointer disabled:opacity-50"
                    >
                        {loading ? 'Actualizando...' : 'Guardar Nueva Contraseña'}
                    </button>
                </form>
            </div>
        </main>
    );
}