"use client";
import { createPortal } from 'react-dom';

interface Props {
  isOpen: boolean;
  mensaje: string;
  itemNombre?: string; // Para mostrar qué estamos borrando (ej: "Hamburguesa Doble")
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ModalBorrarKrusty({ isOpen, mensaje, itemNombre, onConfirm, onCancel }: Props) {
  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[100000] flex items-center justify-center overflow-y-auto p-3 sm:p-4 bg-black/85 backdrop-blur-sm">
      <div className="w-full max-w-md max-h-[calc(100vh-1.5rem)] overflow-y-auto bg-white border-4 sm:border-10 border-black p-5 sm:p-10 rounded-[2rem] sm:rounded-[4rem] shadow-[8px_8px_0px_0px_#D32F2F] sm:shadow-[20px_20px_0px_0px_#D32F2F] animate-in zoom-in duration-200">
        <div className="text-center">
          <div className="text-5xl sm:text-6xl mb-4 sm:mb-6">🗑️</div>

          <h2 className="text-2xl sm:text-3xl font-black uppercase italic leading-none mb-2 text-black">
            {mensaje}
          </h2>

          {itemNombre && (
            <p className="text-[#D32F2F] font-black text-lg sm:text-xl uppercase italic mb-6 sm:mb-8 bg-red-100 py-2 px-2 rounded-xl border-2 border-black border-dashed break-words">
              "{itemNombre}"
            </p>
          )}

          <div className="flex flex-col gap-3 sm:gap-4 mt-5 sm:mt-6">
            <button
              onClick={onConfirm}
              className="w-full bg-[#D32F2F] text-white border-4 border-black py-4 sm:py-5 rounded-2xl font-black text-lg sm:text-2xl italic uppercase shadow-[6px_6px_0px_0px_black] active:translate-y-1 active:shadow-none transition-all"
            >
              ¡SÍ, BORRAR! 🔥
            </button>

            <button
              onClick={onCancel}
              className="w-full bg-stone-100 text-black border-4 border-black py-3 sm:py-4 rounded-2xl font-black text-base sm:text-lg uppercase italic hover:bg-white transition-colors"
            >
              NO, ME ARREPENTÍ ✋
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}