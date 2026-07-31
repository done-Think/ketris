# Implementation Plan: Loop Mínimo de Valor — Cadastro a Primeiro Pagamento

**Branch**: `001-mvp-loop-imovel-pagamento` | **Date**: 2026-07-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-mvp-loop-imovel-pagamento/spec.md`

## Summary

Entregar o loop mínimo de valor da Ketris no frontend (`apps/web`): cadastro/publicação de imóvel pelo
proprietário/corretor, descoberta pública e envio de proposta pelo interessado, geração de contrato a
partir de uma proposta aceita, assinatura digital por parte e criação/confirmação da primeira cobrança.
A abordagem técnica é reutilizar a estrutura modular já scaffoldada (`src/modules/properties` como
referência) e implementar os módulos `marketplace`, `crm`, `contracts` e `financial` seguindo o mesmo
padrão (schema Zod → types → service estendendo `BaseService` → hook React Query → componentes). O backend
que sustenta esses módulos ainda não está definido (ver `docs/stack.md`); esta fase de planejamento cobre
o frontend e assume uma API REST convencional por trás do `HttpClient` existente — os contratos de API
exatos ficam como `[NEEDS CLARIFICATION: stack de backend]` até essa decisão ser tomada.

## Technical Context

**Language/Version**: TypeScript 5.6 (strict mode), Node.js 22

**Primary Dependencies**: Next.js 14 (App Router), React 18, Material UI v6, Zustand, TanStack Query 5,
React Hook Form + Zod, Axios (`HttpClient`/`BaseService`), NextAuth.js, Day.js, react-imask,
MUI X DataGrid, react-dropzone, Notistack

**Storage**: N/A neste plano (camada de dados é responsabilidade do backend, ainda não definido —
`docs/stack.md`); o frontend consome tudo via `HttpClient`

**Testing**: Vitest + Testing Library (unitário/componente por módulo), Cypress (E2E dos 4 fluxos deste
loop: cadastro de imóvel, envio de proposta, geração de contrato, assinatura + pagamento)

**Target Platform**: Web, mobile-first (marketplace público e telas do interessado) + desktop (área
autenticada do corretor/proprietário), conforme `docs/design-system.md`

**Project Type**: Web application (monorepo com um único app frontend, `apps/web`; backend fora deste
plano)

**Performance Goals**: Sem alvo numérico definido para este loop; seguir os padrões do Next.js App Router
(SSR/ISR nas páginas públicas do marketplace para SEO, conforme `docs/requisitos.md` seção 2)

**Constraints**: Upload de arquivos sempre via backend antes do S3 (nunca direto do navegador); estado de
formulário sempre em React Hook Form (nunca `useState` para inputs); nenhuma cor "chumbada" fora dos
tokens do tema (Princípio IV da constituição)

**Scale/Scope**: 4 user stories (P1–P4), 5 entidades de domínio (Imóvel, Oportunidade/Proposta, Contrato,
Assinatura, Cobrança), 4 módulos de frontend impactados (`properties`, `marketplace` público,
`crm`, `contracts` + `financial`)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Verificação | Status |
|---|---|---|
| I. Arquitetura Modular por Domínio | Cada entidade nova (Oportunidade, Contrato, Assinatura, Cobrança) recebe seu módulo próprio (`crm`, `contracts`, `financial`); nenhum módulo importa outro diretamente, integrações passam por `src/shared` | PASS |
| II. Multi-tenant Desde a Fundação | Toda entidade (Imóvel, Oportunidade, Contrato, Cobrança) carrega `tenantId`; chamadas usam `useTenantStore`/header `X-Tenant-Id` já existentes | PASS |
| III. Qualidade Verificável | Cada módulo novo entra com testes Vitest desde o primeiro commit; os 4 fluxos do loop ganham cobertura Cypress | PASS |
| IV. Consistência de Design System | Telas novas (publicação de imóvel, envio de proposta, geração de contrato, assinatura, cobrança) reutilizam os tokens de `src/shared/theme` — nenhuma tela nova introduz cor fora da paleta | PASS |
| V. Simplicidade e API First | Todo acesso a dados passa por `BaseService`/`HttpClient`; nenhuma chamada HTTP direta em componente | PASS |

Nenhuma violação identificada — não é necessária a seção Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/001-mvp-loop-imovel-pagamento/
├── plan.md              # Este arquivo
├── data-model.md         # Fase 1 — entidades e relações
├── checklists/
│   └── requirements.md   # Checklist de qualidade da spec
└── tasks.md              # Fase 2 (/speckit-tasks) — tarefas acionáveis
```

