import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let supabaseClient: SupabaseClient | null = null

export const hasSupabase = () =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  )

export const getSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseKey =
    process.env.NODE_ENV === "production"
      ? serviceRoleKey
      : serviceRoleKey || supabaseAnonKey

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase is not configured")
  }

  if (process.env.NODE_ENV === "production" && !serviceRoleKey) {
    throw new Error("Supabase service role key is required in production")
  }

  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  return supabaseClient
}
