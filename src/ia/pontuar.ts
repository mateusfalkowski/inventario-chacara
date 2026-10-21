// Compara o vetor da foto com os vetores das descrições e devolve as categorias
// da mais provável para a menos provável. Função pura: usada no app e no teste.

export interface Vetores {
  modelo: string
  /** categoria → um vetor (já normalizado) por descrição */
  categorias: Record<string, number[][]>
}

export interface Palpite {
  categoria: string
  /** 0 a 1, soma 1 entre todas as categorias */
  chance: number
}

// Mesma "temperatura" do CLIP: deixa a diferença entre as notas mais nítida.
const ESCALA = 100

export function normalizar(v: ArrayLike<number>) {
  let soma = 0
  for (let i = 0; i < v.length; i++) soma += v[i] * v[i]
  const n = Math.sqrt(soma) || 1
  return Array.from(v, (x) => x / n)
}

export function pontuar(foto: ArrayLike<number>, vetores: Vetores): Palpite[] {
  const f = normalizar(foto)
  const notas = Object.entries(vetores.categorias).map(([categoria, lista]) => {
    // Nota da categoria = a descrição dela que mais combinou com a foto.
    let melhor = -Infinity
    for (const v of lista) {
      let s = 0
      for (let i = 0; i < f.length; i++) s += f[i] * v[i]
      if (s > melhor) melhor = s
    }
    return { categoria, nota: melhor }
  })
  const maior = Math.max(...notas.map((n) => n.nota))
  const exp = notas.map((n) => Math.exp(ESCALA * (n.nota - maior)))
  const total = exp.reduce((a, b) => a + b, 0)
  return notas
    .map((n, i) => ({ categoria: n.categoria, chance: exp[i] / total }))
    .sort((a, b) => b.chance - a.chance)
}
