import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Verificación de variables en desarrollo
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log("🛠️ Supabase URL cargada:", supabaseUrl ? "SÍ ✅" : "NO ❌");
  console.log("🛠️ Supabase Key cargada:", supabaseAnonKey ? "SÍ ✅" : "NO ❌");
}

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

// Función útil para traer un solo producto por ID (la usaremos en la página de detalle)
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