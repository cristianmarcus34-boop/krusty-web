"use client";
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

type AdminTab = 'pedidos' | 'productos' | 'adicionales' | 'recompensas' | 'sugerencias';

interface AdminHeaderProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
}

export default function AdminHeader({ activeTab, setActiveTab }: AdminHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  const tabs: { id: AdminTab; label: string }[] = [
    { id: 'pedidos', label: '📋 Comandas' },
    { id: 'productos', label: '🍔 Menú' },
    { id: 'adicionales', label: '🧀 Adicionales' },
    { id: 'recompensas', label: '🎁 Recompensas' },
    { id: 'sugerencias', label: '💡 Sugerencias' },  // ← NUEVA
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b-8 border-black p-4 md:p-6 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 md:w-10 md:h-10 bg-[#D32F2F] rounded-full border-4 border-black flex items-center justify-center text-white font-black italic">
              K
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-[#D32F2F] italic uppercase tracking-tighter transform -skew-x-6">
              ADMIN PANEL
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="md:hidden bg-black text-white px-4 py-2 rounded-xl font-black text-[10px]"
          >
            SALIR
          </button>
        </div>

        <nav className="flex flex-wrap gap-2 w-full md:w-auto justify-center">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 sm:px-5 py-2.5 sm:py-3 rounded-2xl font-black uppercase italic border-4 border-black transition-all text-[10px] sm:text-xs md:text-sm ${activeTab === tab.id
                  ? 'bg-[#FFCA28] shadow-[4px_4px_0px_0px_black] -translate-y-1'
                  : 'bg-white hover:bg-stone-50'
                }`}
            >
              {tab.label}
            </button>
          ))}
          <button
            onClick={handleLogout}
            className="hidden md:block bg-black text-white px-6 py-3 rounded-2xl border-4 border-black font-black uppercase italic hover:bg-[#D32F2F] transition-colors"
          >
            🚪 SALIR
          </button>
        </nav>
      </div>
    </header>
  );
}