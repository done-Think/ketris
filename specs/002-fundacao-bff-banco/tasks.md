---
description: "Task list for the fundação do BFF e banco de dados feature"
---

# Tasks: Fundação do BFF e Banco de Dados

**Input**: Design documents from `specs/002-fundacao-bff-banco/`

**Prerequisites**: plan.md, spec.md, data-model.md, `docs/adr/0001-bff-banco-orm.md`

**Tests**: incluídos — Princípio III (Qualidade Verificável) da constituição.

**Organization**: tarefas agrupadas por user story (US1–US3, conforme `spec.md`).

## Format: `[ID] [P?] [Story] Description`

- **[x]**: já implementado neste repositório (verificado nesta sessão — `prisma generate`, `tsc --noEmit` e
  `eslint` passaram)
- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência entre si)
- Caminhos de arquivo são relativos a `apps/web/`, exceto quando indicado

---

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Escolher e documentar a stack (BFF/banco/ORM) — `docs/adr/0001-bff-banco-orm.md`
- [x] T002 Resolver `TODO(BACKEND_STACK)` na constituição (`.specify/memory/constitution.md`, v1.1.0)
- [x] T003 Atualizar `docs/stack.md` (seções Backend e Banco de Dados)
- [x] T004 Modelar `prisma/schema.prisma` (Tenant, Usuário, Imóvel, Endereço, Mídia, Oportunidade,
      Contrato, ParteContrato, Assinatura, Cobrança — ver `data-model.md`)
- [x] T005 [P] Criar `docker-compose.yml` (Postgres 16 local) na raiz do repositório
- [x] T006 [P] Criar `.env.example` com `DATABASE_URL` e `NEXT_PUBLIC_API_URL` vazio/relativo
- [x] T007 Instalar dependências (`prisma`, `@prisma/client`, `bcryptjs`, `tsx`) e validar com
      `prisma generate` + `tsc --noEmit` + `eslint`
- [x] T008 Criar client singleton do Prisma em `src/server/db/prisma.ts`
- [x] T009 Criar `src/server/README.md` documentando a convenção de espelhar `src/modules/<dominio>`
- [x] T010 Criar `prisma/seed.ts` (seed mínimo: tenant + usuário admin)
- [x] T011 Adicionar scripts `db:generate`/`db:migrate`/`db:deploy`/`db:studio`/`db:seed` em
      `apps/web/package.json` e delegação no `package.json` raiz

**Checkpoint**: schema modelado e validado estaticamente; falta apenas um Postgres real rodando para
aplicar a primeira migration (não disponível neste ambiente de execução — ver T012)

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: nenhuma tarefa de US2/US3 começa antes desta fase estar completa

- [ ] T012 Rodar `docker compose up -d` + `npm run db:migrate` localmente (fora deste ambiente — requer
      Docker) e commitar a migration inicial gerada em `apps/web/prisma/migrations/`
- [ ] T013 [P] Helper `withTenant`/`scopedPrisma(tenantId)` em `src/server/db/` que força o filtro de
      tenant em todo `where` — nenhum service deve montar `where: { tenantId }` manualmente e repetido
- [x] T014 [P] Augmentar os tipos do NextAuth (`next-auth.d.ts`) para tipar `session.tenantId`/
      `session.accessToken`/`session.userId` explicitamente (hoje há `as unknown as` em `auth-options.ts`)
- [ ] T015 Middleware/guard reutilizável para Route Handlers (`src/server/http/require-session.ts`) que
      extrai a sessão NextAuth, rejeita não-autenticados com 401 e injeta `tenantId` tipado no handler

**Checkpoint**: base pronta para autenticação real (US2) e endpoints REST (US3)

---

## Phase 3: User Story 1 - Banco de dados local pronto para desenvolvimento (Priority: P1) 🎯 MVP

**Goal**: um dev sobe Postgres local, aplica migrations e roda o seed com sucesso

**Independent Test**: `docker compose up -d && npm run db:migrate && npm run db:seed` sem erros; conferir
tenant + usuário admin via `npm run db:studio`

