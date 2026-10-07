export type EstadoId = 'novo' | 'seminovo' | 'reparo' | 'sucata'

export interface Movimento {
  /** 'ajuste' = correção de quantidade digitada errada */
  tipo: 'entrada' | 'saida' | 'ajuste'
  /** Sempre positiva, exceto no ajuste: lá é a diferença (+2, -3) */
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
  /** Para onde o material deve ir (id de DESTINOS), decidido na chegada. '' = ainda não sabe.
   *  Itens cadastrados antes deste campo não têm o valor. */
  destinoPrevisto?: string
  /** Miniatura JPEG em data URL (~15 KB) — a foto grande fica separada */
  thumb: string
  temFoto: boolean
  criadoEm: number
  criadoPor: string
  atualizadoEm: number
  movimentos: Movimento[]
}
