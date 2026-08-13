// app/reset-password/page.tsx
'use client';

import { useEffect, useState } from 'react';

export default function ResetPasswordPage() {
    const [token, setToken] = useState<string | null>(null);
    const [detected, setDetected] = useState<string>('🔄 Detectando dispositivo...');

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // ============================================================
        // 1. EXTRAER EL TOKEN DE LA URL
        // ============================================================
        const url = window.location.href;
        console.log('📍 URL completa:', url);

        // Buscar token en el hash (#access_token=xxx)
        let extractedToken: string | null = null;
        const hashMatch = url.match(/#access_token=([^&]+)/);
        if (hashMatch) {
            extractedToken = decodeURIComponent(hashMatch[1]);
            console.log('🔑 Token del hash:', extractedToken.substring(0, 30) + '...');
        } else {
            // Buscar en query string (?access_token=xxx)
            const queryMatch = url.match(/[?&]access_token=([^&]+)/);
            if (queryMatch) {
                extractedToken = decodeURIComponent(queryMatch[1]);
                console.log('🔑 Token del query:', extractedToken.substring(0, 30) + '...');
            }
        }

        setToken(extractedToken);

        // ============================================================
        // 2. DETECTAR DISPOSITIVO
        // ============================================================
        const esAndroid = /android/i.test(navigator.userAgent);
        const esIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
        const esTelefono = esAndroid || esIOS;

        if (esTelefono) {
            setDetected(`📱 Detectado: ${esAndroid ? 'Android' : 'iOS'}`);

            // ============================================================
            // 3. CONSTRUIR EL DEEP LINK CON EL TOKEN
            // ============================================================
            let appUrl = 'krustyburger://reset-password';
            if (extractedToken) {
                appUrl += `?token=${encodeURIComponent(extractedToken)}`;
                console.log('🔗 Redirigiendo a:', appUrl);
                setDetected(`📱 Detectado: ${esAndroid ? 'Android' : 'iOS'} - Token encontrado ✅`);
            } else {
                console.log('⚠️ No se encontró token en la URL');
                setDetected(`📱 Detectado: ${esAndroid ? 'Android' : 'iOS'} - ⚠️ Token no encontrado`);
            }

            // ============================================================
            // 4. REDIRIGIR A LA APP
            // ============================================================
            // Intentar abrir la app inmediatamente
            window.location.href = appUrl;

            // Si la app no está instalada, redirigir a Play Store después de 3 segundos
            setTimeout(() => {
                if (esAndroid) {
                    window.location.href = 'https://play.google.com/store/apps/details?id=com.agenciapowa.KrustyBurger';
                }
            }, 3000);

        } else {
            setDetected('🖥️ Detectado: Computadora - La app solo funciona en dispositivos móviles');
        }
    }, []);

    return (
        <div style={styles.container}>
            <div style={styles.content}>
                <div style={styles.logo}>🍔</div>
                <h1 style={styles.title}>Krusty Burger</h1>
                <p style={styles.subtitle}>Restablecer contraseña</p>

                <a
                    href={token ? `krustyburger://reset-password?token=${encodeURIComponent(token)}` : 'krustyburger://reset-password'}
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
                    {token && <p style={styles.tokenInfo}>🔑 Token: {token.substring(0, 20)}...</p>}
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
        fontSize: '12px',
        wordBreak: 'break-all' as const,
    },
} as const;