// Tabela com filtro em cada coluna, como o filtro do Excel: colunas de lista
// (estado, categoria, local…) têm um seletor com os valores que existem; colunas
// de texto têm um campo de busca. Tocar no título da coluna ordena (A→Z, Z→A).
// A borda direita de cada título arrasta para mudar a largura da coluna (como no
// Excel); a largura fica salva neste navegador. Duplo clique na borda: automática.
import { useEffect, useMemo, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { lembrado, lembrar } from './app-context'
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
  /** Identifica a tabela para guardar as larguras das colunas. */
  id: string
  linhas: T[]
  colunas: Coluna<T>[]
  chave: (l: T, i: number) => string
  aoTocar?: (l: T) => void
}

type Ordem = { col: string; dir: 1 | -1 } | null

const LARGURA_MIN = 44

export default function TabelaFiltrada<T>({ id, linhas, colunas, chave, aoTocar }: Props<T>) {
  const [filtros, setFiltros] = useState<Record<string, string>>({})
  const [ordem, setOrdem] = useState<Ordem>(null)
  const tabela = useRef<HTMLTableElement>(null)
  const chaveLarguras = `colunas:${id}`

  // null = larguras automáticas. Depois que alguém arrasta uma borda, todas as
  // colunas passam a ter largura fixa (senão o navegador redistribuiria o resto).
  const [larguras, setLarguras] = useState<Record<string, number> | null>(() => {
    try {
      const salvo = JSON.parse(lembrado(chaveLarguras) || 'null') as Record<string, number> | null
      return salvo && colunas.every((c) => typeof salvo[c.id] === 'number') ? salvo : null
    } catch {
      return null
    }
  })
  useEffect(() => lembrar(chaveLarguras, larguras ? JSON.stringify(larguras) : ''), [chaveLarguras, larguras])

  const medirColunas = () => {
    const ths = tabela.current?.querySelectorAll<HTMLElement>('thead tr:first-child th') ?? []
    return Object.fromEntries(colunas.map((c, i) => [c.id, Math.round(ths[i]?.getBoundingClientRect().width ?? 100)]))
  }

  function arrastar(e: PointerEvent<HTMLSpanElement>, col: string) {
    e.preventDefault()
    e.stopPropagation()
    const base = larguras ?? medirColunas()
    const inicioX = e.clientX
    const inicioL = base[col]
    setLarguras(base)
    // Ouve a janela toda: o mouse pode sair da borda fina enquanto arrasta.
    const mover = (ev: globalThis.PointerEvent) =>
      setLarguras((l) => ({ ...(l ?? base), [col]: Math.max(LARGURA_MIN, Math.round(inicioL + ev.clientX - inicioX)) }))
    const soltar = () => {
      window.removeEventListener('pointermove', mover)
      window.removeEventListener('pointerup', soltar)
      window.removeEventListener('pointercancel', soltar)
      document.body.classList.remove('arrastando-coluna')
    }
    window.addEventListener('pointermove', mover)
    window.addEventListener('pointerup', soltar)
    window.addEventListener('pointercancel', soltar)
    document.body.classList.add('arrastando-coluna')
  }

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
        {larguras && (
          <button className="link" onClick={() => setLarguras(null)}>
            Restaurar colunas
          </button>
        )}
      </div>
      <div className="tabela-rolagem">
        <table
          ref={tabela}
          className={`grade${larguras ? ' fixa' : ''}`}
          style={larguras ? { width: colunas.reduce((t, c) => t + larguras[c.id], 0) } : undefined}
        >
          {larguras && (
            <colgroup>
              {colunas.map((c) => (
                <col key={c.id} style={{ width: larguras[c.id] }} />
              ))}
            </colgroup>
          )}
          <thead>
            <tr>
              {colunas.map((c) => (
                <th key={c.id} className={c.classe}>
                  <button className="th-ordenar" onClick={() => ordenar(c.id)}>
                    {c.titulo}
                    <span className="seta">{ordem?.col === c.id ? (ordem.dir === 1 ? '▲' : '▼') : ''}</span>
                  </button>
                  <span
                    className="alca"
                    role="separator"
                    aria-orientation="vertical"
                    aria-label={`Mudar a largura da coluna ${c.titulo}`}
                    title="Arraste para mudar a largura (duplo clique: automática)"
                    onPointerDown={(e) => arrastar(e, c.id)}
                    onDoubleClick={() => setLarguras(null)}
                  />
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
