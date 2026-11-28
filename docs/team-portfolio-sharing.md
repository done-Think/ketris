# Compartilhamento de carteira

A gestão pode compartilhar os registros atuais de uma carteira com um ou mais corretores ativos e aprovados do mesmo tenant. Compartilhamento preserva os identificadores, o responsável principal, o histórico e os demais participantes. Transferência continua sendo a ação que substitui o responsável, inclusive ao desativar um membro da equipe.

## Categorias e isolamento

- **Imóveis:** concede acesso ao cadastro existente, preservando o responsável. Não libera automaticamente leads ou oportunidades.
- **Leads:** concede acesso de consulta e edição aos mesmos leads, incluindo a proposta já vinculada. Ao converter um lead compartilhado, a oportunidade única herda os colaboradores. O responsável original permanece e a auditoria identifica quem executou a conversão.
- **Oportunidades em aberto:** compartilha as oportunidades não arquivadas, não rejeitadas e sem contrato, preservando status, dados e histórico. Não cria negociações em rascunho nem reinicia o atendimento.
- **Eventos futuros:** vincula os corretores como participantes somente de leitura dos mesmos eventos confirmados, pendentes ou a reagendar. Mantém responsável e horário, sem duplicar visitas ou enviar convites.

Somente as categorias selecionadas recebem acesso. Novos leads ou oportunidades criados depois continuam individuais. A oportunidade resultante da conversão de um lead compartilhado representa o mesmo atendimento e por isso herda seu acesso. Para converter um lead, o corretor também precisa ter acesso ao imóvel: marque Imóveis quando necessário.

Os participantes trabalham sobre o mesmo registro. Alterar status ou observações afeta todos os participantes. Arquivar ou excluir uma oportunidade também afeta o registro compartilhado, respeitando as proteções existentes para contratos. Compartilhar não altera regras de comissão, responsabilidade ou permissões de contratos. Uma tela já aberta recebe os dados na próxima consulta; este recurso não acrescenta atualização em tempo real.

## Remoção e transferência

Remover acesso retira os vínculos dos corretores selecionados, preservando os registros e o responsável principal. A remoção de leads inclui suas oportunidades vinculadas; a categoria Oportunidades também permite retirar acessos de oportunidades arquivadas ou concluídas da origem. O acesso de outros participantes permanece.

Transferir altera a responsabilidade dos registros próprios e repassa os acessos recebidos, removendo os vínculos do membro de origem sem alterar a responsabilidade de registros pertencentes a outro corretor. A desativação também remove os vínculos de CRM recebidos pelo membro. Os demais colaboradores continuam vinculados.

## Contrato e persistência

`POST /api/team/members/{id}/share` recebe `destinationIds` (de 1 a 50 corretores), `properties`, `leads`, `opportunities`, `futureEvents` e `revoke` (falso por padrão). Retorna `shared` com as quantidades de vínculos criados ou removidos. As contagens representam acessos por destinatário. Repetir a operação não duplica registros ou vínculos.

A operação inteira, incluindo destinatários e auditorias, é transacional. O CRM e o compartilhamento utilizam o mesmo bloqueio transacional por tenant para coordenar conversões e mudanças de acesso. Chaves estrangeiras compostas impedem vincular registros e usuários de tenants diferentes. Os schemas alimentam OpenAPI e os types gerados.

A migration `20261122090000_crm_broker_access` cria os vínculos de acesso de leads e oportunidades e seus índices, sem alterar os dados existentes. Ela precisa ser aplicada antes de executar este código no banco de desenvolvimento ou em outro ambiente. Cópias criadas pela implementação anterior permanecem independentes; não há unificação automática por nome, telefone ou email.
