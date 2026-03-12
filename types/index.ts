// @/types/index.ts

export interface Adicional {
  id: string | number;
  nombre: string;
  precio: number;
}

export interface Burger {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen: string;
  categoria: 'todos' | 'burgers' | 'bebidas' | 'postres' | 'combos';
  stock?: boolean;
  creado_en?: string;
  
  /** * Esta propiedad refleja la estructura que devuelve Supabase 
   * cuando hacemos el JOIN con la tabla intermedia producto_adicionales
   */
  producto_adicionales?: {
    adicionales: Adicional;
  }[];
}

/**
 * Interfaz para el carrito
 * Extiende Burger pero añade lo necesario para manejar combinaciones únicas
 */
export interface CartItem extends Burger {
  quantity: number;
  
  /** * extrasElegidos: Los adicionales que el usuario marcó para esta unidad 
   */
  extrasElegidos: Adicional[];
  
  /** * precioUnitarioTotal: (Precio base de burger + suma de precios de extras)
   * Guardarlo aquí facilita los cálculos en el checkout
   */
  precioUnitarioTotal: number;
  
  /** * cartId: Un string único generado (ej: "idBurger-idExtra1-idExtra2")
   * Evita errores de keys duplicadas en React y diferencia pedidos del mismo producto
   */
  cartId: string;
}