// Sem letras/números que se confundem ao ler uma etiqueta (0/O, 1/I, 5/S, 8/B, 2/Z).
const ALFABETO = 'ACDEFGHJKLMNPQRTUVWXY34679'

/** Código curto de 5 caracteres — gerado no celular, funciona offline. */
export function novoCodigo() {
  const bytes = crypto.getRandomValues(new Uint8Array(5))
  return Array.from(bytes, (b) => ALFABETO[b % ALFABETO.length]).join('')
}

export const normalizarCodigo = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '')

export function dataCurta(ms: number) {
  return new Date(ms).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export function diasDesde(ms: number) {
  return Math.floor((Date.now() - ms) / 86_400_000)
}

export function qtd(n: number, unidade: string) {
  const num = n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
  if (unidade === 'unidade') return `${num} ${n === 1 ? 'unidade' : 'unidades'}`
  if (unidade === 'caixa') return `${num} ${n === 1 ? 'caixa' : 'caixas'}`
  if (unidade === 'lote') return `${num} ${n === 1 ? 'lote' : 'lotes'}`
  if (unidade === 'metro') return `${num} m`
  return `${num} ${unidade}`
}

/** Tira acentos e caixa para a busca ("ceramica" acha "Cerâmica"). */
export const semAcento = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

export function linkDoItem(id: string) {
  return `${location.origin}${location.pathname}#/item/${id}`
}
