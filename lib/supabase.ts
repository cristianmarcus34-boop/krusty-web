import { createClient } from '@supabase/supabase-js'

// Forzamos la lectura de variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// DEBUG LOGS: Esto aparecerá en la consola de tu navegador (F12)
if (typeof window !== 'undefined') {
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
    // Esto fuerza a que cada petición lleve la apikey, evitando el bucle
    headers: { 'apikey': supabaseAnonKey }
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    }
  }
})