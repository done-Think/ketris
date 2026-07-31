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
| status | enum | rascunho · publicado · alugado · vendido · inativo (despublicado) |

Regras: não pode mudar para `publicado` com campos obrigatórios ausentes (FR-002). Transiciona
automaticamente para `alugado`/`vendido` quando o Contrato associado fica `ativo` (FR-016, confirmado pela
listagem de imóveis do Figma — Bloco 10, que exibe os filtros Disponível/Alugado/Vendido/Em análise/
Inativo). Já implementado como módulo de referência (`src/modules/properties`).

## Oportunidade / Proposta (`crm`)

| Campo | Tipo | Notas |
|---|---|---|
| id | identificador | |
| tenantId | identificador | |
| imovelId | identificador | referencia Imóvel |
| interessado | objeto | nome, e-mail, telefone — não exige conta de usuário |
| valorProposto | monetário | confirmado pelo Figma — Bloco 11 (detalhe da proposta) |
| prazoContrato | texto/número | ex.: "30 meses" |
| inicioPretendido | data | |
| garantiaContratual | enum | ex.: fiador, caução, seguro-fiança (determina se um Fiador será exigido no Contrato — FR-015) |
| condicoesEspeciais | lista de texto | observações negociadas (ex.: aceitar animais, desconto por antecipação) |
| observacoes | texto | |
| status | enum | rascunho · enviada · em negociação · aceita · recusada |
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
| locador | objeto | nome, CPF, e-mail, telefone |
| locatario | objeto | nome, CPF, e-mail, telefone |
| fiador | objeto (opcional) | nome, CPF, e-mail, telefone — presente apenas quando `garantiaContratual` da proposta exigir (FR-015) |
| valor | monetário | herdado da proposta aceita |
| status | enum | rascunho · aguardando assinatura · ativo |

Regra: só transiciona para `ativo` quando todas as Assinaturas estiverem concluídas (FR-011), o que também
dispara FR-016 (status do Imóvel).

## Assinatura (`contracts`)

| Campo | Tipo | Notas |
|---|---|---|
| id | identificador | |
| contratoId | identificador | |
| parteId | identificador | qual parte do contrato — locador, locatário ou fiador (quando presente) |
| status | enum | pendente · assinada |
| assinadaEm | data/hora | nulo até ser assinada |

Relação: N assinaturas por contrato (uma por parte, incluindo fiador quando presente). Contrato só fica
`ativo` quando 100% assinadas.

## Cobrança (`financial`)

| Campo | Tipo | Notas |
|---|---|---|
| id | identificador | |
| tenantId | identificador | |
| contratoId | identificador | referencia Contrato |
| tipo | enum | a receber · a pagar (repasse ao proprietário — confirmado pelo Figma Bloco 13; operação completa do "a pagar" fora do escopo deste loop) |
| valor | monetário | herdado do Contrato |
| vencimento | data | |
| formaPagamento | texto | ex.: PIX, boleto — preenchido na confirmação |
| comprovante | arquivo (opcional) | anexado na confirmação de pagamento |
| status | enum | pendente · paga · atrasada · agendada · cancelada |

Regra: criada automaticamente (tipo `a receber`) quando o Contrato transiciona para `ativo` (FR-012); estado
inicial `pendente` até confirmação de pagamento (FR-013). Os status `agendada`/`cancelada` e o tipo
`a pagar` fazem parte do modelo de dados (confirmados pelo Figma) mas sua operação completa está fora do
escopo deste loop mínimo.

## Diagrama de dependência entre entidades

```text
Imóvel ──< Oportunidade/Proposta (aceita) ──> Contrato ──< Assinatura (N por parte)
                                                    │
                                                    └──> Cobrança (1ª cobrança, criada ao ativar)
```

Esse encadeamento é exatamente o loop mínimo de valor descrito nas 4 user stories do `spec.md`.

## Atualizações

- **2026-07-30**: campos e estados revisados a partir de 6 novos links do Figma (Blocos 10–15). Principais
  mudanças: status do Imóvel ganhou `alugado`/`vendido` (FR-016); Oportunidade ganhou campos de condições
  propostas e o status `rascunho`; Contrato explicitou `locador`/`locatario`/`fiador` (FR-015); Cobrança
  ganhou `tipo` (a receber/a pagar), `formaPagamento`, `comprovante` e os status `agendada`/`cancelada`.
