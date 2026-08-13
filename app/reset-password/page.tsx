// app/reset-password/page.tsx
'use client';

import { useEffect, useState } from 'react';

export default function ResetPasswordPage() {
    const [token, setToken] = useState<string | null>(null);
    const [detected, setDetected] = useState<string>('🔄 Detectando dispositivo...');

    useEffect(() => {
        // ⚠️ Solo se ejecuta en el navegador
        if (typeof window === 'undefined') return;

        // ============================================================
        // 1. EXTRAER EL TOKEN DE LA URL
        // ============================================================
        const url = window.location.href;
        console.log('📍 URL completa:', url);

        let extractedToken: string | null = null;

        // ✅ Buscar en el hash (#access_token=xxx)
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

        console.log('📱 Dispositivo:', esTelefono ? (esAndroid ? 'Android' : 'iOS') : 'Computadora');

        // ============================================================
        // 3. CONSTRUIR LA URL DE LA APP CON EL TOKEN
        // ============================================================
        let appUrl = 'krustyburger://reset-password';
        if (extractedToken) {
            appUrl += `?token=${encodeURIComponent(extractedToken)}`;
            console.log('🔗 URL de la app con token:', appUrl);
            setDetected(`📱 Token encontrado ✅ - Redirigiendo...`);
        } else {
            console.log('⚠️ No se encontró token en la URL');
            setDetected('⚠️ No se encontró token. Redirigiendo sin token...');
        }

        // ============================================================
        // 4. REDIRIGIR A LA APP (si es teléfono)
        // ============================================================
        if (esTelefono) {
            // ✅ REDIRIGIR A LA APP INMEDIATAMENTE
            setTimeout(() => {
                console.log('🔀 Redirigiendo a:', appUrl);
                window.location.href = appUrl;
            }, 500);

            // ⚠️ Si la app no está instalada, redirigir a Play Store
            setTimeout(() => {
                if (esAndroid) {
                    console.log('📱 Abriendo Play Store...');
                    window.location.href = 'https://play.google.com/store/apps/details?id=com.agenciapowa.KrustyBurger';
                }
            }, 3000);
        } else {
            // 💻 Es una computadora
            setDetected('🖥️ Computadora - La app solo funciona en dispositivos móviles');
        }

        // ============================================================
        // 5. LOG DE DEBUG
        // ============================================================
        console.log('📊 Estado final:', {
            extractedToken: extractedToken ? '✅ Sí' : '❌ No',
            appUrl: appUrl,
            esTelefono: esTelefono,
        });
    }, []);

    return (
        <div style={styles.container}>
            <div style={styles.content}>
                <div style={styles.logo}>🍔</div>
                <h1 style={styles.title}>Krusty Burger</h1>
                <p style={styles.subtitle}>Restablecer contraseña</p>

                {/* ✅ BOTÓN MANUAL PARA ABRIR LA APP */}
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

                {/* ✅ INFORMACIÓN DE DEBUG */}
                <div style={styles.detected}>
                    <p>{detected}</p>
                    {token && (
                        <p style={styles.tokenInfo}>
                            🔑 Token: {token.substring(0, 20)}...
                        </p>
                    )}
                    {!token && (
                        <p style={styles.tokenInfo}>
                            ⚠️ No se encontró token en la URL
                        </p>
                    )}
                    <p style={styles.debugInfo}>
                        📋 URL: {typeof window !== 'undefined' && window.location.href}
                    </p>
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
    debugInfo: {
        color: '#666',
        marginTop: '10px',
        fontSize: '10px',
        wordBreak: 'break-all' as const,
    },
} as const;