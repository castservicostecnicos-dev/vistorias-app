import React, { useState } from 'react'
import { useRouter } from 'next/router'
import { signIn } from '../lib/auth'

export default function Login(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  async function handleSubmit(e:any){
    e.preventDefault()
    const { data, error } = await signIn(email, password)
    if(error){
      alert('Erro ao entrar: ' + error.message)
      return
    }
    alert('Login ok')
    router.push('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-6 bg-white rounded shadow">
        <h2 className="text-xl font-bold mb-4">Entrar</h2>
        <form onSubmit={handleSubmit}>
          <label className="block mb-2">Email</label>
          <input className="w-full mb-3 p-2 border" value={email} onChange={e=>setEmail(e.target.value)} />
          <label className="block mb-2">Senha</label>
          <input type="password" className="w-full mb-3 p-2 border" value={password} onChange={e=>setPassword(e.target.value)} />
          <button className="px-4 py-2 bg-blue-600 text-white rounded" type="submit">Entrar</button>
        </form>
      </div>
    </div>
  )
}
