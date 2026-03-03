import { NextResponse } from 'next/server';
import { Burger } from '@/types';

export async function GET() {
  const burgers: Burger[] = [
    {
      id: '1',
      nombre: 'Krusty Burger',
      descripcion: 'La clásica con salsa secreta y queso derretido.',
      precio: 8500,
      imagen: '/images/krusty-classic.png',
      categoria: 'clasicas'
    },
    {
      id: '2',
      nombre: 'Clogger Burger',
      descripcion: 'Para los valientes: triple carne, triple panceta.',
      precio: 12000,
      imagen: '/images/clogger.png',
      categoria: 'especiales'
    }
  ];

  return NextResponse.json(burgers);
}