Não foram gerados `research.md`/`contracts/` nesta fase: não há incertezas técnicas de frontend a
pesquisar (a stack já está decidida em `docs/stack.md`), e os contratos de API ficam pendentes da decisão
de backend — devem ser gerados quando essa decisão existir.

### Source Code (repository root)

```text
apps/web/
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── page.tsx                       # Home do marketplace (já existe, stub)
│   │   │   └── imoveis/
│   │   │       ├── page.tsx                    # Busca/listagem pública (já existe, stub)
│   │   │       └── [id]/page.tsx               # Detalhe do imóvel + envio de proposta (novo)
│   │   └── (dashboard)/
│   │       ├── imoveis/
│   │       │   ├── page.tsx                    # Lista de imóveis do tenant (novo)
│   │       │   └── novo/page.tsx               # Cadastro/edição multi-etapa (novo)
│   │       ├── crm/
│   │       │   └── page.tsx                    # Lista de oportunidades/propostas (novo)
│   │       ├── contratos/
│   │       │   ├── page.tsx                    # Lista de contratos (novo)
│   │       │   └── [id]/page.tsx                # Detalhe + assinatura (novo)
│   │       └── financeiro/
│   │           └── page.tsx                    # Cobranças e confirmação de pagamento (novo)
│   ├── modules/
│   │   ├── properties/                          # já existe — referência de padrão
│   │   ├── marketplace/                          # busca pública + envio de proposta (novo conteúdo)
│   │   ├── crm/                                   # oportunidades/propostas (novo conteúdo)
│   │   ├── contracts/                             # contrato + assinatura (novo conteúdo)
│   │   └── financial/                             # cobrança + pagamento (novo conteúdo)
│   │       └── cada módulo: components/hooks/schemas/services/stores/types
│   └── shared/                                    # HttpClient, BaseService, theme, useTenantStore (já existem)
└── cypress/e2e/
    ├── cadastro-imovel.cy.ts                      # novo
    ├── envio-proposta.cy.ts                       # novo
    ├── geracao-contrato.cy.ts                     # novo
    └── assinatura-pagamento.cy.ts                 # novo
```

**Structure Decision**: reaproveitar o monorepo existente (`apps/web`) e a organização modular já
estabelecida — nenhuma estrutura nova de projeto é criada. Os 4 módulos de domínio (`marketplace`, `crm`,
`contracts`, `financial`) seguem exatamente o padrão de `src/modules/properties` (schema → types → service
→ hook → componentes), e as rotas novas entram nos grupos de rota já existentes (`(public)` e
`(dashboard)`).

## Complexity Tracking

*Sem violações da constituição — seção não aplicável.*

## Atualizações

**2026-07-30** — 6 novos links do Figma (Blocos 10–15: Gestão de Imóveis, CRM Propostas, Contratos Geração
e Assinatura, Financeiro Cobranças, Manutenção, CRM Mobile) confirmaram o desenho das telas já previstas
neste plano e revelaram dois ajustes de escopo já refletidos em `spec.md`/`data-model.md`:

- `ContractWizard` (`src/modules/contracts/components/ContractWizard.tsx`) precisa suportar um fiador
  opcional como parte adicional do formulário/assinatura (FR-015), com sua própria seção de dados no passo
  "Partes" e sua própria linha na tela de acompanhamento de assinatura.
- `PropertyService`/lista de imóveis precisam refletir os status derivados `alugado`/`vendido` (FR-016)
  além de `rascunho`/`publicado`/`inativo`.

Manutenção (Bloco 14) e CRM Mobile dedicado (Bloco 15) não alteram este plano — são explicitamente fora de
escopo deste loop (ver Assumptions em `spec.md`) e ficam como candidatos a planos de feature próprios no
futuro.
