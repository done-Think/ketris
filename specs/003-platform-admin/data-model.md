# Data Model: Administração da Plataforma (Platform Admin)

A fonte de verdade do modelo de dados é `apps/web/prisma/schema.prisma`. Este documento descreve as duas
entidades novas desta spec — ambas deliberadamente fora do boundary multi-tenant (nenhuma tem `tenantId`,
nenhuma referencia `Tenant`). Ver seção Atualizações no fim deste arquivo: uma terceira entidade,
`PlatformSettings`, existiu e foi removida.

## PlatformAdmin (`platform_admins`)

| Campo | Tipo | Notas |
|---|---|---|
| id | String (cuid) | |
| nome, email | String | `email` único **globalmente** (não por tenant — não existe conceito de tenant aqui) |
| senhaHash | String | nunca texto puro, mesmo padrão de `Usuario` |
| ativo | Boolean (`@default(true)`) | soft-delete, mesmo padrão de `Usuario.ativo` |
| createdAt, updatedAt | DateTime | |

Sem `papel` — todo platform admin tem o mesmo nível de acesso (ver Assumptions em `spec.md`).

## PlatformAdminRefreshToken (`platform_admin_refresh_tokens`)

| Campo | Tipo | Notas |
|---|---|---|
| id | String (cuid) | |
| tokenHash | String | único — hash SHA-256, mesmo padrão de `RefreshToken` |
| platformAdminId | String | FK PlatformAdmin (`onDelete: Cascade`) |
| expiresAt | DateTime | |
| revokedAt | DateTime? | |
| createdAt | DateTime | |

Não tem `tenantId` (não existe, ao contrário de `RefreshToken`, que denormaliza `tenantId` do `Usuario`).

## Relação com entidades já existentes (spec 002)

`PlatformAdmin` não referencia `Tenant` nem `Usuario`, e vice-versa — são identidades paralelas, não
hierárquicas. O que conecta as duas é comportamento, não uma FK: um platform admin autenticado pode operar
sobre qualquer `Tenant`/`Usuario` (`POST /api/platform/tenants`, `GET /api/platform/tenants/{id}/users`,
`POST /api/platform/tenants/{id}/admins`), mas essas operações usam os repositories já existentes do módulo
`auth` (`UserRepository`, e um novo `TenantRepository`) — o módulo `platform` depende do `auth` para
manipular `Tenant`/`Usuario`, nunca o contrário.

## Transações que precisam de atomicidade

- ~~Bootstrap do primeiro platform admin: claim em `PlatformSettings` + criação do `PlatformAdmin` no mesmo
  `prisma.$transaction`~~ — removido, ver seção Atualizações.

## Atualizações

- **2026-08-06**: o model `PlatformSettings` e o claim atômico do bootstrap foram removidos. O primeiro
  platform admin agora é criado por `apps/web/prisma/seed.ts` (idempotente via
  `prisma.platformAdmin.count()`), não por uma rota HTTP — sem concorrência real de múltiplas requisições
  simultâneas, o claim atômico deixou de ser necessário. Ver
  `docs/adr/0003-platform-admin-identidade-separada.md`, seção Atualização, para o racional completo.
