# Identificadores em inglês

O mapa revisável está em [english-rename-map.json](../scripts/english-rename-map.json). Ele relaciona os 44 modelos, 41 enums, campos, relações, nomes físicos e identificadores adicionais. A migration altera 587 nomes de catálogo; não transforma JSON nem texto de auditoria.

| Conceito                      | Código/API                                         | Banco                                                |
| ----------------------------- | -------------------------------------------------- | ---------------------------------------------------- |
| Usuário e papel               | `User`, `UserRole`, `role`                         | `users`, `role`                                      |
| Imóvel                        | `Property`, `propertyId`                           | `properties`                                         |
| Preço do imóvel               | `price`, `rentalPrice`                             | `price`, `rentalPrice`                               |
| Valor de contrato/cobrança    | `amount`                                           | `amount`                                             |
| IPTU e CEP                    | `propertyTax`, `zipCode`                           | `propertyTax`, `zipCode`                             |
| Público da agenda             | `audience`                                         | `audience`                                           |
| Destinatário de transferência | `target`, `targetId`                               | `targetId`                                           |
| Partes de contrato            | `LANDLORD`, `RENTER`, `GUARANTOR`                  | mesmos valores                                       |
| Cobrança vencida              | `OVERDUE`                                          | calculado; não persistido                            |
| Perfis de cadastro            | `owner`, `broker`, `agency`, `developer`, `renter` | convertidos para os tipos de conta/papéis existentes |

Tabelas usam plural em `snake_case`; campos e relações, `camelCase`; tipos, `PascalCase`; enums, `UPPER_SNAKE_CASE`. Novos campos de cancelamento seguem `canceledAt`/`canceledById`, como o schema fornecido. Códigos ingleses preexistentes, como `AgendaEventStatus.CANCELLED` e o estado visual `cancelled`, conservam seu significado.

`cpf`, `creci`, `PIX`, índices de reajuste e identificadores brasileiros equivalentes conservam seus nomes de domínio. Textos traduzidos, nomes de pessoas, endereços, URLs existentes e termos de busca por idioma conservam seu conteúdo. Chaves i18n e identificadores de formulários usam inglês.

## Compatibilidade deliberada

- Migrations anteriores e `prisma/english-rename/legacy-schema.prisma` conservam nomes/checksums originais.
- `charge-history-fields.ts` e `maintenance-history-statuses.ts` interpretam históricos PT/EN sem reescrever os registros; os respectivos testes preservam amostras legadas.
- `access-token.schema.ts` e `auth-options.ts` leem `papel` nos tokens anteriores. Emissões novas usam `role`; autorização continua revalidando usuário, tenant, papel e versão de sessão. Não retirar o parser antes de encerrar o período contado da última emissão legada e considerar também a renovação das sessões NextAuth.
- `maintenance-migrations.integration.test.ts` testa a cadeia histórica em schema isolado. `api-contract.cy.ts` envia um payload antigo para provar a rejeição antes da escrita.
- Tipos de mídia antigos e termos de busca localizados são dados reconhecidos na leitura/apresentação, não novos nomes de campos.

`npm run check:english-names` confere identificadores, enums do contrato, chaves i18n, SQL cru e schema ativo, com exceções delimitadas para esses casos. As chaves externas `logradouro` e `bairro` do ViaCEP são aceitas apenas no schema de resposta, no serviço de mapeamento e nos testes desse provedor; o restante da aplicação usa `street` e `neighborhood`. O codemod `rename-to-english.mjs` é material de reprodução da passagem inicial sobre a base legada; não deve ser reaplicado à aplicação já renomeada. Colisões de imports/variáveis e casos de linguagem humana exigem revisão.
