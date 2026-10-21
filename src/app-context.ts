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
  substituindo = true
  location.replace(`#${prefixo}${caminho}`)
}

// ---- Voltar. Cada tela aberta dentro do app nesta aba ganha um número, guardado
// no próprio histórico (history.state.tela). A primeira tela é a 0: quando ela foi
// aberta direto (pelo QR da etiqueta, por um link), não há tela do app para onde
// voltar, e o history.back() sairia do app ou não faria nada. Aí o Voltar vai ao início.
let telaAtual = -1
let substituindo = false
/** Endereço de cada tela pelo número (só desta sessão; some ao recarregar). */
const enderecos: string[] = []

function numerarTela() {
  const estado = history.state as { tela?: number } | null
  if (typeof estado?.tela === 'number') {
    // Entrada que já existia (voltou/avançou, ou recarregou a página).
    telaAtual = estado.tela
  } else {
    // Entrada nova: uma a mais que a anterior, ou a mesma se só trocou a atual.
    telaAtual = substituindo ? Math.max(telaAtual, 0) : telaAtual + 1
    history.replaceState({ ...(estado ?? {}), tela: telaAtual }, '')
  }
  enderecos[telaAtual] = location.hash
  substituindo = false
}

// Registrado ao carregar o módulo, antes do ouvinte de rota do React.
numerarTela()
window.addEventListener('hashchange', numerarTela)

export function voltar() {
  if (telaAtual > 0) history.back()
  else irSubstituindo('/')
}

/** Depois de enviar um formulário (saída, correção), mostra `caminho`. Se a tela
 *  anterior já é ela (ficha → "Dar saída" → confirmar), volta para ela em vez de
 *  abrir outra cópia: senão o Voltar da ficha levaria à mesma ficha de novo. */
export function concluirEIr(caminho: string) {
  if (telaAtual > 0 && enderecos[telaAtual - 1] === `#${prefixo}${caminho}`) history.back()
  else irSubstituindo(caminho)
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
