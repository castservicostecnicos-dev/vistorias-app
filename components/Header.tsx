import React from 'react'

export default function Header(){
  return (
    <header className="flex items-center justify-between p-4 bg-gray-800 text-white">
      <div className="text-lg font-bold">Vistorias App</div>
      <div>
        <img src="/logo.svg" alt="logo" style={{height:32}} />
      </div>
    </header>
  )
}
