// Minimal sync API (stub)
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  if(req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' })
  const entry = req.body
  // Here you would validate the entry, authenticate the user (via cookies/headers) and
  // apply the operation to your remote DB (Supabase).

  // For scaffold demo we just return success.
  return res.status(200).json({ ok: true, received: entry })
}
