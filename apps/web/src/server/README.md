# `src/server`

Lógica de domínio do lado servidor (BFF), consumida pelos Route Handlers em `src/app/api/**/route.ts`. Ver
ADR-0001 (`docs/adr/0001-bff-banco-orm.md`, onde o BFF roda) e **ADR-0002**
(`docs/adr/0002-arquitetura-interna-bff.md`, como o código é organizado — leia antes de criar um domínio
novo).

## Estrutura de cada domínio

```text
src/server/
├── db/prisma.ts             # client singleton do Prisma
├── shared/
│   ├── errors/               # AppError e subclasses genéricas (NotFoundError, ConflictError,
│   │                          # UnauthorizedError, ForbiddenError...)
│   ├── http/                 # parseJsonBody (Zod) + handleRouteError — usados por todo Route Handler
│   └── schemas/               # Zod compartilhado entre domínios (ex.: errorResponseSchema)
├── openapi/
│   ├── registry.ts           # registry único do @asteasolutions/zod-to-openapi
│   ├── zod-extend.ts         # habilita .openapi() nos schemas Zod (side-effect, importar 1x)
│   └── swagger-ui-page.ts    # HTML do Swagger UI (usado por app/api/docs/route.ts)
└── <dominio>/                 # ex.: auth, properties, crm, contracts, financial
    ├── domain/                # entidades + erros de negócio — zero import de Prisma/Next/Zod
    ├── application/
    │   ├── ports/             # interfaces (contratos) — ex.: UserRepository, PasswordHasher
    │   └── use-cases/         # regra de negócio, depende só de ports/
    ├── infrastructure/        # implementações concretas dos ports (Prisma, bcrypt, jose...)
    ├── schemas/                # Zod — valida request E gera a doc OpenAPI (.openapi() + registry)
    └── container.ts            # composition root — único lugar que instancia infra e monta use-cases
```

## Convenções (resumo — detalhe e racional em ADR-0002)

- Route Handler fino: parseia com Zod (`parseJsonBody`), chama `container.<x>UseCase.execute(...)`, traduz
  o resultado em `NextResponse`. Nenhuma regra de negócio nem `prisma.*` direto num `route.ts`.
- `application/` nunca importa `infrastructure/` nem `@prisma/client` — só os `ports/` do próprio domínio.
  Isso é a injeção/inversão de dependência do projeto: manual, via construtor, sem framework de DI.
- Toda query/mutação que toca uma tabela com `tenantId` **deve** filtrar por tenant explicitamente — ver
  Princípio II da constituição. (Exceção documentada: login por e-mail ainda não filtra tenant — ver nota
  em ADR-0002.)
- Todo use-case novo entra com teste unitário (ports mockados, sem banco). Todo endpoint novo entra com
  teste de integração (banco real via Docker Compose) e, quando fizer sentido, um teste E2E em
  `cypress/e2e/`.
- O schema Prisma (`apps/web/prisma/schema.prisma`) é a fonte de verdade do modelo de dados; os
  `data-model.md` de cada spec descrevem as entidades em nível conceitual e devem ser lidos junto com ele.
- Sem comentários no código: nomes autoexplicativos + testes; contexto e racional vão em ADRs e no
  `tasks.md` da spec, não em comentários inline.
- Endpoint protegido: extrai e valida o access token (Bearer) com `requireBearerAuth` antes de qualquer
  outra coisa no handler; regra de autorização (quem pode fazer o quê) mora no use-case, não no Route
  Handler nem num middleware genérico — ver `CreateUserUseCase` (só `ADMIN` cria usuário, sempre no
  próprio tenant do ator). Guard de sessão genérico e reutilizável por outros domínios ainda é T015
  (`specs/002-fundacao-bff-banco/tasks.md`), pendente.

Módulos implementados até agora: `auth` (login, refresh token, CRUD de usuários OWNER/AGENT, criação
separada de ADMIN) e `platform` (identidade separada do dono/sócio da Ketris, sem tenant — ver seção
própria abaixo). Os demais (`properties`, `crm`, `contracts`, `financial`) seguem incrementalmente junto das
tarefas de `specs/002-fundacao-bff-banco/tasks.md`.

## Autenticação: access token + refresh token

`POST /auth/login` retorna um access token (JWT, 1h, `jose`) e um refresh token (opaco, alta entropia,
30 dias, só o hash SHA-256 fica no banco — model `RefreshToken`). `POST /auth/refresh` troca um refresh
token válido por um par novo (access + refresh), revogando o antigo (rotação — reuso de um token já
revogado é tratado como inválido). Detalhe completo e racional das decisões em ADR-0002, seção "Nota:
refresh token".

