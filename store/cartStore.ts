"use client";
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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

      // Lógica Pro: Si es 1 y resta, se elimina. Si es > 1, resta.
      decreaseQuantity: (id) => set((state) => {
        const item = state.items.find(i => i.id === id);
        if (item && item.quantity > 1) {
          return {
            items: state.items.map(i => i.id === id ? { ...i, quantity: i.quantity - 1 } : i)
          };
        }
        // Si la cantidad era 1, filtramos (eliminamos) el producto
        return { items: state.items.filter(i => i.id !== id) };
      }),

      removeItem: (id) => set((state) => ({
        items: state.items.filter(i => i.id !== id)
      })),

      clearCart: () => set({ items: [] }),

      total: () => {
        const currentItems = get().items;
        return currentItems.reduce((acc, item) => acc + (Number(item.precio) * item.quantity), 0);
      },
    }),
    { name: 'krusty-cart-storage' }
  )
);