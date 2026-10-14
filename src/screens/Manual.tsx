// Manual curto de uso, em "Como usar" na tela inicial. O treino fica no topo
// (na primeira vez ele é oferecido num popup). Impresso, cabe em uma folha:
// é a base do manual de 1 página do entregável.
import { ESTADOS } from '../config'

export default function Manual() {
  return (
    <div className="manual">
      <h1>Como usar o inventário</h1>
      <div className="nao-imprimir manual-treino">
        <button className="botao principal grande" onClick={() => (location.hash = '/treino')}>
          🎯 Treinar agora (2 minutos)
        </button>
        <p className="fraco centro">Aprenda fazendo: um cadastro e uma saída de mentira, com dicas na tela.</p>
      </div>

      <ol className="manual-passos">
        <li>
          <strong>📷 Chegou material? Cadastrar material</strong>
          <span>
            Tire a foto, toque no que é, no estado e para onde deve ir. Depois a quantidade e o local. Não precisa
            digitar nada se não quiser.
          </span>
        </li>
        <li>
          <strong>🏷️ Marque o material com o código</strong>
          <span>
            No fim aparece um código de 5 letras (ex.: K7F2Q). Escreva no material com pincel ou imprima a etiqueta.
            A câmera do celular lê o QR da etiqueta e abre a ficha.
          </span>
        </li>
        <li>
          <strong>📤 Saiu material? Dar saída</strong>
          <span>
            Vendido, doado, levado por artesão, usado na chácara, reciclado ou descartado. Escolha o material, para
            onde foi e quanto saiu.
          </span>
        </li>
        <li>
          <strong>✏️ Errou? Dá para arrumar</strong>
          <span>
            Na ficha do material: "Corrigir dados" muda qualquer campo, "Chegou mais" soma quantidade e no histórico
            dá para desfazer uma saída lançada por engano.
          </span>
        </li>
        <li>
          <strong>📶 Sem sinal funciona</strong>
          <span>
            Pode cadastrar e dar saída sem internet. Tudo sobe sozinho quando o sinal voltar. Só não apague os dados
            do navegador antes disso.
          </span>
        </li>
      </ol>

      <h2>Qual estado escolher?</h2>
      <ul className="manual-estados">
        {ESTADOS.map((e) => (
          <li key={e.id} style={{ '--cor': e.cor } as React.CSSProperties}>
            <strong>{e.nome}</strong> {e.dica}
          </li>
        ))}
      </ul>

      <h2>Foto boa vende mais</h2>
      <p>Material inteiro na foto, com luz de dia, fundo limpo. Se tiver marca ou medida escrita, mostre.</p>

      <div className="nao-imprimir">
        <button className="botao" onClick={() => window.print()}>
          🖨️ Imprimir esta página
        </button>
      </div>
    </div>
  )
}
