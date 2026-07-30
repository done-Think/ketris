---
description: "Task list for the loop mínimo de valor feature"
---

# Tasks: Loop Mínimo de Valor — Cadastro a Primeiro Pagamento

**Input**: Design documents from `specs/001-mvp-loop-imovel-pagamento/`

**Prerequisites**: plan.md, spec.md, data-model.md

**Tests**: incluídos — o Princípio III (Qualidade Verificável) da constituição do projeto torna testes
não-negociáveis para todo módulo novo.

**Organization**: tarefas agrupadas por user story (US1–US4, conforme `spec.md`) para permitir
implementação e teste independentes de cada uma.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência entre si)
- **[Story]**: a qual user story a tarefa pertence (US1–US4)
- Caminhos de arquivo são relativos a `apps/web/`

## Path Conventions

Monorepo com um único app frontend: `apps/web/src/...` (ver `plan.md` → Project Structure). Backend fora
de escopo desta feature.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: preparar os 4 módulos de domínio novos com a mesma estrutura de pastas de `properties`

- [ ] T001 [P] Criar estrutura de pastas `src/modules/marketplace/{components,hooks,schemas,services,stores,types}` (a maioria já existe como esqueleto — conferir e completar o que faltar)
- [ ] T002 [P] Criar estrutura de pastas `src/modules/crm/{components,hooks,schemas,services,stores,types}`
- [ ] T003 [P] Criar estrutura de pastas `src/modules/contracts/{components,hooks,schemas,services,stores,types}`
- [ ] T004 [P] Criar estrutura de pastas `src/modules/financial/{components,hooks,schemas,services,stores,types}`
- [ ] T005 Criar os arquivos de spec Cypress vazios: `cypress/e2e/cadastro-imovel.cy.ts`, `cypress/e2e/envio-proposta.cy.ts`, `cypress/e2e/geracao-contrato.cy.ts`, `cypress/e2e/assinatura-pagamento.cy.ts`

**Checkpoint**: 4 módulos com esqueleto de pastas pronto, iguais ao padrão de `properties`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: peças compartilhadas por mais de uma user story — nenhuma story começa antes disso

**⚠️ CRITICAL**: nenhuma tarefa de US1–US4 começa antes desta fase estar completa

- [ ] T006 [P] Schema Zod + types de `Imovel` em `src/modules/properties/schemas` e `src/modules/properties/types` (conferir se já cobre todos os campos de `data-model.md`; ajustar se faltar `midia`/`status`)
- [ ] T007 [P] Schema Zod + types de `Oportunidade` em `src/modules/crm/schemas/oportunidade.schema.ts` e `src/modules/crm/types`
- [ ] T008 [P] Schema Zod + types de `Contrato` e `Assinatura` em `src/modules/contracts/schemas` e `src/modules/contracts/types`
- [ ] T009 [P] Schema Zod + types de `Cobranca` em `src/modules/financial/schemas/cobranca.schema.ts` e `src/modules/financial/types`
- [ ] T010 Componente compartilhado de card de imóvel (usado na listagem pública e na lista do tenant) em `src/shared/components/ui/PropertyCard.tsx`, seguindo os tokens de `src/shared/theme`
- [ ] T011 Rotas base dos grupos `(public)/imoveis/[id]` e `(dashboard)/{imoveis,crm,contratos,financeiro}` (arquivos `page.tsx` vazios, apenas roteamento) em `src/app`

**Checkpoint**: fundação pronta — as 4 user stories podem começar (em paralelo, se houver mais de um dev)

---

## Phase 3: User Story 1 - Cadastrar e publicar um imóvel (Priority: P1) 🎯 MVP

**Goal**: proprietário/corretor cadastra um imóvel completo e o publica, tornando-o visível no marketplace público

**Independent Test**: login como corretor → cadastrar imóvel com todos os campos obrigatórios → publicar → conferir que aparece em `(public)/imoveis`

### Tests for User Story 1 ⚠️

- [ ] T012 [P] [US1] Teste unitário do schema Zod de `Imovel` (campos obrigatórios, validação de publicação) em `src/modules/properties/schemas/property.schema.test.ts`
- [ ] T013 [P] [US1] Teste de componente do formulário multi-etapa de cadastro em `src/modules/properties/components/PropertyForm.test.tsx`
- [ ] T014 [US1] Cypress: fluxo completo de cadastro + publicação em `cypress/e2e/cadastro-imovel.cy.ts`

### Implementation for User Story 1

