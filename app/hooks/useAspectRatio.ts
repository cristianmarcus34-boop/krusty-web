// hooks/useAspectRatio.ts
'use client';

import { useState, useEffect } from 'react';

export type ScreenType =
    | 'mobile'
    | 'tablet'
    | 'desktop'
    | 'wide'
    | 'square'
    | 'ultrawide'
    | '4k';

export interface ScreenInfo {
    // Tipos de pantalla
    type: ScreenType;
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    isWidescreen: boolean;
    isSquare: boolean;
    isUltrawide: boolean;
    is4K: boolean;

    // Medidas
    width: number;
    height: number;
    aspectRatio: number;

    // Tamaños recomendados
    logoSize: string;
    titleSize: string;
    paddingTop: string;
    paddingBottom: string;
    maxWidth: string;
    badgeSize: string;
    spacing: string;
}

export function useAspectRatio(): ScreenInfo {
    const [screenInfo, setScreenInfo] = useState<ScreenInfo>({
        type: 'desktop',
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isWidescreen: true,
        isSquare: false,
        isUltrawide: false,
        is4K: false,
        width: 1920,
        height: 1080,
        aspectRatio: 1.78,
        logoSize: 'w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 lg:w-72 lg:h-72',
        titleSize: 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl',
        paddingTop: 'pt-16 sm:pt-20 md:pt-24',
        paddingBottom: 'pb-12 sm:pb-16 md:pb-20',
        maxWidth: 'max-w-5xl',
        badgeSize: 'text-[10px] sm:text-[11px] px-4 sm:px-5 py-1.5 sm:py-2',
        spacing: 'mb-6 sm:mb-8 md:mb-10',
    });

    useEffect(() => {
        const updateScreenInfo = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            const aspect = width / height;

            // Determinar tipo de pantalla
            let type: ScreenType = 'desktop';
            let isMobile = false;
            let isTablet = false;
            let isDesktop = true;
            let isWidescreen = true;
            let isSquare = false;
            let isUltrawide = false;
            let is4K = false;

            // Móvil: menos de 768px
            if (width < 768) {
                type = 'mobile';
                isMobile = true;
                isDesktop = false;
            }
            // Tablet: entre 768px y 1024px
            else if (width >= 768 && width < 1024) {
                type = 'tablet';
                isTablet = true;
                isDesktop = false;
            }
            // Desktop: más de 1024px
            else {
                // 4K: más de 3840px
                if (width >= 3840) {
                    type = '4k';
                    is4K = true;
                }
                // Ultra-wide: aspect ratio mayor a 2:1 (21:9, 32:9)
                else if (aspect > 2.0) {
                    type = 'ultrawide';
                    isUltrawide = true;
                }
                // Square: aspect ratio menor a 1.4 (5:4, 4:3)
                else if (aspect < 1.4) {
                    type = 'square';
                    isSquare = true;
                    isWidescreen = false;
                }
                // Widescreen normal (16:9, 16:10)
                else {
                    type = 'wide';
                }
            }

            // Calcular tamaños según el tipo
            let logoSize: string;
            let titleSize: string;
            let paddingTop: string;
            let paddingBottom: string;
            let maxWidth: string;
            let badgeSize: string;
            let spacing: string;

            switch (type) {
                case 'mobile':
                    logoSize = 'w-24 h-24';
                    titleSize = 'text-2xl';
                    paddingTop = 'pt-12';
                    paddingBottom = 'pb-8';
                    maxWidth = 'max-w-sm';
                    badgeSize = 'text-[8px] px-2 py-0.5';
                    spacing = 'mb-4';
                    break;
                case 'tablet':
                    logoSize = 'w-36 h-36 sm:w-44 sm:h-44';
                    titleSize = 'text-3xl sm:text-4xl';
                    paddingTop = 'pt-16';
                    paddingBottom = 'pb-12';
                    maxWidth = 'max-w-2xl';
                    badgeSize = 'text-[9px] px-3 py-1';
                    spacing = 'mb-5';
                    break;
                case 'square': // 5:4, 4:3
                    logoSize = 'w-40 h-40 md:w-48 md:h-48 lg:w-52 lg:h-52';
                    titleSize = 'text-3xl md:text-4xl lg:text-5xl';
                    paddingTop = 'pt-16 md:pt-20';
                    paddingBottom = 'pb-12 md:pb-16';
                    maxWidth = 'max-w-4xl';
                    badgeSize = 'text-[9px] sm:text-[10px] px-3 sm:px-4 py-1 sm:py-1.5';
                    spacing = 'mb-4 sm:mb-6 md:mb-8';
                    break;
                case 'ultrawide': // 21:9, 32:9
                    logoSize = 'w-36 h-36 md:w-56 md:h-56 lg:w-80 lg:h-80';
                    titleSize = 'text-3xl md:text-5xl lg:text-7xl';
                    paddingTop = 'pt-16 md:pt-24';
                    paddingBottom = 'pb-12 md:pb-20';
                    maxWidth = 'max-w-7xl';
                    badgeSize = 'text-[10px] sm:text-[12px] px-4 sm:px-6 py-1.5 sm:py-2.5';
                    spacing = 'mb-6 sm:mb-10 md:mb-12';
                    break;
                case '4k': // 3840x2160+
                    logoSize = 'w-48 h-48 md:w-80 md:h-80 lg:w-96 lg:h-96';
                    titleSize = 'text-4xl md:text-6xl lg:text-8xl';
                    paddingTop = 'pt-20 md:pt-28';
                    paddingBottom = 'pb-16 md:pb-24';
                    maxWidth = 'max-w-7xl';
                    badgeSize = 'text-[11px] sm:text-[13px] px-5 sm:px-6 py-2 sm:py-3';
                    spacing = 'mb-8 sm:mb-12 md:mb-16';
                    break;
                default: // Widescreen normal
                    logoSize = 'w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 lg:w-72 lg:h-72 xl:w-80 xl:h-80';
                    titleSize = 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl';
                    paddingTop = 'pt-16 sm:pt-20 md:pt-24';
                    paddingBottom = 'pb-12 sm:pb-16 md:pb-20';
                    maxWidth = 'max-w-5xl xl:max-w-6xl';
                    badgeSize = 'text-[10px] sm:text-[11px] px-4 sm:px-5 py-1.5 sm:py-2';
                    spacing = 'mb-6 sm:mb-8 md:mb-10';
                    break;
            }

            setScreenInfo({
                type,
                isMobile,
                isTablet,
                isDesktop,
                isWidescreen,
                isSquare,
                isUltrawide,
                is4K,
                width,
                height,
                aspectRatio: aspect,
                logoSize,
                titleSize,
                paddingTop,
                paddingBottom,
                maxWidth,
                badgeSize,
                spacing,
            });
        };

        updateScreenInfo();
        window.addEventListener('resize', updateScreenInfo);
        return () => window.removeEventListener('resize', updateScreenInfo);
    }, []);

    return screenInfo;
}