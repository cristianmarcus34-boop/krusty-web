// app/canjear/page.tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function CanjearContent() {
    const searchParams = useSearchParams();
    const codigo = searchParams.get('codigo');
    const [copiado, setCopiado] = useState(false);

    useEffect(() => {
        if (codigo) {
            // ✅ Intentar abrir la app con deep link
            const deepLink = `krustyburger://cupon/${codigo}`;

            // Intentar abrir inmediatamente
            window.location.href = deepLink;

            // Si después de 3 segundos no se abrió, mostrar el fallback
            const timer = setTimeout(() => {
                document.getElementById('fallback')?.classList.add('visible');
                document.getElementById('contenido')?.style.setProperty('display', 'none');
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [codigo]);

    const copiarCodigo = async () => {
        if (!codigo) return;
        try {
            await navigator.clipboard.writeText(codigo);
            setCopiado(true);
            setTimeout(() => setCopiado(false), 2000);
        } catch (error) {
            // Fallback para navegadores antiguos
            const textarea = document.createElement('textarea');
            textarea.value = codigo;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopiado(true);
            setTimeout(() => setCopiado(false), 2000);
        }
    };

    if (!codigo) {
        return (
            <div style={styles.container}>
                <div style={styles.card}>
                    <div style={styles.logo}>🍔</div>
                    <h1 style={styles.title}>Krusty Burger</h1>
                    <p style={styles.errorText}>❌ Código no encontrado</p>
                    <p style={styles.subtitle}>
                        El enlace no contiene un código válido.
                    </p>
                    <a
                        href="https://play.google.com/store/apps/details?id=com.agenciapowa.KrustyBurger"
                        style={styles.downloadButton}
                    >
                        📱 Descargar la app
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.logo}>🍔</div>
                <h1 style={styles.title}>Krusty Burger</h1>
                <p style={styles.subtitle}>Redirigiendo a la app...</p>

                <div style={styles.spinner}></div>

                {/* Contenido principal */}
                <div id="contenido" style={styles.contenido}>
                    <p style={styles.mensaje}>¿La app no se abre?</p>
                    <div style={styles.codigoContainer}>
                        <p style={styles.codigoLabel}>Código del cupón</p>
                        <p style={styles.codigo}>{codigo}</p>
                    </div>
                    <p style={styles.mensajeSmall}>
                        Copiá el código y abrí la app manualmente
                    </p>
                    <button
                        onClick={copiarCodigo}
                        style={styles.copiarButton}
                    >
                        {copiado ? '✅ ¡Copiado!' : '📋 Copiar código'}
                    </button>
                    <br />
                    <a
                        href="https://play.google.com/store/apps/details?id=com.agenciapowa.KrustyBurger"
                        style={styles.downloadButton}
                    >
                        📱 Descargar la app
                    </a>
                </div>

                {/* Fallback (se muestra después de 3s si no abrió la app) */}
                <div id="fallback" style={styles.fallback}>
                    <p style={styles.mensajeSmall}>Código para canjear manualmente:</p>
                    <div style={styles.codigoContainer}>
                        <p style={styles.codigo}>{codigo}</p>
                    </div>
                    <button
                        onClick={copiarCodigo}
                        style={styles.copiarButton}
                    >
                        {copiado ? '✅ ¡Copiado!' : '📋 Copiar código'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function CanjearPage() {
    return (
        <Suspense fallback={<div style={styles.loading}>Cargando...</div>}>
            <CanjearContent />
        </Suspense>
    );
}

// ============================================================
// 🎨 ESTILOS
// ============================================================
const styles: { [key: string]: React.CSSProperties } = {
    container: {
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#1A1A1A',
        padding: '20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
        margin: 0,
    },
    loading: {
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#1A1A1A',
        color: '#F5C518',
        fontSize: '18px',
    },
    card: {
        maxWidth: '420px',
        width: '100%',
        textAlign: 'center',
        background: '#2A2A2A',
        borderRadius: '24px',
        padding: '40px 30px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        border: '1px solid rgba(255,255,255,0.05)',
    },
    logo: {
        fontSize: '64px',
        marginBottom: '16px',
    },
    title: {
        fontSize: '24px',
        fontWeight: 700,
        color: '#F5C518',
        marginBottom: '8px',
    },
    subtitle: {
        fontSize: '14px',
        color: '#999',
        marginBottom: '30px',
    },
    spinner: {
        width: '48px',
        height: '48px',
        border: '4px solid rgba(245, 197, 24, 0.2)',
        borderTop: '4px solid #F5C518',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 24px',
    },
    contenido: {
        display: 'block',
    },
    mensaje: {
        fontSize: '14px',
        color: '#999',
        lineHeight: 1.6,
    },
    mensajeSmall: {
        fontSize: '13px',
        color: '#666',
        lineHeight: 1.6,
    },
    codigoContainer: {
        background: '#1A1A1A',
        borderRadius: '12px',
        padding: '16px',
        margin: '16px 0',
        border: '1px dashed rgba(245, 197, 24, 0.3)',
    },
    codigoLabel: {
        fontSize: '11px',
        color: '#666',
        textTransform: 'uppercase',
        letterSpacing: '2px',
        marginBottom: '4px',
    },
    codigo: {
        fontSize: '22px',
        fontWeight: 700,
        letterSpacing: '3px',
        color: '#F5C518',
        fontFamily: '"Courier New", monospace',
    },
    copiarButton: {
        background: 'rgba(255,255,255,0.08)',
        color: '#F5C518',
        padding: '10px 20px',
        borderRadius: '8px',
        border: '1px solid rgba(245, 197, 24, 0.2)',
        fontSize: '14px',
        fontWeight: 500,
        marginTop: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    downloadButton: {
        display: 'inline-block',
        background: '#F5C518',
        color: '#1A1A1A',
        padding: '14px 32px',
        borderRadius: '12px',
        fontWeight: 600,
        fontSize: '16px',
        textDecoration: 'none',
        marginTop: '16px',
        transition: 'opacity 0.2s',
        border: 'none',
        cursor: 'pointer',
    },
    fallback: {
        display: 'none',
        marginTop: '20px',
        paddingTop: '20px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
    },
    errorText: {
        color: '#E53935',
        fontSize: '16px',
        marginTop: '16px',
    },
};

// Inyectar keyframes para la animación del spinner
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        #fallback.visible {
            display: block !important;
        }
        #contenido.hidden {
            display: none !important;
        }
    `;
    document.head.appendChild(styleSheet);
}