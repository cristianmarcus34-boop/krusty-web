// components/LocationPicker.tsx
'use client';

import { useState, useRef, useCallback } from 'react';
import { GoogleMap, Marker, Autocomplete } from '@react-google-maps/api';
import usePlacesAutocomplete from 'use-places-autocomplete';
import { useGoogleMaps } from '@/lib/googleMapsLoader';

// Configuración del mapa
const mapContainerStyle = {
    width: '100%',
    height: '300px',
    borderRadius: '1rem',
    border: '4px solid black',
};

const defaultCenter = {
    lat: -34.776528,
    lng: -58.292194,
};

const options = {
    disableDefaultUI: true,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
};

interface LocationPickerProps {
    onLocationSelect: (direccion: string, lat: number, lng: number) => void;
    initialDireccion?: string;
}

export default function LocationPicker({ onLocationSelect, initialDireccion = '' }: LocationPickerProps) {
    const { isLoaded, loadError } = useGoogleMaps();
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [marker, setMarker] = useState<google.maps.LatLngLiteral | null>(null);
    const [direccion, setDireccion] = useState(initialDireccion);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

    const {
        suggestions: { status, data },
        setValue,
    } = usePlacesAutocomplete({
        requestOptions: {
            componentRestrictions: { country: 'ar' },
            types: ['address'],
        },
        debounce: 300,
    });

    const onLoad = useCallback((mapInstance: google.maps.Map) => {
        setMap(mapInstance);
    }, []);

    const onMarkerDragEnd = useCallback((event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
            const lat = event.latLng.lat();
            const lng = event.latLng.lng();
            setMarker({ lat, lng });

            // Geocodificar para obtener la dirección
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                if (status === 'OK' && results && results[0]) {
                    const direccion = results[0].formatted_address;
                    setDireccion(direccion);
                    onLocationSelect(direccion, lat, lng);
                }
            });
        }
    }, [onLocationSelect]);

    const onPlaceSelected = useCallback((place: google.maps.places.PlaceResult) => {
        if (place.geometry?.location) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            const direccion = place.formatted_address || place.name || '';

            setMarker({ lat, lng });
            setDireccion(direccion);
            onLocationSelect(direccion, lat, lng);

            if (map) {
                map.panTo({ lat, lng });
                map.setZoom(15);
            }
        }
    }, [map, onLocationSelect]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.value);
        setDireccion(e.target.value);
    };

    const handleSelectSuggestion = (suggestion: { description: string }) => {
        setValue(suggestion.description, false);
        setDireccion(suggestion.description);

        // Buscar el lugar seleccionado
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: suggestion.description }, (results, status) => {
            if (status === 'OK' && results && results[0] && results[0].geometry.location) {
                const lat = results[0].geometry.location.lat();
                const lng = results[0].geometry.location.lng();
                setMarker({ lat, lng });
                onLocationSelect(suggestion.description, lat, lng);
                if (map) {
                    map.panTo({ lat, lng });
                    map.setZoom(15);
                }
            }
        });
    };

    const handleMapClick = useCallback((event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
            const lat = event.latLng.lat();
            const lng = event.latLng.lng();
            setMarker({ lat, lng });

            // Geocodificar para obtener la dirección
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                if (status === 'OK' && results && results[0]) {
                    const direccion = results[0].formatted_address;
                    setDireccion(direccion);
                    onLocationSelect(direccion, lat, lng);
                }
            });
        }
    }, [onLocationSelect]);

    // Muestra el loader mientras carga
    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center h-32 bg-stone-100 rounded-2xl border-4 border-black">
                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 border-4 border-[#D32F2F] border-t-transparent rounded-full animate-spin" />
                    <span className="font-bold text-sm">Cargando mapa...</span>
                </div>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="bg-red-50 p-4 rounded-2xl border border-red-200">
                <p className="text-red-600 font-bold text-sm">
                    ❌ Error al cargar el mapa. Verificá tu conexión y la API Key.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Input de búsqueda */}
            <div className="relative">
                <input
                    type="text"
                    placeholder="Escribí tu dirección o mové el pin en el mapa..."
                    value={direccion}
                    onChange={handleInputChange}
                    className="w-full bg-stone-50 dark:bg-stone-800 border-4 border-black p-4 rounded-2xl font-bold text-xs uppercase outline-none focus:ring-2 focus:ring-[#FFCA28]/30 dark:text-white"
                />

                {/* Sugerencias de autocompletado */}
                {status === 'OK' && data.length > 0 && (
                    <ul className="absolute z-50 w-full bg-white dark:bg-stone-800 border-4 border-black mt-1 rounded-xl max-h-60 overflow-y-auto">
                        {data.map((suggestion) => (
                            <li
                                key={suggestion.place_id}
                                onClick={() => handleSelectSuggestion(suggestion)}
                                className="p-3 hover:bg-[#FFCA28]/10 dark:hover:bg-[#FAD02C]/10 cursor-pointer font-bold text-xs border-b border-stone-100 dark:border-stone-700 last:border-0"
                            >
                                {suggestion.description}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Mapa */}
            <div className="relative w-full h-75 rounded-2xl overflow-hidden border-4 border-black">
                <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={marker || defaultCenter}
                    zoom={14}
                    onLoad={onLoad}
                    onClick={handleMapClick}
                    options={options}
                >
                    {marker && (
                        <Marker
                            position={marker}
                            draggable
                            onDragEnd={onMarkerDragEnd}
                            icon={{
                                url: '/images/krusty-marker.png',
                                scaledSize: new google.maps.Size(40, 40),
                                origin: new google.maps.Point(0, 0),
                                anchor: new google.maps.Point(20, 40),
                            }}
                        />
                    )}
                </GoogleMap>

                {/* Instrucción */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] font-black px-4 py-2 rounded-full border-2 border-white/20 backdrop-blur-sm">
                    📍 Arrastrá el pin o tocá el mapa para ubicarte
                </div>
            </div>

            {/* Mostrar dirección seleccionada */}
            {direccion && (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                        📍 Dirección seleccionada
                    </p>
                    <p className="font-bold text-sm text-emerald-900 dark:text-emerald-300 mt-1">
                        {direccion}
                    </p>
                </div>
            )}
        </div>
    );
}