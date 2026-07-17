import Dexie from 'dexie'
import { v4 as uuidv4 } from 'uuid'

export interface OutboxEntry {
  id: string
  table: string
  method: 'CREATE' | 'UPDATE'
  payload: any
  createdAt: number
  processed?: boolean
}

const db = new Dexie('VistoriasDB')

db.version(1).stores({
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
  outbox: 'id, table, createdAt, processed'
})

export { db }

export async function addSampleVistoria(){
  const id = uuidv4()
  const now = Date.now()
  await db.table('vistorias').add({ id, modelVersionId: null, condominioId: null, createdBy: 'local-user', scheduledAt: now, status: 'created', resultado: null, createdAt: now, isActive: true })
  await db.table('outbox').add({ id: uuidv4(), table: 'vistorias', method: 'CREATE', payload: { id, scheduledAt: now, createdBy: 'local-user' }, createdAt: now, processed: false })
}

export async function getOutboxCount(){
  return await db.table('outbox').where('processed').equals(false).count()
}

export async function processOutbox(){
  const items: OutboxEntry[] = await db.table('outbox').where('processed').equals(false).toArray()
  const results: any[] = []
  for(const it of items){
    try{
      // POST to /api/sync to forward to server (stubbed now)
      const res = await fetch('/api/sync', { method: 'POST', headers: { 'content-type':'application/json' }, body: JSON.stringify(it) })
      const json = await res.json()
      results.push({ id: it.id, ok:true, response: json })
      await db.table('outbox').update(it.id, { processed: true })
    }catch(err){
      results.push({ id: it.id, ok:false, error: String(err) })
    }
  }
  return results
}
