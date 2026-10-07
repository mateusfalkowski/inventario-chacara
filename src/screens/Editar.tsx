// Corrigir um cadastro feito errado. Quantidade não é sobrescrita: vira um
// movimento de "correção" no histórico, para dar para conferir depois.
import { useState } from 'react'
import { useApp } from '../app-context'
import { Chips, Contador } from '../components'
import { CATEGORIAS, DESTINOS, ESTADOS, LOCAIS, UNIDADES } from '../config'
import type { EstadoId, Item } from '../types'

export default function Editar({ id }: { id: string }) {
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
  return <Formulario item={item} />
}

function Formulario({ item }: { item: Item }) {
  const { store, operador } = useApp()
  const [cat, setCat] = useState(item.categoria)
  const [est, setEst] = useState<EstadoId>(item.estado)
  const [descricao, setDescricao] = useState(item.descricao)
  const [quantidade, setQuantidade] = useState(item.quantidade)
  const [unidade, setUnidade] = useState(item.unidade)
  const [local, setLocal] = useState(item.local)
  const [origem, setOrigem] = useState(item.origem)
  const [dest, setDest] = useState(item.destinoPrevisto ?? '')

  const nomeCat = CATEGORIAS.find((c) => c.id === cat)
  const diferenca = quantidade - item.quantidade

  function salvar() {
    const agora = Date.now()
    const dados: Partial<Item> = {}
    if (cat !== item.categoria) dados.categoria = cat
    if (est !== item.estado) dados.estado = est
    if (descricao.trim() !== item.descricao) dados.descricao = descricao.trim()
    if (unidade !== item.unidade) dados.unidade = unidade
    if (local !== item.local) dados.local = local
    if (origem.trim() !== item.origem) dados.origem = origem.trim()
    if (dest !== (item.destinoPrevisto ?? '')) dados.destinoPrevisto = dest
    if (Object.keys(dados).length) store.atualizar(item.id, { ...dados, atualizadoEm: agora })
    if (diferenca !== 0) {
      store.movimentar(item.id, { tipo: 'ajuste', quantidade: diferenca, em: agora, por: operador })
    }
    // replace: o "Voltar" do item não reabre o formulário.
    location.replace(`#/item/${item.id}`)
  }

  return (
    <div className="editar">
      <h1>
        Corrigir <span className="codigo">{item.id}</span>
      </h1>

      <label className="campo-titulo">O que é?</label>
      <Chips
        opcoes={CATEGORIAS.map((c) => `${c.icone} ${c.nome}`)}
        valor={nomeCat ? `${nomeCat.icone} ${nomeCat.nome}` : ''}
        onChange={(v) => setCat(CATEGORIAS.find((c) => `${c.icone} ${c.nome}` === v)?.id ?? cat)}
      />

      <label className="campo-titulo">Estado</label>
      <Chips
        opcoes={ESTADOS.map((e) => e.nome)}
        valor={ESTADOS.find((e) => e.id === est)?.nome ?? ''}
        onChange={(nome) => setEst(ESTADOS.find((e) => e.nome === nome)?.id ?? est)}
      />

      <label className="campo-titulo">Para onde deve ir?</label>
      <Chips
        opcoes={['Ainda não sei', ...DESTINOS.map((d) => `${d.icone} ${d.nome}`)]}
        valor={DESTINOS.filter((d) => d.id === dest).map((d) => `${d.icone} ${d.nome}`)[0] ?? 'Ainda não sei'}
        onChange={(v) => setDest(DESTINOS.find((d) => `${d.icone} ${d.nome}` === v)?.id ?? '')}
      />

      <label className="campo-titulo">Quantidade no estoque agora</label>
      <Contador valor={quantidade} onChange={setQuantidade} />
      <Chips opcoes={UNIDADES} valor={unidade} onChange={setUnidade} />
      {diferenca !== 0 && (
        <p className="fraco">
          Vai ficar registrado no histórico como correção ({diferenca > 0 ? '+' : ''}
          {diferenca.toLocaleString('pt-BR')}).
        </p>
      )}

      <label className="campo-titulo">Local</label>
      <Chips opcoes={LOCAIS} valor={local} onChange={setLocal} />

      <label className="campo-titulo" htmlFor="descricao">
        Descrição
      </label>
      <input
        id="descricao"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        placeholder="Ex.: porta de madeira maciça 80 cm"
        maxLength={120}
      />

      <label className="campo-titulo" htmlFor="origem">
        Obra de origem
      </label>
      <input
        id="origem"
        value={origem}
        onChange={(e) => setOrigem(e.target.value)}
        placeholder="Nome ou endereço da obra"
        maxLength={80}
      />

      <button className="botao principal grande" onClick={salvar}>
        ✓ Salvar correção
      </button>
    </div>
  )
}