## Usuários: CRUD (OWNER/AGENT) e criação de ADMIN (rota separada)

`POST/GET /auth/users` e `GET/PATCH/DELETE /auth/users/{id}` formam o CRUD de usuários — sempre restrito a
papel `OWNER` ou `AGENT` (nunca `ADMIN`). Detalhe e racional completo em ADR-0002, seção "Nota: CRUD de
usuários e separação da criação de ADMIN". Resumo:

- Todas as rotas exigem `requireBearerAuth` + ator com papel `ADMIN`.
- Criar/editar nunca aceita `papel: 'ADMIN'` (schema Zod restringe a `'OWNER' | 'AGENT'`).
- Uma conta com papel `ADMIN` como alvo (`GET/PATCH/DELETE /auth/users/{id}`) responde 404
  (`USER_NOT_FOUND`), igual a um id inexistente — não revela a existência de administradores.
- `DELETE` é soft-delete (`Usuario.ativo = false`, nunca remove a linha) e revoga todos os refresh tokens do
  usuário. Login e refresh de um usuário desativado falham como se as credenciais fossem inválidas.
- `POST /api/auth/admins` cria um `ADMIN` — mesma autenticação (`requireBearerAuth`, ator `ADMIN`), mas é um
  use-case (`CreateAdminUseCase`) e uma rota totalmente separados de `POST /auth/users`, e **nunca é
  registrada** em `src/server/openapi/registry.ts` — não aparece em `GET /api/docs` nem em
  `GET /api/docs/openapi.json`.

## Platform admin: identidade separada do ADMIN de tenant

`src/server/platform/` é um módulo irmão de `auth`, não uma extensão dele: `PlatformAdmin` não tem
`tenantId` e nunca é confundido com o `ADMIN` de um tenant (`Usuario.papel === 'ADMIN'`, spec 002). Racional
completo em `docs/adr/0003-platform-admin-identidade-separada.md` e `specs/003-platform-admin/`. Resumo:

- `POST /api/platform/admins/bootstrap`: cria o primeiro platform admin, sem autenticação — mas só funciona
  uma vez em toda a vida do sistema (claim atômico via `PlatformSettings`, linha singleton, dentro de uma
  transação Prisma). Qualquer chamada depois do primeiro sucesso responde 409
  (`PLATFORM_ALREADY_BOOTSTRAPPED`).
- `POST/GET /api/platform/admins` e `GET/PATCH/DELETE /api/platform/admins/{id}`: CRUD completo, sempre
  exigindo `requirePlatformBearerAuth` (ator já autenticado como platform admin) — é assim que o dono cria o
  acesso do sócio, depois do bootstrap.
- `GET/POST /api/platform/tenants`, `GET /api/platform/tenants/{id}/users` e
  `POST /api/platform/tenants/{id}/admins`: visão e controle cross-tenant — listar/criar tenants, listar
  todos os usuários de um tenant (inclusive contas `ADMIN`, que o CRUD de usuário de um tenant nunca revela)
  e criar o admin de um tenant específico, substituindo qualquer mecanismo anônimo de bootstrap por tenant.
- Token do platform admin assinado com `PLATFORM_TOKEN_SECRET` (não `AUTH_TOKEN_SECRET`) e payload sem
  `tenantId`/`papel` (`{ sub, scope: 'platform' }`) — separação estrutural, não só de convenção, entre as
  duas identidades.
- As três rotas de criação de admin deste módulo (bootstrap, criar platform admin, criar admin de tenant)
  nunca são registradas em `src/server/openapi/registry.ts` — mesma regra de `POST /api/auth/admins`.
- Sessão NextAuth: segundo `CredentialsProvider` (`id: 'platform-credentials'`), mesma estratégia JWT, com
  `session.scope` (`'tenant' | 'platform'`) como discriminador — `shared/lib/auth/require-platform-session.ts`
  e `shared/lib/auth/require-admin-session.ts` rejeitam a sessão uma da outra, mesmo com o mesmo mecanismo de
  sessão por baixo.

## Documentação (Swagger/OpenAPI)

`GET /api/docs` serve o Swagger UI (self-hosted, assets de `swagger-ui-dist` via
`/api/docs/assets/[...path]`, sem CDN). `GET /api/docs/openapi.json` serve o documento gerado a partir do
`registry` — cada domínio registra seus paths em `src/server/<dominio>/openapi.ts`, chamado explicitamente
por `src/server/openapi/registry.ts` (recebe o `registry` por parâmetro, não como singleton importado, pra
evitar import circular).
