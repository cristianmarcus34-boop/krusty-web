'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import confetti from 'canvas-confetti';

// ============================================
// TIPOS Y CONSTANTES
// ============================================

interface Mutacion {
  id: string;
  nombre: string;
  emoji: string;
  descripcion: string;
  rareza: 'común' | 'rara' | 'épica' | 'legendaria' | 'mítica';
  poder: number;
  efectos: string[];
  imagen?: string;
  porcentaje: number;
  color: string;
}

interface ClienteMutante {
  id: string;
  nombre: string;
  mutaciones: Mutacion[];
  nivel: number;
  experiencia: number;
  fechaRegistro: string;
  avatar: string;
}

interface Particula {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
  life: number;
}

// ============================================
// DATOS DE MUTACIONES
// ============================================

const MUTACIONES_DISPONIBLES: Mutacion[] = [
  {
    id: 'tercer-ojo',
    nombre: 'Tercer Ojo Místico',
    emoji: '👁️',
    descripcion: 'Desarrollas un ojo en la frente que te permite ver el futuro de tus hamburguesas',
    rareza: 'épica',
    poder: 85,
    efectos: ['Visión de futuro', 'Percepción extrasensorial', 'Puedes ver los ingredientes ocultos'],
    color: '#9C27B0',
    porcentaje: 5
  },
  {
    id: 'branquias-funcionales',
    nombre: 'Branquias de Agua Dulce',
    emoji: '🐟',
    descripcion: 'Puedes respirar bajo el agua mientras comes, perfecto para la salsa secreta líquida',
    rareza: 'rara',
    poder: 70,
    efectos: ['Respiración acuática', 'Adaptación al medio líquido', 'Piel escamosa'],
    color: '#2196F3',
    porcentaje: 15
  },
  {
    id: 'piel-amarilla',
    nombre: 'Piel Nuclear Brillante',
    emoji: '🌟',
    descripcion: 'Tu piel adquiere un tono amarillo #FAD02C, convirtiéndote en un ser de luz',
    rareza: 'legendaria',
    poder: 95,
    efectos: ['Fosforescencia natural', 'Atracción de clientes', 'Resistencia a la radiación'],
    color: '#FAD02C',
    porcentaje: 2
  },
  {
    id: 'super-fuerza',
    nombre: 'Fuerza de Krusty',
    emoji: '💪',
    descripcion: 'Ganas la fuerza de 10 payasos hambrientos, puedes levantar una hamburguesa de 50kg',
    rareza: 'épica',
    poder: 90,
    efectos: ['Super fuerza', 'Resistencia extrema', 'Puedes partir panes con los dedos'],
    color: '#F44336',
    porcentaje: 8
  },
  {
    id: 'telepatia-carnivora',
    nombre: 'Telepatía Carnívora',
    emoji: '🧠',
    descripcion: 'Puedes comunicarte telepáticamente con la carne y saber si está fresca',
    rareza: 'mítica',
    poder: 100,
    efectos: ['Telepatía cárnica', 'Detección de calidad', 'Control mental sobre las hamburguesas'],
    color: '#E91E63',
    porcentaje: 1
  },
  {
    id: 'velocidad-digestiva',
    nombre: 'Digestión Relámpago',
    emoji: '⚡',
    descripcion: 'Tu sistema digestivo procesa la comida a la velocidad de la luz',
    rareza: 'común',
    poder: 45,
    efectos: ['Digestión instantánea', 'No engordas', 'Puedes comer 10 hamburguesas en 1 minuto'],
    color: '#4CAF50',
    porcentaje: 30
  },
  {
    id: 'vision-rayos-x',
    nombre: 'Visión de Rayos-X Krusty',
    emoji: '👀',
    descripcion: 'Puedes ver a través de las hamburguesas y encontrar el mejor bocado',
    rareza: 'rara',
    poder: 75,
    efectos: ['Visión penetrante', 'Encuentra ingredientes secretos', 'Detección de salsas'],
    color: '#FF9800',
    porcentaje: 12
  },
  {
    id: 'mutacion-gelatinosa',
    nombre: 'Cuerpo de Gelatina',
    emoji: '🟢',
    descripcion: 'Tu cuerpo se vuelve gelatinoso, puedes escurrirte por cualquier lugar',
    rareza: 'épica',
    poder: 80,
    efectos: ['Elasticidad extrema', 'Resistencia a impactos', 'Puedes pasar por rendijas'],
    color: '#00BCD4',
    porcentaje: 7
  }
];

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function MutacionesPage() {
  // Estados
  const [cliente, setCliente] = useState<ClienteMutante | null>(null);
  const [mutacionSeleccionada, setMutacionSeleccionada] = useState<Mutacion | null>(null);
  const [mutacionObtenida, setMutacionObtenida] = useState<Mutacion | null>(null);
  const [nivelActual, setNivelActual] = useState(1);
  const [experiencia, setExperiencia] = useState(0);
  const [efectosActivados, setEfectosActivados] = useState<string[]>([]);
  const [estaMutando, setEstaMutando] = useState(false);
  const [sonidoActivado, setSonidoActivado] = useState(true);
  const [modoOscuro, setModoOscuro] = useState(false);
  
  // Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particulasRef = useRef<Particula[]>([]);

  // ============================================
  // EFECTOS DE SONIDO CON WEB AUDIO API
  // ============================================

  const reproducirSonido = useCallback((tipo: 'mutacion' | 'exito' | 'error' | 'levelup') => {
    if (!sonidoActivado) return;
    
    try {
      const AudioContextClass = globalThis.AudioContext || (globalThis as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass();
      }
      
      const ctx = audioContextRef.current;
      const now = ctx.currentTime;
      
      if (tipo === 'mutacion') {
        // Sonido de transformación
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.5);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.5);
        
        // Efecto de "destello"
        setTimeout(() => {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(1200, now + 0.3);
          gain2.gain.setValueAtTime(0.1, now + 0.3);
          gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.start(now + 0.3);
          osc2.stop(now + 0.8);
        }, 200);
      } else if (tipo === 'exito') {
        // Sonido de éxito
        [0, 0.1, 0.2, 0.3].forEach((delay, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(523 + i * 100, now + delay);
          gain.gain.setValueAtTime(0.1, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.1);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + delay);
          osc.stop(now + delay + 0.15);
        });
      } else if (tipo === 'levelup') {
        // Sonido de nivel up
        [0, 0.15, 0.3, 0.45, 0.6].forEach((delay, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(440 + i * 100, now + delay);
          gain.gain.setValueAtTime(0.08, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.1);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + delay);
          osc.stop(now + delay + 0.12);
        });
      }
    } catch (e) {
      console.error('Error de audio:', e);
    }
  }, [sonidoActivado]);

  // ============================================
  // EFECTO DE PARTÍCULAS EN CANVAS
  // ============================================

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const resizeCanvas = (): void => {
      canvas.width = globalThis.innerWidth;
      canvas.height = globalThis.innerHeight;
    };
    resizeCanvas();
    globalThis.addEventListener('resize', resizeCanvas);
    
    // Crear partículas
    const particles: Particula[] = [];
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 2,
        speedY: (Math.random() - 0.5) * 2,
        color: `hsl(${Math.random() * 360}, 100%, 50%)`,
        life: Math.random() * 100 + 50
      });
    }
    particulasRef.current = particles;
    
    let animationFrame: number;
    
    const draw = (): void => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((p, index) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.life -= 0.5;
        
        if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
        if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;
        
        if (p.life <= 0) {
          particles[index] = {
            ...p,
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            life: 100 + Math.random() * 100
          };
        }
        
        const opacity = Math.min(p.life / 50, 0.3);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = opacity;
        ctx.fill();
      });
      
      animationFrame = requestAnimationFrame(draw);
    };
    
    draw();
    
    return () => {
      globalThis.removeEventListener('resize', resizeCanvas);
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, []);

  // ============================================
  // FUNCIONES PRINCIPALES
  // ============================================

  const generarCliente = useCallback((): void => {
    const nombres = [
      'Homero S.', 'Bart S.', 'Marge S.', 'Lisa S.', 'Maggie S.',
      'Moe S.', 'Ned F.', 'Krusty', 'Apu N.', 'Principal S.',
      'Milhouse V.', 'Nelson M.', 'Ralph W.', 'Todas las chicas malas'
    ];
    
    const nombre = nombres[Math.floor(Math.random() * nombres.length)];
    const nivel = Math.floor(Math.random() * 10) + 1;
    const experienciaInicial = Math.floor(Math.random() * 1000);
    
    const nuevoCliente: ClienteMutante = {
      id: `mut-${Date.now()}`,
      nombre,
      mutaciones: [],
      nivel,
      experiencia: experienciaInicial,
      fechaRegistro: new Date().toLocaleDateString('es-AR'),
      avatar: ['🤡', '🍔', '⭐', '🌈', '🔥', '💫', '🦸', '🧬'][Math.floor(Math.random() * 8)]
    };
    
    setCliente(nuevoCliente);
    setNivelActual(nivel);
    setExperiencia(experienciaInicial);
    
    // Efecto de confetti al crear cliente
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 }
    });
    
    reproducirSonido('exito');
  }, [reproducirSonido]);

  const simularMutacion = useCallback((): void => {
    if (!cliente || estaMutando) return;
    
    setEstaMutando(true);
    setMutacionObtenida(null);
    reproducirSonido('mutacion');
    
    // Elegir mutación basada en rareza
    const random = Math.random() * 100;
    let mutacionElegida: Mutacion | null = null;
    let acumulado = 0;
    
    for (const mut of MUTACIONES_DISPONIBLES) {
      acumulado += mut.porcentaje;
      if (random <= acumulado) {
        mutacionElegida = mut;
        break;
      }
    }
    
    if (!mutacionElegida) {
      mutacionElegida = MUTACIONES_DISPONIBLES[0];
    }
    
    // Mostrar animación de mutación
    setTimeout(() => {
      setMutacionObtenida(mutacionElegida!);
      
      // Actualizar cliente
      if (cliente) {
        const nuevasMutaciones = [...cliente.mutaciones, mutacionElegida!];
        const nuevaExperiencia = cliente.experiencia + Math.floor(Math.random() * 100) + 50;
        const nuevoNivel = Math.floor(nuevaExperiencia / 200) + 1;
        
        setCliente({
          ...cliente,
          mutaciones: nuevasMutaciones,
          experiencia: nuevaExperiencia,
          nivel: nuevoNivel
        });
        
        setNivelActual(nuevoNivel);
        setExperiencia(nuevaExperiencia);
        
        // Efectos según rareza
        if (mutacionElegida!.rareza === 'legendaria' || mutacionElegida!.rareza === 'mítica') {
          // Confetti masivo
          confetti({
            particleCount: 200,
            spread: 100,
            origin: { y: 0.5 }
          });
          
          setTimeout(() => {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.4 }
            });
          }, 300);
          
          reproducirSonido('levelup');
        } else if (mutacionElegida!.rareza === 'épica') {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.5 }
          });
        }
        
        // Agregar efectos
        setEfectosActivados(prev => [...prev, ...mutacionElegida!.efectos]);
        
        // Si sube de nivel, celebrar
        if (nuevoNivel > nivelActual) {
          setTimeout(() => {
            confetti({
              particleCount: 150,
              spread: 80,
              origin: { y: 0.3 }
            });
            reproducirSonido('levelup');
          }, 500);
        }
      }
      
      setEstaMutando(false);
    }, 2000);
    
  }, [cliente, estaMutando, nivelActual, reproducirSonido]);

  // ============================================
  // RENDERIZADO
  // ============================================

  if (!cliente) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#FAD02C] via-[#FFCA28] to-[#FFB300] p-4 md:p-8 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-4xl"
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: '-100%', opacity: [0, 1, 0] }}
              transition={{
                duration: 10 + Math.random() * 10,
                delay: Math.random() * 5,
                repeat: Infinity,
              }}
              style={{ left: `${Math.random() * 100}%` }}
            >
              {['🧬', '🔬', '🧪', '🧫', '🧬', '🔬', '🧪'][i % 7]}
            </motion.div>
          ))}
        </div>
        
        <div className="relative z-10 text-center max-w-2xl">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', duration: 1 }}
            className="text-8xl mb-8"
          >
            🧬
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl md:text-7xl font-black text-black uppercase tracking-tighter mb-4"
          >
            LABORATORIO DE <br />
            <span className="text-[#D32F2F]">MUTACIONES</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-lg md:text-xl font-bold text-black/70 mb-8"
          >
            ¿Estás listo para descubrir tu destino mutante? <br />
            La salsa secreta te espera...
          </motion.p>
          
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={generarCliente}
            className="bg-black text-white font-black uppercase tracking-wider px-10 py-5 rounded-xl border-4 border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all text-lg"
          >
            🧬 Comenzar Mutación
          </motion.button>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="text-xs font-bold text-black/40 mt-6 uppercase tracking-widest"
          >
            * La mutación puede ser permanente. Krusty Corp no se hace responsable.
          </motion.p>
        </div>
      </main>
    );
  }

  return (
    <main className={`min-h-screen transition-colors duration-500 ${
      modoOscuro ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-[#FAD02C] via-[#FFCA28] to-[#FFB300] text-black'
    } p-4 md:p-8 relative overflow-hidden`}>
      
      {/* Canvas de partículas */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />
      
      {/* Header */}
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <Link
            href="/"
            className={`${
              modoOscuro ? 'bg-white text-black' : 'bg-black text-white'
            } px-4 py-2 rounded-lg font-black text-sm uppercase tracking-wider hover:scale-105 transition-all shadow-lg`}
          >
            ⬅ Volver
          </Link>
          
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setSonidoActivado(!sonidoActivado)}
              className="text-2xl hover:scale-110 transition-all"
            >
              {sonidoActivado ? '🔊' : '🔇'}
            </button>
            
            <button
              type="button"
              onClick={() => setModoOscuro(!modoOscuro)}
              className="text-2xl hover:scale-110 transition-all"
            >
              {modoOscuro ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
        
        {/* Perfil del Cliente */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${
            modoOscuro ? 'bg-gray-800/80 border-gray-700' : 'bg-white/80 border-black'
          } backdrop-blur-sm border-2 rounded-xl p-6 mb-8 shadow-2xl`}
        >
          <div className="flex flex-wrap items-center gap-6">
            <div className="text-6xl">{cliente.avatar}</div>
            
            <div className="flex-1">
              <h2 className="text-2xl font-black">{cliente.nombre}</h2>
              <p className={`text-sm ${modoOscuro ? 'text-gray-400' : 'text-gray-600'}`}>
                🧬 Mutante desde {cliente.fechaRegistro}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4 items-center">
              <div className={`${
                modoOscuro ? 'bg-gray-700' : 'bg-black/10'
              } px-4 py-2 rounded-lg text-center`}>
                <p className="text-xs font-black uppercase tracking-wider">Nivel</p>
                <p className="text-2xl font-black">{nivelActual}</p>
              </div>
              
              <div className={`${
                modoOscuro ? 'bg-gray-700' : 'bg-black/10'
              } px-4 py-2 rounded-lg text-center`}>
                <p className="text-xs font-black uppercase tracking-wider">Exp</p>
                <p className="text-2xl font-black">{experiencia}</p>
              </div>
              
              <div className={`${
                modoOscuro ? 'bg-gray-700' : 'bg-black/10'
              } px-4 py-2 rounded-lg text-center`}>
                <p className="text-xs font-black uppercase tracking-wider">Mutaciones</p>
                <p className="text-2xl font-black">{cliente.mutaciones.length}</p>
              </div>
            </div>
          </div>
          
          {/* Barra de experiencia */}
          <div className="mt-4">
            <div className="flex justify-between text-xs font-bold mb-1">
              <span>Experiencia</span>
              <span>{experiencia % 200} / 200</span>
            </div>
            <div className={`w-full h-3 ${
              modoOscuro ? 'bg-gray-700' : 'bg-black/20'
            } rounded-full overflow-hidden border-2 ${
              modoOscuro ? 'border-gray-600' : 'border-black'
            }`}>
              <motion.div
                className="h-full bg-gradient-to-r from-[#FAD02C] to-[#D32F2F]"
                initial={{ width: 0 }}
                animate={{ width: `${(experiencia % 200) / 200 * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </motion.div>
        
        {/* Grid Principal */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Panel de Mutaciones */}
          <div className="lg:col-span-2 space-y-6">
            <div className={`${
              modoOscuro ? 'bg-gray-800/80 border-gray-700' : 'bg-white/80 border-black'
            } backdrop-blur-sm border-2 rounded-xl p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-black uppercase tracking-tighter">
                  🧬 Tus Mutaciones
                </h3>
                <span className={`text-xs font-bold ${
                  modoOscuro ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {cliente.mutaciones.length} activas
                </span>
              </div>
              
              {cliente.mutaciones.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-6xl mb-4">🧫</p>
                  <p className="font-bold">Aún no has mutado</p>
                  <p className={`text-sm ${modoOscuro ? 'text-gray-400' : 'text-gray-600'}`}>
                    ¡Presiona el botón de mutación para comenzar tu transformación!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2">
                  {cliente.mutaciones.map((mut, index) => (
                    <motion.div
                      key={`${mut.id}-${index}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className={`${
                        modoOscuro ? 'bg-gray-700/50' : 'bg-black/5'
                      } p-4 rounded-xl border-2 cursor-pointer hover:scale-[1.02] transition-all`}
                      style={{ borderColor: mut.color }}
                      onClick={() => setMutacionSeleccionada(mut)}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">{mut.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-sm truncate">{mut.nombre}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span 
                              className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: mut.color + '33', color: mut.color }}
                            >
                              {mut.rareza}
                            </span>
                            <span className={`text-[10px] font-bold ${modoOscuro ? 'text-gray-400' : 'text-gray-600'}`}>
                              Poder: {mut.poder}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Botón de Mutación */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={simularMutacion}
              disabled={estaMutando}
              className={`w-full py-4 font-black uppercase tracking-wider text-lg rounded-xl border-4 transition-all ${
                estaMutando
                  ? 'bg-gray-500 cursor-not-allowed opacity-50'
                  : `${
                      modoOscuro 
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 border-white text-white' 
                        : 'bg-gradient-to-r from-[#D32F2F] to-[#F44336] border-black text-white'
                    } hover:shadow-2xl hover:-translate-y-1`
              }`}
            >
              {estaMutando ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    🧬
                  </motion.span>
                  MUTANDO...
                </span>
              ) : (
                '🧪 ¡Mutar Ahora!'
              )}
            </motion.button>
          </div>
          
          {/* Panel de Información */}
          <div className="space-y-6">
            {/* Efectos activos */}
            <div className={`${
              modoOscuro ? 'bg-gray-800/80 border-gray-700' : 'bg-white/80 border-black'
            } backdrop-blur-sm border-2 rounded-xl p-6`}>
              <h4 className="text-sm font-black uppercase tracking-tighter mb-3">
                ⚡ Efectos Activos
              </h4>
              
              {efectosActivados.length === 0 ? (
                <p className={`text-sm ${modoOscuro ? 'text-gray-400' : 'text-gray-600'}`}>
                  Sin efectos activos. ¡Muta para obtener poderes!
                </p>
              ) : (
                <ul className="space-y-2 max-h-[200px] overflow-y-auto">
                  {[...new Set(efectosActivados)].map((efecto, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`${
                        modoOscuro ? 'bg-gray-700/50' : 'bg-black/5'
                      } p-2 rounded-lg text-sm font-medium flex items-center gap-2`}
                    >
                      <span className="text-green-500">✓</span>
                      {efecto}
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>
            
            {/* Estadísticas */}
            <div className={`${
              modoOscuro ? 'bg-gray-800/80 border-gray-700' : 'bg-white/80 border-black'
            } backdrop-blur-sm border-2 rounded-xl p-6`}>
              <h4 className="text-sm font-black uppercase tracking-tighter mb-3">
                📊 Estadísticas Mutantes
              </h4>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className={modoOscuro ? 'text-gray-400' : 'text-gray-600'}>
                    Poder Total
                  </span>
                  <span className="font-black">
                    {cliente.mutaciones.reduce((acc, m) => acc + m.poder, 0)}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className={modoOscuro ? 'text-gray-400' : 'text-gray-600'}>
                    Rarezas Únicas
                  </span>
                  <span className="font-black">
                    {new Set(cliente.mutaciones.map(m => m.rareza)).size}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className={modoOscuro ? 'text-gray-400' : 'text-gray-600'}>
                    Mutaciones por minuto
                  </span>
                  <span className="font-black">
                    {cliente.mutaciones.length > 0 
                      ? (cliente.mutaciones.length / ((Date.now() - new Date(cliente.fechaRegistro).getTime()) / 60000)).toFixed(1)
                      : '0'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Modal de Mutación Obtenida */}
        <AnimatePresence>
          {mutacionObtenida && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setMutacionObtenida(null)}
            >
              <motion.div
                initial={{ scale: 0.5, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0.5, rotate: 10 }}
                className={`max-w-lg w-full ${
                  modoOscuro ? 'bg-gray-800' : 'bg-white'
                } rounded-2xl p-8 text-center border-4 shadow-2xl`}
                style={{ borderColor: mutacionObtenida.color }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className="text-8xl mb-4"
                  >
                    {mutacionObtenida.emoji}
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div 
                      className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase mb-3"
                      style={{ backgroundColor: mutacionObtenida.color + '33', color: mutacionObtenida.color }}
                    >
                      {mutacionObtenida.rareza.toUpperCase()}
                    </div>
                    
                    <h3 className="text-2xl font-black mb-2">
                      ¡{mutacionObtenida.nombre}!
                    </h3>
                    
                    <p className={`text-sm ${modoOscuro ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                      {mutacionObtenida.descripcion}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 justify-center mb-6">
                      {mutacionObtenida.efectos.map((efecto, i) => (
                        <span key={i} className={`${
                          modoOscuro ? 'bg-gray-700' : 'bg-black/10'
                        } px-3 py-1 rounded-full text-xs font-medium`}>
                          ✨ {efecto}
                        </span>
                      ))}
                    </div>
                    
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setMutacionObtenida(null)}
                      className={`${
                        modoOscuro ? 'bg-white text-black' : 'bg-black text-white'
                      } px-8 py-3 rounded-lg font-black uppercase tracking-wider text-sm border-2 transition-all`}
                    >
                      🚀 ¡Increíble!
                    </motion.button>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal de Detalle de Mutación */}
        <AnimatePresence>
          {mutacionSeleccionada && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setMutacionSeleccionada(null)}
            >
              <motion.div
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 20 }}
                className={`max-w-md w-full ${
                  modoOscuro ? 'bg-gray-800' : 'bg-white'
                } rounded-2xl p-6 shadow-2xl border-2`}
                style={{ borderColor: mutacionSeleccionada.color }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center">
                  <div className="text-7xl mb-4">{mutacionSeleccionada.emoji}</div>
                  
                  <h3 className="text-2xl font-black mb-2">{mutacionSeleccionada.nombre}</h3>
                  
                  <div className="flex justify-center gap-2 mb-4">
                    <span 
                      className="text-xs font-black uppercase px-3 py-1 rounded-full"
                      style={{ backgroundColor: mutacionSeleccionada.color + '33', color: mutacionSeleccionada.color }}
                    >
                      {mutacionSeleccionada.rareza}
                    </span>
                    <span className={`text-xs font-black uppercase px-3 py-1 rounded-full ${
                      modoOscuro ? 'bg-gray-700' : 'bg-black/10'
                    }`}>
                      Poder: {mutacionSeleccionada.poder}
                    </span>
                  </div>
                  
                  <p className={`text-sm ${modoOscuro ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                    {mutacionSeleccionada.descripcion}
                  </p>
                  
                  <div className="text-left mb-6">
                    <p className="text-xs font-black uppercase tracking-wider mb-2">Efectos:</p>
                    <ul className="space-y-1">
                      {mutacionSeleccionada.efectos.map((efecto, i) => (
                        <li key={i} className={`text-sm flex items-center gap-2 ${
                          modoOscuro ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          <span className="text-green-500">✦</span>
                          {efecto}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setMutacionSeleccionada(null)}
                    className={`w-full py-3 rounded-lg font-black uppercase tracking-wider text-sm transition-all ${
                      modoOscuro 
                        ? 'bg-white text-black hover:bg-gray-200' 
                        : 'bg-black text-white hover:bg-gray-800'
                    }`}
                  >
                    Cerrar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}