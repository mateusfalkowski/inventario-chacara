import { useState } from 'react'
import { ir, useApp } from '../app-context'
import { Contador, Miniatura, SeloEstado, tituloItem } from '../components'
import { DESTINOS } from '../config'
import { qtd } from '../lib/util'

export default function Saida({ id }: { id: string }) {
  const { itens, store, operador } = useApp()
  const item = itens.find((i) => i.id === id)
  // Já vem marcado o destino decidido na chegada; dá para trocar.
  const [dest, setDest] = useState(item?.destinoPrevisto ?? '')
  const [quantidade, setQuantidade] = useState(item?.quantidade ?? 1)
  const [obs, setObs] = useState('')

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

  const valido = dest && quantidade > 0 && quantidade <= item.quantidade

  function confirmar() {
    if (!valido || !item) return
    store.movimentar(item.id, {
      tipo: 'saida',
      quantidade,
      destino: dest,
      // Firestore recusa campos `undefined`: só inclui obs se houver.
      ...(obs.trim() ? { obs: obs.trim() } : {}),
      em: Date.now(),
      por: operador,
    })
    // replace: o "Voltar" do item não reabre o formulário de saída.
    location.replace(`#/item/${item.id}`)
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
      <div className="grade-opcoes">
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

      <button className="botao principal grande" disabled={!valido} onClick={confirmar}>
        ✓ Confirmar saída
      </button>
    </div>
  )
}
