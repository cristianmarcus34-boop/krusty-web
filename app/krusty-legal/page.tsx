'use client';

import { useState, useRef, useTransition, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// Constantes de Configuración Inmutable
const LEGAL_SECTIONS = [
    {
        id: 'bio-property',
        title: 'Cláusula 1: Propiedad Biológica Integral',
        content: 'El usuario acepta que cualquier mutación resultante de la ingesta de nuestros productos (como el desarrollo de un tercer ojo, branquias funcionales o un tono de piel amarillo brillante #FAD02C) pasará a ser propiedad intelectual registrada de Krusty Corp. En caso de insolvencia financiera al pagar su cuenta, nos reservamos el derecho de reclamar su segundo riñón mediante nuestro equipo de cirujanos payaso certificados.'
    },
    {
        id: 'bacteriological-disclaimer',
        title: 'Cláusula 2: Exoneración por Negligencia Sanitaria',
        content: 'Krusty Burger no se hace responsable por colapsos cardiovasculares, desprendimiento de retina por succión de batidos espesos, alucinaciones severas causadas por la salsa secreta, o el hallazgo de colas de roedor en el pan de su hamburguesa. Si experimenta síntomas de mutación o paro, por favor comuníquese con el Dr. Nick Riviera (1-800-DOCTORB) and evite colapsar dentro de nuestras instalaciones.'
    },
    {
        id: 'springfield-jurisdiction',
        title: 'Cláusula 3: Jurisdicción Suprema de Springfield',
        content: 'Cualquier intento de demanda civil o colectiva será desestimado de inmediato por improcedente. Las disputas legales se resolverán exclusivamente mediante un duelo a muerte con cuchillos detrás de la Taberna de Moe al amanecer. El Jefe Gorgory (Wiggum) actuará como juez supremo y árbitro del encuentro, reservándose el derecho de aceptar sobornos en forma de donas glaseadas.'
    },
    {
        id: 'refund-policy',
        title: 'Cláusula 4: Policy de Reembolsos Inexistentes',
        content: 'No se devuelve dinero en efectivo, divisas extranjeras ni criptomonedas bajo ninguna circunstancia. Los clientes insatisfechos o sobrevivientes a una intoxicación severa recibirán un cupón vencido para el parque de diversiones Krustyland, válido únicamente en días de alerta por lluvia torrencial y granizo del tamaño de una hamburguesa clásica.'
    }
];

export default function KrustyLegalPage() {
    const [accepted, setAccepted] = useState(false);
    const [isSigned, setIsSigned] = useState(false);
    const [audioMuted, setAudioMuted] = useState(false);
    const [isPending, startTransition] = useTransition();

    const audioContextRef = useRef<AudioContext | null>(null);

    const soulHash = useMemo(() => Math.random().toString(36).substring(2, 15).toUpperCase(), []);

    // ============================================
    // OPTIMIZACIÓN: playKrustyLaughEffect con requestIdleCallback
    // ============================================
    const playKrustyLaughEffect = useCallback(() => {
        if (audioMuted) return;

        // Usar requestIdleCallback para ejecutar cuando la UI esté libre
        const playSound = () => {
            try {
                const AudioContextClass = globalThis.AudioContext || (globalThis as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
                if (!AudioContextClass) return;

                if (!audioContextRef.current) {
                    audioContextRef.current = new AudioContextClass();
                }

                const ctx = audioContextRef.current;
                const now = ctx.currentTime;

                // Reducir el número de osciladores para mejor performance
                const times = [0, 0.15];
                times.forEach((delay) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();

                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(450, now + delay);
                    osc.frequency.exponentialRampToValueAtTime(150, now + delay + 0.1);

                    gain.gain.setValueAtTime(0.1, now + delay);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.1);

                    osc.connect(gain);
                    gain.connect(ctx.destination);

                    osc.start(now + delay);
                    osc.stop(now + delay + 0.12);
                });
            } catch (e) {
                console.error("Audio block por interacción del navegador:", e);
            }
        };

        // Usar requestIdleCallback si está disponible
        if ('requestIdleCallback' in globalThis) {
            globalThis.requestIdleCallback(playSound);
        } else {
            setTimeout(playSound, 50);
        }
    }, [audioMuted]);

    // ============================================
    // OPTIMIZACIÓN: handleSignContract con requestAnimationFrame
    // ============================================
    const handleSignContract = useCallback(() => {
        if (!accepted) return;

        // Usar requestAnimationFrame para no bloquear la UI
        globalThis.requestAnimationFrame(() => {
            startTransition(() => {
                setIsSigned(true);
            });
        });

        // Ejecutar efecto de sonido después de la transición
        setTimeout(() => {
            playKrustyLaughEffect();
        }, 100);
    }, [accepted, playKrustyLaughEffect]);

    return (
        <main className="min-h-screen bg-[#FAD02C] p-4 md:p-8 flex flex-col items-center justify-center font-sans antialiased selection:bg-[#E21B22] selection:text-white relative">

            <Link
                href="/"
                className="absolute top-4 left-4 bg-white text-black text-xs font-black p-2 border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all z-10 uppercase tracking-wider"
            >
                ⬅️ Volver
            </Link>

            <button
                type="button"
                onClick={() => setAudioMuted(!audioMuted)}
                className="absolute top-4 right-4 bg-black text-white text-xs font-black p-2 border-2 border-white rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all z-10"
                aria-label={audioMuted ? "Activar efectos de sonido" : "Mutear efectos de sonido"}
            >
                {audioMuted ? '🔇 MUTED' : '🔊 AUDIO: ON'}
            </button>

            <div className="w-full max-w-2xl flex flex-col items-center justify-center flex-grow py-12">
                <AnimatePresence mode="wait">
                    {!isSigned ? (
                        <motion.div
                            key="contract-form"
                            initial={{ scale: 0.9, opacity: 0, rotate: -2 }}
                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                            exit={{ scale: 0.8, opacity: 0, y: 100, rotate: 5 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20 }}
                            className="w-full bg-[#FFFDF0] border-4 border-black rounded-xl shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] p-6 md:p-10 text-black relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-[#E21B22] to-transparent opacity-20" />

                            <header className="border-b-4 border-dashed border-black pb-4 mb-6 text-center">
                                <motion.h1
                                    initial={{ y: -10 }}
                                    animate={{ y: 0 }}
                                    className="text-4xl font-black uppercase tracking-tight text-[#E21B22] drop-shadow-[2px_2px_0px_rgba(0,0,0,0.15)]"
                                >
                                    Krusty Corporación
                                </motion.h1>
                                <p className="text-xs font-black uppercase tracking-widest mt-1 text-gray-700">
                                    Gabinete Jurídico y Evasión Preventiva de Demandas Civiles
                                </p>
                            </header>

                            <div
                                className="space-y-6 max-h-[380px] overflow-y-auto pr-2 text-sm leading-relaxed border-2 border-black p-4 bg-white rounded-lg"
                                style={{ scrollBehavior: 'smooth' }}
                            >
                                <div className="bg-[#E21B22]/10 p-3 rounded border border-[#E21B22] text-xs font-bold uppercase text-[#E21B22] text-center mb-4">
                                    ⚠️ ADVERTENCIA DE SEGURIDAD BIOLÓGICA Y FINANCIERA ⚠️
                                </div>

                                {LEGAL_SECTIONS.map((section) => (
                                    <section key={section.id} className="group border-b border-gray-200 pb-4 last:border-none">
                                        <h2 className="font-extrabold uppercase text-[#E21B22] text-base mb-1 group-hover:text-black transition-colors">
                                            {section.title}
                                        </h2>
                                        <p className="text-gray-800 font-medium text-justify">
                                            {section.content}
                                        </p>
                                    </section>
                                ))}
                            </div>

                            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t-2 border-black pt-6">
                                <label className="flex items-center gap-3 cursor-pointer select-none group w-full sm:w-auto">
                                    <input
                                        type="checkbox"
                                        checked={accepted}
                                        onChange={(e) => setAccepted(e.target.checked)}
                                        className="w-6 h-6 accent-[#E21B22] cursor-pointer border-2 border-black rounded transition-transform active:scale-95"
                                    />
                                    <span className="text-xs font-black uppercase text-gray-800 group-hover:text-[#E21B22] transition-colors">
                                        Acepto ceder mi alma, órganos y salud a Krusty Corp
                                    </span>
                                </label>

                                {/* BOTÓN OPTIMIZADO - SIN sombras pesadas */}
                                <motion.button
                                    type="button"
                                    whileHover={accepted ? { scale: 1.02 } : {}}
                                    whileTap={accepted ? { scale: 0.98 } : {}}
                                    onClick={handleSignContract}
                                    disabled={!accepted || isPending}
                                    className={`w-full sm:w-auto px-6 py-3 font-black uppercase tracking-wider text-white border-4 border-black rounded-lg transition-colors ${accepted && !isPending
                                            ? 'bg-[#E21B22] hover:bg-black cursor-pointer'
                                            : 'bg-gray-400 cursor-not-allowed opacity-50'
                                        }`}
                                >
                                    {isPending ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            PROCESANDO ALMA...
                                        </span>
                                    ) : (
                                        'FIRMAR CONTRATO ✍️'
                                    )}
                                </motion.button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="success-screen"
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", damping: 15 }}
                            className="w-full max-w-md bg-black text-[#FAD02C] border-4 border-white rounded-xl shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] p-8 text-center flex flex-col items-center"
                        >
                            <span className="text-6xl block mb-4 animate-bounce">🤡</span>
                            <h2 className="text-3xl font-black uppercase tracking-tight text-white mb-2">
                                ¡PROPIEDAD DE KRUSTY!
                            </h2>
                            <p className="text-sm font-bold text-gray-300 leading-relaxed mb-6">
                                Tu contrato ha sido cifrado y archivado en las oficinas de las Islas Caimán.
                                Gracias por elegir Krusty Burger. Disfruta tu comida si tu sistema digestivo lo permite.
                            </p>

                            <div className="w-full bg-zinc-900 border border-zinc-700 rounded-md p-3 font-mono text-xs tracking-wider text-green-400 select-all mb-6">
                                HASH_ALMA: {soulHash}
                            </div>

                            <Link
                                href="/"
                                className="w-full bg-[#FAD02C] text-black font-black uppercase tracking-widest py-3 border-2 border-white rounded transition-colors hover:bg-[#FFB300] text-xs"
                            >
                                Volver a la tienda
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <footer className="w-full max-w-2xl mt-auto pt-8 border-t border-black/10 text-center">
                <p className="text-[10px] font-bold text-black/40 tracking-tight text-justify sm:text-center leading-normal uppercase">
                    Aviso de Exención de Responsabilidad Legal de Fanáticos (Real): Este sitio web es un entorno de desarrollo
                    experimental interactivo sin fines de lucro creado por y para fanáticos. No posee afiliación comercial,
                    respaldo explícito, ni vínculos corporativos con Matt Groening, Twentieth Century Fox Film Corporation,
                    Gracie Films, ni The Walt Disney Company. La marca &quot;Krusty Burger&quot;, logos, personajes y propiedad
                    intelectual asociada pertenecen exclusivamente a sus titulares de derechos legítimos.
                </p>
            </footer>
        </main>
    );
}