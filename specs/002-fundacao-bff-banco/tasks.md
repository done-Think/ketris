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
