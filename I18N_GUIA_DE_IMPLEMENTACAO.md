# Traduzindo o Ketris — guia de implementação

Como escrever um módulo novo já traduzido: onde a frase mora, como nomear a chave, como
chamar `t()` no servidor e no cliente, e o que precisa ser registrado quando você cria uma
pasta dentro de `[locale]`.

Este documento não cobre instalação nem configuração do next-intl — isso já está feito.
Para o *porquê* da escolha da biblioteca, ver `I18N_NEXT_INTL_DECISION.md`.

- **Idiomas:** pt-BR (padrão), en-US, es-ES
- **Namespaces:** 8
- **Stack:** next-intl 4.13 sobre Next 16.3

> Os exemplos seguem o estilo do projeto (`apps/web/.prettierrc`): sem ponto e vírgula,
> aspas simples. Não rode Prettier da raiz neste arquivo — lá não existe config, e os
> defaults invertem esse estilo.

---

## Sumário

1. [O mapa](#1-o-mapa)
2. [Onde a frase mora](#2-onde-a-frase-mora)
3. [As três regras de chave](#3-as-três-regras-de-chave)
4. [Usando `t()`](#4-usando-t)
5. [Variáveis e plural](#5-variáveis-e-plural)
6. [Criando pastas em `[locale]`](#6-criando-pastas-em-locale)
7. [Links e navegação](#7-links-e-navegação)
8. [Metadata e formatação](#8-metadata-e-formatação)
9. [Criando um namespace novo](#9-criando-um-namespace-novo)
10. [Testes](#10-testes)
11. [Checklist de PR](#11-checklist-de-pr)
12. [Pendências conhecidas](#12-pendências-conhecidas)

---

## 1. O mapa

Toda frase visível ao usuário vive em `src/i18n/messages/<locale>/<namespace>.json`.
São 8 namespaces, e cada um existe três vezes — uma por idioma. O nome do arquivo *é* o
namespace de primeiro nível.

| Arquivo | Cobre | Exemplo de chave |
| --- | --- | --- |
| `common.json` | Metadata da aplicação, erros globais, ações compartilhadas | `common.errors.notFound` |
| `auth.json` | Login, cadastro, recuperação de senha, backoffice auth | `auth.login.submit` |
| `marketplace.json` | Home pública, busca, perfis públicos, detalhe de imóvel | `marketplace.searchResults.filters.title` |
| `crm.json` | Pipeline, contatos, oportunidades, propostas | `crm.pipeline.emptyStage` |
| `dashboard.json` | Área logada do corretor — agenda, financeiro, leads | `dashboard.finance.title` |
| `properties.json` | Cadastro e gestão de imóveis | `properties.detail.summaryTitle` |
| `platform.json` | Administração da plataforma — tenants, admins | `platform.forms.slugHelper` |
| `validation.json` | Mensagens de validação — **ainda vazio**, ver [Pendências](#12-pendências-conhecidas) | — |

A URL sempre carrega o prefixo do idioma: `/pt`, `/en`, `/es`. Não existe rota sem prefixo —
`localePrefix` está em modo `always`, e o `proxy.ts` redireciona quem chegar sem ele.

---

## 2. Onde a frase mora

Aninhe por **tela e depois por bloco de UI**, não por tipo de widget. O caminho da chave deve
permitir que alguém localize o texto na interface sem abrir o código.

```jsonc
// src/i18n/messages/pt-BR/crm.json
{
  "pipeline": {
    "emptyStage": "Sem oportunidades nesta etapa.",
    "newOpportunity": "Nova Oportunidade"
  },
  "contacts": {
    "propertyCount": "{count, plural, one {# imóvel} other {# imóveis}}"
  }
}
```

A frase acima é a de **pt-BR**, o idioma de origem. As outras duas repetem a estrutura exata,
traduzindo só o valor:

```text
pt-BR                       en-US                        es-ES
"emptyStage":               "emptyStage":                "emptyStage":
  "Sem oportunidades          "No opportunities            "No hay oportunidades
   nesta etapa."               in this stage."              en esta etapa."
```

> **Nunca deixe um idioma para depois.** Uma chave que existe em pt-BR e falta em en-US quebra
> a página naquele idioma — não é degradação silenciosa. Se você não tem a tradução final,
> escreva a melhor aproximação e sinalize no PR; um texto provisório é recuperável, uma chave
> ausente é um erro em produção.

---

## 3. As três regras de chave

Estas não são preferências de estilo. Cada uma corresponde a um bug que já derrubou alguma
parte da aplicação.

### Regra 1 — A chave não pode conter ponto

O next-intl reserva o `.` para expressar aninhamento: `a.b.c` significa três níveis. Uma chave
com ponto no nome faz `getMessages()` lançar `INVALID_KEY` e derruba o layout inteiro daquele
idioma.

O caso clássico é separador de milhar em português — `"Até R$ 6.000"`.

> Incidente real · commit `d316a1d` · toda renderização de `/[locale]` estourava.

### Regra 2 — A chave é um identificador, não a frase de origem

Usar o texto em português como chave parece prático e é a origem da regra 1. Também amarra o
código ao idioma de origem: mudar a redação em pt-BR quebra os outros dois.

**Não faça:**

```ts
export const priceFilterOptions = [
  { label: 'Até R$ 6.000', max: 6000 },
] as const

// t(`options.${option.label}`) -> options.Até R$ 6.000  💥
```

**Faça:**

```ts
export const priceFilterOptions = [
  { label: 'upTo6000', max: 6000 },
] as const

// t(`options.${option.label}`) -> options.upTo6000  ✓
```

Chaves em `camelCase`, em inglês, descrevendo o *papel* do texto — `emptyStage`, `upTo6000`,
`withParking`. O texto exibido vive só nos arquivos de mensagem.

### Regra 3 — Chave de tradução não entra em estado visível ao usuário

Uma chave é identificador interno. Se ela for parar no valor de um input, numa query string ou
em qualquer texto que o usuário lê, o identificador cru aparece na tela — e qualquer filtro que
compare esse valor contra rótulos traduzidos deixa de casar.

Guarde o identificador no estado da seleção; renderize sempre passando por `t()`.

> Incidente real · escolher "Apartamento" exibia `apartment` no campo de busca.

---

## 4. Usando `t()`

São duas funções, escolhidas pelo tipo de componente. A diferença que importa: no servidor você
precisa do `locale`, e ele vem de `params`, que no Next 16 é uma **Promise**.

| Contexto | Função | Origem do locale |
| --- | --- | --- |
| Client Component (`'use client'`) | `useTranslations(ns)` | Contexto do provider |
| Server Component / page / layout | `await getTranslations({ locale, namespace })` | `await params` |
| `generateMetadata` | `await getTranslations({ locale, namespace })` | `await params` |

### Client Component

`useTranslations` recebe o namespace até o nível do bloco de UI. As chamadas seguintes são
relativas a ele — isso mantém o JSX curto e o namespace num lugar só.

```tsx
'use client'

import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'

export function LoginAccountPrompt() {
  const t = useTranslations('auth.login.prompt')

  return (
    <p>
      {t('question')} <Link href="/register">{t('createAccount')}</Link>
    </p>
  )
}
```

### Server Component

`getTranslations` é assíncrono e recebe `locale` explicitamente. Tipe as props com os helpers de
`@/i18n/types/route.types` em vez de escrever a Promise à mão.

```tsx
import { getTranslations } from 'next-intl/server'

import type { LocaleRoutePageProps } from '@/i18n/types/route.types'

export default async function BrokersPage({ params }: LocaleRoutePageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'marketplace.directory' })

  return <h1>{t('brokers.title')}</h1>
}
```

Aponte o namespace para o bloco, não para o arquivo inteiro. `useTranslations('crm')` e depois
`t('pipeline.emptyStage')` funciona, mas espalha o caminho pelo JSX e dificulta mover o bloco
depois.

---

## 5. Variáveis e plural

As mensagens usam sintaxe ICU. Interpolação simples é só a chave entre chaves; o valor vai no
segundo argumento de `t()`.

```ts
// mensagem — auth.json
// "welcome": "Olá, {name}"

t('welcome', { name: user.name }) // -> "Olá, Alysson"
```

Plural nunca se resolve com `if` no componente. Cada idioma tem regras próprias de
pluralização, e o ICU é quem sabe aplicá-las. O `#` é substituído pelo número.

```ts
// mensagem — crm.json
// "propertyCount": "{count, plural, one {# imóvel} other {# imóveis}}"

t('propertyCount', { count: 3 }) // -> "3 imóveis"
t('propertyCount', { count: 1 }) // -> "1 imóvel"
```

> **Não concatene frases.** `{t('you_have')} {count} {t('properties')}` parece inofensivo e é uma
> armadilha: a ordem das palavras muda entre idiomas, e o tradutor recebe fragmentos sem
> contexto. Uma frase completa é uma chave só, com as variáveis dentro dela.

---

## 6. Criando pastas em `[locale]`

Toda rota da aplicação vive sob `src/app/[locale]/`, dentro de um grupo de rota que define o
layout e o nível de acesso. O grupo entre parênteses não aparece na URL.

| Grupo | Para | URL traduzida? |
| --- | --- | --- |
| `(public)` | Marketplace aberto — imóveis, corretores, imobiliárias | **Sim** |
| `(auth)` | Login, cadastro, recuperação de senha | Não |
| `(dashboard)` | Área do corretor autenticado — CRM, agenda, financeiro | Não |
| `(admin)` | Backoffice do tenant | Não |
| `(platform)` · `(platform-auth)` | Administração da plataforma | Não |

A convenção que decide a última coluna: **rotas públicas têm o caminho traduzido porque são
indexadas por buscadores; rotas autenticadas não.** Ninguém pesquisa no Google por
`/dashboard/leads`, mas pesquisa por imóveis.

### Passo a passo para uma rota nova

**1. Crie a pasta no grupo certo.** O nome da pasta é sempre o caminho **canônico em inglês**,
mesmo quando a URL final for traduzida. A tradução acontece no roteamento, não no sistema de
arquivos.

```text
src/app/[locale]/(public)/developments/page.tsx
```

**2. Registre em `src/i18n/routing.ts`.** Sem isso a rota não é reconhecida pelo `Link` tipado e
não recebe prefixo de idioma. Rota interna mapeia para si mesma; rota pública recebe um objeto
com os três caminhos.

```ts
// src/i18n/routing.ts -> pathnames

// interna: identidade
'/dashboard/leads': '/dashboard/leads',

// pública: um caminho por idioma
'/developments': {
  'pt-BR': '/empreendimentos',
  'en-US': '/developments',
  'es-ES': '/emprendimientos',
},
```

**3. Tipe as props da página.** `LocaleRoutePageProps` aceita params extras e search params como
genéricos. Para rotas dinâmicas, passe o shape do param.

```tsx
import type { LocaleRoutePageProps } from '@/i18n/types/route.types'

export default async function DevelopmentPage({
  params,
}: LocaleRoutePageProps<{ id: string }>) {
  const { locale, id } = await params
  // ...
}
```

**4. Adicione as mensagens nos três arquivos.** Escolha o namespace pelo domínio, não pela rota.
Uma página de empreendimentos no marketplace vai em `marketplace.json`, sob uma chave própria.

---

## 7. Links e navegação

> **Nunca importe de `next/link` ou `next/navigation`.** Os equivalentes localizados vivem em
> `@/i18n/navigation`. Eles aplicam o prefixo de idioma e traduzem o caminho conforme o
> `pathnames`. Um `next/link` gera URL sem prefixo, que o proxy redireciona — custando um
> round-trip e, em rota pública, perdendo o caminho traduzido.

```tsx
import { Link, useRouter, usePathname, redirect } from '@/i18n/navigation'

// caminho simples — o prefixo e a tradução são automáticos
<Link href="/properties">{t('seeAll')}</Link>
// em /pt renderiza  /pt/imoveis
// em /en renderiza  /en/properties

// rota dinâmica — objeto com pathname e params, nunca string interpolada
<Link href={{ pathname: '/properties/[id]', params: { id } }}>
  {property.title}
</Link>

// com query string
<Link href={{ pathname: '/properties', query: { purpose: 'buy' } }}>
  {t('buy')}
</Link>
```

Em código de servidor fora do contexto do roteador — um layout que valida sessão, por exemplo —
use `getLocalizedPathname` de `@/i18n/locale-prefix`:

```ts
import { redirect } from 'next/navigation'

import { getLocalizedPathname } from '@/i18n/locale-prefix'

if (!session) redirect(getLocalizedPathname('/login', locale))
```

---

## 8. Metadata e formatação

### Título e descrição da página

Existe um helper para o caso comum. Ele espera as chaves `metadataTitle` e, opcionalmente,
`metadataDescription` dentro do namespace que você passar.

```tsx
import { createLocalizedMetadata } from '@/i18n/metadata'

export async function generateMetadata({ params }: LocaleRoutePageProps) {
  const { locale } = await params

  return createLocalizedMetadata('marketplace.metadata.brokers', locale)
}
```

### Datas e moeda

Não use `toLocaleDateString` nem formatação manual. Os formatos são centralizados em
`src/i18n/formats.ts`, com fuso `America/Sao_Paulo` — isso é o que garante que servidor e
cliente rendam a mesma string e não haja divergência de hidratação.

```tsx
import { useFormatter } from 'next-intl'

const format = useFormatter()

format.dateTime(entry.date, 'short') // 02/09/2026
format.number(entry.amount, 'currency') // R$ 4.800,00
```

Precisou de um formato novo? Adicione em `formats.ts` e use pelo nome. Um formato inline no
componente é invisível para os outros e diverge com o tempo.

---

## 9. Criando um namespace novo

Só faça isso para um domínio realmente novo — na dúvida, use um dos oito existentes. A lista de
namespaces é declarada explicitamente em **dois lugares**, e esquecer o segundo faz os testes
divergirem da aplicação.

**1. Crie os três arquivos.**

```text
src/i18n/messages/pt-BR/financial.json
src/i18n/messages/en-US/financial.json
src/i18n/messages/es-ES/financial.json
```

**2. Registre em `src/i18n/request.ts`.** É o que carrega as mensagens em runtime. Sem isso o
namespace não existe.

```ts
const [common, auth, /* ... */, financial] = await Promise.all([
  import(`./messages/${locale}/common.json`),
  // ...
  import(`./messages/${locale}/financial.json`),
])

return { common, auth, /* ... */, financial: financial.default }
```

**3. Registre em `src/test/setup.ts`.** O setup dos testes monta as mensagens a partir da mesma
lista. Se o namespace faltar aqui, ele existe na aplicação e não nos testes.

```ts
const namespaces = [
  'common',
  'auth',
  'crm',
  'dashboard',
  'marketplace',
  'platform',
  'properties',
  'validation',
  'financial',
] as const
```

---

## 10. Testes

Os testes carregam os **arquivos de mensagem reais** em pt-BR, através do `createTranslator` do
próprio next-intl. Duas consequências práticas:

**Uma chave errada quebra o teste.** Não há mais fallback silencioso devolvendo o nome da chave.
Se você escreveu `t('emptyStages')` e a chave é `emptyStage`, o teste falha — que é o
comportamento desejado.

**Asserção de texto é o texto real do produto.** `getByText` precisa casar com o que está no JSON
de pt-BR, caractere por caractere. Se o teste falhar depois de você editar uma mensagem, na
maioria das vezes o teste é que está desatualizado — confirme no JSON antes de mexer no
componente.

> Até setembro/2026 o mock tinha ~450 mensagens hardcoded; quatro testes afirmavam um texto que
> não existia no produto.

Componentes que usam `useFormatter` também funcionam nos testes — o formatter real é montado com
o mesmo fuso e os mesmos formatos da aplicação.

---

## 11. Checklist de PR

- [ ] Nenhuma string literal visível ao usuário sobrou no JSX
- [ ] Toda chave nova existe nos **três** arquivos, com a mesma estrutura
- [ ] Nenhuma chave contém `.` no nome
- [ ] As chaves são identificadores em inglês, não a frase em português
- [ ] Nenhuma chave aparece em input, query string ou texto lido pelo usuário
- [ ] Rota nova registrada em `routing.ts` — traduzida se for pública
- [ ] Imports de navegação vêm de `@/i18n/navigation`, não de `next/link`
- [ ] Datas e valores passam por `useFormatter`
- [ ] Plural resolvido por ICU, não por `if` no componente
- [ ] `npm run test:run` e `npm run typecheck` passando
- [ ] As três URLs abrem sem erro: `/pt/…`, `/en/…`, `/es/…`

---

## 12. Pendências conhecidas

Coisas que ainda não seguem o padrão acima. Se seu módulo esbarrar numa delas, alinhe com o time
antes de improvisar uma solução própria.

### Mensagens de validação não estão traduzidas

`validation.json` está vazio nos três idiomas. Os schemas Zod ainda carregam o texto em
português direto no código — `z.string().min(1, 'Informe seu e-mail')`. Schema é avaliado fora do
contexto de request, então a solução envolve passar o tradutor para o schema ou mapear códigos de
erro para chaves. **Ainda não há padrão definido.**

### Conteúdo de fixture é português fixo

Os dados de mock do marketplace — títulos, localizações, preços e a categoria do imóvel — estão
em português em todos os idiomas. Isso é conteúdo, não interface: quando vier o backend real,
virá do banco. Não tente traduzir fixture; é inconsistência garantida.

### Rótulos de filtro ainda usam a frase como chave

`propertyTypeFilterOptions` em `src/modules/marketplace/config/search-results-filters.ts` mantém
valores como `'Apartamento'`, porque são comparados com `property.category` das fixtures.
Funciona hoje por não conter ponto, mas viola a regra 2. Sai junto com a migração das fixtures
para o backend.

---

Ao mudar uma convenção aqui descrita, atualize este documento no mesmo PR.
