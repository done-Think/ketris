# Data Model: Loop Mínimo de Valor — Cadastro a Primeiro Pagamento

Deriva das entidades definidas em `spec.md`. Atributos descritos em nível conceitual (não é DDL) — a
modelagem final de banco de dados depende da decisão de stack de backend (`docs/stack.md`).

## Imóvel (`properties`)

| Campo | Tipo | Notas |
|---|---|---|
| id | identificador | |
| tenantId | identificador | isolamento multi-tenant (Princípio II) |
| responsavelId | identificador | proprietário ou corretor responsável |
| titulo | texto | |
| endereco | objeto | rua, número, bairro, cidade, estado, CEP, coordenadas |
| caracteristicas | objeto | quartos, banheiros, vagas, área, tipo |
| midia | lista de arquivos | ao menos 1 foto obrigatória para publicar |
| valor | monetário | |
| status | enum | rascunho · publicado · despublicado |

Regras: não pode mudar para `publicado` com campos obrigatórios ausentes (FR-002). Já implementado como
módulo de referência (`src/modules/properties`).

## Oportunidade / Proposta (`crm`)

| Campo | Tipo | Notas |
|---|---|---|
| id | identificador | |
| tenantId | identificador | |
| imovelId | identificador | referencia Imóvel |
| interessado | objeto | nome, e-mail, telefone — não exige conta de usuário |
| status | enum | nova · em negociação · aceita · recusada |
| criadaEm | data/hora | |

Relações: N oportunidades por imóvel (FR-006, edge case de propostas concorrentes). Uma oportunidade
`aceita` é pré-requisito para criar um Contrato (FR-014).

## Contrato (`contracts`)

| Campo | Tipo | Notas |
|---|---|---|
| id | identificador | |
| tenantId | identificador | |
| imovelId | identificador | referencia Imóvel |
| oportunidadeOrigemId | identificador | referencia Oportunidade — obrigatório (FR-014) |
| partes | lista | proprietário/corretor + interessado, com dados exigidos para assinatura |
| valor | monetário | herdado da proposta aceita |
| status | enum | rascunho · aguardando assinatura · ativo |

Regra: só transiciona para `ativo` quando todas as Assinaturas estiverem concluídas (FR-011).

## Assinatura (`contracts`)

| Campo | Tipo | Notas |
|---|---|---|
| id | identificador | |
| contratoId | identificador | |
| parteId | identificador | qual parte do contrato |
| status | enum | pendente · assinada |
| assinadaEm | data/hora | nulo até ser assinada |

Relação: N assinaturas por contrato (uma por parte). Contrato só fica `ativo` quando 100% assinadas.

## Cobrança (`financial`)

| Campo | Tipo | Notas |
|---|---|---|
| id | identificador | |
| tenantId | identificador | |
| contratoId | identificador | referencia Contrato |
| valor | monetário | herdado do Contrato |
| vencimento | data | |
| status | enum | pendente · paga · atrasada |

Regra: criada automaticamente quando o Contrato transiciona para `ativo` (FR-012); estado inicial
`pendente` até confirmação de pagamento (FR-013).

## Diagrama de dependência entre entidades

```text
Imóvel ──< Oportunidade/Proposta (aceita) ──> Contrato ──< Assinatura (N por parte)
                                                    │
                                                    └──> Cobrança (1ª cobrança, criada ao ativar)
```

Esse encadeamento é exatamente o loop mínimo de valor descrito nas 4 user stories do `spec.md`.
