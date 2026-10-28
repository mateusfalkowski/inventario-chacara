import { useEffect, useState } from 'react'
import { definirPrefixo, lembrado, lembrar, useRota } from './app-context'
import { criarStore, type Store } from './data/store'
import Moldura from './Moldura'
import Treino from './screens/Treino'
import type { Item } from './types'

// Mude este número para que todos os celulares vejam o convite do tutorial de novo
// na próxima vez que abrirem o app. O nome de cada pessoa continua salvo.
const VERSAO_ACESSO = '2'

export default function App() {
  const [store, setStore] = useState<Store | null>(null)
  const [itens, setItens] = useState<Item[] | null>(null)
  const [erro, setErro] = useState('')
  const [operador, setOperador] = useState(() => lembrado('operador'))
  const [manualVisto, setManualVisto] = useState(() => lembrado('manualVisto') === '1')
  // undefined = ainda conferindo se o aparelho já está conectado (login automático)
  const [logado, setLogado] = useState<boolean | undefined>(undefined)
  const [online, setOnline] = useState(navigator.onLine)
  const rota = useRota()

  useEffect(() => {
    criarStore().then((s) => {
      if (lembrado('versaoAcesso') !== VERSAO_ACESSO) {
        lembrar('manualVisto', '')
        setManualVisto(false)
        lembrar('versaoAcesso', VERSAO_ACESSO)
      }
      setStore(s)
    }, (e) => setErro(String(e)))
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
  if (!logado) return <Mensagem>Conectando… Na primeira vez neste celular precisa de internet.</Mensagem>
  if (!operador) return <PerguntaNome onPronto={(n) => (lembrar('operador', n), setOperador(n))} />
  const emTreino = rota.partes[0] === 'treino'
  // Terminar (ou pular) o treino da primeira vez libera o app de verdade.
  const marcarManualVisto = () => {
    lembrar('manualVisto', '1')
    setManualVisto(true)
  }
  // Saindo do treino: vai para o início do app de verdade.
  const concluirTreino = () => {
    marcarManualVisto()
    location.hash = '/'
  }

  definirPrefixo(emTreino ? '/treino' : '')
  const comum = { operador, online, trocarNome: () => setOperador('') }
  if (emTreino) {
    return <Treino {...comum} partes={rota.partes.slice(1)} busca={rota.busca} onSair={concluirTreino} />
  }
  if (!itens) return <Mensagem>Carregando…</Mensagem>
  return (
    <>
      <Moldura {...comum} store={store} itens={itens} partes={rota.partes} busca={rota.busca} />
      {/* Primeira vez neste aparelho: convite para o treino por cima da tela atual.
          "Agora não" fecha sem sair da tela (quem chegou pelo QR continua no item). */}
      {!manualVisto && <ConviteTreino onPular={marcarManualVisto} />}
    </>
  )
}

function ConviteTreino({ onPular }: { onPular: () => void }) {
  return (
    <div className="popup-fundo" role="dialog" aria-modal="true" aria-labelledby="convite-titulo">
      <div className="popup">
        <div className="popup-icone">🎯</div>
        <h2 id="convite-titulo">Primeira vez aqui?</h2>
        <p>Faça um treino de 2 minutos: você cadastra e dá saída num material de mentira, com dicas na tela.</p>
        <button className="botao principal grande" autoFocus onClick={() => (location.hash = '/treino')}>
          ▶ Começar tutorial
        </button>
        <button className="botao leve" onClick={onPular}>
          Agora não
        </button>
        <p className="fraco popup-nota">Dá para fazer depois em "Como usar".</p>
      </div>
    </div>
  )
}

function Mensagem({ children }: { children: React.ReactNode }) {
  return <div className="mensagem">{children}</div>
}

function PerguntaNome({ onPronto }: { onPronto: (nome: string) => void }) {
  const [nome, setNome] = useState('')
  return (
    <form
      className="pergunta-nome"
      onSubmit={(e) => {
        e.preventDefault()
        // Sem mudar de tela: quem chegou pelo QR continua no item depois de dizer o nome.
        if (nome.trim()) onPronto(nome.trim())
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
