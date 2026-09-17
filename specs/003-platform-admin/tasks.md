---
description: "Task list for the platform admin feature"
---

# Tasks: Administração da Plataforma (Platform Admin)

**Input**: Design documents from `specs/003-platform-admin/`

**Prerequisites**: plan.md, spec.md, data-model.md, `docs/adr/0003-platform-admin-identidade-separada.md`

**Tests**: incluídos — Princípio III (Qualidade Verificável) da constituição.

**Organization**: tarefas agrupadas por user story (US1–US4, conforme `spec.md`).

## Format: `[ID] [P?] [Story] Description`

- **[x]**: já implementado neste repositório (verificado nesta sessão — `tsc --noEmit`, `eslint` e
  `vitest run` passaram)
- Caminhos de arquivo são relativos a `apps/web/`, exceto quando indicado

---

## Phase 0: Correção de rumo

- [x] T000 Reverter por completo o mecanismo de bootstrap anônimo por tenant (`Tenant.adminBootstrappedAt`,
      `POST /api/auth/admins/bootstrap`, tela `/backoffice/setup`) via `git revert --no-commit`, commitado
      isoladamente antes de iniciar o desenho correto — a spec original entendeu "admin sem tenant" como
      "primeiro admin de cada tenant"; o pedido real era um admin da **plataforma**, sem tenant nenhum. Ver
      seção Contexto de `spec.md` e "Nota: correção de rumo" em ADR-0003.

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Escrever `spec.md`, `data-model.md`, `plan.md`, `checklists/requirements.md` e
      `docs/adr/0003-platform-admin-identidade-separada.md`
- [x] T002 Modelar `prisma/schema.prisma`: `PlatformAdmin`, `PlatformAdminRefreshToken`, `PlatformSettings`
      (singleton `id: "singleton"`) — migration hand-written em
      `prisma/migrations/20260804213418_add_platform_admin/migration.sql` (sandbox sem Postgres real; rodar
      `npm run db:migrate` localmente antes de usar)
- [x] T003 `.env.example`: `PLATFORM_TOKEN_SECRET` (chave própria, distinta de `AUTH_TOKEN_SECRET` — FR-003)

---

## Phase 2: User Story 1 - Bootstrap do primeiro platform admin (Priority: P1) 🎯 MVP

**Goal**: uma rota sem autenticação cria exatamente um platform admin, uma única vez em toda a vida do
sistema

**Independent Test**: banco vazio de platform admins → bootstrap uma vez (sucesso) → bootstrap de novo
(409), sem sessão em nenhuma das duas chamadas

### Implementation for User Story 1

- [x] T004 [US1] `domain/platform-admin.entity.ts` (`PlatformAdmin`/`AuthenticatedPlatformAdmin`,
      `toAuthenticatedPlatformAdmin`), `domain/errors.ts` (`PlatformAlreadyBootstrappedError` 409 e demais
      erros do módulo)
- [x] T005 [US1] `application/ports/platform-bootstrap-repository.port.ts` +
      `infrastructure/prisma-platform-bootstrap.repository.ts` — claim atômico via `prisma.$transaction`:
      `upsert` da linha singleton seguido de `updateMany({ where: { bootstrappedAt: null } })`; só cria o
      `PlatformAdmin` se `count === 1` (garante no máximo um sucesso sob concorrência — Acceptance Scenario 3)
- [x] T006 [US1] `application/use-cases/bootstrap-platform-admin.use-case.ts` + teste unitário (3 casos:
      sucesso, já bootstrapado, hash de senha antes de persistir)
- [x] T007 [US1] `schemas/bootstrap-platform-admin.schema.ts` (Zod, `.openapi()`) +
      `POST /api/platform/admins/bootstrap` (`src/app/api/platform/admins/bootstrap/route.ts`) — sem
      `requirePlatformBearerAuth`, **nunca registrada** em `src/server/openapi/registry.ts` (FR-005)
- [x] T008 [US1] Testes: unitário (T006), integração
      (`app/api/platform/admins/bootstrap/route.integration.test.ts` — sucesso, 409 na segunda chamada, 400
      de payload inválido, ausência em `/api/docs/openapi.json`), E2E
      (`cypress/e2e/platform/bootstrap.cy.ts` — bootstrap via UI + segunda tentativa bloqueada + link
      discreto na tela de login)
