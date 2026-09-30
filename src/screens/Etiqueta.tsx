// Etiquetas para imprimir e colar no material. O QR leva ao link do item:
// qualquer câmera de celular abre a ficha direto, sem leitor dentro do app.
import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import { useApp } from '../app-context'
import { tituloItem } from '../components'
import { categoria, estado } from '../config'
import { linkDoItem } from '../lib/util'

export default function Etiqueta({ ids }: { ids: string[] }) {
  const { itens } = useApp()
  const selecionados = ids.map((id) => itens.find((i) => i.id === id)).filter((i) => i !== undefined)
  const [qrs, setQrs] = useState<Record<string, string>>({})

  useEffect(() => {
    let ativo = true
    Promise.all(
      ids.map(async (id) => [id, await QRCode.toDataURL(linkDoItem(id), { margin: 1, width: 240 })] as const),
    ).then((pares) => ativo && setQrs(Object.fromEntries(pares)))
    return () => {
      ativo = false
    }
  }, [ids.join(',')])

  return (
    <div className="etiquetas">
      <div className="nao-imprimir">
        <h1>{selecionados.length > 1 ? `${selecionados.length} etiquetas` : 'Etiqueta'}</h1>
        <p className="fraco">Imprima e cole no material. A câmera do celular lê o QR e abre a ficha.</p>
        <button className="botao principal" onClick={() => window.print()}>
          🖨️ Imprimir
        </button>
      </div>

      <div className="folha">
        {selecionados.map((item) => {
          const e = estado(item.estado)
          return (
            <div key={item.id} className="etiqueta" style={{ '--cor': e.cor } as React.CSSProperties}>
              {qrs[item.id] && <img src={qrs[item.id]} alt={`QR do material ${item.id}`} />}
              <div className="etiqueta-texto">
                <span className="etiqueta-codigo">{item.id}</span>
                <span className="etiqueta-nome">{tituloItem(item)}</span>
                <span>
                  {categoria(item.categoria).nome} · {item.local}
                </span>
                <span className="etiqueta-estado">{e.nome}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
