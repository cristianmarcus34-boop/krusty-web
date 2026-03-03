export interface Burger {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen: string;
  categoria: 'clasicas' | 'especiales' | 'combos';
}