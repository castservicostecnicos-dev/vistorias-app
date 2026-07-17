import React from 'react'
import { getUser } from '../lib/auth'

export default function RoleGate({ roles, children }:{ roles: string[] , children:any}){
  // simplistic client-side role check; server-side RLS/policies required for security
  const [user, setUser] = React.useState<any>(null)

  React.useEffect(()=>{
    async function f(){
      const u = await getUser()
      setUser(u)
    }
    f()
  },[])

  if(!user) return null
  if(roles.includes(user?.role)) return children
  return <div>Access denied</div>
}
