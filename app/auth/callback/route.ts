// app/auth/callback/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');

    if (code) {
        // Intercambiar el código por una sesión
        await supabase.auth.exchangeCodeForSession(code);
    }

    // Redirigir al home después del login
    return NextResponse.redirect(new URL('/', requestUrl.origin));
}