"use client";

interface Props {
  isOpen: boolean;
  mensaje: string;
  itemNombre?: string; // Para mostrar qué estamos borrando (ej: "Hamburguesa Doble")
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ModalBorrarKrusty({ isOpen, mensaje, itemNombre, onConfirm, onCancel }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div className="bg-white border-[10px] border-black p-10 rounded-[4rem] w-full max-w-md shadow-[20px_20px_0px_0px_#D32F2F] animate-in zoom-in duration-200">
        <div className="text-center">
          <div className="text-6xl mb-6">🗑️</div>
          
          <h2 className="text-3xl font-black uppercase italic leading-none mb-2 text-black">
            {mensaje}
          </h2>
          
          {itemNombre && (
            <p className="text-[#D32F2F] font-black text-xl uppercase italic mb-8 bg-red-100 py-2 rounded-xl border-2 border-black border-dashed">
              "{itemNombre}"
            </p>
          )}
          
          <div className="flex flex-col gap-4 mt-6">
            <button 
              onClick={onConfirm}
              className="w-full bg-[#D32F2F] text-white border-4 border-black py-5 rounded-[2rem] font-black text-2xl italic uppercase shadow-[6px_6px_0px_0px_black] active:translate-y-1 active:shadow-none transition-all"
            >
              ¡SÍ, BORRAR! 🔥
            </button>
            
            <button 
              onClick={onCancel}
              className="w-full bg-stone-100 text-black border-4 border-black py-4 rounded-[2rem] font-black text-lg uppercase italic hover:bg-white transition-colors"
            >
              NO, ME ARREPENTÍ ✋
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}