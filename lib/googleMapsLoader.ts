// lib/googleMapsLoader.ts
import { useLoadScript } from '@react-google-maps/api';

// Definimos las librerías que vamos a usar
const libraries = ['places', 'geocoding'];

export function useGoogleMaps() {
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        libraries: libraries as any,
        // Evita que se cargue si no hay key
        id: 'google-maps-script',
    });

    return { isLoaded, loadError };
}