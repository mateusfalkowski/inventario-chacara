// Planilha dentro do próprio app: as mesmas abas do arquivo Excel (resumo,
// estoque, movimentações e o que já saiu). Visão enxuta por padrão (foto, nome e
// código juntos; quantidade com unidade; data com quem cadastrou) e colunas pouco
// usadas escondidas em "Colunas". Filtro e ordem no menu ▾ de cada título.
import { useMemo, useState } from 'react'
import { ir, useApp } from '../app-context'
import { Miniatura, SeloEstado } from '../components'
import { estado } from '../config'
import { baixarPlanilha } from '../lib/planilha'
import { TIPOS, montarRelatorio, type LinhaEstoque, type LinhaMovimento, type LinhaSaido } from '../lib/relatorio'
import { dataCurta, qtd } from '../lib/util'
import type { Item } from '../types'
import TabelaFiltrada, { type Coluna } from '../TabelaFiltrada'

type Aba = 'resumo' | 'estoque' | 'movimentos' | 'saidos'

const hora = (ms: number) => new Date(ms).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

/** Foto + nome em destaque + código embaixo: identifica o material numa célula só. */
const celulaMaterial = (item: Item, nome: string) => (
  <div className="celula-material">
    <Miniatura item={item} tamanho={40} />
    <div>
      <strong>{nome}</strong>
      <small className="codigo">{item.id}</small>
    </div>
  </div>
)

const duasLinhas = (cima: string, baixo: string) => (
  <div className="duas-linhas">
    {cima}
    <small>{baixo}</small>
  </div>
)

const COL_ESTOQUE: Coluna<LinhaEstoque>[] = [
  {
    id: 'material',
    titulo: 'Material',
    largura: 285,
    valor: (l) => l.material,
    mostrar: (l) => celulaMaterial(l.item, l.material),
    busca: (l) => `${l.item.id} ${l.origem}`,
    filtro: 'texto',
  },
  { id: 'categoria', titulo: 'Categoria', largura: 150, valor: (l) => l.categoria, filtro: 'lista' },
  {
    id: 'estado',
    titulo: 'Estado',
    largura: 130,
    valor: (l) => estado(l.estado).nome,
    mostrar: (l) => <SeloEstado id={l.estado} />,
    filtro: 'lista',
  },
  {
    id: 'qtd',
    titulo: 'Quantidade',
    largura: 128,
    valor: (l) => l.quantidade,
    mostrar: (l) => qtd(l.quantidade, l.unidade),
    filtro: 'nenhum',
    classe: 'num',
  },
  { id: 'local', titulo: 'Local', largura: 110, valor: (l) => l.local, filtro: 'lista' },
  { id: 'destino', titulo: 'Destino previsto', largura: 140, valor: (l) => l.destino, filtro: 'lista' },
  { id: 'conjunto', titulo: 'Conjunto', largura: 130, valor: (l) => l.conjunto, filtro: 'texto' },
  {
    id: 'cadastro',
    titulo: 'Cadastro',
    largura: 120,
    valor: (l) => l.criadoEm,
    mostrar: (l) => duasLinhas(dataCurta(l.criadoEm), `por ${l.criadoPor}`),
    filtro: 'nenhum',
  },
  {
    id: 'parado',
    titulo: 'Dias parado',
    largura: 100,
    valor: (l) => l.diasParado,
    mostrar: (l) => <span className={l.parado ? 'parado' : ''}>{l.diasParado}</span>,
    filtro: 'nenhum',
    classe: 'num',
  },
  // Escondidas por padrão (dá para mostrar em "Colunas").
  { id: 'origem', titulo: 'Obra de origem', largura: 150, valor: (l) => l.origem, filtro: 'lista', oculta: true },
  { id: 'por', titulo: 'Cadastrado por', largura: 130, valor: (l) => l.criadoPor, filtro: 'lista', oculta: true },
  { id: 'unidade', titulo: 'Unidade', largura: 100, valor: (l) => l.unidade, filtro: 'lista', oculta: true },
]

const COL_MOVIMENTOS: Coluna<LinhaMovimento>[] = [
  {
    id: 'data',
    titulo: 'Data',
    largura: 110,
    valor: (m) => m.em,
    mostrar: (m) => duasLinhas(dataCurta(m.em), hora(m.em)),
    filtro: 'nenhum',
  },
  {
    id: 'material',
    titulo: 'Material',
    largura: 280,
    valor: (m) => m.material,
    mostrar: (m) => celulaMaterial(m.item, m.material),
    busca: (m) => m.item.id,
    filtro: 'texto',
  },
  {
    id: 'tipo',
    titulo: 'Tipo',
    largura: 110,
    valor: (m) => TIPOS[m.tipo],
    mostrar: (m) => <span className={`pilula tipo-${m.tipo}`}>{TIPOS[m.tipo]}</span>,
    filtro: 'lista',
  },
  {
    id: 'qtd',
    titulo: 'Quantidade',
    largura: 120,
    valor: (m) => m.quantidade,
    mostrar: (m) => `${m.tipo === 'ajuste' && m.quantidade > 0 ? '+' : ''}${qtd(m.quantidade, m.unidade)}`,
    filtro: 'nenhum',
    classe: 'num',
  },
  { id: 'destino', titulo: 'Destino', largura: 140, valor: (m) => m.destino, filtro: 'lista' },
  { id: 'obs', titulo: 'Observação', largura: 260, valor: (m) => m.obs, filtro: 'texto' },
  { id: 'por', titulo: 'Por', largura: 120, valor: (m) => m.por, filtro: 'lista' },
]

