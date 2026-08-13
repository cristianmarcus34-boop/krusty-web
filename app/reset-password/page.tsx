// app/reset-password/page.tsx
'use client';

import { useEffect, useState } from 'react';

export default function ResetPasswordPage() {
    const [token, setToken] = useState<string | null>(null);
    const [detected, setDetected] = useState<string>('🔄 Detectando dispositivo...');

    useEffect(() => {
        // ⚠️ Solo se ejecuta en el cliente (navegador)
        if (typeof window === 'undefined') return;

        // Extraer token de la URL
        const url = window.location.href;
        console.log('📍 URL completa:', url);

        // Buscar token en el hash (#access_token=xxx)
        const hashMatch = url.match(/#access_token=([^&]+)/);
        if (hashMatch) {
            const token = decodeURIComponent(hashMatch[1]);
            console.log('🔑 Token del hash:', token.substring(0, 20) + '...');
            setToken(token);
        }

        // Detectar dispositivo
        const esAndroid = /android/i.test(navigator.userAgent);
        const esIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
        const esTelefono = esAndroid || esIOS;

        if (esTelefono) {
            setDetected(`📱 Detectado: ${esAndroid ? 'Android' : 'iOS'}`);

            // Redirigir a la app después de 1 segundo
            const appUrl = token
                ? `krustyburger://reset-password?token=${encodeURIComponent(token)}`
                : 'krustyburger://reset-password';

            console.log('🔗 Redirigiendo a:', appUrl);

            setTimeout(() => {
                window.location.href = appUrl;
            }, 1000);

            // Si la app no está instalada, redirigir a Play Store después de 4 segundos
            setTimeout(() => {
                if (esAndroid) {
                    window.location.href = 'https://play.google.com/store/apps/details?id=com.agenciapowa.KrustyBurger';
                }
            }, 4000);
        } else {
            setDetected('🖥️ Detectado: Computadora');
        }
    }, []);

    return (
        <div style={styles.container}>
            <div style={styles.content}>
                <div style={styles.logo}>🍔</div>
                <h1 style={styles.title}>Krusty Burger</h1>
                <p style={styles.subtitle}>Restablecer contraseña</p>

                <a
                    href={`krustyburger://reset-password${token ? `?token=${encodeURIComponent(token)}` : ''}`}
                    style={styles.button}
                >
                    📱 Abrir en la App
                </a>

                <p style={styles.mensaje}>Si no tienes la app instalada, descárgala desde:</p>

                <div style={styles.links}>
                    <a
                        href="https://play.google.com/store/apps/details?id=com.agenciapowa.KrustyBurger"
                        style={{ ...styles.button, ...styles.buttonSecondary }}
                    >
                        Google Play
                    </a>
                    <a href="#" style={{ ...styles.button, ...styles.buttonSecondary, opacity: 0.5 }}>
                        App Store
                    </a>
                </div>

                <div style={styles.detected}>
                    <p>{detected}</p>
                    {token && <p style={styles.tokenInfo}>🔑 Token encontrado ✅</p>}
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#1A1A1A',
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
    },
    content: {
        textAlign: 'center' as const,
        maxWidth: '500px',
    },
    logo: {
        fontSize: '80px',
        marginBottom: '20px',
    },
    title: {
        color: '#F5C518',
        fontSize: '28px',
        marginBottom: '10px',
    },
    subtitle: {
        color: '#B0B0B0',
        marginBottom: '30px',
        fontSize: '16px',
    },
    button: {
        display: 'inline-block',
        background: '#F5C518',
        color: '#0A0A0A',
        padding: '14px 40px',
        borderRadius: '12px',
        textDecoration: 'none',
        fontWeight: 'bold',
        fontSize: '18px',
        margin: '10px 0',
        transition: 'background 0.3s',
        cursor: 'pointer',
        border: 'none',
    },
    buttonSecondary: {
        background: 'transparent',
        border: '2px solid #F5C518',
        color: '#F5C518',
    },
    mensaje: {
        color: '#B0B0B0',
        marginTop: '20px',
        fontSize: '14px',
    },
    links: {
        display: 'flex',
        gap: '10px',
        justifyContent: 'center',
        marginTop: '10px',
    },
    detected: {
        marginTop: '30px',
        padding: '20px',
        background: '#2A2A2A',
        borderRadius: '12px',
        color: '#B0B0B0',
        fontSize: '14px',
    },
    tokenInfo: {
        color: '#F5C518',
        marginTop: '10px',
    },
} as const;