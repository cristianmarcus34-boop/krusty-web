// store/cartStore.ts - VERSIÓN CORREGIDA Y ROBUSTA (SIN LOGS)
"use client";
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Burger } from '@/types';

export interface Adicional {
  id: string | number;
  nombre: string;
  precio: number;
}

export interface CartItem extends Burger {
  quantity: number;
  extrasElegidos: Adicional[];
  precioUnitarioTotal: number;
  cartId: string;
}

interface CartState {
  items: CartItem[];
  addItem: (burger: Burger, extras?: Adicional[]) => void;
  decreaseQuantity: (cartId: string) => void;
  removeItem: (cartId: string) => void;
  clearCart: () => void;
  total: () => number;
  setItems: (items: CartItem[]) => void;
  mergeItems: (items: CartItem[]) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      setItems: (items: CartItem[]) => set({ items }),

      mergeItems: (newItems: CartItem[]) => {
        const currentItems = get().items;
        const mergedItems = [...currentItems];

        newItems.forEach((newItem) => {
          const existingIndex = mergedItems.findIndex(
            (item) => item.cartId === newItem.cartId
          );
          if (existingIndex >= 0) {
            mergedItems[existingIndex] = {
              ...mergedItems[existingIndex],
              quantity: mergedItems[existingIndex].quantity + newItem.quantity,
            };
          } else {
            mergedItems.push(newItem);
          }
        });

        set({ items: mergedItems });
      },

      addItem: (burger, extras = []) => set((state) => {
        const precioExtras = extras.reduce((acc, curr) => acc + Number(curr.precio || 0), 0);
        const precioBase = Number(burger.precio || 0);
        const precioUnitarioTotal = precioBase + precioExtras;

        const extrasKey = extras.length > 0
          ? extras.map(e => e.id).sort().join('-')
          : 'base';

        const cartId = `${burger.id}-${extrasKey}`;

        const existing = state.items.find(i => i.cartId === cartId);

        if (existing) {
          const updatedItems = state.items.map(i =>
            i.cartId === cartId
              ? { ...i, quantity: i.quantity + 1 }
              : i
          );
          return { items: updatedItems };
        }

        const newItem: CartItem = {
          ...burger,
          cartId,
          quantity: 1,
          extrasElegidos: extras,
          precioUnitarioTotal: precioUnitarioTotal
        };

        return { items: [...state.items, newItem] };
      }),

      decreaseQuantity: (cartId) => set((state) => {
        const item = state.items.find(i => i.cartId === cartId);
        if (item && item.quantity > 1) {
          const updatedItems = state.items.map(i =>
            i.cartId === cartId ? { ...i, quantity: i.quantity - 1 } : i
          );
          return { items: updatedItems };
        }
        return { items: state.items.filter(i => i.cartId !== cartId) };
      }),

      removeItem: (cartId) => set((state) => ({
        items: state.items.filter(i => i.cartId !== cartId)
      })),

      clearCart: () => set({ items: [] }),

      total: () => {
        const currentItems = get().items;
        return currentItems.reduce((acc, item) =>
          acc + (Number(item.precioUnitarioTotal || 0) * item.quantity), 0
        );
      },
    }),
    {
      name: 'krusty-cart-storage-v5',
      storage: createJSONStorage(() => localStorage),
      skipHydration: false,
      onRehydrateStorage: () => (state) => {
        // Silencioso
      },
    }
  )
);