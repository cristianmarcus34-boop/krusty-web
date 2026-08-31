// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: { 'apikey': supabaseAnonKey }
  },
  db: {
    schema: 'public'
  }
})

// ============================================================
// ✅ INTERCEPTOR PARA MANEJAR ERRORES DE AUTENTICACIÓN
// ============================================================

// ✅ Interceptor para manejar errores de autenticación
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('✅ Token refrescado correctamente');
  }

  if (event === 'SIGNED_OUT') {
    console.log('👋 Sesión cerrada');
  }

  // ❌ ELIMINADO: 'USER_DELETED' no es un evento válido
});

// ✅ Función para verificar y limpiar sesión inválida
export const verificarSesion = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error && (
      error.message?.includes('Invalid Refresh Token') ||
      error.message?.includes('Refresh Token Not Found') ||
      error.message?.includes('JWT expired')
    )) {
      console.warn('⚠️ Token inválido, limpiando sesión...');
      await supabase.auth.signOut();

      if (typeof window !== 'undefined') {
        localStorage.removeItem('krusty-auth-storage');
        localStorage.removeItem('krusty-cart-storage-v5');
        window.location.reload();
      }

      return null;
    }

    return session;
  } catch (error) {
    console.error('Error verificando sesión:', error);
    return null;
  }
};

// ============================================================
// 📦 FUNCIONES ÚTILES
// ============================================================

// Función útil para traer un solo producto por ID
export async function getProductoById(id: string) {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error("Error obteniendo producto:", error);
    return null;
  }
  return data;
}