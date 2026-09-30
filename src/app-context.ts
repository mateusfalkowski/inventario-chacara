import { createContext, useContext, useEffect, useState } from 'react'
import type { Store } from './data/store'
import type { Item } from './types'

export interface AppCtx {
  store: Store
  itens: Item[]
  operador: string
}

export const Ctx = createContext<AppCtx | null>(null)

export function useApp() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useApp fora do Provider')
  return c
}

// ---- Rotas por hash (#/item/K7F2Q): funciona em qualquer hospedagem estática
// e o QR da etiqueta abre direto a página do item na câmera do celular.

function lerRota() {
  const [caminho, busca = ''] = location.hash.replace(/^#/, '').split('?')
  return { partes: caminho.split('/').filter(Boolean), busca: new URLSearchParams(busca) }
}

export function useRota() {
  const [rota, setRota] = useState(lerRota)
  useEffect(() => {
    const mudou = () => {
      setRota(lerRota())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', mudou)
    return () => window.removeEventListener('hashchange', mudou)
  }, [])
  return rota
}

export const ir = (caminho: string) => {
  location.hash = caminho
}

// ---- Preferências deste aparelho (nome de quem usa, último local/obra).
// localStorage pode falhar em aba anônima; nesse caso só não lembra.

export function lembrar(chave: string, valor: string) {
  try {
    localStorage.setItem(chave, valor)
  } catch {
    /* sem armazenamento: segue sem lembrar */
  }
}

export function lembrado(chave: string) {
  try {
    return localStorage.getItem(chave) ?? ''
  } catch {
    return ''
  }
}
