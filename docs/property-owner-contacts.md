# Proprietário do imóvel e acesso à plataforma

O campo **Proprietário** seleciona um contato ativo do CRM, sem exigir uma conta na plataforma. Cadastre a pessoa em **CRM → Contatos**, volte ao cadastro do imóvel e pesquise pelo nome ou e-mail. A seleção aceita os contatos disponíveis ao usuário conforme as permissões do CRM; não exige uma classificação específica. Limpar o campo salva o imóvel sem contato proprietário.

**Conta com acesso ao imóvel (opcional)** é um vínculo separado com uma conta já cadastrada no mesmo tenant com papel `PROPERTY_OWNER`. Esse vínculo concede acesso ao imóvel. Escolher, trocar ou remover o contato não altera essa conta; remover a conta de acesso não remove o contato. Contatos não criam usuários nem enviam convites automaticamente.

Se um contato vinculado for arquivado, seu nome e vínculo são preservados ao editar o imóvel. Ele deixa de aparecer nas opções para novos vínculos. A equipe pode manter o vínculo histórico, substituí-lo ou removê-lo. Uma conta `PROPERTY_OWNER` pode editar seu imóvel conforme suas permissões atuais, mas não altera o contato do CRM.

## Contrato e migração

`ownerContactId` referencia `Contact`; `ownerId` continua referenciando `User` e controlando o acesso. As respostas privadas incluem `ownerContact` com apenas `id` e `name`. As respostas públicas não expõem o proprietário do CRM. A API de contas `/api/properties/owners` mantém seu contrato; o seletor de contatos reutiliza a busca paginada e as permissões de `/api/crm/contacts`.

A migration `20261105090000_property_owner_contact` adiciona uma coluna opcional, índices e uma chave estrangeira composta que impede referências entre tenants. Ela não altera registros existentes nem cria contatos a partir das contas. Os vínculos antigos de acesso continuam válidos; a equipe pode associar os contatos posteriormente.

A alteração está declarada como compatível em `infra/deploy/staging.json` para aplicação pelo fluxo automatizado de staging antes da promoção da aplicação. Não execute reset nem seed para disponibilizá-la.
