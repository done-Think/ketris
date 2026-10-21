# ADR-0004: Vínculo do locatário ao contrato e autorização financeira

**Status:** Accepted
**Date:** 2026-10-16

## Contexto

Lista e detalhe de cobranças filtravam somente pelo tenant do token, permitindo que um RENTER
consultasse cobranças alheias no mesmo tenant. O resumo financeiro também não restringia o papel.
O cadastro público cria RENTERs no tenant compartilhado `locatarios`, enquanto os contratos pertencem
às imobiliárias. `ParteContrato` não tinha relação com `Usuario`.

O e-mail cadastrado não comprova sua posse. Associar contratos automaticamente no cadastro ou ao
alterar o e-mail permitiria reivindicar um vínculo sem confirmação da imobiliária.

## Decisão

- `ParteContrato.usuarioId` é uma FK opcional para `Usuario.id`, indexada, com `ON DELETE SET NULL`.
  As partes existentes permanecem sem vínculo. Não há associação retroativa por e-mail na migration.
- `POST /api/contracts/{id}/parties/{partyId}/link-user`, com body `{ "email": "..." }`, representa a
  confirmação explícita por um ADMIN do tenant do contrato. A parte deve ser `LOCATARIO` e ter o mesmo
  e-mail normalizado de uma conta RENTER ativa. O e-mail localiza a conta; a autorização usa o ID salvo.
- A conta pode estar no tenant compartilhado. A busca global por e-mail ocorre somente depois da
  autorização do administrador e da validação do contrato dentro do tenant dele.
- Confirmar o mesmo vínculo novamente é idempotente. Outro vínculo não é substituído. A escrita
  condicional impede sobrescrita concorrente. Correção, remoção de vínculo e interface administrativa
  ficam para um fluxo posterior; este endpoint apenas confirma associações.
- Novos contratos e novos cadastros também dependem dessa confirmação. Mudanças posteriores de
  e-mail não criam nem removem vínculos automaticamente.
- ADMIN, OWNER e AGENT continuam lendo somente as cobranças do tenant autenticado.
- RENTER lê exclusivamente cobranças `A_RECEBER` de contratos com uma parte `LOCATARIO` vinculada
  ao seu ID. A conta vinculada precisa continuar ativa e com papel RENTER. Cobranças avulsas e
  `A_PAGAR` não são acessíveis. Lista, busca e contagem aplicam o mesmo escopo antes da paginação;
  detalhe fora do escopo responde 404.
- O vínculo explícito é a autorização para leitura pelo RENTER de contratos de imobiliárias diferentes
  do tenant da conta. Isso não concede acesso ao tenant inteiro nem altera as permissões de escrita.
- `GET /api/financial/summary` responde 403 para RENTER; não há resumo pessoal nesta alteração.

## Consequências e validação

Todos os locatários vinculados ao mesmo contrato podem consultar suas cobranças `A_RECEBER`; o modelo
não atribui responsabilidade individual por cobrança. A confirmação administrativa exige conferir a
identidade da conta, já que a posse do e-mail ainda não é verificada pelo cadastro.

A migration é aditiva e não altera registros existentes. Precisa ser aplicada antes de disponibilizar
o código que consulta a nova coluna. Gerar o cliente Prisma não aplica a migration.

Testes unitários verificam autorização dos casos de uso, persistência do escopo de leitura e proteção
contra substituição de vínculos. Testes de integração exercitam associação e leitura com banco real,
incluindo o tenant compartilhado, contratos de imobiliárias diferentes e acesso sem vínculo.
