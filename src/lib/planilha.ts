// Relatório em Excel (.xlsx) com formatação: resumo, estoque com foto, movimentações
// e o que já saiu. Os dados vêm de montarRelatorio (o mesmo da planilha do site).
// A biblioteca (ExcelJS) só é baixada quando alguém pede o arquivo.
import type { Cell, Workbook, Worksheet } from 'exceljs'
import { estado } from '../config'
import type { Item, Movimento } from '../types'
import { TIPOS, montarRelatorio } from './relatorio'

const VERDE = 'FF2F5D3A'
const CINZA_LINHA = 'FFD9D3C5'
const ALERTA = 'FFFFF4D6'
// "Geral" mostra 12 e 4,5; formatos como "#,##0.##" deixam "12." com ponto sobrando.
const FORMATO_QTD = 'General'
const FORMATO_DATA = 'dd/mm/yyyy'
const FORMATO_DATA_HORA = 'dd/mm/yyyy hh:mm'

// O Excel não tem fuso: grava a data "como está no relógio" daqui, e não em UTC
// (senão tudo apareceria 3 horas adiantado).
const dataExcel = (ms: number) => new Date(ms - new Date(ms).getTimezoneOffset() * 60_000)

const argb = (hex: string) => 'FF' + hex.replace('#', '').toUpperCase()

interface Coluna {
  titulo: string
  largura: number
  formato?: string
  /** Números e datas centralizados não grudam no texto da coluna ao lado. */
  alinhar?: 'left' | 'center' | 'right'
}

/** Cabeçalho verde, primeira linha congelada, filtro em todas as colunas e bordas leves. */
function tabela(ws: Worksheet, colunas: Coluna[], linhas: (string | number | Date | null)[][]) {
  ws.columns = colunas.map((c) => ({ width: c.largura, style: c.formato ? { numFmt: c.formato } : {} }))
  const alinhamento = (n: number) =>
    ({ vertical: 'middle', wrapText: true, horizontal: colunas[n - 1].alinhar ?? 'left', indent: 1 }) as const
  const cab = ws.addRow(colunas.map((c) => c.titulo))
  cab.height = 24
  cab.eachCell((cel, n) => {
    cel.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: VERDE } }
    cel.alignment = alinhamento(n)
  })
  for (const l of linhas) {
    const row = ws.addRow(l)
    row.eachCell({ includeEmpty: true }, (cel, n) => {
      cel.border = { bottom: { style: 'thin', color: { argb: CINZA_LINHA } } }
      cel.alignment = alinhamento(n)
    })
  }
  ws.views = [{ state: 'frozen', ySplit: 1 }]
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: colunas.length } }
}

function pintarEstado(cel: Cell, estadoId: string) {
  const e = estado(estadoId)
  cel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(e.cor) } }
  cel.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  cel.alignment = { vertical: 'middle', horizontal: 'center' }
}

