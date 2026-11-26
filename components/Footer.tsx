// components/Footer.tsx
import Link from 'next/link';
import Image from 'next/image';

const PLAY_STORE_URL =
    'https://play.google.com/store/apps/details?id=com.agenciapowa.KrustyBurger&pcampaignid=web_share';

export default function Footer() {
    const anio = new Date().getFullYear();

    return (
        <footer className="bg-[#1A1A1A] text-stone-300 border-t-8 border-black relative overflow-hidden">

            {/* Fondo con patrón sutil */}
            <div
                className="absolute inset-0 opacity-[0.04] pointer-events-none"
                style={{
                    backgroundImage:
                        'repeating-linear-gradient(45deg, #FFCA28 0, #FFCA28 1px, transparent 0, transparent 50%)',
                    backgroundSize: '6px 6px',
                }}
                aria-hidden="true"
            />

            {/* Glow decorativo */}
            <div
                className="absolute -top-20 left-1/4 w-64 h-64 bg-[#FFCA28]/10 rounded-full blur-[100px] pointer-events-none"
                aria-hidden="true"
            />
            <div
                className="absolute -bottom-20 right-1/4 w-64 h-64 bg-[#D32F2F]/10 rounded-full blur-[100px] pointer-events-none"
                aria-hidden="true"
            />

            {/* ============ CONTENIDO PRINCIPAL ============ */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-10">

                {/* Grid principal: 4 columnas en desktop */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">

                    {/* ---------- COLUMNA 1: MARCA (ancha) ---------- */}
                    <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left">

                        <div className="inline-block bg-[#FFCA28] text-black px-3 py-1 rounded-full font-black italic text-[10px] mb-4 border-2 border-black shadow-[3px_3px_0px_0px_black]">
                            CALIDAD SPRINGFIELD - VILLA LA FLORIDA
                        </div>

                        <h2 className="text-[#FFCA28] font-black italic text-3xl md:text-4xl mb-3 tracking-tighter drop-shadow-[2px_2px_0px_black]">
                            KRUSTY BURGER INC.
                        </h2>

                        <p className="text-stone-400 text-sm max-w-sm leading-relaxed mb-6 italic">
                            &ldquo;Si no se atraganta, no es una Krusty.&rdquo;
                            <br />
                            Hamburguesas hechas con amor y explosivos desde Villa La Florida, Quilmes.
                        </p>

                        {/* Redes sociales */}
                        <div className="flex gap-3">
                            <Link
                                href="https://www.instagram.com/krustyburger"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Instagram"
                                className="w-11 h-11 flex items-center justify-center bg-white/5 hover:bg-linear-to-br hover:from-[#F58529] hover:via-[#DD2A7B] hover:to-[#8134AF] border-2 border-white/10 hover:border-transparent rounded-xl transition-all active:scale-90"
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                                </svg>
                            </Link>

                            <Link
                                href="https://wa.me/5491138305837"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="WhatsApp"
                                className="w-11 h-11 flex items-center justify-center bg-white/5 hover:bg-[#25D366] border-2 border-white/10 hover:border-transparent rounded-xl transition-all active:scale-90"
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                </svg>
                            </Link>

                            <Link
                                href="https://g.page/r/CTEcMZ1GEz0LEBI/review"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Google Reviews"
                                className="w-11 h-11 flex items-center justify-center bg-white/5 hover:bg-[#FFCA28] hover:text-black border-2 border-white/10 hover:border-transparent rounded-xl transition-all active:scale-90"
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z" />
                                </svg>
                            </Link>
                        </div>
                    </div>

                    {/* ---------- COLUMNA 2: NAVEGACIÓN ---------- */}
                    <div className="lg:col-span-3 text-center lg:text-left">
                        <h3 className="text-[#FFCA28] font-black text-xs uppercase tracking-[0.2em] mb-5">
                            Explorá
                        </h3>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <Link href="/" className="text-stone-400 hover:text-white hover:translate-x-1 inline-block transition-all">
                                    → Inicio
                                </Link>
                            </li>
                            <li>
                                <Link href="/#menu-section" className="text-stone-400 hover:text-white hover:translate-x-1 inline-block transition-all">
                                    → Menú
                                </Link>
                            </li>
                            <li>
                                <Link href="/mutaciones" className="text-stone-400 hover:text-white hover:translate-x-1 inline-block transition-all">
                                    → Mutaciones
                                </Link>
                            </li>
                            <li>
                                <Link href="/krusty-legal" className="text-stone-400 hover:text-white hover:translate-x-1 inline-block transition-all">
                                    → Propiedad de Alma
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* ---------- COLUMNA 3: LEGAL ---------- */}
                    <div className="lg:col-span-2 text-center lg:text-left">
                        <h3 className="text-[#FFCA28] font-black text-xs uppercase tracking-[0.2em] mb-5">
                            Legal
                        </h3>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <Link href="/privacidad" className="text-stone-400 hover:text-white transition-colors">
                                    Privacidad
                                </Link>
                            </li>
                            <li>
                                <Link href="/terminos" className="text-stone-400 hover:text-white transition-colors">
                                    Términos
                                </Link>
                            </li>
                            <li>
                                <Link href="/sugerencias" className="text-stone-400 hover:text-white transition-colors">
                                    💡 Sugerencias
                                </Link>
                            </li>
                            <li>
                                <Link href="/defensa" className="text-stone-400 hover:text-white transition-colors">
                                    Defensa Consumidor
                                </Link>
                            </li>
                            <li>
                                <Link href="/admin" className="text-stone-400 hover:text-white transition-colors">
                                    🔐 Acceso Staff
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* ---------- COLUMNA 4: CONTACTO ---------- */}
                    <div className="lg:col-span-2 text-center lg:text-left">
                        <h3 className="text-[#FFCA28] font-black text-xs uppercase tracking-[0.2em] mb-5">
                            Contacto
                        </h3>
                        <ul className="space-y-3 text-sm text-stone-400">
                            <li className="flex items-start gap-2 justify-center lg:justify-start">
                                <span className="text-[#FFCA28]">📍</span>
                                <span>Villa La Florida,<br />Quilmes (CP 1881)</span>
                            </li>
                            <li className="flex items-start gap-2 justify-center lg:justify-start">
                                <span className="text-[#FFCA28]">🕒</span>
                                <span>Todos los días<br />19:00 a 23:59</span>
                            </li>
                            <li className="flex items-start gap-2 justify-center lg:justify-start">
                                <span className="text-[#FFCA28]">📞</span>
                                <Link href="tel:+5491138305837" className="hover:text-white transition-colors">
                                    +54 9 11 3830-5837
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* ============ TARJETA APP OFICIAL GOOGLE PLAY ============ */}
                <div
                    id="footer-play-store"
                    className="scroll-mt-24 mt-12 relative overflow-hidden rounded-2xl bg-linear-to-r from-white/[0.06] via-white/[0.03] to-[#FFCA28]/[0.06] border border-white/15 hover:border-[#FFCA28]/40 p-6 sm:p-7 transition-all duration-300"
                >
                    {/* Brillo sutil superior */}
                    <div
                        className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#FFCA28]/40 to-transparent pointer-events-none"
                        aria-hidden="true"
                    />

                    <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                        {/* Izquierda: ícono + propuesta de valor */}
                        <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-4 sm:gap-5">
                            <div className="relative shrink-0 w-14 h-14 rounded-2xl bg-[#121212] border-2 border-[#FFCA28] shadow-[4px_4px_0px_0px_black] flex items-center justify-center overflow-hidden">
                                <Image
                                    src="/images/Krustyburgerheader.webp"
                                    alt="App Krusty Burger"
                                    width={48}
                                    height={48}
                                    className="object-cover rounded-xl"
                                />
                            </div>

                            <div>
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
                                    <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#FFCA28] bg-[#FFCA28]/10 border border-[#FFCA28]/30 px-2.5 py-0.5 rounded-full">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                                        App Oficial Android
                                    </span>
                                    <span className="text-[11px] font-semibold text-stone-400">
                                        Puntos • Cupones QR • Envío en vivo
                                    </span>
                                </div>

                                <h3
                                    className="font-sans text-white font-black text-lg sm:text-xl tracking-tight leading-snug normal-case"
                                    style={{ fontFamily: 'inherit' }}
                                >
                                    Llevá a Krusty en el bolsillo
                                </h3>
                                <p className="text-stone-400 text-xs sm:text-sm max-w-xl mt-0.5 leading-relaxed">
                                    Pedí en segundos, seguí tu hamburguesa en tiempo real por el mapa y canjeá puntos por burgers gratis.
                                </p>
                            </div>
                        </div>

                        {/* Derecha: Botón oficial Google Play */}
                        <a
                            href={PLAY_STORE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Descargar Krusty Burger en Google Play"
                            className="group shrink-0 inline-flex items-center gap-3.5 bg-[#0f0f0f] hover:bg-black text-white px-5 py-3 rounded-xl border-2 border-white/20 hover:border-[#FFCA28] shadow-[4px_4px_0px_0px_black] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                        >
                            {/* Ícono oficial Google Play SVG */}
                            <svg
                                viewBox="0 0 24 24"
                                className="w-7 h-7 shrink-0 transition-transform duration-200 group-hover:scale-105"
                                aria-hidden="true"
                            >
                                <path
                                    fill="#4285F4"
                                    d="M3.61 1.814L13.793 12 3.61 22.186a1.99 1.99 0 0 1-.465-1.28V3.094c0-.496.178-.948.465-1.28z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M17.223 8.57L13.793 12 3.61 1.814c.426-.488 1.124-.656 1.797-.283l11.816 7.039z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M20.41 10.468c1.053.627 1.053 2.437 0 3.064l-3.187 1.898L13.793 12l3.43-3.43 3.187 1.898z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M17.223 15.43L5.407 22.469c-.673.373-1.371.205-1.797-.283L13.793 12l3.43 3.43z"
                                />
                            </svg>

                            <div className="text-left">
                                <span className="block text-[9px] font-bold uppercase tracking-[0.18em] text-stone-400 group-hover:text-[#FFCA28] transition-colors leading-none mb-1">
                                    Disponible en
                                </span>
                                <span className="block text-base font-extrabold tracking-tight text-white leading-none">
                                    Google Play
                                </span>
                            </div>

                            <span className="ml-1 text-stone-500 group-hover:text-[#FFCA28] group-hover:translate-x-0.5 transition-all text-sm font-bold">
                                →
                            </span>
                        </a>
                    </div>
                </div>

                {/* ============ BARRA INFERIOR ============ */}
                <div className="mt-10 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">

                    {/* Copyright */}
                    <div className="text-center md:text-left">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                            © {anio} Springfield Food Group
                        </p>
                        <p className="text-[10px] text-stone-600 mt-1">
                            Arcos de Springfield S.A. — CUIT: 30-12345678-9
                        </p>
                    </div>

                    {/* Crédito Agencia Powa */}
                    <Link
                        href="https://www.agenciadigitalpowa.com.ar/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#FFCA28]/40 px-4 py-2.5 rounded-xl transition-all active:scale-95"
                    >
                        <div className="relative w-7 h-7 opacity-80 group-hover:opacity-100 transition-opacity">
                            <Image
                                src="/images/logo-powa.png"
                                alt="Agencia Powa"
                                width={28}
                                height={28}
                                className="object-contain"
                            />
                        </div>
                        <div className="text-left">
                            <p className="text-[8px] text-stone-500 uppercase tracking-[0.2em] leading-none mb-0.5">
                                Hecho con humor por
                            </p>
                            <p className="text-[11px] font-black italic text-[#FFCA28] leading-none">
                                AGENCIA POWA
                            </p>
                        </div>
                    </Link>

                    {/* Frase final */}
                    <p className="text-[9px] text-[#D32F2F] font-black uppercase italic tracking-[0.25em] opacity-70 max-w-45 text-center md:text-right">
                        &ldquo;Si no se atraganta, no es una Krusty&rdquo;
                    </p>
                </div>
            </div>
        </footer>
    );
}