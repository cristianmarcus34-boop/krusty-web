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

function LocationPicker({ onLocationSelect, initialDireccion = '' }: LocationPickerProps) {
    const { isLoaded, loadError } = useGoogleMaps();
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [marker, setMarker] = useState<google.maps.LatLngLiteral | null>(null);
    const [direccion, setDireccion] = useState(initialDireccion);
    const [suggestions, setSuggestions] = useState<google.maps.places.PlacePrediction[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState(false);
    const [isMounted, setIsMounted] = useState(true);
    const searchRequestRef = useRef(0);
    const geocoderRef = useRef<google.maps.Geocoder | null>(null);

    useEffect(() => {
        setIsMounted(true);

        if (isLoaded) {
            try {
                geocoderRef.current = new google.maps.Geocoder();
            } catch (error) {
                console.error('No se pudo inicializar el geocodificador de Google Maps:', error);
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

    const buscarSugerencias = useCallback(async (input: string) => {
        const requestId = ++searchRequestRef.current;
        if (input.trim().length < 3 || !isMounted) {
            setSuggestions([]);
            setSearchError(false);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        setSearchError(false);

        try {
            const { suggestions: results } =
                await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
                    input: input.trim(),
                    includedRegionCodes: ['ar'],
                    includedPrimaryTypes: ['street_address', 'route', 'premise'],
                });

            if (isMounted && requestId === searchRequestRef.current) {
                setSuggestions(
                    results.flatMap(({ placePrediction }) =>
                        placePrediction ? [placePrediction] : []
                    )
                );
            }
        } catch (error) {
            console.error('Error buscando direcciones en Google Maps:', error);
            if (isMounted && requestId === searchRequestRef.current) {
                setSuggestions([]);
                setSearchError(true);
            }
        } finally {
            if (isMounted && requestId === searchRequestRef.current) {
                setIsSearching(false);
            }
        }
    }, [isMounted]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setDireccion(value);
        buscarSugerencias(value);
    }, [buscarSugerencias]);

    const handleSelectSuggestion = useCallback(async (prediction: google.maps.places.PlacePrediction) => {
        try {
            const place = prediction.toPlace();
            const { place: placeDetails } = await place.fetchFields({
                fields: ['location', 'formattedAddress'],
            });
            const location = placeDetails.location;
            if (!location || !isMounted) {
                setSearchError(true);
                return;
            }

            const lat = location.lat();
            const lng = location.lng();
            const selectedAddress = placeDetails.formattedAddress || prediction.text.toString();

            setMarker({ lat, lng });
            setDireccion(selectedAddress);
            setSuggestions([]);
            setSearchError(false);
            onLocationSelect(selectedAddress, lat, lng);

            if (map) {
                map.panTo({ lat, lng });
                map.setZoom(15);
            }
        } catch (error) {
            console.error('Error obteniendo la dirección seleccionada:', error);
            if (isMounted) setSearchError(true);
        }
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
                    type="text"
                    placeholder="Escribí tu dirección o mové el pin en el mapa..."
                    value={direccion}
                    onChange={handleInputChange}
                    className="w-full bg-stone-50 dark:bg-stone-800 border-4 border-black p-4 rounded-2xl font-bold text-xs uppercase outline-none focus:ring-2 focus:ring-[#FFCA28]/30 dark:text-white"
                />

                {(suggestions.length > 0 || isSearching || searchError) && (
                    <ul className="absolute z-50 w-full bg-white dark:bg-stone-800 border-4 border-black mt-1 rounded-xl max-h-60 overflow-y-auto shadow-[6px_6px_0px_0px_black]">
                        {suggestions.map((prediction) => (
                            <li
                                key={prediction.placeId}
                                onClick={() => handleSelectSuggestion(prediction)}
                                className="p-3 hover:bg-[#FFCA28]/20 dark:hover:bg-[#FAD02C]/20 cursor-pointer font-bold text-xs border-b border-stone-100 dark:border-stone-700 last:border-0 transition-colors"
                            >
                                {prediction.text.toString()}
                            </li>
                        ))}
                        {isSearching && (
                            <li className="p-3 text-center text-stone-400 font-bold text-xs">
                                🔍 Buscando...
                            </li>
                        )}
                        {searchError && (
                            <li className="p-3 text-center text-red-500 font-bold text-xs">
                                No se pudo buscar esa dirección. Probá de nuevo o mové el pin en el mapa.
                            </li>
                        )}
                        {!isSearching && !searchError && suggestions.length === 0 && direccion.trim().length >= 3 && (
                            <li className="p-3 text-center text-stone-400 font-bold text-xs">
                                No encontramos direcciones. Probá agregar calle y altura.
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