- [x] T009 [US1] Frontend: `modules/platform/schemas/bootstrap-platform-admin-schema.ts`,
      `services/platform-admin-service.ts` (`bootstrap()`), `hooks/use-bootstrap-platform-admin.ts`,
      `components/BootstrapPlatformAdminForm.tsx`, tela `app/(platform-auth)/platform/setup/page.tsx`

**Checkpoint**: US1 completa — SC-001 coberto por teste de integração (409 determinístico) e E2E

---

## Phase 3: User Story 2 - Login e sessão do platform admin (Priority: P1)

**Goal**: sessão e token do platform admin completamente separados da sessão de `ADMIN` de tenant

**Independent Test**: logar em `/platform/login`, confirmar acesso a `/platform`; a mesma sessão não abre
`/backoffice/admins/new`, e uma sessão de `ADMIN` de tenant não abre `/platform`

### Implementation for User Story 2

- [x] T010 [US2] `infrastructure/jose-platform-token.service.ts` — assina com `PLATFORM_TOKEN_SECRET`,
      payload `{ sub, scope: 'platform' }` (sem `tenantId`/`papel`); `verify()` rejeita explicitamente
      `payload.scope !== 'platform'` (separação estrutural, não só de convenção)
- [x] T011 [US2] `domain/refresh-token.ts` (helpers próprios do módulo — pequena duplicação deliberada com
      `server/auth/domain/refresh-token.ts`, ver ADR-0003) +
      `infrastructure/prisma-platform-refresh-token.repository.ts`
- [x] T012 [US2] `application/use-cases/login-platform-admin.use-case.ts` e
      `refresh-platform-admin-token.use-case.ts` + testes unitários (5 e 4 casos, respectivamente —
      credenciais inválidas, conta inativa, token revogado/expirado, rotação)
- [x] T013 [US2] `schemas/login-platform.schema.ts`, `schemas/refresh-platform-token.schema.ts` +
      `POST /api/platform/login`, `POST /api/platform/refresh` (registradas normalmente no OpenAPI — só as
      rotas de criação de admin ficam ocultas, FR-005)
- [x] T014 [US2] NextAuth: segundo `CredentialsProvider` (`id: 'platform-credentials'`) em
      `shared/lib/auth/auth-options.ts`, reaproveitando a mesma estratégia JWT; `next-auth.d.ts` ganhou o
      discriminador `session.scope: 'tenant' | 'platform'` (`tenantId`/`papel` viraram opcionais em `User`,
      já que uma sessão de platform admin não os tem)
- [x] T015 [US2] `shared/lib/auth/require-platform-session.ts` (espelha `require-admin-session.ts`: sem
      sessão ou `scope !== 'platform'` → `redirect('/platform/login')`) — garante FR-009/SC-005 nos dois
      sentidos, já que `requireAdminSession` também rejeita uma sessão sem `papel: 'ADMIN'` (toda sessão de
      platform admin cai nesse caso, por não ter `papel` nenhum)
- [x] T016 [US2] Frontend: `modules/platform/schemas/platform-sign-in-schema.ts`,
      `components/PlatformSignInForm.tsx` (mesmo padrão de `SignInForm` do módulo `auth`: após `signIn`,
      confirma `session.scope === 'platform'`, senão desloga e mostra erro), tela
      `app/(platform-auth)/platform/login/page.tsx`, guard `app/(platform)/platform/layout.tsx`
- [x] T017 [US2] Testes: unitário (`auth-options.test.ts` estendido com o segundo provider,
      `require-platform-session.test.ts`, `require-platform-bearer-auth.test.ts`), integração
      (`login/route.integration.test.ts`, `refresh/route.integration.test.ts`), E2E
      (`cypress/e2e/platform/dashboard.cy.ts` — guarda de rota deslogada + login;
      `cypress/e2e/platform/session-isolation.cy.ts` — as duas direções de SC-005)

**Checkpoint**: US2 completa — login funcional de ponta a ponta, isolamento de sessão coberto por E2E

---

## Phase 4: User Story 3 - Platform admin convida outro platform admin (Priority: P2)

**Goal**: com o primeiro platform admin logado, ele cria outros platform admins (ex.: o sócio) por uma rota
que exige sessão de platform admin

**Independent Test**: logado, criar um segundo platform admin via `/platform/admins/new`; confirmar login
dele; confirmar 401 sem sessão

### Implementation for User Story 3

- [x] T018 [US3] `application/ports/platform-admin-repository.port.ts` +
      `infrastructure/prisma-platform-admin.repository.ts` (CRUD completo)
