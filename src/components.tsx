import { useEffect, useState } from 'react'
import { categoria, estado } from './config'
import { qtd } from './lib/util'
import type { Item } from './types'

export function SeloEstado({ id }: { id: string }) {
  const e = estado(id)
  return (
    <span className="selo-estado" style={{ '--cor': e.cor } as React.CSSProperties}>
      {e.nome}
    </span>
  )
}

export function Miniatura({ item, tamanho = 64 }: { item: Item; tamanho?: number }) {
  return item.thumb ? (
    <img className="miniatura" src={item.thumb} alt="" width={tamanho} height={tamanho} />
  ) : (
    <span className="miniatura vazia" style={{ width: tamanho, height: tamanho }}>
      {categoria(item.categoria).icone}
    </span>
  )
}

export const tituloItem = (i: Item) => i.descricao || categoria(i.categoria).nome

export function CartaoItem({ item, onClick }: { item: Item; onClick: () => void }) {
  const esgotado = item.quantidade <= 0
  return (
    <button className={`cartao-item${esgotado ? ' esgotado' : ''}`} onClick={onClick}>
      <Miniatura item={item} />
      <span className="cartao-texto">
        <strong>{tituloItem(item)}</strong>
        <span className="cartao-linha">
          <SeloEstado id={item.estado} />
          <span>{esgotado ? 'Saiu tudo' : qtd(item.quantidade, item.unidade)}</span>
        </span>
        <span className="cartao-linha fraco">
          <span className="codigo">{item.id}</span> · {item.local || 'sem local'}
        </span>
      </span>
    </button>
  )
}

const formatar = (n: number) => String(n).replace('.', ',')
const ler = (s: string) => {
  const n = parseFloat(s.replace(',', '.'))
  return Number.isNaN(n) ? 0 : n
}

export function Contador({
  valor,
  onChange,
  min = 0,
  max,
}: {
  valor: number
  onChange: (n: number) => void
  min?: number
  max?: number
}) {
  const limitar = (n: number) => Math.max(min, max === undefined ? n : Math.min(max, n))
  // Texto próprio para permitir digitar "2," a caminho de "2,5" sem o campo pular.
  const [texto, setTexto] = useState(formatar(valor))
  useEffect(() => {
    if (ler(texto) !== valor) setTexto(formatar(valor))
  }, [valor])
  return (
    <div className="contador">
      <button type="button" onClick={() => onChange(limitar(valor - 1))} aria-label="Menos">
        −
      </button>
      <input
        inputMode="decimal"
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value)
          onChange(limitar(ler(e.target.value)))
        }}
        onBlur={() => setTexto(formatar(valor))}
        onFocus={(e) => e.target.select()}
        aria-label="Quantidade"
      />
      <button type="button" onClick={() => onChange(limitar(valor + 1))} aria-label="Mais">
        +
      </button>
    </div>
  )
}

export function Chips({
  opcoes,
  valor,
  onChange,
}: {
  opcoes: string[]
  valor: string
  onChange: (v: string) => void
}) {
  return (
    <div className="chips">
      {opcoes.map((o) => (
        <button type="button" key={o} className={o === valor ? 'ativo' : ''} onClick={() => onChange(o)}>
          {o}
        </button>
      ))}
    </div>
  )
}
