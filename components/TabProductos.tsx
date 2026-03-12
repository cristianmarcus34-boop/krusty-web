"use client";
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import ModalNuevoProducto from './ModalNuevoProducto';
import ModalEditarProducto from './ModalEditarProducto'; // Importamos el nuevo modal
import ModalBorrarKrusty from './ModalBorrarKrusty';

export default function TabProductos() {
    const [productos, setProductos] = useState<any[]>([]);
    const [idsModificados, setIdsModificados] = useState<Set<number>>(new Set());
    const [showModal, setShowModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Estados para Modales de Acción
    const [productoParaBorrar, setProductoParaBorrar] = useState<any | null>(null);
    const [productoAEditar, setProductoAEditar] = useState<any | null>(null);

    const fetchProductos = useCallback(async () => {
        const { data } = await supabase
            .from('productos')
            .select('*, producto_adicionales(adicionales(id, nombre))')
            .order('categoria');
        if (data) setProductos(data);
    }, []);

    useEffect(() => { fetchProductos(); }, [fetchProductos]);

    const handleLocalChange = (id: number, campo: string, valor: any) => {
        setIdsModificados(prev => new Set(prev).add(id));
        setProductos(prev => prev.map(p => p.id === id ? { ...p, [campo]: valor } : p));
    };

    const guardarCambiosRapidos = async () => {
        setIsSaving(true);
        try {
            const promesas = productos.filter(p => idsModificados.has(p.id)).map(prod =>
                supabase.from('productos').update({
                    nombre: prod.nombre,
                    precio: Number(prod.precio),
                    descripcion: prod.descripcion
                }).eq('id', prod.id)
            );
            await Promise.all(promesas);
            setIdsModificados(new Set());
            alert("✅ ¡Cambios rápidos guardados!");
        } catch (err) {
            alert("Error al guardar cambios");
        } finally {
            setIsSaving(false);
        }
    };

    const ejecutarEliminacion = async () => {
        if (!productoParaBorrar) return;
        const idABorrar = productoParaBorrar.id;

        try {
            // Eliminación visual instantánea
            setProductos((prev) => prev.filter(p => p.id !== idABorrar));
            setProductoParaBorrar(null);

            const { error } = await supabase
                .from('productos')
                .delete()
                .eq('id', idABorrar);

            if (error) {
                alert("No se pudo eliminar de la base de datos.");
                fetchProductos();
            }
        } catch (err) {
            console.error("Error inesperado:", err);
            fetchProductos();
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Botón Principal */}
            <button 
                onClick={() => setShowModal(true)} 
                className="w-full bg-[#D32F2F] text-white border-8 border-black p-8 rounded-[3rem] font-black uppercase text-2xl italic shadow-[10px_10px_0px_0px_black] hover:-translate-y-1 active:translate-y-0 active:shadow-none transition-all"
            >
                + AGREGAR NUEVO ITEM 🔥
            </button>

            {/* Barra de Guardado Rápido (Solo si hay cambios en texto) */}
            {idsModificados.size > 0 && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60] w-full max-w-md px-4">
                    <button onClick={guardarCambiosRapidos} disabled={isSaving} className="w-full bg-green-500 text-white border-8 border-black p-6 rounded-[3rem] font-black text-2xl italic animate-bounce shadow-2xl">
                        {isSaving ? 'GUARDANDO...' : '🔥 GUARDAR CAMBIOS'}
                    </button>
                </div>
            )}

            {/* Grilla de Productos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {productos.map((prod) => (
                    <div key={prod.id} className={`relative bg-white border-4 border-black p-6 rounded-[3rem] shadow-[8px_8px_0px_0px_black] flex flex-col gap-4 transition-all ${idsModificados.has(prod.id) ? 'ring-8 ring-green-400' : ''}`}>

                        {/* Botón EDITAR (Amarillo) */}
                        <button
                            onClick={() => setProductoAEditar(prod)}
                            className="absolute -top-3 right-10 bg-[#FFCA28] text-black border-4 border-black w-10 h-10 rounded-full font-black shadow-[4px_4px_0px_0px_black] hover:scale-110 active:scale-95 transition-transform z-10 flex items-center justify-center"
                            title="Editar extras y detalles"
                        >
                            ✏️
                        </button>

                        {/* Botón ELIMINAR (Blanco/Rojo) */}
                        <button
                            onClick={() => setProductoParaBorrar(prod)}
                            className="absolute -top-3 -right-3 bg-white text-[#D32F2F] border-4 border-black w-10 h-10 rounded-full font-black shadow-[4px_4px_0px_0px_black] hover:scale-110 active:scale-95 transition-transform z-10 flex items-center justify-center"
                        >
                            ✕
                        </button>

                        <div className="flex gap-4">
                            <img src={prod.imagen} className="w-24 h-24 object-cover rounded-2xl border-4 border-black bg-stone-100" />
                            <div className="flex-1 space-y-2">
                                <input
                                    value={prod.nombre}
                                    onChange={(e) => handleLocalChange(prod.id, 'nombre', e.target.value)}
                                    className="w-full font-black text-lg uppercase italic bg-transparent border-b-2 border-black outline-none focus:border-red-500"
                                />
                                <input
                                    type="number"
                                    value={prod.precio}
                                    onChange={(e) => handleLocalChange(prod.id, 'precio', e.target.value)}
                                    className="w-full font-black text-2xl text-[#D32F2F] bg-transparent outline-none"
                                />
                            </div>
                        </div>
                        <textarea
                            value={prod.descripcion || ''}
                            onChange={(e) => handleLocalChange(prod.id, 'descripcion', e.target.value)}
                            className="w-full border-4 border-black p-3 rounded-2xl font-bold text-xs h-20 resize-none outline-none focus:bg-stone-50"
                            placeholder="Descripción del producto..."
                        />
                    </div>
                ))}
            </div>

            {/* MODAL: NUEVO PRODUCTO */}
            {showModal && (
                <ModalNuevoProducto
                    onClose={() => setShowModal(false)}
                    onSuccess={fetchProductos}
                />
            )}

            {/* MODAL: EDITAR PRODUCTO (Extras y Datos) */}
            {productoAEditar && (
                <ModalEditarProducto
                    producto={productoAEditar}
                    onClose={() => setProductoAEditar(null)}
                    onSuccess={fetchProductos}
                />
            )}

            {/* MODAL: BORRAR */}
            <ModalBorrarKrusty
                isOpen={productoParaBorrar !== null}
                mensaje="¿BORRAR PRODUCTO DEL MENÚ?"
                itemNombre={productoParaBorrar?.nombre}
                onConfirm={ejecutarEliminacion}
                onCancel={() => setProductoParaBorrar(null)}
            />
        </div>
    );
}