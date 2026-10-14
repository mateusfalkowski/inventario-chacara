// Holofote do treino: escurece a tela, deixa aceso só o elemento que a pessoa
// deve tocar e bloqueia toques no resto. Um balão diz o que fazer.
// Recebe uma lista de alvos (seletor + texto); usa o primeiro que existir na
// tela. Se nenhum existir, não mostra nada e a tela fica livre.
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

export interface Alvo {
  seletor: string
  texto: string
}

interface Props {
  alvos: Alvo[]
  /** Linha pequena acima do texto, ex.: "Treino 1/3" */
  rotulo: string
  onSair: () => void
}

const FOLGA = 6 // espaço entre o elemento e a borda acesa

function achar(alvos: Alvo[]) {
  for (const a of alvos) {
    const el = document.querySelector<HTMLElement>(a.seletor)
    if (el && el.offsetParent !== null) return { el, alvo: a }
  }
  return null
}

export default function Holofote({ alvos, rotulo, onSair }: Props) {
  const [achado, setAchado] = useState<{ el: HTMLElement; alvo: Alvo } | null>(null)
  const [caixa, setCaixa] = useState<DOMRect | null>(null)
  const [cutucar, setCutucar] = useState(0)
  const chave = alvos.map((a) => a.seletor + a.texto).join('|')
  const ultimoEl = useRef<HTMLElement | null>(null)

  // Procura o alvo de tempos em tempos: as telas trocam de passo sem mudar a rota.
  useEffect(() => {
    const procurar = () => {
      const novo = achar(alvos)
      // Só troca o estado se mudou de verdade, para não redesenhar à toa.
      setAchado((velho) =>
        velho?.el === novo?.el && velho?.alvo.texto === novo?.alvo.texto ? velho : novo,
      )
    }
    procurar()
    const t = setInterval(procurar, 200)
    return () => clearInterval(t)
  }, [chave])

  // Alvo novo: rola até ele.
  useEffect(() => {
    const el = achado?.el ?? null
    if (el && el !== ultimoEl.current) el.scrollIntoView({ block: 'center', behavior: 'smooth' })
    ultimoEl.current = el
  }, [achado?.el])

  // Acompanha a posição do alvo (rolagem, teclado do celular, animações).
  useLayoutEffect(() => {
    if (!achado) {
      setCaixa(null)
      return
    }
    let quadro = 0
    const medir = () => {
      const r = achado.el.getBoundingClientRect()
      setCaixa((v) =>
        v && v.top === r.top && v.left === r.left && v.width === r.width && v.height === r.height ? v : r,
      )
      quadro = requestAnimationFrame(medir)
    }
    medir()
    return () => cancelAnimationFrame(quadro)
  }, [achado])

  if (!achado || !caixa) return null

  const x = caixa.left - FOLGA
  const y = caixa.top - FOLGA
  const l = caixa.width + FOLGA * 2
  const a = caixa.height + FOLGA * 2
  const embaixo = caixa.top + caixa.height / 2 < innerHeight / 2
  const bloquear = () => setCutucar((n) => n + 1)

  return (
    <div className="holofote" aria-live="polite">
      {/* Quatro faixas escuras em volta do alvo: bloqueiam o toque fora dele. */}
      <div className="holofote-bloqueio" style={{ top: 0, left: 0, right: 0, height: Math.max(0, y) }} onClick={bloquear} />
      <div className="holofote-bloqueio" style={{ top: y + a, left: 0, right: 0, bottom: 0 }} onClick={bloquear} />
      <div className="holofote-bloqueio" style={{ top: y, left: 0, width: Math.max(0, x), height: a }} onClick={bloquear} />
      <div className="holofote-bloqueio" style={{ top: y, left: x + l, right: 0, height: a }} onClick={bloquear} />

      {/* O "buraco" aceso: a sombra gigante escurece o resto da tela. */}
      <div key={cutucar} className={`holofote-anel${cutucar ? ' cutucado' : ''}`} style={{ top: y, left: x, width: l, height: a }} />

      <div
        className={`holofote-balao ${embaixo ? 'embaixo' : 'em-cima'}`}
        onClick={bloquear}
        style={embaixo ? { top: y + a + 14 } : { bottom: innerHeight - y + 14 }}
      >
        <span className="holofote-rotulo">{rotulo}</span>
        <p>{achado.alvo.texto}</p>
        <button className="link" onClick={onSair}>
          Sair do treino
        </button>
      </div>
    </div>
  )
}
