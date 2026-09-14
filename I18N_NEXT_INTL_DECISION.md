# Por que usar next-intl no Ketris

Data: 2026-08-21

Este documento explica a decisao de usar `next-intl` no Ketris e define como vamos traduzir textos e rotas sem quebrar o padrao interno do projeto.

## Decisao atual

Usaremos `next-intl` com:

- pastas internas em ingles
- pathnames canonicos em ingles
- URLs publicas localizadas por idioma
- textos, metadata, validacoes e formatos traduzidos por locale

Exemplo:

| Idioma | URL publica | Pathname canonico interno | Pasta do projeto |
| --- | --- | --- | --- |
| Portugues | `/imoveis` | `/properties` | `app/[locale]/properties` |
| Ingles | `/en/properties` | `/properties` | `app/[locale]/properties` |
| Portugues | `/corretores` | `/brokers` | `app/[locale]/brokers` |
| Ingles | `/en/brokers` | `/brokers` | `app/[locale]/brokers` |

Isso atende aos dois objetivos:

- o usuario `pt-BR` entende melhor onde esta pela URL
- o projeto continua padronizado com pastas e rotas canonicas em ingles

## Por que usar next-intl

`next-intl` e uma biblioteca feita para internacionalizacao no Next.js moderno, incluindo App Router.

Ela resolve:

- traducao em Server Components
- traducao em Client Components
- provider para React
- mensagens organizadas por namespace
- formatacao de data
- formatacao de numeros
- pluralizacao
- interpolacao
- metadata localizada
- roteamento localizado com `pathnames`
- integracao com request do Next
- troca de idioma integrada com navegacao

Sem ela, teriamos que criar e manter manualmente:

- loader de mensagens
- contexto React de idioma
- hooks de traducao
- formatadores
- integracao server/client
- persistencia de preferencia
- fallback de idioma
- padrao para validacoes
- padrao para metadata
- mapeamento entre URL publica localizada e rota interna

Isso aumentaria a chance de cada modulo implementar i18n de um jeito diferente.

## A duvida principal

Se o usuario escolhe o idioma no client side, por que o server side precisa saber o idioma?

Porque no Next.js App Router muitas partes da tela podem ser renderizadas no servidor antes do JavaScript do navegador executar.

Exemplos:

- Server Components
- layouts
- pages
- metadata
- mensagens renderizadas no primeiro carregamento
- validacoes usadas em server actions
- formatacao inicial de datas e moedas

Se o servidor nao sabe o idioma, ele renderiza uma versao inicial em um idioma e o client troca depois. Isso pode causar:

- flicker visual
- HTML inicial com texto errado
- problemas de hidratacao
- metadata errada
- pior SEO
- duplicacao de logica entre server e client
- mais JavaScript no browser

Entao a escolha pode acontecer em um componente client side, mas ela precisa navegar ou persistir a preferencia de forma que o proximo request seja renderizado no idioma correto pelo servidor.

Fluxo esperado:

```txt
1. Usuario acessa /imoveis
2. Middleware identifica pt-BR pela URL sem prefixo
3. Server renderiza textos, metadata e formatos em pt-BR
4. Usuario escolhe English no seletor
5. App navega para /en/properties
6. Server renderiza a mesma pagina canonica com locale en-US
```

## Como o Next entende `/imoveis` se a pasta e `properties`

O Next usa as pastas para definir a estrutura interna. O `next-intl` adiciona uma camada de mapeamento chamada `pathnames`.

Exemplo conceitual:

```ts
export const routing = defineRouting({
  locales: ['pt-BR', 'en-US'],
  defaultLocale: 'pt-BR',
  localePrefix: {
    mode: 'as-needed',
    prefixes: {
      'en-US': '/en',
    },
  },
  pathnames: {
    '/properties': {
      'pt-BR': '/imoveis',
      'en-US': '/properties',
    },
    '/brokers': {
      'pt-BR': '/corretores',
      'en-US': '/brokers',
    },
    '/agencies': {
      'pt-BR': '/imobiliarias',
      'en-US': '/agencies',
    },
  },
})
```

A pasta continua em ingles:

```txt
apps/web/src/app/[locale]/properties/page.tsx
```

Mas a URL em portugues pode ser:

```txt
/imoveis
```

E a URL em ingles:

```txt
/en/properties
```

O mapeamento faz a ponte entre URL publica localizada e pathname interno.

## Por que traduzir URLs publicas

Traduzir URL publica faz sentido para o marketplace porque:

- melhora clareza para usuarios `pt-BR`
- melhora leitura e compartilhamento de links
- melhora SEO por idioma
- evita uma experiencia misturada, como interface em portugues com URL `/properties`
- permite preservar URLs antigas em portugues enquanto o codigo interno fica em ingles

## Onde traduzir rotas

Traduzir principalmente rotas publicas:

| Pathname canonico | PT-BR | EN-US |
| --- | --- | --- |
| `/properties` | `/imoveis` | `/properties` |
| `/brokers` | `/corretores` | `/brokers` |
| `/agencies` | `/imobiliarias` | `/agencies` |

Rotas de produto interno podem ser avaliadas caso a caso:

