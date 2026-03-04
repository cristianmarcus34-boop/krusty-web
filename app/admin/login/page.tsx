"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); // Estado para el botón
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setError("¡Acceso denegado! Revisa tus credenciales de empleado.");
        setLoading(false);
      } else {
        router.push('/admin');
        router.refresh(); // Asegura que la sesión se actualice en el cliente
      }
    } catch (err) {
      setError("Error de conexión con el servidor de Krusty.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFCA28] p-4 relative overflow-hidden">
      
      {/* Decoración de fondo estilo cómic */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(black 2px, transparent 2px)', backgroundSize: '30px 30px' }} />

      {/* Botón Volver */}
      <Link href="/" className="absolute top-6 left-6 group">
        <button className="bg-white border-[3px] border-black px-4 py-2 rounded-xl font-black text-xs uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:bg-black group-hover:text-white transition-all">
          ← Volver al Menú
        </button>
      </Link>

      <form 
        onSubmit={handleLogin} 
        className="bg-white border-[6px] border-black p-8 rounded-[3rem] shadow-[15px_15px_0px_0px_rgba(0,0,0,1)] max-w-sm w-full relative z-10 animate-in fade-in zoom-in duration-300"
      >
        {/* Logo o Icono temporal */}
        <div className="w-20 h-20 bg-[#D32F2F] border-4 border-black rounded-full mx-auto mb-6 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <span className="text-white text-4xl font-black italic">K</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-black text-[#D32F2F] italic text-center mb-2 uppercase tracking-tighter">
          STAFF ONLY
        </h1>
        <p className="text-center text-black font-bold text-[10px] uppercase mb-8 tracking-widest opacity-60">
          Identificación de Seguridad
        </p>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl font-black text-xs mb-6 border-[3px] border-red-600 animate-bounce">
            ⚠️ {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase mb-1 ml-2">Email del Payaso</label>
            <input 
              required
              type="email" 
              placeholder="empleado@krusty.com"
              className="w-full border-4 border-black p-4 rounded-2xl font-bold focus:outline-none focus:ring-4 focus:ring-[#FFCA28]/30 transition-all"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase mb-1 ml-2">Clave Secreta</label>
            <input 
              required
              type="password" 
              placeholder="••••••••"
              className="w-full border-4 border-black p-4 rounded-2xl font-bold focus:outline-none focus:ring-4 focus:ring-[#FFCA28]/30 transition-all"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <button 
          disabled={loading}
          className={`w-full mt-8 text-white font-black py-5 rounded-2xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all uppercase italic tracking-tighter text-xl
            ${loading 
              ? 'bg-gray-400 cursor-not-allowed shadow-none translate-y-1' 
              : 'bg-[#D32F2F] hover:bg-black active:shadow-none active:translate-x-1 active:translate-y-1'
            }
          `}
        >
          {loading ? 'VERIFICANDO...' : 'ENTRAR A LA COCINA'}
        </button>

        <p className="text-center mt-6 text-[9px] font-bold text-stone-400 uppercase">
          Propiedad de Krusty Lu Studios © 2026
        </p>
      </form>
    </div>
  );
}