# Data Model: Administração da Plataforma (Platform Admin)

A fonte de verdade do modelo de dados é `apps/web/prisma/schema.prisma`. Este documento descreve as três
entidades novas desta spec — todas deliberadamente fora do boundary multi-tenant (nenhuma tem `tenantId`,
nenhuma referencia `Tenant`).

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

## PlatformSettings (`platform_settings`)

| Campo | Tipo | Notas |
|---|---|---|
| id | String | fixo (`"singleton"`) — sempre existe no máximo uma linha |
| bootstrappedAt | DateTime? | null = nenhum platform admin foi criado ainda; preenchido = a rota de bootstrap nunca mais funciona, para sempre |

Claim atômico: `BootstrapPlatformAdminUseCase` faz um `updateMany` condicional
(`WHERE id = 'singleton' AND bootstrappedAt IS NULL`) dentro de uma transação, e só cria o `PlatformAdmin`
se esse update afetou exatamente uma linha — garante que, sob duas requisições concorrentes, no máximo uma
cria o primeiro platform admin (mesmo padrão do claim atômico já usado e removido da spec 002, agora
aplicado a uma única linha global em vez de uma linha por tenant).

## Relação com entidades já existentes (spec 002)

`PlatformAdmin` não referencia `Tenant` nem `Usuario`, e vice-versa — são identidades paralelas, não
hierárquicas. O que conecta as duas é comportamento, não uma FK: um platform admin autenticado pode operar
sobre qualquer `Tenant`/`Usuario` (`POST /api/platform/tenants`, `GET /api/platform/tenants/{id}/users`,
`POST /api/platform/tenants/{id}/admins`), mas essas operações usam os repositories já existentes do módulo
`auth` (`UserRepository`, e um novo `TenantRepository`) — o módulo `platform` depende do `auth` para
manipular `Tenant`/`Usuario`, nunca o contrário.

## Transações que precisam de atomicidade

- **Bootstrap do primeiro platform admin**: claim em `PlatformSettings` + criação do `PlatformAdmin` no
  mesmo `prisma.$transaction` — se a criação falhar depois do claim (ex.: e-mail duplicado, embora
  estruturalmente raro no primeiro admin), o claim MUST reverter junto (rollback da transação inteira, não
  fica um `bootstrappedAt` preenchido sem admin nenhum).
