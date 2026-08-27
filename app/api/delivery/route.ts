// app/api/delivery/route.ts
import { NextResponse } from 'next/server';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
const LOCAL_LAT = -34.776528;
const LOCAL_LNG = -58.292194;

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, destinationLat, destinationLng, direccion } = body;

        if (!GOOGLE_MAPS_API_KEY) {
            return NextResponse.json(
                { success: false, error: 'Falta configurar la API Key de Google Maps' },
                { status: 500 }
            );
        }

        // Acción 1: Geocodificar dirección
        if (action === 'geocode') {
            const direccionCompleta = `${direccion}, San Francisco Solano, Quilmes, Buenos Aires, Argentina`;
            const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
                direccionCompleta
            )}&components=country:AR&key=${GOOGLE_MAPS_API_KEY}`;

            const res = await fetch(url);
            const data = await res.json();

            if (data.status === 'OK' && data.results?.length > 0) {
                const result = data.results[0];
                return NextResponse.json({
                    success: true,
                    ubicacion: {
                        lat: result.geometry.location.lat,
                        lng: result.geometry.location.lng,
                        direccion: result.formatted_address,
                    },
                });
            }

            return NextResponse.json({ success: false, error: 'No se encontró la dirección' }, { status: 400 });
        }

        // Acción 2: Calcular distancia y duración (Distance Matrix)
        if (action === 'calculate') {
            const urlMatrix = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${LOCAL_LAT},${LOCAL_LNG}&destinations=${destinationLat},${destinationLng}&units=metric&key=${GOOGLE_MAPS_API_KEY}`;

            const res = await fetch(urlMatrix);
            const data = await res.json();

            if (data.status === 'OK' && data.rows?.[0]?.elements?.[0]?.status === 'OK') {
                const element = data.rows[0].elements[0];
                return NextResponse.json({
                    success: true,
                    distanciaMetros: element.distance.value,
                    duracionSegundos: element.duration.value,
                });
            }

            return NextResponse.json({ success: false, error: 'Error obteniendo Distance Matrix' }, { status: 400 });
        }

        return NextResponse.json({ success: false, error: 'Acción no válida' }, { status: 400 });
    } catch (error) {
        console.error('Error interno API delivery:', error);
        return NextResponse.json({ success: false, error: 'Error del servidor' }, { status: 500 });
    }
}