### Implementation for User Story 1

- [x] T016 [US1] Schema Prisma completo e válido (T004)
- [x] T017 [US1] Seed mínimo (T010)
- [ ] T018 [US1] Rodar o fluxo completo localmente (Docker → migrate → seed) e confirmar no `db:studio`
      (depende de T012 — ambiente com Docker disponível)
- [x] T019 [US1] Documentar o passo a passo em `README.md` (Docker → migrate → seed → studio, incluindo o
      cuidado de usar `.env` e não `.env.local`, já que o CLI do Prisma só lê `.env`)

**Checkpoint**: US1 completa quando T018 rodar sem erro em uma máquina com Docker

---

## Phase 4: User Story 2 - Autenticação real via BFF (Priority: P2)

**Goal**: login via `/login` valida contra o Postgres, sem chamada a serviço externo

**Independent Test**: com o seed rodado, logar como `admin@ketris.dev` e conferir sessão com `tenantId`

### Tests for User Story 2 ⚠️

- [x] T020 [P] [US2] Teste unitário do fluxo de `authorize()` (senha correta/incorreta/e-mail inexistente)
      em `src/shared/lib/auth/auth-options.test.ts` — mocka `authContainer`, cobre mapeamento para o
      formato de usuário do NextAuth e a conversão de `InvalidCredentialsError` em `null`
- [x] T020a [P] [US2] Teste unitário do `LoginUseCase` (mocks dos 3 ports) em
      `src/server/auth/application/use-cases/login.use-case.test.ts` + teste do schema Zod em
      `src/server/auth/schemas/login.schema.test.ts` — cobre credenciais válidas/inválidas e a garantia de
      mensagem de erro idêntica (anti-enumeração)
- [x] T020b [P] [US2] Teste de integração contra Postgres real (repository + Route Handler completo) em
      `src/server/auth/infrastructure/prisma-user.repository.integration.test.ts` e
      `src/app/api/auth/login/route.integration.test.ts` — roda via `npm run test:integration`
      (`vitest.integration.config.mts`), fora do `test:run` padrão (precisa de Docker/Postgres)
- [x] T020c [US2] E2E (Cypress) do fluxo de login via API em `cypress/e2e/auth/login.cy.ts` — usa
      `cy.task('seedAuthUser'/'cleanupAuthUser')` (Prisma direto, `cypress.config.ts`) já que a UI de
      `/login` ainda é um placeholder; cobre 200/401/400 e a publicação do contrato em
      `/api/docs/openapi.json`

### Implementation for User Story 2

- [x] T021 [US2] Reescrever `authorize()` em `src/shared/lib/auth/auth-options.ts` — não busca mais via
      Prisma/bcrypt diretamente, e sim delega para `authContainer.loginUseCase.execute()` (Clean
      Architecture: domain/application/infrastructure/schemas em `src/server/auth/`, ver
      `docs/adr/0002-arquitetura-interna-bff.md`), que internamente faz a busca via
      `PrismaUserRepository` e a comparação com `bcrypt.compare` (FR-003/FR-004). Também criada a rota
      pública equivalente `POST /api/auth/login` (`src/app/api/auth/login/route.ts`), documentada via
      OpenAPI/Swagger self-hosted em `/api/docs` (schemas Zod com `.openapi()` como fonte única de verdade
      — `src/server/auth/schemas/login.schema.ts`, `src/server/openapi/registry.ts`)
