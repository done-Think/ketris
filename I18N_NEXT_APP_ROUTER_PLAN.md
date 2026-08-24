# Plano de Implementacao i18n - Ketris + Next.js App Router

Data da revisao: 2026-08-20

Branch correta: `DTK-59/Implement_i18n_Support`

Este documento e um plano de execucao incremental. A regra principal e: implementar em partes pequenas, validar, mostrar o resultado e so entao avancar para a proxima etapa.

## Objetivo

Adicionar suporte a internacionalizacao no `apps/web` usando Next.js App Router e `next-intl`, preservando a arquitetura atual do Ketris.

## Regras da task

- Nao implementar tudo de uma vez.
- Nao mover todas as rotas em uma unica etapa.
- Nao fazer alteracoes direto na `dev`.
- Nao trocar mecanicamente todos os imports de `next/link` e `next/navigation`.
- Nao passar `Link`/wrappers de navegacao como `component={...}` em componentes MUI sem validar build.
- Nao localizar rotas de API.
- Ao adicionar i18n no `middleware.ts`, preservar qualquer logica existente.
- Nao criar comentarios no codigo.
- Nao introduzir strings hardcoded novas em telas.
- Tipos de dominio devem ficar nas pastas `types` dos seus respectivos modulos.
- Formularios devem continuar seguindo RHF + Zod + validators.
- Estilo deve continuar usando tokens/tema, sem inline style novo para resolver i18n.

## Decisao tecnica

Usar `next-intl`.

| Opcao | Decisao | Motivo |
| --- | --- | --- |
| Next.js puro com dicionarios manuais | Nao usar | Exige mais codigo proprio para middleware, mensagens, navegacao e formatos |
| `react-i18next` | Nao usar agora | Menos natural para Server Components e App Router |
| `next-intl` | Usar | Suporta App Router, mensagens, formatacao, Server Components, Client Components e URLs localizadas via `pathnames` |

## Configuracao alvo

| Tema | Decisao |
| --- | --- |
| Locale padrao | `pt-BR` |
| Locale secundario inicial | `en-US` |
| Prefixo do locale padrao | Sem prefixo quando possivel |
| Prefixo de ingles | `/en` |
| Estrategia | Pastas em ingles, URLs publicas localizadas por `pathnames`, textos por locale |
| APIs | Sem mudanca de rota por causa de i18n |
| Middleware | i18n deve ser adicionado sem sobrescrever logicas existentes |
| Rotas internas novas | Ingles |
| Rotas publicas legadas | Preservar no inicio; migrar em task controlada se necessario |

## Estrutura final desejada

```txt
apps/web/src/i18n
├── formats.ts
├── navigation.ts
├── request.ts
├── routing.ts
├── types
│   └── locale.types.ts
└── messages
    ├── en-US
    │   ├── auth.json
    │   ├── common.json
    │   ├── crm.json
    │   ├── dashboard.json
    │   ├── marketplace.json
    │   ├── platform.json
    │   ├── properties.json
    │   └── validation.json
    └── pt-BR
        ├── auth.json
        ├── common.json
        ├── crm.json
        ├── dashboard.json
        ├── marketplace.json
        ├── platform.json
        ├── properties.json
        └── validation.json
```

Estrutura de rotas desejada:

```txt
apps/web/src/app
├── api
│   └── ...
├── layout.tsx
├── global-error.tsx
├── not-found.tsx
└── [locale]
    ├── layout.tsx
    ├── (auth)
    │   ├── login
    │   └── register
    ├── (public)
    │   ├── properties
    │   ├── brokers
    │   └── agencies
    ├── (dashboard)
    ├── (platform)
    ├── (platform-auth)
    └── (admin)
```

Observacao importante: `apps/web/src/app/api` nao deve ser movido. A pasta `[locale]` e tecnica; as pastas de dominio abaixo dela continuam em ingles.

## Checklist mestre

