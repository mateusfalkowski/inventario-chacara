// Tabela da planilha, no estilo do filtro do Excel/Airtable:
// - busca geral no topo e botão "Colunas" para mostrar/esconder colunas;
// - cada título tem uma setinha ▾ que abre um menu com ordenar e filtrar
//   (caixinhas com os valores que existem, ou "contém…" para texto);
// - filtros ativos aparecem como etiquetas ("Estado: Novo ✕") com "Limpar tudo";
// - a borda direita de cada título arrasta para mudar a largura (duplo clique: padrão).
// Colunas escondidas e larguras ficam salvas neste navegador.
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { lembrado, lembrar } from './app-context'
import { semAcento } from './lib/util'

export interface Coluna<T> {
  id: string
  titulo: string
  /** Largura inicial em px. Na tela larga as colunas mantêm a proporção e encolhem
   *  ou esticam juntas para caber; no celular a soma vira a largura mínima. */
  largura: number
  /** Valor usado para ordenar e filtrar (número ordena como número). */
  valor: (l: T) => string | number
  /** Como mostrar na célula (padrão: o próprio valor). */
  mostrar?: (l: T) => ReactNode
  /** Texto extra usado só pela busca geral (ex.: código e categoria junto do nome). */
  busca?: (l: T) => string
  /** lista = caixinhas com os valores; texto = "contém…"; nenhum = só ordenar. */
  filtro: 'lista' | 'texto' | 'nenhum'
  /** Começa escondida (dá para mostrar em "Colunas"). */
  oculta?: boolean
  classe?: string
}

interface Props<T> {
  /** Identifica a tabela para guardar colunas escondidas e larguras. */
  id: string
  linhas: T[]
  colunas: Coluna<T>[]
  chave: (l: T, i: number) => string
  aoTocar?: (l: T) => void
  /** Texto de exemplo da busca geral. */
  dicaBusca?: string
}

type Ordem = { col: string; dir: 1 | -1 } | null
/** Filtro de uma coluna: valores marcados (lista) ou texto (contém). */
type Filtro = string[] | string

const LARGURA_MIN = 56

function ler<V>(chave: string, padrao: V): V {
  try {
    const s = lembrado(chave)
    return s ? (JSON.parse(s) as V) : padrao
  } catch {
    return padrao
  }
}

const filtroAtivo = (f: Filtro | undefined) => (Array.isArray(f) ? f.length > 0 : Boolean(f?.trim()))

