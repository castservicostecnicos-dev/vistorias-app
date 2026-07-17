import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function signIn(email: string, password: string){
  return await supabase.auth.signInWithPassword({ email, password })
}

export async function signOut(){
  return await supabase.auth.signOut()
}

export async function getUser(){
  const r = await supabase.auth.getUser()
  return r.data.user
}
