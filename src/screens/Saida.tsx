import { useState } from 'react'
import { concluirEIr, ir, useApp } from '../app-context'
import { Contador, Miniatura, SeloEstado, tituloItem } from '../components'
import { DESTINOS } from '../config'
import { qtd } from '../lib/util'
import type { Item } from '../types'

export default function Saida({ id }: { id: string }) {
  const { itens } = useApp()
  const item = itens.find((i) => i.id === id)

  if (!item) {
    return (
      <div className="vazio">
        <p>
          Material <strong className="codigo">{id}</strong> não encontrado.
        </p>
      </div>
    )
  }
  if (item.quantidade <= 0) {
    return (
      <div className="vazio">
        <p>Este material já saiu todo do estoque.</p>
        <button className="botao" onClick={() => ir(`/item/${item.id}`)}>
          Ver histórico
        </button>
      </div>
    )
  }

  // O formulário só monta com o item já carregado: assim o destino e a quantidade
  // começam certos mesmo quando a tela abre (por um link) antes de os dados chegarem.
  return <Formulario key={item.id} item={item} />
}

function Formulario({ item }: { item: Item }) {
  const { store, operador, itens } = useApp()
  // Conjunto: peças ainda no estoque. Por padrão saem junto com o item principal.
  const pecas = itens.filter((i) => i.pai === item.id && i.quantidade > 0)
  const [comPecas, setComPecas] = useState(true)
  // Já vem marcado o destino decidido na chegada; dá para trocar.
  const [dest, setDest] = useState(item.destinoPrevisto ?? '')
  const [quantidade, setQuantidade] = useState(item.quantidade)
  const [obs, setObs] = useState('')

  const valido = dest && quantidade > 0 && quantidade <= item.quantidade

  function confirmar() {
    if (!valido) return
    const em = Date.now()
    store.movimentar(item.id, {
      tipo: 'saida',
      quantidade,
      destino: dest,
      // Firestore recusa campos `undefined`: só inclui obs se houver.
      ...(obs.trim() ? { obs: obs.trim() } : {}),
      em,
      por: operador,
    })
    // Cada peça sai inteira, com o mesmo destino e uma observação ligando ao conjunto.
    if (comPecas) {
      for (const p of pecas) {
        store.movimentar(p.id, {
          tipo: 'saida',
          quantidade: p.quantidade,
          destino: dest,
          obs: `Saiu junto com o conjunto ${item.id}${obs.trim() ? ` · ${obs.trim()}` : ''}`,
          em,
          por: operador,
        })
      }
    }
    // Volta para a ficha sem deixar o formulário de saída no histórico.
    concluirEIr(`/item/${item.id}`)
  }

  return (
    <div className="saida">
      <div className="saida-item">
        <Miniatura item={item} tamanho={72} />
        <div>
          <strong>{tituloItem(item)}</strong>
          <p className="cartao-linha">
            <SeloEstado id={item.estado} /> <span className="codigo">{item.id}</span>
          </p>
          <p className="fraco">No estoque: {qtd(item.quantidade, item.unidade)}</p>
        </div>
      </div>

      <h1>Para onde vai?</h1>
      <div className="grade-opcoes" data-tour="destinos">
        {DESTINOS.map((d) => (
          <button key={d.id} className={`opcao${dest === d.id ? ' ativo' : ''}`} onClick={() => setDest(d.id)}>
            <span className="opcao-icone">{d.icone}</span>
            {d.nome}
          </button>
        ))}
      </div>

      <label className="campo-titulo">Quanto está saindo? ({item.unidade})</label>
      <Contador valor={quantidade} onChange={setQuantidade} max={item.quantidade} />
      {quantidade < item.quantidade && (
        <p className="fraco">Ficam {qtd(item.quantidade - quantidade, item.unidade)} no estoque.</p>
      )}

      {pecas.length > 0 && (
        <label className="alternar caixa-pecas">
          <input type="checkbox" checked={comPecas} onChange={(e) => setComPecas(e.target.checked)} />
          <span>
            🧩 Dar saída também nas <strong>{pecas.length === 1 ? '1 peça' : `${pecas.length} peças`}</strong> deste conjunto
            <small className="fraco">{pecas.map((p) => tituloItem(p)).join(', ')}</small>
          </span>
        </label>
      )}

      <label className="campo-titulo" htmlFor="obs">
        Observação <span className="fraco">(opcional)</span>
      </label>
      <input
        id="obs"
        value={obs}
        onChange={(e) => setObs(e.target.value)}
        placeholder="Ex.: vendido por R$ 150 para João"
        maxLength={120}
      />

      <div className="acao-fixa">
        <button className="botao principal grande" data-tour="confirmar" disabled={!valido} onClick={confirmar}>
          ✓ Confirmar saída
        </button>
      </div>
    </div>
  )
}
