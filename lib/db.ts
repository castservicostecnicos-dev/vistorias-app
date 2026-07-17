import Dexie from 'dexie'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from './supabaseClient'

export interface OutboxEntry {
  id: string
  table: string
  method: 'CREATE' | 'UPDATE'
  payload: any
  createdAt: number
  processed?: boolean
}

const db = new Dexie('VistoriasDB')

db.version(2).stores({
  users: 'id, email, role, managerId, isActive',
  condominios: 'id, name',
  clientes: 'id, name, condominioId',
  ambientes: 'id, condominioId, name',
  itensAmbiente: 'id, ambienteId, name',
  routineModels: 'id, condominioId, versionNumber',
  inspectionModels: 'id, condominioId, versionNumber',
  rotinas: 'id, modelVersionId, condominioId, createdBy, createdAt',
  vistorias: 'id, modelVersionId, condominioId, createdBy, createdAt',
  files: 'id, entityType, entityId, storageKey, uploadedAt',
  outbox: 'id, table, createdAt, processed',
  fileBlobs: 'id' // store actual blobs while offline
})

export { db }

export async function addSampleVistoria(){
  const id = uuidv4()
  const now = Date.now()
  await db.table('vistorias').add({ id, modelVersionId: null, condominioId: null, createdBy: 'local-user', scheduledAt: now, status: 'created', resultado: null, createdAt: now, isActive: true })
  await db.table('outbox').add({ id: uuidv4(), table: 'vistorias', method: 'CREATE', payload: { id, scheduledAt: now, createdBy: 'local-user' }, createdAt: now, processed: false })
}

export async function addFileToOutbox(file: File, entityType: string, entityId: string){
  const blobId = uuidv4()
  // store blob in IndexedDB
  await db.table('fileBlobs').put({ id: blobId, blob: file })

  const outboxId = uuidv4()
  const payload = {
    id: uuidv4(), // file record id to be created on server
    entity_type: entityType,
    entity_id: entityId,
    filename: file.name,
    content_type: file.type,
    size: file.size,
    blobId
  }
  await db.table('outbox').add({ id: outboxId, table: 'files', method: 'CREATE', payload, createdAt: Date.now(), processed: false })
  return outboxId
}

export async function getOutboxCount(){
  return await db.table('outbox').where('processed').equals(false).count()
}

async function getAuthToken(){
  try{
    const session = await supabase.auth.getSession()
    const token = session?.data?.session?.access_token
    return token || null
  }catch(err){
    return null
  }
}

export async function processOutbox(){
  const items: OutboxEntry[] = await db.table('outbox').where('processed').equals(false).toArray()
  const results: any[] = []
  const token = await getAuthToken()

  for(const it of items){
    try{
      if(it.table === 'files'){
        const { blobId, filename, content_type } = it.payload
        const blobRecord: any = await db.table('fileBlobs').get(blobId)
        if(!blobRecord || !blobRecord.blob){
          results.push({ id: it.id, ok:false, error: 'Missing blob for file entry' })
          continue
        }
        // read blob as base64
        const blob: Blob = blobRecord.blob
        const arrayBuffer = await blob.arrayBuffer()
        const uint8 = new Uint8Array(arrayBuffer)
        let binary = ''
        for (let i = 0; i < uint8.length; i++) {
          binary += String.fromCharCode(uint8[i])
        }
        const base64 = typeof window !== 'undefined' ? window.btoa(binary) : Buffer.from(uint8).toString('base64')

        // send to /api/upload
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': 'Bearer ' + token } : {})
          },
          body: JSON.stringify({
            fileId: it.payload.id,
            filename,
            contentType: content_type,
            base64,
            entityType: it.payload.entity_type,
            entityId: it.payload.entity_id
          })
        })
        const json = await res.json()
        if(res.ok && json.ok){
          // mark processed and remove blob
          await db.table('outbox').update(it.id, { processed: true })
          await db.table('fileBlobs').delete(blobId)
          results.push({ id: it.id, ok: true, response: json })
        }else{
          results.push({ id: it.id, ok:false, error: json })
        }
      } else {
        const res = await fetch('/api/sync', { method: 'POST', headers: { 'content-type':'application/json', ...(token?{ 'Authorization':'Bearer '+token }:{} ) }, body: JSON.stringify(it) })
        const json = await res.json()
        if(res.ok && json.ok){
          await db.table('outbox').update(it.id, { processed: true })
          results.push({ id: it.id, ok:true, response: json })
        }else{
          results.push({ id: it.id, ok:false, error: json })
        }
      }
    }catch(err){
      results.push({ id: it.id, ok:false, error: String(err) })
    }
  }
  return results
}
