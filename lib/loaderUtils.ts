// lib/loaderUtils.ts
const LOADER_KEY = 'krusty-loader-shown';

export const loaderUtils = {
    hasShown: () => {
        if (typeof window === 'undefined') return true;
        return sessionStorage.getItem(LOADER_KEY) === 'true' || localStorage.getItem(LOADER_KEY) === 'true';
    },

    markAsShown: () => {
        if (typeof window === 'undefined') return;
        localStorage.setItem(LOADER_KEY, 'true');
        sessionStorage.setItem(LOADER_KEY, 'true');
    },

    reset: () => {
        if (typeof window === 'undefined') return;
        sessionStorage.removeItem(LOADER_KEY);
        localStorage.removeItem(LOADER_KEY);
    }
};