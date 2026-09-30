import { useEffect, useState } from 'react'
import { ir, useApp } from '../app-context'
import { Chips, SeloEstado, tituloItem } from '../components'
import { ESTADOS, LOCAIS, categoria, destino } from '../config'
import { dataCurta, diasDesde, qtd } from '../lib/util'
import type { EstadoId } from '../types'

export default function ItemDetalhe({ id }: { id: string }) {
  const { itens, store } = useApp()
  const item = itens.find((i) => i.id === id)
  const [foto, setFoto] = useState<string | null>(null)
  const [editando, setEditando] = useState(false)

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
        <button className="botao" onClick={() => ir(`/etiqueta/${item.id}`)}>
          🏷️ Etiqueta
        </button>
        <button className="botao" onClick={() => setEditando(!editando)}>
          ✏️ {editando ? 'Fechar' : 'Mudar local/estado'}
        </button>
      </div>

      {editando && (
        <div className="edicao">
          <label className="campo-titulo">Local</label>
          <Chips
            opcoes={LOCAIS}
            valor={item.local}
            onChange={(local) => store.atualizar(item.id, { local, atualizadoEm: Date.now() })}
          />
          <label className="campo-titulo">Estado</label>
          <Chips
            opcoes={ESTADOS.map((e) => e.nome)}
            valor={ESTADOS.find((e) => e.id === item.estado)?.nome ?? ''}
            onChange={(nome) => {
              const e = ESTADOS.find((x) => x.nome === nome)
              if (e) store.atualizar(item.id, { estado: e.id as EstadoId, atualizadoEm: Date.now() })
            }}
          />
        </div>
      )}

      <h2>Histórico</h2>
      <ul className="historico">
        {[...item.movimentos].reverse().map((m, i) => (
          <li key={i} className={m.tipo}>
            <strong>
              {m.tipo === 'entrada'
                ? `Entrada: ${qtd(m.quantidade, item.unidade)}`
                : `Saída: ${qtd(m.quantidade, item.unidade)} · ${destino(m.destino ?? '')?.nome ?? m.destino}`}
            </strong>
            <span className="fraco">
              {dataCurta(m.em)} · {m.por}
              {m.obs ? ` · ${m.obs}` : ''}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