const COL_SAIDOS: Coluna<LinhaSaido>[] = [
  {
    id: 'material',
    titulo: 'Material',
    largura: 300,
    valor: (s) => s.material,
    mostrar: (s) => celulaMaterial(s.item, s.material),
    busca: (s) => s.item.id,
    filtro: 'texto',
  },
  { id: 'categoria', titulo: 'Categoria', largura: 150, valor: (s) => s.categoria, filtro: 'lista' },
  {
    id: 'estado',
    titulo: 'Estado',
    largura: 130,
    valor: (s) => estado(s.estado).nome,
    mostrar: (s) => <SeloEstado id={s.estado} />,
    filtro: 'lista',
  },
  {
    id: 'total',
    titulo: 'Total que saiu',
    largura: 130,
    valor: (s) => s.total,
    mostrar: (s) => qtd(s.total, s.unidade),
    filtro: 'nenhum',
    classe: 'num',
  },
  { id: 'destinos', titulo: 'Destinos', largura: 200, valor: (s) => s.destinos, filtro: 'texto' },
  {
    id: 'ultima',
    titulo: 'Última saída',
    largura: 120,
    valor: (s) => s.ultima ?? 0,
    mostrar: (s) => (s.ultima ? dataCurta(s.ultima) : ''),
    filtro: 'nenhum',
  },
]

export default function Planilha() {
  const { itens } = useApp()
  const r = useMemo(() => montarRelatorio(itens), [itens])
  const [aba, setAba] = useState<Aba>('estoque')
  const [baixando, setBaixando] = useState(false)

  async function baixar() {
    setBaixando(true)
    try {
      await baixarPlanilha(itens)
    } catch (e) {
      console.error(e)
      alert('Não foi possível gerar o arquivo. Tente de novo com internet.')
    } finally {
      setBaixando(false)
    }
  }

  const abrir = (l: { item: { id: string } }) => ir(`/item/${l.item.id}`)
  const ABAS: [Aba, string, number | null][] = [
    ['resumo', 'Resumo', null],
    ['estoque', 'Estoque', r.estoque.length],
    ['movimentos', 'Movimentações', r.movimentos.length],
    ['saidos', 'Já saíram', r.saidos.length],
  ]

  return (
    <div className="planilha">
      <div className="planilha-topo">
        <h1>Planilha</h1>
        <button className={`botao${baixando ? ' ocupado' : ''}`} onClick={baixar} disabled={baixando}>
          {baixando ? 'Gerando…' : '⬇️ Baixar Excel'}
        </button>
      </div>

      <div className="abas" role="tablist">
        {ABAS.map(([id, nome, n]) => (
          <button key={id} role="tab" aria-selected={aba === id} className={aba === id ? 'ativo' : ''} onClick={() => setAba(id)}>
            {nome}
            {n !== null && <span className="abas-n">{n}</span>}
          </button>
        ))}
      </div>

      {aba === 'resumo' && (
        <div className="resumo-grade">
          {r.secoes.map((s) => (
            <table key={s.nome} className="grade resumo">
              <thead>
                <tr>
                  <th>{s.nome}</th>
                  <th className="num">{s.rotulo}</th>
                </tr>
              </thead>
              <tbody>
                {s.linhas.map(([k, v]) => (
                  <tr key={k}>
                    <td>{k}</td>
                    <td className="num">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}
        </div>
      )}

      {aba === 'estoque' && (
        <TabelaFiltrada
          id="estoque"
          linhas={r.estoque}
          colunas={COL_ESTOQUE}
          chave={(l) => l.item.id}
          aoTocar={abrir}
          dicaBusca="Buscar por nome, código, local…"
        />
      )}
      {aba === 'movimentos' && (
        <TabelaFiltrada
          id="movimentos"
          linhas={r.movimentos}
          colunas={COL_MOVIMENTOS}
          chave={(m, i) => `${m.item.id}-${m.em}-${i}`}
          aoTocar={abrir}
          dicaBusca="Buscar por material, observação, pessoa…"
        />
      )}
      {aba === 'saidos' && (
        <TabelaFiltrada
          id="saidos"
          linhas={r.saidos}
          colunas={COL_SAIDOS}
          chave={(s) => s.item.id}
          aoTocar={abrir}
          dicaBusca="Buscar por material, código, destino…"
        />
      )}
    </div>
  )
}