| Area | Recomendacao |
| --- | --- |
| Marketplace publico | Traduzir URLs |
| Auth publico | Pode usar prefixo por locale, mas pathname pode continuar igual |
| Dashboard | Manter canonico em ingles; traduzir URL so se houver ganho claro |
| CRM | Manter canonico em ingles |
| Platform | Manter canonico em ingles |
| Backoffice | Manter canonico em ingles |
| API | Nao localizar |

## Por que nao fazer apenas client side

Uma abordagem apenas client side seria algo como:

```txt
Renderiza tudo em portugues
Depois o React carrega
Depois le localStorage
Depois troca os textos para ingles
```

Isso parece simples, mas traz problemas:

| Problema | Impacto |
| --- | --- |
| Primeiro paint no idioma errado | Experiencia ruim |
| Metadata nao traduzida no servidor | SEO pior |
| Server Components sem traducoes | Perde parte do beneficio do App Router |
| Duplicacao de dicionarios | Mais manutencao |
| Validacao espalhada | Forms ficam inconsistentes |
| Hydration mismatch possivel | Bugs dificeis de rastrear |

O `next-intl` evita isso porque funciona tanto no servidor quanto no cliente.

## Por que o arquivo `shared/i18n/pt-br.ts` nao e o melhor caminho

O commit recente criou um arquivo:

```txt
apps/web/src/shared/i18n/pt-br.ts
```

Esse arquivo centraliza alguns textos em portugues, mas ele nao resolve internacionalizacao de verdade.

Problemas:

- so existe `pt-br`
- nao integra com Server Components
- nao integra com metadata
- nao integra com locale do request
- nao troca idioma de verdade
- nao define fallback
- nao define formato de data/moeda
- nao mapeia URLs localizadas
- incentiva imports diretos de texto em config/data
- cria uma arquitetura paralela ao `next-intl`

Ele pode servir como fonte temporaria para migrar textos existentes, mas nao deve ser expandido como padrao da aplicacao.

## E o seletor de idioma no client?

O seletor de idioma continua sendo um componente client side, porque o usuario clica nele.

Mas ele nao deve apenas fazer:

```txt
setSelectedLanguage('en')
```

Isso muda so o estado visual daquele componente.

O comportamento correto e:

```txt
1. Usuario seleciona English
2. App usa a navegacao do next-intl para trocar locale
3. Usuario vai de /imoveis para /en/properties
4. Server e client passam a usar en-US
```

Assim o idioma escolhido afeta a aplicacao inteira, nao apenas o menu.

## O que muda no plano original

O plano precisa seguir este direcionamento:

- usar `/en` para o locale ingles
- manter `pt-BR` sem prefixo quando possivel
- usar `pathnames` para URLs publicas traduzidas
- manter pastas e pathnames canonicos em ingles
- usar `next-intl` para textos e formatos
- usar provider para client components
- usar request config para server components
- usar middleware/config do `next-intl` para resolver locale pela URL

## Padrao recomendado para mensagens

Mensagens ficam em:

```txt
apps/web/src/i18n/messages
├── en-US
│   ├── common.json
│   ├── auth.json
│   ├── marketplace.json
│   └── validation.json
└── pt-BR
    ├── common.json
    ├── auth.json
    ├── marketplace.json
    └── validation.json
```

Componentes nao devem importar texto assim:

```ts
import { publicMarketplaceText } from '@shared/i18n/pt-br'
```

Componentes devem usar traducoes do `next-intl`.

Exemplo:

```ts
const t = useTranslations('marketplace.header')

return <Button>{t('announceProperty')}</Button>
```

## Padrao recomendado para configs

Configs nao devem guardar label final em portugues.

Evitar:

```ts
export const navigationItems = [
  { label: 'Comprar', href: '/properties?purpose=buy' },
]
```

Preferir:

```ts
export const navigationItems = [
  { labelKey: 'buy', href: '/properties?purpose=buy' },
]
```

O componente resolve:

```ts
const t = useTranslations('marketplace.navigation')

navigationItems.map((item) => t(item.labelKey))
```

## Padrao recomendado para formularios

Formularios continuam usando:

- React Hook Form
- Zod
- validators do modulo
- tipos no `types` do modulo

Mensagens de validacao devem ser traduzidas por chave ou por schema factory.

Exemplo conceitual:

```ts
export function createLoginSchema(t: (key: string) => string) {
  return z.object({
    email: z.string().email(t('email.invalid')),
  })
}
```

## Decisao final

Vamos usar `next-intl` porque ele resolve i18n de forma consistente no App Router, tanto no servidor quanto no cliente.

Vamos traduzir URLs publicas porque isso melhora a experiencia do usuario `pt-BR` e ajuda SEO.

Para o Ketris, o caminho certo e:

```txt
Pastas em ingles + URLs publicas localizadas + textos traduzidos por next-intl
```

Essa decisao evita uma arquitetura paralela de dicionarios manuais e evita que o seletor de idioma seja apenas visual.

## Fontes oficiais

- next-intl Request Configuration: https://next-intl.dev/docs/usage/configuration
- next-intl Server and Client Components: https://next-intl.dev/docs/environments/server-client-components
- next-intl Routing Configuration: https://next-intl.dev/docs/routing/configuration
- next-intl Middleware: https://next-intl.dev/docs/routing/middleware
- Next.js Internationalization Guide: https://nextjs.org/docs/app/guides/internationalization

