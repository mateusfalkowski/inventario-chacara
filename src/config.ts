// Listas usadas nos botões do app. Provisórias: devem ser substituídas pelas
// definições das outras equipes (categorias/estados → Equipe 3, locais → Equipe 5,
// destinos → Bloco II). Mudar aqui muda o app inteiro.
import type { EstadoId } from './types'

export const CATEGORIAS = [
  { id: 'madeira', nome: 'Madeira', icone: '🪵' },
  { id: 'ceramica', nome: 'Cerâmica e revestimento', icone: '🧱' },
  { id: 'loucas', nome: 'Louças e metais sanitários', icone: '🚽' },
  { id: 'metais', nome: 'Metais e ferragens', icone: '🔩' },
  { id: 'tubos', nome: 'Tubos e elétrica', icone: '🔌' },
  { id: 'esquadrias', nome: 'Portas e janelas', icone: '🚪' },
  { id: 'moveis', nome: 'Móveis', icone: '🪑' },
  { id: 'iluminacao', nome: 'Iluminação', icone: '💡' },
  { id: 'outros', nome: 'Outros', icone: '📦' },
] as const

export const ESTADOS: { id: EstadoId; nome: string; dica: string; cor: string }[] = [
  { id: 'novo', nome: 'Novo', dica: 'Sem uso, pode estar na embalagem', cor: '#2e7d4f' },
  { id: 'seminovo', nome: 'Seminovo', dica: 'Usado, mas funciona e está bonito', cor: '#2b6cb0' },
  { id: 'reparo', nome: 'Precisa de reparo', dica: 'Funciona com um conserto simples', cor: '#c27c0e' },
  { id: 'sucata', nome: 'Sucata', dica: 'Só serve como matéria-prima', cor: '#8a4b3c' },
]

export const LOCAIS = ['Galpão 1', 'Galpão 2', 'Pátio coberto', 'Pátio aberto', 'Container']

export const UNIDADES = ['unidade', 'm²', 'metro', 'caixa', 'kg', 'lote']

export const DESTINOS = [
  { id: 'venda', nome: 'Venda', icone: '💰' },
  { id: 'doacao', nome: 'Doação (ONG)', icone: '🤝' },
  { id: 'artesaos', nome: 'Artesãos / arte', icone: '🎨' },
  { id: 'uso-interno', nome: 'Uso na chácara', icone: '🏡' },
  { id: 'reciclagem', nome: 'Reciclagem', icone: '♻️' },
  { id: 'descarte', nome: 'Descarte', icone: '🗑️' },
]

/** Itens sem movimento há mais que isso aparecem como "parados" no painel */
export const DIAS_PARADO = 90

export const categoria = (id: string) => CATEGORIAS.find((c) => c.id === id) ?? CATEGORIAS[CATEGORIAS.length - 1]
export const estado = (id: string) => ESTADOS.find((e) => e.id === id) ?? ESTADOS[0]
export const destino = (id: string) => DESTINOS.find((d) => d.id === id)