- [ ] T015 [US1] `PropertyService` estendendo `BaseService` (create/update/publish/unpublish) em `src/modules/properties/services/property.service.ts` (conferir/completar o existente)
- [ ] T016 [US1] Hooks React Query (`useCreateProperty`, `usePublishProperty`, `useUnpublishProperty`) em `src/modules/properties/hooks`
- [ ] T017 [P] [US1] Formulário multi-etapa (dados, endereço/mapa, características, mídia, valores) em `src/modules/properties/components/PropertyForm.tsx`, usando React Hook Form + Zod
- [ ] T018 [P] [US1] Upload de mídia via `react-dropzone` (preview + progresso, envio ao backend) em `src/modules/properties/components/PropertyMediaUpload.tsx`
- [ ] T019 [US1] Página `(dashboard)/imoveis/novo` conectando o formulário ao service
- [ ] T020 [US1] Página `(dashboard)/imoveis` (listagem do tenant, DataGrid com status) usando `PropertyCard`/DataGrid
- [ ] T021 [US1] Ação publicar/despublicar acessível a partir da listagem e do detalhe do imóvel
- [ ] T022 [US1] Bloqueio de publicação com campos obrigatórios ausentes (mensagem clara por campo, FR-002)

**Checkpoint**: US1 funcional e testável de forma independente

---

## Phase 4: User Story 2 - Descobrir o imóvel e enviar uma proposta (Priority: P2)

**Goal**: visitante encontra um imóvel publicado e envia uma proposta, que vira uma oportunidade no CRM

**Independent Test**: sem login, abrir `(public)/imoveis/[id]` de um imóvel publicado → enviar proposta → conferir nova oportunidade em `(dashboard)/crm`

### Tests for User Story 2 ⚠️

- [ ] T023 [P] [US2] Teste unitário do schema Zod de `Oportunidade` em `src/modules/crm/schemas/oportunidade.schema.test.ts`
- [ ] T024 [P] [US2] Teste de componente do formulário de proposta em `src/modules/marketplace/components/PropertyInquiryForm.test.tsx`
- [ ] T025 [US2] Cypress: envio de proposta a partir do detalhe público em `cypress/e2e/envio-proposta.cy.ts`

### Implementation for User Story 2

- [ ] T026 [US2] `OpportunityService` estendendo `BaseService` (create, updateStatus) em `src/modules/crm/services/opportunity.service.ts`
- [ ] T027 [US2] Hook `useCreateOpportunity` em `src/modules/crm/hooks`
- [ ] T028 [P] [US2] Página `(public)/imoveis/[id]` — detalhe do imóvel (galeria, dados, mapa) reutilizando `PropertyCard`/tokens de tema
- [ ] T029 [P] [US2] Formulário de envio de proposta (dados de contato, sem exigir login) em `src/modules/marketplace/components/PropertyInquiryForm.tsx`
- [ ] T030 [US2] Página `(dashboard)/crm` — lista de oportunidades (DataGrid, filtro por status) em `src/modules/crm/components/OpportunityList.tsx`
- [ ] T031 [US2] Ação de responder oportunidade (aceitar/recusar/pedir mais informações) com atualização de status
- [ ] T032 [US2] Bloqueio de envio de proposta para imóvel despublicado (edge case do `spec.md`)

**Checkpoint**: US1 e US2 funcionam juntas e de forma independente

---

## Phase 5: User Story 3 - Aceitar a proposta e gerar o contrato (Priority: P3)

**Goal**: a partir de uma oportunidade aceita, gerar um contrato residencial pré-preenchido

**Independent Test**: com uma oportunidade em status "aceita", rodar o gerador guiado de contrato e conferir que imóvel/partes/valor batem com a origem

### Tests for User Story 3 ⚠️

- [ ] T033 [P] [US3] Teste unitário dos schemas Zod de `Contrato`/`Assinatura` em `src/modules/contracts/schemas/contract.schema.test.ts`
- [ ] T034 [P] [US3] Teste de componente do gerador guiado em `src/modules/contracts/components/ContractWizard.test.tsx`
- [ ] T035 [US3] Cypress: geração de contrato a partir de proposta aceita em `cypress/e2e/geracao-contrato.cy.ts`

### Implementation for User Story 3

- [ ] T036 [US3] `ContractService` estendendo `BaseService` (createFromOpportunity, confirm) em `src/modules/contracts/services/contract.service.ts`
- [ ] T037 [US3] Hook `useCreateContractFromOpportunity` em `src/modules/contracts/hooks`
- [ ] T038 [US3] Gerador guiado de contrato (formulário em etapas, pré-preenchido) em `src/modules/contracts/components/ContractWizard.tsx`
- [ ] T039 [US3] Validação bloqueando confirmação com dados obrigatórios das partes ausentes (FR-009)
- [ ] T040 [US3] Página `(dashboard)/contratos` — lista de contratos (status, partes, vigência)
- [ ] T041 [US3] Ação "gerar contrato" disponível a partir de uma oportunidade com status "aceita" (integra com US2, FR-014)

**Checkpoint**: US1, US2 e US3 funcionam juntas e de forma independente

---

## Phase 6: User Story 4 - Assinar o contrato e registrar o primeiro pagamento (Priority: P4)