- [ ] T022 [US2] Resolver o tenant ativo a partir do domínio/subdomínio da requisição (conforme já previsto
      em `docs/stack.md` → Theming/white-label) antes de consultar o usuário — **ainda pendente**: o login
      atual faz `findFirst` global por e-mail (simplificação documentada no ADR-0002, seção "Nota:
      resolução de tenant no login"); funciona porque hoje não há dois tenants com o mesmo e-mail em
      produção, mas precisa ser resolvido antes do multi-tenant real
- [x] T023 [US2] Emitir `accessToken` (JWT assinado) com `userId` (`sub`)/`tenantId`/`papel` no payload —
      implementado com a lib `jose` (HS256) em `src/server/auth/infrastructure/jose-token.service.ts`.
      Decisão de arquitetura (ADR-0002): assinado com `AUTH_TOKEN_SECRET`, **não** `NEXTAUTH_SECRET` —
      são dois mecanismos deliberadamente desacoplados (JWE de sessão do NextAuth vs. access token de
      API), evita acoplar o formato de um ao do outro
- [x] T024 [US2] `NEXT_PUBLIC_API_URL` já vazio/relativo em `.env.example` (T006) e `HttpClient` já usa
      `baseURL` relativo por padrão — confirmado, nenhuma mudança necessária

**Checkpoint**: login funcional de ponta a ponta contra dados reais (falta só T022 — tenant por
subdomínio — para o caso multi-tenant com e-mails repetidos entre tenants)

- [x] T024a [US2] `POST /api/auth/users` (criação de usuário) — não estava no plano original desta spec,
      adicionado porque login sozinho não permite popular um tenant com novos usuários. Segue a mesma
      convenção do ADR-0002: `CreateUserUseCase` (`application/use-cases/create-user.use-case.ts`),
      `UserRepository.findByEmailAndTenant`/`create` novos no port + `PrismaUserRepository`. Regra de
      negócio: só um ator autenticado com papel `ADMIN` pode criar usuário, e sempre no próprio tenant do
      ator (`tenantId` nunca vem do corpo da requisição — evita criação cross-tenant). Autenticação via
      Bearer access token (mesmo token emitido pelo login), verificado em
      `src/server/auth/require-bearer-auth.ts` — ainda não é o guard genérico de sessão do T015 (que
      cobriria todos os domínios), é específico do módulo `auth`; T015 continua pendente para quando
      `properties`/`crm`/`contracts`/`financial` precisarem do mesmo tipo de proteção. Documentado no
      Swagger com `securitySchemes: bearerAuth`. Testes: unitário (`create-user.use-case.test.ts`,
      `create-user.schema.test.ts`, `require-bearer-auth.test.ts`), integração
      (`prisma-user.repository.integration.test.ts` estendido, `app/api/auth/users/route.integration.test.ts`)
      e E2E (`cypress/e2e/auth/create-user.cy.ts`, cobrindo 201/401/403/409)
- [x] T024b [US2] Refresh token no login — `POST /api/auth/login` passou a retornar também um
      `refreshToken` (opaco, 30 dias, hash SHA-256 persistido em `RefreshToken`/`refresh_tokens` — nova
      migration, ver `prisma/schema.prisma`), e nova rota `POST /api/auth/refresh` troca um refresh token
      válido por um novo par access+refresh (rotação: o token usado é revogado). Racional completo em
      ADR-0002, seção "Nota: refresh token". `UserRepository` ganhou `findById` (necessário pra recarregar
      o usuário a partir do `userId` salvo no `RefreshToken`). `auth-options.ts`/`next-auth.d.ts`
      propagam `refreshToken` pra sessão do NextAuth também — **pendente**: silent refresh automático
      perto da expiração do access token (hoje só acontece se algo chamar `/api/auth/refresh`
      explicitamente). Testes: unitário (`domain/refresh-token.test.ts`, `login.use-case.test.ts`
      atualizado, `refresh-access-token.use-case.test.ts`, `refresh-token.schema.test.ts`), integração
      (`prisma-refresh-token.repository.integration.test.ts`, `app/api/auth/refresh/
      route.integration.test.ts`, `login/route.integration.test.ts` atualizado) e E2E
      (`cypress/e2e/auth/refresh-token.cy.ts`, cobrindo troca, rotação/reuso bloqueado e token
      inexistente). **Requer migration**: rodar `npm run db:migrate` localmente (Docker/Postgres já de
      pé) pra criar a tabela `refresh_tokens` — não gerada aqui porque este ambiente não alcança o
      Postgres do desenvolvedor
- [x] T024c [US2] CRUD completo de usuários (`GET/PATCH/DELETE /api/auth/users/{id}`,
      `GET /api/auth/users`) e separação da criação de `ADMIN` numa rota própria — não estava no plano
      original desta spec, pedido explicitamente para fechar o ciclo de vida de usuário (só havia create
      até aqui) e para eliminar o risco de escalonamento de privilégio de um endpoint de criação que
      aceitasse qualquer papel, incluindo `ADMIN`. Mudanças:
      - Enum `PapelUsuario`/`Papel` traduzido para inglês: `PROPRIETARIO`→`OWNER`, `CORRETOR`→`AGENT`
        (`ADMIN` inalterado) — migration via `ALTER TYPE ... RENAME VALUE` (preserva dados existentes)
      - `Usuario.ativo` (`Boolean @default(true)`) — base do soft-delete
      - `NonAdminPapel = 'OWNER' | 'AGENT'` no domínio; `createUserRequestSchema`/`updateUserRequestSchema`
        usam esse enum restrito — schema Zod rejeita `papel: 'ADMIN'` antes mesmo do use-case
      - Use-cases novos: `ListUsersUseCase`, `GetUserUseCase`, `UpdateUserUseCase` (todos filtram/rejeitam
        alvo com papel `ADMIN` como se não existisse — 404 `USER_NOT_FOUND`, mesma resposta de id
        inexistente, evita enumeração), `DeactivateUserUseCase` (soft-delete + revoga todos os refresh
        tokens do usuário via `RefreshTokenRepository.revokeAllForUser`, novo; bloqueia autodesativação —
        `CannotDeactivateSelfError`) e `CreateAdminUseCase` (sempre cria com `papel: 'ADMIN'` fixo, sem
        receber esse campo como parâmetro)
      - `LoginUseCase`/`RefreshAccessTokenUseCase` passaram a tratar `ativo: false` como credencial/token
        inválido (mesma mensagem genérica)
      - Rota `POST /api/auth/admins`: mesma autenticação (`requireBearerAuth`, ator `ADMIN`) das demais,
        mas **nunca registrada** em `src/server/openapi/registry.ts` — não aparece em `GET /api/docs` nem
        em `GET /api/docs/openapi.json` (coberto por teste dedicado)
      - Racional completo em ADR-0002, seção "Nota: CRUD de usuários e separação da criação de ADMIN"
      - Testes: unitário (um arquivo por use-case novo + schemas `update-user.schema.test.ts`,
        `create-admin.schema.test.ts`, `create-user.schema.test.ts` atualizado), integração
        (`prisma-user.repository.integration.test.ts` estendido, `users/route.integration.test.ts`
        estendido com GET, `users/[id]/route.integration.test.ts` novo, `admins/route.integration.test.ts`
        novo — inclui teste de que `/auth/admins` não aparece no `openapi.json`) e E2E
        (`cypress/e2e/auth/user-crud.cy.ts`, `create-admin.cy.ts`, `create-user.cy.ts` atualizado)
      - **Requer migration**: rodar `npm run db:migrate` localmente pra aplicar o rename do enum e a nova
        coluna `ativo` — não aplicada aqui pelo mesmo motivo de T024b (sandbox sem acesso ao Postgres do
        desenvolvedor)
- [x] T024d [US2] Telas de sign in/sign up do backoffice administrativo — não estava no plano original
      desta spec, pedido para dar uma porta de entrada de UI ao fluxo de `POST /api/auth/admins` (T024c),
      já que essa rota nunca aparece no Swagger nem em nenhuma navegação pública. Rota escolhida:
      `/backoffice/login` (sign in) e `/backoffice/admins/new` (sign up — na prática, "convidar
      novo admin", já que só um ADMIN autenticado pode chamar essa rota; não existe autocadastro público de
      administrador, por desenho do backend). `/backoffice` foi preferido a `/admin` por ser um termo menos
      óbvio de adivinhar (a proteção real continua sendo a sessão + papel, não o nome da URL). Mudanças:
      - `next-auth.d.ts`/`auth-options.ts`: `papel` do usuário passou a ser propagado para
        `User`/`JWT`/`Session` do NextAuth (antes só existiam `accessToken`/`refreshToken`/`tenantId`) —
        necessário pra saber, no client e no server, se a sessão é de um `ADMIN`
      - `shared/lib/auth/require-admin-session.ts`: helper server-side (`getServerSession` +
        `redirect('/backoffice/login')` se não houver sessão ou o papel não for `ADMIN`), usado pelo
        `layout.tsx` de `app/(admin)/backoffice/admins/` — protege `.../new` e qualquer rota futura sob
        esse prefixo
      - `SignInForm`: após `signIn('credentials', ...)` bem-sucedido, busca a sessão fresca
        (`getSession()`) e checa `papel === 'ADMIN'`; se não for, desloga (`signOut`) e mostra "Acesso
        restrito a administradores." — o login em si é o mesmo `CredentialsProvider` de qualquer usuário
        (não existe endpoint de autenticação separado para admin), então essa checagem client-side depois
        do login é o que impede um `OWNER`/`AGENT` de permanecer autenticado nesta área
      - Módulo `modules/auth` (front) criado do zero (só existiam pastas vazias): `schemas/` (Zod client-side,
        `sign-in-schema.ts` e `create-admin-schema.ts` com campo `confirmarSenha`), `services/admin-service.ts`
        (`BaseService`, `POST /auth/admins`), `hooks/use-create-admin.ts` (`useMutation`), `components/`
        (`AuthScreenLayout` — cartão centralizado com `AppLogo` e tokens do tema, reaproveitado pelas duas
        telas; `SignInForm`; `CreateAdminForm`, com `notistack` pro feedback de sucesso/erro)
      - Testes: unitário (`sign-in-schema.test.ts`, `create-admin-schema.test.ts`,
        `require-admin-session.test.ts`, `auth-options.test.ts` atualizado) e E2E orientado a UI
        (`cypress/e2e/auth/backoffice.cy.ts`, cobrindo guarda de rota deslogada, bloqueio de não-admin e o
        fluxo completo de entrar + criar novo admin) — diferente dos specs anteriores de `auth`, que testam
        as rotas via `cy.request` direto, este dirige a UI de verdade (`cy.visit`, preenche formulário,
        clica), por ser a primeira tela real do projeto (as anteriores eram `PagePlaceholder`)
      - **Não verificado end-to-end nesta sessão**: a sandbox não sobe `next dev` (limitação de ambiente já
        registrada em T014-T024c) — `tsc --noEmit`, lint e os testes unitários passaram, mas o Cypress
        spec não foi executado aqui; rodar `npm run e2e` localmente antes de considerar esta tela validada
        de ponta a ponta

---

## Phase 5: User Story 3 - Endpoints REST dos domínios do loop mínimo de valor (Priority: P3)

**Goal**: os 4 domínios da spec 001 (Imóvel, Oportunidade, Contrato, Cobrança) passam a ler/escrever no
Postgres via Route Handlers, no formato que os `Service`s do frontend já esperam

**Independent Test**: `curl`/Postman contra cada endpoint, cobrindo os Acceptance Scenarios da spec 001

**Convenção**: cada domínio abaixo segue a estrutura em camadas do ADR-0002
(`docs/adr/0002-arquitetura-interna-bff.md`) — `domain/`, `application/{ports,use-cases}/`,
`infrastructure/`, `schemas/`, `container.ts` — igual ao módulo `auth` já implementado (não mais um único
arquivo `*.service.ts` flat, como as tarefas abaixo descreviam originalmente).

### Tests for User Story 3 ⚠️

- [ ] T025 [P] [US3] Testes unitários dos use-cases de `src/server/properties/` (publicar bloqueia com
      campos ausentes — espelha FR-002 da spec 001), ports mockados
- [ ] T026 [P] [US3] Testes unitários dos use-cases de `src/server/contracts/` — transação de ativação
      (contrato → ativo, imóvel → alugado/vendido, cobrança criada) descrita em `data-model.md` desta spec
- [ ] T027 [P] [US3] Teste de integração de `POST /api/contracts/[id]/signatures` contra Postgres real
      (banco de teste via Docker Compose), cobrindo idempotência da cobrança inicial (Edge Case da spec)

### Implementation for User Story 3

- [ ] T028 [P] [US3] `src/server/properties/` (use-cases create/update/publish/unpublish, usando o helper
      de tenant de T013) + `app/api/properties/route.ts` e `app/api/properties/[id]/route.ts`
- [ ] T029 [P] [US3] `src/server/crm/` (use-case create — sem exigir sessão, é o formulário público da
      spec 001 US2 — e updateStatus) + `app/api/crm/opportunities/route.ts` e `[id]/route.ts`
- [ ] T030 [US3] `src/server/contracts/` (use-case createFromOpportunity — cria Contrato + ParteContrato +
      Assinatura em uma transação, T004/data-model.md) + `app/api/contracts/route.ts`
- [ ] T031 [US3] `src/server/contracts/` (use-case de assinatura por parte; dispara a transação de
      ativação quando a última assinatura fecha) + `app/api/contracts/[id]/signatures/route.ts`
- [ ] T032 [US3] `src/server/financial/` (use-case confirmPayment) + `app/api/financial/
      charges/[id]/route.ts`
- [ ] T033 [US3] Trocar os mocks/stubs dos `Service`s do frontend (`PropertyService`, `OpportunityService`,
      `ContractService`, `FinancialService` em `specs/001-mvp-loop-imovel-pagamento`) para consumir estes
      endpoints via `HttpClient` já configurado

**Checkpoint**: loop mínimo de valor da spec 001 funcionando de ponta a ponta contra dados reais

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Fase 1)**: concluída nesta sessão — nenhuma dependência
- **Foundational (Fase 2)**: depende da Fase 1; bloqueia US2 e US3
- **US1 (Fase 3)**: depende apenas da Fase 1 (T012/T018 exigem Docker, ambiente fora deste sandbox)
- **US2 (Fase 4)**: depende da Fase 2 (T013, T014, T015)
- **US3 (Fase 5)**: depende da Fase 2 e, para autenticação nos endpoints protegidos, da Fase 4

