// Visão do gestor: o que tem, o que está parado e para onde as coisas foram.
// "Parados" responde ao pedido do parceiro de não deixar material encalhar.
import { ir, useApp } from '../app-context'
import { CartaoItem } from '../components'
import { CATEGORIAS, DESTINOS, DIAS_PARADO, ESTADOS } from '../config'
import { baixarArquivo, itensParaCsv } from '../lib/csv'
import { diasDesde } from '../lib/util'

export default function Painel() {
  const { itens } = useApp()
  const emEstoque = itens.filter((i) => i.quantidade > 0)
  const semana = Date.now() - 7 * 86_400_000
  const novosSemana = itens.filter((i) => i.criadoEm >= semana).length
  const saidas = itens.flatMap((i) => i.movimentos.filter((m) => m.tipo === 'saida'))
  const saidasSemana = saidas.filter((m) => m.em >= semana).length
  const parados = emEstoque
    .filter((i) => diasDesde(i.atualizadoEm) >= DIAS_PARADO)
    .sort((a, b) => a.atualizadoEm - b.atualizadoEm)
  const semFoto = emEstoque.filter((i) => !i.temFoto).length

  const porCategoria = CATEGORIAS.map((c) => ({
    nome: `${c.icone} ${c.nome}`,
    n: emEstoque.filter((i) => i.categoria === c.id).length,
  })).filter((x) => x.n > 0)
  const porEstado = ESTADOS.map((e) => ({ ...e, n: emEstoque.filter((i) => i.estado === e.id).length }))
  const porDestino = DESTINOS.map((d) => ({
    nome: `${d.icone} ${d.nome}`,
    n: saidas.filter((m) => m.destino === d.id).length,
  })).filter((x) => x.n > 0)

  const data = new Date().toISOString().slice(0, 10)

  return (
    <div className="painel">
      <h1>Painel</h1>

      <div className="numeros">
        <div>
          <strong>{emEstoque.length}</strong>
          <span>itens no estoque</span>
        </div>
        <div>
          <strong>{novosSemana}</strong>
          <span>cadastrados em 7 dias</span>
        </div>
        <div>
          <strong>{saidasSemana}</strong>
          <span>saídas em 7 dias</span>
        </div>
      </div>

      <h2>Por estado</h2>
      <Barras dados={porEstado.map((e) => ({ nome: e.nome, n: e.n, cor: e.cor }))} />

      <h2>Por categoria</h2>
      {porCategoria.length ? <Barras dados={porCategoria} /> : <p className="fraco">Nada no estoque.</p>}

      {porDestino.length > 0 && (
        <>
          <h2>Para onde foram as saídas</h2>
          <Barras dados={porDestino} />
        </>
      )}

      <h2>
        Parados há mais de {DIAS_PARADO} dias <span className="fraco">({parados.length})</span>
      </h2>
      {parados.length ? (
        <div className="lista">
          {parados.slice(0, 10).map((i) => (
            <CartaoItem key={i.id} item={i} onClick={() => ir(`/item/${i.id}`)} />
          ))}
        </div>
      ) : (
        <p className="fraco">Nenhum material encalhado. 👍</p>
      )}
      {semFoto > 0 && <p className="aviso">{semFoto} itens no estoque estão sem foto — isso dificulta a venda.</p>}

      <h2>Exportar</h2>
      <div className="botoes-coluna">
        <button className="botao" onClick={() => baixarArquivo(`estoque-${data}.csv`, itensParaCsv(emEstoque))}>
          📄 Planilha do estoque (Excel)
        </button>
        <button className="botao" onClick={() => baixarArquivo(`historico-completo-${data}.csv`, itensParaCsv(itens))}>
          📄 Planilha completa (com o que já saiu)
        </button>
        <button
          className="botao"
          onClick={() => emEstoque.length && ir(`/etiqueta/${emEstoque.map((i) => i.id).join(',')}`)}
        >
          🏷️ Imprimir todas as etiquetas
        </button>
      </div>
    </div>
  )
}

function Barras({ dados }: { dados: { nome: string; n: number; cor?: string }[] }) {
  const max = Math.max(1, ...dados.map((d) => d.n))
  return (
    <ul className="barras">
      {dados.map((d) => (
        <li key={d.nome}>
          <span className="barras-nome">{d.nome}</span>
          <span className="barras-trilho">
            <span style={{ width: `${(d.n / max) * 100}%`, background: d.cor }} />
          </span>
          <span className="barras-n">{d.n}</span>
        </li>
      ))}
    </ul>
  )
}
