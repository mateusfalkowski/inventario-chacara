// Modo demonstração: guarda tudo no IndexedDB do navegador. Serve para testar e
// apresentar o protótipo antes de configurar o Firebase.
import type { Item } from '../types'
import { variacao, type Store } from './store'

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
  // Sem servidor não há como conferir a senha: qualquer uma entra. Serve só
  // para mostrar o fluxo; os dados ficam neste aparelho de qualquer jeito.
  const ouvintesLogin = new Set<(logado: boolean) => void>()
  let logado = false
  try {
    logado = localStorage.getItem('demo-logado') === '1'
  } catch {
    /* aba anônima: pede a senha de novo */
  }
  const mudarLogin = (valor: boolean) => {
    logado = valor
    try {
      localStorage.setItem('demo-logado', valor ? '1' : '0')
    } catch {
      /* vale só até fechar a aba */
    }
    ouvintesLogin.forEach((cb) => cb(valor))
  }
  const loja = (nome: 'itens' | 'fotos', modo: IDBTransactionMode = 'readonly') =>
    db.transaction(nome, modo).objectStore(nome)

  async function avisar() {
    const itens = await pedido(loja('itens').getAll() as IDBRequest<Item[]>)
    ouvintes.forEach((cb) => cb(itens))
  }

  /** Lê, altera e grava um item na mesma transação. */
  function mexer(id: string, mudar: (item: Item) => Item) {
    const tx = db.transaction('itens', 'readwrite')
    const itens = tx.objectStore('itens')
    const req = itens.get(id)
    req.onsuccess = () => {
      const item = req.result as Item | undefined
      if (item) itens.put(mudar(item))
    }
    tx.oncomplete = () => void avisar()
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
    movimentar(id, mov) {
      mexer(id, (item) => ({
        ...item,
        quantidade: item.quantidade + variacao(mov),
        movimentos: [...item.movimentos, mov],
        atualizadoEm: mov.em,
      }))
    },
    desfazerSaida(id, mov) {
      const igual = JSON.stringify(mov)
      mexer(id, (item) => ({
        ...item,
        quantidade: item.quantidade + mov.quantidade,
        movimentos: item.movimentos.filter((m) => JSON.stringify(m) !== igual),
        atualizadoEm: Date.now(),
      }))
    },
    async foto(id) {
      return ((await pedido(loja('fotos').get(id))) as string | undefined) ?? null
    },
    observarLogin(cb) {
      ouvintesLogin.add(cb)
      cb(logado)
      return () => void ouvintesLogin.delete(cb)
    },
    async entrar() {
      mudarLogin(true)
    },
    async sair() {
      mudarLogin(false)
    },
  }
}
