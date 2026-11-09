# CRM: dados, acesso e operação

O CRM mantém oportunidades sob a responsabilidade do imóvel e conserva o orçamento do lead como texto livre. Nome, e-mail e telefone de uma oportunidade vinculada acompanham o contato; editar esses dados na oportunidade também atualiza o contato e as demais oportunidades vinculadas. Dados já copiados para um contrato permanecem sob o fluxo de Contracts.

## Acesso e histórico

A equipe continua limitada ao próprio tenant. Corretores acessam oportunidades dos imóveis sob sua responsabilidade e seus próprios leads. Contatos ficam disponíveis pelas oportunidades autorizadas ou pela autoria do cadastro; a autorização por autoria vale para novos registros. Contatos antigos ficam com autoria desconhecida e conservam o acesso pelos vínculos existentes.

Criação, edição, conversão, alteração de status, arquivamento e atividades geram metadados em `crm_audit_events` na mesma transação da mudança. O histórico registra identificador do autor, papel e nomes dos campos alterados; valores sensíveis, senhas e tokens ficam fora desses metadados. Eventos antigos não recebem autoria inventada. Excluir definitivamente uma oportunidade com contrato retorna 409; o arquivamento continua disponível.

Gravações do CRM são serializadas por tenant com um advisory lock transacional no PostgreSQL. Essa granularidade mantém a conversão de leads e a sincronização de um contato com várias oportunidades consistentes, sem ordenar manualmente bloqueios de vários registros. Consultas usam uma transação com snapshot consistente para combinar página, contagens e resumos.

## Listagem e seleção

Propostas públicas do marketplace criam uma oportunidade e seu Lead de origem na mesma transação da cota de contato. Ambos ficam vinculados ao imóvel e ao responsável por ele. O Lead permanece na etapa Proposta e permite abrir a oportunidade existente, sem uma segunda conversão.

O cadastro manual de Lead seleciona um imóvel disponível da carteira. A busca aceita `status=PUBLISHED` com paginação e mantém o escopo do corretor ou da gestão do tenant. O servidor valida novamente a disponibilidade e o acesso, usa o título cadastrado e atribui o Lead ao responsável pelo imóvel. O orçamento continua sendo texto livre. O campo opcional `propertyId` conserva a compatibilidade com clientes anteriores e com leads antigos sem vínculo.

`GET /api/crm/contacts`, `/leads` e `/opportunities` retornam o vetor correspondente, `pagination` e `groups`. A página inicial é 1, com 5 itens; tamanhos aceitos são 5, 10 e 25. Busca, filtros e ordenação ocorrem no servidor. Os grupos das listas abrangem os registros autorizados; `summaryScope=results` fornece agregados do recorte do Kanban. Cada coluna carrega páginas adicionais sem calcular seu total somente com os cartões já carregados.

A busca trata diferenças de caixa e acentuação. Tipos e status usam códigos canônicos na aplicação, com rótulos traduzidos. Datas e valores são apresentados por `next-intl`, preservando BRL e os centavos armazenados. A coluna de imóveis do contato conta imóveis distintos em oportunidades visíveis não arquivadas.

`GET /api/crm/properties` e `/properties/{id}` fornecem o catálogo autorizado do CRM, incluindo imóveis não publicados. O seletor carrega páginas apenas quando o formulário abre. O lookup público antigo continua disponível pelo hook `useCrmProperty`, consumido pelo modal de atividades de Dashboard; as telas de CRM usam o lookup privado. O alias de endereço desse consumidor é preservado nesta branch.

O detalhe usa atividades reais. Alterações de status novas guardam códigos e status anterior/novo para tradução; descrições escritas por pessoas permanecem como conteúdo. Próximas ações são sugestões por etapa, sem datas inventadas. O GET de lead por ID atende links diretos, independentemente da página carregada. A edição usa PATCH; PUT foi retirado.

## Formulários e validação

A seleção de imóvel e contato pertence ao React Hook Form. Abrir o formulário cria seu estado inicial; refetches não substituem a edição em andamento. Alterar a entidade editada cria outro formulário. Etapas do cadastro de lead ficam no estado de interface e não integram o payload persistido. Novas etapas exigem avanço com validação; a navegação direta fica restrita às já visitadas. A preferência entre lista e Kanban é restaurada após uma renderização inicial compatível entre servidor e navegador.

O lead pode nascer sem e-mail. A conversão exige um endereço válido e o grava no lead e na oportunidade. Uma vez convertido, o estágio permanece Proposta; observações continuam editáveis. A máquina de estados das oportunidades é compartilhada com os controles da interface.

As condições especiais são editadas individualmente e persistidas como `String[]`, preservando vírgulas, quebras de linha e ordem. Cadastro e edição aceitam prazo, início pretendido, garantia e condições, campos que já existiam no banco.

Limites aprovados: nome 200, e-mail 254, telefone 32, interesse/orçamento/origem e cada condição 500, observações 10.000 caracteres. Valor proposto entre 0,01 e 9.999.999.999,99, com até duas casas decimais. Datas inexistentes são recusadas. Campos desconhecidos nos contratos de entrada são rejeitados com 400.

## Migrations e CI

A migration `20261110090000_lead_property_reference` adiciona a referência opcional do Lead ao imóvel, com isolamento por tenant. Leads já convertidos recebem a referência pela oportunidade vinculada; seus textos, etapas e datas são preservados. A migration usa uma transação explícita e está declarada como aditiva para o release automático do staging.

As migrations `20261025230000_crm_audit_and_system_activities` e `20261026010000_crm_contact_creator` são aditivas. Elas criam o histórico, o código de atividade de sistema e a autoria opcional do contato. O release de staging aplica as migrations com `prisma migrate deploy` e conserva os cadastros existentes. Nenhuma variável secreta nova é necessária para CRM.

O job de E2E existente preserva seu identificador e inclui o spec real de CRM junto de Auth, Agenda e Contracts. As fixtures verificam banco local e `KETRIS_E2E_ISOLATED_DB=1`, e somente removem tenants com o prefixo exclusivo da suíte. As validações usam banco isolado; o seed principal e os ambientes AWS permanecem sob os procedimentos existentes de deploy.

O limite geral de requisições usa [contadores compartilhados em PostgreSQL](technical-debt/api-distributed-rate-limit.md), incluídos na autorização posterior desta refatoração.
