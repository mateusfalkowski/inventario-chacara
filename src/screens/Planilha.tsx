// Planilha dentro do próprio app: as mesmas abas do arquivo Excel (resumo,
// estoque, movimentações e o que já saiu), com filtro e ordenação em cada coluna
// e toque na linha para abrir a ficha. Para levar ao computador, "Baixar Excel".
import { useMemo, useState } from 'react'
import { ir, useApp } from '../app-context'
import { Miniatura, SeloEstado } from '../components'
import { estado } from '../config'
import { baixarPlanilha } from '../lib/planilha'
import { TIPOS, montarRelatorio, type LinhaEstoque, type LinhaMovimento, type LinhaSaido } from '../lib/relatorio'
import { dataCurta, qtd } from '../lib/util'
import TabelaFiltrada, { type Coluna } from '../TabelaFiltrada'

type Aba = 'resumo' | 'estoque' | 'movimentos' | 'saidos'

const dataHora = (ms: number) =>
  new Date(ms).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })

const COL_ESTOQUE: Coluna<LinhaEstoque>[] = [
  { id: 'foto', titulo: 'Foto', valor: () => '', mostrar: (l) => <Miniatura item={l.item} tamanho={38} />, filtro: 'nenhum' },
  { id: 'codigo', titulo: 'Código', valor: (l) => l.item.id, filtro: 'texto', classe: 'codigo' },
  { id: 'material', titulo: 'Material', valor: (l) => l.material, filtro: 'texto', classe: 'forte' },
  { id: 'categoria', titulo: 'Categoria', valor: (l) => l.categoria, filtro: 'lista' },
  { id: 'estado', titulo: 'Estado', valor: (l) => estado(l.estado).nome, mostrar: (l) => <SeloEstado id={l.estado} />, filtro: 'lista' },
  { id: 'qtd', titulo: 'Qtd.', valor: (l) => l.quantidade, mostrar: (l) => qtd(l.quantidade, l.unidade), filtro: 'nenhum', classe: 'num' },
  { id: 'unidade', titulo: 'Unidade', valor: (l) => l.unidade, filtro: 'lista', classe: 'nao-quebra' },
  { id: 'local', titulo: 'Local', valor: (l) => l.local, filtro: 'lista', classe: 'nao-quebra' },
  { id: 'destino', titulo: 'Destino previsto', valor: (l) => l.destino, filtro: 'lista' },
  { id: 'conjunto', titulo: 'Conjunto', valor: (l) => l.conjunto, filtro: 'texto' },
  { id: 'origem', titulo: 'Obra de origem', valor: (l) => l.origem, filtro: 'lista' },
  { id: 'cadastro', titulo: 'Cadastrado em', valor: (l) => l.criadoEm, mostrar: (l) => dataCurta(l.criadoEm), filtro: 'nenhum', classe: 'nao-quebra' },
  { id: 'por', titulo: 'Cadastrado por', valor: (l) => l.criadoPor, filtro: 'lista', classe: 'nao-quebra' },
  {
    id: 'parado',
    titulo: 'Dias parado',
    valor: (l) => l.diasParado,
    mostrar: (l) => <span className={l.parado ? 'parado' : ''}>{l.diasParado}</span>,
    filtro: 'nenhum',
    classe: 'num',
  },
]

const COL_MOVIMENTOS: Coluna<LinhaMovimento>[] = [
  { id: 'data', titulo: 'Data', valor: (m) => m.em, mostrar: (m) => dataHora(m.em), filtro: 'nenhum', classe: 'nao-quebra' },
  { id: 'codigo', titulo: 'Código', valor: (m) => m.item.id, filtro: 'texto', classe: 'codigo' },
  { id: 'material', titulo: 'Material', valor: (m) => m.material, filtro: 'texto', classe: 'forte' },
  {
    id: 'tipo',
    titulo: 'Tipo',
    valor: (m) => TIPOS[m.tipo],
    mostrar: (m) => <span className={`tipo tipo-${m.tipo}`}>{TIPOS[m.tipo]}</span>,
    filtro: 'lista',
  },
  {
    id: 'qtd',
    titulo: 'Qtd.',
    valor: (m) => m.quantidade,
    mostrar: (m) => `${m.tipo === 'ajuste' && m.quantidade > 0 ? '+' : ''}${qtd(m.quantidade, m.unidade)}`,
    filtro: 'nenhum',
    classe: 'num',
  },
  { id: 'destino', titulo: 'Destino', valor: (m) => m.destino, filtro: 'lista' },
  { id: 'obs', titulo: 'Observação', valor: (m) => m.obs, filtro: 'texto' },
  { id: 'por', titulo: 'Por', valor: (m) => m.por, filtro: 'lista' },
]

const COL_SAIDOS: Coluna<LinhaSaido>[] = [
  { id: 'codigo', titulo: 'Código', valor: (s) => s.item.id, filtro: 'texto', classe: 'codigo' },
  { id: 'material', titulo: 'Material', valor: (s) => s.material, filtro: 'texto', classe: 'forte' },
  { id: 'categoria', titulo: 'Categoria', valor: (s) => s.categoria, filtro: 'lista' },
  { id: 'estado', titulo: 'Estado', valor: (s) => estado(s.estado).nome, mostrar: (s) => <SeloEstado id={s.estado} />, filtro: 'lista' },
  { id: 'total', titulo: 'Total que saiu', valor: (s) => s.total, mostrar: (s) => qtd(s.total, s.unidade), filtro: 'nenhum', classe: 'num' },
  { id: 'destinos', titulo: 'Destinos', valor: (s) => s.destinos, filtro: 'texto' },
  {
    id: 'ultima',
    titulo: 'Última saída',
    valor: (s) => s.ultima ?? 0,
    mostrar: (s) => (s.ultima ? dataCurta(s.ultima) : ''),
    filtro: 'nenhum',
    classe: 'nao-quebra',
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
          <p className="fraco">Atualizada agora ({dataHora(r.geradoEm)}).</p>
        </div>
      )}

      {aba === 'estoque' && (
        <TabelaFiltrada id="estoque" linhas={r.estoque} colunas={COL_ESTOQUE} chave={(l) => l.item.id} aoTocar={abrir} />
      )}
      {aba === 'movimentos' && (
        <TabelaFiltrada
          id="movimentos"
          linhas={r.movimentos}
          colunas={COL_MOVIMENTOS}
          chave={(m, i) => `${m.item.id}-${m.em}-${i}`}
          aoTocar={abrir}
        />
      )}
      {aba === 'saidos' && <TabelaFiltrada id="saidos" linhas={r.saidos} colunas={COL_SAIDOS} chave={(s) => s.item.id} aoTocar={abrir} />}
    </div>
  )
}
