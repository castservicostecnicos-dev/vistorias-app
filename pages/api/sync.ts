import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin, auditSupabaseAdmin } from '../../lib/supabaseServer'

type OutboxEntry = {
  id: string
  table: string
  method: 'CREATE' | 'UPDATE'
  payload: any
  createdAt: number
}

function normalizeTableName(table: string){
  // map client logical names to DB table names if needed
  const map: Record<string,string> = {
    vistorias: 'vistorias',
    rotinas: 'rotinas',
    clientes: 'clientes',
    condominios: 'condominios',
    files: 'files',
    ordens_servico: 'ordens_servico',
    users: 'users'
  }
  return map[table] || table
}

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  if(req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const authHeader = req.headers.authorization || ''
  const token = authHeader.split(' ')[1]
  if(!token) return res.status(401).json({ error: 'Missing access token' })

  // Validate user token via Supabase admin client
  const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token)
  if(userErr || !userData?.user) return res.status(401).json({ error: 'Invalid token', details: userErr?.message })
  const actorId = userData.user.id

  const entry: OutboxEntry = req.body
  if(!entry || !entry.table || !entry.method || !entry.payload) return res.status(400).json({ error: 'Invalid entry' })

  const table = normalizeTableName(entry.table)
  const payload = entry.payload
  const method = entry.method

  try{
    let before: any = null
    let after: any = null
    if(method === 'UPDATE'){
      // fetch before state
      const { data: bdata, error: berr } = await supabaseAdmin.from(table).select('*').eq('id', payload.id).maybeSingle()
      if(berr) return res.status(500).json({ error: 'Error fetching before state', details: berr.message })
      before = bdata || null

      const { data: udata, error: uerr } = await supabaseAdmin.from(table).update(payload).eq('id', payload.id).select().maybeSingle()
      if(uerr) return res.status(500).json({ error: 'Error updating record', details: uerr.message })
      after = udata || null
    } else if(method === 'CREATE'){
      // create record
      // if no id provided, let DB create it and return generated id
      const { data: cdata, error: cerr } = await supabaseAdmin.from(table).insert(payload).select().maybeSingle()
      if(cerr) return res.status(500).json({ error: 'Error creating record', details: cerr.message })
      after = cdata || null
    } else {
      return res.status(400).json({ error: 'Unsupported method' })
    }

    // Write audit log to audit DB if configured
    try{
      if(auditSupabaseAdmin){
        const auditRecord = {
          entity_table: table,
          entity_id: payload.id || (after && after.id) || null,
          action: method,
          actor_id: actorId,
          before: before,
          after: after,
          reason: entry['reason'] || null
        }
        const { error: aerr } = await auditSupabaseAdmin.from('audit_logs').insert(auditRecord)
        if(aerr){
          console.warn('Failed to write audit log:', aerr.message)
        }
      }
    }catch(ae){
      console.warn('Audit logging error', ae)
    }

    return res.status(200).json({ ok: true, table, method, before, after })
  }catch(err:any){
    console.error('Sync error', err)
    return res.status(500).json({ error: 'Internal server error', details: String(err) })
  }
}
