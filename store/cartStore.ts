import { create } from 'zustand';
import { persist } from 'zustand/middleware'; // Para que no se borre al refrescar
import { Burger } from '@/types';

interface CartItem extends Burger {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (burger: Burger) => void;
  decreaseQuantity: (id: string) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  total: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (burger) => set((state) => {
        const existing = state.items.find(i => i.id === burger.id);
        if (existing) {
          return { 
            items: state.items.map(i => i.id === burger.id ? { ...i, quantity: i.quantity + 1 } : i) 
          };
        }
        return { items: [...state.items, { ...burger, quantity: 1 }] };
      }),

      decreaseQuantity: (id) => set((state) => ({
        items: state.items.map(i => 
          i.id === id && i.quantity > 1 
            ? { ...i, quantity: i.quantity - 1 } 
            : i
        )
      })),

      removeItem: (id) => set((state) => ({
        items: state.items.filter(i => i.id !== id)
      })),

      clearCart: () => set({ items: [] }),

      total: () => get().items.reduce((acc, item) => acc + (item.precio * item.quantity), 0),
    }),
    { name: 'krusty-cart-storage' } // Nombre de la cookie/localstorage
  )
);