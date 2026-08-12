# Estado da branch `dev` — revisão de 2026-08-02

Segue-se a `docs/revisao-home-publica.md` (2026-07-31). Analisa os 14 commits desde então
(`276be8c..HEAD`), de `Maxwell Siqueira`, `TerresFe` e `Alysson Sene`. **Veredito: sim, o projeto está no
caminho certo** — os 4 problemas do relatório anterior foram atacados de propósito, com evidência clara de
que a constituição foi lida e seguida, não só "código que por acaso ficou melhor".

## Saúde geral

`typecheck`, `lint` e `test:run` passam limpos — 8 testes (antes eram 2), incluindo os primeiros testes de
`marketplace` (`search.test.ts`) além dos de `properties`. Nenhuma mudança em `docs/`, `specs/` ou
`.specify/` neste intervalo — a base de decisões documentadas ficou intacta.

## O que foi corrigido (com evidência)

### 1. Home pública decomposta em módulos (Princípio I)

`(public)/page.tsx` caiu de ~1.200 linhas para 5:

```tsx
import { HomePageClient } from '@modules/marketplace'
export default function HomePage() {
  return <HomePageClient />
}
```

O conteúdo virou ~20 arquivos pequenos e nomeados: `HeroSection`, `DesktopSearchBar`, `MobileSearchBox`,
`PriceRangeMenu`, `TextSearchMenu`, `FeaturedPropertiesSection`, `MiniPropertiesSection`,
`HeroBrandVideo`... em `src/modules/marketplace/components/`, mais `HomeHeader`, `ProfileModal`,
`SiteFooter` em `src/shared/components/layout/` (certo, já que são de layout geral, não específicos do
domínio marketplace). Config (`navigation.ts`, `search-filters.ts`) e lógica de busca (`utils/search.ts`,
com teste) também separados. Exatamente o padrão pedido.

### 2. Zero cor "chumbada" — sistema de tokens ficou mais robusto que o pedido (Princípio IV)

`grep` por hex/rgba soltos fora de `tokens.ts` em `modules/marketplace` e `shared/components`: **zero
ocorrências**. `tokens.ts` cresceu de ~80 para 299 linhas, com camadas semânticas novas: `surface`, `alpha`,
`shadows`, `gradients`, `componentText`, `iconSize`, `motion`, `zIndex` — não só a paleta bruta. Ex.:
`bgcolor: surface.app` no lugar do antigo `bgcolor: '#F7F8FA'`. Isso resolve o problema de forma mais
sólida do que eu tinha sugerido (eu tinha sugerido só usar `theme.palette` + `alpha()` do MUI; eles
construíram uma camada de tokens semânticos própria, o que é ainda melhor para white-label por tenant).

### 3. Multi-tenant: sessão e tenant agora sincronizados de verdade (Princípio II)

Novo par `HttpClientSessionBridge` + `useHttpClientSessionSync`: observa a sessão do NextAuth e propaga
`accessToken`/`tenantId` para o `HttpClient` e o `useTenantStore` automaticamente a cada mudança de sessão.
Antes esse fiação não existia — era um "buraco" real entre auth e as chamadas HTTP. Bem implementado (dois
`useEffect` pequenos, cada um com sua responsabilidade).

### 4. Migration do banco commitada corretamente

`apps/web/prisma/migrations/20260731223458_/migration.sql` (282 linhas) — a primeira migration, gerada e
commitada por você mesmo. `schema.prisma` não mudou desde o fundamento do BFF — sem drift.

## O que ainda não foi resolvido (não é regressão — é o que falta, e um ponto sutil)

### `'use client'` ainda envolve a página inteira — o problema de SSR/SEO não foi corrigido, só mudou de lugar

`HomePageClient.tsx` (para onde o antigo `page.tsx` foi movido quase por completo) começa com `'use client'`
na linha 1 e renderiza tudo — header, hero, cards, footer — dentro desse mesmo componente client. A
decomposição em componentes menores é ótima para manutenção, mas **não devolveu a renderização no
servidor**: a árvore inteira debaixo de `<HomePageClient />` continua sendo client-side. Esse é o tipo de
problema fácil de achar "resolvido" numa revisão superficial (o código ficou muito mais limpo!) mas que
continua ali. Se SEO da home pública importa (é o motivo dela existir como Server Component, conforme
`plan.md` da spec 001), o próximo passo é: `page.tsx` fica Server Component de verdade, e só o que
realmente precisa de estado no cliente (o dropdown de busca, o modal de perfil) vira ilha client,
recebendo os dados estáticos (categorias, imóveis em destaque) como props do server.

### Perfil de usuário "logado" ainda fake, ainda numa página sem login

`modules/marketplace/data/user-profile.ts` continua com `userProfile`/`profileActions` (incluindo "Sair")
hardcoded — mesmo dado da revisão anterior, só que agora isolado num arquivo próprio em vez de inline. Bom
passo de organização, mas o problema conceitual permanece: a home pública mostra um perfil logado sem
sessão real. Sugestão: marcar explicitamente como mock (`// TODO: substituir por sessão real quando US2
tiver autenticação`, ou nome do arquivo `mock-user-profile.ts`) até virar dado real, e condicionar a
renderização do botão de perfil a `useSession()` de fato.

### BFF: fundação pronta, endpoints ainda não escritos

`src/server/` só tem `db/prisma.ts` e o `README.md` que criamos — nenhum service de domínio
(`properties`, `crm`, `contracts`, `financial`) foi escrito ainda, e não há Route Handlers além do
`[...nextauth]`. Isso é esperado: são exatamente as tarefas T021+ de `specs/002-fundacao-bff-banco/
tasks.md`, ainda não iniciadas. Ponto de atenção prático: `auth-options.ts` ainda chama
`httpClient.post('/auth/login', ...)`, um endpoint que não existe — **login continua não funcional
ponta a ponta** até essa tarefa ser feita.

### Módulos de negócio ainda vazios (esperado, não é alarme)

`auth`, `contracts`, `crm`, `financial`, `maintenance` continuam só com `.gitkeep`. Isso bate com a ordem
de prioridade das user stories da spec 001 (US1 imóvel → US2 proposta → US3 contrato → US4 pagamento) — só
`properties` e `marketplace` tinham motivo pra ter conteúdo até aqui.

## Resumo pra passar pro time

O que eles corrigiram, corrigiram bem e às vezes além do esperado (tokens de design, sincronização de
tenant). O que falta não é "arrumar de novo" — é continuar: (1) devolver a home pública a Server Component
de verdade, isolando só as ilhas interativas; (2) ligar o perfil de usuário a uma sessão real (ou marcar
como mock explícito enquanto isso não existe); (3) começar os endpoints do BFF (`src/server/properties`,
depois `crm`) seguindo `specs/002-fundacao-bff-banco/tasks.md`, que é o que destrava o login de verdade e
os outros módulos.
