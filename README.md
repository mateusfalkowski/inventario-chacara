# Inventário Chácara

Aplicativo de inventário de materiais de obra para reaproveitamento. Desenvolvido pela
**Equipe 1 (Sistema Digital de Inventário Simplificado)** do Projeto de Extensão PAMA
(DI · AU · EC), com o parceiro técnico Eng. Marcelo Benato.

Pensado para quem **não tem familiaridade com planilhas**: botões grandes, poucas perguntas,
foto primeiro, e funciona **sem internet** (sincroniza quando o sinal volta).

**Testar no celular:** <https://mateusfalkowski.github.io/inventario-chacara/>
(publicado automaticamente a cada push na `main`).

## O que o app faz

| Tela | Para quê |
|---|---|
| **Cadastrar material** | Foto → categoria → estado → quantidade/local. ~5 toques por item. Gera um código curto (ex.: `JACMD`). |
| **Etiqueta** | Etiqueta com QR para imprimir. A câmera de qualquer celular lê o QR e abre a ficha do item. |
| **Dar saída** | Venda, doação, artesãos, uso interno, reciclagem ou descarte. Aceita saída parcial. |
| **Estoque** | Busca por código/nome/local, filtro por categoria. |
| **Painel** | Totais por estado/categoria, destinos, itens **parados há +90 dias**, exportar planilha (Excel) e imprimir todas as etiquetas. |

As listas de categorias, estados, locais e destinos ficam em [`src/config.ts`](src/config.ts) —
é ali que entram as definições das Equipes 3 (classificação) e 5 (layout do depósito).

## Rodar no computador

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`. Para testar no celular, use o endereço "Network" que aparece
no terminal (celular e computador na mesma rede Wi-Fi).

Sem configurar nada, o app roda em **modo demonstração**: tudo fica salvo só naquele navegador.

## Ligar o Firebase (dados compartilhados entre celulares)

Plano gratuito (Spark), **sem cartão de crédito**.

1. Acesse <https://console.firebase.google.com> → **Adicionar projeto** (pode desativar o Google Analytics).
2. **Build → Authentication → Começar → Anônimo → Ativar.**
3. **Build → Firestore Database → Criar banco de dados** → local `southamerica-east1` (São Paulo) → modo produção.
4. Em **Firestore → Regras**, cole o conteúdo de [`firestore.rules`](firestore.rules) e publique.
5. **Configurações do projeto (⚙️) → Seus apps → Web (`</>`)** → registre o app → copie os valores do `firebaseConfig`.
6. Copie `.env.example` para `.env.local` e preencha com esses valores.
7. `npm run dev` de novo — o selo "Modo demonstração" some.

### Firebase na versão publicada no GitHub Pages

No repositório: **Settings → Secrets and variables → Actions → Variables** → crie
`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID` e
`VITE_FIREBASE_APP_ID` com os mesmos valores do `.env.local` e rode o workflow de novo
(essas chaves do Firebase web são públicas por natureza; quem protege os dados são as regras).
No Firebase, em **Authentication → Configurações → Domínios autorizados**, adicione
`mateusfalkowski.github.io`.

### Publicar no Firebase Hosting (alternativa, endereço tipo `https://seu-projeto.web.app`)

```bash
npm install -g firebase-tools
firebase login
firebase use --add
npm run build
firebase deploy
```

No celular, abra o endereço e use **"Adicionar à tela inicial"** para instalar como app.

## Decisões técnicas

- **React + Vite + TypeScript**, PWA instalável, sem loja de aplicativos.
- **Fotos comprimidas no celular** (~100–150 KB, miniatura ~5 KB). No plano gratuito do Firebase
  o Cloud Storage não está disponível, então a foto fica num documento próprio (`fotos/{id}`) e a
  miniatura dentro do item. Se o projeto seguir no plano Blaze, basta trocar a função `foto` e a
  gravação em [`src/data/firebase.ts`](src/data/firebase.ts) para usar o Storage.
- **Offline**: cache persistente do Firestore + service worker ([`public/sw.js`](public/sw.js)).
- **Saídas atômicas** (`increment` + `arrayUnion`): duas pessoas dando saída no mesmo item ao
  mesmo tempo, mesmo offline, não sobrescrevem uma à outra.
- **Códigos de 5 letras** sem caracteres ambíguos (sem 0/O, 1/I, 5/S…), gerados no aparelho.

## Limitações do protótipo

- Login anônimo: qualquer pessoa com o link consegue usar. Antes de uso real, trocar por login
  com e-mail/Google e lista de usuários autorizados.
- Sem edição de quantidade/descrição depois do cadastro (só local e estado).
- Sem campo de preço — aguardando a calculadora da **Equipe 4**.
- Sem exportação específica para a vitrine da **Equipe 6** — combinar o formato no Encontro 4 (28/10).
