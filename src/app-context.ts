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

// No modo treino as mesmas telas rodam sob #/treino/..., com dados de mentira.
// As telas continuam chamando ir('/item/X'); o prefixo mantém a navegação
// dentro do treino. O App define o prefixo a cada render conforme a rota.
let prefixo = ''
export const definirPrefixo = (p: string) => {
  prefixo = p
}

export const ir = (caminho: string) => {
  location.hash = prefixo + caminho
}

/** Como `ir`, mas troca a entrada atual do histórico (o "Voltar" não reabre um formulário já enviado). */
export const irSubstituindo = (caminho: string) => {
  location.replace(`#${prefixo}${caminho}`)
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
