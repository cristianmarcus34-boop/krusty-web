"use client";

import { useEffect, useState } from 'react';

export default function DefensaPage() {
    const [lastOrderId, setLastOrderId] = useState<string | null>(null);

    useEffect(() => {
        // Sincronizado con el nombre que usas en GraciasPage
        const data = localStorage.getItem('ultimo_pedido_krusty');
        
        if (data) {
            try {
                // Parseamos el JSON porque guardás { id, fecha }
                const parsedData = JSON.parse(data);
                if (parsedData.id) {
                    setLastOrderId(parsedData.id);
                }
            } catch (err) {
                console.error("Error al leer el pedido de localStorage:", err);
            }
        }
    }, []);

    const handleWhatsAppArrepentimiento = () => {
        const telefono = "5491138305837";
        
        const pedidoInfo = lastOrderId 
            ? `*Nro de Pedido:* #${lastOrderId}` 
            : "*Nro de Pedido:* _(Completar aquí o adjuntar captura del ticket)_";

        const mensaje = encodeURIComponent(
            "🍔 *SOLICITUD DE CANCELACIÓN*\n\n" +
            "Hola Krusty Burger, quiero solicitar la cancelación de mi pedido.\n\n" +
            "*Motivo:* \n" +
            pedidoInfo + "\n\n" +
            "_Entiendo que la cancelación está sujeta a que el producto no haya iniciado su preparación en cocina._"
        );
        
        window.open(`https://wa.me/${telefono}?text=${mensaje}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-white pt-24 pb-16 px-6">
            <div className="max-w-3xl mx-auto text-center">
                <div className="inline-block bg-[#D32F2F] text-white px-4 py-1 rounded-full font-black text-[10px] mb-4 border-2 border-black">
                    INFORMACIÓN AL CONSUMIDOR
                </div>
                
                <h1 className="text-4xl font-black uppercase italic tracking-tighter mb-12 text-black block">
                    Protección al Cliente
                </h1>

                {/* Card Legal Principal */}
                <div className="bg-stone-50 border-4 border-black p-8 rounded-3xl shadow-[8px_8px_0px_0px_black] text-left mb-10">
                    <h2 className="text-xl font-black uppercase italic mb-4 text-black">¿Necesitás ayuda?</h2>
                    <p className="text-sm text-stone-600 mb-6 leading-relaxed">
                        De acuerdo con las leyes vigentes de la República Argentina, tenés derecho a recibir información clara, detallada y veraz sobre los productos que consumís.
                    </p>
                    
                    <div className="space-y-5 border-t border-stone-200 pt-6">
                        <div className="flex gap-4 items-start">
                            <span className="text-2xl">⚖️</span>
                            <div>
                                <p className="font-black uppercase text-xs text-black">Defensa del Consumidor</p>
                                <p className="text-[11px] text-stone-500">Línea gratuita nacional: <span className="font-bold text-black">0800-666-1518</span>.</p>
                                <a 
                                    href="https://www.argentina.gob.ar/produccion/defensadelconsumidor/formulario" 
                                    target="_blank" 
                                    className="text-[10px] font-bold text-[#D32F2F] underline uppercase hover:text-black transition-colors"
                                >
                                    Realizar un reclamo oficial aquí
                                </a>
                            </div>
                        </div>
                        
                        <div className="flex gap-4 items-start">
                            <span className="text-2xl">🇦🇷</span>
                            <div>
                                <p className="font-black uppercase text-xs text-black">Protección de Datos</p>
                                <p className="text-[11px] text-stone-500">Órgano de control de la Ley N° 25.326 (Agencia de Acceso a la Información Pública).</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECCIÓN BOTÓN DE ARREPENTIMIENTO */}
                <div className="border-t-2 border-dashed border-stone-200 pt-10">
                    <h3 className="font-black uppercase text-sm mb-2 text-black italic text-center">Botón de Arrepentimiento</h3>
                    
                    {lastOrderId && (
                        <div className="mb-4 inline-flex items-center gap-2 bg-[#4DB6AC]/10 px-4 py-1.5 rounded-full border-2 border-[#4DB6AC] animate-in fade-in slide-in-from-bottom-2">
                           <span className="w-2 h-2 bg-[#4DB6AC] rounded-full animate-ping" />
                           <p className="text-[10px] font-black text-[#4DB6AC] uppercase tracking-wider">
                                Pedido detectado: #{lastOrderId.toString().slice(-6).toUpperCase()}
                           </p>
                        </div>
                    )}

                    <p className="text-xs text-stone-500 mb-6 max-w-sm mx-auto leading-relaxed">
                        Tenés 10 días corridos para revocar tu compra online si el producto no ha sido consumido o manipulado.
                    </p>

                    <button 
                        onClick={handleWhatsAppArrepentimiento}
                        className="bg-[#25D366] text-white border-4 border-black px-8 py-4 rounded-2xl font-black text-sm uppercase hover:scale-105 transition-all shadow-[6px_6px_0px_0px_black] active:translate-y-1 active:shadow-none mb-8 flex items-center justify-center gap-3 mx-auto"
                    >
                        <span>Solicitar Cancelación vía WhatsApp</span>
                        <span className="text-xl">💬</span>
                    </button>

                    <div className="max-w-md mx-auto p-5 bg-stone-100 rounded-2xl border-2 border-black border-dashed text-left">
                        <p className="text-[9px] text-stone-500 leading-tight uppercase font-bold italic">
                            <span className="text-[#D32F2F] font-black">Nota Importante:</span> De acuerdo con el Código Civil y Comercial, el derecho de revocación no aplica a productos perecederos (alimentos) que hayan iniciado su preparación o despacho. Las cancelaciones solo serán válidas si el pedido no entró en cocina.
                        </p>
                    </div>
                </div>

                {/* Enlace adicional externo (Estilo Krusty) */}
                <div className="mt-12">
                    <a 
                        href="https://autogestion.produccion.gob.ar/consumidores" 
                        target="_blank"
                        className="text-[10px] font-black text-stone-400 uppercase tracking-widest hover:text-[#D32F2F] transition-colors"
                    >
                        Portal de Autogestión de Consumidores ↗
                    </a>
                </div>

                <p className="mt-16 text-[9px] font-black text-stone-300 uppercase tracking-[0.4em]">
                    Agencia Powa · Springfield Digital
                </p>
            </div>
        </div>
    );
}