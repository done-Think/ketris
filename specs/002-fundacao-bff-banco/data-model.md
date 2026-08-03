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

## Usuário (`usuarios`)

| Campo | Tipo | Notas |
|---|---|---|
| id | String (cuid) | |
| tenantId | String | FK Tenant |
| nome, email | String | `@@unique([tenantId, email])` — mesmo e-mail pode existir em tenants diferentes |
| senhaHash | String | nunca texto puro (FR-003) |
| papel | enum `PapelUsuario` | ADMIN · PROPRIETARIO · CORRETOR |

Interessados que só enviam proposta (User Story 2 da spec 001) **não** têm registro em `Usuario` — seus
dados ficam apenas nos campos `interessado*` de `Oportunidade`, como já assumido na spec 001.

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
