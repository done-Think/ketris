# Data Model: Fundação do BFF e Banco de Dados

A fonte de verdade do modelo de dados é `apps/web/prisma/schema.prisma`. Este documento explica como as
entidades conceituais de `specs/001-mvp-loop-imovel-pagamento/data-model.md` se materializam nele, e
descreve as duas entidades novas (Tenant, Usuário) necessárias para autenticação e multi-tenancy.

## Tenant

| Campo | Tipo | Notas |
|---|---|---|
| id | String (cuid) | |
| nome | String | |
| slug | String | único — usado para resolver o tenant por domínio/subdomínio |
| corPrimaria / corSecundaria | String? | white-label (docs/stack.md) — sobrescrevem `primary`/`secondary` do tema MUI |
| adminBootstrappedAt | DateTime? | null = tenant ainda não tem nenhum `ADMIN` e pode ser inicializado via `POST /api/auth/admins/bootstrap` (sem autenticação); preenchido = janela de bootstrap fechada — claim atômico, ver ADR-0002 |

## Usuário (`usuarios`)

| Campo | Tipo | Notas |
|---|---|---|
| id | String (cuid) | |
| tenantId | String | FK Tenant |
| nome, email | String | `@@unique([tenantId, email])` — mesmo e-mail pode existir em tenants diferentes |
| senhaHash | String | nunca texto puro (FR-003) |
| papel | enum `PapelUsuario` | ADMIN · OWNER · AGENT (nomes em inglês desde a revisão de 2026-08-04; os valores anteriores eram PROPRIETARIO/CORRETOR — migration via `ALTER TYPE ... RENAME VALUE`, dados existentes preservados) |
| ativo | Boolean (`@default(true)`) | soft-delete — `DELETE /api/auth/users/{id}` só marca `false`, nunca remove a linha (evita quebrar `Imovel.responsavelId`, que referencia `Usuario` com `onDelete: Restrict`); usuário inativo é tratado como credencial/token inválido no login e no refresh |

Interessados que só enviam proposta (User Story 2 da spec 001) **não** têm registro em `Usuario` — seus
dados ficam apenas nos campos `interessado*` de `Oportunidade`, como já assumido na spec 001.

Só um `ADMIN` cria/edita/lista/desativa outros usuários, e só enxerga/gerencia contas `OWNER`/`AGENT` — uma
conta `ADMIN` nunca aparece como alvo desses endpoints (tratada como inexistente, 404). Criar um novo
`ADMIN` é uma rota e um use-case totalmente separados (`POST /api/auth/admins`), que nunca é documentado no
Swagger/OpenAPI público. Racional completo em `docs/adr/0002-arquitetura-interna-bff.md`, seção "Nota: CRUD
de usuários e separação da criação de ADMIN".

O **primeiro** `ADMIN` de um tenant (quando `adminBootstrappedAt IS NULL`) pode ser criado por
`POST /api/auth/admins/bootstrap`, o único endpoint do sistema que não exige ator autenticado — deixa de
depender só de `prisma/seed.ts` para inicializar um tenant novo. Também nunca documentado no Swagger.
Racional e trade-offs de segurança completos em `docs/adr/0002-arquitetura-interna-bff.md`, seção "Nota:
bootstrap do primeiro administrador de um tenant".

## RefreshToken (`refresh_tokens`)

| Campo | Tipo | Notas |
|---|---|---|
| id | String (cuid) | |
| tokenHash | String | único — hash SHA-256 do token opaco; o valor em texto puro nunca é persistido |
| userId | String | FK Usuario (`onDelete: Cascade`) |
| tenantId | String | denormalizado do Usuario, evita join extra para checar tenant |
| expiresAt | DateTime | 30 dias a partir da emissão |
| revokedAt | DateTime? | preenchido na rotação (uso) ou na desativação do usuário |
| createdAt | DateTime | |

Emitido junto com o access token em `POST /auth/login`; trocado por um novo par (rotação) em
`POST /auth/refresh` — o token recebido é revogado e reutilizá-lo depois disso é tratado como inválido.
`DeactivateUserUseCase` revoga todos os refresh tokens do usuário na desativação. Detalhe completo em
`docs/adr/0002-arquitetura-interna-bff.md`, seção "Nota: refresh token".

## Mapeamento das entidades da spec 001 → schema Prisma

| Entidade conceitual (spec 001) | Model Prisma | Principais diferenças/detalhes de implementação |
|---|---|---|
| Imóvel | `Imovel` + `Endereco` (1:1) + `Midia` (1:N) | endereço e mídia normalizados em tabelas próprias; `status` ganhou `ALUGADO`/`VENDIDO` (FR-016 da spec 001, adicionado na revisão de 2026-07-30) |
| Oportunidade/Proposta | `Oportunidade` | campos de condições propostas (`valorProposto`, `prazoContratoMeses`, `inicioPretendido`, `garantiaContratual`, `condicoesEspeciais`, `observacoes`) conforme revisão de 2026-07-30 do `data-model.md` da spec 001 |
| Contrato | `Contrato` + `ParteContrato` (1:N) | partes normalizadas em tabela própria (`papel`: LOCADOR/LOCATARIO/FIADOR) em vez de um campo `partes` genérico — permite N partes com sua própria assinatura |
| Assinatura | `Assinatura` | 1:1 com `ParteContrato` (`parteContratoId @unique`) — cada parte tem no máximo uma assinatura |
| Cobrança | `Cobranca` | ganhou `tipo` (A_RECEBER/A_PAGAR), `formaPagamento`, `comprovanteUrl` e os status `AGENDADA`/`CANCELADA` conforme a mesma revisão de 2026-07-30 |

## Regras de integridade garantidas pelo schema (não só pela aplicação)

- `Contrato.oportunidadeOrigemId` é `@unique` — impossível duas oportunidades gerarem o mesmo contrato ou a
  mesma oportunidade gerar dois contratos (reforça FR-014 da spec 001 no nível de banco, não só na
  aplicação).
- `Assinatura.parteContratoId` é `@unique` — impossível uma parte ter duas assinaturas.
- `Endereco.imovelId` é `@unique` — um endereço por imóvel.
- `onDelete: Cascade` em todas as relações tenant→entidade e entidade-pai→entidade-filha, para nunca deixar
  registro órfão ao remover um tenant/imóvel/contrato em ambiente de desenvolvimento/teste.
- Índices (`@@index`) em `tenantId` (sozinho e composto com `status`) em toda tabela consultada por listagem
  — suporta as telas de lista já confirmadas no Figma (specs/001, Blocos 10–13: filtros por status).

## Transações que precisam de atomicidade (FR-006)

- **Ativar contrato**: registrar a última assinatura pendente → mudar `Contrato.status` para `ATIVO` →
  mudar `Imovel.status` para `ALUGADO`/`VENDIDO` → criar a `Cobranca` inicial (`tipo: A_RECEBER`,
  `status: PENDENTE`) — as quatro operações MUST estar no mesmo `prisma.$transaction`.
- **Gerar contrato a partir de oportunidade aceita**: criar `Contrato` + suas `ParteContrato` (locador,
  locatário, e fiador se `Oportunidade.garantiaContratual === FIADOR`) + as `Assinatura` (uma por parte, já
  `PENDENTE`) — tudo no mesmo `prisma.$transaction`, para nunca existir um contrato sem suas partes.
