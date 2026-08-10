# Implementation Plan: Administração da Plataforma (Platform Admin)

**Branch**: `003-platform-admin` | **Date**: 2026-08-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-platform-admin/spec.md`. Depende da fundação de
`specs/002-fundacao-bff-banco` (módulo `auth` já existente: `Usuario`, `Tenant`, `UserRepository`, padrão de
refresh token, padrão de rota "criação de admin nunca no OpenAPI").

## Summary

Um novo módulo de servidor, `src/server/platform/`, espelhando a Clean Architecture já usada em
`src/server/auth/` (domain/application/infrastructure/schemas + `container.ts` + `openapi.ts`), para uma
identidade — `PlatformAdmin` — deliberadamente fora do boundary multi-tenant. Reaproveita o que já existe no
módulo `auth` sempre que faz sentido (helpers de refresh token, `PasswordHasher`, `UserRepository` para
operações cross-tenant), mas com token service, ports de repositório e rotas próprias — nunca compartilha
sessão/token com um `ADMIN` de tenant. NextAuth ganha um segundo `CredentialsProvider` e um campo `scope` na
sessão para diferenciar as duas identidades sem duplicar toda a infraestrutura de sessão do zero.

## Technical Context

**Language/Version**: TypeScript 5.6 (strict mode), Node.js 22 — mesmo stack de 002, nenhuma dependência
nova.

**Primary Dependencies**: `jose` (já usado por `JoseTokenService`, reaproveitado com uma chave/secret
diferente), `bcryptjs`, NextAuth (segundo `CredentialsProvider`).

**Storage**: mesmo Postgres local. Três tabelas novas, nenhuma FK para `Tenant`/`Usuario`.

**Testing**: mesmo padrão de 002 — Vitest para use-cases/schemas (unit), Vitest contra Postgres real para
repositories/routes (`test:integration`), Cypress para os fluxos de UI (`/platform/setup`,
`/platform/login`, `/platform/admins/new`, `/platform/tenants/new`).

**Constraints**: a rota de bootstrap (`POST /api/platform/admins/bootstrap`) é a única do módulo `platform`
sem autenticação — todo o resto exige um platform admin já logado. Nenhuma rota de criação de admin
(bootstrap, criar platform admin, criar admin de um tenant) aparece no OpenAPI público.

**Scale/Scope**: 3 entidades novas (`PlatformAdmin`, `PlatformAdminRefreshToken`, `PlatformSettings`); 1
fluxo de autenticação completo e paralelo ao de tenant (login + refresh); CRUD de platform admin; 4 telas de
UI (`/platform/setup`, `/platform/login`, `/platform/admins/new`, `/platform`, `/platform/tenants/new`);
endpoints cross-tenant mínimos (listar/criar tenant, listar usuários de um tenant, criar admin de um
tenant) — gestão profunda de dados de um tenant específico (imóveis, contratos etc.) fica fora do escopo.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Verificação | Status |
|---|---|---|
| I. Arquitetura Modular por Domínio | `src/server/platform/` é um módulo novo, próprio; depende do `auth` só via ports já expostos (`UserRepository`, `PasswordHasher`), nunca importa Prisma de outro domínio | PASS |
| II. Multi-tenant Desde a Fundação | `PlatformAdmin`/`PlatformAdminRefreshToken`/`PlatformSettings` são deliberadamente as únicas tabelas sem `tenantId` — exceção documentada e intencional (é o papel que existe fora do boundary), não uma omissão | PASS (exceção documentada) |
| III. Qualidade Verificável | Mesmo padrão de teste de 002: unit + integração + E2E antes de considerar qualquer rota pronta | PASS |
| IV. Consistência de Design System | Telas novas reaproveitam `AuthScreenLayout`/`RhfTextField`/`ActionTextLink` já usados em `/backoffice/*` | PASS |
| V. Simplicidade e API First | Frontend consome via `HttpClient`/`BaseService`, mesmo padrão; nenhuma mudança de contrato para módulos já existentes | PASS |

Nenhuma violação identificada.

## Project Structure

### Documentation (this feature)

```text
specs/003-platform-admin/
├── plan.md               # Este arquivo
├── data-model.md          # PlatformAdmin, PlatformAdminRefreshToken, PlatformSettings
├── checklists/
│   └── requirements.md    # Checklist de qualidade da spec
└── tasks.md               # Tarefas acionáveis
```

### Source Code (repository root)

```text
apps/web/
├── prisma/schema.prisma                     # + PlatformAdmin, PlatformAdminRefreshToken, PlatformSettings
└── src/
    ├── server/
    │   ├── auth/                             # já existe — TenantRepository novo entra aqui (não é platform-specific)
    │   └── platform/                          # novo módulo
    │       ├── domain/                        # platform-admin.entity, errors, refresh-token helpers
    │       ├── application/{ports,use-cases}/ # bootstrap/login/refresh/CRUD admin + tenants/list/create + tenant-admin
    │       ├── infrastructure/                # Prisma repositories + JosePlatformTokenService
    │       ├── schemas/                       # Zod
    │       ├── container.ts
    │       ├── openapi.ts                     # registra tudo exceto as rotas de criação de admin
    │       └── require-platform-bearer-auth.ts
    ├── app/api/platform/
    │   ├── admins/{route.ts, bootstrap/route.ts, [id]/route.ts}
    │   ├── login/route.ts
    │   ├── refresh/route.ts
    │   └── tenants/{route.ts, [id]/users/route.ts, [id]/admins/route.ts}
    ├── modules/platform/                      # front: schemas, services, hooks, components (mesmo padrão de modules/auth)
    ├── app/(auth)/platform/{login,setup}/page.tsx
    ├── app/(platform)/platform/{layout.tsx, page.tsx, admins/new/page.tsx, tenants/new/page.tsx}
    └── shared/lib/auth/require-platform-session.ts
```

**Structure Decision**: novo módulo de domínio `platform`, seguindo exatamente a convenção já estabelecida
por `auth` — nenhuma estrutura de projeto nova, só mais um domínio dentro do padrão existente.

## Complexity Tracking

*Sem violações da constituição além da exceção documentada (multi-tenant) na tabela acima.*
