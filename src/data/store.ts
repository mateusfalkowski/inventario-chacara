import type { Item, Movimento } from '../types'

/** Quanto o movimento muda o estoque. */
export const variacao = (m: Movimento) => (m.tipo === 'saida' ? -m.quantidade : m.quantidade)

export interface Store {
  /** 'local' = modo demonstração, salva só neste aparelho */
  modo: 'local' | 'firebase'
  /** Chama `cb` com a lista inteira sempre que algo mudar (inclusive mudanças offline). */
  observar(cb: (itens: Item[]) => void): () => void
  /** Não espera o servidor: offline, a gravação fica na fila e sobe quando voltar o sinal. */
  adicionar(item: Item, foto: string | null): void
  atualizar(id: string, dados: Partial<Item>): void
  /** Soma/subtrai a quantidade e registra o movimento de forma atômica — duas pessoas
   *  mexendo no mesmo item ao mesmo tempo (mesmo offline) não se sobrescrevem. */
  movimentar(id: string, mov: Movimento): void
  /** Apaga uma saída lançada por engano e devolve a quantidade ao estoque. */
  desfazerSaida(id: string, mov: Movimento): void
  foto(id: string): Promise<string | null>
  /** Avisa se este aparelho já entrou com a senha da equipe. */
  observarLogin(cb: (logado: boolean) => void): () => void
  /** Rejeita se a senha estiver errada. */
  entrar(senha: string): Promise<void>
  sair(): Promise<void>
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
