// Dados do relatório, calculados uma vez e usados tanto na planilha do site
// (tela "Planilha") quanto no arquivo Excel. Assim os dois mostram sempre o mesmo.
import { CATEGORIAS, DESTINOS, DIAS_PARADO, ESTADOS, categoria, destino } from '../config'
import type { EstadoId, Item, Movimento } from '../types'
import { diasDesde } from './util'

export interface Secao {
  nome: string
  rotulo: string
  linhas: [string, number][]
}

export interface LinhaEstoque {
  item: Item
  material: string
  categoria: string
  estado: EstadoId
  quantidade: number
  unidade: string
  local: string
  destino: string
  conjunto: string
  origem: string
  criadoEm: number
  criadoPor: string
  diasParado: number
  parado: boolean
}

export interface LinhaMovimento {
  item: Item
  em: number
  material: string
  tipo: Movimento['tipo']
  quantidade: number
  unidade: string
  destino: string
  obs: string
  por: string
}

export interface LinhaSaido {
  item: Item
  material: string
  categoria: string
  estado: EstadoId
  total: number
  unidade: string
  destinos: string
  ultima: number | null
}

export interface Relatorio {
  geradoEm: number
  secoes: Secao[]
  estoque: LinhaEstoque[]
  movimentos: LinhaMovimento[]
  saidos: LinhaSaido[]
}

export const TIPOS: Record<Movimento['tipo'], string> = { entrada: 'Entrada', saida: 'Saída', ajuste: 'Correção' }

const titulo = (i: Item) => i.descricao || categoria(i.categoria).nome

export function montarRelatorio(itens: Item[], agora = Date.now()): Relatorio {
  const emEstoque = itens
    .filter((i) => i.quantidade > 0)
    .sort((a, b) => categoria(a.categoria).nome.localeCompare(categoria(b.categoria).nome) || titulo(a).localeCompare(titulo(b)))
  const esgotados = itens.filter((i) => i.quantidade <= 0)
  const movs = itens.flatMap((i) => i.movimentos.map((m) => ({ m, i }))).sort((a, b) => b.m.em - a.m.em)
  const saidas = movs.filter(({ m }) => m.tipo === 'saida')
  const parados = emEstoque.filter((i) => diasDesde(i.atualizadoEm) >= DIAS_PARADO)
  const pecasDe = (id: string) => itens.filter((x) => x.pai === id).length

  const secoes: Secao[] = [
    {
      nome: 'Visão geral',
      rotulo: 'Quantidade',
      linhas: [
        ['Itens no estoque', emEstoque.length],
        ['Itens já cadastrados (total)', itens.length],
        ['Saídas registradas', saidas.length],
        [`Parados há mais de ${DIAS_PARADO} dias`, parados.length],
        ['Itens no estoque sem foto', emEstoque.filter((i) => !i.temFoto).length],
      ],
    },
    {
      nome: 'Estoque por categoria',
      rotulo: 'Itens',
      linhas: CATEGORIAS.map((c) => [c.nome, emEstoque.filter((i) => i.categoria === c.id).length] as [string, number]).filter(
        ([, n]) => n > 0,
      ),
    },
    {
      nome: 'Estoque por estado',
      rotulo: 'Itens',
      linhas: ESTADOS.map((e) => [e.nome, emEstoque.filter((i) => i.estado === e.id).length]),
    },
    {
      nome: 'Destino previsto do estoque',
      rotulo: 'Itens',
      linhas: [
        ...DESTINOS.map((d) => [d.nome, emEstoque.filter((i) => i.destinoPrevisto === d.id).length] as [string, number]),
        ['Ainda não definido', emEstoque.filter((i) => !destino(i.destinoPrevisto ?? '')).length],
      ],
    },
    {
      nome: 'Saídas por destino',
      rotulo: 'Saídas',
      linhas: DESTINOS.map((d) => [d.nome, saidas.filter(({ m }) => m.destino === d.id).length]),
    },
  ]

  const estoque: LinhaEstoque[] = emEstoque.map((i) => {
    const n = pecasDe(i.id)
    const dias = diasDesde(i.atualizadoEm)
    return {
      item: i,
      material: titulo(i),
      categoria: categoria(i.categoria).nome,
      estado: i.estado,
      quantidade: i.quantidade,
      unidade: i.unidade,
      local: i.local,
      destino: destino(i.destinoPrevisto ?? '')?.nome ?? 'Não definido',
      conjunto: i.pai ? `Peça de ${i.pai}` : n ? `Conjunto (${n} ${n === 1 ? 'peça' : 'peças'})` : '',
      origem: i.origem,
      criadoEm: i.criadoEm,
      criadoPor: i.criadoPor,
      diasParado: dias,
      parado: dias >= DIAS_PARADO,
    }
  })

  const movimentos: LinhaMovimento[] = movs.map(({ m, i }) => ({
    item: i,
    em: m.em,
    material: titulo(i),
    tipo: m.tipo,
    quantidade: m.quantidade,
    unidade: i.unidade,
    destino: m.tipo === 'saida' ? (destino(m.destino ?? '')?.nome ?? m.destino ?? '') : '',
    obs: m.obs ?? '',
    por: m.por,
  }))

  const saidos: LinhaSaido[] = esgotados.map((i) => {
    const s = i.movimentos.filter((m) => m.tipo === 'saida')
    const ultima = Math.max(0, ...s.map((m) => m.em))
    return {
      item: i,
      material: titulo(i),
      categoria: categoria(i.categoria).nome,
      estado: i.estado,
      total: s.reduce((t, m) => t + m.quantidade, 0),
      unidade: i.unidade,
      destinos: [...new Set(s.map((m) => destino(m.destino ?? '')?.nome ?? m.destino))].join(', '),
      ultima: ultima || null,
    }
  })

  return { geradoEm: agora, secoes, estoque, movimentos, saidos }
}
