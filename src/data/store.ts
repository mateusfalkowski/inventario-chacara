import type { Item, Movimento } from '../types'

export interface Store {
  /** 'local' = modo demonstração, salva só neste aparelho */
  modo: 'local' | 'firebase'
  /** Chama `cb` com a lista inteira sempre que algo mudar (inclusive mudanças offline). */
  observar(cb: (itens: Item[]) => void): () => void
  /** Não espera o servidor: offline, a gravação fica na fila e sobe quando voltar o sinal. */
  adicionar(item: Item, foto: string | null): void
  atualizar(id: string, dados: Partial<Item>): void
  /** Subtrai a quantidade e registra o movimento de forma atômica — duas pessoas
   *  dando saída no mesmo item ao mesmo tempo (mesmo offline) não se sobrescrevem. */
  darSaida(id: string, mov: Movimento): void
  foto(id: string): Promise<string | null>
}

const temFirebase = Boolean(import.meta.env.VITE_FIREBASE_PROJECT_ID)

export async function criarStore(): Promise<Store> {
  if (temFirebase) {
    const { criarStoreFirebase } = await import('./firebase')
    return criarStoreFirebase()
  }
  const { criarStoreLocal } = await import('./local')
  return criarStoreLocal()
}
