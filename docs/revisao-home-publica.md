# Revisão de arquitetura: `app/(public)/page.tsx`

Análise de `apps/web/src/app/(public)/page.tsx` (home pública), que recebeu as mudanças mais recentes de UI
(commits `2993b36` "feat: atualiza landing publica do Ketris" e `60f0984` "feat: refina home publica e
identidade visual", autor `TerresFe`). Objetivo: usar como material de conversa/onboarding com o time —
não é sobre "quem errou", é sobre alinhar onde cada tipo de código deve morar neste projeto.

## 1. Route Groups do Next.js (`(nome)`)

Pastas entre parênteses em `src/app/` são **Route Groups**: organizam rotas e permitem layouts próprios,
mas **não entram na URL final**. `app/(public)/imoveis/page.tsx` → rota `/imoveis`. Usamos 3 grupos:
`(public)` (marketplace sem login), `(auth)` (login/cadastro) e `(dashboard)` (área autenticada) — cada um
pode ter seu próprio `layout.tsx` sem precisar de um prefixo `/public/...` na URL.

## 2. O que está fora do lugar em `(public)/page.tsx`

### a) A página inteira virou Client Component, anulando o motivo da rota existir

Linha 1: `'use client'` no topo do arquivo transforma **tudo** — hero, cards, footer — em renderização no
cliente. Só uma fração da página precisa de interatividade real (o dropdown de busca, o popover de perfil).
O próprio comentário na linha 208 diz `// Home / marketplace público — renderizada no servidor (SEO)` —
mas isso é falso: a diretiva `use client` contradiz o comentário. `plan.md` da spec 001 é explícito sobre o
porquê dessa rota existir: "SSR/ISR nas páginas públicas do marketplace para SEO". Com `use client` no
topo, esse objetivo simplesmente não é atingido.

**Como devia ser**: a página continua Server Component (sem `use client`); só os pedaços realmente
interativos (busca com dropdown, popover de perfil) viram componentes filhos próprios, cada um com seu
próprio `use client`, vivendo em `src/modules/marketplace/components/`.

### b) ~1.200 linhas de JSX num único arquivo, direto dentro de `app/`

Header, navegação, popover de perfil, hero, busca, grid de categorias, cards de imóveis em destaque,
mini-cards, footer — tudo inline no mesmo `page.tsx`. Isso é exatamente o que o **Princípio I** da
constituição proíbe: *"Todo código de produto vive em `src/modules/<dominio>/{components,hooks,services,
stores,schemas,types}`"*. Nada disso foi extraído — `src/modules/marketplace/components/` está vazio (só
tem `.gitkeep`).

**Como devia ser** (o módulo `properties` é a referência oficial — é o único módulo com conteúdo real):
componentes pequenos e nomeados (`<SiteHeader />`, `<ProfileMenu />`, `<HeroSearch />`,
`<FeaturedPropertiesGrid />`, `<SiteFooter />`) em `src/modules/marketplace/components/` e
`src/shared/components/layout/`. O `page.tsx` deveria só importar e compor esses componentes.

### c) Cores "chumbadas" duplicando tokens que já existem

`src/shared/theme/tokens.ts` já define a paleta oficial: `brand.magenta[500] = '#F30274'`,
`brand.graphite[500] = '#212631'`, `brand.graphite[900] = '#0D0F14'`. No `page.tsx`, essas mesmas cores
foram redigitadas na mão, repetidas vezes, como hex/rgba soltos:

- `bgcolor: '#0D0F14'` e `rgba(13, 15, 20, 0.48)` → é `graphite[900]` (13,15,20 = 0x0D,0x0F,0x14)
- `bgcolor: '#212631'` (footer) → é `graphite[500]`
- `rgba(243, 2, 116, 0.08)` (repetido ~6 vezes) e `linear-gradient(135deg, #F30274 0%, #5B123D 100%)` → é
  `magenta[500]` (243,2,116 = 0xF3,0x02,0x74)

Isso viola o **Princípio IV**: *"cores 'chumbadas' no código são proibidas"*. Problema prático: se a marca
mudar de tom, ou quando entrar white-label por tenant (já previsto em `docs/stack.md`), alguém vai ter que
caçar essas cores espalhadas em vez de mudar um token só.

**Como devia ser**: usar `theme.palette.primary.main` (já é o magenta) e o helper `alpha()` do MUI —
`alpha(theme.palette.primary.main, 0.08)` — em vez de reescrever hex/rgba na mão.

### d) Dado fake misturado no componente, incluindo um "usuário logado" numa página pública

`userProfile` e `profileActions` (com opção "Sair") aparecem na home **pública**, sem exigir login — mas a
spec 001 (User Story 2) é explícita: o marketplace público não exige conta. Isso mistura a home de
marketing com a área autenticada. Os dados de imóveis (`categories`, `featuredProperties`,
`miniProperties`) também estão hardcoded ali; deveriam vir do módulo `properties`/`marketplace` (mesmo que
como fixture/mock temporário, isolado num arquivo próprio — não misturado no JSX da página).

## O padrão certo — `src/modules/properties` é a referência

```ts
// src/modules/properties/services/properties-service.ts
class PropertiesService extends BaseService {
  private readonly path = '/properties'
  list(): Promise<Property[]> { return this.http.get<Property[]>(this.path) }
  getById(id: string): Promise<Property> { return this.http.get<Property>(`${this.path}/${id}`) }
  create(payload: PropertyFormValues): Promise<Property> { return this.http.post<Property>(this.path, payload) }
  // ...
}
```

Schema Zod → types → service estendendo `BaseService` → hook React Query → componentes. É esse o padrão
que `crm`, `contracts`, `financial`, `marketplace` e `maintenance` devem seguir — hoje todos vazios,
esperando essa implementação (ver `.specify/memory/constitution.md`, Princípio I).

## Sugestão de conversa com o time

Não é sobre reescrever tudo de uma vez — a landing page em si está com boa qualidade visual. É sobre dois
hábitos pra próxima vez: (1) antes de escrever JSX novo, perguntar "isso é HTML de composição de página, ou
é um componente de domínio que deveria morar em `src/modules/<dominio>/components`?"; (2) antes de escrever
uma cor, perguntar "essa cor já existe em `src/shared/theme/tokens.ts`?" — se sim, usar o token/palette, não
o hex.
