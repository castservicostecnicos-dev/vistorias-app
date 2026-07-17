import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
})

// Audit DB (separate Supabase project) - optional
const auditUrl = process.env.AUDIT_SUPABASE_URL || ''
const auditServiceKey = process.env.AUDIT_SUPABASE_SERVICE_ROLE_KEY || ''
export const auditSupabaseAdmin = auditUrl && auditServiceKey ? createClient(auditUrl, auditServiceKey, { auth: { persistSession: false } }) : null
