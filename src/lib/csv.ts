import { categoria, destino, estado } from '../config'
import type { Item } from '../types'
import { dataCurta } from './util'

// Excel em português abre CSV com ";" e precisa do BOM para acentuar certo.
const celula = (v: string | number) => {
  const s = String(v)
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function itensParaCsv(itens: Item[]) {
  const cab = ['Código', 'Categoria', 'Descrição', 'Quantidade', 'Unidade', 'Estado', 'Local', 'Obra de origem',
    'Cadastrado em', 'Cadastrado por', 'Saídas', 'Destinos']
  const linhas = itens.map((i) => {
    const saidas = i.movimentos.filter((m) => m.tipo === 'saida')
    return [
      i.id,
      categoria(i.categoria).nome,
      i.descricao,
      i.quantidade.toLocaleString('pt-BR'),
      i.unidade,
      estado(i.estado).nome,
      i.local,
      i.origem,
      dataCurta(i.criadoEm),
      i.criadoPor,
      saidas.reduce((s, m) => s + m.quantidade, 0).toLocaleString('pt-BR'),
      [...new Set(saidas.map((m) => destino(m.destino ?? '')?.nome ?? m.destino))].join(', '),
    ]
  })
  return '﻿' + [cab, ...linhas].map((l) => l.map(celula).join(';')).join('\r\n')
}

export function baixarArquivo(nome: string, conteudo: string, tipo = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }))
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
