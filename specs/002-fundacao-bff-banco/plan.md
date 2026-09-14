# Implementation Plan: Fundação do BFF e Banco de Dados

**Branch**: `002-fundacao-bff-banco` | **Date**: 2026-07-31 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-fundacao-bff-banco/spec.md` e decisão de arquitetura em
`docs/adr/0001-bff-banco-orm.md` (ADR-0001)

## Summary

Dar ao loop mínimo de valor (`specs/001-mvp-loop-imovel-pagamento`) uma base de dados e API reais. O BFF é
implementado como Route Handlers do próprio Next.js (`apps/web/src/app/api/**`), sem serviço separado
(ADR-0001). O banco é PostgreSQL, modelado via Prisma (`apps/web/prisma/schema.prisma`, já criado). A
lógica de domínio do servidor vive em `src/server/<dominio>/`, espelhando os módulos client-side. Login
passa a validar contra o banco (via Prisma) dentro do próprio `CredentialsProvider` do NextAuth.

## Technical Context

**Language/Version**: TypeScript 5.6 (strict mode), Node.js 22

**Primary Dependencies**: Prisma 5 + `@prisma/client` (ORM/migrations), `bcryptjs` (hash de senha), NextAuth
`CredentialsProvider` (já existente), Next.js Route Handlers (App Router)

**Storage**: PostgreSQL 16 (local via Docker Compose — `docker-compose.yml` na raiz do repo); hospedagem de
produção a decidir depois (Neon/Supabase/RDS), não bloqueia este plano

**Testing**: Vitest para services em `src/server/<dominio>/` (regras de negócio, transições de status);
testes de integração dos Route Handlers podem rodar contra um Postgres de teste (mesmo Docker Compose, banco
separado) — sem mocks de banco em memória, para validar as constraints reais do schema

**Target Platform**: mesmo processo do Next.js (`apps/web`), sem novo deployable

**Project Type**: Web application — extensão do monorepo existente, nenhum novo workspace

**Performance Goals**: sem alvo numérico específico nesta fase; todo endpoint que envolve múltiplas escritas
relacionadas (ex.: ativar contrato → criar cobrança) MUST usar `prisma.$transaction` para evitar estado
inconsistente, não para performance

**Constraints**: nenhuma senha em texto puro; nenhuma query tenant-scoped sem filtro de tenant explícito;
nenhuma chamada a um "backend externo" — tudo roda dentro de `apps/web`

**Scale/Scope**: 3 entidades novas (Tenant, Usuário, RefreshToken) + 5 entidades já modeladas na spec 001
(Imóvel, Oportunidade, Contrato, Assinatura, Cobrança); 1 fluxo de autenticação (com refresh token); gestão
de usuários (CRUD `OWNER`/`AGENT` + criação separada de `ADMIN`) e telas de backoffice; 4 grupos de
endpoints REST (properties, crm, contracts, financial)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Verificação | Status |
|---|---|---|
| I. Arquitetura Modular por Domínio | `src/server/<dominio>/` espelha `src/modules/<dominio>/`; nenhum domínio importa Prisma direto de outro domínio | PASS |
| II. Multi-tenant Desde a Fundação | Toda tabela de domínio tem `tenantId` (schema Prisma já criado); todo service recebe `tenantId` explícito | PASS |
| III. Qualidade Verificável | Services novos entram com testes Vitest; endpoints críticos (login, criar contrato, ativar contrato) ganham teste de integração contra Postgres real | PASS |
| IV. Consistência de Design System | N/A — esta spec é backend/dados, não introduz UI | N/A |
| V. Simplicidade e API First | Frontend continua consumindo tudo via `HttpClient`/`BaseService`; `NEXT_PUBLIC_API_URL` passa a apontar para o próprio Next.js (`/api`), sem mudança de contrato no frontend | PASS |

Nenhuma violação identificada.

## Project Structure

### Documentation (this feature)

```text
specs/002-fundacao-bff-banco/
├── plan.md              # Este arquivo
├── data-model.md         # Fase 1 — como as entidades da spec 001 se materializam no schema Prisma
├── checklists/
│   └── requirements.md   # Checklist de qualidade da spec
└── tasks.md              # Fase 2 — tarefas acionáveis
```

### Source Code (repository root)

```text
docker-compose.yml                          # Postgres local (já criado)
apps/web/
├── .env.example                            # inclui DATABASE_URL (já atualizado)
├── prisma/
│   ├── schema.prisma                       # fonte de verdade do modelo de dados (já criado)
│   ├── seed.ts                             # seed mínimo: tenant + usuário admin (já criado)
│   └── migrations/                          # geradas por `npm run db:migrate` (pendente — requer Postgres rodando)
└── src/
    ├── server/
    │   ├── db/prisma.ts                     # client singleton (já criado)
    │   ├── properties/                      # novo — service de Imóvel usado pelos Route Handlers
    │   ├── crm/                             # novo — service de Oportunidade
    │   ├── contracts/                       # novo — service de Contrato/Assinatura (transação de ativação)
    │   └── financial/                       # novo — service de Cobrança
    ├── app/api/
    │   ├── auth/[...nextauth]/route.ts      # já existe — authorize() passa a usar Prisma (US2)
    │   ├── properties/                      # novo — CRUD de imóvel (US3)
    │   ├── crm/                             # novo — CRUD de oportunidade (US3)
    │   ├── contracts/                       # novo — geração/assinatura de contrato (US3)
    │   └── financial/                       # novo — cobranças (US3)
    └── shared/lib/auth/auth-options.ts       # `authorize()` reescrito para consultar Prisma (US2)
```

**Structure Decision**: nenhuma estrutura nova de projeto — extensão do monorepo `apps/web` existente,
seguindo a decisão do ADR-0001. `src/server/` é a única pasta nova de primeiro nível.

## Complexity Tracking

*Sem violações da constituição — seção não aplicável.*