- [x] Branch `DTK-59/Implement_i18n_Support` criada a partir da `dev`.
- [x] Worktree limpa antes de iniciar.
- [x] Plano revisado e aprovado.
- [x] `next-intl` instalado.
- [x] Arquivos base de `src/i18n` criados.
- [x] `next.config.mjs` integrado com `next-intl/plugin` sem quebrar Sentry.
- [x] Estrategia de rotas localizadas configurada.
- [x] Primeiro fluxo piloto conectado ao provider de i18n.
- [x] Provider de i18n validado no fluxo piloto.
- [ ] Troca de idioma validada no fluxo piloto.
- [x] Mensagens de `pt-BR` da rota piloto migradas.
- [x] Mensagens de `en-US` da rota piloto migradas.
- [ ] MUI Date Pickers/Data Grid planejados por locale.
- [ ] Formularios piloto mantidos com RHF + Zod.
- [ ] Build validado apos cada bloco relevante.
- [ ] Rotas restantes migradas por modulo.
- [ ] Checklist de code review executado.

## Etapa 0 - Preparacao

Objetivo: garantir que a branch e o estado local estao corretos.

Arquivos permitidos: nenhum arquivo de codigo.

Comandos:

```bash
git branch --show-current
git status --short
```

Checklist:

- [x] Branch atual e `DTK-59/Implement_i18n_Support`.
- [x] `git status --short` esta limpo ou contem apenas este `.md`.
- [x] `dev` esta atualizada antes de iniciar implementacao.

Parar e mostrar:

- Branch atual.
- Status da worktree.

## Etapa 1 - Dependencia e infraestrutura vazia

Objetivo: adicionar a dependencia e criar somente a base de configuracao i18n, sem mover rotas.

Arquivos permitidos:

- `apps/web/package.json`
- `package-lock.json`
- `apps/web/src/i18n/routing.ts`
- `apps/web/src/i18n/request.ts`
- `apps/web/src/i18n/formats.ts`
- `apps/web/src/i18n/navigation.ts`
- `apps/web/src/i18n/types/locale.types.ts`
- `apps/web/src/i18n/messages/**`

Checklist:

- [x] Instalar `next-intl` no workspace web.
- [x] Criar `AppLocale` em `apps/web/src/i18n/types/locale.types.ts`.
- [x] Criar `routing.ts` com `pt-BR`, `en-US`, `defaultLocale`.
- [x] Configurar prefixo publico `/en` para `en-US`.
- [x] Configurar mapa inicial de `pathnames` para rotas publicas.
- [x] Criar `request.ts` com carregamento de mensagens.
- [x] Criar `formats.ts` com formatos iniciais de data/moeda.
- [x] Criar JSONs vazios por modulo.
- [x] Criar `common.json` com mensagens minimas para `pt-BR` e `en-US`.

Validacao:

```bash
npm run typecheck
```

Parar e mostrar:

- Lista de arquivos criados.
- Resultado do typecheck.

Nao fazer nesta etapa:

- [ ] Nao mover rotas.
- [ ] Nao alterar middleware.
- [ ] Nao trocar imports de `next/link`.
- [ ] Nao alterar textos das telas.

## Etapa 2 - Plugin do Next

Objetivo: integrar `next-intl/plugin` no `next.config.mjs` preservando o que ja existe.

Arquivos permitidos:

- `apps/web/next.config.mjs`

Checklist:

- [x] Importar `createNextIntlPlugin`.
- [x] Criar `withNextIntl`.
- [x] Preservar `withSentryConfig`.
- [x] Preservar `experimental`.
- [x] Preservar `images`.
- [x] Preservar `transpilePackages`.
- [x] Preservar `webpack`.
- [x] Remover comentarios em portugues se tocar no arquivo.

Validacao:

```bash
npm run typecheck
npm run lint
```

Parar e mostrar:

- Diff resumido do `next.config.mjs`.
- Resultado de typecheck/lint.

## Etapa 3 - Rotas localizadas

Objetivo: definir como o servidor descobre o idioma ativo e como URLs publicas serao traduzidas sem renomear pastas internas para portugues.

Arquivos permitidos:

- `apps/web/src/i18n/request.ts`
- `apps/web/src/i18n/routing.ts`
- `apps/web/src/middleware.ts`

Checklist:

