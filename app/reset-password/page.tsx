// app/reset-password/page.tsx
'use client';

import { useEffect, useState } from 'react';

export default function ResetPasswordPage() {
    const [token, setToken] = useState<string | null>(null);
    const [detected, setDetected] = useState<string>('🔄 Detectando dispositivo...');
    const [debugInfo, setDebugInfo] = useState<string>('');

    useEffect(() => {
        // ⚠️ Solo se ejecuta en el navegador
        if (typeof window === 'undefined') return;

        // ============================================================
        // 1. OBTENER LA URL COMPLETA (CON HASH)
        // ============================================================
        const url = window.location.href;
        console.log('📍 URL completa:', url);
        setDebugInfo(`URL: ${url.substring(0, 60)}...`);

        let extractedToken: string | null = null;

        // ============================================================
        // 2. EXTRAER EL TOKEN (MÚLTIPLES FORMATOS)
        // ============================================================

        // 🔹 Formato 1: #access_token=xxx (Supabase)
        const hashMatch = url.match(/#access_token=([^&]+)/);
        if (hashMatch) {
            extractedToken = decodeURIComponent(hashMatch[1]);
            console.log('🔑 Token del hash:', extractedToken.substring(0, 30) + '...');
            setDebugInfo(`✅ Token encontrado en hash`);
        }

        // 🔹 Formato 2: ?access_token=xxx
        if (!extractedToken) {
            const queryMatch = url.match(/[?&]access_token=([^&]+)/);
            if (queryMatch) {
                extractedToken = decodeURIComponent(queryMatch[1]);
                console.log('🔑 Token del query:', extractedToken.substring(0, 30) + '...');
                setDebugInfo(`✅ Token encontrado en query`);
            }
        }

        // 🔹 Formato 3: ?token=xxx
        if (!extractedToken) {
            const tokenMatch = url.match(/[?&]token=([^&]+)/);
            if (tokenMatch) {
                extractedToken = decodeURIComponent(tokenMatch[1]);
                console.log('🔑 Token del query (token=):', extractedToken.substring(0, 30) + '...');
                setDebugInfo(`✅ Token encontrado (token=)`);
            }
        }

        setToken(extractedToken);

        // ============================================================
        // 3. DETECTAR DISPOSITIVO
        // ============================================================
        const esAndroid = /android/i.test(navigator.userAgent);
        const esIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
        const esTelefono = esAndroid || esIOS;

        console.log('📱 Dispositivo:', esTelefono ? (esAndroid ? 'Android' : 'iOS') : 'Computadora');
        setDebugInfo(prev => `${prev} | 📱 ${esTelefono ? (esAndroid ? 'Android' : 'iOS') : 'PC'}`);

        // ============================================================
        // 4. CONSTRUIR LA URL DE LA APP
        // ============================================================
        let appUrl = 'krustyburger://reset-password';

        // ✅ SIEMPRE pasar algo, incluso si no hay token (para debugging)
        if (extractedToken) {
            appUrl += `?token=${encodeURIComponent(extractedToken)}`;
            setDetected(`📱 Token encontrado ✅ - Redirigiendo...`);
        } else {
            // ⚠️ Si no hay token, pasamos la URL completa para debugging
            appUrl += `?url=${encodeURIComponent(url)}`;
            setDetected(`⚠️ No se encontró token. Redirigiendo sin token...`);
        }

        console.log('🔗 URL de la app:', appUrl);
        setDebugInfo(prev => `${prev} | 🔀 ${appUrl.substring(0, 40)}...`);

        // ============================================================
        // 5. REDIRIGIR A LA APP
        // ============================================================
        if (esTelefono) {
            // ✅ Intentar abrir la app inmediatamente
            setTimeout(() => {
                console.log('🔀 Redirigiendo a:', appUrl);
                window.location.href = appUrl;
            }, 300);

            // ⚠️ Si la app no está instalada, redirigir a Play Store
            setTimeout(() => {
                if (esAndroid && document.hidden) {
                    console.log('📱 La app no se abrió, redirigiendo a Play Store...');
                    window.location.href = 'https://play.google.com/store/apps/details?id=com.agenciapowa.KrustyBurger';
                }
            }, 3000);
        } else {
            setDetected('🖥️ Computadora - Usa tu teléfono');
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
                    onClick={(e) => {
                        console.log('👆 Botón manual presionado');
                    }}
                >
                    📱 Abrir en la App
                </a>

                <p style={styles.mensaje}>Si no tienes la app instalada:</p>

                <div style={styles.links}>
                    <a
                        href="https://play.google.com/store/apps/details?id=com.agenciapowa.KrustyBurger"
                        style={{ ...styles.button, ...styles.buttonSecondary }}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Google Play
                    </a>
                </div>

                {/* ✅ PANEL DE DEBUG */}
                <div style={styles.debugPanel}>
                    <p style={styles.debugTitle}>🐛 Debug Info</p>
                    <p style={styles.debugText}>{detected}</p>
                    {token && (
                        <p style={styles.debugToken}>🔑 Token: {token.substring(0, 25)}...</p>
                    )}
                    <p style={styles.debugUrl}>📋 {debugInfo}</p>
                    <p style={styles.debugUrl}>🔗 User-Agent: {typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 60) : 'N/A'}...</p>
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
        width: '100%',
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
    debugPanel: {
        marginTop: '30px',
        padding: '16px',
        background: '#0A0A0A',
        borderRadius: '12px',
        border: '1px solid #333',
        textAlign: 'left' as const,
    },
    debugTitle: {
        color: '#666',
        fontSize: '12px',
        fontWeight: 'bold',
        marginBottom: '8px',
    },
    debugText: {
        color: '#888',
        fontSize: '12px',
        marginBottom: '4px',
        wordBreak: 'break-word' as const,
    },
    debugToken: {
        color: '#F5C518',
        fontSize: '12px',
        marginTop: '4px',
        wordBreak: 'break-all' as const,
    },
    debugUrl: {
        color: '#555',
        fontSize: '10px',
        marginTop: '6px',
        wordBreak: 'break-all' as const,
    },
} as const;