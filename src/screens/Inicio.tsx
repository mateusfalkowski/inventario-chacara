import { ir, useApp } from '../app-context'

// Tela inicial pensada para caber inteira no celular, sem rolar: o botão
// principal grande, as outras três ações lado a lado e o resto em links pequenos.
export default function Inicio({ trocarNome }: { trocarNome: () => void }) {
  const { itens, operador, store } = useApp()
  const emEstoque = itens.filter((i) => i.quantidade > 0).length
  const hoje = new Date().setHours(0, 0, 0, 0)
  const meusHoje = itens.filter((i) => i.criadoEm >= hoje && i.criadoPor === operador).length

  return (
    <div className="inicio">
      <button className="bloco principal" onClick={() => ir('/novo')}>
        <span className="bloco-icone">📷</span>
        <span>
          <strong>Cadastrar material</strong>
          <small>Tirar foto e registrar o que chegou</small>
        </span>
      </button>

      <div className="atalhos">
        <button className="atalho" onClick={() => ir('/estoque?saida')}>
          <span className="atalho-icone">📤</span>
          <strong>Dar saída</strong>
          <small>Vendido, doado…</small>
        </button>
        <button className="atalho" onClick={() => ir('/estoque')}>
          <span className="atalho-icone">📋</span>
          <strong>Estoque</strong>
          <small>{emEstoque === 1 ? '1 item' : `${emEstoque} itens`}</small>
        </button>
        <button className="atalho" onClick={() => ir('/painel')}>
          <span className="atalho-icone">📊</span>
          <strong>Painel</strong>
          <small>Resumo e planilha</small>
        </button>
      </div>

      {meusHoje > 0 && (
        <p className="nota-dia">
          Você cadastrou <strong>{meusHoje}</strong> {meusHoje === 1 ? 'item' : 'itens'} hoje. 👏
        </p>
      )}

      <nav className="rodape-links">
        <button className="link" onClick={() => ir('/manual')}>
          📖 Como usar
        </button>
        {/* Sem mostrar o nome na tela: o celular pode estar sendo usado por outra pessoa. */}
        <button className="link" onClick={trocarNome}>
          Trocar nome
        </button>
        <button
          className="link"
          onClick={() => {
            if (confirm('Sair deste celular? Vai precisar da senha da equipe para entrar de novo.')) void store.sair()
          }}
        >
          Sair
        </button>
      </nav>

      {store.modo === 'local' && (
        <p className="aviso">
          <strong>Modo demonstração:</strong> os dados ficam salvos só neste aparelho.
        </p>
      )}
    </div>
  )
}
