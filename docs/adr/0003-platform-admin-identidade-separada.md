# ADR-0003: Platform Admin como identidade separada de Usuario/Tenant

**Status:** Accepted
**Date:** 2026-08-04
**Deciders:** Alysson (produto/tech)

## Context

ADR-0002 estabeleceu um único conceito de "administrador": `ADMIN`, um valor do enum `PapelUsuario`, sempre
com `tenantId` — escopado a um tenant, sem exceção. Uma primeira tentativa de resolver "como o dono da
Ketris entra no sistema" tentou encaixar isso nesse mesmo modelo, com uma rota anônima
(`POST /api/auth/admins/bootstrap`) que criava o primeiro `ADMIN` de qualquer tenant sem autenticação,
enquanto esse tenant não tivesse nenhum. Essa tentativa foi revertida (ver `specs/003-platform-admin/spec.md`,
seção Notes do checklist) porque resolvia o problema errado: o dono/sócio da Ketris não é o admin de um
tenant — é o operador da plataforma inteira, que precisa enxergar e controlar todos os tenants ao mesmo
tempo. Forçar isso dentro do modelo `Usuario`/`tenantId` exigiria ou (a) tornar `tenantId` opcional em toda
parte que hoje assume que ele existe, ou (b) inventar um tenant "fantasma" só para o dono — as duas opções
contaminam o invariante central do sistema (spec 002, Princípio II da constituição: toda tabela de domínio
tem `tenantId`, todo acesso filtra por tenant).

## Decision

**Platform admin é uma identidade nova, completamente fora do boundary multi-tenant** — não um valor de
`PapelUsuario`, não um `Usuario` com `tenantId` nulo. Tabela própria (`PlatformAdmin`), módulo de servidor
próprio (`src/server/platform/`, mesma Clean Architecture de `auth`), autenticação própria.

Decisões específicas:

- **Token com secret próprio** (`PLATFORM_TOKEN_SECRET`, distinto de `AUTH_TOKEN_SECRET`): mesmo raciocínio
  já aplicado entre `AUTH_TOKEN_SECRET` e `NEXTAUTH_SECRET` (ADR-0002) — um token de platform admin nunca
  pode ser confundido com nem forjado a partir de um token de tenant, e vice-versa, mesmo que um dos dois
  secrets vaze.
- **Claims do JWT deliberadamente sem `tenantId`/`papel`**: o payload carrega só `sub` (id do platform
  admin) e um marcador fixo `scope: 'platform'`. Isso é o que permite ao guard de rota rejeitar
  estruturalmente um token de tenant (que nunca tem esse marcador) em vez de depender de uma checagem de
  papel que poderia ser esquecida em algum endpoint novo.
- **Bootstrap com claim atômico global**, não por tenant: `PlatformSettings` é uma linha singleton
  (`id: "singleton"`) com `bootstrappedAt DateTime?`. O mesmo padrão de `updateMany` condicional dentro de
  uma transação já usado (e removido) na tentativa anterior é reaplicado aqui — mas contra uma única linha
  global, porque só existe uma plataforma, não um bootstrap por tenant. Essa é a única rota do sistema
  inteiro que cria uma conta sem nenhuma autenticação, e só funciona uma vez, para sempre.
- **CRUD de platform admin sempre autenticado a partir daí**: criar um segundo (ou terceiro) platform admin
  exige um platform admin já logado — mesmo padrão "admin convida admin" já usado entre `ADMIN`s de um
  tenant (ADR-0002). Diferente da tentativa anterior, não existe janela de bootstrap reaberta por tenant;
  existe uma única janela, global, que fecha permanentemente após o primeiro platform admin.
- **Platform admin cria o admin de qualquer tenant, autenticado**: `POST /api/platform/tenants/{id}/admins`
  substitui o mecanismo anônimo removido. Isso é estritamente mais seguro — a operação exige um ator já
  autenticado e confiável (platform admin), em vez de confiar em "quem descobrir o slug primeiro". Também é
  mais simples: não precisa de nenhum claim atômico, porque o ator já provou quem é.
- **NextAuth com dois `CredentialsProvider`s** (`credentials` para tenant, `platform-credentials` para
  platform admin) em vez de duas implementações de sessão do zero: reaproveita toda a infraestrutura já
  testada de JWT de sessão do NextAuth (`getServerSession`, `useSession`, cookies), só adicionando um campo
  discriminador `scope: 'tenant' | 'platform'` em `User`/`JWT`/`Session`. Os dois guards de rota
  (`requireAdminSession`, `requirePlatformSession`) verificam esse campo antes de qualquer outra coisa —
  uma sessão do tipo errado é tratada exatamente como nenhuma sessão.