- [x] T019 [US3] `require-platform-bearer-auth.ts` (espelha `require-bearer-auth.ts` do módulo `auth`) +
      `platform/container.ts` (composition root)
- [x] T020 [US3] Use-cases: `create-platform-admin`, `list-platform-admins`, `get-platform-admin`,
      `update-platform-admin`, `deactivate-platform-admin` (bloqueia autodesativação, mesma regra de
      `CannotDeactivateSelfError` do módulo `auth`) + um teste unitário por use-case
- [x] T021 [US3] `schemas/create-platform-admin.schema.ts`, `update-platform-admin.schema.ts`,
      `list-platform-admins.schema.ts` + `POST/GET /api/platform/admins`,
      `GET/PATCH/DELETE /api/platform/admins/{id}` — todas atrás de `requirePlatformBearerAuth`; só o
      `POST /api/platform/admins` fica fora do OpenAPI (é rota de criação, FR-005), `GET` é pública na doc
- [x] T022 [US3] Frontend: `modules/platform/schemas/create-platform-admin-schema.ts`,
      `services/platform-admin-service.ts` (`create()`), `hooks/use-create-platform-admin.ts`,
      `components/CreatePlatformAdminForm.tsx`, tela `app/(platform)/platform/admins/new/page.tsx`
      (protegida pelo guard de T015)
- [x] T023 [US3] Testes: unitário (T020), integração
      (`admins/route.integration.test.ts`, `admins/[id]/route.integration.test.ts` — inclui ausência de
      `POST /platform/admins` em `/api/docs/openapi.json`), E2E (`dashboard.cy.ts` — criar o "sócio" a
      partir do dashboard)

**Checkpoint**: US3 completa — SC-002 (dar acesso ao sócio só pela UI) coberto por E2E

---

## Phase 5: User Story 4 - Visão e controle cross-tenant (Priority: P2)

**Goal**: platform admin lista tenants, cria tenant, lista usuários (inclusive `ADMIN`) de qualquer tenant e
cria o admin de um tenant sem admin

**Independent Test**: criar um tenant novo via `/platform/tenants/new`, confirmar em
`GET /api/platform/tenants`, listar os usuários desse tenant (vazio, recém-criado)

### Implementation for User Story 4

- [x] T024 [US4] `Tenant.slug` (`@unique`) no schema Prisma — necessário pra `POST /api/platform/tenants`
      identificar um tenant de forma legível, sem existir antes da spec 002
- [x] T025 [US4] `domain/tenant-summary.entity.ts`,
      `application/ports/tenant-repository.port.ts` + `infrastructure/prisma-tenant.repository.ts`
      (`list`/`create`/`findById`) — reaproveita `TenantSlugAlreadyInUseError`/`TenantNotFoundError`
- [x] T026 [US4] Use-cases `list-tenants`/`create-tenant` + teste unitário de cada
- [x] T027 [US4] `list-tenant-users`/`create-tenant-admin` use-cases — reaproveitam
      `@server/auth/domain/user.entity`, `@server/auth/domain/errors` (`EmailAlreadyInUseError`) e os ports
      `UserRepository`/`PasswordHasher` de `auth` diretamente (cross-module reuse deliberado: `Usuario` e
      `Tenant` são conceitos do módulo `auth`, e o platform admin legitimamente opera sobre eles — ver
      ADR-0003) + teste unitário de cada
- [x] T028 [US4] `schemas/create-tenant.schema.ts`, `tenant.schema.ts`, `list-tenants.schema.ts`,
      `list-tenant-users.schema.ts`, `create-tenant-admin.schema.ts` +
      `GET/POST /api/platform/tenants`, `GET /api/platform/tenants/{id}/users`,
      `POST /api/platform/tenants/{id}/admins` — a criação do tenant é pública no OpenAPI; só a criação de
      admin de tenant (rota de criação de admin) fica oculta (FR-005), igual às demais
- [x] T029 [US4] Frontend: `modules/platform/schemas/create-tenant-schema.ts`,
      `create-tenant-admin-schema.ts`, `services/tenant-service.ts`, `hooks/use-tenants.ts`,
      `use-create-tenant.ts`, `use-tenant-users.ts`, `use-create-tenant-admin.ts`, `components/TenantsList.tsx`,
      `CreateTenantForm.tsx`, `TenantUsersList.tsx`, `CreateTenantAdminForm.tsx`, telas
      `app/(platform)/platform/page.tsx` (dashboard — lista de tenants), `tenants/new/page.tsx`,
      `tenants/[id]/page.tsx` (usuários do tenant + formulário de novo admin)
