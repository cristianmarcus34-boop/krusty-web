"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import AdminHeader from '../../components/AdminHeader';
import TabPedidos from '../../components/TabPedidos';
import TabProductos from '../../components/TabProductos';
import TabAdicionales from '../../components/TabAdicionales';

const ADMIN_EMAILS = ['cristianmarcus34@gmail.com', 'marianajuarez99@gmail.com'];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'pedidos' | 'productos' | 'adicionales'>('pedidos');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !ADMIN_EMAILS.includes(session.user.email || '')) {
        await supabase.auth.signOut();
        router.push('/admin/login');
        return;
      }
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  if (loading) return (
    <div className="min-h-screen bg-[#FFCA28] flex flex-col items-center justify-center p-6">
      <div className="w-20 h-20 border-[10px] border-black border-t-red-600 rounded-full animate-spin mb-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]" />
      <p className="font-black italic text-3xl uppercase text-black tracking-tighter transform -skew-x-12">
        VALIDANDO CREDENCIALES... 🍔
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F5F5] font-sans text-black pb-24 selection:bg-red-600 selection:text-white">
      
      {/* HEADER CON ESTILO REFORZADO */}
      <AdminHeader activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* BOTÓN FLOTANTE: VOLVER AL MENÚ PÚBLICO */}
      <button 
        onClick={() => router.push('/')}
        className="fixed bottom-6 right-6 z-[100] bg-black text-white border-4 border-white flex items-center gap-3 px-6 py-4 rounded-full font-black uppercase text-sm italic shadow-[6px_6px_0px_0px_rgba(211,47,47,1)] hover:scale-105 active:scale-95 transition-all group"
      >
        <span className="text-xl group-hover:rotate-12 transition-transform">🏠</span>
        <span className="hidden md:inline">Ver Menú Público</span>
      </button>

      {/* CONTENIDO PRINCIPAL - AJUSTE DE TAMAÑOS MAXIMIZADO */}
      <main className="max-w-[1400px] mx-auto p-4 md:p-10">
        
        {/* INDICADOR DE SECCIÓN ACTUAL (Toque McDonald's) */}
        <div className="mb-10 text-center md:text-left">
            <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter text-black drop-shadow-[4px_4px_0px_#FFCA28]">
                PANEL <span className="text-[#D32F2F]">ADMIN</span>
            </h1>
            <div className="h-3 w-32 bg-[#D32F2F] mt-2 border-2 border-black rounded-full mx-auto md:mx-0" />
        </div>

        <div className="animate-in slide-in-from-bottom-4 duration-500">
            {activeTab === 'pedidos' && (
                <div className="bg-white border-[6px] border-black rounded-[3rem] p-2 md:p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                    <TabPedidos />
                </div>
            )}
            
            {activeTab === 'productos' && (
                <div className="bg-white border-[6px] border-black rounded-[3rem] p-2 md:p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                    <TabProductos />
                </div>
            )}
            
            {activeTab === 'adicionales' && (
                <div className="bg-white border-[6px] border-black rounded-[3rem] p-2 md:p-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                    <TabAdicionales />
                </div>
            )}
        </div>
      </main>

      {/* FOOTER DE ESTADO */}
      <footer className="fixed bottom-0 left-0 w-full bg-black text-white/50 py-2 text-center text-[10px] font-bold uppercase tracking-widest z-40 border-t-2 border-white/10">
        Krusty Burger Admin System v2.6 • Conectado a Supabase Realtime
      </footer>
    </div>
  );
}