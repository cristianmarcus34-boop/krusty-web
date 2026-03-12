"use client";
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Burger } from '@/types';

// Definimos qué es un Adicional dentro del Store
export interface Adicional {
  id: string | number;
  nombre: string;
  precio: number;
}

// El CartItem ahora incluye extras y un ID único para la combinación
export interface CartItem extends Burger {
  quantity: number;
  extrasElegidos: Adicional[];
  precioUnitarioTotal: number; // Precio base + suma de extras
  cartId: string; // ID único: productoId + extrasId
}

interface CartState {
  items: CartItem[];
  addItem: (burger: Burger, extras?: Adicional[]) => void;
  decreaseQuantity: (cartId: string) => void;
  removeItem: (cartId: string) => void;
  clearCart: () => void;
  total: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (burger, extras = []) => set((state) => {
        // 1. Calculamos el precio de esta combinación asegurando que sean números
        const precioExtras = extras.reduce((acc, curr) => acc + Number(curr.precio || 0), 0);
        const precioBase = Number(burger.precio || 0);
        const precioUnitarioTotal = precioBase + precioExtras;

        // 2. Creamos un cartId único basado en el producto y los extras elegidos
        // Usamos sort() para que el ID sea el mismo sin importar el orden en que se elijan
        const extrasKey = extras.length > 0 
          ? extras.map(e => e.id).sort().join('-') 
          : 'base'; // Si no hay extras, usamos 'base'
        
        const cartId = `${burger.id}-${extrasKey}`;

        // Buscamos si ya existe esta combinación EXACTA en el carrito
        const existing = state.items.find(i => i.cartId === cartId);

        if (existing) {
          return { 
            items: state.items.map(i => 
              i.cartId === cartId 
                ? { ...i, quantity: i.quantity + 1 } 
                : i
            ) 
          };
        }

        // 3. Si es nuevo, lo agregamos con sus extras y el cartId generado
        const newItem: CartItem = {
          ...burger,
          cartId, // IMPORTANTE: Aquí se asigna el ID que React usará como key
          quantity: 1,
          extrasElegidos: extras,
          precioUnitarioTotal: precioUnitarioTotal
        };

        return { items: [...state.items, newItem] };
      }),

      decreaseQuantity: (cartId) => set((state) => {
        const item = state.items.find(i => i.cartId === cartId);
        if (item && item.quantity > 1) {
          return {
            items: state.items.map(i => 
              i.cartId === cartId ? { ...i, quantity: i.quantity - 1 } : i
            )
          };
        }
        // Si la cantidad es 1 y bajamos, eliminamos el ítem
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
      // CAMBIÉ EL NOMBRE AQUÍ (v2) para forzar la limpieza de datos viejos de tu navegador
      // Esto soluciona el error de "cart-item-undefined" que viene de sesiones anteriores
      name: 'krusty-cart-storage-v2' 
    }
  )
);