**Goal**: cada parte assina digitalmente o contrato; ao completar todas as assinaturas, a primeira cobrança é criada e pode ser confirmada como paga

**Independent Test**: a partir de um contrato "aguardando assinatura", simular assinatura de cada parte → conferir status "ativo" + cobrança criada → confirmar pagamento → conferir status "paga" no painel financeiro

### Tests for User Story 4 ⚠️

- [ ] T042 [P] [US4] Teste unitário do schema Zod de `Cobranca` em `src/modules/financial/schemas/cobranca.schema.test.ts`
- [ ] T043 [P] [US4] Teste unitário da transição de status do contrato (todas assinadas → ativo) em `src/modules/contracts/services/contract.service.test.ts`
- [ ] T044 [US4] Cypress: assinatura completa + confirmação de pagamento em `cypress/e2e/assinatura-pagamento.cy.ts`

### Implementation for User Story 4

- [ ] T045 [US4] `SignatureService` (assinar por parte, consultar status) em `src/modules/contracts/services/signature.service.ts`
- [ ] T046 [US4] Componente de status de assinatura por parte (pendente/assinada) em `src/modules/contracts/components/SignatureStatus.tsx`
- [ ] T047 [US4] Página `(dashboard)/contratos/[id]` — detalhe do contrato com ação de assinatura e status por parte
- [ ] T048 [US4] `FinancialService` estendendo `BaseService` (createFirstCharge, confirmPayment) em `src/modules/financial/services/financial.service.ts`
- [ ] T049 [US4] Criação automática da primeira cobrança ao contrato transicionar para "ativo" (FR-012, integra com T045)
- [ ] T050 [US4] Página `(dashboard)/financeiro` — lista de cobranças + ação de confirmar pagamento (FR-013)

**Checkpoint**: as 4 user stories funcionam de ponta a ponta — loop mínimo de valor completo

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: melhorias que atravessam as 4 user stories

- [ ] T051 [P] Estados de UI reutilizáveis (loading/empty/error) aplicados às 4 novas listagens (imóveis, oportunidades, contratos, cobranças)
- [ ] T052 [P] Feedback padronizado de sucesso/erro (Notistack) em todas as ações de escrita (publicar, enviar proposta, gerar contrato, assinar, confirmar pagamento)
- [ ] T053 Revisão de acessibilidade básica (labels, contraste, navegação por teclado) nas 4 telas novas
- [ ] T054 Atualizar `docs/requisitos.md` marcando como concluídas as tarefas de backlog cobertas por esta feature

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Fase 1)**: sem dependências — pode começar imediatamente
- **Foundational (Fase 2)**: depende da Fase 1 — bloqueia todas as user stories
- **User Stories (Fases 3–6)**: todas dependem da Fase 2; podem rodar em paralelo ou em ordem de
  prioridade (US1 → US2 → US3 → US4, já que cada uma consome o resultado da anterior no loop completo,
  mesmo sendo tecnicamente testável de forma isolada)
- **Polish (Fase 7)**: depende de todas as user stories desejadas estarem completas

### User Story Dependencies

- **US1 (P1)**: nenhuma dependência de outra story
- **US2 (P2)**: consome imóveis publicados por US1, mas é testável isoladamente com um imóvel de fixture
- **US3 (P3)**: consome oportunidades aceitas de US2, mas é testável isoladamente com uma oportunidade de fixture
- **US4 (P4)**: consome contratos "aguardando assinatura" de US3, mas é testável isoladamente com um contrato de fixture

### Parallel Opportunities

- T001–T004 (Fase 1) em paralelo
- T006–T009 (Fase 2, schemas dos 4 módulos) em paralelo
- Dentro de cada user story, as tarefas marcadas `[P]` (testes e componentes de arquivos distintos) em paralelo
- Com mais de um dev: cada user story pode ser tocada por uma pessoa diferente após a Fase 2

---

## Implementation Strategy

### MVP First (User Story 1 apenas)

1. Fase 1: Setup
2. Fase 2: Foundational
3. Fase 3: US1
4. Validar US1 isoladamente (cadastro + publicação funcionando end-to-end)
5. Demo: já existe algo publicável no marketplace

### Entrega Incremental

1. Setup + Foundational → base pronta
2. US1 → validar → demo (MVP)
3. US2 → validar → demo (marketplace gera leads reais)
4. US3 → validar → demo (leads viram contrato)
5. US4 → validar → demo (loop completo, primeira receita registrada)

## Notes

- `[P]` = arquivos diferentes, sem dependência
- `[Story]` mapeia a tarefa à user story para rastreabilidade
- Testes devem ser escritos e falhar antes da implementação (Princípio III da constituição)
- Commitar após cada tarefa ou grupo lógico de tarefas
- Parar em qualquer checkpoint para validar a story isoladamente antes de seguir
