// Tabela com filtro em cada coluna, como o filtro do Excel: colunas de lista
// (estado, categoria, local…) têm um seletor com os valores que existem; colunas
// de texto têm um campo de busca. Tocar no título da coluna ordena (A→Z, Z→A).
import { useMemo, useState, type ReactNode } from 'react'
import { semAcento } from './lib/util'

export interface Coluna<T> {
  id: string
  titulo: string
  /** Valor usado para ordenar e filtrar (número ordena como número). */
  valor: (l: T) => string | number
  /** Como mostrar na célula (padrão: o próprio valor). */
  mostrar?: (l: T) => ReactNode
  /** lista = seletor de valores; texto = campo de busca; nenhum = sem filtro (foto, datas, números). */
  filtro: 'lista' | 'texto' | 'nenhum'
  /** Texto mostrado no seletor para cada valor (padrão: o próprio valor). */
  rotulo?: (valor: string) => string
  classe?: string
}

interface Props<T> {
  linhas: T[]
  colunas: Coluna<T>[]
  chave: (l: T, i: number) => string
  aoTocar?: (l: T) => void
}

type Ordem = { col: string; dir: 1 | -1 } | null

export default function TabelaFiltrada<T>({ linhas, colunas, chave, aoTocar }: Props<T>) {
  const [filtros, setFiltros] = useState<Record<string, string>>({})
  const [ordem, setOrdem] = useState<Ordem>(null)

  // Valores de cada coluna de lista, para montar o seletor (só os que existem).
  const opcoes = useMemo(() => {
    const r: Record<string, string[]> = {}
    for (const c of colunas) {
      if (c.filtro !== 'lista') continue
      r[c.id] = [...new Set(linhas.map((l) => String(c.valor(l))))].filter(Boolean).sort((a, b) => a.localeCompare(b, 'pt-BR'))
    }
    return r
  }, [linhas, colunas])

  const visiveis = useMemo(() => {
    let r = linhas.filter((l) =>
      colunas.every((c) => {
        const f = filtros[c.id]
        if (!f) return true
        const v = String(c.valor(l))
        return c.filtro === 'lista' ? v === f : semAcento(v).includes(semAcento(f.trim()))
      }),
    )
    if (ordem) {
      const c = colunas.find((x) => x.id === ordem.col)
      if (c) {
        r = [...r].sort((a, b) => {
          const va = c.valor(a)
          const vb = c.valor(b)
          const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), 'pt-BR')
          return cmp * ordem.dir
        })
      }
    }
    return r
  }, [linhas, colunas, filtros, ordem])

  const ativos = Object.values(filtros).filter(Boolean).length
  // Toque no título: A→Z, depois Z→A, depois volta à ordem original.
  const ordenar = (col: string) =>
    setOrdem((o) => (o?.col !== col ? { col, dir: 1 } : o.dir === 1 ? { col, dir: -1 } : null))

  return (
    <>
      <div className="filtros-info">
        <span className="fraco">
          {visiveis.length === linhas.length ? `${linhas.length} linhas` : `${visiveis.length} de ${linhas.length} linhas`}
        </span>
        {(ativos > 0 || ordem) && (
          <button
            className="link"
            onClick={() => {
              setFiltros({})
              setOrdem(null)
            }}
          >
            Limpar filtros{ativos > 0 ? ` (${ativos})` : ''}
          </button>
        )}
      </div>
      <div className="tabela-rolagem">
        <table className="grade">
          <thead>
            <tr>
              {colunas.map((c) => (
                <th key={c.id} className={c.classe}>
                  <button className="th-ordenar" onClick={() => ordenar(c.id)}>
                    {c.titulo}
                    <span className="seta">{ordem?.col === c.id ? (ordem.dir === 1 ? '▲' : '▼') : ''}</span>
                  </button>
                </th>
              ))}
            </tr>
            <tr className="linha-filtros">
              {colunas.map((c) => (
                <th key={c.id}>
                  {c.filtro === 'lista' ? (
                    <select
                      className={filtros[c.id] ? 'ativo' : ''}
                      value={filtros[c.id] ?? ''}
                      onChange={(e) => setFiltros({ ...filtros, [c.id]: e.target.value })}
                      aria-label={`Filtrar ${c.titulo}`}
                    >
                      <option value="">Todos</option>
                      {opcoes[c.id].map((v) => (
                        <option key={v} value={v}>
                          {c.rotulo ? c.rotulo(v) : v}
                        </option>
                      ))}
                    </select>
                  ) : c.filtro === 'texto' ? (
                    <input
                      className={filtros[c.id] ? 'ativo' : ''}
                      type="search"
                      value={filtros[c.id] ?? ''}
                      onChange={(e) => setFiltros({ ...filtros, [c.id]: e.target.value })}
                      placeholder="Filtrar"
                      aria-label={`Filtrar ${c.titulo}`}
                    />
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visiveis.map((l, i) => (
              <tr key={chave(l, i)} onClick={aoTocar ? () => aoTocar(l) : undefined}>
                {colunas.map((c) => (
                  <td key={c.id} className={c.classe}>
                    {c.mostrar ? c.mostrar(l) : c.valor(l)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {visiveis.length === 0 && <p className="vazio">Nada com esses filtros.</p>}
      </div>
    </>
  )
}
