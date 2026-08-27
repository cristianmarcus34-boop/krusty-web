'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { useGoogleMaps } from '@/lib/googleMapsLoader';

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

// Tipos para las sugerencias de Places
interface PlacePrediction {
    placeId: string;
    text: {
        text: string;
    };
}

interface Suggestion {
    placePrediction: PlacePrediction | null;
}

export default function LocationPicker({ onLocationSelect, initialDireccion = '' }: LocationPickerProps) {
    const { isLoaded, loadError } = useGoogleMaps();
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [marker, setMarker] = useState<google.maps.LatLngLiteral | null>(null);
    const [direccion, setDireccion] = useState(initialDireccion);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const autocompleteServiceRef = useRef<any>(null);

    // Inicializar el servicio de autocompletado
    useEffect(() => {
        if (isLoaded && !autocompleteServiceRef.current) {
            // Usar el servicio de autocompletado de Places
            autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
        }
    }, [isLoaded]);

    const onLoad = useCallback((mapInstance: google.maps.Map) => {
        setMap(mapInstance);
    }, []);

    const onMarkerDragEnd = useCallback((event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
            const lat = event.latLng.lat();
            const lng = event.latLng.lng();
            setMarker({ lat, lng });

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

    const handleMapClick = useCallback((event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
            const lat = event.latLng.lat();
            const lng = event.latLng.lng();
            setMarker({ lat, lng });

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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setDireccion(value);

        if (value.length < 3) {
            setSuggestions([]);
            return;
        }

        setIsSearching(true);

        // Usar el servicio de autocompletado
        const service = new google.maps.places.AutocompleteService();
        const request = {
            input: value,
            types: ['address'] as google.maps.places.AutocompletePrediction['types'],
            componentRestrictions: { country: 'ar' } as google.maps.places.ComponentRestrictions,
        };

        service.getPlacePredictions(request, (predictions, status) => {
            setIsSearching(false);

            if (status === 'OK' && predictions) {
                const formattedSuggestions: Suggestion[] = predictions.map((prediction: google.maps.places.AutocompletePrediction) => ({
                    placePrediction: {
                        placeId: prediction.place_id,
                        text: {
                            text: prediction.description,
                        },
                    },
                }));
                setSuggestions(formattedSuggestions);
            } else {
                setSuggestions([]);
            }
        });
    };

    const handleSelectSuggestion = (suggestion: Suggestion) => {
        const placeId = suggestion.placePrediction?.placeId;

        if (!placeId) {
            return;
        }

        const service = new google.maps.places.PlacesService(document.createElement('div'));

        service.getDetails(
            { placeId: placeId, fields: ['geometry', 'formatted_address'] },
            (place: google.maps.places.PlaceResult | null, status: google.maps.places.PlacesServiceStatus) => {
                if (status === 'OK' && place?.geometry?.location) {
                    const lat = place.geometry.location.lat();
                    const lng = place.geometry.location.lng();
                    const direccion = place.formatted_address || suggestion.placePrediction?.text?.text || '';

                    setMarker({ lat, lng });
                    setDireccion(direccion);
                    setSuggestions([]);
                    onLocationSelect(direccion, lat, lng);

                    if (map) {
                        map.panTo({ lat, lng });
                        map.setZoom(15);
                    }
                }
            }
        );
    };

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
            {/* Input de búsqueda con sugerencias */}
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Escribí tu dirección o mové el pin en el mapa..."
                    value={direccion}
                    onChange={handleInputChange}
                    className="w-full bg-stone-50 dark:bg-stone-800 border-4 border-black p-4 rounded-2xl font-bold text-xs uppercase outline-none focus:ring-2 focus:ring-[#FFCA28]/30 dark:text-white"
                />

                {/* Sugerencias de autocompletado */}
                {suggestions.length > 0 && (
                    <ul className="absolute z-50 w-full bg-white dark:bg-stone-800 border-4 border-black mt-1 rounded-xl max-h-60 overflow-y-auto">
                        {suggestions.map((suggestion, index) => (
                            <li
                                key={index}
                                onClick={() => handleSelectSuggestion(suggestion)}
                                className="p-3 hover:bg-[#FFCA28]/10 dark:hover:bg-[#FAD02C]/10 cursor-pointer font-bold text-xs border-b border-stone-100 dark:border-stone-700 last:border-0"
                            >
                                {suggestion.placePrediction?.text?.text || 'Dirección'}
                            </li>
                        ))}
                        {isSearching && (
                            <li className="p-3 text-center text-stone-400 font-bold text-xs">
                                Buscando...
                            </li>
                        )}
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