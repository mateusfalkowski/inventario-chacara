import { ir, useApp } from '../app-context'

export default function Inicio({ trocarNome }: { trocarNome: () => void }) {
  const { itens, operador, store } = useApp()
  const emEstoque = itens.filter((i) => i.quantidade > 0).length
  const hoje = new Date().setHours(0, 0, 0, 0)
  const meusHoje = itens.filter((i) => i.criadoEm >= hoje && i.criadoPor === operador).length

  return (
    <div className="inicio">
      <p className="ola">
        Olá, <strong>{operador}</strong>{' '}
        <button className="link" onClick={trocarNome}>
          (não é você?)
        </button>
      </p>

      <button className="bloco principal" onClick={() => ir('/novo')}>
        <span className="bloco-icone">📷</span>
        <span>
          <strong>Cadastrar material</strong>
          <small>Tirar foto e registrar o que chegou</small>
        </span>
      </button>

      <button className="bloco" onClick={() => ir('/estoque?saida')}>
        <span className="bloco-icone">📤</span>
        <span>
          <strong>Dar saída</strong>
          <small>Material vendido, doado ou descartado</small>
        </span>
      </button>

      <button className="bloco" onClick={() => ir('/estoque')}>
        <span className="bloco-icone">📋</span>
        <span>
          <strong>Ver estoque</strong>
          <small>{emEstoque === 1 ? '1 item guardado' : `${emEstoque} itens guardados`}</small>
        </span>
      </button>

      <button className="bloco" onClick={() => ir('/painel')}>
        <span className="bloco-icone">📊</span>
        <span>
          <strong>Painel e relatórios</strong>
          <small>Resumo, itens parados e exportar planilha</small>
        </span>
      </button>

      {meusHoje > 0 && (
        <p className="nota-dia">
          Você cadastrou <strong>{meusHoje}</strong> {meusHoje === 1 ? 'item' : 'itens'} hoje. 👏
        </p>
      )}

      {store.modo === 'local' && (
        <p className="aviso">
          <strong>Modo demonstração:</strong> os dados ficam salvos só neste aparelho. Configure o Firebase para
          compartilhar entre celulares (veja o README).
        </p>
      )}
    </div>
  )
}
