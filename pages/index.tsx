import Head from 'next/head'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useEffect, useState } from 'react'
import { db, addSampleVistoria, getOutboxCount, processOutbox } from '../lib/db'

export default function Home() {
  const [offlineMode, setOfflineMode] = useState(true)
  const [outboxCount, setOutboxCount] = useState(0)

  useEffect(() => {
    // init db or other startup tasks
    async function init() {
      const count = await getOutboxCount()
      setOutboxCount(count)
    }
    init()
  }, [])

  async function handleCreate() {
    await addSampleVistoria()
    const count = await getOutboxCount()
    setOutboxCount(count)
    alert('Vistoria criada localmente e enfileirada para sync')
  }

  async function handleSync() {
    const res = await processOutbox()
    const count = await getOutboxCount()
    setOutboxCount(count)
    alert('Sincronização finalizada. Resultado: ' + JSON.stringify(res))
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>Vistorias App</title>
      </Head>
      <Header />
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-4">Painel inicial</h1>
        <div className="mb-4">
          <label className="mr-2">Modo offline:</label>
          <input type="checkbox" checked={offlineMode} onChange={(e)=>setOfflineMode(e.target.checked)} />
        </div>
        <div className="mb-4">
          <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 text-white rounded mr-2">Criar vistoria local</button>
          <button onClick={handleSync} className="px-4 py-2 bg-green-600 text-white rounded">Sincronizar agora ({outboxCount})</button>
        </div>
        <p>Use o modo offline para trabalhar sem dados; ao terminar, ative a internet e pressione "Sincronizar agora".</p>
      </main>
      <Footer />
    </div>
  )
}