### Parallel Opportunities

- T005/T006 (Fase 1) em paralelo — já feito
- T013/T014 (Fase 2) em paralelo
- T020 (teste) em paralelo com o restante da Fase 4 antes da implementação (TDD)
- T025–T027 (testes) em paralelo entre si; T028/T029 (services de domínios distintos) em paralelo

## Notes

- Este ambiente de execução (sandbox desta sessão) não tem Docker disponível — T012, T018, T027 exigem
  rodar localmente ou em CI com Postgres real. Todo o restante (schema, client, services, testes
  unitários com mocks do Prisma Client) pode ser feito e verificado aqui.
- Commitar após cada tarefa ou grupo lógico de tarefas, seguindo Conventional Commits (Husky/Commitlint já
  configurados na raiz do repo).
- Parar em qualquer checkpoint para validar a story isoladamente antes de seguir.
- Módulo `auth` (T020–T024): implementado seguindo Clean Architecture manual + SOLID + injeção de
  dependência via composition root (`src/server/auth/container.ts`) — ver `docs/adr/0002-arquitetura-
  interna-bff.md` e `apps/web/src/server/README.md` para a convenção completa (domain/application/
  infrastructure/schemas), que vale para todos os próximos módulos do BFF (imóveis, oportunidades,
  contratos, cobranças). `npm run test:integration` (novo script) roda os testes que precisam de Postgres
  real, à parte de `npm run test`/`test:run`; `npm run e2e`/`e2e:open` cobre o Cypress, incluindo o novo
  spec de login. Verificado nesta sessão: `tsc --noEmit`, `eslint` (app + `cypress/tsconfig.json`
  separado) e `vitest run` (21/21) passando; testes de integração e E2E não executados aqui por falta de
  Postgres/browser no sandbox, mas escritos e prontos para rodar localmente/CI.
