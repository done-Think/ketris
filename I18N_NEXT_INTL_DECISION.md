# Internacionalização, rotas e SEO do Ketris

Decisão atualizada em 27/10/2026. Esta referência substitui a proposta anterior de prefixos `as-needed`.

O projeto usa Next.js App Router e `next-intl`. Os idiomas são `pt-BR`, `en-US` e `es-ES`. Português é o idioma padrão. A moeda dos valores imobiliários continua sendo BRL, e as regras de data de negócio usam `America/Sao_Paulo`, independentemente do idioma da interface.

## Fonte única das rotas

[routing.ts](apps/web/src/i18n/routing.ts) define idiomas, prefixos, cookie e `pathnames`. O modo de prefixo é **`always`**:

| Idioma  | Prefixo | Imóveis          | Corretores       | Imobiliárias        |
| ------- | ------- | ---------------- | ---------------- | ------------------- |
| `pt-BR` | `/pt`   | `/pt/imoveis`    | `/pt/corretores` | `/pt/imobiliarias`  |
| `en-US` | `/en`   | `/en/properties` | `/en/brokers`    | `/en/agencies`      |
| `es-ES` | `/es`   | `/es/inmuebles`  | `/es/corredores` | `/es/inmobiliarias` |

As pastas e os pathnames internos permanecem em inglês, como `/properties/[id]`. As rotas públicas do marketplace com finalidade de SEO possuem URLs traduzidas. Login, cadastro, convites, recuperação de senha e áreas privadas mantêm o mesmo pathname interno em todos os idiomas; apenas o prefixo muda. A agenda usa `/dashboard/agenda` em todos os idiomas. A URL anterior `/en/dashboard/schedule` redireciona permanentemente para `/en/dashboard/agenda`.

[navigation.ts](apps/web/src/i18n/navigation.ts) exporta `Link`, `redirect`, `getPathname`, `usePathname` e `useRouter`. Componentes usam essas funções para navegar; não concatenam prefixos manualmente. O arquivo duplicado `locale-prefix.ts` foi removido.

O seletor de idioma mantém o pathname interno, parâmetros dinâmicos, filtros repetidos da query e fragmento. [current-route.ts](apps/web/src/i18n/current-route.ts) valida o contexto atual e usa `getPathname` do `next-intl` para gerar a URL. A navegação usa o router do Next para preservar também o fragmento, omitido pelo compilador de URLs da versão instalada do `next-intl`; o middleware atualiza o cookie pelo prefixo de idioma. Não há uma segunda tabela de traduções de URL.

## Mensagens e tipos

Os catálogos ficam em `apps/web/src/i18n/messages/<locale>/<namespace>.json`. `AppConfig.Messages` usa a estrutura do catálogo português como contrato de tipos. Chaves dinâmicas são uniões literais ou `TranslationKey<'namespace'>`; uma string arbitrária não é uma chave de tradução válida.

O teste de paridade em [message-parity.test.ts](apps/web/src/i18n/tests/message-parity.test.ts) compara as chaves dos três idiomas e os parâmetros de interpolação a partir da árvore ICU. Textos traduzidos dos ramos de plural não são confundidos com nomes de parâmetros. Esse teste faz parte da suíte unitária executada pelo CI.

`validation.json` reúne mensagens comuns de e-mail, credenciais e tamanho. Os schemas compartilhados recebem tradutores com as chaves que realmente consomem. Login, recuperação de senha e login da plataforma usam o catálogo comum; mensagens específicas de domínio continuam nos namespaces do módulo.

## Mensagens enviadas ao navegador

`getMessages()` pode carregar o catálogo completo no servidor. O layout raiz envia somente `common` ao navegador. [ScopedMessages](apps/web/src/i18n/scoped-messages.tsx) seleciona os namespaces usados por cada grupo ou módulo antes de renderizar um provider aninhado:

- Marketplace público: `marketplace` e `common`.
- Auth: `auth`, `validation` e os trechos compartilhados do cabeçalho, rodapé e perfil.
- Dashboard: mensagens compartilhadas da navegação, perfil e notificações; cada módulo acrescenta seu próprio namespace.
- Plataforma: `platform`, `common` e o trecho de perfil compartilhado.

O seletor faz cópias dos trechos escolhidos e não altera os catálogos de outra rota. A seleção inclui mensagens dos componentes compartilhados presentes na página. Um novo componente que usa outro namespace deve acrescentá-lo ao layout do módulo.

O tema Material UI, os textos do Data Grid e os textos do seletor de datas acompanham o locale. O adapter Day.js usa `pt-br`, `en` ou `es`. Cores e demais preferências de marca continuam partindo do tema compartilhado.

## Metadata e indexação

[seo.ts](apps/web/src/i18n/seo.ts) deriva URLs absolutas de `NEXT_PUBLIC_APP_URL` e usa os mesmos `pathnames` da navegação. Home, listas e detalhes públicos publicam canonical, alternates dos três idiomas e `x-default`. A URL preferida da imobiliária usa nome normalizado e CRECI, com fallback para ID nos registros legados que não têm esses dados.

As áreas privadas, páginas de autenticação e previews recebem `robots: { index: false, follow: false }`. O `robots.txt` também exclui esses caminhos e a API. Essas regras de indexação complementam a autorização do aplicativo.

A indexação pública só é habilitada com `NEXT_PUBLIC_ENV=production`, fora de um deploy Vercel Preview e fora de hosts locais. Staging e desenvolvimento não anunciam sitemaps aos crawlers.

## Sitemaps paginados

`/sitemap.xml` lista as quatro rotas públicas principais nos três idiomas. Em produção, `robots.txt` anuncia também os shards de detalhes em `/sitemaps/<properties|brokers|agencies>/<pagina>.xml`.

Cada shard busca no máximo 1.000 registros e emite no máximo 3.000 URLs, mantendo alternates de idioma. Propriedades devem estar publicadas. Perfis públicos seguem os mesmos predicados de elegibilidade das APIs: publicação, usuário ativo e aprovado quando aplicável e tenant permitido. A leitura dinâmica evita manter perfis inelegíveis em um cache de sitemap.

Os leitores de registros são executados na requisição. Não há consulta ao banco em `generateStaticParams` durante o build. IDs de página inválidos ou fora da quantidade existente retornam 404.

## Verificação

A implementação tem testes para a seleção do payload de mensagens, paridade de chaves e parâmetros ICU, canonical/hreflang, regras de indexação, navegação com parâmetros e partição dos sitemaps. As suítes existentes de metadata e navegação continuam relevantes.

```sh
npm run test:run -w @ketris/web -- src/i18n/tests/ --maxWorkers=1 --minWorkers=1
npm run typecheck
npm run lint
npm run build
```

A validação de deploy deve conferir o domínio configurado, o ambiente de indexação, o redirect legado, os links de idiomas e a retirada de um perfil inelegível das APIs e dos sitemaps. Passar nos testes locais não comprova o estado publicado em staging ou produção.
