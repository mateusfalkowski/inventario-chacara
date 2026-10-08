import { useMemo, useState } from 'react'
import { ir, useApp } from '../app-context'
import { CartaoItem } from '../components'
import { CATEGORIAS, categoria, destino, estado } from '../config'
import { normalizarCodigo, semAcento } from '../lib/util'

export default function Estoque({ modoSaida }: { modoSaida: boolean }) {
  const { itens } = useApp()
  const [busca, setBusca] = useState('')
  const [cat, setCat] = useState('')
  const [verSaidos, setVerSaidos] = useState(false)

  const lista = useMemo(() => {
    const termo = semAcento(busca.trim())
    const cod = normalizarCodigo(busca)
    return itens
      .filter((i) => verSaidos || i.quantidade > 0)
      .filter((i) => !cat || i.categoria === cat)
      .filter((i) => {
        if (!termo) return true
        const texto = semAcento(
          [
            i.id,
            i.descricao,
            categoria(i.categoria).nome,
            estado(i.estado).nome,
            destino(i.destinoPrevisto ?? '')?.nome,
            i.local,
            i.origem,
          ].join(' '),
        )
        return termo.split(/\s+/).every((t) => texto.includes(t))
      })
      .sort((a, b) => {
        // Código exato digitado vai para o topo.
        if (cod && a.id === cod) return -1
        if (cod && b.id === cod) return 1
        return b.atualizadoEm - a.atualizadoEm
      })
  }, [itens, busca, cat, verSaidos])

  const abrir = (id: string) => ir(modoSaida ? `/saida/${id}` : `/item/${id}`)

  return (
    <div className="estoque">
      <h1>{modoSaida ? 'Dar saída: qual material?' : 'Estoque'}</h1>
      {modoSaida && (
        <p className="dica">
          💡 Mais rápido: aponte a <strong>câmera do celular</strong> para a etiqueta com QR do material.
        </p>
      )}

      <input
        className="busca"
        type="search"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar por código, nome, local…"
        autoFocus={modoSaida}
      />

      <div className="chips filtro">
        <button className={!cat ? 'ativo' : ''} onClick={() => setCat('')}>
          Todos
        </button>
        {CATEGORIAS.map((c) => (
          <button key={c.id} className={cat === c.id ? 'ativo' : ''} onClick={() => setCat(cat === c.id ? '' : c.id)}>
            {c.icone} {c.nome}
          </button>
        ))}
      </div>

      {!modoSaida && (
        <label className="alternar">
          <input type="checkbox" checked={verSaidos} onChange={(e) => setVerSaidos(e.target.checked)} />
          Mostrar também o que já saiu
        </label>
      )}

      <p className="fraco">{lista.length === 1 ? '1 material' : `${lista.length} materiais`}</p>

      <div className="lista">
        {lista.map((i) => (
          <CartaoItem key={i.id} item={i} onClick={() => abrir(i.id)} />
        ))}
      </div>

      {lista.length === 0 && (
        <div className="vazio">
          {itens.length === 0 ? (
            <>
              <p>Nenhum material cadastrado ainda.</p>
              <button className="botao principal" onClick={() => ir('/novo')}>
                📷 Cadastrar o primeiro
              </button>
            </>
          ) : (
            <p>Nada encontrado com essa busca.</p>
          )}
        </div>
      )}
    </div>
  )
}
