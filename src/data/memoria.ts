// Store do modo treino: tudo fica só na memória e some ao sair do treino.
// Nada vai para o Firebase nem para o IndexedDB.
import type { Item } from '../types'
import { variacao, type Store } from './store'

export function criarStoreMemoria(): Store {
  let itens: Item[] = []
  const fotos = new Map<string, string>()
  const ouvintes = new Set<(itens: Item[]) => void>()

  const mudar = (novos: Item[]) => {
    itens = novos
    ouvintes.forEach((cb) => cb(itens))
  }
  const mexer = (id: string, f: (i: Item) => Item) => mudar(itens.map((i) => (i.id === id ? f(i) : i)))

  return {
    modo: 'treino',
    observar(cb) {
      ouvintes.add(cb)
      cb(itens)
      return () => void ouvintes.delete(cb)
    },
    adicionar(item, foto) {
      if (foto) fotos.set(item.id, foto)
      mudar([...itens, item])
    },
    atualizar(id, dados) {
      mexer(id, (i) => ({ ...i, ...dados }))
    },
    movimentar(id, mov) {
      mexer(id, (i) => ({
        ...i,
        quantidade: i.quantidade + variacao(mov),
        movimentos: [...i.movimentos, mov],
        atualizadoEm: mov.em,
      }))
    },
    desfazerSaida(id, mov) {
      mexer(id, (i) => ({
        ...i,
        quantidade: i.quantidade + mov.quantidade,
        movimentos: i.movimentos.filter((m) => m !== mov),
        atualizadoEm: Date.now(),
      }))
    },
    async foto(id) {
      return fotos.get(id) ?? null
    },
    observarLogin(cb) {
      cb(true)
      return () => {}
    },
    async entrar() {},
    async sair() {},
  }
}
