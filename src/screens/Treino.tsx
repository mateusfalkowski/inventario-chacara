// Modo treino: as telas de verdade, com um store só na memória e um holofote
// que escurece a tela e mostra exatamente onde tocar. Aprende fazendo, sem
// risco de sujar o estoque. O progresso é deduzido do que a pessoa já fez
// (cadastrou? abriu a ficha? deu saída?).
import { useEffect, useState } from 'react'
import { criarStoreMemoria } from '../data/memoria'
import Holofote, { type Alvo } from '../Holofote'
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

  return (
    <>
      <Moldura {...resto} store={store} itens={itens} partes={partes} />
      {passo < 4 ? (
        <Holofote alvos={alvosDoPasso(passo, tela)} rotulo={`Treino ${passo} de 3 · ${TITULOS[passo]}`} onSair={onSair} />
      ) : (
        <div className="popup-fundo" role="dialog" aria-modal="true" aria-labelledby="fim-treino">
          <div className="popup">
            <div className="popup-icone">🎉</div>
            <h2 id="fim-treino">Pronto! Você já sabe o básico.</h2>
            <p>
              Se errar algo de verdade, abra a ficha do material: dá para corrigir os dados, somar quando chega mais e
              desfazer uma saída lançada por engano.
            </p>
            <button className="botao principal grande" autoFocus onClick={onSair}>
              Começar a usar de verdade
            </button>
          </div>
        </div>
      )}
    </>
  )
}

const TITULOS: Record<number, string> = {
  1: 'Cadastrar',
  2: 'Achar no estoque',
  3: 'Dar saída',
}

const VOLTAR: Alvo = { seletor: '.voltar', texto: 'Toque em "Voltar" para ir ao início.' }

/** Onde tocar em cada passo. Só um passo do cadastro aparece por vez, então a ordem tanto faz ali. */
function alvosDoPasso(passo: number, tela: string | undefined): Alvo[] {
  if (passo === 1) {
    if (tela === 'novo') {
      return [
        { seletor: '[data-tour=foto]', texto: 'Tire uma foto de qualquer coisa perto de você, ou toque em "Cadastrar sem foto".' },
        { seletor: '[data-tour=categorias]', texto: 'O que é o material? Toque em uma opção.' },
        { seletor: '[data-tour=estados]', texto: 'Em que estado ele está? Toque em uma opção.' },
        { seletor: '[data-tour=destinos]', texto: 'Para onde ele deve ir? Toque em uma opção.' },
        { seletor: '[data-tour=salvar]', texto: 'Quantidade e local já vêm preenchidos. Toque em "Salvar material".' },
      ]
    }
    if (!tela) return [{ seletor: '[data-tour=cadastrar]', texto: 'Chegou material? Comece sempre por aqui.' }]
    return [VOLTAR]
  }
  if (passo === 2) {
    if (tela === 'estoque') return [{ seletor: '.cartao-item', texto: 'Toque no material que você acabou de cadastrar.' }]
    if (!tela) return [{ seletor: '[data-tour=estoque]', texto: 'Aqui fica tudo o que está guardado. Toque em "Estoque".' }]
    return [{ ...VOLTAR, texto: 'Material salvo! Agora toque em "Voltar".' }]
  }
  // passo 3
  if (tela === 'item') {
    return [{ seletor: '[data-tour=dar-saida]', texto: 'Faça de conta que ele foi vendido: toque em "Dar saída".' }]
  }
  if (tela === 'saida') {
    return [
      { seletor: '[data-tour=confirmar]:not(:disabled)', texto: 'O destino já vem marcado. Toque em "Confirmar saída".' },
      { seletor: '[data-tour=destinos]', texto: 'Para onde foi? Toque em uma opção.' },
    ]
  }
  if (tela === 'estoque') return [{ seletor: '.cartao-item', texto: 'Toque no material para abrir a ficha.' }]
  if (!tela) return [{ seletor: '[data-tour=estoque]', texto: 'Toque em "Estoque" e abra o material.' }]
  return [VOLTAR]
}
