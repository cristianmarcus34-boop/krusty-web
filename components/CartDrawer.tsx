"use client";
import { useCartStore } from '@/store/cartStore';

export default function CartDrawer({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { items, removeItem, total, addItem } = useCartStore();

  const handleCheckout = () => {
    const numeroTelefono = "5491138305837"; // <-- ¡REEMPLAZÁ CON TU NÚMERO!
    
    const listaProductos = items
      .map((item) => `• *${item.quantity}x* ${item.nombre} (_$${item.precio * item.quantity}_)`)
      .join("\n");

    const mensaje = encodeURIComponent(
      `🤡 *NUEVO PEDIDO DE KRUSTY BURGER*\n` +
      `----------------------------------\n` +
      `${listaProductos}\n` +
      `----------------------------------\n` +
      `💰 *TOTAL: $${total()}*\n\n` +
      `📍 _Por favor, confirmanos si es para retiro o envío._`
    );

    window.open(`https://wa.me/${numeroTelefono}?text=${mensaje}`, "_blank");
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        onClick={onClose}
      />

      {/* Panel Deslizable */}
      <div className={`fixed right-0 top-0 h-full w-full max-w-md bg-white z-[70] shadow-2xl transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b-4 border-yellow-400 flex justify-between items-center bg-red-600 text-white">
            <div>
              <h2 className="text-2xl font-black italic">TU PEDIDO</h2>
              <p className="text-xs uppercase font-bold opacity-80">Springfield Central</p>
            </div>
            <button onClick={onClose} className="text-4xl font-light hover:rotate-90 transition-transform">&times;</button>
          </div>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto p-6 bg-stone-50">
            {items.length === 0 ? (
              <div className="text-center mt-20">
                <span className="text-6xl block mb-4 animate-bounce">🍔</span>
                <p className="font-black text-stone-400 uppercase">¿Tenés hambre? <br/>¡Agregá algo!</p>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 mb-4 bg-white p-3 rounded-xl border shadow-sm">
                  <img src={item.imagen} alt={item.nombre} className="w-16 h-16 object-contain" />
                  <div className="flex-1">
                    <h4 className="font-bold text-sm uppercase leading-tight">{item.nombre}</h4>
                    <p className="text-red-600 font-black">${item.precio}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center border rounded-lg bg-stone-100">
                        <button onClick={() => removeItem(item.id)} className="px-3 py-1 font-bold text-red-600">-</button>
                        <span className="px-2 font-bold text-sm">{item.quantity}</span>
                        <button onClick={() => addItem(item)} className="px-3 py-1 font-bold text-green-600">+</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t-4 border-yellow-400 bg-white">
            <div className="flex justify-between items-center mb-6">
              <span className="text-lg font-bold text-stone-500 uppercase">Total a pagar:</span>
              <span className="text-4xl font-black text-stone-900">${total()}</span>
            </div>
            <button 
              disabled={items.length === 0}
              onClick={handleCheckout}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-xl font-black py-5 rounded-2xl shadow-lg transition-all active:scale-95 uppercase tracking-tighter"
            >
              Pedir por WhatsApp ✅
            </button>
          </div>
        </div>
      </div>
    </>
  );
}