export default function TabelaFiltrada<T>({ id, linhas, colunas, chave, aoTocar, dicaBusca }: Props<T>) {
  const [filtros, setFiltros] = useState<Record<string, Filtro>>({})
  const [busca, setBusca] = useState('')
  const [ordem, setOrdem] = useState<Ordem>(null)
  const [menu, setMenu] = useState<{ col: string; ancora: HTMLElement } | null>(null)
  const [menuColunas, setMenuColunas] = useState<HTMLElement | null>(null)
  const tabela = useRef<HTMLTableElement>(null)

  // Colunas escondidas: começa com as marcadas como "oculta".
  const chaveOcultas = `planilha:${id}:ocultas`
  const [ocultas, setOcultas] = useState<string[]>(() =>
    ler(chaveOcultas, colunas.filter((c) => c.oculta).map((c) => c.id)),
  )
  useEffect(() => lembrar(chaveOcultas, JSON.stringify(ocultas)), [chaveOcultas, ocultas])
  const visiveisCols = colunas.filter((c) => !ocultas.includes(c.id))

  // null = proporções padrão. Depois que alguém arrasta uma borda, as colunas
  // passam a ter largura fixa em px (como no Excel).
  const chaveLarguras = `planilha:${id}:larguras`
  const [larguras, setLarguras] = useState<Record<string, number> | null>(() => {
    const salvo = ler<Record<string, number> | null>(chaveLarguras, null)
    return salvo && colunas.every((c) => typeof salvo[c.id] === 'number') ? salvo : null
  })
  useEffect(() => lembrar(chaveLarguras, larguras ? JSON.stringify(larguras) : ''), [chaveLarguras, larguras])
  const somaPadrao = visiveisCols.reduce((t, c) => t + c.largura, 0)

  // Valores de cada coluna de lista, com quantas linhas têm cada um.
  const opcoes = useMemo(() => {
    const r: Record<string, [string, number][]> = {}
    for (const c of colunas) {
      if (c.filtro !== 'lista') continue
      const cont = new Map<string, number>()
      for (const l of linhas) {
        const v = String(c.valor(l))
        if (v) cont.set(v, (cont.get(v) ?? 0) + 1)
      }
      r[c.id] = [...cont].sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'))
    }
    return r
  }, [linhas, colunas])

  const visiveis = useMemo(() => {
    const termos = semAcento(busca.trim()).split(/\s+/).filter(Boolean)
    let r = linhas.filter((l) => {
      if (termos.length) {
        const texto = semAcento(colunas.map((c) => `${c.valor(l)} ${c.busca?.(l) ?? ''}`).join(' '))
        if (!termos.every((t) => texto.includes(t))) return false
      }
      return colunas.every((c) => {
        const f = filtros[c.id]
        if (!filtroAtivo(f)) return true
        const v = String(c.valor(l))
        return Array.isArray(f) ? f.includes(v) : semAcento(v).includes(semAcento((f as string).trim()))
      })
    })
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
  }, [linhas, colunas, filtros, ordem, busca])

  const ativos = colunas.filter((c) => filtroAtivo(filtros[c.id]))
  const algoAtivo = ativos.length > 0 || Boolean(busca.trim()) || ordem !== null
  const limparTudo = () => {
    setFiltros({})
    setBusca('')
    setOrdem(null)
  }
  const definirFiltro = (col: string, f: Filtro) => setFiltros((x) => ({ ...x, [col]: f }))

  // ---- Arrastar a borda (largura) ----
  const medirColunas = () => {
    const ths = tabela.current?.querySelectorAll<HTMLElement>('thead th') ?? []
    const medidas: Record<string, number> = Object.fromEntries(colunas.map((c) => [c.id, c.largura]))
    visiveisCols.forEach((c, i) => (medidas[c.id] = Math.round(ths[i]?.getBoundingClientRect().width ?? c.largura)))
    return medidas
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

  const colMenu = menu ? colunas.find((c) => c.id === menu.col) : undefined

  return (
    <div className="tabela-filtrada">
      <div className="barra-tabela">
        <input
          className="busca-tabela"
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder={dicaBusca ?? 'Buscar…'}
          aria-label="Buscar na tabela"
        />
        <button className="botao-barra" onClick={(e) => setMenuColunas(menuColunas ? null : e.currentTarget)}>
          ☰ Colunas{ocultas.length ? ` (${colunas.length - ocultas.length}/${colunas.length})` : ''}
        </button>
        <span className="contagem fraco">
          {visiveis.length === linhas.length ? `${linhas.length} linhas` : `${visiveis.length} de ${linhas.length}`}
        </span>
      </div>

      {(algoAtivo || larguras) && (
        <div className="etiquetas-filtro">
          {ativos.map((c) => {
            const f = filtros[c.id]
            return (
              <button key={c.id} className="etiqueta-filtro" onClick={() => definirFiltro(c.id, Array.isArray(f) ? [] : '')}>
                <strong>{c.titulo}:</strong> {Array.isArray(f) ? f.join(', ') : `contém “${f}”`}
                <span aria-hidden="true">✕</span>
              </button>
            )
          })}
          {ordem && (
            <button className="etiqueta-filtro ordem" onClick={() => setOrdem(null)}>
              <strong>Ordem:</strong> {colunas.find((c) => c.id === ordem.col)?.titulo} {ordem.dir === 1 ? '↑' : '↓'}
              <span aria-hidden="true">✕</span>
            </button>
          )}
          {algoAtivo && (
            <button className="link" onClick={limparTudo}>
              Limpar tudo
            </button>
          )}
          {larguras && (
            <button className="link" onClick={() => setLarguras(null)}>
              Restaurar larguras
            </button>
          )}
        </div>
      )}

      <div className="tabela-rolagem">
        <table
          ref={tabela}
          className="grade fixa"
          style={
            larguras
              ? { width: visiveisCols.reduce((t, c) => t + larguras[c.id], 0) }
              : // --soma: largura mínima só no celular (no computador a tabela encolhe para caber).
                ({ width: '100%', '--soma': `${somaPadrao}px` } as React.CSSProperties)
          }
        >
          <colgroup>
            {visiveisCols.map((c) => (
              <col key={c.id} style={{ width: larguras ? larguras[c.id] : `${(c.largura / somaPadrao) * 100}%` }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              {visiveisCols.map((c) => {
                const filtrada = filtroAtivo(filtros[c.id])
                const ordenada = ordem?.col === c.id
                return (
                  <th key={c.id} className={`${c.classe ?? ''}${filtrada || ordenada ? ' th-ativa' : ''}`}>
                    <button
                      className="th-botao"
                      aria-haspopup="menu"
                      onClick={(e) => setMenu(menu?.col === c.id ? null : { col: c.id, ancora: e.currentTarget })}
                    >
                      <span className="th-titulo">{c.titulo}</span>
                      {ordenada && <span className="th-icone">{ordem.dir === 1 ? '↑' : '↓'}</span>}
                      {filtrada && <span className="th-icone">⏷</span>}
                      <span className="th-seta" aria-hidden="true">
                        ▾
                      </span>
                    </button>
                    <span
                      className="alca"
                      role="separator"
                      aria-orientation="vertical"
                      aria-label={`Mudar a largura da coluna ${c.titulo}`}
                      title="Arraste para mudar a largura (duplo clique: padrão)"
                      onPointerDown={(e) => arrastar(e, c.id)}
                      onDoubleClick={() => setLarguras(null)}
                    />
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {visiveis.map((l, i) => (
              <tr key={chave(l, i)} onClick={aoTocar ? () => aoTocar(l) : undefined}>
                {visiveisCols.map((c) => {
                  const v = c.mostrar ? c.mostrar(l) : c.valor(l)
                  return (
                    <td key={c.id} className={c.classe}>
                      {v === '' || v === null ? <span className="vazio-celula">—</span> : v}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {visiveis.length === 0 && (
          <div className="vazio">
            <p>Nada com esses filtros.</p>
            {algoAtivo && (
              <button className="botao" onClick={limparTudo}>
                Limpar tudo
              </button>
            )}
          </div>
        )}
      </div>

      {menu && colMenu && (
        <Flutuante ancora={menu.ancora} aoFechar={() => setMenu(null)}>
          <MenuColuna
            coluna={colMenu}
            opcoes={opcoes[colMenu.id] ?? []}
            filtro={filtros[colMenu.id]}
            ordem={ordem?.col === colMenu.id ? ordem.dir : null}
            numerica={linhas.length > 0 && typeof colMenu.valor(linhas[0]) === 'number'}
            aoOrdenar={(dir) => {
              setOrdem(dir ? { col: colMenu.id, dir } : null)
              setMenu(null)
            }}
            aoFiltrar={(f) => definirFiltro(colMenu.id, f)}
            aoEsconder={() => {
              setOcultas((o) => [...o, colMenu.id])
              setMenu(null)
            }}
          />
        </Flutuante>
      )}

      {menuColunas && (
        <Flutuante ancora={menuColunas} aoFechar={() => setMenuColunas(null)}>
          <div className="menu-colunas">
            <p className="menu-titulo">Mostrar colunas</p>
            {colunas.map((c) => (
              <label key={c.id} className="menu-opcao">
                <input
                  type="checkbox"
                  checked={!ocultas.includes(c.id)}
                  // Pelo menos uma coluna fica visível.
                  disabled={!ocultas.includes(c.id) && visiveisCols.length === 1}
                  onChange={(e) => setOcultas((o) => (e.target.checked ? o.filter((x) => x !== c.id) : [...o, c.id]))}
                />
                {c.titulo}
              </label>
            ))}
            <button className="link" onClick={() => setOcultas(colunas.filter((c) => c.oculta).map((c) => c.id))}>
              Voltar ao padrão
            </button>
          </div>
        </Flutuante>
      )}
    </div>
  )
}

function MenuColuna<T>({
  coluna,
  opcoes,
  filtro,
  ordem,
  numerica,
  aoOrdenar,
  aoFiltrar,
  aoEsconder,
}: {
  coluna: Coluna<T>
  opcoes: [string, number][]
  filtro: Filtro | undefined
  ordem: 1 | -1 | null
  numerica: boolean
  aoOrdenar: (dir: 1 | -1 | null) => void
  aoFiltrar: (f: Filtro) => void
  aoEsconder: () => void
}) {
  const [procura, setProcura] = useState('')
  const marcados = Array.isArray(filtro) ? filtro : []
  const lista = opcoes.filter(([v]) => semAcento(v).includes(semAcento(procura.trim())))
  const alternar = (v: string) => aoFiltrar(marcados.includes(v) ? marcados.filter((x) => x !== v) : [...marcados, v])

  return (
    <div className="menu-coluna" role="menu">
      <p className="menu-titulo">{coluna.titulo}</p>
      <button className={`menu-item${ordem === 1 ? ' ativo' : ''}`} onClick={() => aoOrdenar(ordem === 1 ? null : 1)}>
        ↑ {numerica ? 'Menor → maior' : 'A → Z'}
      </button>
      <button className={`menu-item${ordem === -1 ? ' ativo' : ''}`} onClick={() => aoOrdenar(ordem === -1 ? null : -1)}>
        ↓ {numerica ? 'Maior → menor' : 'Z → A'}
      </button>

      {coluna.filtro === 'lista' && (
        <>
          <div className="menu-separador" />
          {opcoes.length > 7 && (
            <input
              className="menu-busca"
              type="search"
              value={procura}
              onChange={(e) => setProcura(e.target.value)}
              placeholder="Procurar valor…"
              autoFocus
            />
          )}
          <div className="menu-valores">
            {lista.map(([v, n]) => (
              <label key={v} className="menu-opcao">
                <input type="checkbox" checked={marcados.includes(v)} onChange={() => alternar(v)} />
                <span className="menu-valor">{v}</span>
                <span className="menu-n">{n}</span>
              </label>
            ))}
            {lista.length === 0 && <p className="fraco menu-vazio">Nenhum valor.</p>}
          </div>
          {marcados.length > 0 && (
            <button className="link" onClick={() => aoFiltrar([])}>
              Mostrar todos
            </button>
          )}
        </>
      )}

      {coluna.filtro === 'texto' && (
        <>
          <div className="menu-separador" />
          <input
            className="menu-busca"
            type="search"
            value={typeof filtro === 'string' ? filtro : ''}
            onChange={(e) => aoFiltrar(e.target.value)}
            placeholder="Contém…"
            autoFocus
          />
        </>
      )}

      <div className="menu-separador" />
      <button className="menu-item fraco" onClick={aoEsconder}>
        Esconder esta coluna
      </button>
    </div>
  )
}

/** Caixinha que abre embaixo de um botão (fora da tabela, para não ser cortada). */
function Flutuante({ ancora, aoFechar, children }: { ancora: HTMLElement; aoFechar: () => void; children: ReactNode }) {
  const caixa = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  // Acompanha o botão a cada quadro: se algo acima mudar de tamanho (ex.: aparece a
  // etiqueta do filtro e a tabela desce), a caixa continua colada na coluna.
  useLayoutEffect(() => {
    let quadro = 0
    const posicionar = () => {
      const r = ancora.getBoundingClientRect()
      const largura = caixa.current?.offsetWidth ?? 260
      const top = r.bottom + 6
      const left = Math.max(8, Math.min(r.left, innerWidth - largura - 8))
      setPos((p) => (p && p.top === top && p.left === left ? p : { top, left }))
      quadro = requestAnimationFrame(posicionar)
    }
    posicionar()
    return () => cancelAnimationFrame(quadro)
  }, [ancora])

  useEffect(() => {
    const fora = (e: globalThis.PointerEvent) => {
      const alvo = e.target as Node
      if (!caixa.current?.contains(alvo) && !ancora.contains(alvo)) aoFechar()
    }
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && aoFechar()
    // Rolar a página ou a tabela fecha (a caixa ficaria solta); rolar a própria caixa não.
    const rolou = (e: Event) => !caixa.current?.contains(e.target as Node) && aoFechar()
    document.addEventListener('pointerdown', fora)
    document.addEventListener('keydown', tecla)
    window.addEventListener('scroll', rolou, true)
    window.addEventListener('resize', aoFechar)
    return () => {
      document.removeEventListener('pointerdown', fora)
      document.removeEventListener('keydown', tecla)
      window.removeEventListener('scroll', rolou, true)
      window.removeEventListener('resize', aoFechar)
    }
  }, [ancora, aoFechar])

  return createPortal(
    <div ref={caixa} className="flutuante" style={pos ? { top: pos.top, left: pos.left } : { visibility: 'hidden' }}>
      {children}
    </div>,
    document.body,
  )
}
