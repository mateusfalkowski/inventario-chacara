import { useEffect, useState } from 'react'
import { ir, useApp } from '../app-context'
import { Contador, SeloEstado, tituloItem } from '../components'
import { categoria, destino } from '../config'
import { dataCurta, diasDesde, qtd } from '../lib/util'
import type { Item, Movimento } from '../types'

export default function ItemDetalhe({ id }: { id: string }) {
  const { itens, store, operador } = useApp()
  const item = itens.find((i) => i.id === id)
  const [foto, setFoto] = useState<string | null>(null)
  const [chegou, setChegou] = useState(0)

  useEffect(() => {
    setFoto(null)
    if (item?.temFoto) store.foto(id).then(setFoto, () => {})
  }, [id, item?.temFoto, store])

  if (!item) {
    return (
      <div className="vazio">
        <p>
          Material <strong className="codigo">{id}</strong> não encontrado.
        </p>
        <p className="fraco">Confira o código ou espere a internet sincronizar.</p>
        <button className="botao" onClick={() => ir('/estoque')}>
          Ver estoque
        </button>
      </div>
    )
  }

  const cat = categoria(item.categoria)
  const esgotado = item.quantidade <= 0
  const parado = diasDesde(item.atualizadoEm)

  return (
    <div className="detalhe">
      {item.temFoto || item.thumb ? (
        <img className="foto-grande" src={foto ?? item.thumb} alt={tituloItem(item)} />
      ) : (
        <div className="foto-grande vazia">{cat.icone}</div>
      )}

      <p className="codigo-grande pequeno">{item.id}</p>
      <h1>{tituloItem(item)}</h1>
      <p className="linha-info">
        <SeloEstado id={item.estado} /> <span>{cat.icone} {cat.nome}</span>
      </p>

      <dl className="ficha">
        <dt>No estoque</dt>
        <dd>{esgotado ? 'Saiu tudo' : qtd(item.quantidade, item.unidade)}</dd>
        <dt>Local</dt>
        <dd>{item.local || '—'}</dd>
        <dt>Destino previsto</dt>
        <dd>{destino(item.destinoPrevisto ?? '')?.nome ?? 'Ainda não definido'}</dd>
        <dt>Obra de origem</dt>
        <dd>{item.origem || '—'}</dd>
        <dt>Cadastrado</dt>
        <dd>
          {dataCurta(item.criadoEm)} por {item.criadoPor}
        </dd>
        {!esgotado && parado >= 30 && (
          <>
            <dt>Parado há</dt>
            <dd>{parado} dias</dd>
          </>
        )}
      </dl>

      {!esgotado && (
        <button className="botao principal grande" onClick={() => ir(`/saida/${item.id}`)}>
          📤 Dar saída
        </button>
      )}
      <div className="botoes-lado">
        <button className="botao" onClick={() => setChegou(chegou ? 0 : 1)}>
          ➕ Chegou mais
        </button>
        <button className="botao" onClick={() => ir(`/editar/${item.id}`)}>
          ✏️ Corrigir dados
        </button>
        <button className="botao" onClick={() => ir(`/etiqueta/${item.id}`)}>
          🏷️ Etiqueta
        </button>
      </div>

      {chegou > 0 && (
        <div className="edicao">
          <label className="campo-titulo">Quanto chegou? ({item.unidade})</label>
          <Contador valor={chegou} onChange={setChegou} min={1} />
          <button
            className="botao principal"
            onClick={() => {
              store.movimentar(item.id, { tipo: 'entrada', quantidade: chegou, em: Date.now(), por: operador })
              setChegou(0)
            }}
          >
            ✓ Somar ao estoque
          </button>
        </div>
      )}

      <h2>Histórico</h2>
      <ul className="historico">
        {[...item.movimentos].reverse().map((m, i) => (
          <li key={i} className={m.tipo}>
            <strong>{textoMovimento(m, item)}</strong>
            <span className="fraco">
              {dataCurta(m.em)} · {m.por}
              {m.obs ? ` · ${m.obs}` : ''}
            </span>
            {m.tipo === 'saida' && (
              <button
                className="link"
                onClick={() =>
                  confirm(`Desfazer esta saída? ${qtd(m.quantidade, item.unidade)} voltam para o estoque.`) &&
                  store.desfazerSaida(item.id, m)
                }
              >
                Desfazer (lançada por engano)
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

function textoMovimento(m: Movimento, item: Item) {
  if (m.tipo === 'entrada') return `Entrada: ${qtd(m.quantidade, item.unidade)}`
  if (m.tipo === 'ajuste') return `Correção: ${m.quantidade > 0 ? '+' : '−'}${qtd(Math.abs(m.quantidade), item.unidade)}`
  return `Saída: ${qtd(m.quantidade, item.unidade)} · ${destino(m.destino ?? '')?.nome ?? m.destino}`
}
