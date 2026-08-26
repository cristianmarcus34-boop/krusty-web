"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import AdminHeader from '../../components/AdminHeader';
import TabPedidos from '../../components/TabPedidos';
import TabProductos from '../../components/TabProductos';
import TabAdicionales from '../../components/TabAdicionales';

// Lista de respaldo (por si la DB falla)
const ADMIN_EMAILS_BACKUP = [
  'cristianmarcus34@gmail.com',
  'marianajuarez99@gmail.com',
  'agenciadigitalpowa@gmail.com'
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'pedidos' | 'productos' | 'adicionales'>('pedidos');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('🔍 1. Obteniendo sesión...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('❌ Error obteniendo sesión:', sessionError);
        }

        const userEmail = session?.user?.email ?? null;
        console.log('🔍 2. Sesión obtenida:', userEmail || 'No hay sesión');

        if (!session || !userEmail) {
          console.log('❌ 3. No hay sesión o email, redirigiendo...');
          router.push('/admin/login');
          return;
        }

        console.log('🔍 4. Verificando admin para:', userEmail);

        let isAdmin = false;

        // MÉTODO 1: Intentar consultar la tabla admins
        try {
          console.log('🔍 4a. Intentando consulta a tabla admins...');
          const { data: adminData, error: adminError } = await supabase
            .from('admins')
            .select('email')
            .ilike('email', userEmail.trim())
            .maybeSingle();

          console.log('🔍 4b. Resultado de tabla admins:', adminData);

          if (adminError) {
            console.log('⚠️ Error en consulta DB:', adminError.message);
          }

          if (adminData) {
            isAdmin = true;
            console.log('✅ Encontrado en tabla admins');
          }
        } catch (dbError) {
          console.log('⚠️ Error consultando DB, usando fallback:', dbError);
        }

        // MÉTODO 2: Si falla la DB, usar lista de respaldo
        if (!isAdmin) {
          console.log('🔍 4c. Verificando en lista de respaldo...');
          isAdmin = ADMIN_EMAILS_BACKUP.some(email =>
            email.toLowerCase() === userEmail.toLowerCase()
          );
          console.log('🔍 4d. ¿Encontrado en respaldo?', isAdmin);
        }

        if (!isAdmin) {
          console.log('❌ 5. No es administrador, cerrando sesión...');
          await supabase.auth.signOut();
          router.push('/admin/login');
          return;
        }

        console.log('✅ 6. Es administrador, mostrando panel');
        setLoading(false);

      } catch (error) {
        console.error('❌ Error en verificación:', error);
        router.push('/admin/login');
      }
    };

    checkAuth();
  }, [router]);

  if (loading) return (
    <div className="min-h-screen bg-[#FFCA28] flex flex-col items-center justify-center p-6">
      <div className="w-20 h-20 border-10 border-black border-t-red-600 rounded-full animate-spin mb-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]" />
      <p className="font-black italic text-3xl uppercase text-black tracking-tighter transform -skew-x-12">
        VALIDANDO CREDENCIALES... 🍔
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F5F5] font-sans text-black pb-24 selection:bg-red-600 selection:text-white">

      <AdminHeader activeTab={activeTab} setActiveTab={setActiveTab} />

      <button
        onClick={() => router.push('/')}
        className="fixed bottom-6 right-6 z-100 bg-black text-white border-4 border-white flex items-center gap-3 px-6 py-4 rounded-full font-black uppercase text-sm italic shadow-[6px_6px_0px_0px_rgba(211,47,47,1)] hover:scale-105 active:scale-95 transition-all group"
      >
        <span className="text-xl group-hover:rotate-12 transition-transform">🏠</span>
        <span className="hidden md:inline">Ver Menú Público</span>
      </button>

      <main className="max-w-350 mx-auto p-4 md:p-10">
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

      <footer className="fixed bottom-0 left-0 w-full bg-black text-white/50 py-2 text-center text-[10px] font-bold uppercase tracking-widest z-40 border-t-2 border-white/10">
        Krusty Burger Admin System v2.6 • Conectado a Supabase Realtime
      </footer>
    </div>
  );
}