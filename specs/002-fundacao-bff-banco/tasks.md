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
- [ ] T014 [P] Augmentar os tipos do NextAuth (`next-auth.d.ts`) para tipar `session.tenantId`/
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
- [ ] T019 [US1] Documentar o passo a passo em `docs/stack.md` ou `README.md` com captura do resultado
      esperado (checklist de "ambiente pronto")

**Checkpoint**: US1 completa quando T018 rodar sem erro em uma máquina com Docker

---

## Phase 4: User Story 2 - Autenticação real via BFF (Priority: P2)

**Goal**: login via `/login` valida contra o Postgres, sem chamada a serviço externo

**Independent Test**: com o seed rodado, logar como `admin@ketris.dev` e conferir sessão com `tenantId`

### Tests for User Story 2 ⚠️

- [ ] T020 [P] [US2] Teste unitário do fluxo de `authorize()` (senha correta/incorreta/e-mail inexistente)
      em `src/shared/lib/auth/auth-options.test.ts`

### Implementation for User Story 2

- [ ] T021 [US2] Reescrever `authorize()` em `src/shared/lib/auth/auth-options.ts` para buscar o
      `Usuario` via Prisma (por `email`, considerando o tenant resolvido) e comparar a senha com
      `bcrypt.compare` (FR-003/FR-004)
- [ ] T022 [US2] Resolver o tenant ativo a partir do domínio/subdomínio da requisição (conforme já previsto
      em `docs/stack.md` → Theming/white-label) antes de consultar o usuário
- [ ] T023 [US2] Emitir `accessToken` (JWT assinado, `NEXTAUTH_SECRET`) com `userId`/`tenantId`/`papel` no
      payload, consumido depois pelo guard de sessão (T015)
- [ ] T024 [US2] Atualizar `NEXT_PUBLIC_API_URL` para vazio/relativo em todos os ambientes (já preparado em
      `.env.example`, T006) e confirmar que `HttpClient` funciona same-origin

**Checkpoint**: login funcional de ponta a ponta contra dados reais

---

## Phase 5: User Story 3 - Endpoints REST dos domínios do loop mínimo de valor (Priority: P3)

**Goal**: os 4 domínios da spec 001 (Imóvel, Oportunidade, Contrato, Cobrança) passam a ler/escrever no
Postgres via Route Handlers, no formato que os `Service`s do frontend já esperam

**Independent Test**: `curl`/Postman contra cada endpoint, cobrindo os Acceptance Scenarios da spec 001

### Tests for User Story 3 ⚠️

- [ ] T025 [P] [US3] Teste do service `src/server/properties/property.service.ts` (publicar bloqueia com
      campos ausentes — espelha FR-002 da spec 001)
- [ ] T026 [P] [US3] Teste do service `src/server/contracts/contract.service.ts` — transação de ativação
      (contrato → ativo, imóvel → alugado/vendido, cobrança criada) descrita em `data-model.md` desta spec
- [ ] T027 [P] [US3] Teste de integração de `POST /api/contracts/[id]/signatures` contra Postgres real
      (banco de teste via Docker Compose), cobrindo idempotência da cobrança inicial (Edge Case da spec)

### Implementation for User Story 3

- [ ] T028 [P] [US3] `src/server/properties/property.service.ts` (create/update/publish/unpublish,
      usando o helper de tenant de T013) + `app/api/properties/route.ts` e `app/api/properties/[id]/route.ts`
- [ ] T029 [P] [US3] `src/server/crm/opportunity.service.ts` (create — sem exigir sessão, é o formulário
      público da spec 001 US2 — e updateStatus) + `app/api/crm/opportunities/route.ts` e `[id]/route.ts`
- [ ] T030 [US3] `src/server/contracts/contract.service.ts` (createFromOpportunity — cria Contrato +
      ParteContrato + Assinatura em uma transação, T004/data-model.md) + `app/api/contracts/route.ts`
- [ ] T031 [US3] `src/server/contracts/signature.service.ts` (assinar por parte; dispara a transação de
      ativação quando a última assinatura fecha) + `app/api/contracts/[id]/signatures/route.ts`
- [ ] T032 [US3] `src/server/financial/financial.service.ts` (confirmPayment) + `app/api/financial/
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
