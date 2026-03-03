import { create } from 'zustand';
import { Burger } from '@/types';

interface CartItem extends Burger {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (burger: Burger) => void;
  removeItem: (id: string) => void;
  total: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addItem: (burger) => set((state) => {
    const existing = state.items.find(i => i.id === burger.id);
    if (existing) {
      return { items: state.items.map(i => i.id === burger.id ? { ...i, quantity: i.quantity + 1 } : i) };
    }
    return { items: [...state.items, { ...burger, quantity: 1 }] };
  }),
  removeItem: (id) => set((state) => ({
    items: state.items.filter(i => i.id !== id)
  })),
  total: () => get().items.reduce((acc, item) => acc + (item.precio * item.quantity), 0),
}));