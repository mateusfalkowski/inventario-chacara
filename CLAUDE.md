# Contexto do projeto (para o Claude)

Projeto de Extensão PAMA (faculdade). O usuário (Mateus, Eng. Civil) é da **Equipe 1 – Sistema
Digital de Inventário Simplificado**. Parceiro técnico: Eng. Marcelo Benato, que tem uma chácara com
sobras de obra acumuladas e quer saber o que tem e recuperar valor vendendo/destinando os materiais.

Equipe: Mateus (desenvolvimento, manual, entregas), Amanda, Luiza e Otavio (apoio). Responda em português.

## Entregável e cronograma (2026)
Entregável final: protótipo funcional + manual de operação de 1 página.
- 14/10 – benchmark e lista de requisitos (categorias/estados com a Equipe 3)
- 21/10 – Protótipo Alfa
- 28/10 – Protótipo Beta + integração com Equipes 4 (precificação) e 6 (vitrine digital)
- 04/11 – teste de uso real, manual, slides
- 11/11 – apresentação ao parceiro
- 18/11 – versão final + relatório de reflexão

Cada entrega semanal vai num documento curto; o usuário prefere texto simples, sem "cara de IA".

## Decisões técnicas
- App próprio (não Sheets/AppSheet): React + Vite + TypeScript, PWA, rotas por hash.
- Firebase plano gratuito (Spark): Firestore com cache offline. Acesso só com a senha da equipe (uma conta
  e-mail/senha compartilhada, e-mail em `VITE_EQUIPE_EMAIL`), digitada uma vez por celular. Sem Cloud Storage
  (exige plano pago), então a foto comprimida (~120 KB) vai em `fotos/{id}` e a miniatura no item.
- Sem variáveis do Firebase → "modo demonstração" (IndexedDB, dados só no aparelho).
- Firebase configurado em 07/10/2026: projeto `inventario-chacara`, Firestore `(default)` em São Paulo,
  conta da equipe `equipe@inventario-chacara.app`. Variáveis no `.env.local` (fora do git) e nas
  Variables do repositório no GitHub. Senha atual é fraca: trocar antes do teste real (04/11).
- Deploy: GitHub Pages via Actions a cada push na `main` → https://mateusfalkowski.github.io/inventario-chacara/
- Listas provisórias em `src/config.ts` (categorias/estados → Equipe 3, locais → Equipe 5).
- Escopo da Equipe 1 = ferramenta interna de cadastro. Vitrine/catálogo público é da Equipe 6 (não fazer aqui);
  a integração com ela é exportar dados.
- Destino previsto no cadastro (pedido da Equipe 3: destinar na recepção). Quantidade nunca é sobrescrita:
  correções viram movimento `ajuste` no histórico.
- Pendências: trocar a senha da equipe, campo de preço (Equipe 4), exportação para a vitrine (Equipe 6).

## Fluxo
Fazer as mudanças, rodar `npm run build` para checar tipos, e perguntar antes de commit/push.
