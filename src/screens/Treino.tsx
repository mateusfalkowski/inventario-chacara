// Modo treino: as telas de verdade, com um store só na memória e um guia em
// cima dizendo o que fazer. Aprende fazendo, sem risco de sujar o estoque.
// O progresso é deduzido do que a pessoa já fez (cadastrou? abriu a ficha? deu saída?).
import { useEffect, useState } from 'react'
import { criarStoreMemoria } from '../data/memoria'
import Moldura from '../Moldura'
import type { Item } from '../types'

interface Props {
  operador: string
  online: boolean
  partes: string[]
  busca: URLSearchParams
  trocarNome: () => void
  /** Sai do treino e vai para o app de verdade */
  onSair: () => void
}

export default function Treino({ partes, onSair, ...resto }: Props) {
  const [store] = useState(criarStoreMemoria)
  const [itens, setItens] = useState<Item[]>([])
  const [abriuFicha, setAbriuFicha] = useState(false)
  const tela = partes[0]

  useEffect(() => store.observar(setItens), [store])
  useEffect(() => {
    if (tela === 'item' && itens.length) setAbriuFicha(true)
  }, [tela, itens.length])

  const cadastrou = itens.length > 0
  const deuSaida = itens.some((i) => i.movimentos.some((m) => m.tipo === 'saida'))
  const passo = !cadastrou ? 1 : !abriuFicha && !deuSaida ? 2 : !deuSaida ? 3 : 4

  const guia = (
    <section className={`guia${passo === 4 ? ' guia-fim' : ''}`} aria-live="polite">
      <ol className="guia-progresso" aria-label={`Passo ${Math.min(passo, 3)} de 3`}>
        {[1, 2, 3].map((n) => (
          <li key={n} className={n < passo ? 'feito' : n === passo ? 'atual' : ''} />
        ))}
      </ol>
      {passo === 4 ? (
        <>
          <strong>🎉 Pronto! Você já sabe o básico.</strong>
          <p>
            Se errar algo de verdade, abra a ficha do material: dá para corrigir os dados, somar quando chega mais e
            desfazer uma saída lançada por engano.
          </p>
          <button className="botao principal" onClick={onSair}>
            Começar a usar de verdade
          </button>
        </>
      ) : (
        <>
          <strong>
            Treino {passo}/3 · {TITULOS[passo]}
          </strong>
          <p>{dica(passo, tela)}</p>
          <button className="link" onClick={onSair}>
            Sair do treino
          </button>
        </>
      )}
    </section>
  )

  return <Moldura {...resto} store={store} itens={itens} partes={partes} guia={guia} />
}

const TITULOS: Record<number, string> = {
  1: 'Cadastre um material de mentira',
  2: 'Abra a ficha do material',
  3: 'Dê saída no material',
}

function dica(passo: number, tela: string | undefined) {
  if (passo === 1) {
    return tela === 'novo'
      ? 'Siga os passos. Pode fotografar qualquer coisa perto de você. No fim, toque em "Salvar material".'
      : 'Toque em "Cadastrar material". Nada do que fizer aqui vai para o estoque de verdade.'
  }
  if (passo === 2) {
    if (tela === 'estoque') return 'Toque no material que você acabou de cadastrar.'
    return tela
      ? 'Volte ao início e toque em "Ver estoque". É ali que se encontra qualquer material.'
      : 'Toque em "Ver estoque". É ali que se encontra qualquer material.'
  }
  return tela === 'saida'
    ? 'Escolha para onde foi, quanto saiu e toque em "Confirmar saída".'
    : 'Na ficha do material, toque em "Dar saída". Faça de conta que foi vendido.'
}
