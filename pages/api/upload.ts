import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin, auditSupabaseAdmin } from '../../lib/supabaseServer'

// Accepts JSON: { fileId, filename, contentType, base64, entityType, entityId }
export default async function handler(req: NextApiRequest, res: NextApiResponse){
  if(req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const authHeader = req.headers.authorization || ''
  const token = authHeader.split(' ')[1]
  if(!token) return res.status(401).json({ error: 'Missing access token' })

  // validate user token
  const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token)
  if(userErr || !userData?.user) return res.status(401).json({ error: 'Invalid token', details: userErr?.message })
  const actorId = userData.user.id

  const body = req.body
  const { fileId, filename, contentType, base64, entityType, entityId } = body
  if(!base64 || !filename) return res.status(400).json({ error: 'Missing file data' })

  try{
    const buffer = Buffer.from(base64, 'base64')
    // choose bucket by content type
    const bucket = (contentType && contentType.startsWith('image/')) ? 'photos' : 'pdfs'
    const storagePath = `${entityType}/${entityId}/${fileId || filename}`

    const { data: uploadData, error: uploadErr } = await supabaseAdmin.storage.from(bucket).upload(storagePath, buffer, { contentType, upsert: false })
    if(uploadErr) {
      return res.status(500).json({ error: 'Upload failed', details: uploadErr.message })
    }

    // get public URL (signed) or use storage API to generate public url
    const { data: urlData, error: urlErr } = await supabaseAdmin.storage.from(bucket).createSignedUrl(uploadData.path, 60*60)
    const publicUrl = urlData?.signedURL || null

    // insert metadata into files table
    const fileRecord = {
      id: fileId || undefined,
      entity_type: entityType,
      entity_id: entityId,
      storage_key: uploadData.path,
      url: publicUrl,
      mime: contentType,
      size: buffer.length,
      uploaded_by: actorId
    }

    const { data: fdata, error: ferr } = await supabaseAdmin.from('files').insert(fileRecord).select().maybeSingle()
    if(ferr) {
      console.warn('Failed to insert file metadata', ferr.message)
    }

    // write audit
    try{
      if(auditSupabaseAdmin){
        const auditRecord = {
          entity_table: 'files',
          entity_id: fdata?.id || fileId || null,
          action: 'CREATE',
          actor_id: actorId,
          before: null,
          after: fdata || fileRecord
        }
        const { error: aerr } = await auditSupabaseAdmin.from('audit_logs').insert(auditRecord)
        if(aerr) console.warn('Audit insert failed', aerr.message)
      }
    }catch(ae){
      console.warn('audit error', ae)
    }

    return res.status(200).json({ ok: true, path: uploadData.path, url: publicUrl, file: fdata })
  }catch(err:any){
    console.error('upload api error', err)
    return res.status(500).json({ error: 'Internal server error', details: String(err) })
  }
}
