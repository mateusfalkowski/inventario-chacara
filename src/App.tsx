import { useEffect, useState } from 'react'
import { definirPrefixo, ir, lembrado, lembrar, useRota } from './app-context'
import { criarStore, type Store } from './data/store'
import Manual from './screens/Manual'
import Moldura from './Moldura'
import Treino from './screens/Treino'
import type { Item } from './types'

export default function App() {
  const [store, setStore] = useState<Store | null>(null)
  const [itens, setItens] = useState<Item[] | null>(null)
  const [erro, setErro] = useState('')
  const [operador, setOperador] = useState(() => lembrado('operador'))
  const [manualVisto, setManualVisto] = useState(() => lembrado('manualVisto') === '1')
  // undefined = ainda conferindo se este aparelho já entrou com a senha
  const [logado, setLogado] = useState<boolean | undefined>(undefined)
  const [online, setOnline] = useState(navigator.onLine)
  const rota = useRota()

  useEffect(() => {
    criarStore().then(setStore, (e) => setErro(String(e)))
  }, [])

  useEffect(() => store?.observarLogin(setLogado), [store])
  useEffect(() => store?.observar(setItens), [store])

  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  if (erro) return <Mensagem>Não foi possível abrir o banco de dados: {erro}</Mensagem>
  if (!store || logado === undefined) return <Mensagem>Carregando…</Mensagem>
  if (!logado) return <PedeSenha store={store} />
  if (!operador) return <PerguntaNome onPronto={(n) => (lembrar('operador', n), setOperador(n))} />
  const emTreino = rota.partes[0] === 'treino'
  // Terminar (ou pular) o manual/treino da primeira vez libera o app de verdade.
  const concluirManual = () => {
    lembrar('manualVisto', '1')
    setManualVisto(true)
    location.hash = '/'
  }

  // Primeira vez neste aparelho: mostra o manual antes de tudo (dele dá para ir ao treino).
  if (!manualVisto && !emTreino) {
    return (
      <main className="conteudo">
        <Manual onPronto={concluirManual} />
      </main>
    )
  }

  definirPrefixo(emTreino ? '/treino' : '')
  const comum = { operador, online, trocarNome: () => setOperador('') }
  if (emTreino) {
    return <Treino {...comum} partes={rota.partes.slice(1)} busca={rota.busca} onSair={concluirManual} />
  }
  if (!itens) return <Mensagem>Carregando…</Mensagem>
  return <Moldura {...comum} store={store} itens={itens} partes={rota.partes} busca={rota.busca} />
}

function Mensagem({ children }: { children: React.ReactNode }) {
  return <div className="mensagem">{children}</div>
}

function PedeSenha({ store }: { store: Store }) {
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)
  return (
    <form
      className="pergunta-nome"
      onSubmit={async (e) => {
        e.preventDefault()
        setErro('')
        setOcupado(true)
        try {
          await store.entrar(senha)
        } catch {
          setErro(
            navigator.onLine
              ? 'Senha errada. Confira com o responsável.'
              : 'Sem internet. Na primeira vez precisa de sinal.',
          )
        } finally {
          setOcupado(false)
        }
      }}
    >
      <img src="icon.svg" alt="" width={72} height={72} />
      <h1>Inventário Chácara</h1>
      <p>Digite a senha da equipe. Só precisa fazer isso uma vez neste celular.</p>
      <input
        autoFocus
        type="password"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        placeholder="Senha da equipe"
        autoComplete="current-password"
      />
      {erro && <p className="erro">{erro}</p>}
      <button className={`botao principal${ocupado ? ' ocupado' : ''}`} disabled={!senha}>
        Entrar
      </button>
      {store.modo === 'local' && (
        <p className="aviso">
          <strong>Modo demonstração:</strong> qualquer senha entra.
        </p>
      )}
    </form>
  )
}

function PerguntaNome({ onPronto }: { onPronto: (nome: string) => void }) {
  const [nome, setNome] = useState('')
  return (
    <form
      className="pergunta-nome"
      onSubmit={(e) => {
        e.preventDefault()
        if (nome.trim()) {
          onPronto(nome.trim())
          ir('/')
        }
      }}
    >
      <img src="icon.svg" alt="" width={72} height={72} />
      <h1>Olá! Qual é o seu nome?</h1>
      <p>Assim o sistema sabe quem cadastrou cada material.</p>
      <input
        autoFocus
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Seu nome"
        autoComplete="given-name"
      />
      <button className="botao principal" disabled={!nome.trim()}>
        Começar
      </button>
    </form>
  )
}
