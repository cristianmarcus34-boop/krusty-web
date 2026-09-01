// components/LocationPicker.tsx - VERSIÓN COMPLETA TIPADA
'use client';

import { useState, useRef, useCallback, useEffect, memo } from 'react';
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
    fullscreenControl: false,
};

interface LocationPickerProps {
    onLocationSelect: (direccion: string, lat: number, lng: number) => void;
    initialDireccion?: string;
}

interface AutocompleteSuggestionResult {
    placePrediction?: {
        placeId: string;
        text: {
            text: string;
        };
    };
}

// ✅ Tipos para las sugerencias de Google Maps
interface GooglePlacePrediction {
    place_id: string;
    description: string;
}

interface GoogleSuggestion {
    placePrediction?: {
        placeId: string;
        text?: {
            text: string;
        };
    };
    description?: string;
}

function LocationPicker({ onLocationSelect, initialDireccion = '' }: LocationPickerProps) {
    const { isLoaded, loadError } = useGoogleMaps();
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [marker, setMarker] = useState<google.maps.LatLngLiteral | null>(null);
    const [direccion, setDireccion] = useState(initialDireccion);
    const [suggestions, setSuggestions] = useState<AutocompleteSuggestionResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isMounted, setIsMounted] = useState(true);
    const inputRef = useRef<HTMLInputElement>(null);
    const autocompleteServiceRef = useRef<any>(null);
    const geocoderRef = useRef<google.maps.Geocoder | null>(null);

    // ✅ Inicializar servicios
    useEffect(() => {
        setIsMounted(true);

        if (isLoaded) {
            try {
                autocompleteServiceRef.current = new google.maps.places.AutocompleteSuggestion();
            } catch {
                try {
                    autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
                } catch {
                    // Silencioso
                }
            }

            try {
                geocoderRef.current = new google.maps.Geocoder();
            } catch {
                // Silencioso
            }
        }

        return () => {
            setIsMounted(false);
            if (map) {
                try {
                    google.maps.event.clearInstanceListeners(map);
                } catch {
                    // Silencioso
                }
            }
        };
    }, [isLoaded, map]);

    const onLoad = useCallback((mapInstance: google.maps.Map) => {
        if (isMounted) {
            setMap(mapInstance);
        }
    }, [isMounted]);

    const geocodeLocation = useCallback((lat: number, lng: number) => {
        if (!geocoderRef.current) return;

        geocoderRef.current.geocode(
            { location: { lat, lng } },
            (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
                if (status === 'OK' && results && results[0] && isMounted) {
                    const direccion = results[0].formatted_address;
                    setDireccion(direccion);
                    onLocationSelect(direccion, lat, lng);
                }
            }
        );
    }, [onLocationSelect, isMounted]);

    const onMarkerDragEnd = useCallback((event: google.maps.MapMouseEvent) => {
        if (event.latLng && isMounted) {
            const lat = event.latLng.lat();
            const lng = event.latLng.lng();
            setMarker({ lat, lng });
            geocodeLocation(lat, lng);
        }
    }, [geocodeLocation, isMounted]);

    const handleMapClick = useCallback((event: google.maps.MapMouseEvent) => {
        if (event.latLng && isMounted) {
            const lat = event.latLng.lat();
            const lng = event.latLng.lng();
            setMarker({ lat, lng });
            geocodeLocation(lat, lng);
        }
    }, [geocodeLocation, isMounted]);

    // ✅ Handler para AutocompleteService (fallback) - CON TIPADO
    const handlePredictions = useCallback((
        predictions: GooglePlacePrediction[] | null,
        status: google.maps.places.PlacesServiceStatus
    ) => {
        if (!isMounted) return;
        setIsSearching(false);

        if (status === 'OK' && predictions) {
            const formatted: AutocompleteSuggestionResult[] = predictions.map((prediction) => ({
                placePrediction: {
                    placeId: prediction.place_id,
                    text: {
                        text: prediction.description,
                    },
                },
            }));
            setSuggestions(formatted);
        } else {
            setSuggestions([]);
        }
    }, [isMounted]);

    // ✅ Handler para AutocompleteSuggestion (nuevo) - CON TIPADO
    const handleSuggestions = useCallback((
        suggestionsData: GoogleSuggestion[] | null,
        status: google.maps.places.PlacesServiceStatus
    ) => {
        if (!isMounted) return;
        setIsSearching(false);

        if (status === 'OK' && suggestionsData) {
            const formatted: AutocompleteSuggestionResult[] = suggestionsData.map((suggestion) => ({
                placePrediction: {
                    placeId: suggestion.placePrediction?.placeId || '',
                    text: {
                        text: suggestion.placePrediction?.text?.text || suggestion.description || '',
                    },
                },
            }));
            setSuggestions(formatted);
        } else {
            setSuggestions([]);
        }
    }, [isMounted]);

    // ✅ Buscar sugerencias
    const buscarSugerencias = useCallback((input: string) => {
        if (!autocompleteServiceRef.current || input.length < 3 || !isMounted) {
            setSuggestions([]);
            return;
        }

        setIsSearching(true);

        try {
            const service = autocompleteServiceRef.current;
            const request = {
                input: input,
                types: ['address'] as google.maps.places.AutocompletePrediction['types'],
                componentRestrictions: { country: 'ar' } as google.maps.places.ComponentRestrictions,
            };

            if (typeof service.getPlacePredictions === 'function') {
                // ✅ AutocompleteService (fallback)
                service.getPlacePredictions(
                    request,
                    (predictions: google.maps.places.AutocompletePrediction[] | null, status: google.maps.places.PlacesServiceStatus) => {
                        if (!isMounted) return;
                        setIsSearching(false);

                        if (status === 'OK' && predictions) {
                            const formatted: AutocompleteSuggestionResult[] = predictions.map((prediction) => ({
                                placePrediction: {
                                    placeId: prediction.place_id,
                                    text: {
                                        text: prediction.description,
                                    },
                                },
                            }));
                            setSuggestions(formatted);
                        } else {
                            setSuggestions([]);
                        }
                    }
                );
            } else if (typeof service.getSuggestions === 'function') {
                // ✅ AutocompleteSuggestion (nuevo)
                service.getSuggestions(
                    request,
                    (suggestionsData: GoogleSuggestion[] | null, status: google.maps.places.PlacesServiceStatus) => {
                        if (!isMounted) return;
                        setIsSearching(false);

                        if (status === 'OK' && suggestionsData) {
                            const formatted: AutocompleteSuggestionResult[] = suggestionsData.map((suggestion) => ({
                                placePrediction: {
                                    placeId: suggestion.placePrediction?.placeId || '',
                                    text: {
                                        text: suggestion.placePrediction?.text?.text || suggestion.description || '',
                                    },
                                },
                            }));
                            setSuggestions(formatted);
                        } else {
                            setSuggestions([]);
                        }
                    }
                );
            } else {
                setSuggestions([]);
                setIsSearching(false);
            }
        } catch {
            if (isMounted) {
                setSuggestions([]);
                setIsSearching(false);
            }
        }
    }, [isMounted]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setDireccion(value);
        buscarSugerencias(value);
    }, [buscarSugerencias]);

    const handleSelectSuggestion = useCallback((suggestion: AutocompleteSuggestionResult) => {
        const placeId = suggestion.placePrediction?.placeId;

        if (!placeId) return;

        const container = document.createElement('div');
        const service = new google.maps.places.PlacesService(container);

        service.getDetails(
            { placeId: placeId, fields: ['geometry', 'formatted_address'] },
            (place: google.maps.places.PlaceResult | null, status: google.maps.places.PlacesServiceStatus) => {
                if (status === 'OK' && place?.geometry?.location && isMounted) {
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
    }, [map, onLocationSelect, isMounted]);

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
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Escribí tu dirección o mové el pin en el mapa..."
                    value={direccion}
                    onChange={handleInputChange}
                    className="w-full bg-stone-50 dark:bg-stone-800 border-4 border-black p-4 rounded-2xl font-bold text-xs uppercase outline-none focus:ring-2 focus:ring-[#FFCA28]/30 dark:text-white"
                />

                {suggestions.length > 0 && (
                    <ul className="absolute z-50 w-full bg-white dark:bg-stone-800 border-4 border-black mt-1 rounded-xl max-h-60 overflow-y-auto shadow-[6px_6px_0px_0px_black]">
                        {suggestions.map((suggestion, index) => (
                            <li
                                key={index}
                                onClick={() => handleSelectSuggestion(suggestion)}
                                className="p-3 hover:bg-[#FFCA28]/20 dark:hover:bg-[#FAD02C]/20 cursor-pointer font-bold text-xs border-b border-stone-100 dark:border-stone-700 last:border-0 transition-colors"
                            >
                                {suggestion.placePrediction?.text?.text || 'Dirección'}
                            </li>
                        ))}
                        {isSearching && (
                            <li className="p-3 text-center text-stone-400 font-bold text-xs">
                                🔍 Buscando...
                            </li>
                        )}
                    </ul>
                )}
            </div>

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

                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] font-black px-4 py-2 rounded-full border-2 border-white/20 backdrop-blur-sm">
                    📍 Arrastrá el pin o tocá el mapa para ubicarte
                </div>
            </div>

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

export default memo(LocationPicker);