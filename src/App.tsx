import { useEffect, useState } from 'react'
import { Ctx, ir, lembrado, lembrar, useRota } from './app-context'
import { criarStore, type Store } from './data/store'
import Estoque from './screens/Estoque'
import Etiqueta from './screens/Etiqueta'
import Inicio from './screens/Inicio'
import ItemDetalhe from './screens/ItemDetalhe'
import NovoItem from './screens/NovoItem'
import Painel from './screens/Painel'
import Saida from './screens/Saida'
import type { Item } from './types'

export default function App() {
  const [store, setStore] = useState<Store | null>(null)
  const [itens, setItens] = useState<Item[] | null>(null)
  const [erro, setErro] = useState('')
  const [operador, setOperador] = useState(() => lembrado('operador'))
  const [online, setOnline] = useState(navigator.onLine)
  const rota = useRota()

  useEffect(() => {
    criarStore().then(setStore, (e) => setErro(String(e)))
  }, [])

  useEffect(() => store?.observar(setItens), [store])

  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  if (erro) return <Mensagem>Não foi possível abrir o banco de dados: {erro}</Mensagem>
  if (!operador) return <PerguntaNome onPronto={(n) => (lembrar('operador', n), setOperador(n))} />
  if (!store || !itens) return <Mensagem>Carregando…</Mensagem>

  const [tela, id] = rota.partes
  const naInicio = !tela

  return (
    <Ctx.Provider value={{ store, itens, operador }}>
      <header className="topo">
        {naInicio ? (
          <span className="marca">Inventário Chácara</span>
        ) : (
          <button className="voltar" onClick={() => (history.length > 1 ? history.back() : ir('/'))} aria-label="Voltar">
            ‹ Voltar
          </button>
        )}
        <span className="topo-status">
          {!online && <span className="selo selo-offline">Sem internet · salvando no aparelho</span>}
          {store.modo === 'local' && <span className="selo">Modo demonstração</span>}
        </span>
      </header>
      <main className="conteudo">
        {tela === 'novo' ? (
          <NovoItem />
        ) : tela === 'estoque' ? (
          <Estoque modoSaida={rota.busca.has('saida')} />
        ) : tela === 'item' && id ? (
          <ItemDetalhe id={id} />
        ) : tela === 'saida' && id ? (
          <Saida id={id} />
        ) : tela === 'etiqueta' && id ? (
          <Etiqueta ids={id.split(',')} />
        ) : tela === 'painel' ? (
          <Painel />
        ) : (
          <Inicio trocarNome={() => setOperador('')} />
        )}
      </main>
    </Ctx.Provider>
  )
}

function Mensagem({ children }: { children: React.ReactNode }) {
  return <div className="mensagem">{children}</div>
}

function PerguntaNome({ onPronto }: { onPronto: (nome: string) => void }) {
  const [nome, setNome] = useState('')
  return (
    <form
      className="pergunta-nome"
      onSubmit={(e) => {
        e.preventDefault()
        if (nome.trim()) {
          onPronto(nome.trim())
          ir('/')
        }
      }}
    >
      <img src="icon.svg" alt="" width={72} height={72} />
      <h1>Olá! Qual é o seu nome?</h1>
      <p>Assim o sistema sabe quem cadastrou cada material.</p>
      <input
        autoFocus
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Seu nome"
        autoComplete="given-name"
      />
      <button className="botao principal" disabled={!nome.trim()}>
        Começar
      </button>
    </form>
  )
}