- [x] Usar `localePrefix: 'as-needed'`.
- [x] Manter `pt-BR` sem prefixo quando possivel.
- [x] Usar `/en` para `en-US`.
- [x] Configurar `pathnames` para rotas publicas localizadas.
- [x] Manter pathnames canonicos e pastas em ingles.
- [x] Usar `pt-BR` como fallback.
- [ ] Ao trocar idioma, navegar para a URL equivalente no novo locale.
- [x] Se tocar em `middleware.ts`, preservar fluxos ja existentes no arquivo.
- [x] Se tocar em `middleware.ts`, excluir `_next`, `_vercel`, assets e arquivos com extensao.

Fluxo esperado:

```txt
1. Request chega em /imoveis ou /en/properties
2. Middleware identifica o locale pela URL
3. next-intl resolve a rota canonica interna /properties
4. Server carrega mensagens do locale correto
5. Componentes usam pastas e imports em ingles
```

Validacao:

```bash
npm run typecheck
npm run lint
```

Parar e mostrar:

- Mapa inicial de `pathnames`.
- Arquivos alterados.
- Como a logica anterior do middleware foi preservada.

Nao fazer nesta etapa:

- [ ] Nao mover `app/api`.
- [ ] Nao mover paginas.
- [ ] Nao alterar contratos de API.

## Etapa 4 - Provider e fluxo piloto minimo

Objetivo: validar i18n no menor fluxo possivel, com URL localizada e pastas internas em ingles.

Rota piloto recomendada: auth pública.

Rotas candidatas:

- `/login`
- `/register`
- `/forgot-password`

Arquivos permitidos:

- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/providers.tsx`
- `apps/web/src/app/(auth)/**`
- componentes de auth diretamente usados pela rota piloto
- mensagens `auth.json`, `common.json`, `validation.json`

Checklist:

- [ ] Manter pastas internas em ingles.
- [ ] Resolver locale pela URL.
- [ ] Definir `html lang` com o locale resolvido, se tecnicamente viavel nesta etapa.
- [ ] Adicionar `NextIntlClientProvider`.
- [ ] Manter demais rotas no lugar.
- [ ] Garantir que `/api` nao mudou.

Validacao manual:

- [ ] `/login` abre em `pt-BR`.
- [ ] `/en/login` abre em `en-US`.
- [ ] `/register` abre em `pt-BR`.
- [ ] `/en/register` abre em `en-US`.
- [ ] `/forgot-password` abre em `pt-BR`.
- [ ] `/en/forgot-password` abre em `en-US`.

Validacao tecnica:

```bash
npm run typecheck
npm run lint
npm run build
```

Parar e mostrar:

- Rotas/pastas internas mantidas em ingles.
- Arquivos conectados ao provider.
- Resultado dos comandos.

## Etapa 5 - Seletor de idioma seguro no fluxo piloto

Objetivo: permitir que o usuario escolha o idioma navegando para a URL equivalente localizada.

Arquivos permitidos:

- componentes de auth envolvidos nas rotas piloto
- `apps/web/src/i18n/navigation.ts`
- helpers pequenos de path, se necessario

Checklist:

- [ ] Nao substituir todos os imports de `next/link` do projeto.
- [ ] Alterar locale via API de navegacao do `next-intl`.
- [ ] Navegar para a URL equivalente no idioma escolhido.
- [ ] Garantir que os hrefs canonicos continuam definidos em ingles no codigo.
- [ ] Garantir que redirects do fluxo piloto usam pathnames canonicos em ingles.
- [ ] `callbackUrl` continua funcionando.

Armadilha conhecida:

Trocar idioma apenas com `useState` local muda o visual do seletor, mas nao muda a URL nem o idioma real da aplicacao.

Validacao:

```bash
npm run typecheck
npm run lint
npm run build
```

Parar e mostrar:

- Quais links foram alterados.
- Quais links ficaram para depois.

## Etapa 6 - Mensagens da rota piloto

Objetivo: remover hardcoded strings somente da rota piloto.

Arquivos permitidos:

- `apps/web/src/i18n/messages/pt-BR/auth.json`
- `apps/web/src/i18n/messages/en-US/auth.json`
- `apps/web/src/i18n/messages/pt-BR/common.json`
- `apps/web/src/i18n/messages/en-US/common.json`
- componentes de auth usados nas rotas piloto

Checklist:

- [ ] Criar chaves por contexto.
- [ ] Evitar chaves genericas como `title`, `text1`, `button`.
- [ ] Migrar labels.
- [ ] Migrar placeholders.
- [ ] Migrar botoes.
- [ ] Migrar mensagens de erro visiveis.
- [ ] Manter `pt-BR` igual ao texto atual.
- [ ] Criar `en-US` funcional.

Padrao recomendado:

```json
{
  "login": {
    "title": "Entrar",
    "actions": {
      "submit": "Entrar"
    }
  }
}
```

Validacao:

```bash
npm run typecheck
npm run lint
```

Validacao manual:

- [ ] Trocar locale muda os textos da rota piloto.
- [ ] Layout nao quebra com textos maiores em ingles.

## Etapa 7 - Formularios piloto com RHF + Zod

Objetivo: internacionalizar validacoes sem quebrar o padrao do projeto.

Arquivos permitidos:

- schemas do modulo auth
- validators do modulo auth, se existirem
- types do modulo auth, se necessario
- mensagens `validation.json`

Checklist:

- [ ] Nao criar tipos dentro dos componentes.
- [ ] Manter tipos em `apps/web/src/modules/auth/types`.
- [ ] Manter schemas em `apps/web/src/modules/auth/schemas`.
- [ ] Manter RHF + `zodResolver`.
- [ ] Preferir schema factory quando a mensagem depender de `t`.
- [ ] Alternativamente, schemas retornam chaves e o componente traduz.

Exemplo de direcao:

```ts
export function createLoginSchema(t: (key: string) => string) {
  return z.object({
    email: z.string().email(t('validation.email.invalid')),
  })
}
```

Validacao:

```bash
npm run typecheck
npm run test:run
```

Parar e mostrar:

- Schemas tocados.
- Mensagens de validacao criadas.

## Etapa 8 - MUI locale

Objetivo: preparar datas, calendario e componentes MUI para locale.

Arquivos permitidos:

- provider global/client do app
- mensagens comuns, se necessario

Checklist:

- [ ] `LocalizationProvider` usa locale atual.
- [ ] Day.js carrega `pt-br`.
- [ ] Day.js carrega `en`.
- [ ] Data Grid recebe `localeText` quando for tocado.
- [ ] Datas usam formatter por locale.
- [ ] Moedas seguem decisao de produto.

Decisao de produto inicial:

- Imoveis continuam em `BRL` mesmo em `en-US`.

Validacao:

```bash
npm run typecheck
npm run lint
```

## Etapa 9 - Migracao por modulo

Objetivo: expandir i18n depois da rota piloto validada.

Ordem recomendada:

1. Auth completo.
2. Public home.
3. Marketplace publico.
4. Dashboard shell.
5. Properties dashboard.
6. CRM.
7. Platform.
8. Backoffice.

Checklist por modulo:

- [ ] Mover somente as rotas do modulo.
- [ ] Migrar somente mensagens do modulo.
- [ ] Ajustar somente links do modulo.
- [ ] Ajustar somente redirects do modulo.
- [ ] Validar typecheck.
- [ ] Validar lint.
- [ ] Validar build quando houver mudanca de rota/layout.
- [ ] Mostrar diff resumido antes de seguir para o proximo modulo.

Nao fazer:

- [ ] Nao alterar estilos.
- [ ] Nao refatorar componentes fora da necessidade de i18n.
- [ ] Nao mudar comportamento de negocio.
- [ ] Nao renomear rotas portuguesas no mesmo PR sem decisao explicita.

## Etapa 10 - Rotas em ingles

Objetivo: alinhar regra de pastas internas em ingles com URLs publicas traduzidas.

Checklist:

- [ ] Listar rotas com segmentos em portugues.
- [ ] Separar rotas internas de rotas publicas indexadas.
- [ ] Definir quais URLs precisam compatibilidade.
- [ ] Usar `pathnames` para traduzir URL por idioma.
- [ ] Criar redirects se alguma URL publica legada mudar.
- [ ] Validar SEO antes de trocar marketplace publico.

Rotas existentes que exigem decisao:

| Rota atual | Possivel rota interna em ingles | Observacao |
| --- | --- | --- |
| `/imoveis` | `/properties` | Publica e sensivel a SEO |
| `/corretores` | `/brokers` | Publica |
| `/imobiliarias` | `/agencies` | Publica |
| `/dashboard/imoveis` | `/dashboard/properties` | Interna |
| `/dashboard/propostas` | `/dashboard/proposals` | Interna |
| `/dashboard/financeiro` | `/dashboard/financial` | Interna |

Recomendacao: pathnames canonicos e pastas em ingles; URLs publicas localizadas para cada idioma.

## Etapa 11 - SEO e metadata

Objetivo: localizar metadata das paginas publicas.

Checklist:

- [ ] Home publica tem metadata por locale.
- [ ] Lista de imoveis tem metadata por locale.
- [ ] Detalhe de imovel tem metadata por locale.
- [ ] Corretores tem metadata por locale.
- [ ] Imobiliarias tem metadata por locale.
- [ ] `alternates.languages` definido quando aplicavel.
- [ ] `hreflang` validado.

Validacao:

```bash
npm run build
```

## Etapa 12 - Validacao final

Comandos:

```bash
npm run typecheck
npm run lint
npm run test:run
npm run build
```

Checklist manual:

- [ ] `/login` funciona.
- [ ] `/en/login` funciona.
- [ ] `/register` funciona.
- [ ] `/en/register` funciona.
- [ ] `/imoveis` funciona em `pt-BR`.
- [ ] O codigo usa `/properties` como pathname canonico interno.
- [ ] `/en/properties` funciona em `en-US`.
- [ ] `/dashboard` redireciona corretamente se sem sessao.
- [ ] Rotas de API continuam sem locale.
- [ ] Links internos usam pathnames canonicos em ingles no codigo.
- [ ] Textos maiores em ingles nao quebram layout.
- [ ] Form validation troca idioma.
- [ ] Datas e moedas aparecem corretamente.

## Checklist de code review

| Area | Checklist |
| --- | --- |
| Arquitetura | Pastas e pathnames canonicos em ingles; URLs publicas localizadas via `pathnames` |
| API | Rotas de API sem mudanca por causa de i18n |
| Middleware | Logicas existentes preservadas |
| Next config | Sentry preservado |
| Mensagens | Sem hardcoded string nova em telas tocadas |
| Tipos | Tipos de dominio nas pastas `types` dos modulos |
| Forms | RHF + Zod + validators mantidos |
| Componentes | Sem tipos de dominio dentro do componente |
| MUI | Sem `component={Link}` inseguro sem build validado |
| Estilo | Sem inline style novo |
| Comentarios | Sem comentarios em codigo |
| Testes | Typecheck, lint, tests e build executados |

## Comandos uteis

Ver branch e status:

```bash
git branch --show-current
git status --short
```

Procurar strings em portugues:

```bash
rg '"[^"]*[áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ][^"]*"' apps/web/src
```

Procurar imports de navegacao:

```bash
rg "from 'next/(link|navigation)'" apps/web/src
```

Procurar redirects:

```bash
rg "redirect\\(|router\\.push|router\\.replace" apps/web/src
```

Procurar mensagens de validacao:

```bash
rg "required|obrigatorio|obrigatória|inválido|invalido|mínimo|email" apps/web/src/modules apps/web/src/server
```

## Criterio de sucesso por etapa

Uma etapa so esta concluida quando:

- [ ] O escopo da etapa foi respeitado.
- [ ] Nenhum arquivo fora da lista permitida foi alterado sem justificativa.
- [ ] Typecheck passou, quando aplicavel.
- [ ] Lint passou, quando aplicavel.
- [ ] Build passou, quando a etapa mexer em App Router/layout/middleware.
- [ ] Foi apresentado resumo do diff.
- [ ] Foi pedido ok antes de avancar para a proxima etapa.

## Fontes oficiais

- Next.js App Router Internationalization: https://nextjs.org/docs/app/guides/internationalization
- next-intl App Router Getting Started: https://next-intl.dev/docs/getting-started/app-router
- next-intl Routing Setup: https://next-intl.dev/docs/routing/setup
- next-intl Routing Configuration: https://next-intl.dev/docs/routing/configuration
- next-intl Navigation APIs: https://next-intl.dev/docs/routing/navigation
- next-intl Middleware: https://next-intl.dev/docs/routing/middleware
