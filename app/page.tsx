"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import BurgerCard from '@/components/BurgerCard';
import { Burger } from '@/types';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function Home() {
  const [items, setItems] = useState<Burger[]>([]);
  const [categoriaActual, setCategoriaActual] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(true);
  
  // ESTADOS PARA EL SEGUIMIENTO DEL CLIENTE
  const [pedidoActivoId, setPedidoActivoId] = useState<string | null>(null);
  const [estadoPedido, setEstadoPedido] = useState<string>('pendiente');

  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null); 
  const estadoAnteriorRef = useRef<string>('pendiente'); // Rastrea cambios de estado

  const categorias = ['todos', 'burgers', 'bebidas', 'postres', 'combos'];

  const fetchProductos = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;
      if (data) setItems(data as Burger[]);
    } catch (error) {
      console.error('Error cargando el menú:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkAdminSession = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) setIsAdmin(true);
  }, []);

  const handleScroll = () => {
    if (scrollRef.current && scrollRef.current.scrollLeft > 20) {
      setShowScrollHint(false);
    }
  };

  // Sincronizar el ref con el estado para la comparación en el Realtime
  useEffect(() => {
    estadoAnteriorRef.current = estadoPedido;
  }, [estadoPedido]);

  useEffect(() => {
    fetchProductos();
    checkAdminSession();

    const savedId = localStorage.getItem('ultimo_pedido_id');
    
    if (savedId) {
      setPedidoActivoId(savedId);

      const fetchEstadoInicial = async () => {
        const { data } = await supabase
          .from('pedidos')
          .select('estado')
          .eq('id', savedId)
          .single();
        if (data) {
          setEstadoPedido(data.estado);
          estadoAnteriorRef.current = data.estado;
        }
      };
      fetchEstadoInicial();

      const orderChannel = supabase
        .channel(`seguimiento-home-${savedId}`)
        .on('postgres_changes', 
          { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'pedidos', 
            filter: `id=eq.${savedId}` 
          }, 
          (payload) => {
            const nuevoEstado = payload.new.estado;
            
            // LÓGICA DE SONIDO: Solo suena si pasa de "algo" a "en camino"
            if (nuevoEstado === 'en camino' && estadoAnteriorRef.current !== 'en camino') {
              if (audioRef.current) {
                audioRef.current.currentTime = 0; 
                audioRef.current.play().catch(e => console.log("Reproducción automática bloqueada:", e));
              }
            }

            setEstadoPedido(nuevoEstado);
          }
        )
        .subscribe();

      return () => { supabase.removeChannel(orderChannel); };
    }

    const menuChannel = supabase
      .channel('menu-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'productos' }, () => fetchProductos())
      .subscribe();

    return () => { supabase.removeChannel(menuChannel); };
  }, [fetchProductos, checkAdminSession]);

  const filtrados = categoriaActual === 'todos'
    ? items
    : items.filter(item => item.categoria.toLowerCase() === categoriaActual.toLowerCase());

  return (
    <main
      className="min-h-screen pb-20 bg-[#F5F5F4]"
      style={{
        backgroundImage: 'radial-gradient(#d1d5db 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }}
    >
      {/* AUDIO INVISIBLE - Ruta: public/sounds/correcaminos-bip.mp3 */}
      <audio ref={audioRef} preload="auto">
        <source src="/sounds/correcaminos-bip.mp3" type="audio/mpeg" />
      </audio>

      {/* BOTÓN FLOTANTE ADMIN */}
      {isAdmin && (
        <div className="fixed bottom-6 left-6 z-[100]">
          <Link href="/admin">
            <button className="bg-black text-[#FFCA28] border-4 border-[#FFCA28] px-5 py-3 rounded-2xl font-black uppercase italic text-xs shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:scale-110 active:scale-95 transition-all flex items-center gap-2">
              <span className="text-lg">⚙️</span> VOLVER AL PANEL
            </button>
          </Link>
        </div>
      )}

      {/* BOTÓN FLOTANTE SEGUIMIENTO CLIENTE */}
      {pedidoActivoId && (
        <div className="fixed bottom-6 right-6 z-[100] group animate-in fade-in slide-in-from-right-10 duration-500">
          <Link href={`/pedido/${pedidoActivoId}`}>
            <button className={`bg-[#D32F2F] text-white border-4 border-black px-6 py-4 rounded-2xl shadow-[6px_6px_0px_0px_black] flex items-center gap-4 hover:scale-105 active:translate-y-1 active:shadow-none transition-all relative ${estadoPedido === 'en camino' ? 'animate-pulse' : ''}`}>
              
              <span className="absolute -top-2 -left-2 flex h-6 w-6">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 border-2 border-black"></span>
                <span className="relative inline-flex rounded-full h-6 w-6 bg-green-500 border-2 border-black"></span>
              </span>

              <span className="text-3xl animate-bounce-slow">
                {estadoPedido === 'pendiente' && '📩'}
                {estadoPedido === 'en cocina' && '👨‍🍳'}
                {estadoPedido === 'en camino' && '🛵'}
                {estadoPedido === 'entregado' && '🍔'}
              </span>

              <div className="text-left">
                <p className="text-[9px] font-black uppercase leading-tight text-[#FFCA28] opacity-90">
                  {estadoPedido === 'entregado' ? '¡Orden lista!' : 'Estado de tu pedido:'}
                </p>
                <p className="text-sm font-black italic uppercase leading-none tracking-tighter">
                  {estadoPedido === 'pendiente' && 'Recibido'}
                  {estadoPedido === 'en cocina' && 'En Parrilla'}
                  {estadoPedido === 'en camino' && 'En Camino'}
                  {estadoPedido === 'entregado' && '¡Entregado!'}
                </p>
              </div>
            </button>
          </Link>

          <button 
            onClick={(e) => {
              e.preventDefault();
              localStorage.removeItem('ultimo_pedido_id');
              setPedidoActivoId(null);
            }}
            className="absolute -top-3 -right-3 bg-black text-white w-8 h-8 rounded-full text-[10px] font-black border-2 border-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
          >
            X
          </button>
        </div>
      )}

      {/* 1. HERO HEADER */}
      <header className="bg-[#FFCA28] py-12 md:py-20 px-4 border-b-[8px] border-black mb-8 relative overflow-hidden">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-[#D32F2F] rounded-full opacity-10" />
        <div className="absolute -bottom-10 -right-10 w-60 h-60 bg-white rounded-full opacity-10" />

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <h1
            className="text-6xl md:text-9xl font-black text-[#D32F2F] italic tracking-tighter mb-4"
            style={{ filter: 'drop-shadow(5px 5px 0px black)' }}
          >
            KRUSTY BURGER
          </h1>
          <div className="inline-block bg-white border-[4px] border-black px-4 md:px-8 py-2 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] -rotate-1">
            <p className="text-sm md:text-2xl font-black text-black uppercase italic tracking-tighter text-center">
              "Donde el colesterol es el ingrediente secreto"
            </p>
          </div>
        </div>
      </header>

      {/* 2. CATEGORÍAS */}
      <div className="sticky top-0 z-40 bg-[#F5F5F4]/90 backdrop-blur-md pt-4 pb-2 mb-8 border-b-2 border-dashed border-black/10">
        <div className="relative max-w-7xl mx-auto">
          <div className="relative group">
            <div 
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex justify-start md:justify-center gap-3 px-4 overflow-x-auto no-scrollbar pb-4 snap-x mask-fade-right"
            >
              {categorias.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoriaActual(cat)}
                  className={`
                    flex-shrink-0 snap-start px-6 py-2 rounded-xl font-black uppercase text-[10px] md:text-xs transition-all border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] 
                    active:shadow-none active:translate-x-1 active:translate-y-1
                    ${categoriaActual === cat
                      ? 'bg-[#D32F2F] text-white scale-105'
                      : 'bg-white text-black hover:bg-[#FFCA28]'
                    }
                  `}
                >
                  {cat}
                </button>
              ))}
            </div>

            {showScrollHint && (
              <div className="md:hidden absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none animate-pulse">
                <div className="bg-black text-white text-[10px] font-black px-2 py-1 rounded-lg border-2 border-white shadow-lg flex items-center gap-1">
                  DESLIZA <span className="text-sm">→</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. GRID DE PRODUCTOS */}
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-[8px] border-black border-t-[#D32F2F] rounded-full animate-spin mb-4"></div>
            <p className="font-black text-black italic animate-pulse tracking-widest text-center uppercase">Preparando el pedido...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            {filtrados.length > 0 ? (
              filtrados.map((item, index) => (
                <div
                  key={item.id}
                  className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-forwards"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <BurgerCard burger={item} />
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-20 bg-white border-4 border-dashed border-black rounded-3xl">
                <p className="text-2xl font-black text-black italic uppercase tracking-tighter px-4">
                  ¡Ay caramba! No hay {categoriaActual} disponibles
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 1.5s infinite ease-in-out;
        }

        @media (max-width: 768px) {
          .mask-fade-right {
            mask-image: linear-gradient(to right, black 85%, transparent 100%);
            -webkit-mask-image: linear-gradient(to right, black 85%, transparent 100%);
          }
        }
      `}} />
    </main>
  );
}