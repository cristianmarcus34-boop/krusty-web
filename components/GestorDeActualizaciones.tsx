'use client';

import { useEffect } from 'react';

export default function GestorDeActualizaciones() {
  useEffect(() => {
    // Si no estamos en el navegador o no es producción, no hacemos nada
    if (typeof window === 'undefined' || process.env.NODE_ENV !== 'production') return;

    const forzarActualizacion = async () => {
      try {
        // Buscamos el archivo de versión que generamos en cada despliegue
        const respuesta = await fetch('/version.txt', { 
          cache: 'no-store',
          headers: { 
            'pragma': 'no-cache', 
            'cache-control': 'no-cache' 
          }
        });
        
        const versionServidor = await respuesta.text();
        const versionLocal = localStorage.getItem('version-app');

        // Si la versión del servidor es distinta a la que tiene el cliente guardada...
        if (versionLocal && versionServidor !== versionLocal) {
          localStorage.setItem('version-app', versionServidor);
          
          // Delay de medio segundo para que el iPhone procese bien la salida
          setTimeout(() => {
            window.location.reload();
          }, 500);
        } else {
          // Si es la primera vez o son iguales, actualizamos el registro local
          localStorage.setItem('version-app', versionServidor);
        }
      } catch (error) {
        console.warn("Chequeo de versión omitido o fallido");
      }
    };

    // Este es el truco para iPhone: se activa cuando el usuario vuelve a abrir Safari
    // o cambia de pestaña de nuevo a la de Krusty
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        forzarActualizacion();
      }
    });

    return () => document.removeEventListener('visibilitychange', forzarActualizacion);
  }, []);

  return null; // El componente es invisible, es un "centinela"
}