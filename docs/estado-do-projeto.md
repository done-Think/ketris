# Ketris — Estado do Projeto (leia isto primeiro)

Este documento é o ponto de entrada. Resume tudo que foi decidido e construído até agora, para quem (pessoa ou IA) for continuar o trabalho não precisar reconstruir o contexto do zero.

Última atualização: 29/07/2026.

---

## 1. O que é o projeto

Ketris é uma plataforma SaaS multi-tenant para o mercado imobiliário — não um portal de anúncios, mas a infraestrutura que conecta proprietários, corretores, imobiliárias, construtoras e locatários (cadastro de imóvel → publicação → CRM → proposta → contrato → assinatura → pagamento → manutenção). Ver `docs/planejamento-produto.md` para o inventário completo de módulos e funcionalidades.

Posicionamento: infraestrutura tecnológica moderna, referência em Stripe/Vercel/Linear — não em portais imobiliários tradicionais.

---

## 2. Identidade visual — ATENÇÃO: mudou

A paleta de cores passou por uma revisão. **A versão atual e válida é magenta + grafite.**

| | |
|---|---|
| Primária | Magenta/Fúcsia `#F30274` |
| Estrutura | Grafite `#212631` |

Existiu uma versão anterior (navy `#052063` + ciano `#01B1DA`) que foi **descartada** por ficar parecida demais com outros produtos do mercado (feedback: "parece o app do Quinto Andar"). Se encontrar qualquer referência a navy/ciano em conversas antigas, sabe que é obsoleto — a fonte de verdade é `docs/design-system.md`.

O código do tema (`src/shared/theme/tokens.ts` e `theme.ts`) **já foi atualizado** para a paleta nova.

Logo oficial: símbolo (prédio + rede de nós conectados) + wordmark "Ketris", nas cores magenta/grafite. A logo em si (arquivo de imagem) não está neste pacote — foi enviada em uma conversa anterior e precisa ser recuperada/anexada separadamente para uso no Figma ou no código (favicon, etc).

---

## 3. Stack técnica (definida e parcialmente implementada)

Resumo — detalhes completos em `docs/stack.md`.

**Frontend:**
- Next.js 14+ (App Router) + TypeScript
- Material UI v6 (MUI) — NÃO Tailwind (decisão explícita do time)
- Zustand (estado global) + TanStack Query (estado de servidor/cache)
- React Hook Form + Zod (formulários e validação; evitar `useState` para estado de input)
- Axios instanciado como classe (`src/shared/lib/api/http-client.ts`), extensível
- NextAuth.js (autenticação)
- MapLibre GL (mapas — escolhido por ser open-source e sem custo de licença, ao contrário de Google Maps/Mapbox)
- Day.js (datas) + react-imask (máscaras BR: CPF, CNPJ, telefone, CEP)
- MUI X DataGrid e MUI X Charts (versões gratuitas/MIT)
- react-dropzone (upload — arquivos sempre passam pelo backend antes de irem ao S3, nunca upload direto do navegador)
- Notistack (toasts)
- Sentry (observabilidade, desde o início)
- Vitest + Testing Library (unit/componente, desde o início) + Cypress (E2E)
- ESLint + Prettier + Husky + lint-staged + Commitlint
- Convenções de estilo: **2 espaços, sem ponto e vírgula, aspas simples**
- Organização: **modular/feature-based** (`src/modules/<dominio>/{components,hooks,services,stores,schemas,types}`)

**Backend:** ainda não definido — próximo passo pendente.

---

## 4. Estado do código (este repositório)

O projeto já está **scaffoldado** — não é só planejamento, há código real:

```
├── src/app/            → rotas Next.js (App Router)
│   ├── (public)/       → marketplace público (SSR/SEO) — Home e /imoveis stub
│   ├── (auth)/         → login stub
│   ├── (dashboard)/    → área autenticada stub
│   └── api/auth/       → rota NextAuth configurada
├── src/modules/
│   ├── properties/     → MÓDULO DE REFERÊNCIA, implementado por completo:
│   │                      schema Zod → types → service (estende BaseService) → hook React Query → barrel index.ts
│   └── auth, marketplace, crm, contracts, financial, maintenance/
│                        → esqueleto de pastas + README apontando para properties como padrão
├── src/shared/
│   ├── theme/           → tokens.ts + theme.ts (ATUALIZADO para magenta/grafite)
│   ├── lib/api/          → HttpClient (Axios como classe) + BaseService
│   ├── lib/auth/          → authOptions do NextAuth
│   ├── lib/query/         → configuração do TanStack Query
│   ├── stores/            → useTenantStore (Zustand, multi-tenant)
│   └── lib/utils/          → formatCurrency, formatDate (com teste Vitest)
└── docs/                 → toda a documentação do projeto (ver seção 5)
```