- [x] T030 [US4] Testes: unitário (T026/T027), integração (`tenants/route.integration.test.ts`,
      `tenants/[id]/users/route.integration.test.ts`, `tenants/[id]/admins/route.integration.test.ts` —
      inclui ausência de `POST /platform/tenants/{id}/admins` em `/api/docs/openapi.json`), E2E
      (`dashboard.cy.ts` — criar imobiliária + criar admin dela pela UI, sem depender de nenhum admin
      existente)

**Checkpoint**: US4 completa — SC-004 coberto por E2E; substitui de vez qualquer mecanismo anônimo de
bootstrap por tenant (removido na Fase 0)

---

## Phase 6: Correção de rumo — bootstrap HTTP substituído por seed script

- [x] T031 Remover por completo o mecanismo de bootstrap via HTTP de US1 (T004-T009): rota
      `POST /api/platform/admins/bootstrap`, `BootstrapPlatformAdminUseCase`,
      `PlatformBootstrapRepository`/`PrismaPlatformBootstrapRepository`,
      `bootstrap-platform-admin.schema.ts`, `PlatformAlreadyBootstrappedError`, model `PlatformSettings`
      (schema + migration), e todo o frontend correspondente (`BootstrapPlatformAdminForm`,
      `use-bootstrap-platform-admin`, `bootstrap-platform-admin-schema`, tela `/platform/setup`, link
      discreto em `PlatformSignInForm`) e o E2E `cypress/e2e/platform/bootstrap.cy.ts`. Racional: instância
      única operada pelo próprio time não precisa de um endpoint público de "dia zero" — ver ADR-0003,
      seção Atualização.
- [x] T032 Criar/estender `apps/web/prisma/seed.ts` para criar o primeiro platform admin a partir de
      `PLATFORM_ADMIN_NAME`/`PLATFORM_ADMIN_EMAIL`/`PLATFORM_ADMIN_PASSWORD` (com fallback de
      desenvolvimento), idempotente (`prisma.platformAdmin.count()`) — documentado em `.env.example`

**Checkpoint**: FR-002/FR-005 (parte de bootstrap)/SC-001 de `spec.md` e a entidade `PlatformSettings` de
`data-model.md` ficam supersedidos por esta fase — mantidos no texto original por rastreabilidade, não
reescritos.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Fase 0**: nenhuma dependência — pré-requisito de tudo o resto (limpa o terreno)
- **Setup (Fase 1)**: depende da Fase 0
- **US1 (Fase 2)**: depende da Fase 1; bloqueia US2 (não há login sem um admin bootstrapado)
- **US2 (Fase 3)**: depende da Fase 2
- **US3 (Fase 4)**: depende da Fase 3 (exige sessão de platform admin)
- **US4 (Fase 5)**: depende da Fase 3 (exige sessão de platform admin); independente de US3

### Parallel Opportunities

- T004/T005 (Fase 2) em paralelo com o desenho dos ports de US2 antes da implementação
- T025–T027 (Fase 5) em paralelo com T018–T020 (Fase 4) — domínios diferentes dentro do mesmo módulo
- Testes unitários de cada use-case: sempre paralelizáveis entre si (arquivos diferentes)

## Notes

- Mesma limitação de sandbox já registrada em `specs/002-fundacao-bff-banco/tasks.md`: sem Docker/Postgres
  real e sem `next dev`/browser aqui. Testes de integração e E2E (Cypress) foram escritos corretamente e
  cobrem os cenários descritos, mas não foram executados nesta sessão — rodar `npm run db:migrate`,
  `npm run test:integration` e `npm run e2e` localmente antes de considerar a spec validada de ponta a
  ponta. Verificado nesta sessão: `tsc --noEmit`, `eslint` e `vitest run` (168/168) passando, incluindo a
  suíte inteira do módulo `platform` (backend e frontend) e o guard `require-platform-session`.
- `cypress.config.ts` tem duas tasks para platform admin: `seedPlatformAdmin` (cria direto via Prisma —
  usado pelos specs que só precisam de uma sessão válida) e `cleanupPlatformAdmin`. A task
  `resetPlatformBootstrap` existia só para o spec de bootstrap (Fase 2/T008) e foi removida junto com ele
  na Fase 6.
- Migrations desta spec (`20260804213418_add_platform_admin`) não foram aplicadas a nenhum Postgres real
  neste ambiente — rodar `npm run db:migrate` localmente antes de testar a feature de ponta a ponta.
