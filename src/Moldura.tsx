import { Ctx, ir } from './app-context'
import type { Store } from './data/store'
import Editar from './screens/Editar'
import Estoque from './screens/Estoque'
import Etiqueta from './screens/Etiqueta'
import Inicio from './screens/Inicio'
import ItemDetalhe from './screens/ItemDetalhe'
import Manual from './screens/Manual'
import NovoItem from './screens/NovoItem'
import Painel from './screens/Painel'
import Saida from './screens/Saida'
import type { Item } from './types'

interface MolduraProps {
  store: Store
  itens: Item[]
  operador: string
  online: boolean
  partes: string[]
  busca: URLSearchParams
  trocarNome: () => void
}

/** Topo + tela da rota. Usada no app de verdade e no treino (com outro store). */
export default function Moldura({ store, itens, operador, online, partes, busca, trocarNome }: MolduraProps) {
  const [tela, id] = partes
  return (
    <Ctx.Provider value={{ store, itens, operador }}>
      <header className="topo">
        {!tela ? (
          <span className="marca">Inventário Chácara</span>
        ) : (
          <button className="voltar" onClick={() => (history.length > 1 ? history.back() : ir('/'))} aria-label="Voltar">
            ‹ Voltar
          </button>
        )}
        <span className="topo-status">
          {store.modo === 'treino' && <span className="selo selo-treino">Treino · nada é salvo</span>}
          {!online && store.modo !== 'treino' && (
            <span className="selo selo-offline">Sem internet · salvando no aparelho</span>
          )}
          {store.modo === 'local' && <span className="selo">Modo demonstração</span>}
        </span>
      </header>
      <main className="conteudo">
        {tela === 'novo' ? (
          <NovoItem />
        ) : tela === 'estoque' ? (
          <Estoque modoSaida={busca.has('saida')} />
        ) : tela === 'item' && id ? (
          <ItemDetalhe id={id} />
        ) : tela === 'editar' && id ? (
          <Editar id={id} />
        ) : tela === 'saida' && id ? (
          <Saida id={id} />
        ) : tela === 'etiqueta' && id ? (
          <Etiqueta ids={id.split(',')} />
        ) : tela === 'manual' ? (
          <Manual />
        ) : tela === 'painel' ? (
          <Painel />
        ) : (
          <Inicio trocarNome={trocarNome} />
        )}
      </main>
    </Ctx.Provider>
  )
}