Todas as configs de projeto estão prontas e funcionais: `package.json` com todas as dependências, `tsconfig.json`, `next.config.mjs` (com Sentry), ESLint/Prettier/Husky/Commitlint configurados com as regras de estilo do time, Vitest e Cypress configurados, `.env.example`.

**O que NÃO está implementado ainda:** o conteúdo real das telas (estão como stubs "a implementar"), os demais módulos de domínio (só `properties` tem exemplo completo), e todo o backend.

**Ação recomendada ao abrir o projeto:** rodar `npm install` (não incluído no zip) e `cp .env.example .env`. Vale checar se as versões das dependências no `package.json` ainda são as mais recentes/estáveis — foram fixadas com base em conhecimento até jan/2026.

---

## 5. Mapa da documentação (pasta `docs/`)

| Arquivo | Conteúdo |
|---|---|
| `docs/stack.md` | Todas as decisões de stack técnica, com justificativas e pendências em aberto |
| `docs/design-system.md` | Design system completo e ATUAL (magenta/grafite): escalas de cor, tipografia, espaçamento, sombras, config MUI pronta |
| `docs/requisitos.md` | Inventário completo de telas e funcionalidades, dividido em tarefas de backlog por módulo, com complexidade estimada (🟢🟡🔴) |
| `docs/planejamento-produto.md` | Levantamento completo do produto (todas as funcionalidades possíveis, por módulo, com dependências entre elas) — usado para decidir prioridades de fase |
| `docs/figma/checkpoint.md` | Estado do arquivo Figma na última vez que foi trabalhado (ver seção 6) |
| `docs/figma/prompt-01-base.md` | Primeiro prompt de design gerado (paleta antiga navy/ciano — **obsoleto**, mantido por histórico) |
| `docs/figma/prompt-02-complemento.md` | Complemento do prompt base: telas desktop + painéis administrativos (paleta antiga — estrutura ainda válida, cores desatualizadas) |
| `docs/figma/prompt-03-paleta-magenta.md` | **Prompt atual e válido** — direção de arte moderna + paleta magenta/grafite completa, todos os blocos de tela |
| `docs/figma/prompt-04-logo.md` | Prompt para incorporar a logo oficial (arquivo de imagem) às telas já geradas no Figma |

---

## 6. Estado do design no Figma

Havia um arquivo Figma em construção (`https://www.figma.com/design/ATLFRX7xSEEdllto86Ayvj/Ketris`) com fundação (variáveis, tipografia, sombras) e ~8 telas construídas via MCP, **mas na paleta antiga (navy/ciano)**, antes da revisão de identidade. Ver `docs/figma/checkpoint.md` para o detalhe exato de IDs e telas.

**Duas rotas possíveis a partir daqui:**
1. Atualizar as variáveis de cor desse arquivo existente (navy→grafite, ciano→magenta) — como as telas usam variáveis vinculadas, a propagação seria automática.
2. Começar as telas do zero usando o prompt atual (`docs/figma/prompt-03-paleta-magenta.md`), que já tem a direção de arte mais madura (profundidade em camadas, gradientes, glass, detalhe gráfico da marca) — mais rico que o prompt original.

Havia também uma limitação de conta: o arquivo Figma estava no **plano Starter**, que limita a 3 páginas e tem teto de chamadas via MCP — isso tornou a geração de telas via MCP lenta/travada. Se for continuar via MCP do Figma, vale considerar upgrade de plano.

A logo oficial (magenta/grafite, símbolo de prédio + rede de nós) foi definida mas o arquivo de imagem não está neste pacote — precisa ser recuperado da conversa onde foi enviada, ou re-gerado, antes de aplicar via `prompt-04-logo.md`.

---

## 7. Decisões em aberto (pendentes de validação humana)

- Fonte de display: Space Grotesk vs Sora (Inter para corpo já está decidido)
- Dark mode: entra no MVP ou fase posterior? (a base já existe no tema/código)
- Cores semânticas (success/warning/error/info): valores atuais são propostos, não validados com o time
- **Backend**: stack ainda não definida — é o próximo grande bloco de decisão
- Prioridade de fases (v1/v2/v3) do produto: o `docs/planejamento-produto.md` e `docs/requisitos.md` dão o inventário completo, mas a decisão de o que entra em cada fase é do time, não foi feita ainda

---

## 8. Sugestão de próximos passos

1. Rodar `npm install` e subir o projeto localmente para validar que o scaffold funciona
2. Decidir e documentar a stack de backend (mesmo processo usado para o front, ver `docs/stack.md` como referência de formato)
3. Recuperar/confirmar o arquivo da logo e decidir a rota do Figma (atualizar cores existentes vs recomeçar telas com o prompt novo)
4. Escolher o perfil de usuário e o loop mínimo de valor para a primeira fase de desenvolvimento (critérios sugeridos em `docs/planejamento-produto.md`, seção "Como usar este documento")
5. Começar a implementar os módulos de domínio usando `src/modules/properties` como padrão de referência
