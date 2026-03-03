"use client"; // <--- Fundamental para que React maneje el click en el cliente

import { Burger } from '@/types';
import { useCartStore } from '@/store/cartStore';

export default function BurgerCard({ burger }: { burger: Burger }) {
  // Conectamos este componente con la función de agregar del Store
  const addItem = useCartStore((state) => state.addItem);

  return (
    <div className="bg-white border-4 border-yellow-400 rounded-3xl p-6 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
      {/* Imagen con un contenedor para que no se deforme */}
      <div className="relative w-full h-44 mb-4">
        <img 
          src={burger.imagen} 
          alt={burger.nombre} 
          className="w-full h-full object-contain"
        />
      </div>

      {/* Título estilo "Fast Food" */}
      <h3 className="text-2xl font-black text-red-600 uppercase italic leading-tight mb-2">
        {burger.nombre}
      </h3>
      
      {/* Descripción */}
      <p className="text-gray-700 text-sm font-medium h-10 overflow-hidden mb-4">
        {burger.descripcion}
      </p>

      <div className="flex justify-between items-center border-t-2 border-dashed border-gray-200 pt-4">
        {/* Precio destacado */}
        <span className="text-2xl font-black text-black">
          ${burger.precio.toLocaleString('es-AR')}
        </span>
        
        {/* Botón con acción de Zustand */}
        <button 
          onClick={() => addItem(burger)}
          className="bg-red-600 hover:bg-yellow-400 text-white hover:text-black font-extrabold py-3 px-6 rounded-2xl shadow-lg active:scale-90 transition-all duration-150 uppercase tracking-tighter"
        >
          ¡Lo quiero!
        </button>
      </div>
    </div>
  );
}