export async function gerarPlanilha(itens: Item[], agora = Date.now()): Promise<ArrayBuffer> {
  const mod = await import('exceljs')
  const ExcelJS = ((mod as unknown as { default?: typeof mod }).default ?? mod) as typeof mod
  const wb: Workbook = new ExcelJS.Workbook()
  wb.creator = 'Inventário Chácara'
  wb.created = new Date(agora)
  const r = montarRelatorio(itens, agora)

  // ---------- Resumo ----------
  const resumo = wb.addWorksheet('Resumo', { properties: { tabColor: { argb: VERDE } } })
  resumo.columns = [{ width: 34 }, { width: 16 }]
  const t = resumo.addRow(['Inventário Chácara – Relatório'])
  t.font = { bold: true, size: 16, color: { argb: VERDE } }
  t.height = 26
  resumo.addRow([`Gerado em ${new Date(agora).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}`]).font = {
    italic: true,
    color: { argb: 'FF5F6B62' },
  }
  resumo.addRow([])
  for (const s of r.secoes) {
    const h = resumo.addRow([s.nome, s.rotulo])
    h.eachCell((c) => {
      c.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: VERDE } }
    })
    h.getCell(2).alignment = { horizontal: 'center' }
    for (const [k, v] of s.linhas) {
      const l = resumo.addRow([k, v])
      l.getCell(2).alignment = { horizontal: 'center' }
      l.eachCell((c) => (c.border = { bottom: { style: 'thin', color: { argb: CINZA_LINHA } } }))
    }
    resumo.addRow([])
  }

  // ---------- Estoque ----------
  const est = wb.addWorksheet('Estoque')
  tabela(
    est,
    [
      { titulo: 'Foto', largura: 9 },
      { titulo: 'Código', largura: 10 },
      { titulo: 'Material', largura: 30 },
      { titulo: 'Categoria', largura: 22 },
      { titulo: 'Estado', largura: 15 },
      { titulo: 'Quantidade', largura: 12, formato: FORMATO_QTD, alinhar: 'center' },
      { titulo: 'Unidade', largura: 10 },
      { titulo: 'Local', largura: 14 },
      { titulo: 'Destino previsto', largura: 16 },
      { titulo: 'Conjunto', largura: 19 },
      { titulo: 'Obra de origem', largura: 20 },
      { titulo: 'Cadastrado em', largura: 14, formato: FORMATO_DATA, alinhar: 'center' },
      { titulo: 'Cadastrado por', largura: 15 },
      { titulo: 'Dias parado', largura: 11, alinhar: 'center' },
    ],
    r.estoque.map((l) => [
      null,
      l.item.id,
      l.material,
      l.categoria,
      estado(l.estado).nome,
      l.quantidade,
      l.unidade,
      l.local,
      l.destino,
      l.conjunto,
      l.origem,
      dataExcel(l.criadoEm),
      l.criadoPor,
      l.diasParado,
    ]),
  )
  r.estoque.forEach((l, k) => {
    const row = est.getRow(k + 2)
    pintarEstado(row.getCell(5), l.estado)
    row.getCell(2).font = { name: 'Consolas', bold: true }
    if (l.parado) {
      row.getCell(14).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ALERTA } }
      row.getCell(14).font = { bold: true, color: { argb: 'FF8A5A00' } }
    }
    if (l.item.thumb) {
      row.height = 42
      const img = wb.addImage({ base64: l.item.thumb, extension: 'jpeg' })
      est.addImage(img, { tl: { col: 0.1, row: k + 1 + 0.08 }, ext: { width: 50, height: 50 } })
    } else {
      row.height = 20
    }
  })

  // ---------- Movimentações ----------
  const mov = wb.addWorksheet('Movimentações')
  tabela(
    mov,
    [
      { titulo: 'Data', largura: 17, formato: FORMATO_DATA_HORA, alinhar: 'center' },
      { titulo: 'Código', largura: 10 },
      { titulo: 'Material', largura: 30 },
      { titulo: 'Tipo', largura: 11 },
      { titulo: 'Quantidade', largura: 12, formato: FORMATO_QTD, alinhar: 'center' },
      { titulo: 'Unidade', largura: 10 },
      { titulo: 'Destino', largura: 16 },
      { titulo: 'Observação', largura: 36 },
      { titulo: 'Por', largura: 14 },
    ],
    r.movimentos.map((m) => [dataExcel(m.em), m.item.id, m.material, TIPOS[m.tipo], m.quantidade, m.unidade, m.destino, m.obs, m.por]),
  )
  const corTipo: Record<Movimento['tipo'], string> = { entrada: 'FF2E7D4F', saida: 'FFC27C0E', ajuste: 'FF5F6B62' }
  r.movimentos.forEach((m, k) => {
    mov.getRow(k + 2).getCell(4).font = { bold: true, color: { argb: corTipo[m.tipo] } }
  })

  // ---------- Já saíram ----------
  const sai = wb.addWorksheet('Já saíram')
  tabela(
    sai,
    [
      { titulo: 'Código', largura: 10 },
      { titulo: 'Material', largura: 30 },
      { titulo: 'Categoria', largura: 22 },
      { titulo: 'Estado', largura: 15 },
      { titulo: 'Total que saiu', largura: 14, formato: FORMATO_QTD, alinhar: 'center' },
      { titulo: 'Unidade', largura: 10 },
      { titulo: 'Destinos', largura: 24 },
      { titulo: 'Última saída', largura: 14, formato: FORMATO_DATA, alinhar: 'center' },
    ],
    r.saidos.map((s) => [
      s.item.id,
      s.material,
      s.categoria,
      estado(s.estado).nome,
      s.total,
      s.unidade,
      s.destinos,
      s.ultima ? dataExcel(s.ultima) : null,
    ]),
  )
  r.saidos.forEach((s, k) => pintarEstado(sai.getRow(k + 2).getCell(4), s.estado))

  // Abre na aba Estoque, que é a mais usada.
  wb.views = [{ x: 0, y: 0, width: 20000, height: 12000, firstSheet: 0, activeTab: 1, visibility: 'visible' }]

  return (await wb.xlsx.writeBuffer()) as ArrayBuffer
}

export async function baixarPlanilha(itens: Item[]) {
  const dados = await gerarPlanilha(itens)
  const nome = `inventario-chacara-${new Date().toISOString().slice(0, 10)}.xlsx`
  const url = URL.createObjectURL(
    new Blob([dados], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
  )
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}