- **Reaproveitamento deliberado do módulo `auth`** para tudo que não é específico de identidade: os
  use-cases de `platform` que operam sobre tenant/usuário (listar tenants, criar tenant, listar usuários de
  um tenant, criar o admin de um tenant) dependem dos ports já existentes em `auth`
  (`UserRepository`) mais um `TenantRepository` novo — não duplicam a lógica de criação/hash de senha, só a
  orquestram com uma autorização diferente (ator é platform admin, não um `ADMIN` do próprio tenant).
- **Mesma convenção de ocultar rotas de criação de admin do OpenAPI** (ADR-0002): bootstrap, criar platform
  admin e criar admin de um tenant nunca aparecem em `GET /api/docs`/`openapi.json`. Login, refresh, listar
  tenants e listar usuários de um tenant são documentados normalmente — não são operações de escalonamento
  de privilégio, só leitura/autenticação.

## Consequences

- **Positivo**: o invariante "toda tabela de domínio tem `tenantId`" (Princípio II) continua valendo sem
  exceção disfarçada — `PlatformAdmin`/`PlatformAdminRefreshToken`/`PlatformSettings` são exceções
  explícitas e documentadas, não um `tenantId` nulo escondido em `Usuario`.
- **Positivo**: o mecanismo de bootstrap anônimo por tenant (com sua janela de corrida documentada e aceita
  como trade-off no ADR anterior) deixa de existir — a superfície de ataque "sem autenticação" do sistema
  fica reduzida a uma única rota, que só é útil uma vez, na vida inteira do sistema.
- **Custo aceito**: alguma duplicação estrutural entre `auth` e `platform` (refresh token opaco, padrão de
  CRUD, padrão de rota oculta) — deliberada, não acidental: são bounded contexts diferentes (identidade de
  tenant vs. identidade de plataforma), e a alternativa (generalizar um "UserRepository" só para acomodar os
  dois) acoplaria dois conceitos que devem poder evoluir de forma independente (ex.: platform admin nunca
  precisa de `papel`, tenant admin nunca precisa de visão cross-tenant).
- **Escopo explicitamente não coberto**: gestão cross-tenant de outros domínios (imóveis, contratos,
  cobranças) não está nesta ADR — só identidade e o mínimo de visão/controle sobre tenants e seus usuários.

## Atualização (2026-08-06): bootstrap HTTP substituído por seed script

O mecanismo de bootstrap descrito acima (`POST /api/platform/admins/bootstrap`, claim atômico em
`PlatformSettings`, tela `/platform/setup`) foi implementado e depois removido. Racional: esse padrão
(rota pública, sem autenticação, para o "dia zero" de configuração) existe em produtos como WordPress,
Ghost, GitLab ou Nextcloud porque eles são instalados por terceiros, em ambientes que o time que os
desenvolve não controla — faz sentido oferecer um assistente de primeira execução via navegador. O
Ketris não está nesse caso: é uma instância única, sempre implantada e operada pelo próprio time. Nesse
cenário, expor uma rota HTTP pública — mesmo com claim atômico e mesmo que só funcione uma vez — é
superfície de ataque desnecessária para resolver um problema que um script de seed resolve com muito
menos código e zero rota exposta.

Decisão revisada: o primeiro platform admin é criado por `apps/web/prisma/seed.ts` (`npm run db:seed`),
lendo `PLATFORM_ADMIN_NAME`/`PLATFORM_ADMIN_EMAIL`/`PLATFORM_ADMIN_PASSWORD` do ambiente, idempotente
(não faz nada se já existir algum platform admin). Consequências:

- `PlatformSettings` deixou de existir — o claim atômico não é mais necessário porque um script de seed
  rodado uma vez no deploy não tem concorrência real (diferente de uma rota HTTP pública, que qualquer
  um poderia chamar simultaneamente).
- `PlatformAlreadyBootstrappedError`, `BootstrapPlatformAdminUseCase`, `PlatformBootstrapRepository` e
  toda a cadeia de frontend (`BootstrapPlatformAdminForm`, tela `/platform/setup`, link discreto no
  login) foram removidos.
- O restante da ADR permanece válido: platform admin continua sendo uma identidade própria, sem
  `tenantId`, com token e sessão separados de tenant — só o *mecanismo de criação do primeiro* mudou.
