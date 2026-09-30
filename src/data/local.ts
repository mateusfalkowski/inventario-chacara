// Modo demonstração: guarda tudo no IndexedDB do navegador. Serve para testar e
// apresentar o protótipo antes de configurar o Firebase.
import type { Item } from '../types'
import type { Store } from './store'

function abrir(): Promise<IDBDatabase> {
  return new Promise((ok, erro) => {
    const req = indexedDB.open('inventario-chacara', 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore('itens', { keyPath: 'id' })
      req.result.createObjectStore('fotos')
    }
    req.onsuccess = () => ok(req.result)
    req.onerror = () => erro(req.error)
  })
}

function pedido<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((ok, erro) => {
    req.onsuccess = () => ok(req.result)
    req.onerror = () => erro(req.error)
  })
}

export async function criarStoreLocal(): Promise<Store> {
  const db = await abrir()
  const ouvintes = new Set<(itens: Item[]) => void>()
  const loja = (nome: 'itens' | 'fotos', modo: IDBTransactionMode = 'readonly') =>
    db.transaction(nome, modo).objectStore(nome)

  async function avisar() {
    const itens = await pedido(loja('itens').getAll() as IDBRequest<Item[]>)
    ouvintes.forEach((cb) => cb(itens))
  }

  return {
    modo: 'local',
    observar(cb) {
      ouvintes.add(cb)
      void avisar()
      return () => void ouvintes.delete(cb)
    },
    adicionar(item, foto) {
      const tx = db.transaction(['itens', 'fotos'], 'readwrite')
      tx.objectStore('itens').put(item)
      if (foto) tx.objectStore('fotos').put(foto, item.id)
      tx.oncomplete = () => void avisar()
    },
    atualizar(id, dados) {
      const tx = db.transaction('itens', 'readwrite')
      const itens = tx.objectStore('itens')
      const req = itens.get(id)
      req.onsuccess = () => req.result && itens.put({ ...req.result, ...dados })
      tx.oncomplete = () => void avisar()
    },
    darSaida(id, mov) {
      const tx = db.transaction('itens', 'readwrite')
      const itens = tx.objectStore('itens')
      const req = itens.get(id)
      req.onsuccess = () => {
        const item = req.result as Item | undefined
        if (!item) return
        itens.put({
          ...item,
          quantidade: item.quantidade - mov.quantidade,
          movimentos: [...item.movimentos, mov],
          atualizadoEm: mov.em,
        })
      }
      tx.oncomplete = () => void avisar()
    },
    async foto(id) {
      return ((await pedido(loja('fotos').get(id))) as string | undefined) ?? null
    },
  }
}
