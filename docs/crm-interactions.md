# Tentativas de contato e resultados

Os botões Ligar, E-mail e WhatsApp do modal de lead preservam os links externos e solicitam o registro de uma tentativa no CRM. O navegador não informa se houve ligação atendida ou mensagem enviada. Por isso o clique gera STARTED, nunca CONTACT_MADE automaticamente.

## Fluxo de uso

O acionamento registra lead, canal, data do servidor e autor autenticado. O corretor escolhe explicitamente o resultado: contato realizado, sem resposta ou cancelado, com observação opcional. A confirmação é definitiva; uma repetição idêntica é idempotente e uma tentativa de substituir o resultado retorna conflito.

O link externo abre normalmente, sem aguardar a gravação e sem criar janelas por callbacks assíncronos. Se o registro falhar, o modal informa o problema e oferece nova tentativa de gravação com o mesmo requestId, sem repetir a ação externa. Não há captura de mensagens, áudio ou confirmação externa de entrega.

## Histórico e vínculos

O registro pertence ao lead, inclusive antes da conversão. O mesmo registro é consultado nos contextos de lead, oportunidade e contato usando os vínculos explícitos atuais. O histórico de Contatos considera o vínculo direto do lead ao contato, conservando a leitura pelo contato da oportunidade para registros anteriores sem vínculo direto. Não se criam contatos, propostas ou associações por coincidência de nome, telefone ou email.

As listas têm paginação e ordenação estável por data e identificador. Atividades e anotações anteriores das oportunidades permanecem no painel de atividades existente; não são duplicadas como novas tentativas.

## Datas e permissões

Somente CONTACT_MADE atualiza lastContactAt do lead e lastInteraction do contato vinculado, sem diminuir datas mais recentes. STARTED, NO_RESPONSE, CANCELLED e edições de notas ou estágio não alteram essas datas. O registro manual de contato realizado nas atividades de uma oportunidade também atualiza lastContactAt. Não há preenchimento retroativo a partir de updatedAt. Leads sem contato confirmado mostram um traço em Último contato.

A autoria vem da sessão e do cadastro, nunca do corpo da requisição. A equipe fica limitada ao tenant e aos leads autorizados. Só o autor da tentativa ou a gestão pode registrar o resultado. Contatos e oportunidades exigem suas próprias permissões, e o histórico é limitado aos leads visíveis. Dados e auditoria são gravados na mesma transação serializada por tenant.

## Contratos HTTP

- GET e POST /api/crm/leads/{id}/interactions: listar e iniciar tentativas.
- GET /api/crm/contacts/{id}/interactions: histórico do contato autorizado.
- GET /api/crm/opportunities/{id}/interactions: histórico da oportunidade autorizada.
- PATCH /api/crm/interactions/{id}: confirmar o resultado de uma tentativa pendente.

POST exige canal e requestId UUID, único por tenant. PATCH aceita somente resultado e observação; autoria e datas são definidas no servidor. Os schemas geram OpenAPI e types do frontend.

A migration 20261123090000_crm_interactions adiciona as colunas lastContactAt e contactId em Lead, com chave composta por tenant, e cria a tabela crm_interactions com seus enums. Somente vínculos já explícitos por oportunidade são preenchidos automaticamente; registros antigos não são reclassificados. Uma versão anterior não exibe os eventos gravados pela versão nova. Deve ser aplicada ao banco de cada ambiente somente após revisão e autorização. A implementação não aplica migrations ao banco de desenvolvimento automaticamente.

## Vínculo direto e atalhos em Contatos

Adicionar a Leads abre o cadastro com os dados do contato selecionado. O servidor valida o acesso ao contato e preserva seu identificador no novo lead. Ao movimentar um lead sem vínculo, a interface oferece selecionar um contato existente ou criar um cadastro explicitamente. O cadastro exige os campos obrigatórios e recusa e-mail duplicado. Não se deduz identidade por nome, telefone ou e-mail, nem se cria contato ao mover uma etapa sem confirmação da pessoa usuária.

O contato pode ter vários leads para negociações distintas. Um lead tem um contato vinculado e não pode ser trocado silenciosamente para outro cadastro. A seleção de um contato existente usa seus dados cadastrais como referência. Alterações posteriores de nome, e-mail e telefone no contato acompanham os leads vinculados, sem alterar valores, etapas ou dados de contratos já emitidos.

Na tabela e nos cards de Contatos, o telefone oferece Ligar ou WhatsApp e o e-mail usa um link mailto. A tentativa pode pertencer diretamente ao contato, mesmo sem lead. O resultado continua exigindo confirmação explícita. O histórico dos leads vinculados também consulta as tentativas diretas desse contato, identificadas sem atribuição artificial a uma negociação. Confirmar uma tentativa direta atualiza a data do contato; a data de atendimento de cada lead permanece atribuída às conversas iniciadas naquele lead.

Criação de lead a partir de contato, vinculação e mudanças reais de etapa aparecem como eventos de sistema, com autoria e data. Esses eventos não possuem canal ou resultado de conversa e não atualizam datas de contato confirmado. Vincular um lead disponibiliza seu histórico existente no contato, sem duplicar registros; a data confirmada anterior do lead também é preservada na data do contato quando for mais recente.

POST /api/crm/leads/{id}/contact recebe exclusivamente contactId ou contact. POST /api/crm/contacts/{id}/interactions inicia a tentativa direta. O endpoint de resultado continua PATCH /api/crm/interactions/{id}. Autoria e tenant vêm da sessão. O corretor só acessa contatos por autoria, oportunidade autorizada ou lead explicitamente atribuído a ele, e só conclui suas tentativas; a gestão pode concluir tentativas da equipe.
