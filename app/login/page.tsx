"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AuthPage() {
    const router = useRouter();
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
                router.push('/');
                router.refresh();
            } else if (modo === 'registro') {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { full_name: nombre },
                    },
                });
                if (error) throw error;
                setMensaje({ tipo: 'exito', texto: '¡Cuenta creada! Revisá tu email para confirmar la cuenta.' });
            } else if (modo === 'recuperar') {
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
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFCA28] p-4 relative overflow-hidden">
            {/* Decoración de fondo */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(black 2px, transparent 2px)', backgroundSize: '30px 30px' }} />

            {/* Botón Volver */}
            <Link href="/" className="absolute top-6 left-6 group z-10">
                <button className="bg-white border-[3px] border-black px-4 py-2 rounded-xl font-black text-xs uppercase shadow-[4px_4px_0px_0px_black] hover:bg-black hover:text-white transition-all cursor-pointer">
                    ← Volver al Menú
                </button>
            </Link>

            {/* Formulario */}
            <div className="bg-white border-[6px] border-black p-8 rounded-[3rem] shadow-[15px_15px_0px_0px_black] max-w-sm w-full relative z-10 animate-in fade-in zoom-in duration-300">

                {/* Logo */}
                <div className="w-20 h-20 bg-[#D32F2F] border-4 border-black rounded-full mx-auto mb-6 flex items-center justify-center shadow-[4px_4px_0px_0px_black]">
                    <span className="text-white text-4xl font-black italic">K</span>
                </div>

                <div className="text-center space-y-2">
                    <h1 className="text-3xl md:text-4xl font-black text-[#D32F2F] italic text-center mb-2 uppercase tracking-tighter">
                        {modo === 'login' && 'Iniciar Sesión'}
                        {modo === 'registro' && 'Crear Cuenta'}
                        {modo === 'recuperar' && 'Recuperar Clave'}
                    </h1>
                    <p className="text-center text-black font-bold text-[10px] uppercase mb-8 tracking-widest opacity-60">
                        {modo === 'login' && 'Identificación de Seguridad'}
                        {modo === 'registro' && 'Registrate para pedir más rápido'}
                        {modo === 'recuperar' && 'Te enviaremos un link a tu casilla'}
                    </p>
                </div>

                {mensaje && (
                    <div className={`p-4 rounded-2xl font-black text-xs mb-6 border-[3px] ${mensaje.tipo === 'exito'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                        : 'bg-red-50 border-red-500 text-red-600'
                        }`}>
                        {mensaje.tipo === 'exito' ? '✅' : '⚠️'} {mensaje.texto}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {modo === 'registro' && (
                        <div>
                            <label className="block text-[10px] font-black uppercase mb-1 ml-2 text-black">Nombre Completo</label>
                            <input
                                type="text"
                                required
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                placeholder="Homero Simpson"
                                className="w-full border-4 border-black p-4 rounded-2xl font-bold text-sm focus:outline-none focus:ring-4 focus:ring-[#FFCA28]/30 transition-all"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-[10px] font-black uppercase mb-1 ml-2 text-black">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="homero@krustyburger.com.ar"
                            className="w-full border-4 border-black p-4 rounded-2xl font-bold text-sm focus:outline-none focus:ring-4 focus:ring-[#FFCA28]/30 transition-all"
                        />
                    </div>

                    {modo !== 'recuperar' && (
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-[10px] font-black uppercase ml-2 text-black">Contraseña</label>
                                {modo === 'login' && (
                                    <button
                                        type="button"
                                        onClick={() => { setModo('recuperar'); setMensaje(null); }}
                                        className="text-[10px] font-black text-[#D32F2F] hover:underline cursor-pointer"
                                    >
                                        ¿Olvidaste?
                                    </button>
                                )}
                            </div>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full border-4 border-black p-4 rounded-2xl font-bold text-sm focus:outline-none focus:ring-4 focus:ring-[#FFCA28]/30 transition-all"
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full mt-8 text-white font-black py-5 rounded-2xl border-4 border-black shadow-[6px_6px_0px_0px_black] transition-all uppercase italic tracking-tighter text-xl
                            ${loading
                                ? 'bg-gray-400 cursor-not-allowed shadow-none translate-y-1'
                                : 'bg-[#D32F2F] hover:bg-black active:shadow-none active:translate-x-1 active:translate-y-1'
                            }
                        `}
                    >
                        {loading ? 'Cargando...' : modo === 'login' ? 'Ingresar' : modo === 'registro' ? 'Registrarme' : 'Enviar Correo'}
                    </button>
                </form>

                <div className="text-center pt-4 mt-4 border-t-2 border-black/10">
                    {modo === 'login' ? (
                        <p className="text-[10px] font-bold text-stone-500 uppercase">
                            ¿No tenés cuenta?{' '}
                            <button onClick={() => { setModo('registro'); setMensaje(null); }} className="text-[#D32F2F] hover:underline cursor-pointer">
                                Registrate
                            </button>
                        </p>
                    ) : (
                        <p className="text-[10px] font-bold text-stone-500 uppercase">
                            ¿Ya tenés cuenta?{' '}
                            <button onClick={() => { setModo('login'); setMensaje(null); }} className="text-[#D32F2F] hover:underline cursor-pointer">
                                Iniciá Sesión
                            </button>
                        </p>
                    )}
                </div>

                <p className="text-center mt-6 text-[9px] font-bold text-stone-400 uppercase">
                    Propiedad de Krusty Lu Studios © 2026
                </p>
            </div>
        </div>
    );
}