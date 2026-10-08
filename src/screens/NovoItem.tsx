// Cadastro em 5 passos curtos, pensado para quem não usa planilha:
// foto → categoria → estado → destino → quantidade/local. Os passos 2 a 4
// avançam sozinhos ao tocar, então um item simples leva ~6 toques.
// O destino na chegada é pedido da Equipe 3 (classificar e destinar na recepção).
import { useState } from 'react'
import { ir, lembrado, lembrar, useApp } from '../app-context'
import { CartaoItem, Chips, Contador } from '../components'
import { CATEGORIAS, DESTINOS, ESTADOS, LOCAIS, UNIDADES, categoria, destino } from '../config'
import { prepararFoto } from '../lib/imagem'
import { novoCodigo, qtd, semAcento } from '../lib/util'
import type { EstadoId, Item } from '../types'

type Passo = 'foto' | 'categoria' | 'estado' | 'destino' | 'detalhes' | 'parecido' | 'pronto'
const PASSOS: Passo[] = ['foto', 'categoria', 'estado', 'destino', 'detalhes']

export default function NovoItem() {
  const { store, itens, operador } = useApp()
  const [passo, setPasso] = useState<Passo>('foto')
  const [foto, setFoto] = useState<{ foto: string; thumb: string } | null>(null)
  const [processando, setProcessando] = useState(false)
  const [cat, setCat] = useState('')
  const [est, setEst] = useState<EstadoId | ''>('')
  const [dest, setDest] = useState('')
  const [quantidade, setQuantidade] = useState(1)
  const [unidade, setUnidade] = useState('unidade')
  const [local, setLocal] = useState(() => lembrado('ultimoLocal') || LOCAIS[0])
  const [origem, setOrigem] = useState(() => lembrado('ultimaOrigem'))
  const [descricao, setDescricao] = useState('')
  const [salvo, setSalvo] = useState<Item | null>(null)
  // true = em vez de criar um item novo, somou a quantidade num que já existia
  const [somado, setSomado] = useState(false)
  const [parecidos, setParecidos] = useState<Item[]>([])
  // "Cadastrar outro igual": categoria já escolhida, então a foto pula direto para o estado.
  const depoisDaFoto: Passo = cat ? 'estado' : 'categoria'

  // Obras já usadas viram atalhos, para não digitar o mesmo nome toda vez.
  const obras = [...new Set(itens.map((i) => i.origem).filter(Boolean))].slice(0, 6)

  async function escolherFoto(arquivo: File | undefined) {
    if (!arquivo) return
    setProcessando(true)
    try {
      setFoto(await prepararFoto(arquivo))
      setPasso(depoisDaFoto)
    } catch {
      alert('Não foi possível ler essa foto. Tente de novo.')
    } finally {
      setProcessando(false)
    }
  }

  // Com várias pessoas cadastrando, o erro mais comum é o mesmo material entrar
  // duas vezes. Antes de criar, procura algo igual no mesmo lugar e pergunta.
  function conferirParecidos() {
    if (!cat || !est || quantidade <= 0) return
    const achados = itens
      .filter(
        (i) =>
          i.quantidade > 0 &&
          i.categoria === cat &&
          i.estado === est &&
          i.local === local &&
          i.unidade === unidade &&
          descricaoParecida(i.descricao, descricao),
      )
      .sort((a, b) => b.atualizadoEm - a.atualizadoEm)
      .slice(0, 3)
    if (achados.length) {
      setParecidos(achados)
      setPasso('parecido')
    } else {
      salvar()
    }
  }

  function somarEm(item: Item) {
    const agora = Date.now()
    store.movimentar(item.id, { tipo: 'entrada', quantidade, em: agora, por: operador })
    setSalvo({ ...item, quantidade: item.quantidade + quantidade })
    setSomado(true)
    setPasso('pronto')
  }

  function salvar() {
    if (!cat || !est || quantidade <= 0) return
    const agora = Date.now()
    let id = novoCodigo()
    while (itens.some((i) => i.id === id)) id = novoCodigo()
    const item: Item = {
      id,
      categoria: cat,
      descricao: descricao.trim(),
      quantidade,
      unidade,
      estado: est,
      local,
      origem: origem.trim(),
      destinoPrevisto: dest,
      thumb: foto?.thumb ?? '',
      temFoto: Boolean(foto),
      criadoEm: agora,
      criadoPor: operador,
      atualizadoEm: agora,
      movimentos: [{ tipo: 'entrada', quantidade, em: agora, por: operador }],
    }
    store.adicionar(item, foto?.foto ?? null)
    lembrar('ultimoLocal', local)
    lembrar('ultimaOrigem', origem.trim())
    setSalvo(item)
    setSomado(false)
    setPasso('pronto')
  }

  function outro(igual: boolean) {
    // Mantém local e obra: normalmente se cadastra vários itens da mesma leva.
    // "Igual" mantém também o que é (ex.: 10 portas iguais em estados diferentes).
    setFoto(null)
    setEst('')
    setDest('')
    setQuantidade(1)
    if (!igual) {
      setCat('')
      setUnidade('unidade')
      setDescricao('')
    }
    setSalvo(null)
    setPasso('foto')
  }

  const indice = PASSOS.indexOf(passo)
  const voltarPasso = () => setPasso(PASSOS[indice - 1])

  if (passo === 'pronto' && salvo) {
    return (
      <div className="pronto">
        <div className="pronto-check">✓</div>
        <h1>{somado ? 'Quantidade somada!' : 'Material cadastrado!'}</h1>
        <p>{somado ? 'Este material já tem código. Use o mesmo:' : 'Escreva ou cole este código no material:'}</p>
        <p className="codigo-grande">{salvo.id}</p>
        <p className="fraco">
          {categoria(salvo.categoria).nome} · {qtd(salvo.quantidade, salvo.unidade)} · {salvo.local}
          {salvo.destinoPrevisto && ` · ${destino(salvo.destinoPrevisto)?.nome}`}
        </p>
        <button className="botao principal" onClick={() => outro(false)}>
          📷 Cadastrar outro
        </button>
        <button className="botao" onClick={() => outro(true)}>
          📷 Cadastrar outro igual{' '}
          <small className="fraco">({salvo.descricao || categoria(salvo.categoria).nome}, só muda foto e estado)</small>
        </button>
        <button className="botao" onClick={() => ir(`/etiqueta/${salvo.id}`)}>
          🏷️ Imprimir etiqueta
        </button>
        <button className="botao leve" onClick={() => ir('/')}>
          Voltar ao início
        </button>
      </div>
    )
  }

  if (passo === 'parecido') {
    return (
      <div className="cadastro">
        <h1>Já tem algo parecido no estoque</h1>
        <p className="fraco">
          Mesmo tipo, estado e local. Se for o mesmo material, é só somar {qtd(quantidade, unidade)} nele.
        </p>
        {parecidos.map((i) => (
          <div key={i.id} className="parecido">
            {/* Só para mostrar: abrir a ficha aqui perderia o cadastro em andamento. */}
            <CartaoItem item={i} onClick={() => {}} />
            <button className="botao principal" onClick={() => somarEm(i)}>
              É este: somar {qtd(quantidade, unidade)}
            </button>
          </div>
        ))}
        <button className="botao" onClick={salvar}>
          Não, é outro material: cadastrar novo
        </button>
        <button className="botao leve" onClick={() => setPasso('detalhes')}>
          ‹ Voltar
        </button>
      </div>
    )
  }

  return (
    <div className="cadastro">
      <ol className="progresso" aria-label={`Passo ${indice + 1} de ${PASSOS.length}`}>
        {PASSOS.map((p, i) => (
          <li key={p} className={i < indice ? 'feito' : i === indice ? 'atual' : ''} />
        ))}
      </ol>

      {foto && passo !== 'foto' && (
        <button className="foto-resumo" onClick={() => setPasso('foto')}>
          <img src={foto.thumb} alt="Foto do material" />
          <span>Trocar foto</span>
        </button>
      )}

      {passo === 'foto' && (
        <section>
          <h1>1. Tire uma foto do material</h1>
          {foto ? (
            <img className="foto-previa" src={foto.foto} alt="Foto do material" />
          ) : (
            <p className="fraco">Uma foto boa ajuda a vender. Mostre o material inteiro, com boa luz.</p>
          )}
          <label className={`botao principal grande${processando ? ' ocupado' : ''}`}>
            {processando ? 'Preparando foto…' : foto ? '📷 Tirar outra foto' : '📷 Abrir câmera'}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              disabled={processando}
              onChange={(e) => escolherFoto(e.target.files?.[0])}
            />
          </label>
          {foto ? (
            <button className="botao" onClick={() => setPasso(depoisDaFoto)}>
              Continuar com esta foto
            </button>
          ) : (
            <button className="botao leve" onClick={() => setPasso(depoisDaFoto)}>
              Cadastrar sem foto
            </button>
          )}
        </section>
      )}

      {passo === 'categoria' && (
        <section>
          <h1>2. O que é?</h1>
          <div className="grade-opcoes">
            {CATEGORIAS.map((c) => (
              <button
                key={c.id}
                className={`opcao${cat === c.id ? ' ativo' : ''}`}
                onClick={() => {
                  setCat(c.id)
                  setPasso('estado')
                }}
              >
                <span className="opcao-icone">{c.icone}</span>
                {c.nome}
              </button>
            ))}
          </div>
          <button className="botao leve" onClick={voltarPasso}>
            ‹ Voltar
          </button>
        </section>
      )}

      {passo === 'estado' && (
        <section>
          <h1>3. Em que estado está?</h1>
          <div className="lista-estados">
            {ESTADOS.map((e) => (
              <button
                key={e.id}
                className={`opcao-estado${est === e.id ? ' ativo' : ''}`}
                style={{ '--cor': e.cor } as React.CSSProperties}
                onClick={() => {
                  setEst(e.id)
                  setPasso('destino')
                }}
              >
                <strong>{e.nome}</strong>
                <small>{e.dica}</small>
              </button>
            ))}
          </div>
          <button className="botao leve" onClick={voltarPasso}>
            ‹ Voltar
          </button>
        </section>
      )}

      {passo === 'destino' && (
        <section>
          <h1>4. Para onde deve ir?</h1>
          <div className="grade-opcoes">
            {DESTINOS.map((d) => (
              <button
                key={d.id}
                className={`opcao${dest === d.id ? ' ativo' : ''}`}
                onClick={() => {
                  setDest(d.id)
                  setPasso('detalhes')
                }}
              >
                <span className="opcao-icone">{d.icone}</span>
                {d.nome}
              </button>
            ))}
          </div>
          <button
            className="botao"
            onClick={() => {
              setDest('')
              setPasso('detalhes')
            }}
          >
            Ainda não sei
          </button>
          <button className="botao leve" onClick={voltarPasso}>
            ‹ Voltar
          </button>
        </section>
      )}

      {passo === 'detalhes' && (
        <section>
          <h1>5. Quantos e onde?</h1>

          <label className="campo-titulo">Quantidade</label>
          <Contador valor={quantidade} onChange={setQuantidade} />
          <Chips opcoes={UNIDADES} valor={unidade} onChange={setUnidade} />

          <label className="campo-titulo">Onde vai ficar guardado?</label>
          <Chips opcoes={LOCAIS} valor={local} onChange={setLocal} />

          <label className="campo-titulo" htmlFor="descricao">
            Descrição <span className="fraco">(opcional)</span>
          </label>
          <input
            id="descricao"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Ex.: porta de madeira maciça 80 cm"
            maxLength={120}
          />

          <label className="campo-titulo" htmlFor="origem">
            Veio de qual obra? <span className="fraco">(opcional)</span>
          </label>
          <input
            id="origem"
            value={origem}
            onChange={(e) => setOrigem(e.target.value)}
            placeholder="Nome ou endereço da obra"
            maxLength={80}
            list="obras"
          />
          <datalist id="obras">
            {obras.map((o) => (
              <option key={o} value={o} />
            ))}
          </datalist>

          <button className="botao principal grande" onClick={conferirParecidos} disabled={quantidade <= 0}>
            ✓ Salvar material
          </button>
          <button className="botao leve" onClick={voltarPasso}>
            ‹ Voltar
          </button>
        </section>
      )}
    </div>
  )
}

/** Descrições "batem" se uma delas está vazia ou se metade das palavras coincide. */
function descricaoParecida(a: string, b: string) {
  const palavras = (s: string) => new Set(semAcento(s).split(/[^a-z0-9]+/).filter((p) => p.length >= 2))
  const pa = palavras(a)
  const pb = palavras(b)
  if (!pa.size || !pb.size) return true
  const comuns = [...pa].filter((p) => pb.has(p)).length
  return comuns / Math.min(pa.size, pb.size) >= 0.5
}
