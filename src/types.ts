export type EstadoId = 'novo' | 'seminovo' | 'reparo' | 'sucata'

export interface Movimento {
  tipo: 'entrada' | 'saida'
  quantidade: number
  /** Só nas saídas: id de DESTINOS */
  destino?: string
  obs?: string
  em: number
  por: string
}

export interface Item {
  /** Mesmo valor do código impresso na etiqueta (ex.: K7F2Q) */
  id: string
  categoria: string
  descricao: string
  /** Quantidade que ainda está no estoque */
  quantidade: number
  unidade: string
  estado: EstadoId
  local: string
  origem: string
  /** Miniatura JPEG em data URL (~15 KB) — a foto grande fica separada */
  thumb: string
  temFoto: boolean
  criadoEm: number
  criadoPor: string
  atualizadoEm: number
  movimentos: Movimento[]
}
