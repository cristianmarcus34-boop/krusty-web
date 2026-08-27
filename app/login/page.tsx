"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuthPage() {
    const [modo, setModo] = useState<'login' | 'registro' | 'recuperar'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nombre, setNombre] = useState('');
    const [loading, setLoading] = useState(false);
    const [mensaje, setMensaje] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMensaje(null);

        try {
            if (modo === 'login') {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                window.location.href = '/';
            }

            else if (modo === 'registro') {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { full_name: nombre },
                    },
                });
                if (error) throw error;
                setMensaje({ tipo: 'exito', texto: '¡Cuenta creada! Revisá tu email para confirmar la cuenta.' });
            }

            else if (modo === 'recuperar') {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/login/reset-password`,
                });
                if (error) throw error;
                setMensaje({ tipo: 'exito', texto: 'Te enviamos un enlace de recuperación a tu correo.' });
            }
        } catch (err: any) {
            setMensaje({ tipo: 'error', texto: err.message || 'Ocurrió un error inesperado' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-stone-950 text-white flex flex-col items-center justify-center p-4">
            <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 relative overflow-hidden">

                <div className="text-center space-y-2">
                    <span className="text-4xl">🍔</span>
                    <h1 className="text-2xl font-black text-[#FAD02C] uppercase tracking-tight">
                        {modo === 'login' && 'Iniciar Sesión'}
                        {modo === 'registro' && 'Crear Cuenta'}
                        {modo === 'recuperar' && 'Recuperar Clave'}
                    </h1>
                    <p className="text-stone-400 text-xs font-medium">
                        {modo === 'login' && 'Ingresá tus datos para gestionar tus pedidos'}
                        {modo === 'registro' && 'Registrate para pedir más rápido'}
                        {modo === 'recuperar' && 'Te enviaremos un link a tu casilla'}
                    </p>
                </div>

                {mensaje && (
                    <div className={`p-3 rounded-2xl text-xs font-bold text-center border ${mensaje.tipo === 'exito'
                            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
                            : 'bg-red-950/40 border-red-500/40 text-red-400'
                        }`}>
                        {mensaje.texto}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {modo === 'registro' && (
                        <div>
                            <label className="block text-xs font-bold text-stone-400 mb-1 uppercase">Nombre Completo</label>
                            <input
                                type="text"
                                required
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                placeholder="Homero Simpson"
                                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-sm text-stone-200 focus:outline-none focus:border-[#FAD02C]"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-stone-400 mb-1 uppercase">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="homero@krustyburger.com.ar"
                            className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-sm text-stone-200 focus:outline-none focus:border-[#FAD02C]"
                        />
                    </div>

                    {modo !== 'recuperar' && (
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-xs font-bold text-stone-400 uppercase">Contraseña</label>
                                {modo === 'login' && (
                                    <button
                                        type="button"
                                        onClick={() => { setModo('recuperar'); setMensaje(null); }}
                                        className="text-[11px] text-[#FAD02C] hover:underline cursor-pointer"
                                    >
                                        ¿Olvidaste tu contraseña?
                                    </button>
                                )}
                            </div>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-sm text-stone-200 focus:outline-none focus:border-[#FAD02C]"
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 rounded-2xl bg-[#FAD02C] text-stone-950 font-black uppercase text-xs tracking-wider hover:bg-yellow-400 transition-all active:scale-95 shadow-lg shadow-amber-500/10 disabled:opacity-50 cursor-pointer"
                    >
                        {loading ? 'Cargando...' : modo === 'login' ? 'Ingresar' : modo === 'registro' ? 'Registrarme' : 'Enviar Correo'}
                    </button>
                </form>

                <div className="text-center pt-2 border-t border-stone-800/80">
                    {modo === 'login' ? (
                        <p className="text-xs text-stone-400">
                            ¿No tenés cuenta?{' '}
                            <button onClick={() => { setModo('registro'); setMensaje(null); }} className="text-[#FAD02C] font-bold hover:underline cursor-pointer">
                                Registrate
                            </button>
                        </p>
                    ) : (
                        <p className="text-xs text-stone-400">
                            ¿Ya tenés cuenta?{' '}
                            <button onClick={() => { setModo('login'); setMensaje(null); }} className="text-[#FAD02C] font-bold hover:underline cursor-pointer">
                                Iniciá Sesión
                            </button>
                        </p>
                    )}
                </div>
            </div>
        </main>
    );
}